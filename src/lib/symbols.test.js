import { test, expect } from "bun:test";
import { detectSymbols, symbolById, symbolOccurrences, dreamsDuringEvent } from "./symbols.js";

test("detects symbols on word boundaries", () => {
  expect(detectSymbols("I was flying over the sea")).toContain("flying");
  expect(detectSymbols("I was flying over the sea")).toContain("water");
});

test("does not match inside longer words", () => {
  expect(detectSymbols("the season was over")).not.toContain("water");
  expect(detectSymbols("I read the catalogue")).not.toContain("animal");
});

test("typographic apostrophes count as straight ones", () => {
  expect(detectSymbols("I can’t find the way")).toContain("lost");
});

test("empty text yields no symbols", () => {
  expect(detectSymbols("")).toEqual([]);
  expect(detectSymbols(null)).toEqual([]);
});

test("symbolById finds one or returns null", () => {
  expect(symbolById("water").label).toBe("Water");
  expect(symbolById("gibtsnicht")).toBe(null);
});

test("occurrences are sorted newest first", () => {
  const journal = [
    { id: "a", createdAt: "2026-01-01T00:00:00Z", title: "alt", text: "water" },
    { id: "b", createdAt: "2026-06-01T00:00:00Z", title: "neu", text: "water" },
  ];
  expect(symbolOccurrences(journal).get("water").map((o) => o.entryId)).toEqual(["b", "a"]);
});

test("occurrences read the English analysis beats of German dreams", () => {
  // Antons Befund 04.10.: deutsche Texte allein ergaben einen leeren Atlas.
  const journal = [
    { id: "de", createdAt: "2026-09-26T00:00:00Z", title: "Schwimmbad", text: "Ich springe vom Sprungbrett ins Becken.", analysis: { beats: ["I dive into a swimming pool"] } },
    { id: "nur", createdAt: "2026-09-27T00:00:00Z", title: "Ohne", text: "Ich stehe auf dem Fernsehturm." },
  ];
  const occ = symbolOccurrences(journal);
  expect(occ.get("water").map((o) => o.entryId)).toEqual(["de"]);
  expect(occ.get("water")[0].text).toBe("Ich springe vom Sprungbrett ins Becken.");
});

test("event ranges use local-time day bounds", () => {
  // A dream noted at 00:30 local time must fall inside its own day. With UTC
  // bounds it dropped out in Berlin (UTC+2) — precisely the dreams people
  // write down right after waking.
  const mitternachts = new Date(2026, 7, 1, 0, 30).toISOString();
  const journal = [{ id: "a", createdAt: mitternachts, title: "t", text: "x" }];
  const treffer = dreamsDuringEvent(journal, { startsAt: "2026-08-01", endsAt: "2026-08-01" });
  expect(treffer).toHaveLength(1);
});
