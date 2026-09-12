/* Was die alte Oberfläche von Vite bekam und Metro nicht liefert.
 *
 * babel-preset-expo schreibt `import.meta` in
 * `globalThis.__ExpoImportMetaRegistry` um (unstable_transformImportMeta,
 * Standard seit SDK 56). Die alte App liest daraus `env.DEV` und
 * `env.VITE_API_BASE`; dazu die Vite-Define `__API_PORT__` (voiceSession.js).
 *
 * ⚠ Dieses Modul MUSS der erste Import der DOM-Komponente sein — Importe
 * laufen in Reihenfolge, und der Rest der App liest die Werte beim Laden.
 *
 * API_BASE: Die DOM-Komponente lädt nicht vom Origin des Servers, also
 * absolute Adresse. Im Simulator ist localhost der Mac; auf dem Gerät muss
 * hier die WLAN-Adresse hin (EXPO_PUBLIC_API_BASE beim Start setzen). */
const API_BASE = process.env.EXPO_PUBLIC_API_BASE || "http://localhost:8100";

/* ⚠ DEV bewusst false, auch im Dev-Build (gemessen 11.09.): Mit DEV=true
   holt AppState beim Start die geteilte Traumsicherung vom Server — 19
   Träume samt Bildern — und der localStorage des WKWebView (~5 MB; 4 MB
   probiert, ok) meldet QuotaExceededError: nichts wird mehr gespeichert.
   Der native Speicher kommt mit dem Umzug der Datenschicht (Schritt 5). */
globalThis.__ExpoImportMetaRegistry = {
  ...(globalThis.__ExpoImportMetaRegistry || {}),
  env: { DEV: false, MODE: "production", VITE_API_BASE: API_BASE },
};
globalThis.__API_PORT__ = Number(new URL(API_BASE).port) || 8100;

/* Safe Area im Webview: env(safe-area-inset-*) liefert WebKit nur mit
   viewport-fit=cover — Expos DOM-Hülle setzt das nicht (Antons Befund
   12.09.: Titel unter der Uhrzeit). Meta nachziehen; legacy.css nimmt
   zusätzlich --sat/--sab, die die Hülle als Props hereinreicht. */
try {
  const m = document.querySelector('meta[name="viewport"]');
  if (m && !/viewport-fit/.test(m.getAttribute("content") || "")) m.setAttribute("content", (m.getAttribute("content") || "width=device-width, initial-scale=1") + ", viewport-fit=cover");
} catch {}
globalThis.__setSafeArea = (top, bottom) => {
  try { document.documentElement.style.setProperty("--sat", `${top || 0}px`); document.documentElement.style.setProperty("--sab", `${bottom || 0}px`); } catch {}
};

