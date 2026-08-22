/* Which days carry a dream, and which one — the data behind the journal
 * calendar. Pure date arithmetic, no DOM, hence testable.
 *
 * Keys are LOCAL dates ("2026-08-08"): a dream written at 00:30 belongs to
 * the night the person just had, in their timezone — toISOString() would
 * shift it to UTC and light up the wrong square.
 */

export function localDateKey(date) {
  const d = new Date(date);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

/**
 * The journal grouped by the local day it was written on, newest first
 * within a day. A Map and not a Set of keys, because a lit square now has
 * to open the dream behind it, not just prove one exists.
 * @returns {Map<string, object[]>} localDateKey → entries
 */
export function dreamsByDay(journal = []) {
  const days = new Map();
  for (const e of journal) {
    if (!e?.createdAt) continue;
    /* Leere Nächte gehören nicht in diese Karte: Der Kalender öffnet beim
       Antippen einen Traum, und ein Eintrag ohne Text hätte nichts zu
       zeigen. Sie kommen als eigene Menge zurück (blankDays unten) und
       erscheinen als blasser Punkt — anwesend, aber nicht antippbar. */
    if (e.kind === "blank") continue;
    const key = localDateKey(e.createdAt);
    const list = days.get(key);
    if (list) list.push(e);
    else days.set(key, [e]);
  }
  for (const list of days.values()) {
    list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
  return days;
}

/**
 * The cell grid for one month, Monday-first (as on paper calendars here).
 * Leading nulls pad the first week so day 1 lands on its weekday.
 * @returns {(number|null)[]} e.g. [null, null, 1, 2, ..., 31]
 */
export function monthCells(year, month /* 0-based */) {
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const lead = (first.getDay() + 6) % 7;   // Sunday-first → Monday-first
  const cells = Array(lead).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  return cells;
}

/** Die Tage, an denen „nichts hängengeblieben" vermerkt wurde.
 *  Getrennt von dreamsByDay, weil sie im Kalender anders aussehen und sich
 *  anders verhalten: sichtbar, aber nicht antippbar. */
export function blankDays(journal = []) {
  const days = new Set();
  for (const e of journal || []) {
    if (e?.kind === "blank" && e.createdAt) days.add(localDateKey(e.createdAt));
  }
  return days;
}
