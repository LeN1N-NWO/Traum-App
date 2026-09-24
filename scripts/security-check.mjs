#!/usr/bin/env bun
/* Sicherheitscheck, mechanischer Teil — `bun scripts/security-check.mjs`
 *
 * Prüft, was sich ohne Urteil prüfen lässt: Geheimnisse in Dateien und im
 * Git-Verlauf, .env-Dateien, öffentliche Build-Variablen, Source Maps,
 * CORS, Anmeldepflicht der Routen, RLS, Abhängigkeiten. Was Urteil braucht
 * (IDOR, SSRF, Prompt-Injection …), prüft der Agent
 * `.claude/agents/security-expert.md`; `/security-check` startet beides.
 *
 * Ändert NICHTS. Liest, zählt, meldet.
 *
 * Drei Regeln, weil eine Prüfung, die nicht fehlschlagen kann, nichts beweist:
 *   1. Vor dem Lauf spielt jeder Detektor seine Probe ab (securityScan.js,
 *      selfTest). Schlägt einer fehl, bricht der Lauf ab — sonst hieße
 *      „nichts gefunden“ womöglich „nicht gesucht“.
 *   2. Jedes ✅ nennt, wie viel geprüft wurde. Null Dateien geprüft ist ⏭,
 *      nicht ✅.
 *   3. Kein Wert eines Geheimnisses erscheint in der Ausgabe — nur Muster,
 *      Datei, Zeile, Commit. Aus .env werden nur Namen und Längen gelesen.
 *
 * Schalter: --json (maschinenlesbar), --no-history (Verlauf überspringen),
 *           --offline (keine Abhängigkeitsprüfung über das Netz)
 * Ausgang:  0 = kein ❌ · 1 = mindestens ein ❌ · 2 = Selbsttest rot
 */

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, statSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import {
  selfTest, scanSecrets, SECRET_PATTERNS, trackedEnvFiles, envShape,
  secretLookingPublicVars, rlsGaps, publicGrants, routeInventory, corsOrigins,
  chargeArmed, errorLeaks, sensitiveLogs, headersSet, SECURITY_HEADERS,
  bindsAllInterfaces, auditCounts, localOnlyPaths,
} from "../src/lib/securityScan.js";
import { classOf, LIMITS } from "../src/lib/gatekeeper.js";

const args = new Set(process.argv.slice(2));
const ROOT = resolve(import.meta.dir, "..");

function sh(cmd, argv, opts = {}) {
  const r = spawnSync(cmd, argv, { cwd: opts.cwd || ROOT, encoding: "utf8", maxBuffer: 1024 * 1024 * 1024, env: { ...process.env, LC_ALL: "en_US.UTF-8" } });
  return { ok: r.status === 0, out: r.stdout || "", err: r.stderr || "", status: r.status };
}

const results = [];
/** status: ok | warn | fail | skip | info */
function report(ids, title, status, detail, evidence = []) {
  results.push({ ids, title, status, detail, evidence });
}
const LABEL = { ok: "✅", warn: "⚠️ ", fail: "❌", skip: "⏭ ", info: "ℹ️ " };
const label = (p) => SECRET_PATTERNS.find((x) => x.id === p)?.label || p;

/* ── 0. Selbsttest ─────────────────────────────────────────────────────── */
const broken = selfTest();
if (broken.length) {
  console.error("❌ SELBSTTEST ROT — der Lauf wäre wertlos, Abbruch:");
  for (const b of broken) console.error("   - " + b);
  process.exit(2);
}

/* ── 1. Geheimnisse in versionierten Dateien (Fragen 1, 3, 14) ─────────── */
const tracked = sh("git", ["ls-files", "-z"]).out.split("\0").filter(Boolean);
{
  let scanned = 0, binary = 0;
  const big = [];
  const hits = [];
  for (const f of tracked) {
    const abs = join(ROOT, f);
    let st;
    try { st = statSync(abs); } catch { continue; }
    if (!st.isFile()) continue;
    if (st.size > 3_000_000) { big.push(f); continue; }
    const buf = readFileSync(abs);
    if (buf.includes(0)) { binary++; continue; }
    scanned++;
    for (const h of scanSecrets(buf.toString("utf8"))) {
      const note = h.pattern === "jwt" ? ` (Rolle: ${h.role ?? "unbekannt"})` : "";
      hits.push(`${f}:${h.line} — ${label(h.pattern)}${note}`);
    }
  }
  // Übersprungenes wird genannt, nicht verschwiegen — sonst hieße „kein Fund“ auch „nicht gelesen“.
  const skipped = `${binary} binär übersprungen${big.length ? `, ${big.length} über 3 MB NICHT gelesen: ${big.slice(0, 3).join(", ")}` : ""}`;
  if (!scanned) report([1, 3], "Geheimnisse in versionierten Dateien", "skip", "keine Datei gelesen — Lauf kaputt?");
  else if (hits.length) report([1, 3, 14], "Geheimnisse in versionierten Dateien", "fail", `${hits.length} Fund(e) in ${scanned} Dateien (${skipped})`, hits);
  else report([1, 3, 14], "Geheimnisse in versionierten Dateien", big.length ? "warn" : "ok", `${scanned} Textdateien geprüft, kein Fund (${skipped})`);
}

