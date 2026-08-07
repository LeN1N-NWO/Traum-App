import { test, expect } from "bun:test";
import { beatsForCount } from "./beats.js";

const five = ["one", "two", "three", "four", "five"];

test("five beats pass through unchanged", () => {
  expect(beatsForCount(five, 5)).toEqual(five);
});

test("three images take first, middle and last", () => {
  expect(beatsForCount(five, 3)).toEqual(["one", "three", "five"]);
});

test("ten images split every beat in two", () => {
  const out = beatsForCount(five, 10);
  expect(out).toHaveLength(10);
  expect(out[0]).toContain("one");
  expect(out[1]).toContain("one");
  expect(out[9]).toContain("five");
});

test("fewer than five beats are stretched, not dropped", () => {
  const out = beatsForCount(["a", "b"], 5);
  expect(out).toHaveLength(5);
  expect(new Set(out)).toEqual(new Set(["a", "b"]));
});

test("empty input yields nothing rather than throwing", () => {
  expect(beatsForCount([], 5)).toEqual([]);
  expect(beatsForCount(null, 5)).toEqual([]);
});

test("blank strings are ignored", () => {
  expect(beatsForCount(["a", "   ", "b"], 3)).toHaveLength(3);
});
