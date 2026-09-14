import { test, expect } from "bun:test";
import { canAfford, spend, totalCredits, refillAllowance, applyAllowanceGrant } from "./credits.js";
import { SUBSCRIPTIONS, allowanceGrant } from "./plans.js";
import { priceForImages, IMAGE_COUNTS, PRICES, PREVIEW_COUNT } from "./pricing.js";

test("affordability compares against the balance", () => {
  expect(canAfford({ credits: 3 }, 3)).toBe(true);
  expect(canAfford({ credits: 2 }, 3)).toBe(false);
  expect(canAfford({}, 1)).toBe(false);
});

test("spending returns the reduced balance", () => {
  expect(spend({ credits: 10 }, 3)).toEqual({ credits: 7, allowance: 0 });
});

test("spending more than you have is refused, not allowed to go negative", () => {
  expect(spend({ credits: 2 }, 3)).toBe(null);
});

test("free actions are always affordable", () => {
  expect(canAfford({ credits: 0 }, 0)).toBe(true);
  expect(spend({ credits: 0 }, 0)).toEqual({ credits: 0, allowance: 0 });
});

/* The quick look is priced as what it actually is: ONE render. Before
 * 10.08.2026 the same grid render was billed at the full three-image price
 * because it was reached by accident (a cleared title field) rather than
 * chosen — full price for a third of the resolution. Pin both halves of the
 * fix: it costs one image, and it stays cheaper than the three separate
 * renders it stands in for. If someone ever prices them the same again,
 * this fails and says why. */
test("the quick look costs one render, not three", () => {
  expect(PRICES.preview).toBe(PRICES.images[1] ?? 1);
  expect(PRICES.preview).toBeLessThan(priceForImages(PREVIEW_COUNT));
});

test("the quick look still costs something", () => {
  expect(PRICES.preview).toBeGreaterThan(0);
});

/* ── Die zwei Töpfe ───────────────────────────────────────────────────────
   Diese Zeilen halten die eine Regel fest, an der alles hängt: Was verfällt,
   wird zuerst ausgegeben. Andersherum verlöre jemand mit Abo bei jeder
   Abrechnung genau die Credits, die er zusätzlich GEKAUFT hat — der Fehler
   wäre still, teuer und in echtem Geld messbar. */
test("what expires is spent first", () => {
  expect(spend({ credits: 10, allowance: 5 }, 3)).toEqual({ allowance: 2, credits: 10 });
});

test("spending past the allowance dips into the bought credits, not before", () => {
  expect(spend({ credits: 10, allowance: 5 }, 8)).toEqual({ allowance: 0, credits: 7 });
});

test("both pots together decide what is affordable", () => {
  expect(canAfford({ credits: 2, allowance: 3 }, 5)).toBe(true);
  expect(canAfford({ credits: 2, allowance: 3 }, 6)).toBe(false);
  expect(totalCredits({ credits: 2, allowance: 3 })).toBe(5);
});

test("an allowance refill sets, never adds — and leaves bought credits alone", () => {
  // „does not roll over" aus plans.js: daran haengt die Jahresrechnung.
  expect(refillAllowance({ credits: 7, allowance: 30 }, 45)).toEqual({ allowance: 45, credits: 7 });
  expect(refillAllowance({ credits: 7, allowance: 0 }, 45)).toEqual({ allowance: 45, credits: 7 });
});

test("old installs without an allowance field still work", () => {
  // Das Feld kam am 16.08. dazu; bestehende Tagebuecher haben es nicht.
  expect(canAfford({ credits: 5 }, 5)).toBe(true);
  expect(totalCredits({ credits: 5 })).toBe(5);
  expect(totalCredits({})).toBe(0);
});

/* Das Jahresabo mit Startguthaben (14.09.2026): Die Monate nach dem Kauftag
   dürfen das Startguthaben NICHT ersetzen, sie legen dazu. Ein einziges
   falsches „set" hätte jemandem im zweiten Monat bezahlte Credits
   weggenommen — still, und in echtem Geld messbar. */
test("a yearly subscriber keeps the start grant and gets top-ups on top", () => {
  const year = SUBSCRIPTIONS.find((p) => p.period === "year");
  let state = { credits: 7, allowance: 0 };
  state = applyAllowanceGrant(state, allowanceGrant(year, 0));
  expect(state).toEqual({ allowance: 480, credits: 7 });
  state = { ...state, ...spend(state, 100) };               // 100 aus dem Abo
  for (let m = 1; m < 12; m++) state = applyAllowanceGrant(state, allowanceGrant(year, m));
  expect(state).toEqual({ allowance: 380 + 11 * allowanceGrant(year, 1).amount, credits: 7 });
});

test("a new subscription year starts fresh — last year's rest expires, bought credits stay", () => {
  const year = SUBSCRIPTIONS.find((p) => p.period === "year");
  const state = applyAllowanceGrant({ credits: 7, allowance: 900 }, allowanceGrant(year, 12));
  expect(state).toEqual({ allowance: 480, credits: 7 });
});

test("the monthly subscription still sets, never adds", () => {
  const month = SUBSCRIPTIONS.find((p) => p.period === "month");
  expect(applyAllowanceGrant({ credits: 7, allowance: 30 }, allowanceGrant(month, 5))).toEqual({ allowance: 160, credits: 7 });
});
