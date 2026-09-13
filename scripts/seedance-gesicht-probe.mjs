/* Nimmt Seedance 2.5 bei Replicate dieses Gesicht an? (13.09.2026)
 *
 *   bun scripts/seedance-gesicht-probe.mjs <bild.jpg>
 *
 * Schickt EINEN 4-s-Auftrag (480p, 9:16, ohne Ton) mit dem Bild als
 * Referenz an Replicate. ⚠ Kostet Geld, wenn er angenommen wird: rund $0,41.
 * Eine Ablehnung ist bei Replicate kostenlos. Nur mit Fotos, deren
 * abgebildete Person zugestimmt hat. Ergebnis und Log landen neben dem Bild
 * (<bild>.probe.json, <bild>.probe.mp4). Hintergrund und erster Lauf:
 * docs/plans/2026-09-13-bildpruefung-seedance.md. Liest REPLICATE_TOKEN
 * aus .env — der Schlüssel verlässt den Rechner nur Richtung Replicate. */
import { readFileSync, writeFileSync } from "node:fs";

const file = process.argv[2];
if (!file) { console.error("Aufruf: bun scripts/seedance-gesicht-probe.mjs <bild.jpg>"); process.exit(1); }
const env = Object.fromEntries(readFileSync(new URL("../.env", import.meta.url), "utf8").split("\n").filter((l) => /^[A-Z_]+=/.test(l)).map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1).replace(/^"|"$/g, "")]; }));
if (!env.REPLICATE_TOKEN) { console.error("REPLICATE_TOKEN fehlt in .env"); process.exit(1); }
const mime = file.endsWith(".png") ? "image/png" : "image/jpeg";
const img = `data:${mime};base64,` + readFileSync(file).toString("base64");
const auth = { Authorization: `Bearer ${env.REPLICATE_TOKEN}` };
const t0 = Date.now();
const log = (...a) => console.log(`[${((Date.now() - t0) / 1000).toFixed(1)}s]`, ...a);

const res = await fetch("https://api.replicate.com/v1/models/bytedance/seedance-2.5/predictions", {
  method: "POST",
  headers: { ...auth, "content-type": "application/json" },
  body: JSON.stringify({ input: { prompt: "[Image1] The person from the reference slowly looks up and smiles softly, warm light, static camera.", reference_images: [img], duration: 4, resolution: "480p", aspect_ratio: "9:16", generate_audio: false } }),
});
let p = await res.json();
log("angelegt", res.status, p.id ?? "", p.status ?? "", p.error || p.detail || "");
while (p.id && !["succeeded", "failed", "canceled"].includes(p.status) && Date.now() - t0 < 12 * 60_000) {
  await new Promise((r) => setTimeout(r, 2500));
  const prev = p.status;
  p = await (await fetch(`https://api.replicate.com/v1/predictions/${p.id}`, { headers: auth })).json();
  if (p.status !== prev) log("status", p.status, p.error || "");
}
log("ENDE", p.status, p.error ? `Fehler: ${p.error}` : "", p.output || "");
const { input, ...rest } = p;
writeFileSync(`${file}.probe.json`, JSON.stringify({ ...rest, input: input ? { ...input, reference_images: ["<bild>"] } : undefined }, null, 2));
if (typeof p.output === "string") writeFileSync(`${file}.probe.mp4`, Buffer.from(await (await fetch(p.output)).arrayBuffer()));
