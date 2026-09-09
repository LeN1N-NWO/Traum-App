/* ⚠ MODELL GEDROPPT (Anton, 05.09.2026) — dieses Skript ist ein Messprotokoll,
 * kein Werkzeug. Befund und Entscheidung: docs/plans/2026-09-05-gemini-omni-probe.md
 */
/* Probe: Gemini Omni 1.1 Flash über die GOOGLE-API (nicht fal), 360p,
 * ein Traum in DREI Generationen zu je 10 Sekunden — Teil 2 und 3 als
 * Verlängerung des vorigen Clips (previous_interaction_id, task "extend"),
 * jedes Mal mit dem Charakterbogen als Bildreferenz.
 *
 * Antons Auftrag (04.09.2026): „ich will die funktion über google api
 * testen 360p … den traum lift off … bewusst unterteilt auf 30 sek bzw
 * 3 generationen und immer wieder den ersten clip eingeben als reference
 * so wie google das sagt und den weiteren text hinzufügen."
 *
 * ⚠ KOSTET GELD: 3 × 10 s × $0,03 ≈ $0,90 bei 360p (Extend-Preis nicht
 * dokumentiert, vermutlich gleich). Läuft nur mit `--ja`.
 *
 * Aufruf:  bun scripts/omni-probe.mjs --ja [--res 360p] [--teile 3]
 * Ausgabe: media/omni-<zeit>-teil<n>.mp4 + media/omni-<zeit>.log.json
 *
 * Quelle der Anfrageform: ai.google.dev/gemini-api/docs/omni (REST):
 *   POST https://generativelanguage.googleapis.com/v1beta/interactions?key=…
 *   input: [{type:"image",data,mime_type},{type:"text",text}]
 *   response_format: {type:"video",resolution,aspect_ratio}
 *   generation_config: {video_config:{duration:"10s"}}
 *   Extend: previous_interaction_id + video_config.task:"extend"
 *   Antwort: steps[].content[] mit type "video" (data base64 oder uri).
 */
import { readFileSync, writeFileSync, existsSync } from "fs";

const args = process.argv.slice(2);
const flag = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
if (!args.includes("--ja")) {
  console.error("Kostet Geld (≈ $0,90 bei 360p). Bewusst starten mit --ja.");
  process.exit(1);
}
const RES = flag("--res", "360p");
const TEILE = Number(flag("--teile", "3"));

