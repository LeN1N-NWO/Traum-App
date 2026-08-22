#!/usr/bin/env bun
/* Die Stimmproben EINMAL erzeugen und mitliefern — Antons Wunsch vom
 * 22.08.2026: „Diese Stimmenauswahl würde ich gerne bei uns schon
 * abspeichern, damit das nicht immer neu geladen wird."
 *
 * Bisher: Die erste Person, die eine Stimme antippt, wartet auf Gemini; der
 * Server legt die WAV daneben (media/) und alle danach bekommen sie sofort.
 * Das ist gut — solange der Ordner lebt. Er lebt aber nur auf DIESEM Rechner,
 * und jede frische Installation fängt wieder bei null an.
 *
 * Also: hier erzeugen, nach public/voice/ legen, mitliefern. Ab dann braucht
 * die Stimmenauswahl weder Gemini-Schlüssel noch Netz — server.js greift
 * zuerst dorthin (voiceSample()).
 *
 * Aufruf (der Dev-Server muss laufen, er hält den Schlüssel):
 *     bun scripts/make-voice-samples.mjs            # en + de
 *     bun scripts/make-voice-samples.mjs --all      # alle sieben Sprachen
 *
 * Kosten: ein TTS-Aufruf je Stimme und Sprache, EINMALIG. Keine Credits —
 * das ist unsere Rechnung bei Google, nicht die des Menschen.
 */
import { mkdir, writeFile, unlink } from "node:fs/promises";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { VOICES } from "../src/lib/voices.js";

const API = process.env.API_PORT ? `http://127.0.0.1:${process.env.API_PORT}` : "http://127.0.0.1:8100";
const LANGS = process.argv.includes("--all")
  ? ["en", "de", "es", "fr", "zh", "hi", "ar"]
  : ["en", "de"];        // Übersetzungs-Stopp: gepflegt werden zwei (AGENTS.md)

const OUT = resolve(import.meta.dir, "..", "public", "voice");

/* WAV ist, was Gemini liefert: ~300 KB je Probe, also 3,6 MB für zwölf
 * Dateien — zu viel für ein App-Bündel, in dem sie nur zum Reinhören sind.
 * AAC bei 48 kbit/s macht daraus ~25 KB, hörbar identisch für eine Stimmprobe.
 * Ohne Konverter wird die WAV genommen: lieber groß als gar nicht. */
function toM4a(wavPath, m4aPath) {
  for (const [cmd, args] of [
    ["afconvert", ["-f", "m4af", "-d", "aac", "-b", "48000", wavPath, m4aPath]],
    ["ffmpeg", ["-y", "-loglevel", "error", "-i", wavPath, "-c:a", "aac", "-b:a", "48k", m4aPath]],
  ]) {
    const r = spawnSync(cmd, args, { stdio: "ignore" });
    if (r.status === 0) return true;
  }
  return false;
}

await mkdir(OUT, { recursive: true });
let gemacht = 0, gescheitert = 0;

for (const v of VOICES) {
  for (const lang of LANGS) {
    const url = `${API}/api/voice-sample?voice=${encodeURIComponent(v.id)}&lang=${lang}`;
    const res = await fetch(url).catch((e) => ({ ok: false, statusText: e.message }));
    if (!res.ok) {
      console.error(`✗ ${v.id}/${lang}: ${res.status || ""} ${res.statusText || ""}`.trim());
      gescheitert++;
      continue;
    }
    const wavPath = resolve(OUT, `${v.id}-${lang}.wav`);
    await writeFile(wavPath, Buffer.from(await res.arrayBuffer()));
    const m4aPath = resolve(OUT, `${v.id}-${lang}.m4a`);
    if (toM4a(wavPath, m4aPath)) await unlink(wavPath);
    console.log(`✓ ${v.id}/${lang}`);
    gemacht++;
  }
}

console.log(`\n${gemacht} Proben in public/voice/${gescheitert ? `, ${gescheitert} gescheitert` : ""}`);
console.log("Sie werden mit eingecheckt und ab sofort ohne Netz ausgeliefert.");
