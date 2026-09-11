import { test, expect, describe } from "bun:test";
import { readFileSync } from "node:fs";
import { shouldDismiss, rubberBand, LEAVE_MS, DISMISS_FRACTION } from "./useSheet.js";

describe("shouldDismiss — when a pulled sheet lets go", () => {
  test("a slow pull past a quarter of the height closes, short of it does not", () => {
    expect(shouldDismiss({ dy: 101, height: 400, velocity: 0.1 })).toBe(true);
    expect(shouldDismiss({ dy: 99, height: 400, velocity: 0.1 })).toBe(false);
    expect(DISMISS_FRACTION).toBe(0.25);
  });

  test("a flick closes early, but a twitch is not a flick", () => {
    expect(shouldDismiss({ dy: 40, height: 800, velocity: 0.9 })).toBe(true);
    expect(shouldDismiss({ dy: 8, height: 800, velocity: 2 })).toBe(false);
  });

  test("pulled upward or not at all, it never closes", () => {
    expect(shouldDismiss({ dy: -200, height: 400, velocity: 3 })).toBe(false);
    expect(shouldDismiss({ dy: 0, height: 400, velocity: 0 })).toBe(false);
    expect(shouldDismiss({ dy: NaN, height: 400, velocity: 1 })).toBe(false);
  });
});

describe("rubberBand — the wrong way gives way ever less", () => {
  test("downward passes through unchanged", () => {
    expect(rubberBand(0)).toBe(0);
    expect(rubberBand(150)).toBe(150);
  });

  test("upward resists, more with distance, and never passes the limit", () => {
    const a = rubberBand(-20), b = rubberBand(-200), c = rubberBand(-5000);
    expect(a).toBeLessThan(0);
    expect(Math.abs(a)).toBeLessThan(20);
    expect(Math.abs(b) - Math.abs(a)).toBeLessThan(180);
    expect(Math.abs(c)).toBeLessThan(120);
  });
});

/* The leaving animation runs for --dur-fast; the hook unmounts after
   LEAVE_MS. If the two drift, the sheet either pops out before it has left
   or hangs invisible over the screen, swallowing taps. */
test("LEAVE_MS equals --dur-fast in tokens.css", () => {
  const css = readFileSync(new URL("../styles/tokens.css", import.meta.url), "utf8");
  const m = css.match(/--dur-fast:\s*(\d+)ms/);
  expect(m).not.toBeNull();
  expect(Number(m[1])).toBe(LEAVE_MS);
});

/* A sheet that listens for Escape itself calls onClose directly — the
   overlay vanishes in one frame, skipping the leaving animation, and with
   stacked sheets both close at once. useSheet owns Escape. */
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
test("no component that uses useSheet handles Escape on its own", () => {
  const root = new URL("..", import.meta.url).pathname;
  const walk = (d) => readdirSync(d).flatMap((f) => {
    const p = join(d, f);
    return statSync(p).isDirectory() ? walk(p) : p.endsWith(".jsx") ? [p] : [];
  });
  const users = walk(root).filter((p) => readFileSync(p, "utf8").includes("useSheet("));
  expect(users.length).toBeGreaterThanOrEqual(11);
  for (const p of users) {
    expect({ file: p, escape: /key\s*===\s*"Escape"/.test(readFileSync(p, "utf8")) })
      .toEqual({ file: p, escape: false });
  }
});

import { POP_MS, PUSH_FRACTION } from "./useSheet.js";
test("POP_MS equals --dur-pop, and a pushed page pops at half its width", () => {
  const css = readFileSync(new URL("../styles/tokens.css", import.meta.url), "utf8");
  expect(Number(css.match(/--dur-pop:\s*(\d+)ms/)?.[1])).toBe(POP_MS);
  expect(shouldDismiss({ dy: 190, height: 400, velocity: 0.1, fraction: PUSH_FRACTION })).toBe(false);
  expect(shouldDismiss({ dy: 210, height: 400, velocity: 0.1, fraction: PUSH_FRACTION })).toBe(true);
});
