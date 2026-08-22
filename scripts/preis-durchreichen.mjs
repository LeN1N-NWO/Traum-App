/* Die Rechnung hinter docs/plans/2026-08-22-preislinie-durchreichen.md.
 *
 * Warum als Skript und nicht als Tabelle im Plan: Eine Tabelle veraltet
 * still. Ändert jemand `creditsPerSecond` in video.js oder einen Preis in
 * plans.js, rechnet dieses Skript beim nächsten Lauf das Neue — die
 * Tabelle im Plan behauptete weiter das Alte.
 *
 * VERKAUFSSEITE wird importiert (video.js, plans.js) und kann deshalb
 * nicht driften. EINKAUFSSEITE steht unten als Konstante, weil sie im
 * Code nur in Kommentaren lebt: die Preise stehen bei fal.ai, nicht bei
 * uns. ⚠ Wer sie ändert, muss die Quelle danebenschreiben.
 *
 *   node scripts/preis-durchreichen.mjs
 */
import { VIDEO_MODELS, videoModel, priceForFilm } from "../src/lib/video.js";
import { SUBSCRIPTIONS, PACKS } from "../src/lib/plans.js";

const VAT = 1.19;                 // Deutschland, aus dem Schildpreis heraus
const BILD_EINKAUF = 0.042;       // google/nano-banana-2-lite, 1K (fal, 19.08.2026)

/* Einkauf je Sekunde, nach Modell-Id — Quellen in den Kommentaren von
   video.js, dort jeweils mit Datum belegt. */
const EINKAUF_PRO_SEKUNDE = {
  standard: 0.06,      // minimax/h3/reference-to-video @768P
  director: 0.2419,    // bytedance/seedance-2.0/fast/reference-to-video
  premium: 0.473,      // bytedance/seedance-2.5/reference-to-video
};

const num = (preis) => Number(String(preis).replace(/[^0-9.]/g, ""));
const netto = (brutto, store) => (brutto / VAT) * (1 - store);
const brutto = (netto, store) => (netto / (1 - store)) * VAT;

/* Bruttopreis je Credit — für Abos über die volle Laufzeit gerechnet,
   damit Woche, Monat und Jahr auf derselben Grundlage stehen. */
const PLAENE = [
  ...SUBSCRIPTIONS.map((p) => ({
    id: `${p.id.padEnd(8)} ${p.price} / ${p.credits}`,
    proCredit: p.period === "year" ? num(p.price) / (12 * p.credits) : num(p.price) / p.credits,
  })),
  ...PACKS.map((p) => ({
    id: `${p.id.padEnd(8)} ${p.price} / ${p.credits}`,
    proCredit: num(p.price) / p.credits,
  })),
];

const PRODUKTE = [
  { name: "Bild", einkauf: BILD_EINKAUF, credits: 1 },
  ...VIDEO_MODELS.map((m) => ({
    name: m.id,
    einkauf: EINKAUF_PRO_SEKUNDE[m.id],
    credits: m.creditsPerSecond,
  })),
];

const f = (n, d = 4) => n.toFixed(d).padStart(d + 3);

// ── 1. Was ein Credit uns kostet, je nach Verwendung ────────────────────
console.log("\n=== 1. Einkauf je Credit, nach Verwendung ===\n");
console.log("Produkt      Einkauf   Credits   $/Credit   ggü. Bild");
for (const p of PRODUKTE) {
  const proCredit = p.einkauf / p.credits;
  const ggü = (proCredit / BILD_EINKAUF - 1) * 100;
  console.log(
    `${p.name.padEnd(12)} ${f(p.einkauf)}   ${String(p.credits).padStart(4)}   ${f(proCredit)}   ` +
    (p.name === "Bild" ? "—" : `+${ggü.toFixed(0)} %`)
  );
}

// ── 2. Deckungsbeitrag je Credit ────────────────────────────────────────
for (const store of [0.15, 0.30]) {
  console.log(`\n=== 2. Deckungsbeitrag je Credit — Store ${store * 100} %, MwSt. 19 % ===\n`);
  console.log("Plan".padEnd(24) + "netto/Cr" + PRODUKTE.map((p) => p.name.padStart(12)).join(""));
  for (const pl of PLAENE) {
    const n = netto(pl.proCredit, store);
    const zellen = PRODUKTE.map((p) => {
      const kosten = p.einkauf / p.credits;
      return `${(n - kosten >= 0 ? "+" : "")}${(n - kosten).toFixed(3)}/${(n / kosten).toFixed(1)}×`.padStart(12);
    });
    console.log(pl.id.padEnd(24) + f(n) + zellen.join(""));
  }
}

// ── 3. Ganze Filme, wie die App sie verkauft ────────────────────────────
console.log("\n=== 3. Ein ganzer Film (Voreinstellung der Stufe, mit Keyframe) ===\n");
console.log("Stufe        Sek   Credits   Einkauf   Kunde zahlt (Monatsabo)   Aufschlag netto");
const monat = PLAENE.find((p) => p.id.startsWith("monthly"));
for (const m of VIDEO_MODELS) {
  const sek = m.preset;
  const cr = priceForFilm(m.id, sek);
  const einkauf = sek * EINKAUF_PRO_SEKUNDE[m.id] + BILD_EINKAUF;
  const kunde = cr * monat.proCredit;
  const uns = cr * netto(monat.proCredit, 0.15);
  console.log(
    `${m.id.padEnd(12)} ${String(sek).padStart(3)}   ${String(cr).padStart(7)}   ${f(einkauf, 3)}   ` +
    `$${kunde.toFixed(2).padStart(6)}                  ${(uns / einkauf).toFixed(1)}×`
  );
}

