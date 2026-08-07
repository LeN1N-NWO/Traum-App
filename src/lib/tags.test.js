import { test, expect } from "bun:test";
import { mentionsTag, findTagSpans, taggedPhotosIn } from "./tags.js";

test("mentionsTag achtet auf Wortgrenzen", () => {
  expect(mentionsTag("anna was there", "anna")).toBe(true);
  expect(mentionsTag("the annals of history", "anna")).toBe(false);
  expect(mentionsTag("I sat the exam", "ex")).toBe(false);
});

test("mentionsTag ohne Tag ist false", () => {
  expect(mentionsTag("beliebig", "")).toBe(false);
  expect(mentionsTag("beliebig", null)).toBe(false);
});

test("findTagSpans liefert Positionen und verwirft Ueberschneidungen", () => {
  const spans = findTagSpans("anna and anna", ["anna"]);
  expect(spans).toHaveLength(2);
  expect(spans[0].start).toBe(0);
  expect(spans[1].start).toBe(9);
});

test("taggedPhotosIn nimmt den Zustand als Parameter", () => {
  const state = {
    me: { img: "ich.png" },
    cast: [
      { tag: "anna", category: "person", img: "a.png" },
      { tag: "rex", category: "pet", img: "r.png" },
    ],
  };
  const treffer = taggedPhotosIn(state, "me and anna went walking");
  expect(treffer.map((t) => t.tag).sort()).toEqual(["anna", "me"]);
});

test("taggedPhotosIn ueberspringt Eintraege ohne Bild", () => {
  const state = { me: null, cast: [{ tag: "anna", category: "person", img: "" }] };
  expect(taggedPhotosIn(state, "anna")).toEqual([]);
});
