/* Cuts one wide grid image into equal vertical panels, in the browser.
 *
 * The server has no image decoder — this app is deliberately Vanilla JS with
 * no new native dependency for something the BROWSER already does natively.
 * <canvas> is that decoder, and it is already loaded wherever this runs.
 *
 * Plain exact-thirds cropping, no divider detection: verified against the
 * real API on 09.08.2026 — the model's own divider lines land close enough
 * to exact thirds that a straight crop shows neither a seam nor bleed from
 * the panel next door. See buildGridPrompt() for the prompt that depends on
 * this being true.
 */
import { tileBoxes } from "./gridLayout.js";

/* How much of each edge the letterbox trim may eat, at most. The bars the
 * model paints are ~3–4% of the height; anything past 12% is scene, not
 * frame — a nearly black dream must not be trimmed into a ribbon. */
const MAX_TRIM = 0.12;

/** A row/column is "frame" when it is uniformly near-black — judged by its
 *  BRIGHTEST pixel, not its average. Measured on a real render (09.08.2026):
 *  painted letterbox maxes out at 5/255 across the whole line, while even a
 *  night-water scene row averaging 4 still carries specular highlights of
 *  19+. An average threshold ate 144px of dark scene; the max survives it. */
function isDarkLine(data, w, fixed, along, isRow) {
  let max = 0;
  for (let i = 0; i < along; i++) {
    const p = (isRow ? fixed * w + i : i * w + fixed) * 4;
    const v = Math.max(data[p], data[p + 1], data[p + 2]);
    if (v > max) max = v;
    if (max >= 12) return false;   // bright enough — certainly scene
  }
  return true;
}

/* The model tends to letterbox the triptych — black bars above and below,
 * sometimes at the sides — despite the prompt forbidding it. Measured on a
 * real render (09.08.2026): solid #000-ish bands, full width. They are part
 * of the generated pixels, so they can only be removed here, before the cut. */
function findContentBox(ctx, w, h) {
  const data = ctx.getImageData(0, 0, w, h).data;
  let top = 0, bottom = h - 1, left = 0, right = w - 1;
  const maxY = Math.floor(h * MAX_TRIM), maxX = Math.floor(w * MAX_TRIM);
  while (top < maxY && isDarkLine(data, w, top, w, true)) top++;
  while (h - 1 - bottom < maxY && isDarkLine(data, w, bottom, w, true)) bottom--;
  while (left < maxX && isDarkLine(data, w, left, h, false)) left++;
  while (w - 1 - right < maxX && isDarkLine(data, w, right, h, false)) right--;
  return { x: left, y: top, w: right - left + 1, h: bottom - top + 1 };
}

export async function splitIntoPanels(url, count) {
  const img = await loadImage(url);
  const W = img.naturalWidth, H = img.naturalHeight;

  // One full-size read to find the letterbox, then everything is cropped
  // relative to the content box instead of the canvas the model padded.
  const probe = document.createElement("canvas");
  probe.width = W; probe.height = H;
  const pctx = probe.getContext("2d", { willReadFrequently: true });
  pctx.drawImage(img, 0, 0);
  const box = findContentBox(pctx, W, H);

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const blobs = [];

  // Boundaries computed from 0, not accumulated panel widths — three
  // rounded thirds can otherwise land a pixel short of the content's real
  // width, leaving a sliver of the last panel uncaptured.
  const bounds = Array.from({ length: count + 1 }, (_, i) => box.x + Math.round((i * box.w) / count));

  for (let i = 0; i < count; i++) {
    const sx = bounds[i];
    const sw = bounds[i + 1] - sx;
    canvas.width = sw;
    canvas.height = box.h;
    ctx.drawImage(img, sx, box.y, sw, box.h, 0, 0, sw, box.h);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
    if (blob) blobs.push(blob);
  }
  return blobs;
}

/** Der zweidimensionale Schnitt: EIN Bild in cols × rows Kacheln.
 *
 *  ⚠ Das ist bewusst eine eigene Funktion und keine Verallgemeinerung von
 *  `splitIntoPanels()`. Der Dreier-Streifen ist an echten Renders belegt,
 *  sein Prompt ist woertlich abgestimmt auf genau diesen Schnitt, und er
 *  laeuft im bezahlten Alltag. Ihn umzubauen, um ein ungemessenes Raster
 *  mitzubedienen, waere ein Umbau am tragenden Teil fuer den Versuch.
 *
 *  Die Kachelgrenzen kommen aus `tileBoxes()` in gridLayout.js — dieselbe
 *  Rechnung, die auch der Prompt und die Kostenschaetzung benutzen. Sie
 *  rechnet aus 0 heraus statt aufzuaddieren; drei gerundete Drittel landen
 *  sonst einen Pixel vor dem Rand.
 *
 *  Rueckgabe in LESEREIHENFOLGE: erst die obere Reihe von links nach
 *  rechts. Genau die Reihenfolge benennt `slotName()` im Prompt — sonst
 *  wuesste hinterher niemand, welche Kachel welcher Beat ist.
 */
export async function splitIntoTiles(url, cols, rows) {
  const img = await loadImage(url);
  const W = img.naturalWidth, H = img.naturalHeight;

  const probe = document.createElement("canvas");
  probe.width = W; probe.height = H;
  const pctx = probe.getContext("2d", { willReadFrequently: true });
  pctx.drawImage(img, 0, 0);
  const box = findContentBox(pctx, W, H);

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const blobs = [];

  for (const b of tileBoxes(box.w, box.h, cols, rows)) {
    canvas.width = b.w;
    canvas.height = b.h;
    // Versatz des Inhaltsrahmens draufrechnen: tileBoxes kennt nur die
    // Flaeche, nicht den schwarzen Rand, den das Modell darum gemalt hat.
    ctx.drawImage(img, box.x + b.x, box.y + b.y, b.w, b.h, 0, 0, b.w, b.h);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
    if (blob) blobs.push(blob);
  }
  return blobs;
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // Same origin as the app in every shipped configuration (API_BASE only
    // ever points elsewhere for a Capacitor bundle, which has no canvas
    // tainting to begin with — file:// pages have no origin to violate).
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load the grid image for splitting."));
    img.src = url;
  });
}
