/* Turning the analysis's five beats into any number of images, and telling
 * every consumer WHICH beat an image came from.
 *
 * This is why the image count costs nothing extra: the model is asked for
 * exactly five beats once, and every count is derived from them locally.
 *   fewer than 5 → an even pick across the arc, first and last always kept
 *   5            → as-is
 *   more than 5  → each beat becomes two moments, then an even pick of those
 *
 * ⚠ Until 19.08.2026 only 3, 5 and 10 were handled and EVERY other count
 * fell through to "all five". That was a real money bug, not a cosmetic one:
 * the poster replaces the first image (Step5: sceneCount = count - 1), so
 * "3 images with a poster" asked for beatsForCount(_, 2), got 5 beats back,
 * and rendered 1 poster + 5 scenes = 6 paid generations while charging 3
 * credits. The generalisation below makes every count mean what it says.
 */
const SOURCE_BEATS = 5;
const MOMENTS = 2; // how many moments a beat splits into when expanding past 5

/* The one selection formula everything here shares: `want` indices spread
 * evenly across `total`, first and last always included. beatsForCount,
 * beatsForSeconds and the image↔beat mapping MUST all use this — two
 * different spreads would show a thumbnail from a scene that is not in the
 * film. Exported for the mapping in this file's consumers' tests. */
export function evenIndices(total, want) {
  if (want >= total) return Array.from({ length: total }, (_, i) => i);
  if (want <= 1) return [0];
  return Array.from({ length: want }, (_, i) => Math.round((i * (total - 1)) / (want - 1)));
}

function fiveOf(beats) {
  const src = (Array.isArray(beats) ? beats : []).filter((b) => typeof b === "string" && b.trim());
  if (src.length === 0) return [];
  // Tolerate an analysis that gave us fewer than five: stretch what we have.
  return src.length >= SOURCE_BEATS
    ? src.slice(0, SOURCE_BEATS)
    : Array.from({ length: SOURCE_BEATS }, (_, i) => src[Math.floor((i * src.length) / SOURCE_BEATS)]);
}

function tenOf(five) {
  return five.flatMap((b) => [
    `${b} — the moment it begins.`,
    `${b} — the moment it turns.`,
  ]);
}

/** @returns {string[]} one scene description per image, in order. */
export function beatsForCount(beats, count) {
  const five = fiveOf(beats);
  if (five.length === 0) return [];
  const n = Math.max(1, Math.min(Number(count) || SOURCE_BEATS, SOURCE_BEATS * MOMENTS));
  if (n === SOURCE_BEATS) return five;
  const base = n < SOURCE_BEATS ? five : tenOf(five);
  return evenIndices(base.length, n).map((i) => base[i]);
}

/* Which of the five arc beats produced scene image number `j` (0-based,
 * poster NOT counted). The inverse of beatsForCount — same evenIndices, so
 * they cannot disagree. */
export function beatOfSceneImage(j, sceneCount) {
  const n = Math.max(1, Math.min(Number(sceneCount) || SOURCE_BEATS, SOURCE_BEATS * MOMENTS));
  if (n <= SOURCE_BEATS) return evenIndices(SOURCE_BEATS, n)[j] ?? null;
  const moment = evenIndices(SOURCE_BEATS * MOMENTS, n)[j];
  return moment == null ? null : Math.floor(moment / MOMENTS);
}

/* The storyboard's question: which stored image shows arc beat `beatIdx`?
 *
 * Answers with an index into the entry's media.urls, or null — and null is
 * a deliberate answer, not a failure: it means "show a text tile, do not
 * guess". Guessing is the one forbidden move here, because a wrong mapping
 * puts the alligator's picture on the takeoff scene — the same face-swap
 * failure class the prompt builder guards against, one layer up.
 *
 * `poster` must be the stored truth (media.poster, written since 19.08.).
 * Entries from before that day don't carry it, and it is NOT reconstructable:
 * a preview entry also has a title and three urls, but panel 1 is a scene,
 * not a poster. undefined → null for everything.
 *
 * @param {number} beatIdx    0..4, index into the five-beat arc
 * @param {object} p
 * @param {number} p.imageCount  what was ordered (poster included, as stored)
 * @param {boolean|undefined} p.poster  whether urls[0] is the title card
 * @param {number} p.urlCount    media.urls.length — shape check against the order
 * @returns {number|null} index into media.urls, or null for "text tile"
 */
