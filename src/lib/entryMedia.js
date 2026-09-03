/* What a journal entry actually carries, now that a dream can hold BOTH a
 * picture sequence and a film made from it.
 *
 * The shape grew in three stages, so nothing may read entry.media directly:
 *
 *   before 09.08.2026   media = { type: "image" | "video", urls }
 *                       — one or the other. Making a film overwrote the
 *                         images, which silently destroyed them.
 *   since               media = the images, film = { urls } alongside
 *   since 03.09.2026    films = [ … ] — MEHRERE Fassungen desselben Traums
 *
 * These readers hide that seam. Old entries keep working: a film stored the
 * old way is still found, and their images (there were none, by definition)
 * come back empty.
 *
 * ── Warum mehrere Fassungen (Antons Ansage 03.09.2026) ──────────────────
 * „Es kann sein, dass eine Person so lange weitermacht, den Traum, bis er
 * wirklich passt." Ein Film ist kein Ergebnis, sondern ein Versuch: anderes
 * Tempo, andere Szenenauswahl, anderes Modell. Deshalb sammelt der Eintrag
 * sie, statt den vorigen zu überschreiben — jeder einzelne hat Geld
 * gekostet, und welcher der beste ist, entscheidet der Mensch.
 */

/** Alle Fassungen, älteste zuerst. Jede: { url, at, model, seconds, pace }.
 *
 *  ⚠ Die beiden alten Formen kommen als erster Eintrag mit, damit ein Traum
 *  von gestern in derselben Liste erscheint wie einer von heute. Wer hier
 *  nur `films` läse, ließe jeden Film vor dem 03.09.2026 verschwinden. */
export function filmsOf(entry) {
  const neu = Array.isArray(entry?.films) ? entry.films.filter((f) => f?.url) : [];
  const alt = entry?.film?.urls?.[0]
    || (entry?.media?.type === "video" ? entry?.media?.urls?.[0] : null);
  /* ⚠ Die alte Form wird VORANGESTELLT, nicht ersetzt (gemessen 03.09.2026):
     Ein Traum, dessen erster Film noch in `film` steht und dessen zweiter
     schon in `films`, hätte sonst nur den zweiten gezeigt — der erste wäre
     aus der Fassungsleiste verschwunden, obwohl er bezahlt ist und die
     Datei noch liegt. Nur wenn dieselbe Adresse schon in der Liste steht,
     bleibt sie einmalig: Der Collector schreibt beide Formen mit. */
  if (alt && !neu.some((f) => f.url === alt)) {
    return [{ url: alt, at: entry?.createdAt || null }, ...neu];
  }
  return neu;
}

/** Die Fassung, die die Seite anführt: die ZULETZT erzeugte.
 *  Nicht die erste — wer nachbessert, will sein Neuestes sehen. */
export function filmOf(entry) {
  const alle = filmsOf(entry);
  return alle.length ? alle[alle.length - 1].url : null;
}

/** The picture sequence, oldest-first. Empty when the dream has none. */
export function imagesOf(entry) {
  return entry?.media?.type === "image" ? entry?.media?.urls || [] : [];
}

/** Everything shareable, films first — the order it is shown in. */
export function allMediaOf(entry) {
  return [...filmsOf(entry).map((f) => f.url), ...imagesOf(entry)];
}
