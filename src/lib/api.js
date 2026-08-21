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

/* Jeder Aufruf hat eine Uhr. Ohne sie wartet fetch unbegrenzt, und ein
 * Server, der nie antwortet (kein Schlüssel, falsches Netz, Dienst weg),
 * wird zur toten Schleife mit Spinner — Antons Befund vom 21.08. in der
 * Cloud-Session. Die Budgets sind bewusst großzügig: ein Bild braucht
 * schon mal 30 Sekunden, der Regisseur (DeepSeek denkt nach) auch länger —
 * die Uhr soll Hänger melden, nicht langsame Erfolge abschießen. */
const TIMEOUTS = { default: 60_000, render: 180_000 };

function friendly(err) {
  // TimeoutError: die Uhr. TypeError: Netz/Server gar nicht erreichbar.
  // Beide heißen für den Menschen dasselbe: keine Antwort, versuch's gleich
  // nochmal — nur ein echter Serverfehler trägt seine eigene Meldung.
  if (err?.name === "TimeoutError" || err instanceof TypeError) {
    return new Error(t.errors.timeout);
  }
  return err;
}

async function post(path, body, { timeout = TIMEOUTS.default } = {}) {
  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeout),
    });
  } catch (err) {
    throw friendly(err);
  }
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

/** Die Reflection zu einem Traum — Spiegel, nicht Orakel. `context` sind
 *  die Musterzeilen aus atlas.js (reflectionContext), gratis wie alle
 *  Textarbeit. */
export async function reflect(dream, context = []) {
  const data = await post("/api/reflect", { dream, context });
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
/* Die Felder stehen hier einzeln statt als durchgereichtes Objekt, damit
 * sichtbar bleibt, was den Server erreicht. Preis dieser Sichtbarkeit: ein
 * neues Feld muss an BEIDEN Stellen stehen, sonst verschwindet es still —
 * `styleId` und `beats` kamen am 19.08.2026 für den Regisseur dazu. */
export async function generate({ dream, mode, cast, prompt, seconds, aspectRatio, keyframe, model, styleId, beats }) {
  const data = await post("/api/generate", { dream, mode, cast, prompt, seconds, aspectRatio, keyframe, model, styleId, beats },
    { timeout: TIMEOUTS.render });
  if (Array.isArray(data?.urls)) return { urls: data.urls };
  if (typeof data?.jobId === "string") return { jobId: data.jobId };
  throw new Error(t.errors.unexpected);
}

/** Ein Referenzbild aus einer Beschreibung — der Charakterbogen.
 *  Gibt einen /media/-Pfad zurück, also genau das, was auch ein hochgeladenes
 *  Foto wäre: ab hier behandelt alles Weitere beides gleich.
 *  Mit `photo` (data:image-URI) wird stattdessen ein vorhandenes Foto zum
 *  Bogen NORMALISIERT (grau, Ganzkörper + Gesicht) — gratis, nur aus einem
 *  bezahlten Render heraus aufgerufen (sheets.js hat die Regeln). */
export async function characterSheet({ desc, category, photo }) {
  const data = await post("/api/character", { desc, category, photo }, { timeout: TIMEOUTS.render });
  const url = Array.isArray(data?.urls) ? data.urls[0] : null;
  if (typeof url !== "string") throw new Error(t.errors.unexpected);
  return url;
}

/** Store one cropped grid panel and get back its own /media/ path — the
 *  same kind of path a normal generation returns, so everything downstream
 *  (the journal, the carousel, sharing) treats it identically. */
export async function uploadPanel(blob) {
  let res;
  try {
    res = await fetch(`${API_BASE}/api/panel`, {
      method: "POST",
      headers: { "content-type": blob.type || "image/png" },
      body: blob,
      signal: AbortSignal.timeout(TIMEOUTS.default),
    });
  } catch (err) {
    throw friendly(err);
  }
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
  let res;
  try {
    res = await fetch(`${API_BASE}/api/job?id=${encodeURIComponent(id)}`, {
      signal: AbortSignal.timeout(20_000),
    });
  } catch (err) {
    throw friendly(err);
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error || t.errors.serverStatus(res.status));
  return data;
}
