import { test, expect } from "bun:test";
import { mentionsTag, findTagSpans, taggedPhotosIn } from "./tags.js";

test("mentionsTag respects word boundaries", () => {
  expect(mentionsTag("anna was there", "anna")).toBe(true);
  expect(mentionsTag("the annals of history", "anna")).toBe(false);
  expect(mentionsTag("I sat the exam", "ex")).toBe(false);
});

test("mentionsTag without a tag is false", () => {
  expect(mentionsTag("anything", "")).toBe(false);
  expect(mentionsTag("anything", null)).toBe(false);
});

test("findTagSpans returns positions and drops overlaps", () => {
  const spans = findTagSpans("anna and anna", ["anna"]);
  expect(spans).toHaveLength(2);
  expect(spans[0].start).toBe(0);
  expect(spans[1].start).toBe(9);
});

test("taggedPhotosIn takes state as a parameter", () => {
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

test("taggedPhotosIn skips entries without an image", () => {
  const state = { me: null, cast: [{ tag: "anna", category: "person", img: "" }] };
  expect(taggedPhotosIn(state, "anna")).toEqual([]);
});
