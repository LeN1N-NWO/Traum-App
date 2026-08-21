#!/usr/bin/env node
/* Structural check: locale files must mirror en.js — same keys, same
 * nesting, same function arity, same array length. Run this after writing
 * or editing ANY src/i18n/*.js file.
 *
 * Zwei Strengegrade seit dem 21.08. (Antons Regel: neue Texte werden bis
 * kurz vor Launch nur in en.js und de.js gepflegt; es/fr/zh/hi/ar
 * bekommen am Ende EINE Sammelübersetzung):
 *   de           — STRENG: jeder fehlende Schlüssel ist ein Fehler.
 *   es fr zh hi ar — NACHSICHTIG: fehlende Schlüssel sind erlaubt (die
 *                  App fällt auf Englisch zurück, siehe withFallback in
 *                  src/i18n/index.js) und werden nur GEZÄHLT — das ist
 *                  zugleich die Arbeitsliste für die Sammelübersetzung.
 *                  Alles andere bleibt ein Fehler: falsche Form, falsche
 *                  Arität, falsche Array-Länge, Schlüssel, die en.js
 *                  nicht kennt (Tippfehler). */
import en from "../src/i18n/en.js";
import de from "../src/i18n/de.js";
import es from "../src/i18n/es.js";
import fr from "../src/i18n/fr.js";
import zh from "../src/i18n/zh.js";
import hi from "../src/i18n/hi.js";
import ar from "../src/i18n/ar.js";

const LOCALES = { de, es, fr, zh, hi, ar };
const STRICT = new Set(["de"]);
let failed = false;

function shapeOf(v) {
  if (typeof v === "function") return `fn(${v.length})`;
  if (Array.isArray(v)) return `array(${v.length})`;
  /* null VOR dem Objekt-Zweig abfangen. `typeof null === "object"` ist die
     bekannteste Falle in JavaScript, und hier hatte sie Folgen: der Pruefer
     lief in Object.keys(null) und stuerzte mit einem TypeError ab, statt
     einen Formunterschied zu MELDEN. Ein Pruefwerkzeug, das bei ungewohnter
     Eingabe abstuerzt, sagt einem nur, dass etwas kaputt ist — nicht was.
     Gefunden am 16.08.2026 beim Einbau der Paywall-Texte. */
  if (v === null) return "null";
  if (typeof v === "object") return "object";
  if (typeof v === "string") return "string";
  return typeof v;
}

function walk(enNode, otherNode, path, id, errors, missing) {
  const enShape = shapeOf(enNode);
  const otherShape = otherNode === undefined ? "MISSING" : shapeOf(otherNode);

  if (otherShape === "MISSING" && !STRICT.has(id)) {
    // Erlaubte Lücke: zur Laufzeit englisch. Nur zählen, nicht meckern.
    missing.push(path);
    return;
  }
  if (enShape !== otherShape) {
    errors.push(`${id}: ${path} — expected ${enShape}, got ${otherShape}`);
    return;
  }
  if (enShape === "object") {
    for (const key of Object.keys(enNode)) {
      walk(enNode[key], otherNode?.[key], path ? `${path}.${key}` : key, id, errors, missing);
    }
    // Also flag keys the translation added that en.js does not have —
    // usually a typo'd key name, which otherwise fails silently (the app
    // reads the EN key, gets undefined, and the real key sits unused).
    for (const key of Object.keys(otherNode)) {
      if (!(key in enNode)) errors.push(`${id}: ${path}.${key} — extra key not in en.js`);
    }
  }
  if (enShape === "array" && enNode.length && typeof enNode[0] === "object" && !Array.isArray(enNode[0])) {
    // Arrays of objects (guide, checklist items, slides): check each entry's shape too.
    enNode.forEach((item, i) => walk(item, otherNode[i], `${path}[${i}]`, id, errors, missing));
  }
}

for (const [id, locale] of Object.entries(LOCALES)) {
  const errors = [];
  const missing = [];
  walk(en, locale, "", id, errors, missing);
  if (errors.length) {
    failed = true;
    console.log(`✗ ${id}.js — ${errors.length} problem(s)`);
    for (const e of errors) console.log(`    ${e}`);
  } else if (missing.length) {
    console.log(`ok    ${id}.js — ${missing.length} key(s) untranslated (fall back to English)`);
  } else {
    console.log(`ok    ${id}.js matches en.js exactly`);
  }
}

if (failed) {
  console.log("\n✗ shape mismatch found");
  process.exit(1);
}
console.log("\n✓ all locales match en.js in shape");
