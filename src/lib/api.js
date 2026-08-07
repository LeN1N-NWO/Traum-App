/* Einzige Stelle, an der der Client den Server anspricht.
 *
 * API_BASE ist konfigurierbar, weil das Capacitor-Bundle später nicht auf
 * demselben Ursprung läuft wie der Server. Schlüssel liegen ausschließlich
 * in server.js — nie hier, nie im Bundle.
 */
const API_BASE = import.meta.env.VITE_API_BASE || "";

export async function generate({ dream, mode, cast }) {
  const res = await fetch(`${API_BASE}/api/generate`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ dream, mode, cast }),
  });
  const daten = await res.json().catch(() => null);
  if (!res.ok) throw new Error(daten?.error || `Server antwortete mit ${res.status}.`);
  if (!Array.isArray(daten?.urls)) throw new Error("Unerwartete Antwort vom Server.");
  return daten.urls;
}