const env = readFileSync(".env", "utf8");
const KEY = env.match(/^GEMINI_KEY\s*=\s*(.+)$/m)?.[1].trim().replace(/^["']|["']$/g, "");
if (!KEY) { console.error("GEMINI_KEY fehlt in .env"); process.exit(1); }

const BOGEN = "media/2jlggrkkp3492.png";
const bogenB64 = readFileSync(BOGEN).toString("base64");

/* Der Traum „Lift Off" (data/traeume/2026-09-03-e_mtlxb972tea3m5.json), in
   drei Abschnitte geschnitten, wie unser Schnitt es täte: Der Kuss am Ende
   (transit, themenfremd) fliegt raus. Fluss-Charakter, weil Anton den
   ganzen Traum in 30 Sekunden will. Hausregeln: erster Frame voll,
   Sichtfeld in Grad, Kontinuität ausgesprochen, kein Text im Bild. */
const ICH = "<IMAGE_REF_0>";
const STIL = "Surreal dream film, natural colour with slightly heightened saturation, soft directional daylight, stable picture, sharp clarity. No text, no captions, no subtitles anywhere in the frame.";

const TEIL = [
  // Teil 1 (0–10 s): Büro → Aufzug → Verwandlung
  `[# References ${ICH}@Image1] The man in ${ICH} is the dreamer; his face, hair and build match the reference exactly in every frame. Everyone else is a stranger and looks nothing like him.
Vertical 9:16, one unbroken take, no cuts. It opens on the dreamer squeezing through an impossibly crowded open-plan office: tiny cubicles packed wall to wall, strangers at every desk, the camera at 47 degrees field of view following him from behind at shoulder height. He reaches a steel lift, steps in among other passengers, turns to them and speaks, visibly uneasy, hands pressing against the closing doors. As the doors shut, the lift walls quietly turn into an aircraft cabin: the steel panels become curved fuselage, a window appears beside him, and through it the office floor drops away as the whole cabin lifts off above a sunlit city. Continuous transformation inside the world, never a cut. ${STIL}`,
  // Teil 2 (10–20 s): Looping → Park → Winken
  `Continue directly from the last frame, same dreamer (${ICH}), same aircraft cabin, same daylight. The playful pilot up front takes the plane into a gentle rollercoaster climb: the cabin tilts, the city rolls through the window, rooftops drift past below the wing. The dreamer's surprise turns into delight. The plane levels out over a green city park; the dreamer opens the window, rests an arm on the sill and waves down, laughing, while dozens of tiny people on the lawn look up and wave back. One unbroken take, camera at 47 degrees field of view moving with him from inside the cabin to just outside the window. ${STIL}`,
  // Teil 3 (20–30 s): Landung → zwei Flugzeuge streiten → Ruhe
  `Continue directly from the last frame, same dreamer (${ICH}) still at the open window, same daylight. The plane descends towards something like a space station: a wide concrete field with aeroplane-shaped dugouts sunk into the ground, planes drifting slowly over the bays and dropping into them. Two planes ahead race for the same empty bay, honking like cars, until one peels away. Our plane settles gently into its own bay; the dreamer sits back from the window, exhales, and the picture comes to rest on his face looking out at the quiet field. One unbroken take, camera at 47 degrees field of view. ${STIL}`,
].slice(0, TEILE);

const URL = `https://generativelanguage.googleapis.com/v1beta/interactions?key=${KEY}`;

/* ⚠ Wo die Dauer hingehört, sagt keine Doku (04.09.2026): Die REST-Beispiele
   setzen nur task/resolution/aspect_ratio, die fal-Fassung nennt `duration`
   3–10 als Top-Level-Feld. Statt zu raten, fragt das Skript die API: Ein
   unbekannter Parameter kommt in einer Sekunde als HTTP 400 „Unknown
   parameter" zurück und kostet nichts. Erst der Treffer rendert — und das
   ist dann Teil 1 mit dem echten Prompt, kein Probe-Prompt. */
const DAUER_KANDIDATEN = [
  ["generation_config.video_config", "duration_seconds", 10],
  ["generation_config.video_config", "duration", "10s"],
  ["generation_config.video_config", "seconds", 10],
  ["generation_config.video_config", "length_seconds", 10],
  ["response_format", "duration_seconds", 10],
  ["response_format", "duration", "10s"],
  ["response_format", "seconds", 10],
  ["top", "duration", 10],
  ["top", "duration_seconds", 10],
  [null, null, null],   // zuletzt: gar kein Dauerfeld, die Vorgabe des Modells
];
let dauerFeld = null;   // der gefundene [ort, name, wert], gilt für alle Teile

function mitDauer(body, kandidat) {
  const [ort, name, wert] = kandidat;
  const b = JSON.parse(JSON.stringify(body));
  if (!ort) return b;
  if (ort === "top") b[name] = wert;
  else if (ort === "response_format") b.response_format[name] = wert;
  else b.generation_config.video_config[name] = wert;
  return b;
}
const stampArg = flag("--weiter", null);
const stamp = stampArg ? stampArg.match(/omni-([^/]+)\.log\.json$/)?.[1] : null
  || new Date().toISOString().replace(/[:.]/g, "").slice(0, 15);
const log = { res: RES, teile: [] };

async function anfrage(body, label) {
  const t0 = Date.now();
  const { __sondiere, ...rein } = body;
  const res = await fetch(URL, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(rein) });
  const text = await res.text();
  const sek = ((Date.now() - t0) / 1000).toFixed(0);
  let data; try { data = JSON.parse(text); } catch { data = null; }
  if (!res.ok) {
    const unbekannt = text.match(/Unknown parameter '([^']+)'/)?.[1];
    if (res.status === 400 && unbekannt && body.__sondiere && unbekannt.endsWith(body.__sondiere)) {
      console.log(`  · ${body.__sondiere} → unbekannt (kostenlos, ${sek}s)`);
      return null;
    }
    console.error(`✗ ${label}: HTTP ${res.status} nach ${sek}s\n${text.slice(0, 1200)}`);
    log.teile.push({ label, status: res.status, fehler: text.slice(0, 2000) });
    log.dauerFeld = dauerFeld;
    writeFileSync(`media/omni-${stamp}.log.json`, JSON.stringify(log, null, 2));
    process.exit(2);
  }
  console.log(`✓ ${label}: HTTP ${res.status} nach ${sek}s, status=${data?.status}, id=${data?.id}`);
  return data;
}

function videoTeil(data) {
  const steps = data?.steps || data?.outputs || [];
  for (const s of steps) for (const c of (s.content || [])) if (c.type === "video") return c;
  // manche Antworten legen die Ausgabe flach ab
  for (const c of (data?.content || data?.output || [])) if (c?.type === "video") return c;
  return null;
}

