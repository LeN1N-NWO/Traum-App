import { test, expect, describe } from "bun:test";
import { quoteFor, compareQuote, priceTable } from "./quote.js";
import { priceForFilm, videoModel } from "./video.js";
import { PRICES, priceForImages } from "./pricing.js";

describe("quoteFor — eine Rechnung für Client und Server", () => {
  test("a film costs what the wizard has always shown", () => {
    expect(quoteFor({ mode: "film", model: "standard", seconds: 15, quality: "hd" }))
      .toBe(priceForFilm("standard", 15, { quality: "hd" }));
    expect(quoteFor({ mode: "film", model: "premium", seconds: 30, quality: "sd" }))
      .toBe(priceForFilm("premium", 30, { quality: "sd" }));
  });

  test("an own keyframe drops the keyframe credit", () => {
    const mit = quoteFor({ mode: "film", model: "standard", seconds: 10 });
    const ohne = quoteFor({ mode: "film", model: "standard", seconds: 10, keyframe: true });
    expect(mit - ohne).toBe(PRICES.keyframe);
  });

  /* Der Kern der Übergabe: Ein manipulierter Body darf den Preis nicht
     nach unten ziehen. Unbekanntes wird wie auf dem Server ausgelegt —
     und zwar zur Vorgabe, nie zu „nichts". */
  test("an unknown model or quality cannot make a film cheaper than the default", () => {
    const vorgabe = quoteFor({ mode: "film", model: "standard", seconds: 10 });
    expect(quoteFor({ mode: "film", model: "gratis", seconds: 10 })).toBe(vorgabe);
    expect(quoteFor({ mode: "film", model: "standard", seconds: 10, quality: "free" })).toBe(vorgabe);
  });

  test("seconds are clamped like the order will be", () => {
    const m = videoModel("standard");
    expect(quoteFor({ mode: "film", model: "standard", seconds: 999 }))
      .toBe(quoteFor({ mode: "film", model: "standard", seconds: m.max }));
    expect(quoteFor({ mode: "film", model: "standard", seconds: -5 }))
      .toBe(quoteFor({ mode: "film", model: "standard", seconds: m.min }));
  });

  test("images, preview, scene and character sheet match pricing.js", () => {
    expect(quoteFor({ mode: "image", count: 4 })).toBe(priceForImages(4));
    expect(quoteFor({ mode: "image", count: 8, fallback: true })).toBe(priceForImages(8, true));
    expect(quoteFor({ mode: "image", count: 3 })).toBe(3);        // ein Rasterblock: je Kachel ein Credit
    expect(quoteFor({ mode: "preview" })).toBe(PRICES.preview);
    expect(quoteFor({ mode: "scene" })).toBe(PRICES.scene);
    expect(quoteFor({ mode: "character" })).toBe(PRICES.characterSheet);
  });

  test("nonsense costs nothing but is never negative", () => {
    expect(quoteFor({})).toBe(0);
    expect(quoteFor({ mode: "image", count: -4 })).toBeGreaterThanOrEqual(0);
  });
});

describe("compareQuote — Antons Ultimatum", () => {
  test("server cheaper or equal: render at the server price", () => {
    expect(compareQuote(46, 46)).toMatchObject({ ok: true, charge: 46 });
    expect(compareQuote(50, 46)).toMatchObject({ ok: true, charge: 46 });
  });

  /* „Wenn der Preis eines Modells angehoben wird und wir es zu günstig
     verkaufen — das darf nicht passieren." */
  test("server more expensive: refuse, hand back both numbers", () => {
    const r = compareQuote(46, 60);
    expect(r.ok).toBe(false);
    expect(r).toMatchObject({ quoted: 46, actual: 60, charge: 60 });
  });

  test("an old client without a quote is served at the server price", () => {
    expect(compareQuote(undefined, 46)).toMatchObject({ ok: true, charge: 46, quoted: null });
    expect(compareQuote("abc", 46).ok).toBe(true);
  });

  test("a negative or zero quote never buys a discount", () => {
    expect(compareQuote(0, 46)).toMatchObject({ ok: false, charge: 46 });
    expect(compareQuote(-1, 46)).toMatchObject({ ok: true, charge: 46, quoted: null });
  });
});

describe("priceTable", () => {
  test("carries both models with both qualities and the flat prices", () => {
    const t = priceTable();
    expect(t.films.map((f) => f.id)).toEqual(["standard", "premium"]);
    for (const f of t.films) expect(Object.keys(f.qualities).sort()).toEqual(["hd", "sd"]);
    expect(t.prices.keyframe).toBe(PRICES.keyframe);
  });
});

/* Der Wächter: Die Preisprüfung muss im Film-Zweig VOR dem Regisseur und
   VOR dem fal-Auftrag stehen — hinter einem bezahlten Aufruf wäre sie ein
   Kassenzettel nach dem Rendern. Gemessen 11.09.2026 mit einem Auftrag
   „angezeigt 1, gerechnet 46": HTTP 409 in Millisekunden, kein Aufruf
   nach draußen. Dieser Test hält die Reihenfolge fest. */
import { readFileSync } from "node:fs";
test("the server checks the price before the director and before fal", () => {
  const src = readFileSync(new URL("../../server.js", import.meta.url), "utf8");
  const film = src.indexOf('if (body.mode === "film") {');
  const pruefung = src.indexOf("compareQuote(body.quoted", film);
  const regisseur = src.indexOf("await directFilm({", film);
  const auftrag = src.indexOf("await startVideo({", film);
  expect(film).toBeGreaterThan(0);
  expect(pruefung).toBeGreaterThan(film);
  expect(pruefung).toBeLessThan(regisseur);
  expect(pruefung).toBeLessThan(auftrag);
  // …und die Ablehnung ist ein 409 mit beiden Zahlen, kein stiller Rückfall.
  const ablehnung = src.slice(pruefung, regisseur);
  expect(ablehnung).toMatch(/reason: "price", quoted: preis\.quoted, actual: preis\.actual \}, 409\)/);
});
