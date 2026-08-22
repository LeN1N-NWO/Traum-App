#!/usr/bin/env bun
/* Klang-Kandidaten für die Einschlaf-Presets sammeln (Antons Auftrag
 * 22.08.2026: „Such eigenständig nach und präsentiere mir Varianten, welche
 * ich dann selber abmischen und loopen werde. Bitte downloaden und ablegen,
 * so gut es geht, ansonsten Links.")
 *
 * ⚠ AUSSCHLIESSLICH CC0. Der Suchfilter ist nicht Bequemlichkeit, sondern
 * die Lizenzentscheidung: Unser Mixer liefert die Datei als Datei aus, damit
 * man sie abspielt — das ist genau das, was „royalty-free, aber keine
 * Weitergabe as standalone" (Pixabay, Mixkit) verbietet. CC0 ist
 * Gemeinfreiheit: weitergeben ausdrücklich erlaubt, keine Namensnennung
 * nötig. Wer diesen Filter lockert, muss vorher einen Anwalt fragen.
 *
 * Heruntergeladen werden Freesounds HQ-VORSCHAUEN (MP3). Sie sind zum
 * Anhören und Auswählen da. Was Anton behält, holt er als Original (WAV)
 * über sein eigenes Freesound-Konto — die Vorschau ist die Auswahlhilfe,
 * nicht das Endprodukt.
 *
 * Ablage: media/klang-kandidaten/<thema>/ — media/ ist ignoriert, die
 * Dateien bleiben also auf diesem Rechner und blähen das Repo nicht auf.
 * Die Liste mit Quellen und Lizenz landet als Markdown im Plan.
 *
 *   bun scripts/klang-kandidaten.mjs
 */
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const THEMEN = [
  { id: "regen",   q: "rain",          titel: "Regen" },
  { id: "gewitter",q: "thunderstorm",  titel: "Gewitter" },
  { id: "zug",     q: "train interior",titel: "Zugfahrt" },
  { id: "meer",    q: "ocean waves",   titel: "Meer" },
  { id: "wind",    q: "wind",          titel: "Wind" },
  { id: "feuer",   q: "fireplace",     titel: "Kaminfeuer" },
  { id: "nacht",   q: "crickets night",titel: "Nachtgrillen" },
];

const PRO_THEMA = 4;
const OUT = resolve(import.meta.dir, "..", "media", "klang-kandidaten");
const UA = { "user-agent": "Mozilla/5.0 (DreamRushes Kandidatensuche)" };

const holen = async (url) => (await fetch(url, { headers: UA })).text();
const entschaerfen = (s) => String(s).replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&#39;/g, "'").trim();

/* Dauer in Sekunden aus der Seite — für eine Schleife taugt nur, was lang
   genug ist; unter 15 Sekunden hört man die Naht. */
function dauerAus(html) {
  const m = /"duration"\s*:\s*([0-9.]+)/.exec(html) || /(\d+):(\d{2})\s*<\/span>/.exec(html);
  if (!m) return null;
  return m[2] !== undefined && m[2].length === 2 ? Number(m[1]) * 60 + Number(m[2]) : Number(m[1]);
}

await mkdir(OUT, { recursive: true });
const gefunden = [];

for (const thema of THEMEN) {
  const suche = `https://freesound.org/search/?q=${encodeURIComponent(thema.q)}`
    + `&f=${encodeURIComponent('license:"Creative Commons 0" duration:[20 TO 300]')}`;
  const html = await holen(suche);
  const pfade = [...new Set([...html.matchAll(/href="(\/people\/[^"]+\/sounds\/\d+\/)"/g)].map((m) => m[1]))];
  await mkdir(resolve(OUT, thema.id), { recursive: true });

  let genommen = 0;
  for (const pfad of pfade) {
    if (genommen >= PRO_THEMA) break;
    const seite = `https://freesound.org${pfad}`;
    const detail = await holen(seite);
    const vorschau = /https:\/\/cdn\.freesound\.org\/previews\/[^"']+?-hq\.mp3/.exec(detail)
      || /https:\/\/cdn\.freesound\.org\/previews\/[^"']+?-lq\.mp3/.exec(detail);
    if (!vorschau) continue;
    /* Gegenprobe zur Suche: Steht auf der Seite selbst CC0? Ein Filter, dem
       man blind glaubt, ist kein Filter. */
    if (!/publicdomain\/zero/.test(detail)) continue;
    const titel = entschaerfen((/<title>([^<]+)<\/title>/.exec(detail)?.[1] || pfad).replace(/\s*\|\s*Freesound.*$/i, ""));
    const id = /sounds\/(\d+)\//.exec(pfad)?.[1];
    const datei = `${thema.id}-${id}.mp3`;

    const bytes = new Uint8Array(await (await fetch(vorschau[0], { headers: UA })).arrayBuffer());
    if (bytes.length < 20_000) continue;                 // offensichtlich kaputt
    await writeFile(resolve(OUT, thema.id, datei), bytes);

    gefunden.push({
      thema: thema.titel, themaId: thema.id, titel, seite, datei,
      kb: Math.round(bytes.length / 1024), sekunden: dauerAus(detail),
    });
    genommen++;
    console.log(`✓ ${thema.titel.padEnd(12)} ${titel.slice(0, 52)}`);
  }
  if (!genommen) console.log(`✗ ${thema.titel}: nichts Passendes in CC0 gefunden`);
}

await writeFile(resolve(OUT, "kandidaten.json"), JSON.stringify(gefunden, null, 2));
console.log(`\n${gefunden.length} Kandidaten in media/klang-kandidaten/`);
