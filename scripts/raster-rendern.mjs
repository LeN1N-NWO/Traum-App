#!/usr/bin/env bun
/* Der bezahlte Raster-Test: EIN Traum, mehrere Wege, dieselben Beats.
 *
 * Antons Auftrag (23.08.2026): fünf Szenen des Techno-Traums als Raster in
 * EINEM Bild rendern, in Kacheln schneiden, und als echte Bildstrecke in die
 * App legen — mit Nano Banana Pro in 4K und mit Seedream 5 Lite in 4K.
 *
 * ⚠ DAS HIER KOSTET ECHTES GELD. Der Preis steht vor dem ersten Aufruf auf
 * dem Schirm und muss bestätigt werden (--ja). Ohne das rechnet es nur.
 *
 *   bun scripts/raster-rendern.mjs <traum.json> <referenz.png> <modell> [--ja]
 *
 * ── Was hier NICHT geraten wird ──────────────────────────────────────────
 * Endpunkt, Adressformat, Auflösungsstufe und Preis kommen aus
 * src/lib/imageModel.js; die Rastergeometrie aus src/lib/gridLayout.js; der
 * Prompt aus buildGridPrompt(). Dieses Skript verdrahtet nur — und bricht
 * ab, wenn das Rasterformat nicht zum Modell passt. fal lehnt ein
 * unbekanntes Seitenverhältnis nämlich NICHT ab: es rundet still, man
 * bezahlt, und die Kacheln sitzen danach nicht dort, wo der Schnitt sie
 * sucht.
 */
import { resolve } from "node:path";
import { readFileSync } from "node:fs";
import { buildGridPrompt, buildImagePrompt, buildReferences } from "../src/lib/promptBuilder.js";
import { layoutFor, containerRatio, containerSize, tileBoxes } from "../src/lib/gridLayout.js";
import { imageModel, imageSubmitBody, imagePrice, supportsAspect } from "../src/lib/imageModel.js";

const [traumDatei, refDatei, modellId, ...rest] = process.argv.slice(2);
const JA = rest.includes("--ja");
if (!traumDatei || !refDatei || !modellId) {
  console.error("Aufruf: bun scripts/raster-rendern.mjs <traum.json> <referenz.png> <modell> [--ja]");
  process.exit(1);
}
const KEY = process.env.FAL_KEY;
if (!KEY) { console.error("FAL_KEY fehlt."); process.exit(1); }

const m = imageModel(modellId);
if (m.id !== modellId) { console.error(`Unbekanntes Modell "${modellId}".`); process.exit(1); }

/* Die höchste Auflösung, die das Modell hergibt — das IST der Test.
 * Seedream rechnet in Pixeln (Grenze: 4096×4096 Gesamtfläche laut fal-Schema),
 * Nano Banana Pro in Stufen. */
const STUFE = m.resolutions ? "4K" : null;
/* ⚠ `maxSide` schlägt die Wunschzahl. Seedream 5 Lite ist bei 3072 dicht,
   obwohl sein Schema 4096 verspricht — bezahlt gemessen am 23.08. Ohne
   diesen Deckel kommt eine „content_policy_violation" zurück, die nach
   einem Bildinhalt klingt und in Wahrheit die Kantenlänge meint. */
const LANGE_SEITE = m.maxSide || 4096;

const traum = JSON.parse(readFileSync(traumDatei, "utf8"));
const beats = traum.analysis?.beats || [];
const stil = traum.style || "dreamlike";
const format = traum.format || "9:16";

/* ⚠ Nano Banana Pro kann nur feste Verhältnisse. Für fünf Szenen wäre 3×2
   nötig (27:32) — das kennt es nicht. Also 2×2 (ergibt wieder 9:16) plus die
   übrigen Szenen einzeln. Nicht als Notlösung, sondern weil ein still
   gerundetes Format den ganzen Lauf wertlos machen würde. */
let { cols, rows } = layoutFor(beats.length);
let einzeln = 0;
if (!supportsAspect(m.id, containerRatio(cols, rows, format))) {
  ({ cols, rows } = layoutFor(4));                 // 2×2 = 9:16, das kann jeder
  einzeln = beats.length - cols * rows;
}
const verhaeltnis = containerRatio(cols, rows, format);
const behaelter = containerSize(cols, rows, LANGE_SEITE, format);
const imRaster = Math.min(beats.length, cols * rows);
const stueck = imagePrice(m.id, STUFE);
const aufrufe = 1 + Math.max(0, einzeln);

console.log(`\n╔══ Raster-Lauf ═══════════════════════════════════════════`);
console.log(`║ Traum      ${traum.title} — ${beats.length} Szenen`);
console.log(`║ Modell     ${m.label}${STUFE ? ` · ${STUFE}` : ""}`);
console.log(`║ Raster     ${cols}×${rows} (${verhaeltnis})  ${imRaster} Szenen im Bild` +
            `${einzeln > 0 ? `, ${einzeln} einzeln` : ""}`);
