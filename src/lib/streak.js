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

/* ── Die Schlummernacht (Antons Ja vom 22.08., Plan §6)
 *
 * Duolingos wichtigste Lehre, in unserem Ton: Eine verpasste Nacht löscht
 * nicht alles. Verlustangst bindet nur bis zu dem Tag, an dem sie zuschlägt —
 * danach deinstalliert man. Bei einer TRAUM-App ist das besonders scharf:
 * Man träumt nicht auf Kommando, und eine Serie, die an „jede Nacht ein
 * erinnerter Traum" hängt, bestraft Biologie statt Nachlässigkeit.
 *
 * Regel: Je sieben Nächte verdient man EINE Schlummernacht, höchstens zwei
 * auf Vorrat. Fehlt eine Nacht und ist eine da, lebt die Serie weiter und
 * die Schlummernacht ist verbraucht. Kein Kauf, kein Ansparen ohne Ende —
 * sonst wäre die Serie irgendwann unzerstörbar und damit bedeutungslos. */
export const SNOOZE_EVERY = 7;
export const SNOOZE_MAX = 2;

/** Call after a dream is saved. Returns {streak, lastDream, snoozes?}. */
export function bumpStreak(state) {
  const today = todayStr();
  if (state.lastDream === today) return { streak: state.streak, lastDream: today };
  const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
  const streak = state.lastDream === yesterday ? (state.streak || 0) + 1 : 1;
  const patch = { streak, lastDream: today };
  /* Verdient wird beim Erreichen jeder siebten Nacht — und nach einem
     Serienbruch wieder von vorn. Anders als die Credit-Geschenke ist das
     Absicht: Die Schlummernacht kostet uns nichts, sie ist der Schutz für
     genau die Serie, die man gerade aufbaut. Der Deckel von zwei verhindert
     das Horten. */
  if (streak % SNOOZE_EVERY === 0) {
    patch.snoozes = Math.min((state.snoozes || 0) + 1, SNOOZE_MAX);
  }
  return patch;
}

/** Springt eine Schlummernacht ein? Rein — der Aufrufer speichert.
 *
 *  Läuft beim App-Start (AppState). Verpasste Nächte werden EINZELN
 *  überbrückt, eine Schlummernacht je Nacht; reicht der Vorrat nicht für
 *  ALLE, wird keine verbraucht. Eine Teilrettung gibt es nicht: Sie kostete
 *  den Vorrat und rettete trotzdem nichts.
 *
 *  Idempotent ohne Extra-Merker: Nach dem Patch steht `lastDream` auf
 *  gestern, damit ist die Lücke geschlossen und der nächste Aufruf findet
 *  nichts mehr.
 *
 *  @returns {{used: number, patch: {lastDream: string, snoozes: number}}|null}
 */
export function snoozeCheck(state, today = todayStr()) {
  const have = state?.snoozes || 0;
  if (!have || !state?.lastDream || !(state?.streak > 0)) return null;
  const missed = Math.round((new Date(today) - new Date(state.lastDream)) / 864e5) - 1;
  if (missed <= 0 || missed > have) return null;
  const bridged = new Date(new Date(today) - 864e5).toISOString().slice(0, 10);
  return { used: missed, patch: { lastDream: bridged, snoozes: have - missed } };
}

/** Wie viele Nächte bis zur nächsten Schlummernacht — für das Board.
 *  Null, wenn der Vorrat schon voll ist. */
export function nextSnoozeIn(state) {
  if ((state?.snoozes || 0) >= SNOOZE_MAX) return null;
  const streak = state?.streak || 0;
  return SNOOZE_EVERY - (streak % SNOOZE_EVERY);
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
