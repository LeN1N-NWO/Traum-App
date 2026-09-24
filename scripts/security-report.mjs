#!/usr/bin/env bun
/* Sicherheitsbericht als PDF — `bun scripts/security-report.mjs <bericht.json> [--mech <check.json>] [--out <ordner>]`
 *
 * Nimmt den JSON-Bericht des Agenten security-expert, prüft ihn, vergleicht
 * ihn mit dem letzten Lauf und setzt ihn als Security-Assessment-Report
 * (src/lib/securityReport.js) per Chrome headless als A4-PDF.
 *
 * ⚠ Der Bericht beschreibt offene Lücken und das Repository ist öffentlich.
 * Deshalb, und nicht verhandelbar:
 *   - Vorgabe-Ablage ist ~/Claude/Sicherheitsberichte/, außerhalb jedes Repos.
 *   - Liegt der Zielordner in einem Git-Arbeitsbaum, bricht das Skript ab —
 *     auch mit --out. Ein .gitignore-Eintrag wäre eine Zeile, die jemand
 *     kürzen kann; ein Ordner außerhalb von Git kann nicht versehentlich
 *     mitcommittet werden.
 *   - Vor dem Schreiben läuft der Geheimnis-Scan über den Bericht. Ein Fund
 *     bricht ab: Ein Bericht, der den Schlüssel zitiert, ist selbst das Leck.
 *   - Ordner 700, Dateien 600. Das Zwischen-HTML wird gelöscht.
 *
 * Ausgang: 0 = PDF geschrieben · 1 = Bericht ungültig/unsicher · 2 = Aufruf/Umgebung
 */

