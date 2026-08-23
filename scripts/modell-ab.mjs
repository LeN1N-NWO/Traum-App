#!/usr/bin/env bun
/* A/B: dieselbe Bildkette, zwei Modelle (Antons Auftrag 22.08.2026:
 * „alles das gleiche wie beim letzten Traum … dass du mir noch mal
 * parallel diese Bilder mit Nano Banana 2, also nicht mit dieser
 * Light-Version, sondern mit der besseren Version erstellst und den
 * Preisunterschied nennst").
 *
 * ⚠ EINE Variable, nicht zwei. Die Prompts kommen aus DENSELBEN Funktionen
 * wie im echten Lauf (promptBuilder.js), die Referenz ist DIESELBE Datei,
 * die Kette läuft in DERSELBEN Reihenfolge. Geändert wird ausschließlich
 * der Modell-Slug — sonst vergleicht man am Ende zwei Dinge und weiß nicht,
 * welches gewirkt hat.
 *
 * ⚠ DAS HIER KOSTET ECHTES GELD. Es rendert bei fal.ai. Der Preis steht am
 * Ende der Ausgabe.
 *
 *   bun scripts/modell-ab.mjs <traum.json> <referenz.png> [modell-slug]
 */
import { resolve } from "node:path";
import { readFileSync } from "node:fs";
import { buildImagePrompt, buildReferences } from "../src/lib/promptBuilder.js";

const [traumDatei, refDatei, slugArg] = process.argv.slice(2);
if (!traumDatei || !refDatei) {
  console.error("Aufruf: bun scripts/modell-ab.mjs <traum.json> <referenz.png> [modell-slug]");
  process.exit(1);
}
const MODELL = slugArg || "fal-ai/nano-banana-2";
const KEY = process.env.FAL_KEY;
if (!KEY) { console.error("FAL_KEY fehlt."); process.exit(1); }

/* Einkaufspreise je Bild bei 1K (fal.ai, Stand 19.08.2026 — Quelle:
   docs/plans/2026-08-19-bildmodelle-preise.md und der Kopf von server.js). */
const PREIS = {
  "google/nano-banana-2-lite": 0.042,
  "fal-ai/nano-banana-2": 0.08,
  "fal-ai/bytedance/seedream/v5/lite": 0.035,
  "fal-ai/bytedance/seedream/v5/pro": 0.0675,
};

/* Seedream spricht ein anderes Adressformat als Nano Banana: kein
 * `aspect_ratio`, sondern `image_size` — und es hat eine UNTERGRENZE von
 * 2560×1440 Gesamtpixeln (fal-Schema, geprüft 23.08.2026). Ein 9:16-Bild
 * an genau dieser Grenze ist 1440×2560; alles Kleinere würde fal ohnehin
 * hochskalieren. Wir setzen die Maße deshalb selbst, statt ein Preset zu
 * raten — sonst vergleicht man am Ende zwei Auflösungen statt zwei Modelle.
 *
 * ⚠ Damit ist die Auflösung die EINE Ungleichheit, die dieser Vergleich
 * nicht wegbekommt: Nano Banana Lite liefert 1K, Seedream mindestens 2K.
 * Das gehört in jede Bewertung des Ergebnisses hinein. */
const SEEDREAM_MASSE = {
  "9:16": { width: 1440, height: 2560 },
  "16:9": { width: 2560, height: 1440 },
  "1:1":  { width: 1920, height: 1920 },
};
const istSeedream = (slug) => slug.includes("seedream");

/* Dateiname aus dem Slug. NICHT nur das letzte Wegstück: bei
 * `.../seedream/v5/lite` hieße das „lite" — und läge damit im selben Ordner
 * wie eine spätere Nano-Banana-Lite-Messung. Der ganze Slug, entschärft. */
