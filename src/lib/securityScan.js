/* Die mechanischen Sicherheitsprüfungen — reine Funktionen, ohne Platte,
 * ohne Netz, ohne Git. Der Läufer (scripts/security-check.mjs) holt die
 * Texte und fragt hier nach; der Test daneben prüft jeden Detektor gegen
 * einen Fall, den er finden MUSS, und einen, den er nicht finden darf.
 *
 * Grundsatz, der jede Funktion hier formt: Eine Prüfung, die nicht
 * fehlschlagen kann, beweist nichts. Deshalb
 *   - meldet jede Suche auch, WIE VIEL sie durchsucht hat (null Treffer in
 *     null Dateien ist kein grünes Ergebnis, sondern ein kaputter Lauf),
 *   - bringt jedes Suchmuster eine Probe mit (SELF_TEST), die der Läufer
 *     vor dem echten Lauf abspielt,
 *   - gibt keine Funktion einen gefundenen Wert zurück — nur Muster, Datei
 *     und Zeile. Ein Sicherheitsbericht, der das Geheimnis zitiert, ist
 *     selbst das Leck.
 *
 * Die Proben sind aus Teilen zusammengesetzt, damit weder GitHubs
 * Geheimnis-Scanner noch unser eigener Verlaufs-Scan diese Datei für einen
 * echten Fund hält.
 */

/* ── Geheimnisse ─────────────────────────────────────────────────────────── */

const HEX = (n) => "a1b2c3d4e5f6".repeat(Math.ceil(n / 12)).slice(0, n);
const ALNUM = (n) => "Qw7eR9tY2uI4oP6a".repeat(Math.ceil(n / 16)).slice(0, n);

