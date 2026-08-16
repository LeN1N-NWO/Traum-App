import { test, expect } from "bun:test";
import { zodiacOf, zodiacGlyph, ZODIAC_IDS } from "./zodiac.js";

test("boundaries land on the conventional sides", () => {
  expect(zodiacOf("1990-01-19")).toBe("capricorn");
  expect(zodiacOf("1990-01-20")).toBe("aquarius");
  expect(zodiacOf("1990-03-20")).toBe("pisces");
  expect(zodiacOf("1990-03-21")).toBe("aries");
  expect(zodiacOf("1990-12-21")).toBe("sagittarius");
  expect(zodiacOf("1990-12-22")).toBe("capricorn");
  expect(zodiacOf("1990-12-31")).toBe("capricorn");
});

test("the year is irrelevant — 0000 (year withheld) works", () => {
  expect(zodiacOf("0000-08-09")).toBe("leo");
});

test("garbage never throws, it returns null", () => {
  for (const bad of ["", null, undefined, "morgen", "1990-13-01", "1990-00-10", "1990-1-2"]) {
    expect(zodiacOf(bad)).toBe(null);
  }
});

/* Every sign the date arithmetic can produce needs a glyph — a missing one
 * shows up as an empty box next to someone's name, which looks like a bug in
 * their profile rather than in this table. */
test("every sign has a glyph", () => {
  for (const id of ZODIAC_IDS) {
    expect(zodiacGlyph(id)).not.toBe("");
  }
  expect(ZODIAC_IDS.length).toBe(12);
});

test("an unknown sign yields no glyph rather than throwing", () => {
  expect(zodiacGlyph("ophiuchus")).toBe("");
  expect(zodiacGlyph(null)).toBe("");
});
