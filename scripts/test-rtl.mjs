#!/usr/bin/env node
/* Hält die Oberfläche spiegelbar.
 *
 * Arabisch lief bis zum 10.08.2026 auf `dir="rtl"` allein — der Browser dreht
 * damit Textfluss und logische Eigenschaften, aber kein `margin-left` und kein
 * `text-align: left`. Solche Zeilen fallen niemandem auf, der die App auf
 * Deutsch benutzt: sie sehen in sechs von sieben Sprachen völlig richtig aus.
 * Genau deshalb braucht es eine Prüfung statt Aufmerksamkeit.
 *
 * Was NICHT beanstandet wird, und warum:
 *   - `left: 0; right: 0` als Paar — spannt die volle Breite, in beiden
 *     Richtungen identisch. Das umzuschreiben wäre Aktionismus.
 *   - `left: 50%` zusammen mit `translateX(-50%)` — zentriert. Auf logische
 *     Eigenschaften umgestellt liefe es in RTL sogar aus dem Bild heraus.
 *   - Alles in `[dir="rtl"]`-Blöcken: das sind die Ausnahmen selbst.
 *   - Dekoratives ohne Bedeutung (DreamScape-Flächen) — spiegelfrei per
 *     Ausnahmeliste unten, mit Begründung.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const SRC = join(ROOT, "src");

/* Dateien, in denen physische Richtungen bewusst stehen bleiben. Jede braucht
   einen Grund — eine Ausnahmeliste ohne Begründung wird zur Mülldeponie. */
const ALLOW = {
  "components/DreamScape.css":
    "abstrakte Lichtflächen ohne Richtungssinn; gespiegelt sähen sie nur anders aus, nicht richtiger",
  "components/Toast.css":
    "left:50% + translateX(-50%) ist Zentrierung, keine Seitenwahl",
  "styles/base.css":
    "enthält die [dir=rtl]-Ausnahmen selbst",
};

const FILES = [];
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (name.endsWith(".css")) FILES.push(p);
  }
})(SRC);

// Einseitige physische Angaben. `left`/`right` nur, wenn die Gegenseite in
// derselben Regel FEHLT — das trennt „an den Rand gehängt" von „volle Breite".
const PHYSICAL = [
  [/\b(margin|padding|border)-(left|right)\s*:/g, (m) => `${m} → ${m.replace(/-(left|right)/, "-inline-$1").replace("left", "start").replace("right", "end")}`],
  [/\btext-align\s*:\s*(left|right)\b/g, () => "text-align: start / end"],
];

let problems = 0;

for (const file of FILES) {
  const rel = relative(SRC, file);
  if (ALLOW[rel]) continue;
  const src = readFileSync(file, "utf8");

  // [dir="rtl"]-Blöcke ausklammern, sonst meldet die Prüfung ihre eigene Kur.
  const body = src.replace(/\[dir="rtl"\][^{]*\{[^}]*\}/g, "");

  /* Kommentare zählen nicht. Ein Kommentar, der ERKLÄRT, warum eine Regel
     einmal `padding-right` hieß, ist Dokumentation — er wurde beim ersten
     Lauf prompt als Verstoß gemeldet, was die Prüfung zu einem Ding gemacht
     hätte, das man umschreibt statt liest. Zeilenweise entfernt, weil die
     Regeln hier durchweg einzeilig geschrieben sind. */
  const stripped = body.replace(/\/\*[\s\S]*?\*\//g, "");

  src.split("\n").forEach((line, i) => {
    const code = line.replace(/\/\*.*?\*\//g, "").replace(/\/\*.*$/, "");
    if (!line.trim() || !body.includes(line.trim())) return;
    if (!stripped.includes(code.trim()) || !code.trim()) return;
    line = code;
    for (const [re, hint] of PHYSICAL) {
      re.lastIndex = 0;
      const hit = re.exec(line);
      if (hit) {
        console.log(`✗ ${rel}:${i + 1}  ${hit[0]}  —  ${hint(hit[0])}`);
        problems++;
      }
    }
    // Einseitiges left:/right: — nur melden, wenn die Gegenseite nicht in
    // derselben Zeile steht (die Regeln hier sind einzeilig geschrieben).
    const one = /(?:^|[;{\s])(left|right)\s*:/.exec(line);
    if (one && !/translateX\(-50%\)/.test(line)) {
      const other = one[1] === "left" ? "right" : "left";
      if (!new RegExp(`\\b${other}\\s*:`).test(line)) {
        console.log(`✗ ${rel}:${i + 1}  ${one[1]}:  —  inset-inline-${one[1] === "left" ? "start" : "end"}`);
        problems++;
      }
    }
  });
}

if (problems) {
  console.log(`\n✗ ${problems} physische Richtungsangabe(n) — auf Arabisch stehen sie falsch herum.`);
  process.exit(1);
}
console.log(`✓ ${FILES.length} Stilblätter spiegelbar (${Object.keys(ALLOW).length} begründete Ausnahmen)`);
