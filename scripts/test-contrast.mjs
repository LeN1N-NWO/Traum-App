#!/usr/bin/env node
// Kontrastprüfung für die Farbtokens.
//
//   node scripts/test-contrast.mjs
//
// Warum es das gibt: die Palette wurde am 08.08. von Violett auf Tiefblau
// umgestellt, und in STAND.md stand seit Monaten die Warnung, dass
// --faint auf --sky der WCAG-Grenzfall ist. Eine Warnung in einer Textdatei
// hält niemanden auf — dieser Test schon. Er liest die echten Werte aus
// tokens.css, nicht eine Kopie davon.
//
// Maßstab: WCAG 2.1 AA. 4.5:1 für Fließtext, 3:1 für große Schrift (ab
// 18.66px fett bzw. 24px) und für Bedienelement-Umrisse.
import { readFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const css = readFileSync(join(REPO, "src/styles/tokens.css"), "utf8");

/** Alle einfachen Farbtokens aus :root lesen. */
function tokens() {
  const out = {};
  for (const m of css.matchAll(/--([a-z0-9-]+)\s*:\s*([^;]+);/g)) {
    out[m[1]] = m[2].trim();
  }
  return out;
}
const T = tokens();

/** "5 10 20" | "#eaf0fb" | "rgb(var(--bg-rgb))" -> [r,g,b] */
function rgb(value, depth = 0) {
  if (depth > 4) throw new Error("Token-Kette zu tief: " + value);
  const v = value.trim();

  const varRef = v.match(/^rgb\(\s*var\(--([a-z0-9-]+)\)\s*\)$/);
  if (varRef) return rgb(T[varRef[1]], depth + 1);

  const plain = v.match(/^var\(--([a-z0-9-]+)\)$/);
  if (plain) return rgb(T[plain[1]], depth + 1);

  const hex = v.match(/^#([0-9a-f]{6})$/i);
  if (hex) {
    const n = parseInt(hex[1], 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  const triplet = v.match(/^(\d+)\s+(\d+)\s+(\d+)$/);
  if (triplet) return [+triplet[1], +triplet[2], +triplet[3]];

  const rgba = v.match(/^rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/);
  if (rgba) return [+rgba[1], +rgba[2], +rgba[3]];

  throw new Error("Farbe nicht lesbar: " + value);
}

function luminance([r, g, b]) {
  const f = (c) => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

function ratio(a, b) {
  const [x, y] = [luminance(rgb(a)), luminance(rgb(b))];
  const [hi, lo] = x > y ? [x, y] : [y, x];
  return (hi + 0.05) / (lo + 0.05);
}

// Jede Paarung, die in der App wirklich vorkommt. Bei neuen Flächenfarben
// gehört hier eine Zeile dazu.
const CHECKS = [
  ["--text",  "--bg",   4.5, "Fließtext auf dem Hintergrund"],
  ["--text",  "--bg2",  4.5, "Fließtext im Blatt/Modal"],
  ["--text",  "--sky",  4.5, "Fließtext auf erhabener Fläche"],
  ["--muted", "--bg",   4.5, "Sekundärtext auf dem Hintergrund"],
  ["--muted", "--bg2",  4.5, "Sekundärtext im Blatt"],
  ["--faint", "--bg",   4.5, "Kleinsttext auf dem Hintergrund"],
  ["--faint", "--bg2",  4.5, "Kleinsttext im Blatt"],
  // ⚠ Der dokumentierte Grenzfall. Stand vorher bei 4.79:1.
  ["--faint", "--sky",  4.5, "Kleinsttext auf erhabener Fläche (Grenzfall)"],
  ["--accent-soft", "--bg",  4.5, "Akzenttext (Preise, aktiver Tab)"],
  ["--accent-soft", "--bg2", 4.5, "Akzenttext im Blatt"],
  ["--accent-soft", "--sky", 3,   "Akzentumriss auf erhabener Fläche"],
  ["--warm",  "--bg",   4.5, "Warmer Akzent (Aufnahme läuft)"],
  ["--gold",  "--bg",   4.5, "Gold (Legendär)"],
  ["--ok",    "--bg",   4.5, "Grün (gratis/erledigt)"],
  ["--cyan",  "--bg",   4.5, "Cyan (selten)"],
  // Weiße Schrift auf dem gefüllten Hauptknopf.
  ["--text",  "--accent-deep", 4.5, "Text auf dem Hauptknopf"],
];

let fail = 0;
for (const [fg, bg, min, was] of CHECKS) {
  const r = ratio(T[fg.slice(2)], T[bg.slice(2)]);
  const ok = r >= min;
  if (!ok) fail++;
  console.log(
    `${ok ? "ok   " : "FAIL "} ${r.toFixed(2)}:1 (min ${min})  ${fg} auf ${bg} — ${was}`
  );
}

console.log(fail ? `\n✗ ${fail} Paarung(en) unter dem Mindestkontrast` : `\n✓ alle ${CHECKS.length} Paarungen erfüllen WCAG AA`);
process.exit(fail ? 1 : 0);
