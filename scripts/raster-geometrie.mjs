/* Welches Rasterformat trägt vier, fünf oder sechs 9:16-Kacheln —
 * und was kostet eine Szene darin?
 *
 * Der Kern in einem Satz: EIN Behälter im Seitenverhältnis
 * (Spalten × 9) : (Zeilen × 16) zerfällt in lauter exakte 9:16-Kacheln.
 * Für 2×2 heißt das 9:16 — dasselbe Verhältnis wie eine einzelne Kachel,
 * weil Halbieren beider Seiten das Verhältnis nicht ändert.
 *
 * ⚠ Zwei Modelle, zwei Freiheiten:
 *   · Seedream nimmt PIXELMASSE (`image_size`) → jede Geometrie möglich.
 *   · Nano Banana nimmt nur `aspect_ratio` aus einer festen Liste →
 *     krumme Raster gehen nur, indem man in einem Standardformat rendert
 *     und die Kacheln daraus schneidet (mit Verschnitt).
 *
 *   node scripts/raster-geometrie.mjs
 */

const KACHEL = 9 / 16;            // Zielverhältnis einer Szene (Hochkant)

/* Was die Modelle liefern. Preise vom 23.08.2026, Quellen im Plan
   docs/plans/2026-08-23-raster-test.md. ⚠ Nicht selbst gemessen. */
const MODELLE = [
  { id: "seedream-5-lite", label: "Seedream 5 Lite", usd: 0.035, langeSeite: 3072,
    pixelmasse: true, hinweis: "flach bis 3K — Auflösung ist gratis" },
  { id: "seedream-5-pro", label: "Seedream 5 Pro", usd: 0.135, langeSeite: 2731,
    pixelmasse: true, hinweis: "nach FLÄCHE: $0,0675 bis 1536², $0,135 bis 2048²" },
  { id: "nano-banana-pro-2k", label: "Nano Banana Pro 2K", usd: 0.15, langeSeite: 2048,
    pixelmasse: false, hinweis: "nur feste Seitenverhältnisse" },
  { id: "nano-banana-pro-4k", label: "Nano Banana Pro 4K", usd: 0.30, langeSeite: 3840,
    pixelmasse: false, hinweis: "nur feste Seitenverhältnisse" },
];

const RASTER = [
  { spalten: 1, zeilen: 1, name: "einzeln" },
  { spalten: 2, zeilen: 2, name: "2×2" },
  { spalten: 3, zeilen: 2, name: "3×2" },
  { spalten: 2, zeilen: 3, name: "2×3" },
  { spalten: 5, zeilen: 1, name: "5 nebeneinander" },
];

const kuerzen = (a, b) => { const t = (x, y) => (y ? t(y, x % y) : x); const g = t(a, b); return `${a / g}:${b / g}`; };

console.log("\n=== 1. Welches Behälterformat ein Raster braucht ===\n");
console.log("Raster              Plätze   Behälter-Verhältnis   als Dezimalzahl");
for (const r of RASTER) {
  const w = r.spalten * 9, h = r.zeilen * 16;
  console.log(
    `${r.name.padEnd(20)}${String(r.spalten * r.zeilen).padStart(4)}     ` +
    `${kuerzen(w, h).padStart(8)}              ${(w / h).toFixed(3)}`
  );
}
console.log(
  "\n⚠ 2×2 ergibt 9:16 — dasselbe Format wie die App. Das ist der einzige\n" +
  "  Fall, der OHNE Sonderformat auskommt: jedes Modell kann 9:16."
);

console.log("\n=== 2. Kachelgröße und Preis je Szene ===\n");
console.log("Modell               Raster    Behälter        Kachel        $/Bild   $/Szene");
for (const m of MODELLE) {
  for (const r of RASTER) {
    if (!m.pixelmasse && !(r.spalten === r.zeilen)) continue;   // NB kann nur 9:16 (2×2) und 1:1
    const plaetze = r.spalten * r.zeilen;
    const verh = (r.spalten * 9) / (r.zeilen * 16);
    // Die lange Seite des Behälters ist das Limit des Modells.
    const [bw, bh] = verh >= 1
      ? [m.langeSeite, Math.round(m.langeSeite / verh)]
      : [Math.round(m.langeSeite * verh), m.langeSeite];
    const kw = Math.floor(bw / r.spalten), kh = Math.floor(bh / r.zeilen);
    console.log(
      `${m.label.padEnd(21)}${r.name.padEnd(17)}${`${bw}×${bh}`.padEnd(16)}` +
      `${`${kw}×${kh}`.padEnd(14)}$${m.usd.toFixed(3)}   $${(m.usd / plaetze).toFixed(4)}`
    );
  }
}

console.log("\n=== 3. Fünf Szenen — was jeder Weg kostet ===\n");
const HEUTE = { label: "Seedream 5 Lite einzeln (heute)", usd: 0.035, kachel: "1440×2560" };
console.log(`Heute: 5 × $${HEUTE.usd.toFixed(3)} = $${(5 * HEUTE.usd).toFixed(3)}   Kachel ${HEUTE.kachel}\n`);
console.log("Weg                                        Aufrufe   Kosten    Kachel        Ersparnis");
const WEGE = [
  { name: "Lite, 3×2 (6 Plätze, 1 frei)", modell: "seedream-5-lite", spalten: 3, zeilen: 2, aufrufe: 1 },
  { name: "Lite, 2×2 + 1 einzeln", modell: "seedream-5-lite", spalten: 2, zeilen: 2, aufrufe: 2 },
  { name: "NB Pro 4K, 2×2 + 1 einzeln", modell: "nano-banana-pro-4k", spalten: 2, zeilen: 2, aufrufe: 2 },
  { name: "NB Pro 4K, einzeln", modell: "nano-banana-pro-4k", spalten: 1, zeilen: 1, aufrufe: 5 },
];
for (const w of WEGE) {
  const m = MODELLE.find((x) => x.id === w.modell);
  const verh = (w.spalten * 9) / (w.zeilen * 16);
  const [bw, bh] = verh >= 1
    ? [m.langeSeite, Math.round(m.langeSeite / verh)]
    : [Math.round(m.langeSeite * verh), m.langeSeite];
  const kachel = `${Math.floor(bw / w.spalten)}×${Math.floor(bh / w.zeilen)}`;
  const kosten = w.aufrufe * m.usd;
  const spar = (1 - kosten / (5 * HEUTE.usd)) * 100;
  console.log(
    `${w.name.padEnd(42)}${String(w.aufrufe).padStart(5)}   $${kosten.toFixed(3)}   ` +
    `${kachel.padEnd(13)} ${spar >= 0 ? "−" : "+"}${Math.abs(spar).toFixed(0)} %`
  );
}
console.log(
  "\n⚠ Die Kachel ist IMMER die halbe (bzw. gedrittelte) Behälterseite.\n" +
  "  Um die heutigen 1440×2560 je Szene im Raster zu halten, bräuchte der\n" +
  "  Behälter 2880×5120 = 14,7 MP — mehr, als eines der Modelle ausgibt.\n" +
  "  Das Raster kauft den Preis mit Auflösung. Die Frage ist nur, ob die\n" +
  "  Kachel für ein Telefon reicht (iPhone: ~1179 px breit)."
);
console.log();
