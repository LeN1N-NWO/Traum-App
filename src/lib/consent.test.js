import { test, expect } from "bun:test";
import { CONSENT_VERSION, needsConsent, consentPatch } from "./consent.js";

test("a fresh install needs consent", () => {
  expect(needsConsent({})).toBe(true);
  expect(needsConsent(null)).toBe(true);
});

test("granted consent satisfies the gate and records version + time", () => {
  const patch = consentPatch(1234);
  expect(patch.consent.v).toBe(CONSENT_VERSION);
  expect(patch.consent.at).toBe(1234);
  expect(needsConsent(patch)).toBe(false);
});

/* Die Versionsnummer ist der Mechanismus, mit dem geänderte Texte NEU
   vorgelegt werden — eine alte Zustimmung deckt keinen neuen Text. */
test("an older consent version re-opens the gate", () => {
  expect(needsConsent({ consent: { v: CONSENT_VERSION - 1, at: 1 } })).toBe(true);
});
