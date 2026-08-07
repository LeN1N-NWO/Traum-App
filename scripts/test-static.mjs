#!/usr/bin/env node
// Regressionstest für die Datei-Freigabe in server.js.
//
//   node scripts/test-static.mjs
//
// Warum es das gibt: server.js hat einmal das komplette App-Verzeichnis
// ausgeliefert — inklusive .env mit dem Higgsfield-Key. Dieser Test hält die
// Freigabe eng. Wer ein neues öffentliches Asset braucht, erweitert bewusst
// PUBLIC_FILES/PUBLIC_DIRS in server.js UND die Liste hier.
//
// Er liest die Freigabe-Logik aus dem echten server.js statt sie zu kopieren —
// eine Kopie würde grün bleiben, während der Server längst wieder offen ist.
// Läuft absichtlich unter Node (kein Bun nötig), damit er überall startet.

import { readFileSync } from "node:fs";
import { resolve, sep, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const src = readFileSync(join(REPO, "server.js"), "utf8");

function extract(re, was) {
  const m = src.match(re);
  if (!m) {
    console.error(`✗ ${was} nicht in server.js gefunden — wurde dort umbenannt?`);
    process.exit(2);
  }
  return m[0];
}
const typesLine = extract(/^const TYPES = \{.*$/m, "TYPES");
const allowBlock = extract(/^const PUBLIC_FILES[\s\S]*?^const PUBLIC_DIRS.*$/m, "PUBLIC_FILES/PUBLIC_DIRS");
const fnSrc = extract(/export function resolveStatic\(pathname\) \{[\s\S]*?\n\}/, "resolveStatic()")
  .replace("export function", "function");

const ROOT_ABS = REPO;
const resolveStatic = new Function("resolve", "sep", "ROOT_ABS",
  `${typesLine}\n${allowBlock}\n${fnSrc}\nreturn resolveStatic;`)(resolve, sep, ROOT_ABS);

// Was die App zum Laufen braucht — und sonst nichts.
const MUST_SERVE = ["/", "/index.html", "/symbole.html", "/app.css", "/app.js",
                    "/clips/dream.mp4", "/clips/frame.png"];

// Alles hier drin würde ein Geheimnis, Quellcode oder Repo-Interna preisgeben.
const MUST_BLOCK = [
  "/.env", "/.env.example", "/.git/config", "/.gitignore", "/.claude/settings.local.json",
  "/package.json", "/server.js", "/scripts/checkpoint.js", "/scripts/shared-files.json",
  "/docs/STAND.md", "/AGENTS.md", "/README.md", "/CLAUDE.md",
  "/../../etc/passwd", "/..%2f..%2fetc/passwd", "/%2e%2e/%2e%2e/etc/passwd",
  "/clips/../.env", "/clips/..%2f.env", "/clips/../../../etc/passwd",
  "/%00", "/foo", "/%ZZ", "/index.html.bak", "/INDEX.HTML",
];

let fail = 0;
for (const p of MUST_SERVE) {
  const r = resolveStatic(p);
  if (!r) { fail++; console.log("FAIL  ausliefern:", JSON.stringify(p), "-> 404"); }
  else console.log("ok    ausliefern:", JSON.stringify(p), "->", r.abs.replace(ROOT_ABS, "<ROOT>"));
}
for (const p of MUST_BLOCK) {
  const r = resolveStatic(p);
  if (r) { fail++; console.log("FAIL  sperren:   ", JSON.stringify(p), "-> AUSGELIEFERT:", r.abs); }
  else console.log("ok    sperren:   ", JSON.stringify(p), "-> 404");
}

console.log(fail ? `\n✗ ${fail} Fehlschläge` : `\n✓ alle ${MUST_SERVE.length + MUST_BLOCK.length} Prüfungen bestanden`);
process.exit(fail ? 1 : 0);
