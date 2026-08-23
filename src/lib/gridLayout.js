/* Wie viele Szenen passen in EIN Bild — und wo genau sitzt jede darin.
 *
 * Der Kern ist eine Zeile Bruchrechnung: Ein Behälter im Verhältnis
 * (Spalten × 9) : (Zeilen × 16) zerfällt in lauter EXAKTE 9:16-Kacheln.
 * Für 2×2 ergibt das wieder 9:16 — dasselbe Format wie die App selbst,
 * weil das Halbieren beider Seiten das Verhältnis nicht ändert. Das ist
 * der einzige Fall, der ohne Sonderformat auskommt, und deshalb der
 * einzige, den auch ein Modell ohne freie Pixelmaße rendern kann.
 *
 * ⚠ Die Kachel ist IMMER die geteilte Behälterseite. Ein Raster kauft den
 * Preis mit Auflösung, nicht mit Zauberei: Um die heutigen 1440×2560 je
 * Szene zu halten, bräuchte ein 2×2 einen Behälter von 2880×5120 — mehr,
 * als eines der Modelle ausgibt. Wer hier Plätze hinzufügt, verkleinert
 * jede einzelne Szene. Gesichter und Hände sind das, was zuerst zerfällt
 * (dieselbe Lehre wie beim Dreier-Streifen vom 09.08.).
 *
 * Reine Rechnung, kein DOM: das Schneiden selbst steht in splitGrid.js.
 */

/* Warum nicht einfach „so viele Spalten wie Szenen": Ein Streifen aus fünf
 * Kacheln hat das Verhältnis 45:16 (2,81:1) — extrem breit. Die lange Seite
 * ist bei jedem Modell gedeckelt, also wird jede Kachel darin schmal. Zwei
 * Reihen teilen dieselbe Fläche günstiger auf. Deshalb wird hier möglichst
 * quadratisch aufgeteilt. */
export function layoutFor(count) {
  const n = Math.max(1, Math.floor(Number(count) || 1));
  if (n === 1) return { cols: 1, rows: 1, slots: 1, spare: 0 };
  const cols = Math.ceil(Math.sqrt(n));
  const rows = Math.ceil(n / cols);
  return { cols, rows, slots: cols * rows, spare: cols * rows - n };
}

/** Das Seitenverhältnis, das der Behälter haben MUSS, damit jede Kachel
 *  exakt 9:16 wird — gekürzt, als Zeichenkette („9:16", „27:32"). */
export function containerRatio(cols, rows) {
  const w = cols * 9, h = rows * 16;
  const teiler = (a, b) => (b ? teiler(b, a % b) : a);
  const g = teiler(w, h);
  return `${w / g}:${h / g}`;
}

/** Die konkreten Pixelmaße des Behälters, wenn die lange Seite bei
 *  `maxLongSide` gedeckelt ist (jedes Modell hat so eine Grenze — bei
 *  Seedream 5 Lite steht sie als `maxSide` in imageModel.js und ist
 *  GEMESSEN, weil das Schema dort etwas anderes behauptet).
 *  Beide Maße werden auf ein Vielfaches von `cols` bzw. `rows` abgerundet,
 *  damit das Schneiden später ohne Rundungsrest aufgeht. */
export function containerSize(cols, rows, maxLongSide) {
  const ratio = (cols * 9) / (rows * 16);
  let w, h;
  if (ratio >= 1) { w = maxLongSide; h = Math.round(w / ratio); }
  else { h = maxLongSide; w = Math.round(h * ratio); }
  return { width: w - (w % cols), height: h - (h % rows) };
}

/** Die Kachelgröße, die dabei herauskommt. */
export function tileSize(cols, rows, maxLongSide) {
  const { width, height } = containerSize(cols, rows, maxLongSide);
  return { width: width / cols, height: height / rows };
}

/** Wo jede Szene im fertigen Bild sitzt — Lesereihenfolge, also erst die
 *  obere Reihe von links nach rechts. Genau diese Reihenfolge muss der
 *  Prompt benennen, sonst weiß der Schnitt nicht, welches Stück welcher
 *  Beat ist.
 *
 *  Die Grenzen werden aus 0 heraus gerechnet, nie aufaddiert: drei
 *  gerundete Drittel landen sonst einen Pixel vor dem Rand und lassen
 *  einen Streifen der letzten Kachel stehen (die Lehre aus splitGrid.js).
 */
export function tileBoxes(width, height, cols, rows) {
  const xs = Array.from({ length: cols + 1 }, (_, i) => Math.round((i * width) / cols));
  const ys = Array.from({ length: rows + 1 }, (_, i) => Math.round((i * height) / rows));
  const boxes = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      boxes.push({ x: xs[c], y: ys[r], w: xs[c + 1] - xs[c], h: ys[r + 1] - ys[r] });
    }
  }
  return boxes;
}

/** Wie eine Position im Raster im Prompt heißt. Ein Modell versteht „obere
 *  linke Kachel" zuverlässiger als „Kachel 1" — und der Schnitt weiß
 *  dadurch trotzdem eindeutig, welcher Beat wohin gehört. */
export function slotName(index, cols, rows) {
  const r = Math.floor(index / cols), c = index % cols;
  const zeile = rows === 1 ? "" : ["top", "middle", "bottom"][rows === 2 ? r * 2 : r] || `row ${r + 1}`;
  const spalte = cols === 1 ? "" : ["left", "center", "right"][cols === 2 ? c * 2 : c] || `column ${c + 1}`;
  const teile = [zeile, spalte].filter(Boolean);
  return teile.length ? `${teile.join(" ")} tile` : "the single tile";
}
