/* Die Geometrie der Galaxie (components/galaxy.tsx) — eine Quelle für die
 * App UND für die vorgerenderten Bilder (scripts/galaxy-art.mjs).
 *
 * Wie auf der Website (DreamRushes-Landingpage, GalaxyClosing.astro):
 * gleiche Formeln, gleiche Startwerte, in deren Einheiten (Bühne 1440 × 850).
 *
 * ⚠ Wer hier etwas ändert, rendert danach die Bilder neu:
 *     node scripts/galaxy-art.mjs
 * Sonst zeigt die App die alte Spirale. */

export const rand = (n: number) => { const x = Math.sin(n * 127.1) * 43758.5453; return x - Math.floor(x); };
export const point = (r: number, arm: number, offset = 0) => {
  const th = arm * Math.PI * 2 / 3 + Math.pow(1 - r / 650, 1.2) * 5.8 + offset;
  return [Math.cos(th) * r, Math.sin(th) * r] as const;
};

/* Drei Arme aus je 18 feinen Fäden. */
export const FILAMENTS = Array.from({ length: 54 }, (_, i) => {
  const arm = Math.floor(i / 18), offset = ((i % 18) - 8.5) * 0.026;
  let d = "";
  for (let j = 0; j < 80; j++) {
    const [x, y] = point(30 + j * 7.45, arm, offset);
    d += `${j ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)} `;
  }
  return { d, o: 0.2 + rand(i + 71) * 0.48 };
});

/* 180 Sterne auf den Armen. */
export const ARM_STARS = Array.from({ length: 180 }, (_, i) => {
  const [x, y] = point(40 + rand(i + 20) * 545, i % 3, (rand(i + 411) - 0.5) * 0.54);
  return { x, y, r: 0.65 + rand(i + 51) * 1.55, o: 0.3 + rand(i + 151) * 0.65 };
});

/* 48 stille Hintergrundsterne über die ganze Bühne. */
export const SKY_STARS = Array.from({ length: 48 }, (_, i) => ({
  x: rand(i + 710) * 1440, y: rand(i + 1100) * 850, r: i % 7 === 0 ? 1.5 : 0.8, o: 0.1 + rand(i + 931) * 0.35,
}));

/* Hineinfallende Teilchen (Antons Wunsch 09.10., wie früher im Portal):
   drei Felder in der Ebene der Scheibe, jedes fällt in ~10 s spiralig vom
   Rand in den Kern — versetzt, so fällt immer etwas. */
export const INFALL = [0, 1, 2].map((k) => Array.from({ length: 34 }, (_, i) => {
  const n = k * 100 + i;
  const a = rand(n + 3001) * Math.PI * 2, r = 260 + rand(n + 3301) * 380;
  return { x: Math.cos(a) * r, y: Math.sin(a) * r, r: 2 + rand(n + 3601) * 2.4, o: 0.65 + rand(n + 3901) * 0.35, warm: rand(n + 4201) < 0.25 };
}));

/* Bühne der Website und Mitte der Scheibe darin. */
export const STAGE_W = 1440, STAGE_H = 850, GX = 720, GY = 430;
export const DISK = 1300;      // Kasten der drehenden Ebene (Fäden reichen bis r ≈ 619)
export const CORE = 390;       // Kern r = 195

/* Die drei stillen Zeichnungen als SVG-Text, in Website-Einheiten — Vorlage
   der Bilder in assets/galaxy (scripts/galaxy-art.mjs rendert sie). */
const stops = (list: [number, string, number][]) =>
  list.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`).join("");

export function haloSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${STAGE_W}" height="${STAGE_H}" viewBox="0 0 ${STAGE_W} ${STAGE_H}">`
    + `<defs><radialGradient id="h" cx="50%" cy="50%" r="50%">${stops([[0, "#9774ea", 0.35], [0.42, "#694dc9", 0.17], [1, "#47398c", 0]])}</radialGradient></defs>`
    + `<ellipse cx="720" cy="425" rx="660" ry="395" fill="url(#h)"/></svg>`;
}

/* Die Scheibe: ein weicher Verlauf — eigenes, kleines Bild (hochskaliert
   sieht man keinen Unterschied; zusammen mit den Fäden wäre das Bild 6 MB). */
export function diskSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${DISK}" height="${DISK}" viewBox="${-DISK / 2} ${-DISK / 2} ${DISK} ${DISK}">`
    + `<defs><radialGradient id="d" cx="0" cy="0" r="620" gradientUnits="userSpaceOnUse">${stops([[0, "#7b76e9", 0.17], [0.8, "#5b4ba0", 0.06], [1, "#4a3c80", 0]])}</radialGradient></defs>`
    + `<circle r="620" fill="url(#d)"/></svg>`;
}

/* Die Arme: Fäden und Sterne. */
export function spiralSvg() {
  const thread = stops([[0, "#dfcaff", 1], [0.2, "#b993f4", 1], [0.58, "#8a68e3", 1], [0.84, "#6989dc", 0.6], [1, "#6989dc", 0]]);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${DISK}" height="${DISK}" viewBox="${-DISK / 2} ${-DISK / 2} ${DISK} ${DISK}">`
    + `<defs><radialGradient id="t" cx="0" cy="0" r="650" gradientUnits="userSpaceOnUse">${thread}</radialGradient></defs>`
    // jeder sechste Faden zusätzlich breit und kaum sichtbar — weiches Licht ohne Unschärfe-Filter
    + FILAMENTS.filter((_, i) => i % 6 === 0).map((f) => `<path d="${f.d}" fill="none" stroke="url(#t)" stroke-opacity="0.045" stroke-width="22"/>`).join("")
    + FILAMENTS.map((f) => `<path d="${f.d}" fill="none" stroke="url(#t)" stroke-opacity="${f.o}" stroke-width="1.5"/>`).join("")
    + ARM_STARS.map((s) => `<circle cx="${s.x}" cy="${s.y}" r="${s.r}" fill="#d0d3ff" fill-opacity="${s.o}"/>`).join("")
    + `</svg>`;
}

export function coreSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CORE}" height="${CORE}" viewBox="${-CORE / 2} ${-CORE / 2} ${CORE} ${CORE}">`
    + `<defs><radialGradient id="c" cx="0" cy="0" r="195" gradientUnits="userSpaceOnUse">${stops([[0, "#e3d7ff", 0.9], [0.09, "#c3adf6", 0.65], [0.3, "#9172dc", 0.26], [1, "#756be2", 0]])}</radialGradient></defs>`
    + `<circle r="195" fill="url(#c)"/></svg>`;
}
