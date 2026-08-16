/* The star sign from a birthday. Pure date arithmetic, hence testable.
 *
 * Kept as an id ("aries"), not a display string: the UI translates it, and a
 * future interpretation feature matches on it. Boundary dates follow the
 * common western tropical convention; sources differ by ±1 day on some
 * cusps, and for a dream app the common table is the right call — nobody
 * wants an argument about April 19th at the bottom of their profile.
 */
const SIGNS = [
  // [id, last month/day it runs to] — walked in order from Capricorn's
  // January half; the December tail falls through to the final entry.
  ["capricorn", 1, 19], ["aquarius", 2, 18], ["pisces", 3, 20],
  ["aries", 4, 19], ["taurus", 5, 20], ["gemini", 6, 20],
  ["cancer", 7, 22], ["leo", 8, 22], ["virgo", 9, 22],
  ["libra", 10, 22], ["scorpio", 11, 21], ["sagittarius", 12, 21],
];

/** @param {string} date "YYYY-MM-DD"; year 0000 is fine — signs ignore it.
 *  @returns {string|null} sign id, or null when the date does not parse. */
export function zodiacOf(date) {
  const m = /^\d{4}-(\d{2})-(\d{2})$/.exec(String(date || ""));
  if (!m) return null;
  const month = Number(m[1]), day = Number(m[2]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  for (const [id, mm, dd] of SIGNS) {
    if (month < mm || (month === mm && day <= dd)) return id;
  }
  return "capricorn";   // December 22–31
}

/* The glyph for a sign. Unicode, not artwork: ♈–♓ have been in every font
 * since forever, they carry no style of their own, and they need no
 * translation — which is the whole point next to twelve names that do. */
const GLYPHS = {
  aries: "♈", taurus: "♉", gemini: "♊", cancer: "♋",
  leo: "♌", virgo: "♍", libra: "♎", scorpio: "♏",
  sagittarius: "♐", capricorn: "♑", aquarius: "♒", pisces: "♓",
};

/* The trailing U+FE0E is not decoration — it is the whole reason this reads
 * as a glyph. \u2648-\u2653 have an emoji presentation, and macOS and Android pick
 * it by default: without the variation selector the profile shows a purple
 * rounded square in an icon set that has no emoji anywhere else. FE0E asks
 * for the text presentation, which then inherits colour and weight like any
 * other character. Seen and fixed 10.08.2026. */
export function zodiacGlyph(id) {
  return GLYPHS[id] ? GLYPHS[id] + "\uFE0E" : "";
}

/** Every sign id, in calendar order. Exported so the i18n shape check and any
 *  future picker walk the same list instead of hard-coding twelve strings. */
export const ZODIAC_IDS = SIGNS.map(([id]) => id);
