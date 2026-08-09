/* What a journal entry actually carries, now that a dream can hold BOTH a
 * picture sequence and a film made from it.
 *
 * The shape grew in two stages, so nothing may read entry.media directly:
 *
 *   before 09.08.2026   media = { type: "image" | "video", urls }
 *                       — one or the other. Making a film overwrote the
 *                         images, which silently destroyed them.
 *   since               media = the images, film = { urls } alongside
 *
 * These two readers hide that seam. Old entries keep working: a film stored
 * the old way is still found, and their images (there were none, by
 * definition) come back empty.
 */

/** The film's URL, or null. */
export function filmOf(entry) {
  const own = entry?.film?.urls?.[0];
  if (own) return own;
  return entry?.media?.type === "video" ? entry?.media?.urls?.[0] || null : null;
}

/** The picture sequence, oldest-first. Empty when the dream has none. */
export function imagesOf(entry) {
  return entry?.media?.type === "image" ? entry?.media?.urls || [] : [];
}

/** Everything shareable, film first — the order it is shown in. */
export function allMediaOf(entry) {
  const film = filmOf(entry);
  return film ? [film, ...imagesOf(entry)] : imagesOf(entry);
}
