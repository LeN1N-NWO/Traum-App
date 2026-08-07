import { test, expect } from "bun:test";
import { bumpStreak, refreshStreak, todayStr } from "./streak.js";

const heute = todayStr();
const gestern = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
const vorwoche = new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10);

test("erster Traum ueberhaupt startet die Serie bei 1", () => {
  expect(bumpStreak({ streak: 0, lastDream: null })).toEqual({ streak: 1, lastDream: heute });
});

test("Traum an Folgetagen zaehlt hoch", () => {
  expect(bumpStreak({ streak: 3, lastDream: gestern })).toEqual({ streak: 4, lastDream: heute });
});

test("zweiter Traum am selben Tag aendert nichts", () => {
  expect(bumpStreak({ streak: 4, lastDream: heute })).toEqual({ streak: 4, lastDream: heute });
});

test("Luecke beginnt die Serie neu", () => {
  expect(bumpStreak({ streak: 9, lastDream: vorwoche })).toEqual({ streak: 1, lastDream: heute });
});

test("refreshStreak setzt eine abgerissene Serie zurueck", () => {
  expect(refreshStreak({ streak: 9, lastDream: vorwoche }).streak).toBe(0);
});

test("refreshStreak laesst eine laufende Serie stehen", () => {
  expect(refreshStreak({ streak: 3, lastDream: gestern }).streak).toBe(3);
});
