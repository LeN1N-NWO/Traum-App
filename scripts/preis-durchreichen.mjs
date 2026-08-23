/* Die Rechnung hinter docs/plans/2026-08-22-preislinie-durchreichen.md.
 *
 * Warum als Skript und nicht als Tabelle im Plan: Eine Tabelle veraltet
 * still. Ändert jemand `creditsPerSecond` in video.js oder einen Preis in
 * plans.js, rechnet dieses Skript beim nächsten Lauf das Neue — die
 * Tabelle im Plan behauptete weiter das Alte.
 *
 * VERKAUFSSEITE wird importiert (video.js, plans.js) und kann deshalb
 * nicht driften. Beim BILD gilt das seit dem 23.08. auch für den Einkauf
 * (imageModel.js trägt ihn). Nur die Sekundenpreise der Filmmodelle stehen
 * noch als Konstante hier, weil sie im Code nirgends leben — sie stehen
 * bei fal.ai. ⚠ Wer sie ändert, muss die Quelle danebenschreiben.
 *
 *   node scripts/preis-durchreichen.mjs
 */
import { VIDEO_MODELS, videoModel, priceForFilm } from "../src/lib/video.js";
import { SUBSCRIPTIONS, PACKS } from "../src/lib/plans.js";
import { imageModel, DEFAULT_IMAGE_MODEL } from "../src/lib/imageModel.js";

const VAT = 1.19;                 // Deutschland, aus dem Schildpreis heraus

/* ⚠ Der Bildpreis wird IMPORTIERT, nicht abgeschrieben (seit 23.08.).
   Er stand hier als Konstante $0,042 und war nach EINEM Tag falsch: Am
   23.08. wurde Seedream 5 Lite ($0,035) das Bildmodell, und die ganze
   Rechnung darunter behauptete weiter den alten Wert. Genau davor warnt
   der Dateikopf — und genau das ist trotzdem passiert. Jetzt kann es
   nicht mehr: `imageModel.js` trägt den Preis, dieses Skript liest ihn. */
const BILD = imageModel(DEFAULT_IMAGE_MODEL);
const BILD_EINKAUF = BILD.usd;

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
  { name: BILD.label, einkauf: BILD_EINKAUF, credits: 1 },
  ...VIDEO_MODELS.map((m) => ({
    name: m.id,
    einkauf: EINKAUF_PRO_SEKUNDE[m.id],
    credits: m.creditsPerSecond,
  })),
];

const f = (n, d = 4) => n.toFixed(d).padStart(d + 3);

// ── 1. Was ein Credit uns kostet, je nach Verwendung ────────────────────
console.log("\n=== 1. Einkauf je Credit, nach Verwendung ===\n");
console.log("Produkt".padEnd(18) + "Einkauf   Credits   $/Credit   ggü. Bild");
for (const p of PRODUKTE) {
  const proCredit = p.einkauf / p.credits;
  const ggü = (proCredit / BILD_EINKAUF - 1) * 100;
  console.log(
    `${p.name.padEnd(18)}${f(p.einkauf)}   ${String(p.credits).padStart(4)}   ${f(proCredit)}   ` +
    (p.name === BILD.label ? "—" : `+${ggü.toFixed(0)} %`)
  );
}