console.log(`║ Behälter   ${behaelter.width}×${behaelter.height}` +
            `  →  Kachel ${behaelter.width / cols}×${behaelter.height / rows}`);
console.log(`║ KOSTEN     ${aufrufe} × $${stueck.toFixed(3)} = $${(aufrufe * stueck).toFixed(3)}`);
console.log(`╚══════════════════════════════════════════════════════════\n`);

if (!JA) {
  console.log("Nichts gerendert. Mit --ja wiederholen, um das Geld auszugeben.\n");
  process.exit(0);
}

const refBytes = readFileSync(resolve(refDatei));
const refUri = `data:image/png;base64,${refBytes.toString("base64")}`;
const { clauses } = buildReferences(
  (traum.references || []).map((r) => ({ kind: "person", avatar: { tag: r.tag, desc: "", img: refUri } })),
);

async function rendern(body) {
  const res = await fetch(`https://queue.fal.run/${body.model}`, {
    method: "POST",
    headers: { Authorization: `Key ${KEY}`, "content-type": "application/json" },
    body: JSON.stringify(body.input),
  });
  if (!res.ok) throw new Error(`Submit ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const { status_url, response_url } = await res.json();
  let letzter = null;
  for (let i = 0; i < 200; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    letzter = await (await fetch(status_url, { headers: { Authorization: `Key ${KEY}` } })).json();
    if (letzter.status === "COMPLETED") break;
    if (letzter.status === "FAILED") break;
  }
  const roh = await (await fetch(response_url, { headers: { Authorization: `Key ${KEY}` } })).text();
  const data = (() => { try { return JSON.parse(roh); } catch { return null; } })();
  const url = data?.images?.[0]?.url;
  /* ⚠ Die Antwort MIT ausgeben, nicht nur „ging nicht". Eine stumme
     Fehlermeldung bei einem bezahlten Aufruf ist die teuerste Sorte: man
     probiert blind weiter, statt zu lesen, was der Anbieter sagt. */
  if (!url) {
    console.log(`\n  Status: ${letzter?.status}\n  Antwort: ${roh.slice(0, 600)}\n`);
    throw new Error("keine Bild-URL in der Antwort");
  }
  return url;
}

const OUT = resolve(import.meta.dir, "..", "media", "ab-test", `raster-${m.id}`);
const name = (s) => s.replace(/[^a-z0-9]+/gi, "-");

/* ── Das Raster ──────────────────────────────────────────────────────── */
const gitter = buildGridPrompt({ beats: beats.slice(0, imRaster), styleId: stil, clauses, cols, rows, tile: format });
const auftrag = imageSubmitBody(m.id, {
  prompt: gitter, imageUrls: [refUri], aspectRatio: verhaeltnis,
  size: { width: behaelter.width, height: behaelter.height }, resolution: STUFE,
});
process.stdout.write(`Raster ${cols}×${rows} … `);
const gitterUrl = await rendern(auftrag);
const gitterBytes = new Uint8Array(await (await fetch(gitterUrl)).arrayBuffer());
await Bun.write(resolve(OUT, `${name(m.id)}-raster.png`), gitterBytes);
console.log(`fertig (${Math.round(gitterBytes.length / 1024)} KB)`);

/* ── Die Szenen, die nicht ins Raster passten ────────────────────────── */
for (let i = imRaster; i < beats.length; i++) {
  const prompt = buildImagePrompt({
    beat: beats[i], styleId: stil, format, clauses, index: i + 1, total: beats.length,
  });
  process.stdout.write(`Szene ${i + 1} einzeln … `);
  const url = await rendern(imageSubmitBody(m.id, {
    prompt, imageUrls: [refUri], aspectRatio: format, resolution: STUFE,
  }));
  const bytes = new Uint8Array(await (await fetch(url)).arrayBuffer());
  await Bun.write(resolve(OUT, `${name(m.id)}-szene-${i + 1}.png`), bytes);
  console.log(`fertig (${Math.round(bytes.length / 1024)} KB)`);
}

/* ── Die Schnittkoordinaten, damit der Schnitt nichts neu raten muss ─── */
await Bun.write(resolve(OUT, "schnitt.json"), JSON.stringify({
  modell: m.id, stufe: STUFE, cols, rows, behaelter,
  imRaster, einzeln, kosten: aufrufe * stueck,
  /* ⚠ Auf dem BESTELLTEN Behälter gerechnet. Was fal wirklich geliefert
     hat, kann abweichen (Seedream skaliert stumm, wenn die Fläche außerhalb
     seiner Grenzen liegt) — der Schnitt misst deshalb selbst nach und
     nimmt diese Zahlen nur als Verhältnis. */
  boxen: tileBoxes(behaelter.width, behaelter.height, cols, rows),
  beats,
}, null, 2));

console.log(`\nAlles in media/ab-test/raster-${m.id}/`);
console.log(`Bezahlt: $${(aufrufe * stueck).toFixed(3)}\n`);
