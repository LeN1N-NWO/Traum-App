import { test, expect } from "bun:test";
import {
  MILESTONES, nextMilestone, milestoneProgress,
  giftFor, giftAt, giftInfo, GIFTS, GIFT_CAP, FILM_GIFT,
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

test("nothing is given below the first threshold", () => {
  expect(giftFor({ count: 2, credits: 0 })).toBeNull();
  expect(giftFor({})).toBeNull();
  expect(giftFor(null)).toBeNull();
});

const NOW = new Date("2026-10-03T10:00:00");

test("three nights give one Glimpse, seven a whole film — once each, into the gift pot", () => {
  const three = giftFor({ count: 3, credits: 2 }, NOW);
  expect(three).toMatchObject({ nights: 3, kind: "glimpse", credits: 2 });
  expect(three.patch.credits).toBeUndefined();              // gekauftes Guthaben bleibt unberührt
  expect(three.patch.giftCredits.amount).toBe(2);
  expect(three.patch.giftUnseen).toMatchObject({ nights: 3, credits: 2 });
  const seven = giftFor({ count: 7, ...three.patch }, NOW);
  expect(seven).toMatchObject({ nights: 7, kind: "film", credits: FILM_GIFT });
  expect(seven.patch.giftCredits.amount).toBe(2 + FILM_GIFT);
  expect(seven.patch.streakGifts).toEqual([3, 7]);
  expect(giftFor({ count: 7, ...seven.patch }, NOW)).toBeNull();
});

test("the film gift is exactly one 15-second film", () => {
  expect(FILM_GIFT).toBe(priceForFilm(FILM_UNIT.model, FILM_UNIT.seconds, { quality: FILM_UNIT.quality }));
  expect(giftInfo(7).kind).toBe("film");
});

/* ⚠ Der Fall, der ohne Liste zum Dauerlauf würde: Träume löschen, neue
   machen, wieder über 7 — und das Geschenk flösse erneut. */
test("deleting dreams and making new ones does not pay twice", () => {
  expect(giftFor({ count: 9, streakGifts: [3, 7] })).toBeNull();
});

test("the table never promises more than the cap allows", () => {
  const total = GIFTS.reduce((s, g) => s + g.credits, 0);
  expect(total).toBeLessThanOrEqual(GIFT_CAP);
  expect(giftAt(14)).toBe(20);
  expect(giftAt(999)).toBe(0);
});

/* Ein Zustand, der aus dem Nichts eine hohe Serie mitbringt (Import, alter
   Stand), bekommt die Schwellen nacheinander — nie mehr als den Deckel. */
test("a jump past every threshold pays them one after the other, capped", () => {
  let s = { count: 100, credits: 0 };
  let total = 0;
  for (let i = 0; i < 10; i++) {
    const g = giftFor(s, NOW);
    if (!g) break;
    total += g.credits;
    s = { ...s, ...g.patch };
  }
  expect(total).toBe(GIFT_CAP);
  expect(s.giftCredits.amount).toBe(GIFT_CAP);
  expect(s.credits).toBe(0);
});
