#!/usr/bin/env bun
/* GPT Image 2, jede Stufe mal jeder Auflösung — und was daraus für einen
 * ganzen Traum wird.
 *
 * Antons Frage vom 23.08.2026: „Gib mir nochmal die Preise für GPT in
 * verschiedenen Ausführungen … weil im Idealfall würden wir auch statt einer
 * der Bananen GPT verwenden, weil dort die Gesichter am besten rüberkommen."
 *
 * ⚠ Rechnet nur, ruft nichts auf, kostet nichts.
 *
 *   bun scripts/gpt-preise.mjs [szenen]
 */
import { IMAGE_MODELS, imagePrice } from "../src/lib/imageModel.js";

const SZENEN = Math.max(1, Math.min(12, Number(process.argv[2]) || 4));
const gpt = IMAGE_MODELS["gpt-image-2"];
const STUFEN = ["low", "medium", "high"];

console.log(`\n╔══ GPT Image 2 — Preis je Bild am /edit-Endpunkt ═══════════════════`);
console.log(`║ ⚠ Das ist die EDIT-Tabelle („including one input image"). Unser Weg`);
console.log(`║   schickt IMMER eine Referenz, also gilt sie. Die Text-zu-Bild-Preise`);
console.log(`║   liegen darunter und wären für uns die falsche Zahl.`);
console.log(`╚═══════════════════════════════════════════════════════════════════\n`);

console.log("Auflösung      Pixel      low       medium    high      high/low");
console.log("─".repeat(68));
for (const [masse, p] of Object.entries(gpt.preise)) {
  const [w, h] = masse.split("x").map(Number);
  console.log(
    masse.padEnd(14) +
    `${(w * h / 1e6).toFixed(1)} MP`.padStart(8) + "  " +
    STUFEN.map((s) => `$${p[s].toFixed(3)}`.padEnd(10)).join("") +
    `${(p.high / p.low).toFixed(0)}×`,
  );
}

/* Was die App wirklich bestellen würde. Hochkant, denn die App ist hochkant —
   und die Fläche entscheidet über die Preiszeile, nicht die Ausrichtung. */
const HOCHKANT = [
  { name: "576×1024   (Preset portrait_16_9)", w: 576, h: 1024 },
  { name: "1080×1920  (Full-HD hochkant)", w: 1080, h: 1920 },
  { name: "1440×2560  (was wir heute liefern)", w: 1440, h: 2560 },
  { name: "2160×3840  (GPTs Obergrenze, 9:16)", w: 2160, h: 3840 },
];

console.log(`\n╔══ Hochkant 9:16 — die Formate, die uns betreffen ══════════════════\n`);
console.log("Format                                low       medium    high");
console.log("─".repeat(68));
for (const f of HOCHKANT) {
  const size = { width: f.w, height: f.h };
  console.log(
    f.name.padEnd(36) +
    STUFEN.map((s) => `$${imagePrice("gpt-image-2", s, size).toFixed(3)}`.padEnd(10)).join(""),
  );
}

/* ── Ein ganzer Traum ──────────────────────────────────────────────────
   Zwei Wege, und der Unterschied ist der ganze Punkt: EINZELN zahlt man je
   Szene, im RASTER einmal für alle vier. Bei einem Modell, das nach Fläche
   abrechnet, ist das Raster deshalb doppelt im Vorteil — ein Aufruf, und
   die Fläche wird geteilt statt vervielfacht. */
const EINZELN = { width: 1440, height: 2560 };   // wie heute je Szene
const RASTER = { width: 2160, height: 3840 };    // 2×2, Kacheln 1080×1920

console.log(`\n╔══ Ein Traum mit ${SZENEN} Szenen ══════════════════════════════════════\n`);
console.log("Weg                                    low       medium    high");
console.log("─".repeat(68));
console.log(
  `GPT einzeln, ${SZENEN}× 1440×2560`.padEnd(38) +
  STUFEN.map((s) => `$${(SZENEN * imagePrice("gpt-image-2", s, EINZELN)).toFixed(3)}`.padEnd(10)).join(""),
);
const rasterAufrufe = Math.ceil(SZENEN / 4);
console.log(
  `GPT Raster 2×2, ${rasterAufrufe}× 2160×3840`.padEnd(38) +
  STUFEN.map((s) => `$${(rasterAufrufe * imagePrice("gpt-image-2", s, RASTER)).toFixed(3)}`.padEnd(10)).join(""),
);
console.log(`  → Kachel 1080×1920, ${SZENEN} Szenen aus ${rasterAufrufe} Aufruf${rasterAufrufe > 1 ? "en" : ""}`);

console.log(`\n── Wogegen es antritt (dieselben ${SZENEN} Szenen) ──`);
const gegner = [
  ["Seedream 5 Lite einzeln, 1440×2560", SZENEN * 0.035],
  ["Nano Banana 2 einzeln 1K, 768×1376", SZENEN * 0.08],
  ["Nano Banana 2 Raster 2×2 4K, 1533×2734", Math.ceil(SZENEN / 4) * 0.16],
  ["Nano Banana Pro Raster 2×2 4K, 1533×2734", Math.ceil(SZENEN / 4) * 0.30],
];
for (const [name, preis] of gegner) console.log(`  ${name.padEnd(42)} $${preis.toFixed(3)}`);

console.log(
  `\n⚠ Ungemessen und entscheidend, bevor jemand umstellt:\n` +
  `  1. Hält GPT Image 2 das 2×2-Raster? Nano Banana 2 hat es in einem von\n` +
  `     zwei Läufen verfehlt — bezahlt und unbrauchbar.\n` +
  `  2. Hält es die Ähnlichkeit aus einem Referenzfoto? Genau darum geht es,\n` +
  `     und genau das kann keine Preistabelle beantworten.\n`,
);
