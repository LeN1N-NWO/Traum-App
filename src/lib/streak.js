/* Serie ("Streak") aufeinanderfolgender Traumtage.
 *
 * ⚠ ACHTUNG: state.lastDream ist ein DATUM ("2026-08-07"), nicht der
 * Traumtext. Der Feldname legt das Gegenteil nahe, und alle Vergleiche hier
 * hängen daran — wer den Traumtext hineinschreibt, setzt die Serie bei jedem
 * Traum auf 1 zurück.
 *
 * Portiert aus legacy/index.html, aber als reine Funktionen: kein DOM-Zugriff,
 * kein Speichern. Dadurch prüfbar.
 */

export function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

/** Nach einem gespeicherten Traum aufrufen. Liefert {streak, lastDream}. */
export function bumpStreak(state) {
  const heute = todayStr();
  if (state.lastDream === heute) return { streak: state.streak, lastDream: heute };
  const gestern = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
  return {
    streak: state.lastDream === gestern ? (state.streak || 0) + 1 : 1,
    lastDream: heute,
  };
}

/** Beim Anzeigen aufrufen: eine abgerissene Serie fällt auf 0. */
export function refreshStreak(state) {
  if (!state.lastDream) return { streak: state.streak || 0, lastDream: state.lastDream };
  const abstand = (new Date(todayStr()) - new Date(state.lastDream)) / 864e5;
  return abstand > 1
    ? { streak: 0, lastDream: state.lastDream }
    : { streak: state.streak || 0, lastDream: state.lastDream };
}
