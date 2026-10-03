import { expect, test } from "bun:test";
import { cycleDays, cycleRing, fullMoons, pendingMoonFilm } from "./moonCycle.js";
import { moonAge } from "./moon.js";
import { dayKey } from "./nights.js";

const NOW = new Date("2026-10-03T09:00:00");

test("Vollmonde: liegen einen Mondmonat auseinander und sind wirklich voll", () => {
  const { prev, last, next } = fullMoons(NOW);
  expect(last <= NOW && NOW < next).toBe(true);
  expect((next - last) / 864e5).toBeCloseTo(29.53, 1);
  expect((last - prev) / 864e5).toBeCloseTo(29.53, 1);
  expect(Math.abs(moonAge(last) - 0.5)).toBeLessThan(0.001);
});

test("Ein Zyklus hat 29 oder 30 Nächte und endet am Vollmond-Tag", () => {
  const { last, next } = fullMoons(NOW);
  const days = cycleDays(last, next);
  expect(days.length === 29 || days.length === 30).toBe(true);
  expect(days.at(-1)).toBe(dayKey(next));
  expect(days[0] > dayKey(last)).toBe(true);
});

test("Ring: eine Nacht, ein Bild; Fäden zwischen gleichen Motiven; heute und Zukunft", () => {
  const { last } = fullMoons(NOW);
  const day = (n) => { const d = new Date(last); d.setHours(12); d.setDate(d.getDate() + n); return dayKey(d); };
  const ring = cycleRing([
    { id: "a", day: day(1), motif: "water", img: null },
    { id: "b", day: day(1), motif: "water", img: "x.jpg" },   // dieselbe Nacht, mit Bild — gewinnt
    { id: "c", day: day(3), motif: "forest", img: "y.jpg" },
    { id: "d", day: day(5), motif: "water", img: "z.jpg" },
  ], NOW);
  expect(ring.days[0].dreamId).toBe("b");
  expect(ring.count).toBe(3);
  expect(ring.threads).toEqual([[0, 4, "water"]]);
  expect(ring.top).toEqual({ motif: "water", n: 2 });
  const t = ring.days.findIndex((d) => d.today);
  expect(t).toBeGreaterThanOrEqual(0);
  expect(ring.days.slice(t + 1).every((d) => d.future)).toBe(true);
  expect(ring.left).toBe(ring.days.length - 1 - t);
});

test("Mondfilm: erst am Tag nach dem Vollmond, ab drei Bildern, nur einmal", () => {
  const { last, prev } = fullMoons(NOW);
  const day = (base, n) => { const d = new Date(base); d.setHours(12); d.setDate(d.getDate() + n); return dayKey(d); };
  const dreams = [2, 5, 9, 14].map((n, i) => ({ id: `p${i}`, day: day(prev, n), motif: i < 3 ? "water" : "forest", img: `${i}.jpg` }));
  const morning = new Date(last); morning.setDate(morning.getDate() + 1); morning.setHours(8);
  const film = pendingMoonFilm(dreams, [], morning);
  expect(film).toMatchObject({ key: dayKey(last), motif: "water" });
  expect(film.dreams.map((d) => d.id)).toEqual(["p0", "p1", "p2", "p3"]);
  expect(pendingMoonFilm(dreams, [dayKey(last)], morning)).toBeNull();
  expect(pendingMoonFilm(dreams.slice(0, 2), [], morning)).toBeNull();
});
