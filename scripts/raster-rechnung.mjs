#!/usr/bin/env bun
/* Was ein Traum mit N Szenen auf jedem Weg kostet — Raster gegen Einzelbild.
 *
 * Antons Frage vom 23.08.2026: „Was ist günstiger — vier Kacheln in EINEM
 * Bild (Nano Banana Pro 4K) oder vier einzelne Bilder mit Nano Banana 2?"
 *
 * ⚠ Rechnet nur, ruft nichts auf, kostet nichts.
 *
 *   bun scripts/raster-rechnung.mjs [szenen]
 *
 * ── Die Preise werden IMPORTIERT, nie abgeschrieben ──────────────────────
 * `imagePrice()` kennt die Auflösungsstufen: Nano Banana 2 kostet bei 2K das
 * 1,5-Fache und bei 4K das Doppelte, Nano Banana Pro nur bei 4K das Doppelte.
 * Eine Konstante hier wäre nach dem ersten Preiswechsel falsch — und zwar
 * lautlos, weil eine Tabelle mit falschen Zahlen genauso aussieht wie eine
 * mit richtigen.
 *
 * ── Was die Tabelle NICHT weiß ───────────────────────────────────────────
 * Zwei gemessene Dinge stehen unten als Fußnoten, weil sie sich nicht in
 * einen Preis übersetzen lassen:
 *   · Seedream lehnt Aufträge mit Referenzfoto unregelmäßig ab (23.08.:
 *     4 durch, 8 abgelehnt). Erstattet wird, aber das Bild fehlt.
 *   · Nano Banana 2 hat das 2×2-Raster in einem von zwei Läufen NICHT
 *     befolgt (vier Querformate übereinander statt vier Hochkant-Kacheln).
 *     Ein solcher Lauf ist bezahlt und unbrauchbar.
 */
import { imagePrice, imageModel } from "../src/lib/imageModel.js";
import { layoutFor, containerRatio, containerSize } from "../src/lib/gridLayout.js";

const SZENEN = Math.max(1, Math.min(12, Number(process.argv[2]) || 5));

/* Die Kachelmaße sind GEMESSEN, nicht gerechnet: Nano Banana liefert bei 4K
   und 9:16 einen Behälter von 3072×5504, nicht die 2304×4096, die man aus
   „4K" ableiten würde. Der Schnitt trimmt zusätzlich den schwarzen Rand,
   deshalb 1533 statt 1536. (Beide Modelle, 23.08.2026.) */
const GEMESSEN = { breite: 3072, hoehe: 5504, kachel: "1533×2734" };

const wege = [
  { name: "Seedream 5 Lite, einzeln", modell: "seedream-5-lite", stufe: null,
    raster: null, bild: "1440×2560", note: "heute" },
  { name: "Seedream 5 Lite, 3×2-Raster", modell: "seedream-5-lite", stufe: null,
    raster: [3, 2], bild: "864×1536", note: "⚠ Ablehnungen" },
  { name: "Nano Banana 2, einzeln 1K", modell: "nano-banana-2", stufe: "1K",
    raster: null, bild: "768×1376", note: "" },
  { name: "Nano Banana 2, einzeln 4K", modell: "nano-banana-2", stufe: "4K",
    raster: null, bild: `${GEMESSEN.breite}×${GEMESSEN.hoehe}`, note: "" },
  { name: "Nano Banana 2, 2×2-Raster 4K", modell: "nano-banana-2", stufe: "4K",
    raster: [2, 2], bild: GEMESSEN.kachel, note: "⚠ Raster 1 von 2 verfehlt" },
  { name: "Nano Banana Pro, 2×2-Raster 4K", modell: "nano-banana-pro", stufe: "4K",
    raster: [2, 2], bild: GEMESSEN.kachel, note: "" },
  { name: "Nano Banana Pro, einzeln 4K", modell: "nano-banana-pro", stufe: "4K",
    raster: null, bild: `${GEMESSEN.breite}×${GEMESSEN.hoehe}`, note: "" },
];

/* Wie viele Aufrufe ein Weg braucht. Ein Raster fasst cols×rows Szenen; was
   nicht hineinpasst, geht einzeln — das ist keine Feinheit, sondern der
   ganze Unterschied zwischen 2×2 (vier Plätze) und 3×2 (sechs). */
