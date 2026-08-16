import { test, expect } from "bun:test";
import { showcaseFrom } from "./showcase.js";

const imgs = (id, urls) => ({ id, media: { type: "image", urls } });
const withFilm = (id, urls, film) => ({ ...imgs(id, urls), film: { urls: [film] } });

const SEED = [
  imgs("e_seed0", ["/clips/a1.webp", "/clips/a2.webp", "/clips/a3.webp"]),
  imgs("e_seed1", ["/clips/b1.webp", "/clips/b2.webp", "/clips/b3.webp"]),
];

test("shows the dreamer's own pictures before anything else", () => {
  const own = imgs("e_9", ["/media/x1.png", "/media/x2.png", "/media/x3.png"]);
  const got = showcaseFrom([...SEED, own]);
  expect(got.stills).toEqual(["/media/x1.png", "/media/x2.png", "/media/x3.png"]);
  expect(got.stillsAreOwn).toBe(true);
});

/* Das Tagebuch waechst hinten an (Step6Result.jsx), gezeigt wird aber das
   Neueste. Ohne die Umkehr staende auf dem Kaufblatt der aelteste Traum —
   ausgerechnet der, an den sich niemand mehr erinnert. */
test("newest dream first, not oldest", () => {
  const older = imgs("e_1", ["/media/old1.png", "/media/old2.png", "/media/old3.png"]);
  const newer = imgs("e_2", ["/media/new1.png", "/media/new2.png", "/media/new3.png"]);
  expect(showcaseFrom([older, newer]).stills[0]).toBe("/media/new1.png");
});

/* Ein einzelnes eigenes Bild ist zu wenig fuer eine Ueberblendung — das
   wackelt, statt zu laufen. Dann wird mit Seed-Material aufgefuellt, und das
   eigene Bild bleibt trotzdem vorn. */
test("a single own picture gets topped up, and still leads", () => {
  const got = showcaseFrom([...SEED, imgs("e_9", ["/media/mine.png"])]);
  expect(got.stills[0]).toBe("/media/mine.png");
  expect(got.stills.length).toBeGreaterThanOrEqual(3);
  expect(got.stillsAreOwn).toBe(false);
});

test("a fresh install falls back to the seed journal", () => {
  const got = showcaseFrom(SEED);
  expect(got.stills.length).toBe(6);
  expect(got.stillsAreOwn).toBe(false);
});

test("an empty journal yields nothing, so the tile can draw the glyph", () => {
  const got = showcaseFrom([]);
  expect(got.stills).toEqual([]);
  expect(got.films).toEqual([]);
});

test("the dummy film stands in until a real one exists, then steps aside", () => {
  const dummy = "/assets/dummy.mp4";
  expect(showcaseFrom(SEED, dummy).films).toEqual([dummy]);
  expect(showcaseFrom(SEED, dummy).filmsAreOwn).toBe(false);

  const own = withFilm("e_9", ["/media/x1.png"], "/media/film.mp4");
  const got = showcaseFrom([...SEED, own], dummy);
  expect(got.films).toEqual(["/media/film.mp4"]);
  expect(got.filmsAreOwn).toBe(true);
});

/* Die zweite Liste ist der Grund, warum diese Datei ueberhaupt zwei Felder je
   Kachel hat. Eigenes Material KANN da sein und sich trotzdem nicht laden —
   die Kopien unter /media/ gehoeren dem Geraet. Genau das ist am 16.08.
   passiert: Ordner weg, jeder Verweis tot. Ohne Rueckhand saehe die
   Kaufseite eines langjaehrigen Nutzers aermer aus als die eines neuen. */
test("what is held in reserve when the own material cannot be loaded", () => {
  const dummy = "/assets/dummy.mp4";
  const own = withFilm("e_9", ["/media/a.png", "/media/b.png", "/media/c.png"], "/media/f.mp4");
  const got = showcaseFrom([...SEED, own], dummy);

  expect(got.stills.every((u) => u.startsWith("/media/"))).toBe(true);
  expect(got.stillsBackup.length).toBe(6);          // die Seed-Bilder warten
  expect(got.filmsBackup).toEqual([dummy]);         // der Dummy wartet
});

/* Kein doppelter Boden, wo schon aufgefuellt wurde: Steckt das Seed-Material
   bereits in `stills`, waere dieselbe Liste als Rueckhand nur Wiederholung —
   und beim Ladefehler hiesse es, die kaputten Bilder ein zweites Mal zu
   versuchen. */
test("no reserve where the mix already happened", () => {
  const got = showcaseFrom([...SEED, imgs("e_9", ["/media/mine.png"])], "/d.mp4");
  expect(got.stillsAreOwn).toBe(false);
  expect(got.stillsBackup).toEqual([]);
  expect(got.filmsBackup).toEqual([]);              // der Dummy IST schon films
});

/* Ein Traum, der zweimal mit demselben Bild im Tagebuch steht, darf die
   Kachel nicht zu einer Diashow desselben Bildes machen. */
test("the same picture never appears twice", () => {
  const a = imgs("e_1", ["/media/same.png", "/media/one.png"]);
  const b = imgs("e_2", ["/media/same.png", "/media/two.png"]);
  const got = showcaseFrom([a, b]);
  expect(got.stills).toEqual(["/media/same.png", "/media/two.png", "/media/one.png"]);
});

/* Filme lagen vor dem 09.08. im media-Feld statt im film-Feld. entryMedia.js
   verdeckt die Naht — diese Zeile haelt fest, dass showcase sie mitbenutzt
   und nicht selbst an media herangeht. */
test("a film stored the old way is found too", () => {
  const old = { id: "e_1", media: { type: "video", urls: ["/media/old.mp4"] } };
  expect(showcaseFrom([old], "/dummy.mp4").films).toEqual(["/media/old.mp4"]);
});
