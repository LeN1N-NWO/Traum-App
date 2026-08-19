import { test, expect } from "bun:test";
import { beatsForCount } from "./beats.js";

const five = ["one", "two", "three", "four", "five"];

test("five beats pass through unchanged", () => {
  expect(beatsForCount(five, 5)).toEqual(five);
});

test("three images take first, middle and last", () => {
  expect(beatsForCount(five, 3)).toEqual(["one", "three", "five"]);
});

test("ten images split every beat in two", () => {
  const out = beatsForCount(five, 10);
  expect(out).toHaveLength(10);
  expect(out[0]).toContain("one");
  expect(out[1]).toContain("one");
  expect(out[9]).toContain("five");
});

test("fewer than five beats are stretched, not dropped", () => {
  const out = beatsForCount(["a", "b"], 5);
  expect(out).toHaveLength(5);
  expect(new Set(out)).toEqual(new Set(["a", "b"]));
});

test("empty input yields nothing rather than throwing", () => {
  expect(beatsForCount([], 5)).toEqual([]);
  expect(beatsForCount(null, 5)).toEqual([]);
});

test("blank strings are ignored", () => {
  expect(beatsForCount(["a", "   ", "b"], 3)).toHaveLength(3);
});

/* Der Bogen und die Filmlänge.
 *
 * Für eine Bildstrecke sind fünf Szenen immer richtig — jedes Bild wird
 * beliebig lange betrachtet. Ein Film hat diese Freiheit nicht: Bis
 * 19.08.2026 bekam der Regisseur fünf Szenen auch für einen Fünf-Sekünder,
 * also eine Sekunde je Szene. */
import { beatsForSeconds } from "./beats.js";

const ARC = ["waiting", "rabbits", "alligator", "running", "takeoff"];

test("a short film gets fewer beats, a long one keeps all five", () => {
  expect(beatsForSeconds(ARC, 5).length).toBe(2);   // 5/3 = 1 → Untergrenze 2
  expect(beatsForSeconds(ARC, 9).length).toBe(3);
  expect(beatsForSeconds(ARC, 15).length).toBe(5);
  expect(beatsForSeconds(ARC, 30).length).toBe(5);  // mehr Zeit je Szene, nicht mehr Szenen
});

test("the first and last beat always survive the cut", () => {
  // Der Anfang setzt den Ort, das Ende löst auf. Ein Film ohne Ankunft ist
  // schlimmer als einer, dem eine Zwischenstufe fehlt.
  for (const s of [5, 6, 9, 12, 15, 30]) {
    const got = beatsForSeconds(ARC, s);
    expect(got[0]).toBe("waiting");
    expect(got[got.length - 1]).toBe("takeoff");
  }
});

test("three beats out of five pick the same ones as the image path", () => {
  // Bildstrecke und Film sollen nicht verschiedene Geschichten erzählen.
  expect(beatsForSeconds(ARC, 9)).toEqual(beatsForCount(ARC, 3));
});

test("no beat is ever repeated when shortening", () => {
  for (const s of [5, 6, 7, 8, 9, 10, 12, 15, 20, 30]) {
    const got = beatsForSeconds(ARC, s);
    expect(new Set(got).size).toBe(got.length);
  }
});

test("garbage in, empty out — never a crash", () => {
  expect(beatsForSeconds([], 10)).toEqual([]);
  expect(beatsForSeconds(null, 10)).toEqual([]);
  expect(beatsForSeconds(ARC, 0).length).toBe(2);
  expect(beatsForSeconds(ARC, undefined).length).toBe(2);
  // Weniger Szenen als Plätze: nimm, was da ist.
  expect(beatsForSeconds(["only one"], 30)).toEqual(["only one"]);
});
