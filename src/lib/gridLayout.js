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

/* Das Kachelformat als Zahlenpaar. Vorgabe ist Hochkant, weil die App
 * hochkant ist — aber NICHT fest verdrahtet: Wer 16:9 wählt, bekommt
 * 16:9-Kacheln, und dann muss der Behälter anders aussehen. */
function seiten(tile) {
  const m = /^(\d+):(\d+)$/.exec(String(tile || "9:16"));
  return m ? [Number(m[1]), Number(m[2])] : [9, 16];
}

/** Das Seitenverhältnis, das der Behälter haben MUSS, damit jede Kachel
 *  exakt das Kachelformat bekommt — gekürzt, als Zeichenkette.
 *
 *  ⚠ Der angenehme Sonderfall: Bei einem QUADRATISCHen Raster (cols === rows)
 *  ist der Behälter im selben Verhältnis wie die Kachel. 2×2 aus 9:16 ergibt
 *  wieder 9:16, 2×2 aus 16:9 wieder 16:9 — beides Formate, die jedes Modell
 *  kennt. Deshalb ist 2×2 das einzige Raster, das ohne Sonderformat
 *  auskommt, und deshalb funktioniert der Rastertrick in BEIDEN Formaten. */
export function containerRatio(cols, rows, tile = "9:16") {
  const [tw, th] = seiten(tile);
  const w = cols * tw, h = rows * th;
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
export function containerSize(cols, rows, maxLongSide, tile = "9:16") {
  const [tw, th] = seiten(tile);
  const ratio = (cols * tw) / (rows * th);
  let w, h;
  if (ratio >= 1) { w = maxLongSide; h = Math.round(w / ratio); }
  else { h = maxLongSide; w = Math.round(h * ratio); }
  return { width: w - (w % cols), height: h - (h % rows) };
}

/** Die Kachelgröße, die dabei herauskommt. */
export function tileSize(cols, rows, maxLongSide, tile = "9:16") {
  const { width, height } = containerSize(cols, rows, maxLongSide, tile);
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

/* ── Das Raster, das die App tatsächlich fährt (seit 24.08.2026) ──────────
 *
 * Bis hierher ist diese Datei reine Geometrie: Sie rechnet jedes Raster aus,
 * das man ihr nennt. Was jetzt folgt, ist die ENTSCHEIDUNG — welches davon
 * die App benutzt. Sie steht bewusst hier und nirgends sonst, weil sie an
 * ZWEI weit auseinanderliegenden Stellen gebraucht wird: Der Server baut
 * damit den Auftrag (Pixelmaß, Preis), der Browser schneidet damit das
 * Ergebnis (`splitIntoTiles`). Laufen die beiden auseinander, sucht der
 * Schnitt die Kacheln an der falschen Stelle — und niemand sieht einen
 * Fehler, nur schlechte Bilder.
 */
import { imageModel, imagePrice, imageStage, DEFAULT_IMAGE_MODEL } from "./imageModel.js";

/* 2×2, nicht 3×3. Der Grund ist gemessen, nicht ästhetisch: Ein 3×3 wäre je
 * Szene billiger, fiele aber auf 1024×1834 je Kachel und damit UNTER das,
 * was wir heute ausliefern. 2×2 ist die größte Ersparnis, die keine
 * Auflösung kostet. */
export const GRID_COLS = 2;
export const GRID_ROWS = 2;
export const GRID_SLOTS = GRID_COLS * GRID_ROWS;

/** Wie EIN Rasterauftrag für dieses Modell aussieht: Behältermaß, Kachelmaß
 *  und die Schnittkästen dazu.
 *
 *  ⚠ Das Pixelmaß ist Pflicht, kein Feinschliff: GPTs Presets sind winzig
 *  (`portrait_16_9` = 576×1024). Ohne ausdrückliches Maß käme ein Raster mit
 *  Kacheln von 288×512 zurück — bezahlt und unbrauchbar. */
export function appGrid(modelId) {
  const m = imageModel(modelId);
  const size = containerSize(GRID_COLS, GRID_ROWS, m.maxSide || 2048, "9:16");
  return {
    cols: GRID_COLS,
    rows: GRID_ROWS,
    slots: GRID_SLOTS,
    size,
    tile: tileSize(GRID_COLS, GRID_ROWS, m.maxSide || 2048, "9:16"),
    boxes: tileBoxes(size.width, size.height, GRID_COLS, GRID_ROWS),
  };
}

/** Was uns EIN CREDIT im Einkauf kostet — die Zahl, aus der die ganze
 *  Preisliste hergeleitet ist (plans.js, video.js).
 *
 *  Ein Credit ist ein Bild (pricing.js). Ein Bild ist seit dem 24.08.2026
 *  EINE SZENE AUS EINEM RASTER — also der Rasterpreis geteilt durch die
 *  Plätze, nicht der Preis eines Einzelbildes.
 *
 *  ⚠⚠ Genau hier ist am 24.08. schon einmal die falsche Zahl gezogen
 *  worden: `imageModel(id).usd` ist bei GPT Image 2 ein EINZELBILD in
 *  „high" ($0,178) — das Sechsfache dessen, was wir wirklich zahlen. Die
 *  Tabelle kennt mehrere Preise für dasselbe Modell; richtig ist der, den
 *  UNSER Auftrag auslöst: Stufe mal Rastermaß, geteilt durch die Plätze.
 *  Deshalb rechnet diese Funktion es aus, statt es irgendwo hinzuschreiben.
 *
 *  ⚠ Und deshalb steht sie HIER und nicht in plans.js: Sie braucht das
 *  Rastermaß (`appGrid`) und die Stufe (`imageStage`). Eine Konstante in
 *  plans.js war bis zum 24.08.2026 `0.08` — der Nano-Banana-Preis vom
 *  8. August, drei Modellwechsel alt. Eine abgeschriebene Zahl veraltet
 *  still; eine hergeleitete kann es nicht.
 */
export function creditCostUsd(modelId = DEFAULT_IMAGE_MODEL) {
  const raster = appGrid(modelId);
  return imagePrice(modelId, imageStage(modelId), raster.size) / raster.slots;
}

/** Wie viele Rasteraufrufe eine Traumgröße kostet — und wie viele Plätze
 *  dabei leer bleiben.
 *
 *  ⚠ Ein angefangenes Raster ist ein VOLLER, bezahlter Aufruf. Genau daran
 *  hängt, warum vier und acht die Traumgrößen sind (pricing.js): Bei fünf
 *  Szenen zahlt man zwei Aufrufe, je Szene 60 % mehr als bei vier. */
export function gridRuns(count) {
  const n = Math.max(1, Math.floor(Number(count) || 1));
  const runs = Math.ceil(n / GRID_SLOTS);
  return { runs, slots: runs * GRID_SLOTS, spare: runs * GRID_SLOTS - n };
}
