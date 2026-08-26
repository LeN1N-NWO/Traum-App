import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Der Dev-Server liefert nur die Oberfläche. Alles unter /api geht an
// server.js — dort und nur dort liegen FAL_KEY, DEEPSEEK_KEY und GEMINI_KEY.
// ⚠ API_PORT, NICHT PORT: PORT gehört der Oberfläche und wird von
// Vorschau-Umgebungen gesetzt (22.08.2026: PORT=5173 schickte den
// Proxy auf Vite selbst und band die API an Vites Port).
const API_PORT = Number(process.env.API_PORT) || 8100;
const API_TARGET = `http://127.0.0.1:${API_PORT}`;

export default defineConfig({
  plugins: [react()],

  // Das Sprach-Interview ist die einzige Verbindung, die am Proxy VORBEI
  // direkt an diesen Port geht — deshalb muss der Port auch im Browser
  // bekannt sein. Grund fürs Vorbeigehen: der Dev-Server läuft unter Bun,
  // und Buns node:http meldet eine 101-Antwort als gewöhnliche Antwort statt
  // als 'upgrade'. Der Proxy wartet dann auf ein Ereignis, das nie eintrifft,
  // und die Verbindung bleibt stumm offen, bis sie abläuft. `ws: true` half
  // deshalb nicht — nachgemessen am 09.08.2026 mit Bun/Vite 5.4.21.
  define: { __API_PORT__: JSON.stringify(API_PORT) },

  server: {
    port: 5173,
    // /media sind die lokal aufbewahrten Kopien der erzeugten Bilder und
    // Filme — sie liefert server.js, also muss der Dev-Server auch dorthin
    // durchreichen.
    proxy: {
      "/api": API_TARGET,
      "/media": API_TARGET,
    },
  },
  /* es2022 wegen top-level await in src/i18n/index.js (die fünf
     eingefrorenen Sprachen laden seit dem 26.08. nach). Deckt sich mit der
     Stützuntergrenze der App: Chrome 119 / Safari 17.4 (Mischpult-Fader,
     sleep.css) — beide können es2022 vollständig. */
  build: { outDir: "dist", emptyOutDir: true, target: "es2022" },
});
