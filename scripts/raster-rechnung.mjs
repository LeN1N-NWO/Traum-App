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

/* ⚠ 2×2 ist die EINHEIT, nicht 3×3. Ein 3×3 fasst neun Szenen in einem
   Aufruf und wäre je Szene billiger — aber die Kachel fiele auf 1024×1834
   und damit UNTER das, was die App heute liefert (1440×2560). Ein Raster,
   das kleinere Bilder macht als der Weg, den es ersetzen soll, ist kein
   Fortschritt, sondern eine Verschlechterung mit Rabatt.
   Bei 2×2 bleibt die Kachel bei 1533×2734 — größer als heute. Deshalb:
   vier Szenen = ein Raster, acht Szenen = zwei. Genau das ist der Grund,
   warum 4 und 8 als Bildzahlen besser passen als 5 und 10. */
const RASTER = [2, 2];
const PLAETZE = RASTER[0] * RASTER[1];

const wege = [
  { name: "Seedream 5 Lite, einzeln", modell: "seedream-5-lite", stufe: null,
    raster: false, bild: "1440×2560", note: "heute" },
  { name: "Nano Banana 2, 2×2-Raster 4K", modell: "nano-banana-2", stufe: "4K",
    raster: true, bild: GEMESSEN.kachel, note: "⚠ Raster 1 von 2 verfehlt" },
  { name: "Nano Banana Pro, 2×2-Raster 4K", modell: "nano-banana-pro", stufe: "4K",
    raster: true, bild: GEMESSEN.kachel, note: "" },
  { name: "Nano Banana 2, einzeln 4K", modell: "nano-banana-2", stufe: "4K",
    raster: false, bild: `${GEMESSEN.breite}×${GEMESSEN.hoehe}`, note: "" },
  { name: "Nano Banana 2, einzeln 1K", modell: "nano-banana-2", stufe: "1K",
    raster: false, bild: "768×1376", note: "" },
  { name: "Nano Banana Pro, einzeln 4K", modell: "nano-banana-pro", stufe: "4K",
    raster: false, bild: `${GEMESSEN.breite}×${GEMESSEN.hoehe}`, note: "" },
];

/** Wie viele Aufrufe ein Weg für n Szenen braucht.
 *  Beim Raster wird AUFGERUNDET: ein angefangenes Raster ist ein voller
 *  Aufruf, egal wie viele Plätze frei bleiben. Genau das macht 4 und 8 zu
 *  den effizienten Zahlen — und 5 und 10 zu den teuren. */
function aufrufe(weg, n) {
  return weg.raster ? Math.ceil(n / PLAETZE) : n;
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