async function holeVideo(teil, pfad) {
  if (teil.data) { writeFileSync(pfad, Buffer.from(teil.data, "base64")); return "inline"; }
  const uri = teil.uri || teil.file_uri || teil.url;
  if (!uri) throw new Error("kein Video in der Antwort: " + JSON.stringify(teil).slice(0, 300));
  // Files API: erst auf ACTIVE warten, dann herunterladen
  const id = uri.match(/files\/([^/?]+)/)?.[1];
  const meta = `https://generativelanguage.googleapis.com/v1beta/files/${id}?key=${KEY}`;
  for (let i = 0; i < 60; i++) {
    const m = await (await fetch(meta)).json();
    if (m.state === "ACTIVE") break;
    await new Promise((r) => setTimeout(r, 3000));
  }
  const dl = await fetch(`https://generativelanguage.googleapis.com/v1beta/files/${id}:download?alt=media&key=${KEY}`);
  writeFileSync(pfad, Buffer.from(await dl.arrayBuffer()));
  return "uri";
}

/* --weiter <log.json>: Die schon bezahlten Teile stehen im Log — Fortsetzung
   mit der letzten Interaction-ID und dem gefundenen Dauerfeld, statt Teil 1
   ein zweites Mal zu kaufen. (Gemessen 05.09.: Teil 1 lief, Teil 2 scheiterte
   an der Anfrageform — ohne diesen Schalter hätte jeder Fix 30 Cent gekostet.) */
let prev = null;
let start = 0;
const weiter = flag("--weiter", null);
if (weiter && existsSync(weiter)) {
  const alt = JSON.parse(readFileSync(weiter, "utf8"));
  const fertig = (alt.teile || []).filter((t) => t.id && t.pfad);
  if (fertig.length) {
    prev = fertig[fertig.length - 1].id;
    start = fertig.length;
    if (alt.dauerFeld) dauerFeld = alt.dauerFeld;
    log.teile.push(...fertig);
    console.log(`weiter nach Teil ${start} (id ${prev}), Dauerfeld ${JSON.stringify(dauerFeld)}`);
  }
}
for (let i = start; i < TEIL.length; i++) {
  const label = `Teil ${i + 1}/${TEIL.length}`;
  const input = [
    { type: "image", data: bogenB64, mime_type: "image/png" },
    { type: "text", text: TEIL[i] },
  ];
  const body = i === 0
    ? {
        model: "gemini-omni-1.1-flash",
        input,
        response_format: { type: "video", resolution: RES, aspect_ratio: "9:16" },
        generation_config: { video_config: {} },
      }
    : {
        model: "gemini-omni-1.1-flash",
        previous_interaction_id: prev,
        input,
        response_format: { type: "video", resolution: RES, aspect_ratio: "9:16" },
        /* ⚠ KEIN task:"extend" zusammen mit previous_interaction_id — die API
           lehnt das ab („previous_interaction_id is not allowed when video
           task is set", 05.09.). Multi-Turn-Verlängerung läuft allein über
           die Vorgänger-ID; `task: "extend"` ist der andere Weg, für ein per
           Files-API hochgeladenes Video. */
        generation_config: { video_config: {} },
      };
  console.log(`→ ${label} (${i === 0 ? "neu" : "extend von " + prev})…`);
  let data = null;
  if (dauerFeld) {
    data = await anfrage(mitDauer(body, dauerFeld), label);
  } else {
    for (const k of DAUER_KANDIDATEN) {
      const probe = mitDauer(body, k);
      if (k[1]) probe.__sondiere = k[1];
      data = await anfrage(probe, label);
      if (data) { dauerFeld = k; console.log(`  Dauerfeld: ${k[0] || "(keins)"}${k[1] ? "." + k[1] : ""}`); break; }
    }
  }
  if (!data) { console.error("Kein Dauerfeld gefunden und auch ohne keins Ergebnis."); process.exit(4); }
  log.dauerFeld = dauerFeld;
  const teil = videoTeil(data);
  if (!teil) {
    console.error("Antwortform unbekannt:", JSON.stringify(data).slice(0, 1500));
    writeFileSync(`media/omni-${stamp}.log.json`, JSON.stringify({ ...log, antwort: data }, null, 2));
    process.exit(3);
  }
  const pfad = `media/omni-${stamp}-teil${i + 1}.mp4`;
  const weg = await holeVideo(teil, pfad);
  console.log(`  gespeichert: ${pfad} (${weg})`);
  log.teile.push({ label, id: data.id, status: data.status, pfad, weg, usage: data.usage || data.usage_metadata || null });
  prev = data.id;
}
writeFileSync(`media/omni-${stamp}.log.json`, JSON.stringify(log, null, 2));
console.log("fertig:", log.teile.map((t) => t.pfad).join(", "));
