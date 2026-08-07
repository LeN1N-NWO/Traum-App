import { test, expect } from "bun:test";
import { canAfford, spend, welcomeGrant, WELCOME_CREDITS } from "./credits.js";

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
