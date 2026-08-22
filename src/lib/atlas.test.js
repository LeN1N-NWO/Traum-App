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

/* recurrenceFor — Plan P2b. Liefert dieselbe Zählung wie reflectionContext,
   aber in UI-Form (mit entryIds zum Antippen). */
import { recurrenceFor } from "./atlas.js";

test("recurrence names what came before, most frequent first", () => {
  const j = [
    dream("alt1", { text: "the ocean waves again", createdAt: "2026-08-01T08:00:00.000Z" }),
    dream("alt2", { text: "a calm lake, water everywhere", createdAt: "2026-08-05T08:00:00.000Z" }),
    dream("alt3", { text: "I was falling", createdAt: "2026-08-06T08:00:00.000Z" }),
    dream("neu",  { text: "falling into the sea", createdAt: "2026-08-10T08:00:00.000Z" }),
  ];
  const got = recurrenceFor(j, j[3]);
  const water = got.symbols.find((s) => s.id === "water");
  expect(water.count).toBe(2);
  // Der aktuelle Traum zählt sich NIE selbst mit — sonst stünde bei jedem
  // ersten Auftreten „schon einmal da gewesen".
  expect(water.entryIds).not.toContain("neu");
  expect(got.symbols.find((s) => s.id === "falling").count).toBe(1);
});

/* ⚠ Die Zählung kennt keine Richtung: Wer einen ALTEN Traum aufschlägt,
   bekommt auch spätere mitgezählt. Das ist gewollt (eine Wiederkehr ist eine
   Wiederkehr, egal in welche Richtung man blättert) — aber es verbietet der
   Oberfläche das Wort „frühere Träume". Genau daran ist die erste Fassung des
   Wiederkehr-Hinweises gescheitert: „in 2 früheren Träumen" stand über einem
   Traum, von dem einer der beiden von HEUTE war. */
test("a dream opened later counts the newer ones too — hence 'other', not 'earlier'", () => {
  const j = [
    dream("alt", { text: "water everywhere", createdAt: "2026-08-01T08:00:00.000Z" }),
    dream("neu", { text: "the sea again", createdAt: "2026-08-10T08:00:00.000Z" }),
  ];
  // Aufgeschlagen wird der ÄLTERE — der einzige andere Traum ist neuer.
  expect(recurrenceFor(j, j[0]).symbols[0].entryIds).toEqual(["neu"]);
});

test("a symbol only in THIS dream is not a recurrence", () => {
  const j = [
    dream("alt", { text: "a quiet room" }),
    dream("neu", { text: "the ocean waves" }),
  ];
  expect(recurrenceFor(j, j[1]).symbols.find((s) => s.id === "water")).toBeUndefined();
});

test("the second appearance already counts — that is when a person notices", () => {
  const j = [
    dream("alt", { text: "water everywhere" }),
    dream("neu", { text: "the sea again" }),
  ];
  expect(recurrenceFor(j, j[1]).symbols[0].count).toBe(1);
});

test("cast recurrence follows the same rule, newest dream first", () => {
  const j = [
    dream("a", { references: [{ tag: "lena" }], createdAt: "2026-08-01T08:00:00.000Z" }),
    dream("b", { references: [{ tag: "lena" }, { tag: "rex" }], createdAt: "2026-08-07T08:00:00.000Z" }),
    dream("neu", { references: [{ tag: "lena" }], createdAt: "2026-08-10T08:00:00.000Z" }),
  ];
  const got = recurrenceFor(j, j[2]);
  expect(got.cast).toEqual([{ tag: "lena", count: 2, entryIds: ["b", "a"] }]);
  // rex kommt in DIESEM Traum nicht vor — also keine Wiederkehr.
  expect(got.cast.find((c) => c.tag === "rex")).toBeUndefined();
});

test("seed dreams never create a recurrence", () => {
  const j = [
    dream("e_seed1", { text: "ocean water waves", references: [{ tag: "lena" }] }),
    dream("neu", { text: "the sea", references: [{ tag: "lena" }] }),
  ];
  const got = recurrenceFor(j, j[1]);
  expect(got.symbols).toEqual([]);
  expect(got.cast).toEqual([]);
});

test("no entry, no journal, no crash", () => {
  expect(recurrenceFor([], null)).toEqual({ symbols: [], cast: [] });
  expect(recurrenceFor(null, dream("x"))).toEqual({ symbols: [], cast: [] });
});
