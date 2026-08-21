import { test, expect } from "bun:test";
import { symbolCounts, moodCounts, monthReview, reflectionContext, realDreams } from "./atlas.js";

const dream = (id, over = {}) => ({
  id,
  createdAt: "2026-08-10T08:00:00.000Z",
  text: "x",
  references: [],
  ...over,
});

/* ⚠ Der Grund, warum der Atlas auf Text UND Beats schaut: die
   Stichwortlisten sind englisch, Träume oft nicht. Ohne die (immer
   englischen) Beats aus der Analyse wäre der Atlas für deutsche
   Träume leer — das wäre der stille Totalausfall des Features. */
test("symbols are detected in the English beats, not only the raw text", () => {
  const j = [dream("a", {
    text: "Ich war mit Lena auf einem Riesenrad im Meer.",
    analysis: { beats: ["A Ferris wheel stands in the ocean, waves around it."] },
  })];
  const ids = symbolCounts(j).map((s) => s.id);
  expect(ids).toContain("water");
});

test("recurring symbols count once per dream, most frequent first", () => {
  const j = [
    dream("a", { text: "I fell from the cliff into the ocean waves." }),   // falling + water
    dream("b", { text: "Falling again, endlessly falling." }),             // falling (einmal!)
    dream("c", { text: "A quiet lake, calm water." }),                     // water
  ];
  const got = symbolCounts(j);
  expect(got.find((s) => s.id === "falling").count).toBe(2);
  expect(got.find((s) => s.id === "water").count).toBe(2);
});

test("seed dreams shape no patterns", () => {
  const j = [
    dream("e_seed1", { text: "ocean water waves" }),
    dream("a", { text: "the sea again" }),
  ];
  expect(realDreams(j).length).toBe(1);
  expect(symbolCounts(j).find((s) => s.id === "water").count).toBe(1);
});

test("moods aggregate case-insensitively from the analysis", () => {
  const j = [
    dream("a", { analysis: { mood: "magisch" } }),
    dream("b", { analysis: { mood: "Magisch" } }),
    dream("c", { analysis: { mood: "unruhig" } }),
    dream("d", {}),   // ohne Analyse — zählt nirgends
  ];
  expect(moodCounts(j)).toEqual([
    { mood: "magisch", count: 2 },
    { mood: "unruhig", count: 1 },
  ]);
});

test("the month review only counts the current month", () => {
  const j = [
    dream("a", { createdAt: "2026-08-03T08:00:00.000Z", text: "flying over the city", references: [{ tag: "lena" }] }),
    dream("b", { createdAt: "2026-08-19T08:00:00.000Z", text: "flying again", references: [{ tag: "lena" }] }),
    dream("c", { createdAt: "2026-07-30T08:00:00.000Z", text: "flying in july" }),
  ];
  const got = monthReview(j, new Date(2026, 7, 20));
  expect(got.count).toBe(2);
  expect(got.topSymbol.id).toBe("flying");
  expect(got.topCast).toEqual({ tag: "lena", count: 2 });
});

/* Der Kontext ist das, was unsere Deutung vom Lexikon unterscheidet —
   aber nur Muster, die DIESEN Traum berühren, und gedeckelt: Kontext
   würzt den Brief, er ist nicht das Gericht. */
test("reflection context names only shared patterns, capped at five lines", () => {
  const j = [
    dream("a", { text: "ocean waves", references: [{ tag: "lena" }] }),
    dream("b", { text: "the sea at night", references: [{ tag: "lena" }] }),
    dream("c", { text: "a dry desert" }),
  ];
  const entry = dream("new", { text: "water everywhere", references: [{ tag: "lena" }] });
  const lines = reflectionContext(j, entry);
  expect(lines.some((l) => l.startsWith("Water"))).toBe(true);
  expect(lines.some((l) => l.startsWith("lena"))).toBe(true);
  // Wüste kommt im neuen Traum nicht vor — sie hat im Kontext nichts verloren.
  expect(lines.some((l) => l.toLowerCase().includes("forest") || l.toLowerCase().includes("desert"))).toBe(false);
  expect(lines.length).toBeLessThanOrEqual(5);
});

test("a lone first dream gets an empty context, not an error", () => {
  const entry = dream("only", { text: "ocean waves" });
  expect(reflectionContext([entry], entry)).toEqual([]);
});
