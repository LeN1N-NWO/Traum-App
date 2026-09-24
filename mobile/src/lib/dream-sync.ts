import { authFetch } from "@/lib/auth";
import { backupKey, existingBackupKey, seal, unseal, type BackupKey } from "@/lib/backup-key";
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
 * ⚠ Seit 24.09.2026 Ende-zu-Ende verschlüsselt (Plan medienablage, Schritt
 *   B): Jeder Traum wird vor dem Schicken mit dem Schlüssel aus
 *   backup-key.ts versiegelt und nach dem Holen entschlüsselt. Der Server
 *   sieht nur Id, Zeitstempel, den versiegelten Block und die
 *   Schlüssel-Kennung. Findet das Gerät Sicherungen mit einer FREMDEN
 *   Kennung, legt es keinen eigenen Schlüssel an und schickt nichts
 *   („foreign-key") — sonst entstünden zwei Sicherungen, von denen eine
 *   niemand mehr lesen kann.
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
/* Was zuletzt erfolgreich geschickt wurde, je Traum — nur im Speicher.
   Geschickt wird nur, was sich seitdem geändert hat; nach einem Neustart
   schickt der erste Lauf einmal alles (der Server nimmt Gleiches ohne
   Schaden an). */
let lastSent = new Map<string, string>();

export type SyncResult = "done" | "skipped" | "failed" | "foreign-key";

type Stored = { id?: string; createdAt?: string; editedAt?: string | null; sealed?: string; keyId?: string };

/** Holt alles und spielt es ein. Meldet, welche Schlüssel-Kennungen der
 *  Server kennt — daran entscheidet sich, ob dieses Gerät schicken darf. */
async function pull(ask: Ask, key: BackupKey | null): Promise<{ ok: boolean; foreign: boolean; any: boolean }> {
  let cursor: string | null = null;
  let foreign = false, any = false;
  for (let page = 0; page < MAX_PAGES; page++) {
    const res = await authFetch(`/api/dreams?limit=${BATCH}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`);
    if (!res.ok) return { ok: false, foreign, any };
    const body = (await res.json().catch(() => null)) as { dreams?: Stored[]; next?: string | null } | null;
    if (!body || !Array.isArray(body.dreams)) return { ok: false, foreign, any };
    const readable: unknown[] = [];
    for (const d of body.dreams) {
      if (!d.sealed) { readable.push(d); continue; }       // Klartext von vor dem 24.09.
      any = true;
      if (!key || d.keyId !== key.keyId) { foreign = true; continue; }
      const open = await unseal(d.sealed, key);
      if (open) readable.push(open);
    }
    if (readable.length) await ask({ type: "syncImport", dreams: readable });
    cursor = body.next ?? null;
    if (!cursor) return { ok: true, foreign, any };
  }
  return { ok: true, foreign, any };
}

async function push(ask: Ask, key: BackupKey): Promise<boolean> {
  const r = await ask({ type: "syncExport" });
  const dreams = (r.result?.dreams ?? []) as Stored[];
  const changed = dreams.filter((d) => d.id && lastSent.get(d.id) !== JSON.stringify(d));
  if (!changed.length) return true;
  for (let i = 0; i < changed.length; i += BATCH) {
    const batch = changed.slice(i, i + BATCH);
    const sealed = await Promise.all(batch.map(async (d) => ({
      id: d.id, createdAt: d.createdAt, editedAt: d.editedAt ?? null,
      sealed: await seal(d, key), keyId: key.keyId,
    })));
    const res = await authFetch("/api/dreams/sync", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ dreams: sealed }),
    });
    if (!res.ok) return false;
    for (const d of batch) lastSent.set(d.id!, JSON.stringify(d));
  }
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
      /* Vorhandenen Schlüssel nehmen (iCloud) — einen NEUEN erst nach dem
         Holen, und nur wenn es keine fremd versiegelten Sicherungen gibt. */
      let key = await existingBackupKey();
      const got = await pull(ask, key);
      if (!got.ok) return "failed";
      if (got.foreign) return "foreign-key";
      key = key ?? await backupKey();
      return (await push(ask, key)) ? "done" : "failed";
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
  lastSent = new Map();
}
