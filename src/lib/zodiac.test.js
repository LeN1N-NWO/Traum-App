import { test, expect } from "bun:test";
import { zodiacOf } from "./zodiac.js";

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
