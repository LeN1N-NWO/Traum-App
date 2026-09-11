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
 *   Keine feste `server.url` auf einen Entwicklungsrechner: Das würde die
 *   App auf dem Gerät live vom Vite-Server laden — praktisch zum Entwickeln,
 *   aber eine Falle im Repository (jeder Checkout zeigte auf Antons
 *   Rechner). Wer das will, setzt es lokal und committet es nicht — und
 *   genau dafür ist CAP_SERVER_URL unten da.
 *
 * ⚠ Die Schlüssel bleiben im Server (server.js). Der native Bundle spricht
 *   über VITE_API_BASE mit einem laufenden server.js — auf dem Gerät heißt
 *   das: die IP des Rechners im WLAN, später ein gehosteter Server. */

/* ── Live-Reload, nur auf ausdrücklichen Wunsch ───────────────────────────
 *
 * Ohne das hier kostet jede Web-Änderung eine volle Runde: `bun run build`,
 * `bunx cap sync ios`, in Xcode neu starten. Der Vite-Build davon dauert
 * 1,5 Sekunden — der Rest ist Xcode und WebKit, und auf einer Maschine mit
 * zwei Performance-Kernen sind das Minuten (gemessen 10.09.2026). Zeigt die
 * Hülle stattdessen auf den laufenden Vite-Server, wird aus der Runde ein
 * Speichern.
 *
 * Die Adresse steht in der UMGEBUNG, nie in dieser Datei. Damit trägt kein
 * Checkout die Adresse eines fremden Rechners mit sich herum, und niemand
 * muss eine uncommittete Änderung pflegen:
 *
 *     bun run dev                                  # 8100 (API) + 5173 (Vite)
 *     CAP_SERVER_URL=http://localhost:5173 bunx cap sync ios
 *
 * VITE_API_BASE braucht es dabei NICHT: Die Oberfläche kommt von Vite, die
 * /api- und /media-Aufrufe laufen relativ durch dessen Proxy an server.js
 * (vite.config.js). Ein Origin, keine CORS-Frage.
 *
 * ⚠ In die `.env` gehört die Variable NICHT — die Capacitor-CLI liest die
 *   Datei nicht (nachgemessen 10.09.2026). Sie muss vor dem Befehl stehen,
 *   sonst passiert stillschweigend gar nichts.
 *
 * Auf einem echten Gerät muss die Adresse die WLAN-IP des Macs sein UND
 * Vite an allen Schnittstellen lauschen — sonst klopft das Telefon gegen
 * eine Tür, die nur nach innen offen ist:
 *
 *     bunx vite --host
 *     CAP_SERVER_URL=http://192.168.x.x:5173 bunx cap sync ios
 *
 * ⚠⚠ EIN SYNC OHNE DIE VARIABLE HOLT DIE APP ZURÜCK — und genau das muss
 *    man tun, bevor irgendetwas ausgeliefert wird. Die erzeugte
 *    `ios/App/App/capacitor.config.json` ist ignoriert, liegt aber auf der
 *    Platte und behält die Adresse, bis der nächste Sync sie überschreibt.
 *    Eine App, die still von einem abgeschalteten Laptop zu laden versucht,
 *    zeigt nur einen weißen Bildschirm und sagt nicht, warum. */
const liveReloadUrl = process.env.CAP_SERVER_URL?.trim();

const config: CapacitorConfig = {
  appId: "app.dreamrushes",
  appName: "Dream Rushes",
  webDir: "dist",
  ...(liveReloadUrl
    ? {
      /* `cleartext` gilt Android; auf iOS entscheidet App Transport
         Security, und die Ausnahme dafür steht in der Info.plist
         (NSAllowsLocalNetworking, seit 10.09.2026). */
      server: { url: liveReloadUrl, cleartext: true },
    }
    : {}),
  /* Der Stil gilt vom ersten Frame an — src/lib/nativeShell.js setzt ihn
     nach dem Start noch einmal. */
  plugins: {
    StatusBar: { style: "DARK" },
    /* Kein Keyboard-Plugin — siehe src/lib/nativeShell.js. */
  },
  ios: {
    /* Die Tab-Leiste liegt unter der Home-Indicator-Zone; die App zeichnet
       die Ränder selbst (safe-area-inset in CSS), also kein Auto-Inset. */
    contentInset: "never",
    backgroundColor: "#0a0d16",
  },
};

export default config;
