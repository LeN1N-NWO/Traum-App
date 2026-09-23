import { authFetch } from "@/lib/auth";
import type { BridgeCommand, BridgeResult } from "@/store/journal-store";

/* Die Konto-Sicherung der Träume (Hanni 23.09.2026, Plan
 * docs/plans/2026-09-23-app-store-pruefung.md N13): Das Onboarding
 * verspricht „Mit einem Konto bleiben Träume, Filme und dein Profil
 * erhalten, wenn das Handy wechselt" — bis heute ging aber kein Traum an
 * den Server. Die Endpunkte gab es seit dem 12.09. (server.js /api/dreams),
 * es fehlte diese Seite.
 *
 * Ablauf, nur mit Konto:
 *   1. HOLEN: alle Träume des Kontos, seitenweise (GET /api/dreams), in die
 *      Brücke (`syncImport` → mergeShared: nur Unbekanntes ergänzen, leere
 *      Bilder/Filme nachfüllen — nie überschreiben, nie löschen).
 *   2. SCHICKEN: das Tagebuch in Sicherungsform (`syncExport` →
 *      backupPayload, dieselbe erlaubte Liste wie die Dateisicherung, also
 *      nie ein Foto) in Stapeln an POST /api/dreams/sync. Der Server nimmt
 *      nur, was nicht älter ist als sein Stand.
 * Erst holen, dann schicken: Ein frisches Handy lädt so zuerst herunter und
 * schickt danach nichts Altes über Neues.
 *
 * ⚠ Bekannte Grenze (Hannis Entscheidung 23.09.): Wer auf Gerät A löscht,
 *   löscht auch auf dem Server — Gerät B kann den Traum aber beim nächsten
 *   Schicken zurückbringen. Eine Lösch-Merkliste auf dem Server kommt vor
 *   Mehrgeräte-Nutzung oder Android. */

type Ask = (cmd: Omit<BridgeCommand, "n">) => Promise<BridgeResult>;

/* Muss zu MAX_SYNC_BATCH in server.js passen. */
const BATCH = 200;
/* Sicherheitsgrenze fürs Holen: 50 Seiten × 200 = 10 000 Träume. Wer mehr
   hat, bekommt den Rest beim nächsten Lauf — eine Endlosschleife bei einem
   kaputten Cursor ist schlimmer. */
const MAX_PAGES = 50;

let running: Promise<SyncResult> | null = null;
/* Was zuletzt erfolgreich geschickt wurde — nur im Speicher. Unverändertes
   Tagebuch = kein Upload; nach einem Neustart schickt der erste Lauf einmal
   alles (der Server nimmt Gleiches ohne Schaden an). */
let lastSent = "";

export type SyncResult = "done" | "skipped" | "failed";

async function pull(ask: Ask): Promise<boolean> {
  let cursor: string | null = null;
  for (let page = 0; page < MAX_PAGES; page++) {
    const res = await authFetch(`/api/dreams?limit=${BATCH}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`);
    if (!res.ok) return false;
    const body = (await res.json().catch(() => null)) as { dreams?: unknown[]; next?: string | null } | null;
    if (!body || !Array.isArray(body.dreams)) return false;
    if (body.dreams.length) await ask({ type: "syncImport", dreams: body.dreams });
    cursor = body.next ?? null;
    if (!cursor) return true;
  }
  return true;
}

async function push(ask: Ask): Promise<boolean> {
  const r = await ask({ type: "syncExport" });
  const dreams = (r.result?.dreams ?? []) as unknown[];
  const print = JSON.stringify(dreams);
  if (print === lastSent) return true;
  for (let i = 0; i < dreams.length; i += BATCH) {
    const res = await authFetch("/api/dreams/sync", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ dreams: dreams.slice(i, i + BATCH) }),
    });
    if (!res.ok) return false;
  }
  lastSent = print;
  return true;
}

/** Einmal holen und schicken. Läuft schon ein Abgleich, wird er geteilt.
 *  Ohne Konto antwortet der Server 401 → "skipped", nichts passiert. */
export function syncDreams(ask: Ask): Promise<SyncResult> {
  if (running) return running;
  running = (async (): Promise<SyncResult> => {
    try {
      const probe = await authFetch("/api/account");
      if (probe.status === 401) return "skipped";
      if (!probe.ok) return "failed";
      if (!(await pull(ask))) return "failed";
      return (await push(ask)) ? "done" : "failed";
    } catch {
      return "failed";
    } finally {
      running = null;
    }
  })();
  return running;
}

/** Ein gelöschter Traum verschwindet auch vom Server. Ohne Konto oder
 *  offline passiert nichts Sichtbares — 404 heißt: war nie gesichert. */
export async function deleteDreamRemote(id: string): Promise<void> {
  try {
    await authFetch(`/api/dreams?client_id=${encodeURIComponent(id)}`, { method: "DELETE" });
  } catch {
    /* offline: der Traum ist lokal weg; auf dem Server bleibt er bis zum
       Löschen des Kontos. Bewusst kein erneuter Versuch (s. Grenze oben). */
  }
}

/* Vergessen, was zuletzt geschickt wurde — nach dem Abmelden, damit ein
   anderes Konto auf diesem Gerät beim ersten Lauf alles bekommt. */
export function resetDreamSync() {
  lastSent = "";
}
