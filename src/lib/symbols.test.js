import { test, expect } from "bun:test";
import { detectSymbols, symbolById, symbolOccurrences, dreamsDuringEvent } from "./symbols.js";

test("erkennt Symbole an Wortgrenzen", () => {
  expect(detectSymbols("I was flying over the sea")).toContain("flying");
  expect(detectSymbols("I was flying over the sea")).toContain("water");
});

test("schlaegt nicht innerhalb laengerer Woerter an", () => {
  expect(detectSymbols("the season was over")).not.toContain("water");
  expect(detectSymbols("I read the catalogue")).not.toContain("animal");
});

test("typografische Apostrophe zaehlen wie gerade", () => {
  expect(detectSymbols("I can’t find the way")).toContain("lost");
});

test("leerer Text liefert keine Symbole", () => {
  expect(detectSymbols("")).toEqual([]);
  expect(detectSymbols(null)).toEqual([]);
});

test("symbolById findet und liefert sonst null", () => {
  expect(symbolById("water").label).toBe("Water");
  expect(symbolById("gibtsnicht")).toBe(null);
});

test("Vorkommen werden neueste zuerst sortiert", () => {
  const journal = [
    { id: "a", createdAt: "2026-01-01T00:00:00Z", title: "alt", text: "water" },
    { id: "b", createdAt: "2026-06-01T00:00:00Z", title: "neu", text: "water" },
  ];
  expect(symbolOccurrences(journal).get("water").map((o) => o.entryId)).toEqual(["b", "a"]);
});

test("Ereigniszeitraum nutzt Ortszeit-Tagesgrenzen", () => {
  // Ein um 00:30 Ortszeit notierter Traum muss in seinen eigenen Tag fallen.
  // Mit UTC-Grenzen fiel er in Berlin (UTC+2) heraus — ausgerechnet die
  // Träume, die man direkt nach dem Aufwachen einträgt.
  const mitternachts = new Date(2026, 7, 1, 0, 30).toISOString();
  const journal = [{ id: "a", createdAt: mitternachts, title: "t", text: "x" }];
  const treffer = dreamsDuringEvent(journal, { startsAt: "2026-08-01", endsAt: "2026-08-01" });
  expect(treffer).toHaveLength(1);
});
