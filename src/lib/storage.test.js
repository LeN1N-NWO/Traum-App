import { test, expect } from "bun:test";
import { DEFAULT_STATE, genId, loadState, saveState } from "./storage.js";

/** Minimal localStorage stand-in — which is why this test needs neither a
 *  browser nor a DOM library. */
function fakeBackend(initial = null) {
  const map = new Map();
  if (initial !== null) map.set("dreamrushes_v1", initial);
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, v),
  };
}

test("empty storage yields the defaults", () => {
  const s = loadState(fakeBackend());
  expect(s.journal).toEqual([]);
  expect(s.cast).toEqual([]);
  expect(s.credits).toBe(0);
});

test("broken JSON falls back to defaults instead of throwing", () => {
  const s = loadState(fakeBackend("{nicht json"));
  expect(s.journal).toEqual([]);
});

test("legacy cast entries gain id and category", () => {
  const alt = JSON.stringify({ cast: [{ tag: "anna", img: "x" }] });
  const s = loadState(fakeBackend(alt));
  expect(s.cast[0].category).toBe("person");
  expect(s.cast[0].id).toBeTruthy();
  expect(s.cast[0].tag).toBe("anna");
});

test("saved state survives a round trip", () => {
  const backend = fakeBackend();
  saveState({ ...DEFAULT_STATE, streak: 7 }, backend);
  expect(loadState(backend).streak).toBe(7);
});

test("full storage reports false instead of throwing", () => {
  const voll = {
    getItem: () => null,
    setItem: () => { throw new Error("QuotaExceededError"); },
  };
  expect(saveState(DEFAULT_STATE, voll)).toBe(false);
});

test("genId produces unique values with a prefix", () => {
  const a = genId("c"), b = genId("c");
  expect(a.startsWith("c_")).toBe(true);
  expect(a).not.toBe(b);
});
