/* Turning the analysis's five beats into 3, 5 or 10 images.
 *
 * This is why the image count costs nothing extra: the model is asked for
 * exactly five beats once, and every count is derived from them locally.
 *   3  → condense (first, middle, last)
 *   5  → as-is
 *   10 → each beat becomes two moments
 */
const SOURCE_BEATS = 5;

/** @returns {string[]} one scene description per image, in order. */
export function beatsForCount(beats, count) {
  const src = (Array.isArray(beats) ? beats : []).filter((b) => typeof b === "string" && b.trim());
  if (src.length === 0) return [];

  // Tolerate an analysis that gave us fewer than five: stretch what we have.
  const five = src.length >= SOURCE_BEATS
    ? src.slice(0, SOURCE_BEATS)
    : Array.from({ length: SOURCE_BEATS }, (_, i) => src[Math.floor((i * src.length) / SOURCE_BEATS)]);

  if (count === 3) return [five[0], five[2], five[4]];
  if (count === 10) {
    return five.flatMap((b) => [
      `${b} — the moment it begins.`,
      `${b} — the moment it turns.`,
    ]);
  }
  return five;
}