/** Was nach echtem Wert aussieht, aber ein Platzhalter aus einer Anleitung ist. */
const PLACEHOLDER = /YOUR|DEIN|XXXX|xxxx|example|placeholder|changeme|<[^>]*>|\$\{|process\.env|\.\.\.|…|PASSWOR[DT]|passwor[dt]|KEY_ID|KEY_SECRET|\*\*\*/;

export const SECRET_PATTERNS = [
  {
    id: "fal-key",
    label: "fal.ai-Schlüssel (id:secret)",
    re: /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}:[0-9a-f]{32}\b/,
    probe: `${HEX(8)}-${HEX(4)}-${HEX(4)}-${HEX(4)}-${HEX(12)}:${HEX(32)}`,
  },
  {
    id: "sk-key",
    label: "sk-Schlüssel (DeepSeek/OpenAI-Form)",
    re: /\bsk-[A-Za-z0-9]{24,}\b/,
    probe: "s" + "k-" + ALNUM(32),
  },
  {
    id: "google-key",
    label: "Google-API-Schlüssel (Gemini)",
    re: /\bAIza[0-9A-Za-z_-]{35}\b/,
    probe: "AI" + "za" + ALNUM(35),
  },
  {
    id: "private-key",
    label: "Privater Schlüssel (PEM, z. B. Apple .p8)",
    re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
    // Erst mit Rumpf ein Fund: Tests und Anleitungen zeigen den Kopf mit
    // „abc" oder „…" dazwischen, ein echter .p8 hat 200 Zeichen Base64.
    probe: "-----BEGIN " + "PRIVATE KEY-----\n" + ALNUM(64) + "\n" + ALNUM(64),
    needsBody: true,
  },
  {
    id: "db-url",
    label: "Datenbank-Adresse mit Passwort",
    re: /postgres(?:ql)?:\/\/[^:\s/@]+:([^@\s]{6,})@/,
    probe: "postgres" + "ql://dreamrushes_server:" + ALNUM(20) + "@db.example.co:5432/postgres",
    // Anleitungen zeigen die Form mit Platzhalter — die ist kein Fund.
    valueGroup: 1,
  },
  {
    id: "supabase-secret",
    label: "Supabase-Geheimschlüssel (sb_secret_)",
    re: /\bsb_secret_[A-Za-z0-9_-]{20,}/,
    probe: "sb_" + "secret_" + ALNUM(30),
  },
  {
    id: "jwt",
    label: "JWT (Supabase-Schlüssel oder Sitzung)",
    re: /\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/,
    probe: "ey" + "J" + ALNUM(20) + ".ey" + "J" + ALNUM(30) + "." + ALNUM(20),
  },
  {
    id: "env-assign",
    label: "Wert für eine bekannte Geheimnis-Variable",
    re: /\b(FAL_KEY|DEEPSEEK_KEY|GEMINI_KEY|API_TOKEN|DATABASE_URL|SUPABASE_[A-Z_]*(?:KEY|SECRET)|APPLE_SIGNIN_KEY)\s*[=:]\s*["']?([^\s"'`,;)]{12,})/,
    probe: "GEMINI" + "_KEY=" + ALNUM(24),
    valueGroup: 2,
  },
];

/** Platzhalter, die jedes Muster in Ruhe lassen muss (Anleitungen, Beispiele). */
export const PLACEHOLDER_PROBES = [
  'export FAL_KEY="YOUR_KEY_ID:YOUR_KEY_SECRET"',
  "DATABASE_URL=postgresql://dreamrushes_server:PASSWORT@db.<ref>.supabase.co:5432/postgres",
  "const key = process.env.GEMINI_KEY;",
  "GEMINI_KEY=",
  "# API_TOKEN=ein-langes-zufaelliges-geheimnis",
  'APPLE_SIGNIN_KEY: "-----BEGIN PRIVATE KEY-----\\nabc\\n-----END PRIVATE KEY-----"',
];

/** Beschreibende Wörter mit Bindestrich („ein-langes-geheimnis") sind eine
 *  Anleitung, kein Zufallswert — echte Token haben Ziffern oder Groß-/Klein-Mix. */
const WORDY = /^[a-zäöüß]+(?:[-_][a-zäöüß]+)+$/;

/** Folgt dem PEM-Kopf ein echter Base64-Rumpf (im selben Text, auch über \n)? */
function hasPemBody(lines, i, index) {
  const rest = [lines[i].slice(index), ...lines.slice(i + 1, i + 5)].join("\n").replace(/\\n/g, "\n");
  return /-----\s*\n?\s*[A-Za-z0-9+/=]{40,}/.test(rest.replace(/-----BEGIN [A-Z ]*PRIVATE KEY/, ""));
}

/**
 * Durchsucht einen Text nach Geheimnissen. Gibt NIE den Wert zurück.
 * @returns {{ pattern: string, line: number }[]}
 */
export function scanSecrets(text) {
  const hits = [];
  const lines = String(text).split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.length > 5000) continue; // eingebettete Binärdaten, Minifikate
    for (const p of SECRET_PATTERNS) {
      const m = p.re.exec(line);
      if (!m) continue;
      const value = p.valueGroup ? m[p.valueGroup] : m[0];
      if (PLACEHOLDER.test(value) || WORDY.test(value)) continue;
      if (p.needsBody && !hasPemBody(lines, i, m.index)) continue;
      hits.push({ pattern: p.id, line: i + 1 });
    }
  }
  return hits;
}

/** Liest die Rolle aus einem JWT, ohne ihn zu prüfen — nur zur Einstufung
 *  (anon ist öffentlich gedacht, service_role ist der Generalschlüssel). */
