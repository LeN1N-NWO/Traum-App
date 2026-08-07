import { test, expect } from "bun:test";
import { bumpStreak, refreshStreak, todayStr } from "./streak.js";

const today = todayStr();
const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
const lastWeek = new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10);

test("the very first dream starts the streak at 1", () => {
  expect(bumpStreak({ streak: 0, lastDream: null })).toEqual({ streak: 1, lastDream: today });
});

test("a dream on consecutive days counts up", () => {
  expect(bumpStreak({ streak: 3, lastDream: yesterday })).toEqual({ streak: 4, lastDream: today });
});

test("a second dream the same day changes nothing", () => {
  expect(bumpStreak({ streak: 4, lastDream: today })).toEqual({ streak: 4, lastDream: today });
});

test("a gap restarts the streak", () => {
  expect(bumpStreak({ streak: 9, lastDream: lastWeek })).toEqual({ streak: 1, lastDream: today });
});

test("refreshStreak resets a broken streak", () => {
  expect(refreshStreak({ streak: 9, lastDream: lastWeek }).streak).toBe(0);
});

test("refreshStreak leaves a running streak alone", () => {
  expect(refreshStreak({ streak: 3, lastDream: yesterday }).streak).toBe(3);
});
