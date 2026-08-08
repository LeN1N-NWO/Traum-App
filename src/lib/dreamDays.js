/* Which days carry at least one dream — the data behind the profile
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

/** Set of localDateKeys that have at least one journal entry. */
export function dreamDays(journal = []) {
  const days = new Set();
  for (const e of journal) {
    if (e?.createdAt) days.add(localDateKey(e.createdAt));
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
