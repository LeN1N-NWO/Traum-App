/* Probe 3: Teil 3 als NEUE Generation ab dem letzten Bild von Teil 2
 * (task "image_to_video"), mit dem Charakterbogen als zweiter Referenz.
 *
 * Warum (gemessen 05.09.2026): Die Verlängerung über die Vorgänger-ID nimmt
 * immer das ERSTE Video als Kontext; die Verlängerung hochgeladener Videos
 * wird mit diesem Konto grundsätzlich blockiert („Input blocked", auch bei
 * einem synthetischen Testbild ohne Person und harmlosem Einzeiler). Bleibt
 * der Weg, den die App ohnehin geht: Startbild = letztes Frame des vorigen
 * Teils. Die Naht ist dann ein Standbild-Match, keine Bewegungskontinuität.
 *
 * ⚠ KOSTET GELD (≈ $0,35 je 10 s bei 360p). Nur mit --ja.
 * Aufruf: bun scripts/omni-i2v.mjs --ja --start <frame.png> --out <ziel.mp4> [--res 360p]
 */
import { readFileSync, writeFileSync } from "fs";
const args = process.argv.slice(2);
const flag = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
if (!args.includes("--ja")) { console.error("Kostet Geld. --ja."); process.exit(1); }
const KEY = readFileSync(".env", "utf8").match(/^GEMINI_KEY\s*=\s*(.+)$/m)?.[1].trim().replace(/^["']|["']$/g, "");
const START = flag("--start"); const OUT = flag("--out", "media/omni-kette-teil3.mp4"); const RES = flag("--res", "360p");
const start = { type: "image", data: readFileSync(START).toString("base64"), mime_type: "image/png" };
const bogen = { type: "image", data: readFileSync("media/2jlggrkkp3492.png").toString("base64"), mime_type: "image/png" };
const STIL = "Surreal dream film, natural colour with slightly heightened saturation, soft directional daylight, stable picture, sharp clarity. No text, no captions, no subtitles anywhere in the frame.";
const text = `<IMAGE_REF_0> is the exact first frame of this shot — begin from it without any change and keep its framing, light and cabin. The man is the dreamer; his face, hair and build match <IMAGE_REF_1> exactly in every frame. One unbroken take, camera at 47 degrees field of view. The plane descends towards something like a space station: a wide concrete field with aeroplane-shaped dugouts sunk into the ground, planes drifting slowly over the bays and dropping into them. Two planes ahead race for the same empty bay, honking like cars, until one peels away. Our plane settles gently into its own bay; the dreamer sits back from the window, exhales, and the picture comes to rest on his face looking out at the quiet field. ${STIL}`;

const body = {
  model: "gemini-omni-1.1-flash",
  input: [start, bogen, { type: "text", text }],
  response_format: { type: "video", resolution: RES, aspect_ratio: "9:16", duration: "10s" },
  generation_config: { video_config: { task: "image_to_video" } },
};
let res, txt, sek;
for (let versuch = 0; versuch < 4; versuch++) {
  const t0 = Date.now();
  res = await fetch(`https://generativelanguage.googleapis.com/v1beta/interactions?key=${KEY}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  txt = await res.text(); sek = ((Date.now() - t0) / 1000).toFixed(0);
  if (res.ok) break;
  const verboten = txt.match(/(\w+) cannot be set/i)?.[1];
  const feld = verboten && (verboten === "Aspect" ? "aspect_ratio" : verboten.toLowerCase());
  if (res.status === 400 && feld && feld in body.response_format) { console.log(`· ${feld} entfernt`); delete body.response_format[feld]; continue; }
  if (res.status === 400 && /Unknown parameter 'generation_config.video_config.task'/.test(txt)) { console.log("· task entfernt"); delete body.generation_config.video_config.task; continue; }
  break;
}
if (!res.ok) { console.error(`✗ HTTP ${res.status} nach ${sek}s\n${txt.slice(0, 900)}`); process.exit(2); }
const data = JSON.parse(txt);
let teil = null;
for (const s of (data.steps || [])) for (const c of (s.content || [])) if (c.type === "video") teil = c;
if (!teil?.data) { console.error("kein Inline-Video:", txt.slice(0, 600)); process.exit(3); }
writeFileSync(OUT, Buffer.from(teil.data, "base64"));
console.log(`✓ HTTP 200 nach ${sek}s → ${OUT} | usage: ${JSON.stringify(data.usage?.output_tokens_by_modality || null)}`);
