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
/* ⚠ Adresse, Adressformat und Preis kommen aus der Tabelle — seit dem
 * 23.08. gibt es sie (src/lib/imageModel.js). Vorher baute dieses Skript
 * `${slug}/edit` selbst zusammen und kannte eine eigene Preisliste. Beides
 * ging schief, sobald Seedream dazukam: dessen Text-zu-Bild-Endpunkt heisst
 * nicht `<slug>`, und `<slug>/edit` gibt es nur bei Nano Banana. Ein Skript,
 * das seine eigene Wahrheit ueber Endpunkte pflegt, driftet von dem weg,
 * was die App tut — und misst dann etwas anderes als den Alltag. */
import { imageModel, imageSubmitBody, imagePrice, IMAGE_MODELS } from "../src/lib/imageModel.js";
const IMAGE_MODELS_KEYS = Object.keys(IMAGE_MODELS);

const [traumDatei, refDatei, slugArg] = process.argv.slice(2);
if (!traumDatei || !refDatei) {
  console.error("Aufruf: bun scripts/modell-ab.mjs <traum.json> <referenz.png> [modell-slug]");
  process.exit(1);
}
const MODELL = slugArg || "seedream-5-lite";
const m = imageModel(MODELL);
if (m.id !== MODELL) {
  console.error(`Unbekanntes Modell "${MODELL}". Bekannt: ${IMAGE_MODELS_KEYS.join(", ")}`);
  process.exit(1);
}
/* Hoechste Stufe, wo es welche gibt — sonst misst man das Modell in einer
   Aufloesung, die es gar nicht meint. */
const STUFE = m.resolutions ? m.resolutions[m.resolutions.length - 1] : null;
const KEY = process.env.FAL_KEY;
if (!KEY) { console.error("FAL_KEY fehlt."); process.exit(1); }

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

console.log(`\nModell:   ${m.label}${STUFE ? ` · ${STUFE}` : ""}  ($${imagePrice(MODELL, STUFE).toFixed(3)} je Bild)`);
console.log(`Traum:    ${traum.title}`);
console.log(`Referenz: ${refDatei} (${Math.round(refBytes.length / 1024)} KB)`);
console.log(`Szenen:   ${beats.length} · Stil ${stil} · ${format}\n`);

async function rendern(prompt, bilder) {
  const { model, input } = imageSubmitBody(MODELL, {
    prompt, imageUrls: bilder, aspectRatio: format, resolution: STUFE,
  });
  const res = await fetch(`https://queue.fal.run/${model}`, {
    method: "POST",
    headers: { Authorization: `Key ${KEY}`, "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`Submit ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const { status_url, response_url } = await res.json();

  for (let i = 0; i < 200; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const st = await (await fetch(status_url, { headers: { Authorization: `Key ${KEY}` } })).json();
    if (st.status === "COMPLETED" || st.status === "FAILED") break;
  }
  const roh = await (await fetch(response_url, { headers: { Authorization: `Key ${KEY}` } })).text();
  const data = (() => { try { return JSON.parse(roh); } catch { return null; } })();
  const url = data?.images?.[0]?.url;
  // Die Antwort MITSAGEN: eine stumme Absage bei einem bezahlten Aufruf
  // laesst einen blind weiterprobieren, statt zu lesen.
  if (!url) throw new Error(roh.includes("content_policy") ? "abgelehnt (content_policy)" : roh.slice(0, 160));
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

const stueck = imagePrice(MODELL, STUFE);
console.log(`\n${gerendert} Bilder in media/ab-test/`);
console.log(`Einkauf dieses Laufs: ${gerendert} × $${stueck.toFixed(3)} = $${(gerendert * stueck).toFixed(3)}`);