/* ── 2. Geheimnisse im Git-Verlauf (Frage 13) ──────────────────────────── */
const visibility = sh("gh", ["repo", "view", "--json", "visibility", "-q", ".visibility"]).out.trim() || "unbekannt";
if (args.has("--no-history")) {
  report([13], "Geheimnisse im Git-Verlauf", "skip", "mit --no-history übersprungen");
} else {
  const log = sh("git", ["log", "--all", "-p", "--no-color", "--no-ext-diff", "-U0", "--format=@@COMMIT %H"]);
  if (!log.ok) {
    report([13], "Geheimnisse im Git-Verlauf", "skip", "git log fehlgeschlagen: " + log.err.split("\n")[0]);
  } else {
    /* Hinzugefügte Zeilen je (Commit, Datei) zu einem Text sammeln und den
       dann prüfen — ein PEM-Rumpf steht auf den Zeilen NACH dem Kopf. */
    let commits = 0, added = 0, commit = "", file = "", buf = [];
    const hits = new Map();
    const flush = () => {
      /* Keine Ausnahme für securityScan*.js: Deren Proben sind zusammengesetzt
         und finden sich selbst nicht (securityScan.test.js prüft das). Eine
         Ausnahme wäre ein blinder Fleck für echte Schlüssel in genau diesen Dateien. */
      if (buf.length) {
        for (const h of scanSecrets(buf.join("\n"))) {
          const key = `${file} — ${label(h.pattern)}`;
          if (!hits.has(key)) hits.set(key, new Set());
          hits.get(key).add(commit);
        }
      }
      buf = [];
    };
    for (const line of log.out.split("\n")) {
      if (line.startsWith("@@COMMIT ")) { flush(); commit = line.slice(9, 17); commits++; continue; }
      if (line.startsWith("+++ ")) { flush(); file = line.slice(6); continue; }
      if (!line.startsWith("+")) continue;
      added++;
      buf.push(line.slice(1));
    }
    flush();
    const ev = [...hits].map(([k, cs]) => `${k} (Commit ${[...cs].slice(0, 3).join(", ")}${cs.size > 3 ? " …" : ""})`);
    if (!commits) report([13], "Geheimnisse im Git-Verlauf", "skip", "kein Commit gelesen — Lauf kaputt?");
    else if (ev.length) report([13], "Geheimnisse im Git-Verlauf", "fail",
      `${ev.length} Fund(e) in ${commits} Commits · Repo ist ${visibility} — ein Fund im Verlauf gilt als veröffentlicht: Schlüssel widerrufen, nicht nur löschen`, ev);
    else report([13], "Geheimnisse im Git-Verlauf", "ok", `${commits} Commits, ${added} hinzugefügte Zeilen geprüft, kein Fund (Repo ist ${visibility})`);
  }
}

