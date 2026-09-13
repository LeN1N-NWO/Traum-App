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
  /* Eigene Clips seit 13.09. (Seedance 2.5 über Higgsfield, 5 s, 3:4, 480p,
     je ~32 Credits) — die `look`-Filter sind weg, der Stil steckt im Film.
     Originale in media/clips-src/, Vorschau 270 px stumm < 200 KB. ⚠ media/
     ist git-ignoriert: die Dateien liegen nur im Hauptcheckout. */
  { id: "ultrareal",   styleId: "ultrareal",   emoji: "🎥", clip: "/media/pvultrareal2609a.mp4" },     // die Glühwürmchen aus dem Wasserhahn, ein ruhiger Take
  { id: "noir",        styleId: "noir",        emoji: "🕶", clip: "/media/pvnoir2609a.mp4" },          // der Rauch wird zur Frau, ein harter Schnitt
  { id: "dreamlike",   styleId: "dreamlike",   emoji: "🌙", clip: "/media/pvdreamlike2609a.mp4" },     // das Bett gleitet die Treppe hinab
  { id: "romantic",    styleId: "romantic",    emoji: "💗", clip: "/media/pvromantic2609a.mp4" },      // die Stadt hebt ab wie Pusteblumen
  { id: "dark",        styleId: "dark",        emoji: "🌑", clip: "/media/pvdark2609a.mp4" },          // der Flur, hinter jeder Tür er selbst
  /* Eigener Clip seit 13.09. (Seedance 2.5 über Higgsfield, ein Take, 3:4):
     der Mann im grauen Anzug wird zu Tauben, der Hut bleibt. Kein `look`
     mehr — der Stil steckt im Film, nicht im Filter. Original in
     media/clips-src/, Vorschau 270 px stumm. */
  { id: "surreal",     styleId: "surreal",     emoji: "🌀", clip: "/media/pvsurreal2609a.mp4" },
  { id: "nostalgic",   styleId: "nostalgic",   emoji: "📻", clip: "/media/pvnostalgic2609a.mp4" },     // Geburtstag, Jump-Cut, nur die Kerzen bleiben
  { id: "adventurous", styleId: "adventurous", emoji: "🧭", clip: "/media/pvadventurous2609a.mp4" },   // der Grat ist eine Schildkröte
  { id: "ink",         styleId: "ink",         emoji: "🖌", clip: "/media/pvink2609a.mp4" },           // der Kranich zerfällt zu Schriftzeichen
  { id: "clay",        styleId: "clay",        emoji: "🗿", clip: "/media/pvclay2609a.mp4" },   // 13.09.: die Schläferin im Bett in der Teetasse
  // ── ab hier hinter „More styles" (styles.js: featured fehlt) ──
  { id: "goldenage",   styleId: "goldenage",   emoji: "🎞", clip: "/media/pvgoldenage2609a.mp4" },     // die Bäume ziehen den Hut
  { id: "fantasyanime", styleId: "fantasyanime", emoji: "🐉", clip: "/media/pvfantasyanime2609a.mp4" }, // die Klinge wird zum Runenkreis, der Kreis zum Falter
  { id: "oilpaint",    styleId: "oilpaint",    emoji: "🖼", clip: "/media/pvoilpaint2609a.mp4" },      // der Fischer knüpft ein Netz aus Regen
  { id: "marker",      styleId: "marker",      emoji: "🖍", clip: "/media/pvmarker2609a.mp4" },        // der Strich läuft voraus, sie rennt vom Blatt (3. Fassung)
  { id: "actionfigure", styleId: "actionfigure", emoji: "🦸", clip: "/media/pvactionfigure2609a.mp4" }, // die Katze als Drache, der Arm klickt wieder rein
  { id: "marionette",  styleId: "marionette",  emoji: "🎭", clip: "/media/pvmarionette2609a.mp4" },    // über dem König hängt der Puppenspieler an Fäden
  { id: "papercut",    styleId: "papercut",    emoji: "✂️", clip: "/media/pvpapercut2609a.mp4" },      // der Schatten des Fuchses geht neben ihm her
  { id: "papiermache", styleId: "papiermache", emoji: "📰", clip: "/media/pvpapiermache2609a.mp4" },   // der Nieser, aus dem Kopf wird eine Sonnenblume
  { id: "screenprint", styleId: "screenprint", emoji: "🖨", clip: "/media/pvscreenprint2609a.mp4" },   // die Farbschichten laufen als eigene Männer weiter
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
