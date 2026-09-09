/* Die Stil-Presets: was im Wizard als Video-Kachel zur Wahl steht.
 *
 * Antons Entscheidung (03.09.2026, nach drei Mockups): das Raster. Neun
 * Kacheln, jede mit laufender Vorschau — acht Bildstile und „Dreamflow",
 * der Film ohne Schnitt, in dem sich jede Szene in die nächste verwandelt.
 *
 * ── Was ein Preset IST ─────────────────────────────────────────────────
 * Ein Preset trägt einen Bildstil (`styleId`, styles.js) und darf ein
 * Tempo festlegen (`pace`, video.js). Die acht Stil-Presets legen KEIN
 * Tempo fest — dort wählt der Mensch weiter ruhig oder schnell. Dreamflow
 * legt `flow` fest und blendet den Tempo-Schalter aus: Sein Tempo ist sein
 * Wesen, nicht eine Einstellung.
 *
 * Dreamflow rendert im Bildstil „dreamlike" (weich, leuchtend): Der Fluss
 * lebt von Übergängen, und ein harter, fotorealer Look arbeitet gegen sie.
 * Das ist eine Vorgabe, keine Sperre — wer den Wert ändert, ändert eine
 * Zeile.
 *
 * ── Die Vorschau-Clips ─────────────────────────────────────────────────
 * ⚠ Heute sind das ATTRAPPEN: die drei Filme vom 03.09. plus zwei ältere,
 * als 270-Pixel-Kopien unter /media/ — also Antons eigene Filme, mit seinem
 * Gesicht, nur auf seinem Gerät. Sie gehören NICHT ins Bundle. Wer die
 * Dateien nicht hat, sieht die Kachel mit Emoji auf Farbe (PresetTile
 * fängt den Ladefehler). Echte Presets bekommen je einen eigenen, im Stil
 * gerenderten Clip als Auslieferungsmaterial in src/assets — dann wird
 * `clip` hier ein Import statt eines Pfads, und sonst ändert sich nichts.
 *
 * Reihenfolge = Rasterreihenfolge. Dreamflow steht vorn und doppelt breit;
 * mit zehn einfachen Stil-Kacheln dahinter geht das Dreierraster auf:
 * 2+1 / 3 / 3 / 3 = 12 Zellen. Aufgeklappt kommen neun einfache dazu = 21,
 * wieder durch drei teilbar. (Bis 08.09. war Adventure die zweite breite
 * Kachel — bei neun Kacheln brauchte es zwei, bei elf keine mehr.)
 *
 * ── Erste Reihe und „More styles" (08.09.2026) ─────────────────────────
 * Ob ein Preset sofort sichtbar ist, steht NICHT hier, sondern am Stil
 * (`featured` in styles.js) — eine Wahrheit, ein Ort. Dreamflow ist immer
 * sichtbar. Die elf Handwerksstile (Knete, Tusche, Scherenschnitt …) haben
 * heute keinen Clip: PresetTile zeigt dann Emoji auf Farbe. Der Clip kommt
 * wie bei den anderen, wenn je Stil einer gerendert ist. */

import { styleById } from "./styles.js";

export const DREAMFLOW = "dreamflow";

export const PRESETS = [
  { id: DREAMFLOW, styleId: "dreamlike", pace: "flow", emoji: "🌊", clip: "/media/pv146xj01olre81.mp4", wide: true },
  { id: "ultrareal",   styleId: "ultrareal",   emoji: "🎥", clip: "/media/pv3mbc0jejqwty8.mp4" },
  { id: "noir",        styleId: "noir",        emoji: "🕶", clip: "/media/pv3nlve2uwl0zm.mp4", look: "grayscale(1) contrast(1.25)" },
  { id: "dreamlike",   styleId: "dreamlike",   emoji: "🌙", clip: "/media/pvt8t2asdudzc4.mp4", look: "saturate(.8) brightness(1.12)" },
  { id: "romantic",    styleId: "romantic",    emoji: "💗", clip: "/media/pv3q75trlqwsw61.mp4", look: "sepia(.25) saturate(1.3) hue-rotate(-12deg)" },
  { id: "dark",        styleId: "dark",        emoji: "🌑", clip: "/media/pv146xj01olre81.mp4", look: "brightness(.55) contrast(1.2) saturate(.7)" },
  { id: "surreal",     styleId: "surreal",     emoji: "🌀", clip: "/media/pv3mbc0jejqwty8.mp4", look: "hue-rotate(35deg) saturate(1.5)" },
  { id: "nostalgic",   styleId: "nostalgic",   emoji: "📻", clip: "/media/pv3nlve2uwl0zm.mp4", look: "sepia(.6) contrast(.95)" },
  { id: "adventurous", styleId: "adventurous", emoji: "🧭", clip: "/media/pvt8t2asdudzc4.mp4", look: "saturate(1.35) contrast(1.1)" },
  { id: "ink",         styleId: "ink",         emoji: "🖌" },
  { id: "clay",        styleId: "clay",        emoji: "🗿" },
  // ── ab hier hinter „More styles" (styles.js: featured fehlt) ──
  { id: "goldenage",   styleId: "goldenage",   emoji: "🎞" },
  { id: "fantasyanime", styleId: "fantasyanime", emoji: "🐉" },
  { id: "oilpaint",    styleId: "oilpaint",    emoji: "🖼" },
  { id: "marker",      styleId: "marker",      emoji: "🖍" },
  { id: "actionfigure", styleId: "actionfigure", emoji: "🦸" },
  { id: "marionette",  styleId: "marionette",  emoji: "🎭" },
  { id: "papercut",    styleId: "papercut",    emoji: "✂️" },
  { id: "papiermache", styleId: "papiermache", emoji: "📰" },
  { id: "screenprint", styleId: "screenprint", emoji: "🖨" },
];

/** Die erste Reihe: Dreamflow plus jedes Preset, dessen Stil `featured`
 *  trägt. Abgeleitet, nicht hingeschrieben — sonst stünde die Wahrheit
 *  über die Sichtbarkeit in zwei Dateien. */
export function featuredPresets() {
  return PRESETS.filter((p) => p.id === DREAMFLOW || styleById(p.styleId)?.featured);
}

export function morePresets() {
  return PRESETS.filter((p) => p.id !== DREAMFLOW && !styleById(p.styleId)?.featured);
}

/** Welches Preset der Wizard-Zustand gerade meint. Kein eigenes Feld im
 *  Zustand: Ein Preset ist eine Ableitung aus Stil und Tempo, und zwei
 *  Quellen für dieselbe Wahrheit laufen auseinander. */
export function activePreset({ styleId, pace } = {}) {
  if (pace === "flow") return DREAMFLOW;
  return PRESETS.find((p) => p.id !== DREAMFLOW && p.styleId === styleId)?.id || PRESETS[1].id;
}

/** Was ein Antippen im Zustand ändert. Ein Stil-Preset nach Dreamflow
 *  holt das Tempo auf die Vorgabe zurück — sonst bliebe der Fluss still
 *  an, und die Kachel behauptete einen Stil, der nie so gerendert würde. */
export function applyPreset(id, { pace } = {}) {
  const p = PRESETS.find((x) => x.id === id) || PRESETS[1];
  if (p.pace) return { styleId: p.styleId, pace: p.pace };
  return { styleId: p.styleId, ...(pace === "flow" ? { pace: "calm" } : {}) };
}
