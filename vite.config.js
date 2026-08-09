import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Der Dev-Server liefert nur die Oberfläche. Alles unter /api geht an
// server.js — dort und nur dort liegen FAL_KEY, DEEPSEEK_KEY und GEMINI_KEY.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // /media sind die lokal aufbewahrten Kopien der erzeugten Bilder und
    // Filme — sie liefert server.js, also muss der Dev-Server auch dorthin
    // durchreichen.
    // ws: true, weil das Sprach-Interview über eine WebSocket-Verbindung
    // läuft, die der Dev-Server sonst nicht durchreicht.
    proxy: {
      "/api": { target: "http://127.0.0.1:8100", ws: true },
      "/media": "http://127.0.0.1:8100",
    },
  },
  build: { outDir: "dist", emptyOutDir: true },
});
