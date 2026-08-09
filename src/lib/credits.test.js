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

/* The promise the welcome grant makes, now in writing: "your first dream is
 * on us" (t.onboarding.gateReward, in all seven locales). That sentence is
 * true only while the grant buys EXACTLY one smallest dream, and the two
 * numbers that decide it live in two other files, far from the seven where
 * the promise is spelled out. Nothing else notices when they drift:
 *
 *   too little  → the welcome screen promises a dream and then shows a
 *                 paywall on the first try, which is the worst first
 *                 impression the app can make;
 *   too much    → leftover credits that buy nothing on their own (the
 *                 cheapest thing costs 3), so they read as a bug rather
 *                 than as generosity.
 *
 * Both numbers were wrong at once before (25 credits against a 2-credit
 * dream), so pin the RELATIONSHIP, not the values. */
test("the welcome grant pays for exactly one smallest dream", () => {
  const smallest = priceForImages(Math.min(...IMAGE_COUNTS));
  expect(WELCOME_CREDITS).toBe(smallest);
});
