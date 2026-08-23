/* Der fertige Raster-Prompt samt fal-Parametern — OHNE zu rendern.
 *
 * Antons Test vom 23.08.: fünf Szenen in EINEM Bild, hochkant geschnitten.
 * Dieses Skript schreibt genau das, was abgeschickt werden müsste, und
 * rechnet daneben, was es kostet und wie groß eine Kachel wird. Es ruft
 * NICHTS auf — kein Netz, kein Geld. Die Hausregel („nie auf geratene
 * Feldnamen bezahlt rendern") fängt hier an: erst lesen, dann zahlen.
 *
 *   node scripts/raster-prompt.mjs                    # 5 Szenen, Vorgabe-Modell
 *   node scripts/raster-prompt.mjs 4                  # 4 Szenen
 *   node scripts/raster-prompt.mjs 5 nano-banana-pro  # anderes Modell
 *
 * ⚠ Nano Banana kennt nur feste Seitenverhältnisse. Für die krummen Raster
 * (3×2 = 27:32) taugt es deshalb nicht — das Skript sagt das und schlägt
 * das nächstbeste Raster vor, statt ein Format zu erfinden, das der
 * Anbieter still auf etwas anderes rundet.
 */
import { buildGridPrompt, buildReferences } from "../src/lib/promptBuilder.js";
import { layoutFor, containerRatio, containerSize, tileSize, tileBoxes } from "../src/lib/gridLayout.js";
import { imageModel, DEFAULT_IMAGE_MODEL } from "../src/lib/imageModel.js";

/* Ein echter Traum, damit der Prompt nicht an Platzhaltern geprüft wird.
   Fünf Beats, wie die Analyse sie liefert — englisch, ein Satz je Szene. */
const BEATS = [
  "A vast airport terminal at dawn, empty check-in counters, cold blue light through tall windows.",
  "Hundreds of rabbits pour across the polished floor between the counters, silent and fast.",
  "An enormous alligator pushes through the terminal doors, tiles cracking under its weight.",
  "The dreamer sprints down a jet bridge, boarding pass crumpled in one fist, the herd behind him.",
  "From the aircraft window: the alligator swallowing the terminal whole as the plane lifts away.",
];
const STYLE = "dreamlike";

const anzahl = Math.max(1, Math.min(9, Number(process.argv[2]) || 5));
const modellId = process.argv[3] || DEFAULT_IMAGE_MODEL;
const m = imageModel(modellId);
if (!m || m.id !== modellId) {
  console.error(`Unbekanntes Modell "${modellId}". Bekannt: seedream-5-lite, nano-banana-2-lite, nano-banana-2`);
  process.exit(1);
}

const beats = BEATS.slice(0, anzahl);
const { cols, rows, slots, spare } = layoutFor(anzahl);
const verhaeltnis = containerRatio(cols, rows);

/* Die lange Seite, die das Modell hergibt. Seedream nimmt Pixelmaße bis 3K,
   Nano Banana nur Seitenverhältnisse — die Zahl unten ist für die
   KACHELRECHNUNG, nicht für den Auftrag. */
const LANGE_SEITE = m.sizes ? 3072 : 2048;
const behaelter = containerSize(cols, rows, LANGE_SEITE);
const kachel = tileSize(cols, rows, LANGE_SEITE);

const { clauses } = buildReferences([
  { name: "Anton", kind: "person", avatar: { tag: "anton", img: "…", desc: "mid-30s, dark hair, grey jacket" } },
]);

console.log(`\n╔══ Raster-Test: ${anzahl} Szenen in EINEM Bild ══════════════════`);
console.log(`║ Modell        ${m.label}  ($${m.usd.toFixed(3)} je Bild)`);
console.log(`║ Raster        ${cols}×${rows} = ${slots} Plätze${spare ? ` (${spare} frei)` : ""}`);
console.log(`║ Behälter      ${verhaeltnis}  →  ${behaelter.width}×${behaelter.height}`);
console.log(`║ Kachel        ${kachel.width}×${kachel.height}`);
console.log(`║ Kosten        $${m.usd.toFixed(3)} statt $${(anzahl * m.usd).toFixed(3)}  ` +
            `(${((1 - m.usd / (anzahl * m.usd)) * 100).toFixed(0)} % weniger, ` +
            `$${(m.usd / anzahl).toFixed(4)} je Szene)`);
console.log(`╚═══════════════════════════════════════════════════════════\n`);

/* ⚠ Hier wird bewusst NICHTS ausgegeben, wenn das Format nicht passt.
   Die erste Fassung warnte und druckte den Auftrag trotzdem — mit
   `aspect_ratio: "27:32"`, das Nano Banana nicht kennt. fal wirft dafür
   keinen Fehler, es rundet still auf etwas anderes, und man bezahlt ein
   Bild, dessen Kacheln nicht mehr dort sitzen, wo der Schnitt sie sucht.
   Ein Auftrag, den man nicht abschicken darf, gehört nicht gedruckt. */
const formatPasst = m.sizes || verhaeltnis === "9:16" || verhaeltnis === "1:1";

if (!formatPasst) {
  console.log(
    `⛔ KEIN Auftrag ausgegeben.\n\n` +
    `   ${m.label} nimmt nur feste Seitenverhältnisse, ${verhaeltnis} ist keines davon.\n` +
    `   fal würde das nicht ablehnen, sondern still auf ein anderes Format runden —\n` +
    `   und der Schnitt suchte die Kacheln danach an der falschen Stelle.\n\n` +
    `   Zwei Auswege:\n` +
    `     · 4 Szenen im 2×2 (ergibt 9:16) und den Rest einzeln:\n` +
    `       node scripts/raster-prompt.mjs 4 ${m.id}\n` +
    `     · ein Modell mit freien Pixelmaßen nehmen (Seedream):\n` +
    `       node scripts/raster-prompt.mjs ${anzahl} seedream-5-lite\n`
  );
} else {
  console.log("── Auftrag an fal ────────────────────────────────────────────");
  console.log(JSON.stringify({
    endpoint: m.edit,          // MIT Referenzbildern immer der Edit-Pfad
    ...(m.sizes
      ? { image_size: { width: behaelter.width, height: behaelter.height } }
      : { aspect_ratio: verhaeltnis }),
    num_images: 1,
  }, null, 2));
}

console.log("\n── Prompt ────────────────────────────────────────────────────\n");
console.log(buildGridPrompt({ beats, styleId: STYLE, clauses, cols, rows }));

console.log("\n── Schnitt danach ────────────────────────────────────────────");
console.log("Kachel  x     y     Breite  Höhe   Szene");
tileBoxes(behaelter.width, behaelter.height, cols, rows).forEach((b, i) => {
  console.log(
    `${String(i + 1).padStart(4)}  ${String(b.x).padStart(5)} ${String(b.y).padStart(5)} ` +
    `${String(b.w).padStart(7)} ${String(b.h).padStart(5)}   ` +
    (beats[i] ? beats[i].slice(0, 40) + "…" : "(frei — Establishing Shot)")
  );
});
console.log(
  "\n⚠ Was der Test beantworten muss, und was er NICHT beantwortet:\n" +
  "  Der Preis steht oben und ist sicher. Offen ist allein die Bildfrage —\n" +
  "  hält eine Kachel gegen ein Einzelbild? Gesichter und Hände zerfallen\n" +
  "  zuerst; genau daran ist der Dreier-Streifen 2026-08-19 hängengeblieben.\n"
);
