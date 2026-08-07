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
