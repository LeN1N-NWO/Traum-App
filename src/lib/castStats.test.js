import { test, expect } from "bun:test";
import { appearances, castByCategory, initialOf } from "./castStats.js";

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
