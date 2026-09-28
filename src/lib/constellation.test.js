import { expect, test } from "bun:test";
import { EDGES, STAGES, STARS, edgeStage, notedNights, skyState } from "./constellation.js";

test("jede Linie verbindet zwei vorhandene Sterne, jeder Stern hängt am Bild", () => {
  for (const [a, b] of EDGES) {
    expect(a).toBeLessThan(STARS.length);
    expect(b).toBeLessThan(STARS.length);
  }
  const touched = new Set(EDGES.flat());
  for (let i = 0; i < STARS.length; i++) expect(`${i}: ${touched.has(i)}`).toBe(`${i}: true`);
  expect(STAGES.at(-1)).toBe(STARS.length);
});

test("Stufen: erst fünf, dann wächst das Bild", () => {
  expect(skyState(0)).toMatchObject({ lit: 0, done: 0, next: 5, left: 5, part: 0 });
  expect(skyState(3)).toMatchObject({ lit: 3, done: 0, next: 5, left: 2 });
  expect(skyState(5)).toMatchObject({ lit: 5, done: 1, next: 8, left: 3, part: 0 });
  expect(skyState(40)).toMatchObject({ lit: 33, done: 6, next: null, complete: true, part: 1 });
});

test("jede Linie gehört zur Stufe ihres späteren Sterns", () => {
  expect(edgeStage([0, 1])).toBe(0);
  expect(edgeStage([4, 5])).toBe(1);
  expect(edgeStage([13, 32])).toBe(5);
});

test("Nächte: Kalendertage, Beispielträume zählen nicht", () => {
  const at = (d) => new Date(d).toISOString();
  expect(notedNights([
    { id: "e1", createdAt: at("2026-09-20T07:00:00") },
    { id: "e2", createdAt: at("2026-09-20T08:00:00") },
    { id: "e3", createdAt: at("2026-09-21T07:00:00") },
    { id: "e_seed_1", createdAt: at("2026-09-22T07:00:00") },
  ])).toBe(2);
});
