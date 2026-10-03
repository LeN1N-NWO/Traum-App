import { expect, test } from "bun:test";
import { CODE_ALPHABET, inviteLink, isInviteCode, normalizeCode, referralReward, REFERRAL_FILMS } from "./invites.js";
import { FILM_GIFT } from "./streakBoard.js";
import { PACKS, SUBSCRIPTIONS } from "./plans.js";

test("codes have no look-alike characters", () => {
  for (const ch of "0O1IL") expect(CODE_ALPHABET.includes(ch)).toBe(false);
  expect(isInviteCode("DRM4KX7")).toBe(true);
  expect(isInviteCode("DRM0KX7")).toBe(false);     // 0 gibt es nicht
  expect(isInviteCode("DRM4KX")).toBe(false);
});

test("a code is found in whatever gets pasted or tapped", () => {
  expect(normalizeCode(" drm-4kx7 ")).toBe("DRM4KX7");
  expect(normalizeCode("https://dreamrushes.app/i/DRM4KX7")).toBe("DRM4KX7");
  expect(normalizeCode("Komm mit! https://dreamrushes.app/i/drm4kx7 ✨")).toBe("DRM4KX7");
  expect(normalizeCode("dreamrushes://invite/DRM4KX7")).toBe("DRM4KX7");
  expect(normalizeCode("hello")).toBeNull();
  expect(inviteLink("DRM4KX7")).toBe("https://dreamrushes.app/i/DRM4KX7");
});

test("every product that can be bought has a reward, counted in whole films", () => {
  for (const p of [...PACKS, ...SUBSCRIPTIONS]) expect(REFERRAL_FILMS[p.id]).toBeGreaterThan(0);
  expect(referralReward("pack-s")).toEqual({ films: 1, credits: FILM_GIFT });
  expect(referralReward("yearly").credits).toBe(6 * FILM_GIFT);
  expect(referralReward("starter-code")).toBeNull();      // Gratis-Codes zahlen nie
});

/* Die Prämie darf nie mehr kosten als der Kauf einbringt: höchstens ein
   Drittel der gekauften Credits. */
test("a reward never outweighs the purchase", () => {
  for (const p of [...PACKS, ...SUBSCRIPTIONS]) {
    const bought = p.period === "year" ? p.credits * 12 : p.credits;   // Jahresabo: 160 je Monat
    expect(referralReward(p.id).credits).toBeLessThanOrEqual(Math.ceil(bought / 3));
  }
});
