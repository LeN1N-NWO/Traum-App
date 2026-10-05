import { test, expect } from "bun:test";
import { chargeRef, chargeFailure, refundFailure } from "./charges.js";

test("a charge ref is random, carries the kind, and never takes foreign characters", () => {
  const a = chargeRef("film"), b = chargeRef("film");
  expect(a).toMatch(/^film-[0-9a-f-]{36}$/);
  expect(a).not.toBe(b);
  expect(chargeRef("fi'lm; drop")).toMatch(/^filmdrop-/);
  expect(chargeRef("")).toMatch(/^charge-/);
});

/* Die Grenze, an der Geld und Film hängen: Nur „zu wenig Guthaben" wird
   402; JEDER andere Fehler ist ein Kassenausfall (503) — in beiden Fällen
   wird nichts gerendert. Ein unbekannter Fehler darf nie als „hat
   geklappt" durchgehen. */
test("insufficient credits and a missing balance row mean 402, everything else 503", () => {
  expect(chargeFailure({ errno: "23514" })).toBe("NO_CREDITS");
  expect(chargeFailure({ errno: "P0002" })).toBe("NO_CREDITS");
  expect(chargeFailure({ errno: "42501" })).toBe("CHARGE_UNAVAILABLE");
  expect(chargeFailure({ errno: "42883" })).toBe("CHARGE_UNAVAILABLE");
  expect(chargeFailure(new Error("ECONNRESET"))).toBe("CHARGE_UNAVAILABLE");
  expect(chargeFailure(undefined)).toBe("CHARGE_UNAVAILABLE");
});

test("refund failures are explained for the log", () => {
  expect(refundFailure({ errno: "42883" })).toContain("Migration");
  expect(refundFailure({ errno: "42501" })).toContain("Berechtigung");
  expect(refundFailure(new Error("boom"))).toBe("boom");
});
