import { test, expect } from "bun:test";
import {
  MILESTONES, nextMilestone, milestoneProgress,
  giftFor, FILM_GIFT,
} from "./streakBoard.js";
import { FILM_UNIT } from "./plans.js";
import { priceForFilm } from "./video.js";

test("the ladder is sorted and starts reachable", () => {
  const nights = MILESTONES.map((m) => m.nights);
  expect(nights).toEqual([...nights].sort((a, b) => a - b));
  expect(nights[0]).toBeLessThanOrEqual(3);   // der erste Erfolg kommt früh
});

test("the next milestone is always the first unreached one", () => {
  expect(nextMilestone(0).nights).toBe(3);
  expect(nextMilestone(3).nights).toBe(7);
  expect(nextMilestone(99).nights).toBe(100);
  expect(nextMilestone(100)).toBeNull();
});

test("progress moves between the previous and the next rung", () => {
  expect(milestoneProgress(0)).toBe(0);
  expect(milestoneProgress(5)).toBe(0.5);     // zwischen 3 und 7
  expect(milestoneProgress(100)).toBe(1);
});

/* Die Mini-Geschenke. Jeder Credit hier ist echtes Geld, und der Zustand
   liegt im localStorage — also wird jede Regel festgenagelt, die verhindert,
   dass aus der Leiter eine Geldpresse wird. */

test("nothing is given below the first quarter", () => {
  expect(giftFor({ count: 2, credits: 0 })).toBeNull();
  expect(giftFor({})).toBeNull();
  expect(giftFor(null)).toBeNull();
});

const NOW = new Date("2026-10-03T10:00:00");

/* Traum-Ring (03.10. spätabends): 3, 6, 9 je ein Glimpse in den
   Geschenk-Topf, 12 ist der Film aus dem Ring — kein Guthaben. */
test("every quarter of the ring gives one Glimpse, once, into the gift pot", () => {
  const three = giftFor({ count: 3, credits: 2 }, NOW);
  expect(three).toMatchObject({ nights: 3, kind: "glimpse", credits: 2 });
  expect(three.patch.credits).toBeUndefined();              // gekauftes Guthaben bleibt unberührt
  expect(three.patch.giftCredits.amount).toBe(2);
  expect(three.patch.giftUnseen).toMatchObject({ nights: 3, credits: 2 });
  expect(giftFor({ count: 5, ...three.patch }, NOW)).toBeNull();
  const six = giftFor({ count: 6, ...three.patch }, NOW);
  expect(six.nights).toBe(6);
  expect(six.patch.giftCredits.amount).toBe(4);
});

test("the ring's 12 gives no credits — the numbers run on to 15", () => {
  let s = { count: 13, giftedUpTo: 9 };
  expect(giftFor(s, NOW)).toBeNull();
  s = { ...s, count: 15 };
  expect(giftFor(s, NOW).nights).toBe(15);
});

/* ⚠ Der Fall, der ohne Merker zum Dauerlauf würde: Träume löschen, neue
   machen, wieder über 6 — und das Geschenk flösse erneut. */
test("deleting dreams and making new ones does not pay twice", () => {
  expect(giftFor({ count: 7, giftedUpTo: 6 })).toBeNull();
  expect(giftFor({ count: 7, streakGifts: [3, 7] }).nights).toBe(6);   // alter Stand: die 3 ist bezahlt
});

test("the film gift is exactly one 15-second film", () => {
  expect(FILM_GIFT).toBe(priceForFilm(FILM_UNIT.model, FILM_UNIT.seconds, { quality: FILM_UNIT.quality }));
});

/* Ein Zustand mit vielen Träumen auf einmal bekommt die Viertel
   nacheinander, je Aufruf eines, und jedes genau einmal. */
test("a jump over many quarters pays them one after the other", () => {
  let s = { count: 26, credits: 0 };
  const got = [];
  for (let i = 0; i < 20; i++) {
    const g = giftFor(s, NOW);
    if (!g) break;
    got.push(g.nights);
    s = { ...s, ...g.patch };
  }
  expect(got).toEqual([3, 6, 9, 15, 18, 21]);
  expect(s.giftCredits.amount).toBe(12);
});
