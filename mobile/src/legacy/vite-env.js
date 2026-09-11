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

globalThis.__ExpoImportMetaRegistry = {
  ...(globalThis.__ExpoImportMetaRegistry || {}),
  env: { DEV: !!__DEV__, MODE: __DEV__ ? "development" : "production", VITE_API_BASE: API_BASE },
};
globalThis.__API_PORT__ = Number(new URL(API_BASE).port) || 8100;
