import { test, expect } from "bun:test";
import { filmOf, imagesOf, allMediaOf } from "./entryMedia.js";

const withImages = { media: { type: "image", urls: ["/media/a.png", "/media/b.png"] } };
const withBoth = { ...withImages, film: { urls: ["/media/c.mp4"] } };
// How every film was stored before 09.08.2026 — it overwrote the images.
const oldFilmOnly = { media: { type: "video", urls: ["/media/old.mp4"] } };

test("a dream can hold pictures and a film at once", () => {
  expect(filmOf(withBoth)).toBe("/media/c.mp4");
  expect(imagesOf(withBoth)).toEqual(["/media/a.png", "/media/b.png"]);
});

// The regression this module exists for: making a film used to replace the
// images it was made FROM. Both must survive.
test("the film does not hide the pictures it was made from", () => {
  expect(imagesOf(withBoth).length).toBe(2);
});

test("a film stored the old way is still found", () => {
  expect(filmOf(oldFilmOnly)).toBe("/media/old.mp4");
  expect(imagesOf(oldFilmOnly)).toEqual([]);
});

test("pictures without a film report no film", () => {
  expect(filmOf(withImages)).toBe(null);
});

test("an empty or missing entry never throws", () => {
  for (const e of [null, undefined, {}, { media: null }, { film: {} }]) {
    expect(filmOf(e)).toBe(null);
    expect(imagesOf(e)).toEqual([]);
    expect(allMediaOf(e)).toEqual([]);
  }
});

test("sharing offers the film first, then the stills", () => {
  expect(allMediaOf(withBoth)).toEqual(["/media/c.mp4", "/media/a.png", "/media/b.png"]);
  expect(allMediaOf(withImages)).toEqual(["/media/a.png", "/media/b.png"]);
});
