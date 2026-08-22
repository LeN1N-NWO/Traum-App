import { test, expect } from "bun:test";
import { blankNight, isBlank, nightMarked, BLANK_KIND } from "./blankNight.js";
import { realDreams } from "./atlas.js";

/* Die leere Nacht darf NIRGENDS als Traum durchgehen — sie hält nur die
   Serie. Jede Aufweichung verwässert gleichzeitig Atlas, Reflection,
   Menagerie und Statistik, deshalb steht die Regel hier unter Aufsicht. */

test("eine leere Nacht trägt nichts als ihre Sorte", () => {
  const b = blankNight(new Date("2026-08-22T07:00:00"));
  expect(b.kind).toBe(BLANK_KIND);
  expect(isBlank(b)).toBe(true);
  for (const feld of ["text", "title", "analysis", "media", "creatureId"]) {
    expect(b[feld]).toBeUndefined();
  }
});

test("realDreams zählt sie nicht mit", () => {
  const journal = [
    { id: "e1", createdAt: "2026-08-21T07:00:00", text: "ein Traum" },
    blankNight(new Date("2026-08-22T07:00:00")),
  ];
  expect(realDreams(journal).map((e) => e.id)).toEqual(["e1"]);
});

test("ein normaler Traum ist nie blank", () => {
  expect(isBlank({ id: "e1", text: "..." })).toBe(false);
  expect(isBlank(null)).toBe(false);
});

/* Der Knopf verschwindet, sobald der Tag einen Vermerk hat — egal welchen.
   Zweimal „nichts" am selben Tag ist keine zweite Nacht, und „nichts" nach
   einem geschriebenen Traum wäre schlicht falsch. */
test("ein markierter Tag nimmt keinen zweiten Vermerk an", () => {
  const heute = new Date("2026-08-22T09:00:00");
  expect(nightMarked([], heute)).toBe(false);
  expect(nightMarked([blankNight(heute)], heute)).toBe(true);
  expect(nightMarked([{ id: "e1", createdAt: "2026-08-22T03:00:00" }], heute)).toBe(true);
  // Gestern zählt nicht für heute.
  expect(nightMarked([{ id: "e1", createdAt: "2026-08-21T23:00:00" }], heute)).toBe(false);
});
