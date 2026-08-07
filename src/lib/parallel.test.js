import { test, expect } from "bun:test";
import { mapWithLimit } from "./parallel.js";

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

test("results keep input order even when work finishes out of order", async () => {
  // First item is slowest — if order were completion order, it would end last.
  const out = await mapWithLimit([30, 1, 1], 3, async (ms, i) => {
    await wait(ms);
    return i;
  });
  expect(out).toEqual([0, 1, 2]);
});

test("never exceeds the concurrency limit", async () => {
  let live = 0, peak = 0;
  await mapWithLimit([1, 2, 3, 4, 5, 6], 2, async () => {
    live++; peak = Math.max(peak, live);
    await wait(5);
    live--;
  });
  expect(peak).toBeLessThanOrEqual(2);
});

test("a limit above the list length is harmless", async () => {
  expect(await mapWithLimit([1, 2], 99, async (n) => n * 2)).toEqual([2, 4]);
});

test("an empty list does no work", async () => {
  let calls = 0;
  expect(await mapWithLimit([], 3, async () => { calls++; })).toEqual([]);
  expect(calls).toBe(0);
});

test("one failure rejects the batch rather than returning it half done", async () => {
  const run = mapWithLimit([1, 2, 3], 2, async (n) => {
    if (n === 2) throw new Error("nope");
    return n;
  });
  await expect(run).rejects.toThrow("nope");
});
