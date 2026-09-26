import { expect, test } from "bun:test";
import { SKETCH_FREE, SKETCH_PRICE, monthKey, sketchFreeLeft, sketchCost, countSketch } from "./sketchQuota.js";

const sept = new Date(2026, 8, 25);
const okt = new Date(2026, 9, 1);

test("monthKey: zweistellig, Ortszeit", () => {
  expect(monthKey(sept)).toBe("2026-09");
  expect(monthKey(okt)).toBe("2026-10");
});

test("neues Gerät: volles Gratis-Kontingent, kostet nichts", () => {
  expect(sketchFreeLeft({}, sept)).toBe(SKETCH_FREE);
  expect(sketchCost({}, sept)).toBe(0);
});

test("zählt hoch, und nach dem Kontingent kostet es Credits", () => {
  let s = {};
  for (let i = 0; i < SKETCH_FREE; i++) s = { ...s, ...countSketch(s, sept) };
  expect(sketchFreeLeft(s, sept)).toBe(0);
  expect(sketchCost(s, sept)).toBe(SKETCH_PRICE);
});

test("neuer Monat: Kontingent wieder voll, Zähler beginnt bei 1", () => {
  const s = { sketchQuota: { month: "2026-09", used: 9 } };
  expect(sketchFreeLeft(s, okt)).toBe(SKETCH_FREE);
  expect(countSketch(s, okt)).toEqual({ sketchQuota: { month: "2026-10", used: 1 } });
});

test("kaputter Zähler wird nicht negativ", () => {
  expect(sketchFreeLeft({ sketchQuota: { month: "2026-09", used: -5 } }, sept)).toBe(SKETCH_FREE);
  expect(sketchFreeLeft({ sketchQuota: { month: "2026-09", used: "x" } }, sept)).toBe(SKETCH_FREE);
});