import { spawn, spawnSync } from "node:child_process";
import { chmodSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync, mkdtempSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { validateReport, compareRuns, renderReportHtml, countBySeverity, SEVERITIES } from "../src/lib/securityReport.js";
import { scanSecrets } from "../src/lib/securityScan.js";

const argv = process.argv.slice(2);
const opt = (name) => { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : null; };
const input = argv.find((a, i) => !a.startsWith("--") && !["--mech", "--out"].includes(argv[i - 1]));
if (!input) {
  console.error("Aufruf: bun scripts/security-report.mjs <bericht.json> [--mech <check.json>] [--out <ordner>]");
  process.exit(2);
}

/* Der Agent darf seinen Bericht in einen ```json-Block packen — Modelle tun
   das gern, und ein Abbruch deswegen wäre Pedanterie. */
function readJson(path) {
  const raw = readFileSync(path, "utf8");
  const fenced = /```(?:json)?\s*\n([\s\S]*?)\n```/.exec(raw);
  return { raw, data: JSON.parse(fenced ? fenced[1] : raw) };
}

let report, raw;
try { ({ raw, data: report } = readJson(input)); } catch (e) {
  console.error(`❌ Bericht nicht lesbar (${input}): ${e.message}`);
  process.exit(1);
}
const problems = validateReport(report);
if (problems.length) {
  console.error("❌ Bericht unvollständig:");
  for (const p of problems) console.error("   - " + p);
  process.exit(1);
}
const mechPath = opt("--mech");
let mech = null, mechRaw = "";
if (mechPath) {
  try { ({ raw: mechRaw, data: mech } = readJson(mechPath)); } catch (e) { console.error(`⚠ --mech nicht lesbar, Anhang entfällt: ${e.message}`); }
}
/* Beide Eingaben gehen ins PDF, also werden beide gescannt — auch die
   Skriptausgabe, obwohl sie keine Werte enthalten soll: „soll“ ist kein Beleg. */
for (const [name, text] of [["Bericht", raw], ["--mech", mechRaw]]) {
  const leaks = scanSecrets(text);
  if (!leaks.length) continue;
  console.error(`❌ ${name} enthält ${leaks.length} geheimnisartige Stelle(n) (Zeilen ${leaks.map((l) => l.line).join(", ")}, Muster ${[...new Set(leaks.map((l) => l.pattern))].join(", ")}).`);
  console.error("   Kein PDF. Wert entfernen, nur Datei:Zeile nennen.");
  process.exit(1);
}

/* ── Ablage: außerhalb von Git, sonst nicht ─────────────────────────────── */
const outDir = resolve(opt("--out") || join(homedir(), "Claude", "Sicherheitsberichte"));
// Geprüft wird am nächsten VORHANDENEN Vorfahren, bevor irgendetwas angelegt
// wird — sonst bliebe nach dem Abbruch ein leerer Ordner im Repo zurück.
let probe = outDir;
while (!existsSync(probe)) probe = dirname(probe);
const inGit = spawnSync("git", ["-C", probe, "rev-parse", "--is-inside-work-tree"], { encoding: "utf8" });
if (inGit.status === 0 && inGit.stdout.trim() === "true") {
  console.error(`❌ ${outDir} liegt in einem Git-Arbeitsbaum. Der Bericht gehört nicht ins Repository — anderen Ordner wählen.`);
  process.exit(2);
}
mkdirSync(outDir, { recursive: true, mode: 0o700 });
chmodSync(outDir, 0o700);

/* ── Vergleich mit dem letzten Lauf ─────────────────────────────────────── */
const previousFile = readdirSync(outDir).filter((f) => /^\d{4}-\d{2}-\d{2}-\d{6}\.json$/.test(f)).sort().pop();
let previous = null;
if (previousFile) {
  try { previous = JSON.parse(readFileSync(join(outDir, previousFile), "utf8")); } catch { /* kaputter Altbericht: dann ohne Vergleich */ }
}
// „Neu“ ist eine Tatsache, kein Urteil: Stand der Schlüssel schon im
// letzten Bericht, ist der Befund offen, egal was der Agent schrieb.
if (previous) {
  const before = new Set((previous.findings || []).map((f) => f.key));
  for (const f of report.findings) if (f.status === "neu" && before.has(f.key)) f.status = "offen";
}
report.meta.since ||= previous?.meta?.date;
const delta = compareRuns(report, previous);

/* ── Setzen und drucken ─────────────────────────────────────────────────── */
const now = new Date();
const pad = (n) => String(n).padStart(2, "0");
const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
const pdfPath = join(outDir, `${stamp}.pdf`);
const jsonPath = join(outDir, `${stamp}.json`);

const work = mkdtempSync(join(tmpdir(), "dr-security-"));
const htmlPath = join(work, "bericht.html");
writeFileSync(htmlPath, renderReportHtml(report, mech, delta), { mode: 0o600 });

const chrome = process.env.CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
if (!existsSync(chrome)) {
  rmSync(work, { recursive: true, force: true });
  console.error(`❌ Chrome nicht gefunden (${chrome}). Pfad über CHROME=… angeben.`);
  process.exit(2);
}
/* Nicht auf das Ende von Chrome warten, sondern auf ein FERTIGES PDF.
 * Gemessen am 24.09.2026: Chrome headless schreibt das PDF in ~2 s und
 * beendet sich danach erst, wenn man ihn beendet — die erste Fassung wartete
 * per spawnSync bis zur Zeitgrenze (60 s) und meldete dann „Erfolg“.
 * Fertig heißt: Datei endet auf %%EOF und ist zweimal hintereinander gleich groß. */
/* Eigene Prozessgruppe (detached), damit am Ende die GANZE Gruppe fällt:
 * Chrome startet Hilfsprozesse, und ein kill() nur auf den Hauptprozess ließ
 * sie weiterlaufen — acht verwaiste Prozesse nach drei Testläufen. */
const chromeProc = spawn(chrome, [
  "--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check",
  `--user-data-dir=${join(work, "profil")}`,
  "--no-pdf-header-footer",
  `--print-to-pdf=${pdfPath}`, pathToFileURL(htmlPath).href,
], { detached: true, stdio: ["ignore", "ignore", "pipe"] });
let chromeErr = "";
chromeProc.stderr.on("data", (d) => { chromeErr = (chromeErr + d).slice(-4000); });
const exited = new Promise((r) => chromeProc.once("exit", r));
const killGroup = () => { try { process.kill(-chromeProc.pid, "SIGKILL"); } catch { /* schon weg */ } };

function pdfComplete(path, lastSize) {
  if (!existsSync(path)) return { done: false, size: -1 };
  const size = statSync(path).size;
  if (size < 1000 || size !== lastSize) return { done: false, size };
  const tail = readFileSync(path).subarray(-1024).toString("latin1");
  return { done: tail.includes("%%EOF"), size };
}

const deadline = Date.now() + 60_000;
let done = false, lastSize = -1;
while (Date.now() < deadline) {
  await Bun.sleep(250);
  ({ done, size: lastSize } = pdfComplete(pdfPath, lastSize));
  if (done || (chromeProc.exitCode !== null && !existsSync(pdfPath))) break;
}
killGroup();
await Promise.race([exited, Bun.sleep(2000)]);
rmSync(work, { recursive: true, force: true });

if (!done) {
  rmSync(pdfPath, { force: true }); // kein halbes PDF liegen lassen
  console.error("❌ Chrome hat kein vollständiges PDF geschrieben:\n" + chromeErr.split("\n").slice(-5).join("\n"));
  process.exit(2);
}
writeFileSync(jsonPath, JSON.stringify(report, null, 2) + "\n", { mode: 0o600 });
chmodSync(pdfPath, 0o600);

const c = countBySeverity(report.findings);
console.log(`✅ ${pdfPath.replace(homedir(), "~")}`);
console.log(`   ${report.findings.length} Befund(e): ${SEVERITIES.map((s) => `${c[s.id]} ${s.label}`).join(" · ")}`);
if (delta) console.log(`   seit ${delta.since}: ${delta.added.length} neu, ${delta.resolved.length} behoben`);
console.log(`   Daten für den nächsten Vergleich: ${jsonPath.replace(homedir(), "~")}`);