/* ── 3. .env-Dateien (Fragen 1, 2, 41) ─────────────────────────────────── */
{
  const envTracked = trackedEnvFiles(tracked);
  if (envTracked.length) report([2], "Geheimnis-Dateien im Repository", "fail", `${envTracked.length} versioniert`, envTracked);
  else report([2], "Geheimnis-Dateien im Repository", "ok", `${tracked.length} versionierte Dateien, keine .env/.pem/.p8/.key`);

  // Der Server läuft im Hauptcheckout; ein Worktree hat meist keine eigene .env.
  const common = resolve(ROOT, sh("git", ["rev-parse", "--git-common-dir"]).out.trim());
  const candidates = [...new Set([join(ROOT, ".env"), join(dirname(common), ".env")])].filter(existsSync);
  if (!candidates.length) {
    report([1, 41], ".env des Servers", "skip", "keine .env gefunden (Worktree ohne Server?)");
  }
  for (const envPath of candidates) {
    const where = envPath.replace(process.env.HOME, "~");
    const mode = statSync(envPath).mode & 0o777;
    const shape = envShape(readFileSync(envPath, "utf8"));
    const names = Object.keys(shape);
    const has = (n) => (shape[n] || 0) > 0;
    const ev = [];
    let status = "ok";
    if (mode & 0o077) { status = "fail"; ev.push(`Rechte ${mode.toString(8)} — andere Benutzer können mitlesen, soll 600`); }
    else ev.push(`Rechte ${mode.toString(8)}`);
    const admin = names.filter((n) => /SERVICE_ROLE|SUPABASE_.*SECRET|SB_SECRET/.test(n) && has(n));
    if (admin.length) { status = "fail"; ev.push(`Admin-Schlüssel im laufenden Dienst: ${admin.join(", ")} (Least Privilege)`); }
    if (has("DATABASE_URL")) {
      // Nur den Rollennamen vergleichen; nichts davon wird ausgegeben.
      const raw = readFileSync(envPath, "utf8").split("\n").find((l) => /^\s*(export\s+)?DATABASE_URL\s*=/.test(l)) || "";
      const user = /:\/\/([^:@/]+)/.exec(raw)?.[1]?.split(".")[0];
      if (user === "dreamrushes_server") ev.push("DATABASE_URL meldet sich als dreamrushes_server an");
      else { status = "fail"; ev.push("DATABASE_URL meldet sich NICHT als dreamrushes_server an (Admin-Rolle?)"); }
    }
    ev.push(`API_TOKEN ${has("API_TOKEN") ? "gesetzt" : "NICHT gesetzt (Zugangsschutz der Geld-Routen aus, S1)"}`);
    if (!has("API_TOKEN") && status === "ok") status = "warn";
    report([1, 2, 4, 41], `.env des Servers (${where})`, status, `${names.length} Variablen, nur Namen gelesen`, ev);
  }
}

/* ── 4. Öffentliche Build-Variablen und Bundles (Fragen 14, 36) ────────── */
{
  const publicNames = [];
  for (const f of tracked) {
    if (!/\.(js|jsx|ts|tsx|mjs|json)$/.test(f)) continue;
    // Nur was ins Bundle kommt: Tests und Skripte nennen solche Namen als
    // Beispiel (securityScan.test.js) und werden nie ausgeliefert.
    if (/\.test\.[jt]sx?$/.test(f) || f.startsWith("scripts/")) continue;
    const s = readFileSync(join(ROOT, f), "utf8");
    for (const m of s.matchAll(/\b(EXPO_PUBLIC_[A-Z0-9_]+|VITE_[A-Z0-9_]+)/g)) publicNames.push(m[1]);
  }
  const bad = secretLookingPublicVars(publicNames);
  const uniq = [...new Set(publicNames)];
  if (bad.length) report([14], "Öffentliche Build-Variablen", "fail", "landen im App-Bundle und heißen nach Geheimnis", bad);
  else report([14], "Öffentliche Build-Variablen", "ok", `${uniq.length} öffentliche Variable(n), keine heißt nach Geheimnis: ${uniq.join(", ") || "—"}`);

  const walk = (dir) => existsSync(dir) ? readdirSync(dir, { withFileTypes: true, recursive: true })
    .filter((d) => d.isFile()).map((d) => join(d.parentPath ?? d.path, d.name)) : [];
  const dist = walk(join(ROOT, "dist"));
  if (!dist.length) {
    report([14, 36], "Web-Build (dist/)", "skip", "kein dist/ — erst `bun run build`, dann erneut prüfen");
  } else {
    const maps = dist.filter((f) => f.endsWith(".map"));
    const js = dist.filter((f) => /\.(js|html|css)$/.test(f));
    const hits = [];
    for (const f of js) for (const h of scanSecrets(readFileSync(f, "utf8"))) hits.push(`${f.slice(ROOT.length + 1)}:${h.line} — ${label(h.pattern)}`);
    const status = hits.length ? "fail" : maps.length ? "warn" : "ok";
    report([14, 36], "Web-Build (dist/)", status, `${js.length} Dateien geprüft · ${hits.length} Geheimnis-Fund(e) · ${maps.length} Source Map(s)`,
      [...hits, ...maps.slice(0, 5).map((m) => "Source Map: " + m.slice(ROOT.length + 1))]);
  }
  report([14, 36], "iOS-Bundle (Expo)", "info",
    "nicht mechanisch geprüft — liegt in DerivedData. Der Agent prüft stattdessen, dass mobile/src nur EXPO_PUBLIC_API_BASE liest");
}

