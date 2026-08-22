/* Was das Kaufblatt in seinen zwei Kacheln zeigt.
 *
 * Anton, 16.08.2026: keine Piktogramme mehr, sondern die Ware selbst — links
 * laufen Standbilder durch, rechts Filme nacheinander.
 *
 * Der eigentliche Gedanke steckt in der Reihenfolge, nicht in der Animation:
 * Das Kaufblatt geht meistens auf, WEIL das Guthaben leer ist. Wer dort
 * ankommt, hat also schon Träume gemacht. Ihm fremde Werbebilder zu zeigen,
 * während seine eigenen im Tagebuch liegen, wäre die schwächere von zwei
 * kostenlosen Möglichkeiten. Also: eigenes Material zuerst, immer.
 *
 * Die Rückfälle sind absichtlich mehrstufig, weil jede Stufe wirklich
 * vorkommt:
 *   1. eigene Träume            — der Normalfall nach dem ersten Rendern
 *   2. Seed-Journal bzw. Dummy  — jeder frische Install hat sie
 *   3. gar nichts               — dann zeichnet die Kachel den Leuchtglyph.
 *                                 Das entscheidet die Komponente, nicht hier.
 *
 * Warum Stufe 2 keine neuen Bilddateien braucht: Die Seed-Bilder liegen
 * bereits unter /clips/ im Auslieferungsstand. Ein eigener Werbesatz wäre
 * zusätzliches Gewicht im Repository für ein Bild, das ohnehin nur der
 * zweitbeste Fall ist.
 *
 * ⚠ Deshalb gibt es `stillsBackup` und `filmsBackup` NEBEN `stills`/`films`:
 * Stufe 2 muss auch dann noch greifen, wenn Stufe 1 zwar EXISTIERT, sich
 * aber nicht laden lässt. Die lokalen Kopien unter /media/ gehören dem Gerät
 * — sie können gelöscht sein, oder das Tagebuch stammt aus einem anderen
 * Install. Am 16.08. ist genau das passiert: der Ordner weg, alle Verweise
 * tot. Ohne diese zweite Liste wäre die Kaufseite eines langjährigen Nutzers
 * karger als die eines neuen, und zwar ausgerechnet deshalb, WEIL er viel
 * geträumt hat. Verwendet wird sie erst beim Ladefehler — siehe
 * ShowcaseTile.jsx.
 */

import { imagesOf, filmOf } from "./entryMedia.js";

/** Mehr als sechs sieht niemand — die Kachel läuft, sie ist kein Katalog. */
const MAX_STILLS = 6;
const MAX_FILMS = 3;

/* Unter drei Bildern wirkt eine Überblendung nicht wie ein Lauf, sondern wie
   ein Wackeln. Dann wird lieber mit Seed-Material aufgefüllt. */
const MIN_STILLS = 3;

const isSeed = (entry) => String(entry?.id || "").startsWith("e_seed");
const oneFilm = (entry) => {
  const url = filmOf(entry);
  return url ? [url] : [];
};

/** Sammelt URLs aus Einträgen, ohne Wiederholung, bis `max` erreicht ist. */
function collect(entries, read, max) {
  const out = [];
  for (const entry of entries) {
    for (const url of read(entry)) {
      if (url && !out.includes(url)) out.push(url);
      if (out.length >= max) return out;
    }
  }
  return out;
}

/**
 * @param {object[]} journal      state.journal, ältester Eintrag zuerst
 * @param {string|null} fallbackFilm  Der Dummy, wenn noch kein eigener Film da ist
 * @returns {{stills: string[], films: string[], stillsBackup: string[],
 *            filmsBackup: string[], stillsAreOwn: boolean, filmsAreOwn: boolean}}
 */
export function showcaseFrom(journal, fallbackFilm = null) {
  /* Das Tagebuch wächst hinten (siehe Step6Result.jsx), die letzten Träume
     stehen also am Ende. Gezeigt wird das Neueste zuerst. */
  const newestFirst = [...(journal || [])].reverse();
  const own = newestFirst.filter((e) => !isSeed(e) && e?.kind !== "blank");
  const seed = newestFirst.filter(isSeed);

  const ownStills = collect(own, imagesOf, MAX_STILLS);
  const seedStills = collect(seed, imagesOf, MAX_STILLS);
  const stillsAreOwn = ownStills.length >= MIN_STILLS;

  const ownFilms = collect(own, oneFilm, MAX_FILMS);
  const dummy = fallbackFilm ? [fallbackFilm] : [];

  return {
    stills: stillsAreOwn ? ownStills : collect([...own, ...seed], imagesOf, MAX_STILLS),
    /* Nur belegt, wenn Stufe 1 tatsächlich vorgezogen wurde — sonst steckt
       das Seed-Material schon in `stills` und wäre hier eine Wiederholung. */
    stillsBackup: stillsAreOwn ? seedStills : [],
    films: ownFilms.length ? ownFilms : dummy,
    filmsBackup: ownFilms.length ? dummy : [],
    stillsAreOwn,
    filmsAreOwn: ownFilms.length > 0,
  };
}
