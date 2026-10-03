import { expect, test } from "bun:test";
import { dreamRing, giftAtNum, nextGiftNum, pendingRingFilm, RING_SIZE } from "./dreamRing.js";

const films = (n, motif = null) => Array.from({ length: n }, (_, i) => ({ id: `d${i + 1}`, img: `sketch:${i + 1}.png`, motif }));

test("gifts sit on the quarters: 3, 6, 9 a Glimpse, 12 the ring film — and on and on", () => {
  expect([1, 2, 4, 5, 7].map(giftAtNum)).toEqual([null, null, null, null, null]);
  expect(giftAtNum(3).kind).toBe("glimpse");
  expect(giftAtNum(9).kind).toBe("glimpse");
  expect(giftAtNum(12)).toEqual({ kind: "ring", credits: 0 });
  expect(giftAtNum(15).kind).toBe("glimpse");
  expect(giftAtNum(24).kind).toBe("ring");
  expect(nextGiftNum(0)).toBe(3);
  expect(nextGiftNum(5)).toBe(6);
  expect(nextGiftNum(6)).toBe(9);
});

test("dreams fill the clock in order; the numbers keep counting past 12", () => {
  const r = dreamRing(films(5));
  expect(r.ringNo).toBe(1);
  expect(r.next).toBe(6);
  expect(r.slots.map((s) => s.num)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  expect(r.slots.filter((s) => s.dreamId).length).toBe(5);
  expect(r.slots[11].pos).toBe(0);           // die 12 sitzt oben
  expect(r.slots[2].pos).toBe(3);            // die 3 rechts

  const two = dreamRing(films(14));
  expect(two.ringNo).toBe(2);
  expect(two.slots[0].num).toBe(13);
  expect(two.slots.filter((s) => s.dreamId).map((s) => s.num)).toEqual([13, 14]);
  expect(two.next).toBe(15);
  expect(dreamRing(films(RING_SIZE)).ringNo).toBe(2);   // voll → der nächste Traum beginnt Ring 2
});

test("threads join dreams with the same motif inside the ring", () => {
  const r = dreamRing([{ id: "a", img: null, motif: "water" }, { id: "b", img: null, motif: "fire" }, { id: "c", img: null, motif: "water" }]);
  expect(r.threads).toEqual([[1, 3, "water"]]);
  expect(r.top).toEqual({ motif: "water", n: 2 });
});

test("a full ring asks for its film once, with exactly its twelve dreams", () => {
  expect(pendingRingFilm(films(11), [])).toBeNull();
  const f = pendingRingFilm(films(15, "water"), []);
  expect(f.key).toBe("ring-1");
  expect(f.dreams.map((d) => d.id)).toEqual(films(12).map((d) => d.id));
  expect(f.motif).toBe("water");
  expect(pendingRingFilm(films(15), ["ring-1"])).toBeNull();
});
