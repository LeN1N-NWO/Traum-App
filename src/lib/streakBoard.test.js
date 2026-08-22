import { test, expect } from "bun:test";
import {
  MILESTONES, nextMilestone, milestoneProgress,
  giftFor, giftAt, GIFTS, GIFT_CAP,
} from "./streakBoard.js";

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
  expect(giftFor({ streak: 6, credits: 0 })).toBeNull();
  expect(giftFor({})).toBeNull();
  expect(giftFor(null)).toBeNull();
});

test("seven nights hand over exactly one credit — once", () => {
  const first = giftFor({ streak: 7, credits: 2 });
  expect(first.credits).toBe(1);
  expect(first.patch.credits).toBe(3);
  expect(first.patch.streakGifts).toEqual([7]);
  // Derselbe Zustand ein zweites Mal: nichts mehr.
  expect(giftFor({ streak: 7, credits: 3, streakGifts: [7] })).toBeNull();
});

/* ⚠ Der Fall, der ohne Liste zum Dauerlauf würde: Serie reißt, wächst
   wieder über 7 — und der Credit flösse erneut. */
test("a streak that breaks and regrows does not pay twice", () => {
  const after = { streak: 9, credits: 3, streakGifts: [7] };
  expect(giftFor(after)).toBeNull();
});

test("thirty nights are the second and last payout", () => {
  const g = giftFor({ streak: 30, credits: 0, streakGifts: [7] });
  expect(g.credits).toBe(3);
  expect(g.patch.streakGifts).toEqual([7, 30]);
  expect(giftFor(g.patch)).toBeNull();        // danach ist die Leiter durch
});

/* Der Deckel muss die Tabelle decken, nicht umgekehrt: Wer eine dritte
   Schwelle einträgt, ohne GIFT_CAP anzuheben, verschenkt sie ins Leere. */
test("the table never promises more than the cap allows", () => {
  const total = GIFTS.reduce((s, g) => s + g.credits, 0);
  expect(total).toBeLessThanOrEqual(GIFT_CAP);
  expect(giftAt(7)).toBe(1);
  expect(giftAt(999)).toBe(0);
});

/* Ein Zustand, der aus dem Nichts eine hohe Serie mitbringt (Import, alter
   Stand), bekommt die Schwellen nacheinander — nie mehr als den Deckel. */
test("a jump past both thresholds pays them one after the other, capped", () => {
  let s = { streak: 100, credits: 0 };
  let total = 0;
  for (let i = 0; i < 5; i++) {
    const g = giftFor(s);
    if (!g) break;
    total += g.credits;
    s = { ...s, ...g.patch };
  }
  expect(total).toBe(GIFT_CAP);
  expect(s.credits).toBe(GIFT_CAP);
});
