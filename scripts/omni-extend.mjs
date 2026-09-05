/* Probe 2: die ECHTE Kette. Ein hochgeladenes Video (≤ 10 s) mit
 * task:"extend" fortsetzen — der andere Weg neben previous_interaction_id.
 *
 * Warum (gemessen 05.09.2026): Zwei Verlängerungen über die Vorgänger-ID
 * hingen BEIDE am ersten Clip (Bildabweichung 13,7/255 zu Teil 1, 63/255 zu
 * Teil 2). Der Verlauf gibt dem Modell offenbar immer das Originalvideo als
 * Kontext — „last 10s of your ORIGINAL video". Eine Kette über 30 Sekunden
 * geht also nur, wenn man das verlängerte Video selbst wieder hineingibt.
 *
 * ⚠ KOSTET GELD (≈ $0,35 je 10 s bei 360p). Nur mit --ja.
 * Aufruf: bun scripts/omni-extend.mjs --ja --video <clip.mp4> --prompt <n> [--res 360p]
 */
import { readFileSync, writeFileSync } from "fs";
const args = process.argv.slice(2);
const flag = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
if (!args.includes("--ja")) { console.error("Kostet Geld. --ja."); process.exit(1); }
const KEY = readFileSync(".env", "utf8").match(/^GEMINI_KEY\s*=\s*(.+)$/m)?.[1].trim().replace(/^["']|["']$/g, "");
const VIDEO = flag("--video"); const RES = flag("--res", "360p"); const N = Number(flag("--prompt", "3"));
const TEXT = flag("--text", null);      // Prompt-Ersatz zum Einkreisen einer Blockade
const DAUER = flag("--dauer", "10s");
const bogenB64 = readFileSync("media/2jlggrkkp3492.png").toString("base64");
const ICH = "<IMAGE_REF_0>";
const STIL = "Surreal dream film, natural colour with slightly heightened saturation, soft directional daylight, stable picture, sharp clarity. No text, no captions, no subtitles anywhere in the frame.";
const PROMPTS = {
  3: `Continue directly from the last frame of the video, same dreamer (${ICH}) at the open window, same daylight. The plane descends towards something like a space station: a wide concrete field with aeroplane-shaped dugouts sunk into the ground, planes drifting slowly over the bays and dropping into them. Two planes ahead race for the same empty bay, honking like cars, until one peels away. Our plane settles gently into its own bay; the dreamer sits back from the window, exhales, and the picture comes to rest on his face looking out at the quiet field. One unbroken take, camera at 47 degrees field of view. ${STIL}`,
};

/* Files API, resumable upload in zwei Schritten (Start → Bytes). */
async function upload(pfad) {
  const bytes = readFileSync(pfad);
  const start = await fetch(`https://generativelanguage.googleapis.com/upload/v1beta/files?key=${KEY}`, {
    method: "POST",
    headers: {
      "X-Goog-Upload-Protocol": "resumable", "X-Goog-Upload-Command": "start",
      "X-Goog-Upload-Header-Content-Length": String(bytes.length),
      "X-Goog-Upload-Header-Content-Type": "video/mp4", "content-type": "application/json",
    },
    body: JSON.stringify({ file: { display_name: "kontext" } }),
  });
  const url = start.headers.get("x-goog-upload-url");
  if (!url) throw new Error("kein Upload-URL: " + start.status + " " + (await start.text()).slice(0, 300));
  const fin = await fetch(url, {
    method: "POST",
    headers: { "Content-Length": String(bytes.length), "X-Goog-Upload-Offset": "0", "X-Goog-Upload-Command": "upload, finalize" },
    body: bytes,
  });
  const info = await fin.json();
  const f = info.file;
  console.log(`hochgeladen: ${f.name} (${f.state})`);
  for (let i = 0; i < 40 && f.state !== "ACTIVE"; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const m = await (await fetch(`https://generativelanguage.googleapis.com/v1beta/files/${f.name.split("/").pop()}?key=${KEY}`)).json();
    f.state = m.state; f.uri = m.uri || f.uri;
  }
  console.log(`bereit: ${f.uri} (${f.state})`);
  return f;
}

const file = await upload(VIDEO);
/* ⚠ „Input blocked … sensitive words" (05.09.): Derselbe Prompt-Text lief
   über die Vorgänger-ID durch — geblockt wurde er erst mit hochgeladenem
   Video UND Gesichtsreferenz. Die Meldung ist generisch; der Auslöser wird
   kostenlos eingekreist (ein Input-Block rendert nichts): erst ohne
   Referenzbild, dann zusätzlich ohne Referenz-Tag im Text. */
const v = { type: "video", uri: file.uri, mime_type: "video/mp4" };
const bild = { type: "image", data: bogenB64, mime_type: "image/png" };
const ohneRef = (t) => t.replace(/\[# References[^\]]*\]\s*/g, "").replace(/\s*\(<IMAGE_REF_0>\)/g, "").replace(/<IMAGE_REF_0>/g, "the same man as before");
const eingaben = [
  { name: "Video + Bogen + Ref-Tag", input: [v, bild, { type: "text", text: (TEXT || PROMPTS[N]) }] },
  { name: "Video + Text mit Ref-Tag, OHNE Bogen", input: [v, { type: "text", text: ohneRef((TEXT || PROMPTS[N])).replace("the same man as before", "the same man") }] },
  { name: "Video + Text ohne jede Referenz", input: [v, { type: "text", text: ohneRef((TEXT || PROMPTS[N])) }] },
];
let data = null;
for (const e of eingaben) {
  console.log(`→ ${e.name}`);
  /* ⚠ Beim Extend-Task darf das Seitenverhältnis NICHT gesetzt sein („Aspect
     ratio cannot be set in response format for extend task", 05.09.) — das
     Format erbt vom Video. Was die API sonst noch ablehnt, wird aus der
     Meldung gelesen und entfernt; ein 400 kommt in einer Sekunde und kostet
     nichts, also probieren statt raten. */
  const body = {
    model: "gemini-omni-1.1-flash",
    input: e.input,
    response_format: { type: "video", resolution: RES, duration: DAUER },
    generation_config: { video_config: { task: "extend" } },
  };
  let text = "", res = null, sek = "0";
  for (let versuch = 0; versuch < 4; versuch++) {
    const t0 = Date.now();
    res = await fetch(`https://generativelanguage.googleapis.com/v1beta/interactions?key=${KEY}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    text = await res.text(); sek = ((Date.now() - t0) / 1000).toFixed(0);
    if (res.ok) break;
    const verboten = text.match(/(\w+) cannot be set/i)?.[1] || text.match(/Unknown parameter '([^'.]+)'$/)?.[1];
    const feld = verboten && (verboten === "Aspect" ? "aspect_ratio" : verboten.toLowerCase());
    if (res.status === 400 && feld && feld in body.response_format) {
      console.log(`· ${feld} entfernt (API: ${text.match(/"message":"([^"]+)"/)?.[1]})`);
      delete body.response_format[feld]; continue;
    }
    break;
  }
  if (res.ok) { data = JSON.parse(text); console.log(`✓ HTTP 200 nach ${sek}s: ${e.name}`); data.__eingabe = e.name; break; }
  console.log(`· HTTP ${res.status} nach ${sek}s — ${text.match(/"message":"([^"]{0,140})/)?.[1]}`);
  if (!/content_blocked|Input blocked/.test(text)) { console.error(text.slice(0, 1500)); process.exit(2); }
}
if (!data) process.exit(3);
let teil = null;
for (const s of (data.steps || [])) for (const c of (s.content || [])) if (c.type === "video") teil = c;
if (!teil?.data) { console.error("kein Inline-Video:", JSON.stringify(data).slice(0, 800)); process.exit(4); }
const out = flag("--out", `media/omni-kette-teil${N}.mp4`);
writeFileSync(out, Buffer.from(teil.data, "base64"));
console.log("gespeichert:", out, "| Eingabe:", data.__eingabe, "| usage:", JSON.stringify(data.usage?.output_tokens_by_modality || data.usage || null));
