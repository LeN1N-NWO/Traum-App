#!/usr/bin/env bun
// Startet server.js (API, Port 8100) und Vite (Oberfläche, Port 5173).
// Bewusst ohne "concurrently": eine Abhängigkeit weniger, und `&` als
// Trenner funktioniert in PowerShell nicht.
import { spawn } from "node:child_process";

const procs = [
  spawn("bun", ["server.js"], { stdio: "inherit", shell: true }),
  spawn("bunx", ["vite"], { stdio: "inherit", shell: true }),
];

function shutdown() {
  for (const p of procs) p.kill();
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
for (const p of procs) p.on("exit", shutdown);
