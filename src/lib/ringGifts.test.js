import { test, expect } from "bun:test";
import { claimableGifts } from "./ringGifts.js";

test("a buyer gets every credit gift up to the dream count, once per place", () => {
  expect(claimableGifts({ claimed: 50, rows: 60, paid: true }).gifts).toEqual([
    { place: 24, credits: 16, ref: "ring-gift-24" },
    { place: 36, credits: 32, ref: "ring-gift-36" },
    { place: 48, credits: 50, ref: "ring-gift-48" },
  ]);
  expect(claimableGifts({ claimed: 30, rows: 30, paid: true }).gifts.map((g) => g.place)).toEqual([24]);
  expect(claimableGifts({ claimed: 23, rows: 30, paid: true }).gifts).toEqual([]);
});

test("nobody who never bought gets credits — the 10 glimpses stay on the device", () => {
  expect(claimableGifts({ claimed: 48, rows: 48, paid: false })).toEqual({ count: 48, gifts: [] });
});

/* 3a: Die App sagt die Zahl, der Server glaubt ihr nur so weit, wie er
   Traum-Zeilen hat. */
test("the app's count is capped by the dream rows on the server", () => {
  expect(claimableGifts({ claimed: 48, rows: 25, paid: true }).gifts.map((g) => g.place)).toEqual([24]);
  expect(claimableGifts({ claimed: 1000, rows: 0, paid: true })).toEqual({ count: 0, gifts: [] });
});

test("nonsense counts give nothing", () => {
  for (const claimed of [undefined, null, "48", -5, 2.5, Infinity, NaN]) {
    expect(claimableGifts({ claimed, rows: 100, paid: true }).gifts).toEqual([]);
  }
});
