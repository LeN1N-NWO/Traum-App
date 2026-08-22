#!/usr/bin/env bun
// Startet server.js (API, Port 8100) und Vite (Oberfläche, Port 5173).
// Bewusst ohne "concurrently": eine Abhängigkeit weniger, und `&` als
// Trenner funktioniert in PowerShell nicht.
//
// ⚠ Die API bekommt ihren Port AUSDRÜCKLICH gesetzt, statt PORT zu erben.
// Grund (22.08.2026): Startet eine Vorschau-Umgebung diesen Befehl mit
// PORT=5173, band server.js sich an genau den Port, den Vite haben will —
// beide kamen hoch (der eine auf IPv4, der andere auf IPv6), und die
// Oberfläche kam mal aus Vite, mal aus dem alten dist/. Ein Fehlerbild,
// das nach Spuk aussieht und keines ist. PORT gehört der Oberfläche,
// API_PORT der API.
import { spawn } from "node:child_process";

const API_PORT = process.env.API_PORT || "8100";

const procs = [
  spawn("bun", ["server.js"], {
    stdio: "inherit", shell: true,
    env: { ...process.env, PORT: API_PORT },
  }),
  spawn("bunx", ["vite"], {
    stdio: "inherit", shell: true,
    env: { ...process.env, API_PORT },
  }),
];

function shutdown() {
  for (const p of procs) p.kill();
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
for (const p of procs) p.on("exit", shutdown);
