import { test, expect } from "bun:test";
import {
  MILESTONES, nextMilestone, milestoneProgress,
  giftFor, FILM_GIFT, BLOOM, BLOOM_CREDITS, BLOOM_GLIMPSES, giftLabel, isGlimpseGift,
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

/* Traum-Ring (03.10. spätabends): 3, 6, 9 je ein Glimpse, 12 ist der Film
   aus dem Ring — kein Guthaben. Seit 10.10. ist der Glimpse ein Glimpse
   (eigene Kategorie `glimpseGifts`), keine 2 Credits im Geschenktopf. */
test("every quarter of the ring gives one Glimpse, once — as a Glimpse, not credits", () => {
  const three = giftFor({ count: 3, credits: 2 }, NOW);
  expect(three).toMatchObject({ nights: 3, kind: "glimpse", credits: 0, glimpses: 1 });
  expect(three.patch.credits).toBeUndefined();              // gekauftes Guthaben bleibt unberührt
  expect(three.patch.giftCredits).toBeUndefined();          // kein Credit-Geschenk mehr
  expect(three.patch.glimpseGifts).toBe(1);
  expect(three.patch.giftUnseen).toMatchObject({ nights: 3, kind: "glimpse", glimpses: 1 });
  expect(giftFor({ count: 5, ...three.patch }, NOW)).toBeNull();
  const six = giftFor({ count: 6, ...three.patch }, NOW);
  expect(six.nights).toBe(6);
  expect(six.patch.glimpseGifts).toBe(2);
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
  expect(got).toEqual([3, 6, 9, 15, 18, 21]);               // die 24 nur nach einem Kauf
  expect(s.glimpseGifts).toBe(6);
  expect(s.giftCredits).toBeUndefined();
});

/* Die großen Geschenke (Antons Entscheidung 10.10.): nur nach einem Kauf —
   wer nie gekauft hat, bekommt bei 48 zehn Glimpses statt 50 Credits. */
const run = (s, upTo) => {
  const got = [];
  for (let i = 0; i < 40; i++) {
    const g = giftFor(s, NOW);
    if (!g || g.nights > upTo) break;
    got.push([g.nights, g.kind, g.credits, g.glimpses]);
    s = { ...s, ...g.patch };
  }
  return { got, s };
};

test("after a purchase, the full rings 24, 36, 48 give films and the full bloom", () => {
  const { got, s } = run({ count: 48, paidAt: "2026-10-01T00:00:00Z" }, 48);
  expect(got.filter(([n]) => n % 12 === 0)).toEqual([
    [24, "ringFilm", FILM_GIFT, 0],
    [36, "ringFilms", 2 * FILM_GIFT, 0],
    [BLOOM, "bloom", BLOOM_CREDITS, 0],
  ]);
  expect(got.some(([n]) => n === 12)).toBe(false);          // die 12 ist der Ring-Film vom iPhone
  expect(s.glimpseGifts).toBe(12);                           // 3, 6, 9 · 15, 18, 21 · 27, 30, 33 · 39, 42, 45
  expect(s.giftCredits.amount).toBe(FILM_GIFT * 3 + BLOOM_CREDITS);
});

test("never bought: nothing big at 24 and 36, ten Glimpses at 48 — never credits", () => {
  const { got, s } = run({ count: 48 }, 48);
  expect(got.filter(([n]) => n % 12 === 0)).toEqual([[BLOOM, "bloomGlimpses", 0, BLOOM_GLIMPSES]]);
  expect(s.giftCredits).toBeUndefined();
  expect(s.glimpseGifts).toBe(12 + BLOOM_GLIMPSES);
});

test("buying before the next quarter still brings the 24; after it, the place is gone", () => {
  let s = { count: 24, giftedUpTo: 21 };
  expect(giftFor(s, NOW)).toBeNull();                        // erreicht, aber nie gekauft
  expect(giftFor({ ...s, count: 25, paidAt: "x" }, NOW)).toMatchObject({ nights: 24, kind: "ringFilm" });
  s = { ...s, count: 27, ...giftFor({ ...s, count: 27 }, NOW).patch };   // 27 genommen, ohne Kauf
  expect(s.giftedUpTo).toBe(27);
  expect(giftFor({ ...s, count: 28, paidAt: "x" }, NOW)).toBeNull();
});

test("gift labels say what the gift is", () => {
  const t = { streakBoard: { giftKinds: { glimpse: () => "A free Glimpse", bloomGlimpses: (n) => `${n} Glimpses`, bloom: (n) => `${n} credits` } } };
  expect(giftLabel(t, { kind: "bloomGlimpses", credits: 0, glimpses: 10 })).toBe("10 Glimpses");
  expect(giftLabel(t, { kind: "bloom", credits: 50, glimpses: 0 })).toBe("50 credits");
  expect(isGlimpseGift("glimpse") && isGlimpseGift("bloomGlimpses")).toBe(true);
  expect(isGlimpseGift("ringFilm")).toBe(false);
});
