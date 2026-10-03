import { expect, test } from "bun:test";
import { SKETCH_FREE, SKETCH_BASE, SKETCH_EXTRA, SKETCH_STRIPS, monthKey, sketchFreeLeft, sketchCost, countSketch, sketchTiming, recommendedStrips, clampStrips } from "./sketchQuota.js";
import { soundCostUsd } from "./sketchSound.js";
import { imagePrice } from "./imageModel.js";
import { CREDIT_COST_USD } from "./plans.js";
import { SKETCH_STRIP } from "./sketchPrompt.js";

const sept = new Date(2026, 8, 25);
const okt = new Date(2026, 9, 1);

test("monthKey: zweistellig, Ortszeit", () => {
  expect(monthKey(sept)).toBe("2026-09");
  expect(monthKey(okt)).toBe("2026-10");
});

test("neues Gerät: fünf gratis, das erste Bild kostet nichts, jedes weitere einen Credit", () => {
  expect(SKETCH_FREE).toBe(5);
  expect(sketchFreeLeft({}, sept)).toBe(5);
  expect(sketchCost({}, 1, sept)).toBe(0);
  expect(sketchCost({}, 2, sept)).toBe(1);
  expect(sketchCost({}, 3, sept)).toBe(2);
});

test("nach dem Kontingent: erstes Bild + Ton, dann je Bild", () => {
  let s = {};
  for (let i = 0; i < SKETCH_FREE; i++) s = { ...s, ...countSketch(s, sept) };
  expect(sketchFreeLeft(s, sept)).toBe(0);
  expect(sketchCost(s, 1, sept)).toBe(SKETCH_BASE);
  expect(sketchCost(s, 3, sept)).toBe(SKETCH_BASE + 2 * SKETCH_EXTRA);
});

/* Antons Regel „nie zu günstig verkaufen": Was ein Glimpse im Einkauf
   kostet (Bilder + Ton über die ganze Filmlänge), darf nie über dem
   liegen, was seine Credits einbringen — bezahlt wie gratis (dort zählt
   nur, was ÜBER das Gratis-Bild hinausgeht). */
test("kein Glimpse kostet im Einkauf mehr, als seine Credits einbringen", () => {
  const strip = imagePrice("gpt-image-2", "low", { width: SKETCH_STRIP.width, height: SKETCH_STRIP.height });
  const spent = { sketchQuota: { month: monthKey(sept), used: SKETCH_FREE } };
  for (const n of SKETCH_STRIPS) {
    const usd = n * strip + soundCostUsd(sketchTiming(n).seconds);
    expect(sketchCost(spent, n, sept) * CREDIT_COST_USD).toBeGreaterThanOrEqual(usd);
    const extraUsd = usd - (strip + soundCostUsd(sketchTiming(1).seconds));
    expect(sketchCost({}, n, sept) * CREDIT_COST_USD).toBeGreaterThanOrEqual(extraUsd);
  }
});

test("Länge: 4, 8, 12 Szenen — je mehr, desto kürzer jede", () => {
  expect(sketchTiming(1)).toMatchObject({ scenes: 4, seconds: 16.2 });
  expect(sketchTiming(2).scenes).toBe(8);
  expect(sketchTiming(3).scenes).toBe(12);
  expect(sketchTiming(3).hold).toBeLessThan(sketchTiming(1).hold);
  expect(sketchTiming(3).seconds).toBeGreaterThan(sketchTiming(2).seconds);
  expect(clampStrips(9)).toBe(3);
  expect(clampStrips(0)).toBe(1);
});

test("Empfehlung: ein Bild je vier Szenen der Analyse", () => {
  expect(recommendedStrips(3)).toBe(1);
  expect(recommendedStrips(6)).toBe(2);
  expect(recommendedStrips(12)).toBe(3);
  expect(recommendedStrips(20)).toBe(3);
  expect(recommendedStrips(0)).toBe(1);
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
