import { Directory, File, Paths } from "expo-file-system";
import { currentMediaKey, onMediaKey } from "@/lib/media-key";
import { signMediaPath } from "../../../src/lib/mediaSign.js";

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
const queue: { name: string; origin: string }[] = [];
let active = 0;
let onReady: (() => void) | null = null;

/** Die Oberfläche neu zeichnen lassen, sobald eine Datei angekommen ist. */
export function onMediaReady(fn: () => void) { onReady = fn; }

/* S2 (05.10.2026): Auf dem VPS gibt der Server eine Datei nur gegen eine
   signierte Adresse heraus (lib/media-key.ts). Signiert wird hier immer neu
   mit dem aktuellen Schlüssel — eine Adresse, die schon signiert ankommt,
   kann längst abgelaufen sein. Ein neuer Schlüssel (Start, Kontowechsel)
   zeichnet neu und gibt gescheiterte Downloads wieder frei: Ein Gast, der
   sich anmeldet, soll seine Filme danach sehen. */
function signed(origin: string, name: string): string {
  return origin + signMediaPath(`/media/${name}`, currentMediaKey() ?? null);
}
/** A server media URL signed for right now — for native code that fetches
 *  it itself (the glimpse sound). Store the unsigned URL, sign at use. */
export function signedMedia(url: string): string {
  const name = nameOf(url);
  return name ? signed(originOf(url), name) : url;
}
onMediaKey(() => {
  failed.clear();
  onReady?.();
});

/** Everything in front of `/media/` — the server the file lives on. */
function originOf(url: string): string {
  const at = url.indexOf("/media/");
  return at > 0 ? url.slice(0, at) : "";
}

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
        await File.downloadFileAsync(signed(job.origin, job.name), part, { idempotent: true });
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
 *  Gerät liegt. Sonst die Server-Adresse, frisch signiert (S2) — und die
 *  Datei wird im Hintergrund geholt. Alles, was nicht `/media/…` ist, geht unverändert
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
  const origin = originOf(url);
  /* Schlüssel noch unbekannt (Start, Netz): nicht laden — ein Download ohne
     Signatur scheitert auf dem VPS und gälte dann den ganzen Lauf als
     gescheitert. onMediaKey zeichnet neu, dann geht es los. */
  if (currentMediaKey() === undefined) return url;
  if (!inflight.has(name) && !failed.has(name)) {
    inflight.add(name);
    queue.push({ name, origin });
    pump();
  }
  return signed(origin, name);
}
