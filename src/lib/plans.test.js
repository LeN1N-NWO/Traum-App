import { test, expect } from "bun:test";
import { SUBSCRIPTIONS, PACKS, CREDIT_COST_USD, dreamsFor } from "./plans.js";
import { priceForFilm, videoModel } from "./video.js";

const num = (price) => Number(String(price).replace(/[^0-9.]/g, ""));

/** Was ein Credit in diesem Tarif kostet, auf den Monat gerechnet. */
function perCredit(plan) {
  const price = num(plan.price);
  const monthly = plan.period === "year" ? price / 12
                : plan.period === "week" ? price * (52 / 12)
                : price;
  return monthly / plan.credits;
}

/* Die Staffelung IST das Preismodell: Bindung wird belohnt. Wenn ein
   Wochen-Abo je billiger je Credit wuerde als ein Monats-Abo, waere der Monat
   sinnlos — und das faellt beim Anpassen einzelner Zahlen niemandem auf, weil
   jede Zahl fuer sich plausibel bleibt. */
test("longer commitment is cheaper per credit, in that order", () => {
  const week = SUBSCRIPTIONS.find((p) => p.period === "week");
  const month = SUBSCRIPTIONS.find((p) => p.period === "month");
  const year = SUBSCRIPTIONS.find((p) => p.period === "year");
  expect(perCredit(week)).toBeGreaterThan(perCredit(month));
  expect(perCredit(month)).toBeGreaterThan(perCredit(year));
});

/* Diese beiden Zeilen gibt es, weil die vorige Fassung einen Fehler
   DURCHGELASSEN hat: pack-s stand bei $4,99 fuer 15 Credits gegen das
   Wochen-Abo mit $4,99 fuer 12. Gleiches Geld, mehr Credits, und sie
   verfallen nie — das Abo war strikt das schlechtere Angebot.

   Der alte Test sah es nicht, weil er den Abopreis auf den Monat hochrechnete
   und dann je Credit verglich. Ueber ein Jahr gewinnt das Wochen-Abo damit
   haushoch. Nur vergleicht so niemand: Im Kaufmoment steht „$4,99 → 15, fuer
   immer" neben „$4,99 → 12, laeuft ab", und das entscheidet.

   Gemessen wird deshalb jetzt, was jemand im Kaufmoment SIEHT — die erste
   Periode. */
/** Was ein Credit kostet, wenn man den Tarif durchhaelt. Beim Jahresabo
 *  zaehlt `credits` PRO MONAT (perMonth), nicht pro Jahr — daran ist die
 *  erste Fassung dieses Helfers prompt gescheitert und hat $1,78 statt
 *  $0,148 gemeldet. */
function termPerCredit(plan) {
  const price = num(plan.price);
  const total = plan.perMonth ? plan.credits * 12 : plan.credits;
  return price / total;
}

test("no pack shares a price point with a subscription", () => {
  // Ein direkter Vergleich bei identischem Preis ist immer einer, den eine
  // Seite verliert.
  const subPrices = new Set(SUBSCRIPTIONS.map((p) => num(p.price)));
  for (const pack of PACKS) {
    expect(subPrices.has(num(pack.price))).toBe(false);
  }
});

test("every pack is dearer per credit than every subscription", () => {
  // Der Aufschlag fuer Unvergaenglichkeit — und der ehrliche Grund, warum es
  // Pakete gibt: nicht als besseres Geschaeft, sondern als eines ohne Bindung.
  const dearestSub = Math.max(...SUBSCRIPTIONS.map(termPerCredit));
  for (const pack of PACKS) {
    expect(termPerCredit(pack)).toBeGreaterThan(dearestSub);
  }
});

/* Die Untergrenze, unter der die korrigierte Rechnung im Kopf von plans.js
   kippt: 19 % MwSt., 15 % Store-Anteil, 75 % Verbrauch.
   
   Warum das Jahres-Abo eine NIEDRIGERE Schwelle bekommt — und das ist keine
   gelockerte Pruefung, sondern die Rechnung: Der grosse Abzug neben den
   Renderkosten sind die Gratis-Credits, und die fallen pro INSTALLATION an,
   nicht pro Monat. Verteilt ueber die Verweildauer ergibt das (1/L)·(0,24/c)
   je Abonnentenmonat. Ein Jahresabonnent bleibt gut viermal so lange wie ein
   Monatsabonnent, seine Last je Monat ist also rund ein Viertel so gross.
   Von beiden denselben Puffer zu verlangen, wuerde das Jahres-Abo kuenstlich
   teuer machen — und genau das Format bestrafen, das am wenigsten Risiko
   traegt.
   
   Diese Zeilen sind beim Neuberechnen am 16.08. tatsaechlich rot geworden
   (79,99 $ bei 45 Credits lagen bei 1,76× statt 2×), was den Unterschied
   ueberhaupt erst sichtbar gemacht hat. */
const BUFFER = { week: 2, month: 2, year: 1.6 };

test("every subscription clears its render cost with the buffer its term needs", () => {
  for (const plan of SUBSCRIPTIONS) {
    const monthlyPrice = plan.period === "year" ? num(plan.price) / 12
                       : plan.period === "week" ? num(plan.price) * (52 / 12)
                       : num(plan.price);
    const net = (monthlyPrice / 1.19) * 0.85;
    const cost = plan.credits * 0.75 * CREDIT_COST_USD;
    expect(net).toBeGreaterThan(cost * BUFFER[plan.period]);
  }
});

test("exactly one subscription is featured", () => {
  expect(SUBSCRIPTIONS.filter((p) => p.featured).length).toBe(1);
});

/* Die zwei Zahlen auf der Paywall. Der Filmpreis wird aus video.js
   BERECHNET, nicht hier wiederholt — bis zum 16.08. stand in dreamsFor
   `credits / 5`, weil ein Film einmal fuenf Credits kostete. Er kostet
   laengst sieben (sechs Sekunden plus Keyframe), und die Paywall versprach
   entsprechend zu viel. Diese Zeilen halten fest, dass die Zahl mitwandert. */
test("what a balance buys is whole, and never promises more than it can", () => {
  const perFilm = priceForFilm("standard", videoModel("standard").preset);
  for (const credits of [6, 12, 18, 45, 540]) {
    const got = dreamsFor(credits);
    expect(got.images).toBe(credits);                 // 1 Credit = 1 Bild
    expect(Number.isInteger(got.films)).toBe(true);   // keine halben Filme
    expect(got.films * perFilm).toBeLessThanOrEqual(credits);
  }
});

test("a balance too small for a film says zero, not one", () => {
  // Sonst stuende auf der Paywall eine 1, die man nicht einloesen kann.
  expect(dreamsFor(1).films).toBe(0);
});
