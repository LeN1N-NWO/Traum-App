/* The only place the client talks to the server.
 *
 * API_BASE is configurable because a Capacitor bundle will not run on the same
 * origin as the server. Keys live in server.js only — never here, never in
 * the bundle.
 */
import { t } from "../i18n/index.js";

const API_BASE = import.meta.env.VITE_API_BASE || "";

/* Where a stored media path actually lives.
 *
 * Generated files are kept by the server and referenced as "/media/<name>",
 * which is what goes into the journal: a relative path survives the server
 * moving or the app being wrapped, an absolute one would not. It is resolved
 * against API_BASE here, at render time — a Capacitor bundle does not run on
 * the server's origin. Anything else (an old fal.ai URL, a data URI) is
 * handed back untouched.
 */
export function mediaUrl(u) {
  return typeof u === "string" && u.startsWith("/media/") ? `${API_BASE}${u}` : u;
}

async function post(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error || t.errors.serverStatus(res.status));
  return data;
}

/** The one LLM call per dream: polished text, people, places, beats, style. */
export async function analyze(dream) {
  const data = await post("/api/analyze", { dream });
  if (!data?.analysis?.text) throw new Error(t.errors.unexpected);
  return data.analysis;
}

/** Rework an existing dream. mode: "correct" | "rewrite" | "elaborate". */
export async function refine(dream, mode) {
  const data = await post("/api/refine", { dream, mode });
  if (typeof data?.text !== "string") throw new Error(t.errors.unexpected);
  return data.text;
}

/** Dictation: audio as a base64 data URI in, spoken words as text out. */
export async function transcribe(audio) {
  const data = await post("/api/transcribe", { audio });
  if (typeof data?.text !== "string") throw new Error(t.errors.unexpected);
  return data.text;
}

/* Renders images or a film. `prompt` overrides the server's own wording.
 *
 * Two shapes come back, because the two jobs are nothing alike in length:
 *   images → { urls }   — seconds, worth waiting for
 *   film   → { jobId }  — minutes (a 15s render measured 280s), so the
 *                         server queues it and we collect it afterwards.
 */
export async function generate({ dream, mode, cast, prompt, seconds, aspectRatio, keyframe }) {
  const data = await post("/api/generate", { dream, mode, cast, prompt, seconds, aspectRatio, keyframe });
  if (Array.isArray(data?.urls)) return { urls: data.urls };
  if (typeof data?.jobId === "string") return { jobId: data.jobId };
  throw new Error(t.errors.unexpected);
}

/** Ein Referenzbild aus einer Beschreibung — der Charakterbogen.
 *  Gibt einen /media/-Pfad zurück, also genau das, was auch ein hochgeladenes
 *  Foto wäre: ab hier behandelt alles Weitere beides gleich. */
export async function characterSheet({ desc, category }) {
  const data = await post("/api/character", { desc, category });
  const url = Array.isArray(data?.urls) ? data.urls[0] : null;
  if (typeof url !== "string") throw new Error(t.errors.unexpected);
  return url;
}

/** Store one cropped grid panel and get back its own /media/ path — the
 *  same kind of path a normal generation returns, so everything downstream
 *  (the journal, the carousel, sharing) treats it identically. */
export async function uploadPanel(blob) {
  const res = await fetch(`${API_BASE}/api/panel`, {
    method: "POST",
    headers: { "content-type": blob.type || "image/png" },
    body: blob,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || typeof data?.url !== "string") throw new Error(data?.error || t.errors.serverStatus(res.status));
  return data.url;
}

/** Haengt den Abspann an einen bereits gerenderten Film und gibt den Pfad
 *  der neuen Datei zurueck. Wirft, wenn der Server es nicht kann (501) —
 *  share.js faengt das ab und teilt dann das Original. */
export async function filmWithOutro(film, card) {
  const data = await post("/api/film-outro", { film, card });
  if (typeof data?.url !== "string") throw new Error(t.errors.unexpected);
  return data.url;
}

/** Where a queued film stands: "pending" | "done" | "failed" | "unknown". */
export async function jobStatus(id) {
  const res = await fetch(`${API_BASE}/api/job?id=${encodeURIComponent(id)}`);
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error || t.errors.serverStatus(res.status));
  return data;
}
