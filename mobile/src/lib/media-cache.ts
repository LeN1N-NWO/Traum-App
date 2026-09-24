import { Directory, File, Paths } from "expo-file-system";

/* Träume liegen auf dem Gerät — auch ihre Filme, Bilder und Aufnahmen
 * (Hanni + Anton 24.09.2026, docs/plans/2026-09-24-medienablage.md, Schritt A).
 *
 * Der Server erzeugt jede Datei und legt sie unter `/media/<hash>.<ext>` ab.
 * Diese Datei lädt jede davon EINMAL nach `Documents/media/` — dort räumt iOS
 * nicht von selbst auf (anders als `Caches`) — und ab dann zeigt die App die
 * lokale Kopie: offline, sofort, ohne Server.
 *
 * Bewusst NUR für die Anzeige: Die Brücke und das Tagebuch behalten die
 * `/media/…`-Pfade, denn die gehen als Keyframe oder Abspann-Quelle an den
 * Server zurück und müssen dort etwas bedeuten. Ersetzt wird erst im
 * Snapshot, den die Oberfläche liest (journal-store.ts).
 *
 * Der Name ist der Inhalts-Hash des Servers — dieselbe Datei hat überall
 * denselben Namen, ein zweiter Download derselben Datei entfällt. */

/* Dieselbe Form, die server.js ausliefert (MEDIA_NAME) — nichts anderes wird
   geladen oder als lokaler Name benutzt. */
const MEDIA = /\/media\/([a-z0-9]{1,20}\.(?:png|jpg|webp|mp4|m4a))(?:[?#].*)?$/;
/* Zwei gleichzeitig: genug, damit ein Tagebuch voller Filme nachkommt, ohne
   die Leitung für die Aufnahme zu verstopfen. */
const PARALLEL = 2;

let dir: Directory | null = null;
function mediaDir() {
  if (!dir) {
    dir = new Directory(Paths.document, "media");
    try { dir.create({ idempotent: true, intermediates: true }); } catch {}
  }
  return dir;
}

const done = new Map<string, string>();      // Name → file://-Adresse
const failed = new Set<string>();             // in diesem App-Lauf nicht noch mal versuchen
const inflight = new Set<string>();
const queue: { name: string; url: string }[] = [];
let active = 0;
let onReady: (() => void) | null = null;

/** Die Oberfläche neu zeichnen lassen, sobald eine Datei angekommen ist. */
export function onMediaReady(fn: () => void) { onReady = fn; }

function nameOf(url: string): string | null {
  const m = MEDIA.exec(url);
  return m ? m[1] : null;
}

function pump() {
  while (active < PARALLEL && queue.length) {
    const job = queue.shift()!;
    active++;
    (async () => {
      const d = mediaDir();
      const final = new File(d, job.name);
      /* Erst unter .part laden, dann umbenennen: Bricht der Download ab,
         liegt nie eine halbe Datei unter dem echten Namen — die würde sonst
         für immer als „schon da" gelten. */
      const part = new File(d, `${job.name}.part`);
      try {
        try { if (part.exists) part.delete(); } catch {}
        await File.downloadFileAsync(job.url, part, { idempotent: true });
        part.move(final);
        done.set(job.name, final.uri);
        onReady?.();
      } catch (e) {
        failed.add(job.name);
        try { if (part.exists) part.delete(); } catch {}
        console.warn("[media-cache]", job.name, e);
      } finally {
        inflight.delete(job.name);
        active--;
        pump();
      }
    })();
  }
}

/** Die lokale Adresse zu einer Server-Adresse, wenn die Datei schon auf dem
 *  Gerät liegt. Sonst die Server-Adresse unverändert — und die Datei wird im
 *  Hintergrund geholt. Alles, was nicht `/media/…` ist, geht unverändert
 *  durch (Vorschau-Clips, file://, fremde Adressen). */
export function localMedia(url: string): string;
export function localMedia(url: string | null): string | null;
export function localMedia(url: string | null): string | null {
  if (!url || url.startsWith("file:")) return url;
  const name = nameOf(url);
  if (!name) return url;
  const hit = done.get(name);
  if (hit) return hit;
  const file = new File(mediaDir(), name);
  if (file.exists) { done.set(name, file.uri); return file.uri; }
  if (!inflight.has(name) && !failed.has(name)) {
    inflight.add(name);
    queue.push({ name, url });
    pump();
  }
  return url;
}