/* ── 5. Transport (Frage 48) ───────────────────────────────────────────── */
{
  const appJson = join(ROOT, "mobile/app.json");
  if (!existsSync(appJson)) report([48], "iOS-Transportsicherheit (ATS)", "skip", "mobile/app.json fehlt");
  else {
    const ats = JSON.parse(readFileSync(appJson, "utf8"))?.expo?.ios?.infoPlist?.NSAppTransportSecurity || {};
    const ev = Object.entries(ats).map(([k, v]) => `${k}: ${JSON.stringify(v)}`);
    const status = ats.NSAllowsArbitraryLoads ? "fail" : ats.NSAllowsLocalNetworking || ats.NSExceptionDomains ? "warn" : "ok";
    report([48], "iOS-Transportsicherheit (ATS)", status,
      status === "ok" ? "keine Ausnahme — die App spricht nur HTTPS" : "Ausnahmen erlauben unverschlüsseltes HTTP (S6) — vor dem Store raus", ev);
  }
}

/* ── 6. server.js (Fragen 4, 5, 9, 12, 27, 28, 29, 32, 35, 46) ─────────── */
const serverSrc = existsSync(join(ROOT, "server.js")) ? readFileSync(join(ROOT, "server.js"), "utf8") : "";
if (!serverSrc) report([4], "server.js", "skip", "server.js fehlt");
else {
  const routes = routeInventory(serverSrc);
  const open = routes.filter((r) => !r.authed);
  /* Der Gatekeeper stuft alles Unbekannte als „generate“ ein — richtig für
     die Bremse, zu grob für diesen Bericht. Die Ausnahmen stehen hier mit
     Grund; alles andere gilt weiter als kostenpflichtig, bis ein Mensch es
     anders einträgt. */
  const FREE = { "/api/prices": "Preistabelle" };
  const DEV_DATA = {
    "/api/cast-backup": "Figuren MIT Fotos realer Menschen",
    "/api/journal-backup": "Traumtexte",
  };
  const localOnly = new Set(localOnlyPaths(serverSrc));
  const devRoutes = routes.filter((r) => DEV_DATA[r.path]);
  /* Die Lokal-Sperre hält nur, solange Vite nicht im WLAN lauscht: Sein
     Proxy reicht fremde Anfragen als localhost weiter (src/lib/localOnly.js). */
  const readIf = (f) => (existsSync(join(ROOT, f)) ? readFileSync(join(ROOT, f), "utf8") : "");
  const viteOnLan = /^\s*host\s*:/m.test(readIf("vite.config.js"))
    || /(?:^|[\s"'])--host\b/.test(readIf("package.json") + readIf("scripts/dev.mjs"));
  const devOpen = devRoutes.filter((r) => !r.authed && (viteOnLan || !localOnly.has(r.path)));
  const paidOpen = open.filter((r) => !FREE[r.path] && !DEV_DATA[r.path] && !localOnly.has(r.path)
    && (["generate", "text"].includes(classOf(r.path)) || r.path === "/api/voice"));
  report([4, 5, 9, 34], "Anmeldepflicht der kostenpflichtigen Routen", paidOpen.length ? "fail" : "ok",
    `${routes.length} Routen, ${routes.length - open.length} hinter verifyAccessToken, ${paidOpen.length} kostenpflichtige OHNE Anmeldung`,
    [
      ...paidOpen.map((r) => `€ ${r.method} ${r.path} (server.js:${r.line}, Klasse ${classOf(r.path) || "WebSocket"})`),
      ...open.filter((r) => !paidOpen.includes(r) && !DEV_DATA[r.path])
        .map((r) => `   ${r.method} ${r.path} (server.js:${r.line}, ${FREE[r.path] || "Klasse " + (classOf(r.path) ?? "ungebremst")})`),
    ]);
  report([6, 10, 33], "Entwicklungs-Routen mit Personendaten", devOpen.length ? "fail" : "ok",
    devOpen.length
      ? viteOnLan
        ? `${devOpen.length} Route(n): Vite lauscht im WLAN (host/--host) — sein Proxy hebelt die Lokal-Sperre aus`
        : `${devOpen.length} Route(n) ohne Anmeldung — im Client nur hinter import.meta.env.DEV, der Server selbst sperrt sie nicht`
      : devRoutes.length
        ? `${devRoutes.length} Route(n), alle nur von diesem Rechner erreichbar (isLocalRequest, src/lib/localOnly.js)`
        : "keine Entwicklungs-Routen mehr im Server",
    (devOpen.length ? devOpen : devRoutes).map((r) => `${r.method} ${r.path} (server.js:${r.line}) — ${DEV_DATA[r.path]}`));

  const armed = chargeArmed(serverSrc);
  report([15, 32], "Abbuchung der Credits auf dem Server", armed === true ? "ok" : armed === false ? "fail" : "warn",
    armed === true ? "settleCharge() ruft server_spend() auf"
      : armed === false ? "settleCharge() bucht nicht ab (charged: false) — das Guthaben prüft nur der Client (S7)"
        : "settleCharge() nicht gefunden — umbenannt? Agent muss nachsehen");

  const cors = corsOrigins(serverSrc);
  const corsBad = cors.wildcard || !cors.list;
  const corsNull = cors.list?.includes("null");
  report([27], "CORS", corsBad ? "fail" : corsNull ? "warn" : "ok",
    cors.wildcard ? "Allow-Origin: * gefunden" : !cors.list ? "Positivliste nicht gefunden" : `Positivliste: ${cors.list.join(", ")} + Loopback`,
    corsNull ? ['"null" erlaubt JEDE file://-Seite und jedes sandboxed iframe — vor öffentlichem Betrieb API_TOKEN oder raus'] : []);

  const leaks = errorLeaks(serverSrc);
  report([12], "Fehlermeldungen an den Client", leaks.length ? "warn" : "ok",
    leaks.length ? `${leaks.length} Antwort(en) reichen e.message/Stack durch — Agent prüft, ob Internes sichtbar wird` : "keine Antwort reicht e.message/e.stack durch",
    leaks.map((l) => `server.js:${l}`));

  const logs = sensitiveLogs(serverSrc);
  report([35], "Logs mit Token/E-Mail/Passwort", logs.length ? "warn" : "ok",
    logs.length ? `${logs.length} Log-Zeile(n) nennen sensible Begriffe — Agent prüft, ob Werte geloggt werden` : "keine Log-Zeile nennt Token, Passwort oder E-Mail",
    logs.map((l) => `server.js:${l}`));

  const hs = headersSet(serverSrc);
  report([46], "Sicherheits-Kopfzeilen", hs.length === SECURITY_HEADERS.length ? "ok" : "warn",
    `${hs.length}/${SECURITY_HEADERS.length} gesetzt${hs.length ? ": " + hs.join(", ") : ""} — Pflicht, sobald die Web-Oberfläche öffentlich ausgeliefert wird; kann auch der TLS-Proxy setzen`,
    SECURITY_HEADERS.filter((h) => !hs.includes(h)).map((h) => "fehlt: " + h));

  const allIfaces = bindsAllInterfaces(serverSrc);
  report([29], "Erreichbarkeit des Servers", allIfaces ? "warn" : "ok",
    allIfaces ? "Bun.serve ohne hostname → lauscht auf ALLEN Schnittstellen: jedes Gerät im selben WLAN erreicht die Geld-Routen" : "an eine Adresse gebunden");

  const limits = Object.entries(LIMITS).map(([k, l]) => `${k}: ${l.max}/${l.windowMs / 1000}s`);
  report([28], "Mengenbremse", LIMITS.auth ? "info" : "warn",
    `${limits.join(" · ")} — je IP und im Arbeitsspeicher (S5): hinter einem Proxy teilen sich alle einen Eimer, Neustart setzt zurück`);
}

/* ── 7. Supabase (Fragen 7, 8, 41, 49) ─────────────────────────────────── */
{
  const dir = join(ROOT, "supabase/migrations");
  const files = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith(".sql")) : [];
  if (!files.length) report([7], "Row Level Security", "skip", "keine Migrationen gefunden");
  else {
    const sql = files.map((f) => readFileSync(join(dir, f), "utf8")).join("\n");
    const { tables, gaps } = rlsGaps(sql);
    report([7, 8, 49], "Row Level Security", gaps.length ? "fail" : tables ? "ok" : "skip",
      `${tables} Tabelle(n) in ${files.length} Migration(en), ${gaps.length} ohne RLS`, gaps);
    /* Kein ✅ möglich: Supabase gibt anon/authenticated über Default
       Privileges Rechte auf jede neue Tabelle in public, ohne dass eine
       Migration es sagt. „Keine Grants in den Migrationen“ bewiese also
       nichts — der Schutz ist RLS (Prüfung oben). */
    const grants = publicGrants(sql);
    report([7, 41], "Tabellenrechte an anon/authenticated", grants.length ? "warn" : "info",
      grants.length ? `${grants.length} ausdrückliche(s) Recht(e) — jedes davon muss eine RLS-Richtlinie haben`
        : "keine ausdrücklichen Grants — Supabase vergibt trotzdem Rechte per Default Privileges; Schutz ist allein RLS",
      grants);
    report([7, 8], "Stimmen die Migrationen mit der Datenbank überein?", "info",
      "nicht mechanisch prüfbar ohne Admin-Zugang (bewusst nicht in der .env). Hanni prüft im SQL-Editor: supabase/tests/credits_invariants.sql");
  }
}

/* ── 8. Personenbezogene Daten im öffentlichen Repo (Fragen 13, 48) ────── */
{
  const dreams = tracked.filter((f) => f.startsWith("data/traeume/"));
  const media = tracked.filter((f) => /^media\//.test(f));
  // Unbekannte Sichtbarkeit (gh nicht angemeldet) ist kein „privat“ — sonst wäre das ✅ geraten.
  const status = (dreams.length || media.length) && visibility !== "PRIVATE" ? "warn" : "ok";
  report([13, 48], "Traumtexte/Medien im Repository", status,
    `${dreams.length} Traum-Datei(en), ${media.length} Mediendatei(en) versioniert · Repo ist ${visibility}`,
    dreams.length && visibility !== "PRIVATE" ? ["Antons Entscheid 22.08.: Testdaten, sichtbar für alle — vor dem Launch Ordner UND Ladepfad in AppState.jsx entfernen (steht in .gitignore)"] : []);
}

/* ── 9. Abhängigkeiten (Fragen 37, 38) ─────────────────────────────────── */
for (const [name, cwd] of [["Server/Web", ROOT], ["iOS-App", join(ROOT, "mobile")]]) {
  if (args.has("--offline")) { report([37], `Abhängigkeiten ${name}`, "skip", "mit --offline übersprungen"); continue; }
  if (!existsSync(join(cwd, "bun.lock"))) { report([37], `Abhängigkeiten ${name}`, "skip", "kein bun.lock"); continue; }
  const r = sh("bun", ["audit", "--json"], { cwd });
  let parsed = null;
  try { parsed = JSON.parse(r.out); } catch { /* Netz weg oder anderes Format */ }
  if (!parsed) { report([37], `Abhängigkeiten ${name}`, "skip", "bun audit ohne lesbare Antwort (offline?)"); continue; }
  const c = auditCounts(parsed);
  const pkgs = Object.keys(parsed);
  report([37, 38], `Abhängigkeiten ${name}`, c.critical ? "fail" : c.high || c.moderate ? "warn" : "ok",
    `${c.critical} kritisch · ${c.high} hoch · ${c.moderate} mittel · ${c.low} niedrig — betroffen: ${pkgs.join(", ") || "—"}`,
    c.high || c.critical ? ["Agent prüft: Laufzeit oder nur Entwicklung (vite/esbuild laufen nicht im Store-Build)? Dann `bun audit fix` in eigener Sitzung"] : []);
}

/* ── Ausgabe ──────────────────────────────────────────────────────────── */
const order = { fail: 0, warn: 1, skip: 2, info: 3, ok: 4 };
results.sort((a, b) => order[a.status] - order[b.status]);
const count = (s) => results.filter((r) => r.status === s).length;

if (args.has("--json")) {
  console.log(JSON.stringify({ root: ROOT, visibility, results }, null, 2));
} else {
  console.log(`Sicherheitscheck (mechanisch) — ${ROOT}`);
  console.log(`Selbsttest bestanden: ${SECRET_PATTERNS.length} Suchmuster und alle Detektoren finden ihre Probe\n`);
  for (const r of results) {
    console.log(`${LABEL[r.status]} [${r.ids.join(",")}] ${r.title}: ${r.detail}`);
    for (const e of r.evidence.slice(0, 25)) console.log(`      · ${e}`);
    if (r.evidence.length > 25) console.log(`      · … und ${r.evidence.length - 25} weitere`);
  }
  console.log(`\n${count("fail")} ❌ · ${count("warn")} ⚠️ · ${count("skip")} ⏭ · ${count("ok")} ✅ · ${count("info")} ℹ️  (${results.length} Prüfungen)`);
  console.log("Zahlen in [ ] = Nummer auf der Liste in .claude/agents/security-expert.md");
}
process.exit(count("fail") ? 1 : 0);