function aufrufe(weg, n) {
  if (!weg.raster) return n;
  const plaetze = weg.raster[0] * weg.raster[1];
  return 1 + Math.max(0, n - plaetze);
}

console.log(`\n╔══ Ein Traum mit ${SZENEN} Szenen — was jeder Weg kostet ═══════════════════\n`);
const zeilen = wege.map((w) => {
  const n = aufrufe(w, SZENEN);
  const je = imagePrice(w.modell, w.stufe);
  return { ...w, n, je, summe: n * je, jeSzene: (n * je) / SZENEN };
}).sort((a, b) => a.summe - b.summe);

console.log("Weg                                  Aufrufe    Summe   je Szene   Bild je Szene");
console.log("─".repeat(86));
for (const z of zeilen) {
  console.log(
    z.name.padEnd(36) +
    String(z.n).padStart(5) +
    `  $${z.summe.toFixed(3)}`.padStart(9) +
    `  $${z.jeSzene.toFixed(4)}`.padStart(11) +
    "   " + z.bild.padEnd(12) + z.note,
  );
}

const heute = zeilen.find((z) => z.note === "heute");
console.log("\n── Gegen den heutigen Weg ($" + heute.summe.toFixed(3) + ") ──");
for (const z of zeilen) {
  if (z === heute) continue;
  const d = z.summe / heute.summe;
  console.log(
    `  ${z.name.padEnd(36)} ${d >= 1 ? `${d.toFixed(1)}× teurer` : `${Math.round((1 - d) * 100)} % billiger`}`,
  );
}

/* Antons konkrete Frage, ausgerechnet statt beschrieben: VIER Szenen, weil
   genau vier in ein 2×2 passen — der faire Vergleich zwischen „ein Bild
   zerschneiden" und „vier Bilder einzeln bestellen". */
const VIER = 4;
const proRaster = imagePrice("nano-banana-pro", "4K") * 1;
const nb2Einzeln = imagePrice("nano-banana-2", "4K") * VIER;
const nb2Raster = imagePrice("nano-banana-2", "4K") * 1;
console.log(`\n── Antons Frage: vier Szenen, Raster gegen Einzelbilder ──`);
console.log(`  Nano Banana Pro 4K, EIN 2×2-Bild      $${proRaster.toFixed(3)}   ($${(proRaster / VIER).toFixed(4)} je Szene)`);
console.log(`  Nano Banana 2 4K, VIER Einzelbilder   $${nb2Einzeln.toFixed(3)}   ($${(nb2Einzeln / VIER).toFixed(4)} je Szene)`);
console.log(`  → Das Raster ist $${(nb2Einzeln - proRaster).toFixed(3)} billiger ` +
            `(${Math.round((1 - proRaster / nb2Einzeln) * 100)} %), bei ${GEMESSEN.kachel} statt ${GEMESSEN.breite}×${GEMESSEN.hoehe}.`);
console.log(`\n  Der billigste 4K-Weg wäre Nano Banana 2 im 2×2: $${nb2Raster.toFixed(3)}.`);
console.log(`  ⚠ Aber es hat das Raster in einem von zwei Läufen verfehlt. Ein`);
console.log(`     verfehlter Lauf ist bezahlt und unbrauchbar; bei einer Quote von`);
console.log(`     50 % kostet er im Mittel $${(nb2Raster * 2).toFixed(3)} — also so viel wie Pro,`);
console.log(`     nur mit einer zweiten Wartezeit. (n=2, das ist eine Warnung,`);
console.log(`     keine Quote.)`);

const g = layoutFor(SZENEN);
console.log(`\n── Geometrie für ${SZENEN} Szenen ──`);
console.log(`  Ideal wäre ${g.cols}×${g.rows} (${containerRatio(g.cols, g.rows)}), ${g.slots} Plätze` +
            `${g.spare ? `, ${g.spare} frei` : ""}.`);
console.log(`  ⚠ Das kann nur Seedream — Nano Banana kennt nur feste Verhältnisse,`);
console.log(`     also 2×2 (= 9:16) plus Rest einzeln. Genau daran hängt, warum die`);
console.log(`     Rasterersparnis bei Nano Banana bei vier Szenen aufhört.`);
console.log("");