export function jwtRole(token) {
  try {
    const payload = token.split(".")[1];
    const json = JSON.parse(Buffer.from(payload.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8"));
    return typeof json.role === "string" ? json.role : null;
  } catch {
    return null;
  }
}

/* ── .env und öffentliche Variablen ─────────────────────────────────────── */

/** Welche Pfade aus `git ls-files` sind Geheimnis-Dateien? */
export function trackedEnvFiles(paths) {
  return paths.filter((p) => /(^|\/)\.env(\.[^/]+)?$/.test(p) && !/\.env\.example$/.test(p)
    || /\.(pem|p8|p12|key|mobileprovision)$/.test(p));
}

/** Nur die NAMEN aus einer .env — Werte verlassen diese Funktion als Länge. */
export function envShape(text) {
  const out = {};
  for (const raw of String(text).split("\n")) {
    const m = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(raw);
    if (!m) continue;
    const v = m[2].trim().replace(/^["']|["']$/g, "");
    out[m[1]] = v.length;
  }
  return out;
}

/** Öffentliche Build-Variablen landen im App-Bundle. Heißt eine davon nach
 *  einem Geheimnis, ist das fast sicher ein Leck. */
export function secretLookingPublicVars(names) {
  return [...new Set(names)].filter((n) => /^(EXPO_PUBLIC_|VITE_)/.test(n)
    && /KEY|SECRET|TOKEN|PASSWORD|PRIVATE/.test(n.replace(/^(EXPO_PUBLIC_|VITE_)/, "")));
}

/* ── Datenbank ──────────────────────────────────────────────────────────── */

/** Tabellen aus `create table`, denen kein `enable row level security` folgt. */
export function rlsGaps(sqlText) {
  const sql = String(sqlText).replace(/--.*$/gm, "");
  const created = [...sql.matchAll(/create\s+table\s+(?:if\s+not\s+exists\s+)?([a-z_]+\.)?([a-z_]+)/gi)]
    .map((m) => `${(m[1] || "public.").toLowerCase()}${m[2].toLowerCase()}`);
  const secured = new Set([...sql.matchAll(/alter\s+table\s+([a-z_]+\.)?([a-z_]+)\s+enable\s+row\s+level\s+security/gi)]
    .map((m) => `${(m[1] || "public.").toLowerCase()}${m[2].toLowerCase()}`));
  return { tables: created.length, gaps: created.filter((t) => !secured.has(t)) };
}

/** Tabellenrechte an die öffentlichen Rollen — jedes davon ist ein Tor an RLS vorbei, wenn eine Richtlinie fehlt. */
export function publicGrants(sqlText) {
  const sql = String(sqlText).replace(/--.*$/gm, "");
  return [...sql.matchAll(/grant\s+([^;]+?)\s+on\s+(?:table\s+)?([a-z_.]+)\s+to\s+([^;]+);/gi)]
    .filter((m) => /\b(anon|authenticated|public)\b/i.test(m[3]) && !/function/i.test(m[0]))
    .map((m) => `${m[1].trim()} on ${m[2]} to ${m[3].trim()}`);
}

/* ── server.js ──────────────────────────────────────────────────────────── */

/**
 * Alle Routen mit Zeile und ob sie hinter verifyAccessToken() liegen.
 *
 * Heuristik über die Einrückung, und sie ist bewusst schlicht: Routen der
 * obersten Ebene stehen in route() mit vier Leerzeichen. Enthält der Körper
 * einer solchen Route verifyAccessToken(, gelten er und alle darin
 * verschachtelten Routen als angemeldet. Was die Heuristik nicht sieht,
 * sieht der Agent — deshalb liefert sie Zeilennummern zum Nachlesen.
 */
export function routeInventory(src) {
  const lines = String(src).split("\n");
  const TOP = /^ {4}if \(url\.pathname/;
  const ANY = /url\.pathname(?: === "([^"]+)"| === '([^']+)'|\.startsWith\("([^"]+)"\))(?:[^&]*&& req\.method === "([A-Z]+)")?/g;
  const END = /^ {4}(?:if \(url\.pathname|return serveStatic)/;
  const routes = [];
  for (let i = 0; i < lines.length; i++) {
    if (!TOP.test(lines[i])) continue;
    let j = i + 1;
    while (j < lines.length && !END.test(lines[j])) j++;
    // Nur Code zählt: Kommentare erwähnen verifyAccessToken() gern, ohne es aufzurufen.
    const body = lines.slice(i, j).filter((l) => !/^\s*(?:\/\/|\/\*|\*)/.test(l)).join("\n");
    const authed = /await verifyAccessToken\(/.test(body);
    for (let k = i; k < j; k++) {
      for (const m of lines[k].matchAll(ANY)) {
        const path = m[1] || m[2] || m[3];
        const method = m[4] || "*";
        if (!routes.some((r) => r.path === path && r.method === method)) {
          routes.push({ path, method, line: k + 1, authed });
        }
      }
    }
    i = j - 1;
  }
  return routes;
}

/** Pfade, die ein `if (…) && !isLocalRequest(…)`-Block vor allen anderen
 *  Rechnern sperrt (src/lib/localOnly.js). Liest die Bedingung bis zu drei
 *  Zeilen vor dem Aufruf und verlangt, dass der Block mit 404/403 endet. */
export function localOnlyPaths(src) {
  const lines = String(src).split("\n");
  const paths = new Set();
  for (let i = 0; i < lines.length; i++) {
    if (!/!isLocalRequest\(/.test(lines[i])) continue;
    const cond = lines.slice(Math.max(0, i - 3), i + 1).join("\n");
    const refuses = /status:\s*40[34]/.test(lines.slice(i, i + 3).join("\n"));
    if (!refuses || !/^\s*if \(/m.test(cond)) continue;
    for (const m of cond.matchAll(/url\.pathname === "([^"]+)"/g)) paths.add(m[1]);
  }
  return [...paths];
}

/** Die erlaubten Absender aus corsHeaders(). */
export function corsOrigins(src) {
  const m = /NATIVE_ORIGINS\s*=\s*new Set\(\[([^\]]*)\]\)/.exec(String(src));
  const list = m ? [...m[1].matchAll(/"([^"]*)"/g)].map((x) => x[1]) : null;
  const wildcard = /access-control-allow-origin["']?\s*:\s*["']\*["']/i.test(String(src));
  return { list, wildcard };
}

/** Bucht der Server vor dem bezahlten Aufruf ab, oder schreibt er nur ins Log? */
export function chargeArmed(src) {
  const m = /function settleCharge\([\s\S]*?\n\}/.exec(String(src));
  if (!m) return null; // Funktion umbenannt — dann muss ein Mensch hinsehen
  return !/charged:\s*false/.test(m[0]) && /server_spend/.test(m[0]);
}

/** Antworten, die eine Fehlermeldung oder einen Stack an den Client geben. */
export function errorLeaks(src) {
  const out = [];
  String(src).split("\n").forEach((line, i) => {
    if (/json\(\s*\{[^}]*error:[^}]*\b(?:e|err|error)(?:\?)?\.(?:message|stack)\b/.test(line)
      || /json\(\s*\{[^}]*error:\s*String\(\s*(?:e|err)\s*\)/.test(line)
      || /\.stack\b[^;]*\)\s*;?\s*$/.test(line) && /new Response|json\(/.test(line)) {
      out.push(i + 1);
    }
  });
  return out;
}

/** Log-Zeilen, die Token, Passwörter, E-Mails oder Kopfzeilen nennen. */
export function sensitiveLogs(src) {
  const out = [];
  String(src).split("\n").forEach((line, i) => {
    if (/console\.(?:log|info|warn|error|debug)\(/.test(line)
      && /\b(?:token|password|passwort|email|authorization|refresh_token|access_token|apiKey|secret)\b/i.test(line)) {
      out.push(i + 1);
    }
  });
  return out;
}

export const SECURITY_HEADERS = [
  "x-content-type-options",
  "strict-transport-security",
  "content-security-policy",
  "x-frame-options",
  "referrer-policy",
];

export function headersSet(src) {
  const s = String(src).toLowerCase();
  return SECURITY_HEADERS.filter((h) => s.includes(`"${h}"`) || s.includes(`'${h}'`));
}

/** Bindet Bun.serve an alle Schnittstellen? Ohne `hostname` ist das 0.0.0.0. */
export function bindsAllInterfaces(src) {
  const m = /const serveOptions = \{([\s\S]*?)\n\s*async route\(/.exec(String(src));
  const head = m ? m[1] : String(src);
  const host = /^\s*hostname:\s*["']?([^"',\s]+)/m.exec(head);
  if (!host) return true;
  return host[1] === "0.0.0.0" || host[1] === "::";
}

/* ── Abhängigkeiten ─────────────────────────────────────────────────────── */

/** Zählt `bun audit --json` nach Schwere. */
export function auditCounts(json) {
  const counts = { critical: 0, high: 0, moderate: 0, low: 0 };
  for (const advisories of Object.values(json || {})) {
    for (const a of Array.isArray(advisories) ? advisories : []) {
      if (a.severity in counts) counts[a.severity]++;
    }
  }
  return counts;
}

/* ── Selbsttest ─────────────────────────────────────────────────────────── */

const ROUTE_FIXTURE = [
  "  async route(req, server) {",
  '    if (url.pathname === "/api/generate" && req.method === "POST") {',
  "      return json({});",
  "    }",
  '    if (url.pathname === "/api/account" || url.pathname.startsWith("/api/dreams")) {',
  "      const person = await verifyAccessToken(x);",
  '        if (url.pathname === "/api/dreams" && req.method === "GET") {',
  "        }",
  "    }",
  '    if (url.pathname === "/api/backup" && req.method === "POST") {',
  "      /* Anders als dort, wo await verifyAccessToken(t) prüft … */",
  "    }",
  "    return serveStatic(url.pathname);",
].join("\n");

/**
 * Spielt jede Probe ab. Der Läufer bricht ab, wenn hier etwas nicht stimmt —
 * ein Detektor, der seine eigene Probe nicht findet, würde im echten Lauf
 * „nichts gefunden“ melden und damit lügen.
 * @returns {string[]} Liste der Fehler, leer = alles scharf
 */
export function selfTest() {
  const errors = [];
  for (const p of SECRET_PATTERNS) {
    if (!scanSecrets(p.probe).some((h) => h.pattern === p.id)) errors.push(`Muster ${p.id} findet seine Probe nicht`);
  }
  for (const probe of PLACEHOLDER_PROBES) {
    if (scanSecrets(probe).length) errors.push(`Platzhalter wird als Fund gemeldet: ${probe.slice(0, 30)}…`);
  }
  if (rlsGaps("create table public.a (id int); create table public.b (id int);\nalter table public.a enable row level security;").gaps.join() !== "public.b") {
    errors.push("rlsGaps findet die fehlende RLS nicht");
  }
  const r = routeInventory(ROUTE_FIXTURE);
  const gen = r.find((x) => x.path === "/api/generate");
  const dreams = r.find((x) => x.path === "/api/dreams");
  const backup = r.find((x) => x.path === "/api/backup");
  if (!gen || gen.authed || !dreams || !dreams.authed || !backup || backup.authed) {
    errors.push("routeInventory stuft die Anmeldung falsch ein");
  }
  const guarded = localOnlyPaths([
    '    if ((url.pathname === "/a" || url.pathname === "/b")',
    "        && !isLocalRequest(ip, req.headers)) {",
    '      return new Response("Not found", { status: 404 });',
  ].join("\n"));
  if (guarded.join() !== "/a,/b" || localOnlyPaths('if (url.pathname === "/a" && !isLocalRequest(x)) {\n  log();\n}').length) {
    errors.push("localOnlyPaths erkennt die Sperre falsch");
  }
  if (!corsOrigins('const NATIVE_ORIGINS = new Set(["capacitor://localhost", "null"]);').list?.includes("null")) {
    errors.push("corsOrigins liest die Positivliste nicht");
  }
  if (chargeArmed("function settleCharge(x) {\n  return { charged: false };\n}") !== false) errors.push("chargeArmed erkennt die unscharfe Abbuchung nicht");
  if (errorLeaks('    return json({ error: e.message }, 500);').length !== 1) errors.push("errorLeaks findet e.message nicht");
  if (sensitiveLogs('console.log("token", token);').length !== 1) errors.push("sensitiveLogs findet Token-Log nicht");
  if (!bindsAllInterfaces("const serveOptions = {\n  port: 1,\n  async route(") || bindsAllInterfaces("const serveOptions = {\n  hostname: \"127.0.0.1\",\n  async route(")) {
    errors.push("bindsAllInterfaces liest hostname falsch");
  }
  if (trackedEnvFiles([".env", ".env.example", "a/.env.local", "k.p8", "x.js"]).join() !== ".env,a/.env.local,k.p8") {
    errors.push("trackedEnvFiles stuft .env-Dateien falsch ein");
  }
  if (secretLookingPublicVars(["EXPO_PUBLIC_API_BASE", "EXPO_PUBLIC_FAL_KEY"]).join() !== "EXPO_PUBLIC_FAL_KEY") {
    errors.push("secretLookingPublicVars stuft öffentliche Variablen falsch ein");
  }
  return errors;
}
