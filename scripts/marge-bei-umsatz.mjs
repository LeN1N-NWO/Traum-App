#!/usr/bin/env bun
/* Was bei 10.000 € App-Umsatz übrig bleibt (Antons Frage, 22.08.2026).
 *
 * Warum als Skript: Dieselbe Begründung wie bei preis-durchreichen.mjs —
 * eine Tabelle im Dokument veraltet still. Hier werden Abo- und Paketpreise
 * aus plans.js importiert; ändert sie jemand, rechnet der nächste Lauf das
 * Neue.
 *
 * ⚠ ANNAHMEN, die keine Zahlen sind, sondern Entscheidungen — wer sie nicht
 * teilt, bekommt ein anderes Ergebnis:
 *
 * 1. „Umsatz" = was die Menschen bezahlen, brutto, inklusive Mehrwertsteuer.
 *    Das ist die Zahl, die im App-Store-Bericht steht.
 * 2. Deutschland, 19 % MwSt. Apple/Google führen sie ab; sie war nie unser
 *    Geld.
 * 3. Store-Anteil 15 % (Small Business Program, bis 1 Mio. $ Auszahlung im
 *    Jahr) — und zur Gegenprobe 30 %, weil das der Erfolgsfall ist.
 * 4. Preisstufen: $9,99 ≈ 9,99 €. Apple setzt Regionalpreise auf derselben
 *    Stufe, das ist realistisch.
 * 5. Einkauf in Dollar, umgerechnet mit dem Kurs unten. ⚠ Ein Kurs ist eine
 *    Momentaufnahme; er steht deshalb als benannte Konstante hier oben und
 *    nicht versteckt in einer Formel.
 * 6. Die verkauften Credits werden VOLLSTÄNDIG eingelöst. Das ist der
 *    ungünstigste Fall — nicht eingelöste Credits sind reine Marge.
 *
 *   bun scripts/marge-bei-umsatz.mjs
 */
import { SUBSCRIPTIONS, PACKS } from "../src/lib/plans.js";

const UMSATZ = 10_000;        // € brutto
const MWST = 1.19;
const USD_JE_EUR = 1.08;      // Kurs-Annahme, siehe Kopf

/* Einkauf je Credit, je nachdem wofür er ausgegeben wird (fal.ai, 19.08.).
   Quelle: video.js/Kommentare und preis-durchreichen.mjs. */
const EINKAUF_USD = { bild: 0.042, lebendig: 0.060, regie: 0.0605, kino: 0.0788 };
const eur = (usd) => usd / USD_JE_EUR;

const num = (p) => Number(String(p).replace(/[^0-9.]/g, ""));

/* Credits je Euro Bruttoumsatz — je nachdem, was gekauft wird. Das ist der
   Hebel, der über alles entscheidet: Ein Jahresabo liefert für denselben
   Euro fast dreimal so viele Credits wie ein kleines Paket. */
const PRODUKTE = [
  ...SUBSCRIPTIONS.map((p) => ({
    name: `${p.id} ${p.price}`,
    creditsJeEuro: (p.period === "year" ? 12 * p.credits : p.credits) / num(p.price),
  })),
  ...PACKS.map((p) => ({ name: `${p.id} ${p.price}`, creditsJeEuro: p.credits / num(p.price) })),
];

function rechne(store, creditsJeEuro, einkaufUsdJeCredit) {
  const netto = UMSATZ / MWST;              // MwSt. raus
  const nachStore = netto * (1 - store);    // Apple/Google raus
  const credits = UMSATZ * creditsJeEuro;
  const einkauf = eur(credits * einkaufUsdJeCredit);
  return { netto, nachStore, credits, einkauf, marge: nachStore - einkauf };
}

console.log(`\n=== Was bei ${UMSATZ.toLocaleString("de-DE")} € Bruttoumsatz bleibt ===\n`);
console.log(`MwSt. ${((MWST - 1) * 100).toFixed(0)} % · Kurs ${USD_JE_EUR} $/€ · Credits voll eingelöst\n`);

for (const store of [0.15, 0.30]) {
  console.log(`── Store-Anteil ${(store * 100).toFixed(0)} % ──`);
  const netto = UMSATZ / MWST;
  console.log(`   Brutto ${UMSATZ.toFixed(0)} € → netto ${netto.toFixed(0)} € → nach Store ${(netto * (1 - store)).toFixed(0)} €\n`);
  console.log("   Gekauft als            Credits    nur Bilder      nur Kino-Film");
  for (const p of PRODUKTE) {
    const bild = rechne(store, p.creditsJeEuro, EINKAUF_USD.bild);
    const kino = rechne(store, p.creditsJeEuro, EINKAUF_USD.kino);
    console.log(
      `   ${p.name.padEnd(20)} ${Math.round(bild.credits).toString().padStart(7)}   ` +
      `${(bild.marge.toFixed(0) + " €").padStart(8)} (${((bild.marge / UMSATZ) * 100).toFixed(0)} %)   ` +
      `${(kino.marge.toFixed(0) + " €").padStart(8)} (${((kino.marge / UMSATZ) * 100).toFixed(0)} %)`,
    );
  }
  console.log("");
}

/* Der realistische Fall: ein Korb aus allem, mit einer Nutzung, die
   irgendwo zwischen Bildern und Filmen liegt. Gewichtung bewusst grob —
   sie ist geraten, nicht gemessen, und das muss man ihr ansehen. */
const KORB = [
  { anteil: 0.55, produkt: "monthly", nutzung: 0.75 },   // 75 % Bilder, 25 % Film
  { anteil: 0.20, produkt: "yearly", nutzung: 0.75 },
  { anteil: 0.25, produkt: "pack-m", nutzung: 0.90 },
];
console.log("── Gemischter Korb (55 % Monatsabo, 20 % Jahresabo, 25 % Paket M) ──");
console.log("   Nutzung: 75–90 % der Credits in Bilder, der Rest in Kino-Filme\n");
for (const store of [0.15, 0.30]) {
  let einkauf = 0;
  for (const teil of KORB) {
    const p = PRODUKTE.find((x) => x.name.startsWith(teil.produkt));
    const credits = UMSATZ * teil.anteil * p.creditsJeEuro;
    const usd = credits * (teil.nutzung * EINKAUF_USD.bild + (1 - teil.nutzung) * EINKAUF_USD.kino);
    einkauf += eur(usd);
  }
  const nachStore = (UMSATZ / MWST) * (1 - store);
  const marge = nachStore - einkauf;
  console.log(
    `   Store ${(store * 100).toFixed(0)} %: nach Store ${nachStore.toFixed(0)} € ` +
    `− Einkauf ${einkauf.toFixed(0)} € = ${marge.toFixed(0)} € (${((marge / UMSATZ) * 100).toFixed(0)} % vom Umsatz)`,
  );
}
console.log(
  "\n⚠ Nicht enthalten: Einkommen-/Körperschaftsteuer, Entwicklerkonten\n" +
  "   (99 $ + 25 $ einmalig), DeepSeek-Textkosten (Bruchteile eines Cents\n" +
  "   je Traum), Server. Das ist die Rohmarge vor allem, was ein Betrieb\n" +
  "   sonst noch kostet.",
);
