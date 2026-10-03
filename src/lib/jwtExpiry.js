/* Läuft ein Zugangstoken gleich ab? (S1, 03.10.2026)
 *
 * Supabase-Zugangstoken gelten eine Stunde. Die App fragt den Schlüsselbund
 * nach dem gespeicherten Token und schickt es mit; ist es abgelaufen, weist
 * der Server mit 401 ab und die App erneuert. Das ist ein Umweg je Aufruf —
 * und beim Sprachinterview gar keiner: Ein WebSocket kann den Grund einer
 * Abweisung nicht lesen, das Interview scheitert einfach. Deshalb wird vorher
 * nachgesehen und, wenn es knapp ist, gleich erneuert (mobile/src/lib/auth.ts).
 *
 * Gelesen wird nur `exp` aus der Mitte des Tokens — NICHT geprüft. Ob das
 * Token echt ist, entscheidet allein der Server (verifyAccessToken). Hier
 * geht es nur um „lohnt sich der Versuch noch"; im Zweifel `false`, dann
 * entscheidet der Server wie bisher. Rein, ohne Netz, mit Test.
 */
export function expiresSoon(token, now = Date.now(), marginMs = 60_000) {
  if (typeof token !== "string") return false;
  const part = token.split(".")[1];
  if (!part) return false;
  try {
    const b64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const exp = JSON.parse(atob(b64.padEnd(Math.ceil(b64.length / 4) * 4, "=")))?.exp;
    return typeof exp === "number" && exp * 1000 - marginMs <= now;
  } catch {
    return false;
  }
}
