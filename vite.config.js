import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Der Dev-Server liefert nur die Oberfläche. Alles unter /api geht an
// server.js — dort und nur dort liegen FAL_KEY und DEEPSEEK_KEY.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { "/api": "http://127.0.0.1:8100" },
  },
  build: { outDir: "dist", emptyOutDir: true },
});