// ── 2. Deckungsbeitrag je Credit ────────────────────────────────────────
for (const store of [0.15, 0.30]) {
  console.log(`\n=== 2. Deckungsbeitrag je Credit — Store ${store * 100} %, MwSt. 19 % ===\n`);
  console.log("Plan".padEnd(24) + "netto/Cr" + PRODUKTE.map((p) => p.name.slice(0, 12).padStart(13)).join(""));
  for (const pl of PLAENE) {
    const n = netto(pl.proCredit, store);
    const zellen = PRODUKTE.map((p) => {
      const kosten = p.einkauf / p.credits;
      return `${(n - kosten >= 0 ? "+" : "")}${(n - kosten).toFixed(3)}/${(n / kosten).toFixed(1)}×`.padStart(13);
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

const AUFSCHLAG = SCHNITT;   // aus Abschnitt 4 — NIE abschreiben, sonst driftet er
console.log(`Aufschlag ${AUFSCHLAG.toFixed(2)}× · Preis inkl. MwSt., je Store-Anteil\n`);
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

/* ── 7. Die Rabattleiter (Nachtrag 23.08., Antons Frage)
 *
 * „Der Monatsrabatt war zu groß im Vergleich zum Jahresrabatt."
 *
 * Der Verdacht ist prüfbar: Ein Abo-Treppchen soll für jede zusätzliche
 * Bindung einen spürbaren Schritt bezahlen. Ist der erste Schritt (Woche →
 * Monat) fast der ganze Rabatt, hat der Jahresplan nichts mehr anzubieten
 * außer zwölf Monaten Vorkasse — und wer rechnen kann, bleibt beim Monat.
 *
 * Gemessen wird der Preis JE CREDIT über die volle Laufzeit, weil nur das
 * beide Seiten vergleichbar macht. */
console.log("\n=== 7. Die Rabattleiter — was jede Bindungsstufe wirklich bringt ===\n");

const leiter = SUBSCRIPTIONS.map((p) => ({
  id: p.id,
  preis: p.price,
  credits: p.credits,
  proCredit: p.period === "year" ? num(p.price) / (12 * p.credits) : num(p.price) / p.credits,
}));
const woche = leiter[0];

console.log("Plan       Preis     Cr   $/Credit   ggü. Woche   Schritt zur Stufe davor");
let vorher = null;
for (const p of leiter) {
  const ggüWoche = (1 - p.proCredit / woche.proCredit) * 100;
  const schritt = vorher ? (1 - p.proCredit / vorher.proCredit) * 100 : 0;
  console.log(
    `${p.id.padEnd(10)} ${p.preis.padEnd(8)} ${String(p.credits).padStart(3)}   ` +
    `${p.proCredit.toFixed(4)}     ${ggüWoche.toFixed(0).padStart(3)} %        ` +
    (vorher ? `${schritt.toFixed(0)} %` : "—")
  );
  vorher = p;
}

const gesamt = (1 - leiter[2].proCredit / woche.proCredit) * 100;
const ersterSchritt = (1 - leiter[1].proCredit / woche.proCredit) * 100;
console.log(
  `\nVom gesamten Rabatt (${gesamt.toFixed(0)} %) liegen ${(ersterSchritt / gesamt * 100).toFixed(0)} % ` +
  `schon im MONAT.\nDas Jahr — zwölf Monate Bindung, Vorkasse — holt nur den Rest.`
);

/* Gegenrechnung: Was müsste der Monat kosten, damit das Jahr einen
   Schritt von X Prozent behält? Die Größe, die verschoben wird, ist der
   Monatspreis; Woche und Jahr bleiben, wo sie sind. */
console.log("\nWas ein flacherer Monatsrabatt bedeuten würde (Woche und Jahr fest):\n");
console.log("Ziel-Schritt Monat→Jahr   nötiger Monatspreis bei 45 Cr   Monat ggü. Woche");
for (const ziel of [0.35, 0.40, 0.45, 0.50]) {
  const proCreditMonat = leiter[2].proCredit / (1 - ziel);
  const preis = proCreditMonat * 45;
  console.log(
    `${(ziel * 100).toFixed(0).padStart(13)} %            ` +
    `$${preis.toFixed(2).padStart(6)}                       ` +
    `${((1 - proCreditMonat / woche.proCredit) * 100).toFixed(0).padStart(3)} %`
  );
}
console.log(
  "\n⚠ Die andere Schraube ist die Credit-Zahl, nicht der Preis: 40 statt 45\n" +
  "   Credits im Monat verschieben dasselbe, ohne dass die $9,99 fallen —\n" +
  "   und $9,99 ist der Preispunkt, der in jedem Store funktioniert."
);
console.log();

/* Die Gegenrichtung, und sie ist die bessere: Statt den Monat zu
   verteuern, das JAHR großzügiger machen. Dasselbe Verhältnis, aber für
   niemanden ein schlechteres Angebot — bezahlt aus dem, was auf der
   Einkaufsseite gespart wurde. Antons Linie ist „günstiger anbieten",
   nicht „Rabatt zurücknehmen". */
console.log("=== 7b. Dasselbe Verhältnis, ohne jemanden zu verteuern ===\n");
console.log("Jahr behält $79,99, bekommt aber mehr Credits je Monat:\n");
console.log("Cr/Monat im Jahr   $/Credit   Schritt Monat→Jahr   ggü. Woche   Einkauf/Monat*");
const monatProCredit = leiter[1].proCredit;
for (const cr of [45, 50, 55, 60, 65]) {
  const proCredit = num(leiter[2].preis) / (12 * cr);
  const schritt = (1 - proCredit / monatProCredit) * 100;
  const ggüWoche = (1 - proCredit / woche.proCredit) * 100;
  // Was uns die Credits im schlimmsten Fall kosten (alles in Kino-Sekunden)
  const teuerster = Math.max(...PRODUKTE.map((p) => p.einkauf / p.credits));
  console.log(
    `${String(cr).padStart(12)}       ${proCredit.toFixed(4)}         ` +
    `${schritt.toFixed(0).padStart(3)} %             ${ggüWoche.toFixed(0).padStart(3)} %      ` +
    `$${(cr * teuerster).toFixed(2)}`
  );
}
const nettoJahr15 = netto(num(leiter[2].preis) / 12, 0.15);
const nettoJahr30 = netto(num(leiter[2].preis) / 12, 0.30);
console.log(
  "\n* schlimmster Fall: jeder Credit geht in Kino-Sekunden.\n" +
  `  Netto je Monat: $${nettoJahr15.toFixed(2)} bei 15 % Store-Anteil, ` +
  `$${nettoJahr30.toFixed(2)} bei 30 %.\n` +
  "  ⚠ Die Spalte darf BEIDE Zahlen nicht überschreiten, sonst zahlt der\n" +
  "  Jahresplan im schlimmsten Fall drauf. Bei 30 % ist schon 50 Cr/Monat\n" +
  "  die Grenze — Wachstum kostet den Spielraum, nicht der Kunde."
);
console.log();
