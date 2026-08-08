import { test, expect } from "bun:test";
import { canAfford, spend, welcomeGrant, WELCOME_CREDITS } from "./credits.js";
import { priceForImages, IMAGE_COUNTS } from "./pricing.js";

test("affordability compares against the balance", () => {
  expect(canAfford({ credits: 3 }, 3)).toBe(true);
  expect(canAfford({ credits: 2 }, 3)).toBe(false);
  expect(canAfford({}, 1)).toBe(false);
});

test("spending returns the reduced balance", () => {
  expect(spend({ credits: 10 }, 3)).toEqual({ credits: 7 });
});

test("spending more than you have is refused, not allowed to go negative", () => {
  expect(spend({ credits: 2 }, 3)).toBe(null);
});

test("free actions are always affordable", () => {
  expect(canAfford({ credits: 0 }, 0)).toBe(true);
  expect(spend({ credits: 0 }, 0)).toEqual({ credits: 0 });
});

test("the welcome grant applies once", () => {
  const first = welcomeGrant({ credits: 0 });
  expect(first).toEqual({ credits: WELCOME_CREDITS, creditsGranted: true });
  expect(welcomeGrant({ credits: WELCOME_CREDITS, creditsGranted: true })).toBe(null);
});

test("existing installs keep the credits they already had", () => {
  expect(welcomeGrant({ credits: 4 })).toEqual({ credits: 4 + WELCOME_CREDITS, creditsGranted: true });
});

/* The promise the welcome grant makes: a new arrival can make ONE complete
 * dream without paying. That is a relationship between two files, and nothing
 * else notices when it breaks — raise the price of images and the grant
 * silently stops covering a dream, leaving newcomers stuck at a paywall on
 * their first try. Both numbers were also wrong at once before (25 credits
 * against a 2-credit dream), so pin the invariant, not the values. */
test("the welcome grant pays for the smallest dream", () => {
  const smallest = priceForImages(Math.min(...IMAGE_COUNTS));
  expect(WELCOME_CREDITS).toBeGreaterThanOrEqual(smallest);
});

test("…and not much more than that — free credits are real money", () => {
  const smallest = priceForImages(Math.min(...IMAGE_COUNTS));
  expect(WELCOME_CREDITS).toBeLessThanOrEqual(smallest * 2);
});
