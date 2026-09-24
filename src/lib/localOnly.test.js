import { expect, test } from "bun:test";
import { isLocalRequest } from "./localOnly.js";

const h = (o = {}) => new Headers(o);

test("loopback ohne Weiterleitung ist lokal", () => {
  for (const a of ["127.0.0.1", "::1", "::ffff:127.0.0.1"]) expect(isLocalRequest(a, h())).toBe(true);
});

test("WLAN-Adressen sind nicht lokal", () => {
  for (const a of ["192.168.178.97", "10.0.0.2", "::ffff:192.168.178.20", "fe80::1"]) expect(isLocalRequest(a, h())).toBe(false);
});

test("hinter einem Proxy ist localhost nicht lokal", () => {
  expect(isLocalRequest("127.0.0.1", h({ "x-forwarded-for": "203.0.113.5" }))).toBe(false);
  expect(isLocalRequest("::1", h({ forwarded: "for=203.0.113.5" }))).toBe(false);
  expect(isLocalRequest("127.0.0.1", h({ "x-real-ip": "203.0.113.5" }))).toBe(false);
});

test("fehlende Adresse ist nicht lokal", () => {
  expect(isLocalRequest(undefined, h())).toBe(false);
  expect(isLocalRequest("unknown", h())).toBe(false);
});

test("127.0.0.10 und ähnliche Tricks zählen nicht", () => {
  expect(isLocalRequest("127.0.0.10", h())).toBe(false);
  expect(isLocalRequest(" 127.0.0.1", h())).toBe(false);
});
