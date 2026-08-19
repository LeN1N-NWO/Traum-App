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

/* Wie viele Szenen in eine Filmlänge passen.
 *
 * Der Bogen hat immer fünf Szenen — für eine Bildstrecke ist das richtig,
 * weil jedes Bild beliebig lange betrachtet wird. Ein Film hat diese
 * Freiheit nicht: Fünf Szenen auf fünf Sekunden sind eine Sekunde je Szene,
 * und darin kann keine Handlung lesbar werden. Bis 19.08.2026 bekam der
 * Regisseur trotzdem immer alle fünf, bei jeder wählbaren Länge.
 *
 * Drei Sekunden je Szene ist die Untergrenze, nicht das Ziel: Eine
 * Einstellung braucht Zeit für Aufbau, Handlung und Nachhall, und die
 * Bauanleitung verlangt zu jedem Zeitblock ausdrücklich ein physisches
 * Ereignis. Darunter wird aus Regie eine Schnittfolge.
 *
 * Zwei ist die Untergrenze der Untergrenze: Anfang und Auflösung sind das
 * Minimum, aus dem eine Geschichte besteht. Fünf bleibt die Obergrenze —
 * mehr Szenen hat der Bogen nicht, längere Filme bekommen also mehr Zeit
 * je Szene statt mehr Szenen.
 */
export function beatsForSeconds(beats, seconds) {
  const src = (Array.isArray(beats) ? beats : []).filter((b) => typeof b === "string" && b.trim());
  if (src.length === 0) return [];

  const SECONDS_PER_BEAT = 3;
  const want = Math.max(2, Math.min(SOURCE_BEATS, Math.floor((Number(seconds) || 0) / SECONDS_PER_BEAT)));
  if (src.length <= want) return src;

  /* Gleichmäßig über den Bogen, erste und letzte Szene immer dabei: Der
     Anfang setzt den Ort, das Ende löst auf — was dazwischen wegfällt,
     schmerzt weniger als ein Film ohne Ankunft. Bei drei aus fünf ergibt
     das dieselbe Auswahl wie beatsForCount(3), also 1/3/5. */
  return Array.from({ length: want },
    (_, i) => src[Math.round((i * (src.length - 1)) / (want - 1))]);
}
