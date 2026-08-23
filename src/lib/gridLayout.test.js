import { test, expect } from "bun:test";
import { layoutFor, containerRatio, containerSize, tileSize, tileBoxes, slotName } from "./gridLayout.js";

/* Die Rasterrechnung entscheidet über Geld UND über Bildqualität: Jeder
   zusätzliche Platz verkleinert jede Szene. Deshalb wird hier nicht nur
   geprüft, DASS gerechnet wird, sondern dass die Kacheln am Ende wirklich
   9:16 sind — das ist die ganze Behauptung. */

test("a 2x2 container has the same 9:16 shape as the app itself", () => {
  expect(containerRatio(2, 2)).toBe("9:16");
});

test("every layout yields tiles of exactly 9:16", () => {
  for (const [cols, rows] of [[1, 1], [2, 2], [3, 2], [2, 3], [5, 1], [3, 3]]) {
    const { width, height } = tileSize(cols, rows, 3072);
    // Auf ganze Pixel gerundet, deshalb eine Toleranz von einem Prozent.
    expect(Math.abs(width / height - 9 / 16)).toBeLessThan(0.01);
  }
});

test("five scenes get six slots in a 3x2, one to spare", () => {
  expect(layoutFor(5)).toEqual({ cols: 3, rows: 2, slots: 6, spare: 1 });
  expect(containerRatio(3, 2)).toBe("27:32");
});

test("four scenes fit exactly, with nothing left over", () => {
  expect(layoutFor(4)).toEqual({ cols: 2, rows: 2, slots: 4, spare: 0 });
});

/* ⚠ Kein Streifen. Fünf Kacheln nebeneinander wären 45:16 — die lange
   Seite ist gedeckelt, also würde jede Kachel schmal. Zwei Reihen teilen
   dieselbe Fläche besser auf, und genau das muss layoutFor() wählen. */
test("layouts stay compact — never one long strip", () => {
  for (const n of [3, 4, 5, 6, 7, 8, 9]) {
    const { cols, rows } = layoutFor(n);
    expect(cols - rows).toBeLessThanOrEqual(1);
  }
});

test("a bigger canvas makes bigger tiles, never more of them", () => {
  const klein = tileSize(2, 2, 2048);
  const gross = tileSize(2, 2, 3072);
  expect(gross.width).toBeGreaterThan(klein.width);
  expect(layoutFor(4).slots).toBe(4);
});

/* Die Falle aus splitGrid.js, hier noch einmal: Grenzen aus 0 rechnen,
   nicht aufaddieren. Sonst bleibt am Rand ein Streifen stehen. */
test("the tiles tile the canvas completely — no gap, no overlap", () => {
  for (const [w, h, cols, rows] of [[1728, 3072, 2, 2], [2591, 3071, 3, 2], [1000, 1000, 3, 3]]) {
    const boxes = tileBoxes(w, h, cols, rows);
    expect(boxes.length).toBe(cols * rows);
    const flaeche = boxes.reduce((s, b) => s + b.w * b.h, 0);
    expect(flaeche).toBe(w * h);
    // Die letzte Kachel MUSS am Rand enden.
    const letzte = boxes[boxes.length - 1];
    expect(letzte.x + letzte.w).toBe(w);
    expect(letzte.y + letzte.h).toBe(h);
  }
});

test("the container divides evenly, so a cut leaves no remainder", () => {
  const { width, height } = containerSize(3, 2, 3072);
  expect(width % 3).toBe(0);
  expect(height % 2).toBe(0);
});

/* Der Prompt benennt Plätze, der Schnitt nummeriert sie — beide müssen
   dieselbe Lesereihenfolge meinen (erst obere Reihe, links nach rechts).
   Läuft das auseinander, bekommt jeder Beat das Bild seines Nachbarn. */
test("slot names follow reading order", () => {
  expect(slotName(0, 2, 2)).toBe("top left tile");
  expect(slotName(1, 2, 2)).toBe("top right tile");
  expect(slotName(2, 2, 2)).toBe("bottom left tile");
  expect(slotName(3, 2, 2)).toBe("bottom right tile");
  expect(slotName(0, 3, 2)).toBe("top left tile");
  expect(slotName(1, 3, 2)).toBe("top center tile");
  expect(slotName(5, 3, 2)).toBe("bottom right tile");
});

test("a single tile has no direction to name", () => {
  expect(slotName(0, 1, 1)).toBe("the single tile");
});
