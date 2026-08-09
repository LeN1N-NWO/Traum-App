import { test, expect } from "bun:test";
import { localDateKey, dreamsByDay, monthCells } from "./dreamDays.js";

test("localDateKey uses the local day, not the UTC day", () => {
  // 00:30 local is still "tonight" — whatever UTC thinks about it.
  const halfPastMidnight = new Date(2026, 7, 8, 0, 30);
  expect(localDateKey(halfPastMidnight)).toBe("2026-08-08");
});

test("dreamsByDay groups by day and keeps every entry", () => {
  const days = dreamsByDay([
    { id: "a", createdAt: new Date(2026, 7, 8, 0, 30).toISOString() },
    { id: "b", createdAt: new Date(2026, 7, 8, 23, 0).toISOString() },
    { id: "c", createdAt: new Date(2026, 7, 7, 9, 0).toISOString() },
    { id: "x", createdAt: null },
    null,
  ]);
  expect(days.size).toBe(2);
  expect(days.get("2026-08-07").map((e) => e.id)).toEqual(["c"]);
  // Newest first inside the day, so tapping a square opens the last dream
  // of that night rather than whichever happened to be stored first.
  expect(days.get("2026-08-08").map((e) => e.id)).toEqual(["b", "a"]);
});

test("monthCells pads to Monday-first and holds every day", () => {
  // August 2026 starts on a Saturday → five leading blanks.
  const cells = monthCells(2026, 7);
  expect(cells.slice(0, 5)).toEqual([null, null, null, null, null]);
  expect(cells[5]).toBe(1);
  expect(cells[cells.length - 1]).toBe(31);
  expect(cells.filter(Boolean).length).toBe(31);
});

test("a month starting on Monday has no padding", () => {
  // June 2026 starts on a Monday.
  expect(monthCells(2026, 5)[0]).toBe(1);
});
