import { test, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { PRICES, IMAGE_COUNTS, priceForImages } from "./pricing.js";
import { GRID_SLOTS, gridRuns } from "./gridLayout.js";

/* ⚠ Diese Datei entstand am 25.08.2026 aus einem bezahlten Fehler.
   Der Wizard startete mit `imageCount: 5` — einer Zahl, die es seit der
   Umstellung auf 4/8 nicht mehr gibt. Nichts hat gemeckert:
     · Der Knopf zeigte „4 Credits", weil priceForImages(5) auf die kleinste
       angebotene Zahl zurueckfaellt. Dieser Rueckfall ist ein Netz fuer ALTE
       Journaleintraege — hier deckte er einen LEBENDEN Fehler zu.
     · Abgerechnet wurden dann 5 Credits.
     · Und fuenf Szenen brauchen ZWEI Rasteraufrufe: $0,226 statt $0,113. */

test("die Vorgabe des Wizards ist eine Zahl, die es wirklich gibt", () => {
  const src = readFileSync(new URL("../wizard/useWizard.js", import.meta.url), "utf8");
  const zeile = src.match(/^\s*imageCount:\s*(.+),\s*$/m)?.[1] || "";
  /* Nicht der WERT wird geprueft, sondern dass er ABGELEITET ist. Eine
     Konstante hier waere beim naechsten Angebotswechsel wieder falsch — und
     wieder stumm. */
  expect(zeile).toContain("IMAGE_COUNTS");
});

test("jede angebotene Bildzahl hat einen echten Preis, keinen Rueckfall", () => {
  for (const n of IMAGE_COUNTS) {
    expect(PRICES.images[n]).toBe(n);          // 1 Credit = 1 Bild
    expect(priceForImages(n)).toBe(n);
  }
});

/* ⚠ Der Grund, warum es ueberhaupt 4 und 8 sind — und warum 5 teuer ist.
   Ein angefangenes Raster ist ein voller, bezahlter Aufruf. */
test("jede angebotene Bildzahl geht ohne Verschnitt im Raster auf", () => {
  for (const n of IMAGE_COUNTS) {
    expect(`${n}: ${gridRuns(n).spare}`).toBe(`${n}: 0`);
  }
  // Und die Gegenprobe: 5 verschwendet drei Plaetze.
  expect(gridRuns(5).spare).toBe(3);
  expect(gridRuns(5).runs).toBe(2);
});

test("der Rueckfall bleibt fuer ALTE Eintraege da — er ist kein Fehler", () => {
  // Ein Journaleintrag von vor der Umstellung darf keine Luecke reissen.
  expect(priceForImages(5)).toBe(Math.min(...IMAGE_COUNTS));
  expect(priceForImages(undefined)).toBe(Math.min(...IMAGE_COUNTS));
});

test("die Rastereinheit ist vier — daran haengt die ganze Rechnung", () => {
  expect(GRID_SLOTS).toBe(4);
  expect(IMAGE_COUNTS.every((n) => n % GRID_SLOTS === 0)).toBe(true);
});
