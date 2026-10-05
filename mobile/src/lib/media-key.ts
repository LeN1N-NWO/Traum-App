import { useSyncExternalStore } from "react";
import { authFetch, onAccountChange } from "@/lib/auth";

/* Der Medienschlüssel (S2, 05.10.2026; Server: src/lib/mediaAccess.js).
 *
 * Auf dem VPS liefert der Server `/media/*` nur gegen eine signierte Adresse
 * aus. Den Schlüssel dafür holt dieses Modul (GET /api/media-key, 20 Minuten
 * gültig) und erneuert ihn alle 10 Minuten — jede Adresse lebt damit noch
 * mindestens 10 Minuten, genug für einen laufenden Film. Signiert wird je
 * Datei und synchron in src/lib/mediaSign.js.
 *
 * Drei Zustände:
 *   undefined  noch nicht gefragt / Netz weg — Downloads warten
 *   null       der Server signiert nicht (lokal ohne REQUIRE_AUTH) oder
 *              niemand ist angemeldet — Adressen bleiben unsigniert
 *   MediaKey   signieren
 *
 * Die Web-Ansichten (mobile/src/legacy) bekommen ihn als Prop `mediaKey`
 * und setzen ihn mit setMediaKey() in src/lib/api.js — wie `getToken`. */

export type MediaKey = { uid: string; exp: number; key: string };

const REFRESH_MS = 10 * 60 * 1000;
const RETRY_MS = 30 * 1000;

let current: MediaKey | null | undefined = undefined;
let timer: ReturnType<typeof setTimeout> | null = null;
let started = false;
let generation = 0;
const listeners = new Set<() => void>();

function set(next: MediaKey | null | undefined) {
  current = next;
  listeners.forEach((l) => l());
}

function schedule(ms: number) {
  if (timer) clearTimeout(timer);
  timer = setTimeout(load, ms);
}

async function load() {
  const mine = ++generation;
  try {
    const res = await authFetch("/api/media-key");
    if (mine !== generation) return;            // ein Kontowechsel war schneller
    /* 401: niemand angemeldet (authFetch antwortet ohne Sitzung selbst so)
       → unsigniert. Alles andere (429, 5xx, Proxy) ist ein Aussetzer: den
       bisherigen Schlüssel behalten und bald wieder fragen — sonst schaltete
       EIN Fehler die App für zehn Minuten auf „unsigniert", und auf dem VPS
       käme in der Zeit keine Datei an. */
    if (res.status === 401) { set(null); schedule(REFRESH_MS); return; }
    if (!res.ok) { schedule(RETRY_MS); return; }
    const body = await res.json();
    const k = body?.mediaKey;
    const valid = k && typeof k.uid === "string" && typeof k.key === "string" && Number.isFinite(k.exp);
    set(valid ? { uid: k.uid, exp: k.exp, key: k.key } : null);
    schedule(REFRESH_MS);
  } catch {
    if (mine !== generation) return;
    // Netz weg: den alten Schlüssel behalten, bald noch mal fragen.
    schedule(RETRY_MS);
  }
}

/** Start once (idempotent); refetches on every account change. */
export function startMediaKey() {
  if (started) return;
  started = true;
  onAccountChange(() => { set(undefined); load(); });
  load();
}

/** undefined = not known yet, null = unsigned, else the key. */
export function currentMediaKey(): MediaKey | null | undefined {
  startMediaKey();
  return current;
}

export function onMediaKey(fn: () => void) {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

/** For the DOM components: pass as the `mediaKey` prop. */
export function useMediaKey(): MediaKey | null {
  startMediaKey();
  return useSyncExternalStore(onMediaKey, () => current ?? null, () => current ?? null);
}
