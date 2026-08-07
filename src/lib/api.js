/* The only place the client talks to the server.
 *
 * API_BASE is configurable because a Capacitor bundle will not run on the same
 * origin as the server. Keys live in server.js only — never here, never in
 * the bundle.
 */
import { t } from "../i18n/index.js";

const API_BASE = import.meta.env.VITE_API_BASE || "";

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

/** Renders one image or a film. `prompt` overrides the server's own wording. */
export async function generate({ dream, mode, cast, prompt }) {
  const data = await post("/api/generate", { dream, mode, cast, prompt });
  if (!Array.isArray(data?.urls)) throw new Error(t.errors.unexpected);
  return data.urls;
}
