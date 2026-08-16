#!/usr/bin/env node
/* Structural check: every locale file must mirror en.js exactly — same
 * keys, same nesting, same function arity, same array length. A missing
 * key does not fail loudly; it renders `undefined` somewhere in the app
 * or throws deep inside a component far from here. Run this after writing
 * or editing ANY src/i18n/*.js file. */
import en from "../src/i18n/en.js";
import de from "../src/i18n/de.js";
import es from "../src/i18n/es.js";
import fr from "../src/i18n/fr.js";
import zh from "../src/i18n/zh.js";
import hi from "../src/i18n/hi.js";
import ar from "../src/i18n/ar.js";

const LOCALES = { de, es, fr, zh, hi, ar };
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

function walk(enNode, otherNode, path, id, errors) {
  const enShape = shapeOf(enNode);
  const otherShape = otherNode === undefined ? "MISSING" : shapeOf(otherNode);

  if (enShape !== otherShape) {
    errors.push(`${id}: ${path} — expected ${enShape}, got ${otherShape}`);
    return;
  }
  if (enShape === "object") {
    for (const key of Object.keys(enNode)) {
      walk(enNode[key], otherNode?.[key], path ? `${path}.${key}` : key, id, errors);
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
    enNode.forEach((item, i) => walk(item, otherNode[i], `${path}[${i}]`, id, errors));
  }
}

for (const [id, locale] of Object.entries(LOCALES)) {
  const errors = [];
  walk(en, locale, "", id, errors);
  if (errors.length) {
    failed = true;
    console.log(`✗ ${id}.js — ${errors.length} problem(s)`);
    for (const e of errors) console.log(`    ${e}`);
  } else {
    console.log(`ok    ${id}.js matches en.js exactly`);
  }
}

if (failed) {
  console.log("\n✗ shape mismatch found");
  process.exit(1);
}
console.log("\n✓ all locales match en.js in shape");
