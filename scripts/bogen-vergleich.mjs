#!/usr/bin/env bun
/* Derselbe Charakterbogen, mehrere Modelle — aus DEMSELBEN Foto.
 *
 * Antons Auftrag (23.08.2026): „Ich hab ein Problem mit dem Charakterbogen …
 * der sieht noch nicht so arg wie ich, und da schleicht sich schon jetzt der
 * Fehler ein." Er hat recht, und der Befund ist struktureller, als er klingt:
 *
 * ⚠ DER BOGEN IST DAS NADELÖHR DER GANZEN ÄHNLICHKEIT. Jedes Szenenbild
 * referenziert den BOGEN, nicht das Foto (sheets.js: `renderRef`). Wer den
 * Bogen mit dem schwächsten Modell macht und die Szenen mit dem stärksten,
 * hat trotzdem die Ähnlichkeit des schwächsten — nur teurer gerendert. Ein
 * Fehler an dieser Stelle vervielfältigt sich über jedes Bild jedes Traums
 * und bleibt, bis das Foto neu hochgeladen wird.
 *
 * Deshalb ist der Bogen die eine Stelle, an der Sparen falsch ist. Dieses
 * Skript misst, was die Stufen wirklich bringen.
 *
 * ⚠ KOSTET GELD. Der Preis steht vor dem ersten Aufruf und braucht --ja.
 *
 *   bun scripts/bogen-vergleich.mjs <foto> [--ja]
 */
import { resolve, extname } from "node:path";
import { readFileSync } from "node:fs";
import { buildSheetFromPhotoPrompt } from "../src/lib/promptBuilder.js";
import { imageModel, imageSubmitBody, imagePrice } from "../src/lib/imageModel.js";

const [foto, ...rest] = process.argv.slice(2);
const JA = rest.includes("--ja");
/* Nur EIN Kandidat, wenn man ihn nennt: `--nur=gpt-image-2`. Ein zweites
   Modell mitzurendern, das man gar nicht sehen will, ist bezahltes Rauschen. */
const NUR = (rest.find((r) => r.startsWith("--nur=")) || "").split("=")[1] || null;
if (!foto) { console.error("Aufruf: bun scripts/bogen-vergleich.mjs <foto> [--ja]"); process.exit(1); }
const KEY = process.env.FAL_KEY;
if (!KEY) { console.error("FAL_KEY fehlt."); process.exit(1); }

/* Die Kandidaten. „Günstigste Ausführung" ist Antons Vorgabe — mit der
 * ausdrücklichen Gegenprobe oben im Kopf: Wenn low nicht trifft, ist die
 * Antwort nicht „nochmal low", sondern eine Stufe höher. */
const ALLE = [
  { id: "nano-banana-pro", stufe: "1K", feld: "resolution" },
  /* ⚠ Masz ausdruecklich setzen. GPTs Preset `landscape_16_9` ist 1024x576 —
     fuer einen Bogen, aus dem spaeter JEDES Gesicht gezogen wird, viel zu
     wenig. 1920x1080 ist die naechste echte 16:9-Zeile der Preistabelle. */
  { id: "gpt-image-2", stufe: "low", feld: "quality", size: { width: 1920, height: 1080 } },
];
const KANDIDATEN = NUR ? ALLE.filter((k) => k.id === NUR) : ALLE;
if (!KANDIDATEN.length) { console.error(`Kein Kandidat "${NUR}".`); process.exit(1); }

/* Genau die Beschreibung, die auch die App mitschickt — der Bogen soll das
   zeigen, was auf dem Foto zu sehen ist, nicht was ich mir denke. Leer
   lassen heißt: das Modell entscheidet über Kleidung, und dann trägt die
   Figur in jedem Traum etwas Erfundenes. */
const BESCHREIBUNG = process.env.BOGEN_DESC || "";

const bytes = readFileSync(resolve(foto));
const typ = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
              ".webp": "image/webp" }[extname(foto).toLowerCase()] || "image/jpeg";
const fotoUri = `data:${typ};base64,${bytes.toString("base64")}`;
const prompt = buildSheetFromPhotoPrompt({ desc: BESCHREIBUNG, category: "person" });

const summe = KANDIDATEN.reduce((n, k) => n + imagePrice(k.id, k.stufe, k.size), 0);
console.log(`\n╔══ Charakterbogen aus einem Foto ═════════════════════════`);
console.log(`║ Foto     ${foto} (${Math.round(bytes.length / 1024)} KB)`);
for (const k of KANDIDATEN) {
  console.log(`║ ${imageModel(k.id).label.padEnd(18)} ${k.stufe.padEnd(6)} $${imagePrice(k.id, k.stufe, k.size).toFixed(3)}`);
}
console.log(`║ SUMME    $${summe.toFixed(3)}`);
console.log(`╚══════════════════════════════════════════════════════════\n`);
if (!JA) { console.log("Nichts gerendert. Mit --ja wiederholen.\n"); process.exit(0); }

const OUT = resolve(import.meta.dir, "..", "media", "ab-test", "bogen");

async function bogen(k) {
  const { model, input } = imageSubmitBody(k.id, {
    prompt, imageUrls: [fotoUri], aspectRatio: "16:9",   // zwei Panels nebeneinander
    size: k.size || null, [k.feld]: k.stufe,
  });
  const res = await fetch(`https://queue.fal.run/${model}`, {
    method: "POST",
    headers: { Authorization: `Key ${KEY}`, "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) return console.log(`${k.id}: Submit ${res.status} ${(await res.text()).slice(0, 160)}`);
  const { status_url, response_url } = await res.json();
  for (let i = 0; i < 200; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const st = await (await fetch(status_url, { headers: { Authorization: `Key ${KEY}` } })).json();
    if (st.status !== "IN_PROGRESS" && st.status !== "IN_QUEUE") break;
  }
  const roh = await (await fetch(response_url, { headers: { Authorization: `Key ${KEY}` } })).text();
  const d = (() => { try { return JSON.parse(roh); } catch { return null; } })();
  const u = d?.images?.[0]?.url;
  if (!u) return console.log(`${k.id}: ${roh.includes("content_policy") ? "abgelehnt" : roh.slice(0, 160)}`);
  const out = new Uint8Array(await (await fetch(u)).arrayBuffer());
  await Bun.write(resolve(OUT, `${k.id}-${k.stufe}.png`), out);
  console.log(`${k.id} (${k.stufe}): fertig — ${Math.round(out.length / 1024)} KB`);
}

// Unabhängig voneinander, also parallel — nacheinander wäre nur Wartezeit.
await Promise.all(KANDIDATEN.map(bogen));
console.log(`\nAlles in media/ab-test/bogen/ · bezahlt $${summe.toFixed(3)}\n`);
