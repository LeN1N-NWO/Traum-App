/* Glimpse (die Traum-Skizze) aus der Cloud: Jedes BILD ist ein Streifen aus
 * vier Hochkant-Szenen bei GPT Image 2 „low" (mit den Besetzungsfotos als
 * Referenz), ≈ $0,017. Seit 26.09.2026 (Antons Ansage) wählt man vorher,
 * wie viele Bilder es werden — 1, 2 oder 3, also 4, 8 oder 12 Szenen —,
 * alle entstehen PARALLEL, und parallel dazu der Ton (sketchSound.js).
 * Den Film macht das iPhone.
 *
 * Die Regel (Antons Ansage 26.09.: „5 kostenlose pro Monat, egal was du
 * hast, dann der Rest über Credits"):
 *   · SKETCH_FREE Glimpses je Kalendermonat gratis — das erste Bild und
 *     der Ton; jedes weitere Bild kostet SKETCH_EXTRA Credit.
 *   · Danach: SKETCH_BASE Credits (erstes Bild + Ton) + SKETCH_EXTRA je
 *     weiteres Bild.
 * sketchQuota.test.js prüft, dass kein Glimpse je Credit mehr kostet, als
 * ein Credit einbringt (CREDIT_COST_USD) — gratis wie bezahlt.
 *
 * ⚠ Wie die Credits heute liegt auch dieser Zähler auf dem Gerät und ist
 * Buchhaltung, keine Zugangskontrolle — scharf wird er mit der Anmeldung
 * (serverseitiger Zähler, wie server_spend). Bis dahin loggt der Server
 * jeden Aufruf mit seinem Preis. */
export const SKETCH_FREE = 5;
export const SKETCH_BASE = 2;
export const SKETCH_EXTRA = 1;
export const SKETCH_STRIPS = [1, 2, 3];
export const SKETCH_MAX_STRIPS = SKETCH_STRIPS[SKETCH_STRIPS.length - 1];
export const SCENES_PER_STRIP = 4;

/* Wie lange jede Szene steht und wie lange die Überblendung dauert — je
   mehr Szenen, desto kürzer jede, damit der Film nicht zäh wird. Diese
   Zahlen gehen an den Renderer (SketchRenderer.swift, Options). */
const TIMING = {
  1: { hold: 3.0, fade: 1.4 },
  2: { hold: 2.1, fade: 1.2 },
  3: { hold: 1.7, fade: 1.0 },
};
export function clampStrips(n) {
  const k = Math.round(Number(n) || 1);
  return Math.max(1, Math.min(SKETCH_MAX_STRIPS, k));
}
export function sketchTiming(strips) {
  const n = clampStrips(strips);
  const scenes = n * SCENES_PER_STRIP;
  const { hold, fade } = TIMING[n];
  return { strips: n, scenes, hold, fade, seconds: Math.round((scenes * hold + (scenes - 1) * fade) * 10) / 10 };
}

/** Wie viele Bilder der Traum trägt: eins je vier Szenen der Analyse. */
export function recommendedStrips(beatCount) {
  return clampStrips(Math.ceil((Number(beatCount) || 0) / SCENES_PER_STRIP));
}

/** "2026-09" — der Monat, in dem gezählt wird (Ortszeit des Geräts). */
export function monthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

/** Wie viele Gratis-Glimpses in diesem Monat noch übrig sind. */
export function sketchFreeLeft(state, date = new Date()) {
  const q = state?.sketchQuota;
  const used = q && q.month === monthKey(date) ? Math.max(0, Number(q.used) || 0) : 0;
  return Math.max(0, SKETCH_FREE - used);
}

/* ── Geschenkte Glimpses — eine eigene Kategorie (10.10.2026) ────────────
 *
 * Antons Frage: „Ob Glimpses anders getrackt werden als Punkte … das
 * braucht pro User noch eine andere Kategorie, speziell Glimpses." Ja:
 * `glimpseGifts` zählt geschenkte Glimpses, getrennt vom Guthaben.
 *   · Ein geschenkter Glimpse ist genau ein Glimpse (erstes Bild + Ton),
 *     keine Credits — er lässt sich nicht zu einem Film zusammensparen.
 *     Uns kostet er ≈ $0,04, egal wie viele jemand hat.
 *   · Er verfällt nicht (anders als der Credit-Geschenktopf, credits.js).
 *   · Reihenfolge: erst die Gratis-Glimpses des Monats (die verfallen am
 *     Monatsende), dann die geschenkten, dann Credits.
 * Woher sie kommen: die Viertel des Traum-Rings (3, 6, 9 …) und bei 48
 * Träumen zehn auf einmal für alle, die nie gekauft haben (streakBoard.js). */

/** Wie viele geschenkte Glimpses noch da sind. */
export function sketchGiftLeft(state) {
  return Math.max(0, Math.floor(Number(state?.glimpseGifts) || 0));
}

/** Was der nächste Glimpse mit `strips` Bildern kostet. */
export function sketchCost(state, strips = 1, date = new Date()) {
  const extra = (clampStrips(strips) - 1) * SKETCH_EXTRA;
  const covered = sketchFreeLeft(state, date) > 0 || sketchGiftLeft(state) > 0;
  return (covered ? 0 : SKETCH_BASE) + extra;
}

/** Der Zähler nach einem GELUNGENEN Glimpse (misslungene zählen nicht).
 *  Ist der Monat schon aufgebraucht, geht ein geschenkter Glimpse weg. */
export function countSketch(state, date = new Date()) {
  const month = monthKey(date);
  const q = state?.sketchQuota;
  const used = q && q.month === month ? Math.max(0, Number(q.used) || 0) : 0;
  const fromGift = sketchFreeLeft(state, date) === 0 && sketchGiftLeft(state) > 0;
  return { sketchQuota: { month, used: used + 1 }, ...(fromGift ? { glimpseGifts: sketchGiftLeft(state) - 1 } : {}) };
}
