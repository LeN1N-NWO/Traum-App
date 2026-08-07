/* The only place the client talks to the server.
 *
 * API_BASE is configurable because a Capacitor bundle will not run on the same
 * origin as the server. Keys live in server.js only — never here, never in
 * the bundle.
 */
import { t } from "../i18n/index.js";

const API_BASE = import.meta.env.VITE_API_BASE || "";

export async function generate({ dream, mode, cast }) {
  const res = await fetch(`${API_BASE}/api/generate`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ dream, mode, cast }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error || t.errors.serverStatus(res.status));
  if (!Array.isArray(data?.urls)) throw new Error(t.errors.unexpected);
  return data.urls;
}
