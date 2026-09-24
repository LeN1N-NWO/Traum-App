/* Kommt eine Anfrage von diesem Rechner selbst?
 *
 * Für die Entwicklungs-Routen /api/cast-backup (Figuren MIT Fotos realer
 * Menschen) und /api/journal-backup (Traumtexte). Bis zum 24.09.2026 sperrte
 * sie nur der Client (import.meta.env.DEV) — der Server antwortete jedem.
 * Und weil Bun.serve ohne `hostname` auf allen Schnittstellen lauscht (das
 * braucht der iPhone-Test über die WLAN-IP), konnte jedes Gerät im selben
 * WLAN die Fotos abholen. Gefunden vom Sicherheitscheck (/security-check).
 *
 * Aufgerufen werden die Routen nur vom Web-Build im Entwicklungsmodus, und
 * der geht über Vites Proxy — der verbindet sich von localhost und setzt
 * (Vorgabe xfwd: false) keine Weiterleitungs-Kopfzeilen.
 *
 * ⚠ Warum die Kopfzeilen zählen: Hinter einem Reverse-Proxy (Caddy, Hosting)
 * kommt JEDE Anfrage von localhost. Ein Test nur auf die Adresse würde die
 * Routen dort für die ganze Welt öffnen. Ein Proxy setzt aber
 * X-Forwarded-For bzw. Forwarded — trägt die Anfrage eine davon, ist sie
 * weitergereicht und damit nicht lokal. Andersherum ist das ungefährlich:
 * Wer die Kopfzeile selbst setzt, sperrt sich nur selbst aus.
 *
 * ⚠ Grenze: Vites Proxy setzt keine solche Kopfzeile. Lauscht Vite im WLAN
 * (`vite --host`, `server.host` in vite.config.js), reicht er Anfragen
 * fremder Geräte als localhost weiter, und die Sperre greift nicht. Heute
 * startet scripts/dev.mjs Vite ohne --host (nur localhost).
 */

const LOOPBACK = new Set(["127.0.0.1", "::1", "::ffff:127.0.0.1"]);
const FORWARD_HEADERS = ["x-forwarded-for", "forwarded", "x-real-ip"];

/**
 * @param {string | undefined} address  server.requestIP(req)?.address
 * @param {Headers} headers             req.headers
 * @returns {boolean}
 */
export function isLocalRequest(address, headers) {
  if (!LOOPBACK.has(String(address || ""))) return false;
  // Ohne lesbare Kopfzeilen lässt sich „nicht weitergereicht“ nicht belegen → gesperrt.
  if (typeof headers?.get !== "function") return false;
  return !FORWARD_HEADERS.some((h) => headers.get(h));
}
