import { test, expect } from "bun:test";
import { MILESTONES, nextMilestone, milestoneProgress } from "./streakBoard.js";

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
