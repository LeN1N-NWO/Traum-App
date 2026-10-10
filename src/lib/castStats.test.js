import { test, expect } from "bun:test";
import { appearances, castByCategory, castSuggestions, initialOf, tagSuggestion } from "./castStats.js";

const dream = (id, tags) => ({ id, references: tags.map((tag) => ({ tag })) });
const figure = (tag, category = "person") => ({ id: "c_" + tag, tag, category });

test("counts in how many dreams each figure appears", () => {
  const journal = [
    dream("e_1", ["Anton", "Luna"]),
    dream("e_2", ["Anton"]),
    dream("e_3", ["Luna", "Rex"]),
  ];
  const got = appearances(journal);
  expect(got.get("Anton")).toBe(2);
  expect(got.get("Luna")).toBe(2);
  expect(got.get("Rex")).toBe(1);
});

/* Die Zahl beantwortet „in wie vielen Traeumen", nicht „wie oft benutzt".
   Ohne diese Sperre bekaeme eine Figur, die in EINEM Traum zweimal steckt,
   eine 2 — und die Liste sortierte falsch. */
test("a figure used twice in one dream is still one dream", () => {
  expect(appearances([dream("e_1", ["Luna", "Luna"])]).get("Luna")).toBe(1);
});

/* Kein Sonderfall im Code: Seed-Traeume tragen references: [], fallen also
   von selbst heraus. Diese Zeile haelt fest, dass das so bleiben MUSS — es
   sind nicht seine Traeume. */
test("seed dreams contribute nothing, because they reference nothing", () => {
  const journal = [{ id: "e_seed0", references: [] }, dream("e_1", ["Anton"])];
  expect(appearances(journal).get("Anton")).toBe(1);
  expect(appearances(journal).size).toBe(1);
});

test("the most frequent figure comes first", () => {
  const cast = [figure("Mama"), figure("Anton"), figure("Nachbar")];
  const journal = [
    dream("e_1", ["Anton", "Mama"]),
    dream("e_2", ["Anton"]),
    dream("e_3", ["Anton", "Mama"]),
  ];
  expect(castByCategory(cast, journal, "person").map((c) => c.tag))
    .toEqual(["Anton", "Mama", "Nachbar"]);
});

/* Sonst springt die Liste zwischen zwei Aufrufen, sobald zwei Figuren
   gleich haeufig sind — und niemand kann sagen, warum. */
test("a tie is broken alphabetically, so the order never jumps", () => {
  const cast = [figure("Zoe"), figure("Ada")];
  const journal = [dream("e_1", ["Zoe", "Ada"])];
  expect(castByCategory(cast, journal, "person").map((c) => c.tag)).toEqual(["Ada", "Zoe"]);
});

/* Gerade angelegt zu sein ist kein Grund, unsichtbar zu werden. */
test("a figure never used yet is last, but still there", () => {
  const cast = [figure("Neu"), figure("Alt")];
  const journal = [dream("e_1", ["Alt"])];
  const got = castByCategory(cast, journal, "person");
  expect(got.map((c) => c.tag)).toEqual(["Alt", "Neu"]);
  expect(got[1].count).toBe(0);
});

test("each category keeps to itself", () => {
  const cast = [figure("Anton", "person"), figure("Luna", "pet"), figure("Bahnhof", "place")];
  const journal = [dream("e_1", ["Anton", "Luna", "Bahnhof"])];
  expect(castByCategory(cast, journal, "pet").map((c) => c.tag)).toEqual(["Luna"]);
});

test("an empty journal leaves everyone at zero rather than crashing", () => {
  expect(castByCategory([figure("Anton")], [], "person")[0].count).toBe(0);
  expect(castByCategory(null, null, "person")).toEqual([]);
});

/* Ueber den Zeichenpunkt, nicht ueber [0]: Sonst zerfaellt ein Emoji in sein
   halbes Ersatzpaar und im Bildfeld steht ein Kaestchen. */
test("the initial survives characters outside the basic plane", () => {
  expect(initialOf("anton")).toBe("A");
  expect(initialOf("Ätna")).toBe("Ä");
  expect(initialOf("🐾Rex")).toBe("🐾");
  expect(initialOf("")).toBe("?");
});

const told = (id, analysis, createdAt = "2026-10-01T07:00:00Z") => ({ id, createdAt, analysis });

test("casting: suggests who keeps showing up and has no face yet, most frequent first", () => {
  const journal = [
    told("e_1", { people: [{ name: "Mama", kind: "person" }, { name: "Rex", kind: "pet" }], places: ["Omas Küche"], objects: [] }),
    told("e_2", { people: [{ name: "Mama", kind: "person" }, { name: "mama", kind: "person" }], places: ["Omas Küche"], objects: ["roter Wagen"] }),
    told("e_3", { people: [{ name: "Mama", kind: "person" }], places: [], objects: [] }),
  ];
  const s = castSuggestions(journal, [], { limit: 5 });
  expect(s[0]).toEqual({ name: "Mama", category: "person", count: 3, tag: "mama" });   // zweimal im selben Traum zählt einmal
  expect(s[1]).toEqual({ name: "Omas Küche", category: "place", count: 2, tag: "omas" });
  expect(s.map((x) => x.category)).toContain("pet");
  expect(s.map((x) => x.category)).toContain("object");
});

test("casting: skips figures already in the cast, the dreamer and strangers", () => {
  const journal = [
    told("e_1", { people: [{ name: "Lena" }, { name: "ich" }, { name: "eine fremde Frau" }, { name: "a stranger" }, { name: "Bruno", kind: "pet" }] }),
  ];
  const s = castSuggestions(journal, [figure("lena")], { limit: 5 });
  expect(s.map((x) => x.name)).toEqual(["Bruno"]);
  expect(castSuggestions([], [])).toEqual([]);
  expect(castSuggestions([{ id: "e_x" }], [])).toEqual([]);   // ohne Auswertung nichts
});

test("casting: limit keeps the top ones, newer wins a tie", () => {
  const journal = [
    told("e_1", { people: [{ name: "Alt" }] }, "2026-09-01T07:00:00Z"),
    told("e_2", { people: [{ name: "Neu" }] }, "2026-10-01T07:00:00Z"),
  ];
  expect(castSuggestions(journal, [], { limit: 1 }).map((x) => x.name)).toEqual(["Neu"]);
});

test("casting: a short, readable @-tag from the dream's wording", () => {
  expect(tagSuggestion("Brücke aus Klaviertasten")).toBe("bruecke");
  expect(tagSuggestion("leerer Strand im Morgengrauen")).toBe("strand");
  expect(tagSuggestion("the old train full of sand")).toBe("train");
  expect(tagSuggestion("mein Bruder")).toBe("bruder");
  expect(tagSuggestion("Großmutterhausküche")).toBe("grossmutterh");
  expect(tagSuggestion("")).toBe("");
});