export function imageIndexForBeat(beatIdx, { imageCount, poster, urlCount }) {
  if (poster !== true && poster !== false) return null;
  const off = poster ? 1 : 0;
  const scenes = (Number(imageCount) || 0) - off;
  if (scenes < 1) return null;
  // The stored urls must match the order exactly — a film-first entry ([]),
  // a partially failed render, anything unexpected: text tiles, no guesses.
  if ((Number(urlCount) || 0) - off !== scenes) return null;
  for (let j = 0; j < scenes; j++) {
    if (beatOfSceneImage(j, scenes) === beatIdx) return j + off;
  }
  return null;
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
export function beatCountForSeconds(seconds) {
  const SECONDS_PER_BEAT = 3;
  return Math.max(2, Math.min(SOURCE_BEATS, Math.floor((Number(seconds) || 0) / SECONDS_PER_BEAT)));
}

export function beatsForSeconds(beats, seconds) {
  const src = (Array.isArray(beats) ? beats : []).filter((b) => typeof b === "string" && b.trim());
  if (src.length === 0) return [];
  const want = beatCountForSeconds(seconds);
  if (src.length <= want) return src;
  /* Gleichmäßig über den Bogen, erste und letzte Szene immer dabei: Der
     Anfang setzt den Ort, das Ende löst auf — was dazwischen wegfällt,
     schmerzt weniger als ein Film ohne Ankunft. Bei drei aus fünf ergibt
     das dieselbe Auswahl wie beatsForCount(3), also 1/3/5. */
  return evenIndices(src.length, want).map((i) => src[i]);
}

/* Die Regie-Auswahl im Storyboard (Stufe B, Antons Go 21.08.): `order`
 * sind Beat-Indizes in ANTIPP-Reihenfolge, `cap` ist, was die Filmlänge
 * trägt (beatCountForSeconds). Läuft die Auswahl über, fällt die ÄLTESTE
 * Wahl raus, nicht die neueste — wer eine sechste Szene antippt, meint
 * sie ernst; die App soll seinem letzten Wort glauben, nicht seinem
 * ersten. Der Film selbst spielt chronologisch: fürs Senden sortiert
 * selectionBeats nach Beat-Index, nicht nach Tipp-Reihenfolge. */
export function trimSelection(order, cap) {
  const seen = [...new Set(order)].filter((i) => Number.isInteger(i) && i >= 0);
  return cap > 0 ? seen.slice(Math.max(0, seen.length - cap)) : [];
}

export function selectionBeats(beats, order) {
  const src = Array.isArray(beats) ? beats : [];
  return [...order].sort((a, b) => a - b).map((i) => src[i]).filter(Boolean);
}

/* Das Kachel-Stichwort (Storyboard Variante A, Antons Wahl 22.08.):
 * Eine 84-Pixel-Kachel trägt keinen Satz — sie trägt zwei, drei Worte,
 * der ganze Satz wartet im Blatt dahinter. Aus dem englischen Beat wird
 * der Anfang genommen, Artikel fallen weg, geschnitten wird an einer
 * Wortgrenze, und ein Stoppwort bleibt nie als letztes Wort stehen
 * („Paper boat floats", nie „Paper boat floats on"). */
const KEYWORD_MAX = 26;
const KEYWORD_STOPWORDS = new Set([
  "a", "an", "the", "on", "in", "at", "of", "to", "and", "or", "as",
  "with", "into", "onto", "over", "under", "through", "from", "by",
  "is", "are", "was", "were", "his", "her", "its", "their",
]);

/* Nebensatz-Anfänge trennen wie ein Komma. Dazugekommen, als der Wortlaut
   von Hand bearbeitbar wurde (22.08., Antons Wunsch): Selbstgeschriebene
   Sätze tragen ihre Ausschmückung öfter ohne Komma an — „Water rising until
   the kitchen becomes a lake" soll auf der Kachel „Water rising" heißen,
   nicht „Water rising until".
   Bewusst nur eindeutige Einleiter: „that" oder „but" stehen auch mitten in
   der Haupthandlung („The man that follows me"), und lieber ein Wort zu viel
   als ein halbierter Sinn. */
const KEYWORD_BREAK = /\b(?:until|while|when|before|after|because|though|although)\b/i;

export function beatKeyword(beat) {
  // Nur der erste Halbsatz: das Komma trennt in den Beats fast immer
  // Haupthandlung von Ausschmückung — „Ich rows the boat, the oars…"
  // soll „Ich rows the boat" ergeben, nicht über das Komma hinweg kleben.
  const first = String(beat || "").split(/[,;.!?]/)[0];
  // …und ein Nebensatz ohne Komma zählt genauso, solange davor etwas steht.
  const brk = first.search(KEYWORD_BREAK);
  const clause = brk > 0 ? first.slice(0, brk) : first;
  const words = clause
    .replace(/["'()]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  // Führende Artikel weg — „A paper boat" beginnt bei „paper".
  while (words.length && ["a", "an", "the"].includes(words[0].toLowerCase())) words.shift();

  const kept = [];
  for (const w of words) {
    if ((kept.join(" ") + " " + w).trim().length > KEYWORD_MAX) break;
    kept.push(w);
  }
  // Kein Stoppwort als Schlusswort — es verspricht einen Satz, der fehlt.
  while (kept.length > 1 && KEYWORD_STOPWORDS.has(kept[kept.length - 1].toLowerCase())) kept.pop();
  if (!kept.length) return clause.slice(0, KEYWORD_MAX);

  const out = kept.join(" ");
  return out.charAt(0).toUpperCase() + out.slice(1);
}
