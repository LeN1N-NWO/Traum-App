/* Streak of consecutive dream days.
 *
 * ⚠ CAREFUL: state.lastDream is a DATE ("2026-08-07"), not the dream text.
 * The field name suggests otherwise, and every comparison here depends on it —
 * writing the dream text there resets the streak on every single dream.
 *
 * Ported from the pre-React app as pure functions: no DOM, no saving. That is
 * what makes it testable.
 */

export function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

/** Call after a dream is saved. Returns {streak, lastDream}. */
export function bumpStreak(state) {
  const today = todayStr();
  if (state.lastDream === today) return { streak: state.streak, lastDream: today };
  const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
  return {
    streak: state.lastDream === yesterday ? (state.streak || 0) + 1 : 1,
    lastDream: today,
  };
}

/** Call when displaying: a broken streak falls back to 0. */
export function refreshStreak(state) {
  if (!state.lastDream) return { streak: state.streak || 0, lastDream: state.lastDream };
  const gap = (new Date(todayStr()) - new Date(state.lastDream)) / 864e5;
  return gap > 1
    ? { streak: 0, lastDream: state.lastDream }
    : { streak: state.streak || 0, lastDream: state.lastDream };
}

/* ── Was eine Serie einbringt ─────────────────────────────────────────────
 *
 * Bis zum 16.08.2026 war der Zähler reine Zierde: Er zählte, und das war
 * alles. Jetzt verschiebt er die Seltenheit der Wesen — je länger jemand
 * jede Nacht aufschreibt, desto eher kommt etwas Seltenes dabei heraus.
 *
 * Warum in DIESE Richtung und nicht andersherum: Eine Serie zu belohnen und
 * eine gebrochene Serie zu bestrafen sind rechnerisch dasselbe, psychologisch
 * aber nicht. Verlustdrohung erzeugt Druck, und diese App ist ein Ort, an den
 * man nachts um drei geht. Es geht also nie etwas verloren — die Wesen
 * bleiben, was sie sind, das Tagebuch bleibt vollständig, und wer eine Woche
 * aussetzt, findet alles unverändert vor. Wer dranbleibt, bekommt nur mehr.
 *
 * Absichtlich NICHT gebaut: Countdowns, „nur noch 2 Stunden", Push-Drohungen,
 * eingefrorene Inhalte. Das sind die Griffe, mit denen man Kennzahlen kauft
 * und Vertrauen ausgibt.
 */

/** Ab hier bringt eine längere Serie nichts mehr — sonst wäre „Legendary"
 *  nach einem Monat der Normalfall und das Wort bedeutungslos. */
export const STREAK_CAP = 14;

/**
 * Verschiebt Wahrscheinlichkeitsmasse von „Common" zu allem Selteneren,
 * anteilig zu deren bisherigem Gewicht — die Rangfolge der Seltenheiten
 * bleibt damit erhalten, nur der Abstand zu „Common" schrumpft.
 *
 * @param {Array<[string,string,number]>} rarities wie in creatures.js
 * @param {number} streak
 * @returns {Array<[string,string,number]>} neu gewichtet, Summe unverändert
 */
export function weightedRarities(rarities, streak = 0) {
  const t = Math.min(Math.max(streak, 0), STREAK_CAP) / STREAK_CAP;
  if (t === 0) return rarities;

  const MAX_SHIFT = 30;                     // Prozentpunkte bei voller Serie
  const shift = MAX_SHIFT * t;
  const [common, ...rest] = rarities;
  const restTotal = rest.reduce((sum, r) => sum + r[2], 0);
  if (!restTotal) return rarities;

  return [
    [common[0], common[1], common[2] - shift],
    ...rest.map(([n, c, w]) => [n, c, w + shift * (w / restTotal)]),
  ];
}

/** Steht die Serie heute auf der Kippe? Wahr genau dann, wenn gestern
 *  geschrieben wurde und heute noch nicht — der einzige Tag, an dem ein
 *  Hinweis überhaupt etwas nützt. */
export function streakAtRisk(state, today = todayStr()) {
  if (!state?.lastDream || !state?.streak) return false;
  const yesterday = new Date(new Date(today) - 864e5).toISOString().slice(0, 10);
  return state.lastDream === yesterday;
}
