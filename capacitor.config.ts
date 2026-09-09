import type { CapacitorConfig } from "@capacitor/core";

/* Die App-Hülle für iOS und Android (Antons Ansage 09.09.2026: „endlich den
 * Switch auf Xcode machen"). Capacitor packt das gebaute `dist/` in eine
 * native App; die Oberfläche bleibt dieselbe React-SPA.
 *
 * ── Was die App dafür schon konnte, bevor es diese Datei gab ─────────────
 *   HashRouter (kein Server-Routing nötig) · API_BASE über VITE_API_BASE
 *   (api.js: der Bundle läuft nicht auf dem Origin des Servers) · Medien als
 *   relative /media/-Pfade, zur Laufzeit gegen API_BASE aufgelöst ·
 *   viewport-fit=cover in index.html.
 *
 * ── Was hier bewusst NICHT steht ─────────────────────────────────────────
 *   Kein `server.url` auf einen Entwicklungsrechner: Das würde die App auf
 *   dem Gerät live vom Vite-Server laden — praktisch zum Entwickeln, aber
 *   eine Falle im Repository (jeder Checkout zeigte auf Antons Rechner).
 *   Wer das will, setzt es lokal und committet es nicht.
 *
 * ⚠ Die Schlüssel bleiben im Server (server.js). Der native Bundle spricht
 *   über VITE_API_BASE mit einem laufenden server.js — auf dem Gerät heißt
 *   das: die IP des Rechners im WLAN, später ein gehosteter Server. */
const config: CapacitorConfig = {
  appId: "app.dreamrushes",
  appName: "Dream Rushes",
  webDir: "dist",
  ios: {
    /* Die Tab-Leiste liegt unter der Home-Indicator-Zone; die App zeichnet
       die Ränder selbst (safe-area-inset in CSS), also kein Auto-Inset. */
    contentInset: "never",
    backgroundColor: "#0a0d16",
  },
};

export default config;
