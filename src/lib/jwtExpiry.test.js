import { test, expect } from "bun:test";
import { expiresSoon } from "./jwtExpiry.js";

// Ein Token wie von Supabase: drei Teile, die Mitte base64url-JSON.
const jwt = (payload) => {
  const b64url = (o) => btoa(JSON.stringify(o)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return `${b64url({ alg: "HS256" })}.${b64url(payload)}.signatur`;
};
const NOW = 1_800_000_000_000;

test("a token that runs out within the minute counts as expiring", () => {
  expect(expiresSoon(jwt({ exp: NOW / 1000 + 30 }), NOW)).toBe(true);
  expect(expiresSoon(jwt({ exp: NOW / 1000 - 10 }), NOW)).toBe(true);   // schon abgelaufen
});

test("a fresh token does not", () => {
  expect(expiresSoon(jwt({ exp: NOW / 1000 + 3600 }), NOW)).toBe(false);
});

test("base64url characters and missing padding are read correctly", () => {
  // Payload, deren Kodierung - und _ enthält und ohne = endet.
  const t = jwt({ exp: NOW / 1000 + 30, sub: "???>>>~~~" });
  expect(t.split(".")[1]).toMatch(/[-_]/);
  expect(expiresSoon(t, NOW)).toBe(true);
});

test("anything unreadable is 'not expiring' — then the server decides as before", () => {
  for (const t of [null, undefined, "", "kein-jwt", "a.b.c", "a..c", jwt({ sub: "x" }), jwt({ exp: "morgen" })]) {
    expect([t, expiresSoon(t, NOW)]).toEqual([t, false]);
  }
});