const dateiName = (slug) => slug.replace(/^fal-ai\//, "").replace(/[^a-z0-9]+/gi, "-");

const traum = JSON.parse(readFileSync(traumDatei, "utf8"));
const beats = traum.analysis?.beats || [];
const stil = traum.style || traum.analysis?.style || "dreamlike";
const format = traum.format || "9:16";

// Die Referenz als data-URI — genau wie der Server es tut.
const refBytes = readFileSync(resolve(refDatei));
const refUri = `data:image/png;base64,${refBytes.toString("base64")}`;

// Die Bindungsklausel für die Besetzung, aus derselben Funktion wie die App.
const tags = (traum.references || []).map((r) => r.tag);
const { clauses } = buildReferences(
  tags.map((tag) => ({ kind: "person", avatar: { tag, desc: "", img: refUri } })),
);

console.log(`\nModell:   ${MODELL}`);
console.log(`Traum:    ${traum.title}`);
console.log(`Referenz: ${refDatei} (${Math.round(refBytes.length / 1024)} KB)`);
console.log(`Szenen:   ${beats.length} · Stil ${stil} · ${format}\n`);

async function rendern(prompt, bilder) {
  const res = await fetch(`https://queue.fal.run/${MODELL}/edit`, {
    method: "POST",
    headers: { Authorization: `Key ${KEY}`, "content-type": "application/json" },
    body: JSON.stringify(
      istSeedream(MODELL)
        ? { prompt, image_urls: bilder, image_size: SEEDREAM_MASSE[format] || SEEDREAM_MASSE["9:16"] }
        : { prompt, image_urls: bilder, aspect_ratio: format },
    ),
  });
  if (!res.ok) throw new Error(`Submit ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const { status_url, response_url } = await res.json();

  for (let i = 0; i < 150; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const st = await (await fetch(status_url, { headers: { Authorization: `Key ${KEY}` } })).json();
    if (st.status === "COMPLETED") break;
    if (st.status === "FAILED") throw new Error("FAILED");
  }
  const data = await (await fetch(response_url, { headers: { Authorization: `Key ${KEY}` } })).json();
  const url = data?.images?.[0]?.url;
  if (!url) throw new Error("keine Bild-URL in der Antwort");
  return url;
}

const OUT = resolve(import.meta.dir, "..", "media", "ab-test");
await Bun.write(resolve(OUT, ".keep"), "");

let anker = null;      // der vorige Frame, als data-URI
let gerendert = 0;
for (let i = 0; i < beats.length; i++) {
  const prompt = buildImagePrompt({
    beat: beats[i], styleId: stil, format, clauses,
    index: i + 1, total: beats.length, prevFrame: !!anker,
  });
  // Reihenfolge wie im Server: Besetzung zuerst, Anker als LETZTES Bild.
  const bilder = anker ? [refUri, anker] : [refUri];
  process.stdout.write(`Szene ${i + 1}/${beats.length} … `);
  try {
    const url = await rendern(prompt, bilder);
    const bytes = new Uint8Array(await (await fetch(url)).arrayBuffer());
    const ziel = resolve(OUT, `${dateiName(MODELL)}-${i + 1}.png`);
    await Bun.write(ziel, bytes);
    anker = `data:image/png;base64,${Buffer.from(bytes).toString("base64")}`;
    gerendert++;
    console.log(`fertig (${Math.round(bytes.length / 1024)} KB)`);
  } catch (e) {
    console.log(`gescheitert: ${e.message}`);
  }
}

const stueck = PREIS[MODELL];
console.log(`\n${gerendert} Bilder in media/ab-test/`);
if (stueck) {
  const lite = PREIS["google/nano-banana-2-lite"] * gerendert;
  const voll = stueck * gerendert;
  console.log(`Einkauf dieses Laufs: ${gerendert} × $${stueck.toFixed(3)} = $${voll.toFixed(2)}`);
  console.log(`Zum Vergleich Lite:   ${gerendert} × $0.042 = $${lite.toFixed(2)}`);
  const delta = Math.round((stueck / 0.042 - 1) * 100);
  console.log(`Unterschied je Bild:  $${(stueck - 0.042).toFixed(3)} (${Math.abs(delta)} % ${delta >= 0 ? "teurer" : "billiger"})`);
}