// ── 4. Durchreichen: derselbe Aufschlag auf jedes Produkt ───────────────
console.log("\n=== 4. Durchreichen — einheitlicher Aufschlag statt Quersubvention ===\n");
const KORB = [
  { name: "1 Bild", einkauf: BILD_EINKAUF, credits: 1 },
  ...VIDEO_MODELS.map((m) => ({
    name: `${m.id} ${m.preset} s`,
    einkauf: m.preset * EINKAUF_PRO_SEKUNDE[m.id] + BILD_EINKAUF,
    credits: priceForFilm(m.id, m.preset),
  })),
];
const summe = KORB.reduce(
  (a, p) => ({
    einkauf: a.einkauf + p.einkauf,
    netto: a.netto + p.credits * netto(monat.proCredit, 0.15),
  }),
  { einkauf: 0, netto: 0 }
);
const SCHNITT = summe.netto / summe.einkauf;
console.log(`Aufschlag über den ganzen Korb heute: ${SCHNITT.toFixed(2)}×\n`);
console.log("Produkt              heute →  einheitlich   Änderung      in Credits: heute → ehrlich");
for (const p of KORB) {
  const heute = p.credits * monat.proCredit;
  const fair = brutto(p.einkauf * SCHNITT, 0.15);
  const ehrlich = p.einkauf / BILD_EINKAUF;
  console.log(
    `${p.name.padEnd(20)} $${heute.toFixed(2).padStart(6)} → $${fair.toFixed(2).padStart(6)}   ` +
    `${(fair / heute - 1 >= 0 ? "+" : "")}${((fair / heute - 1) * 100).toFixed(0).padStart(3)} %` +
    `        ${String(p.credits).padStart(3)} → ${ehrlich.toFixed(0).padStart(3)} Cr`
  );
}

// ── 5. Kaufbarkeit ──────────────────────────────────────────────────────
console.log("\n=== 5. Kaufbarkeit: reicht ein einzelner Kauf für einen Film? ===\n");
const grösster = Math.max(...[...SUBSCRIPTIONS, ...PACKS].map((p) => p.credits));
for (const m of VIDEO_MODELS) {
  const max = priceForFilm(m.id, m.max);
  console.log(
    `${m.id.padEnd(12)} längster Film (${String(m.max).padStart(2)} s) = ${String(max).padStart(3)} Cr   ` +
    `bester Einzelkauf ${grösster} Cr   ${max > grösster ? "⚠ NICHT in einem Kauf erreichbar" : "ok"}`
  );
}
console.log();

/* ── 6. Was ein einzelner Film wirklich kosten muss (Nachtrag 22.08.)
 *
 * Antons Auflage: „Auf jeden Fall die 15 % von Apple berücksichtigen."
 * Sie stehen oben schon in Abschnitt 2 — aber die Frage dahinter ist
 * größer als eine Prozentzahl: **15 % gibt es nur im Small Business
 * Program** (bis 1 Mio. $ Auszahlung im Jahr). Wer Erfolg hat, zahlt 30 %.
 * Eine Preisliste, die nur bei 15 % trägt, bestraft also das Wachstum.
 * Deshalb rechnet dieser Abschnitt JEDEN Film in beiden Welten.
 *
 * Und er beantwortet die Frage, an der Weg B im Plan hängengeblieben ist:
 * Nicht „wie viele Credits kostet ein Kino-Film", sondern „was müsste ein
 * Mensch bezahlen, um ihn EINMAL kaufen zu können". Das ist die Zahl, die
 * über ein Großpaket entscheidet — und sie hängt nicht an der Stückelung
 * des Credits, sondern am Einkauf. */
console.log("\n=== 6. Ein einzelner Film als Einzelkauf — was er kosten MUSS ===\n");

const AUFSCHLAG = 2.21;   // heutiger Korb-Aufschlag, siehe Abschnitt 4
console.log(`Aufschlag ${AUFSCHLAG}× · Preis inkl. MwSt., je Store-Anteil\n`);
console.log("Stufe        Sek   Einkauf   nötig @15 %   nötig @30 %   größtes Paket heute");

const groesstesPaket = PACKS.reduce((a, b) => (num(a.price) > num(b.price) ? a : b));
for (const m of VIDEO_MODELS) {
  for (const secs of [m.preset, m.max]) {
    const einkauf = secs * EINKAUF_PRO_SEKUNDE[m.id] + BILD_EINKAUF;   // + Keyframe
    const noetig15 = brutto(einkauf * AUFSCHLAG, 0.15);
    const noetig30 = brutto(einkauf * AUFSCHLAG, 0.30);
    console.log(
      `${m.id.padEnd(10)} ${String(secs).padStart(4)}   ${einkauf.toFixed(3).padStart(7)}   ` +
      `${("$" + noetig15.toFixed(2)).padStart(11)}   ${("$" + noetig30.toFixed(2)).padStart(11)}   ` +
      `${groesstesPaket.price}`,
    );
    if (secs === m.max && m.preset === m.max) break;
  }
}

console.log(
  "\nLesart: Solange die nötige Summe über dem größten Paket liegt, ist die\n" +
  "Stufe in voller Länge nicht in EINEM Kauf erreichbar — egal, wie der\n" +
  "Credit gestückelt wird. Umstückeln verschiebt nur die Zahl auf dem\n" +
  "Knopf, nicht den Einkauf dahinter.",
);
