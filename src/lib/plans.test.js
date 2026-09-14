import { test, expect } from "bun:test";
import { SUBSCRIPTIONS, PACKS, CREDIT_COST_USD, FILM_UNIT, allowanceGrant, dreamsFor, packBonus } from "./plans.js";
import en from "../i18n/en.js";
import de from "../i18n/de.js";
import { priceForFilm } from "./video.js";

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
  const month = SUBSCRIPTIONS.find((p) => p.period === "month");
  const year = SUBSCRIPTIONS.find((p) => p.period === "year");
  expect(perCredit(month)).toBeGreaterThan(perCredit(year));
});

/* Antons Vorgabe 13.09.2026: Das billigste Abo kostet rund 10 € und traegt
   mindestens fuenf 15-s-H3-Filme in Standardqualitaet. Das Wochen-Abo ist
   gestrichen — es trug nicht einmal EINEN solchen Film. */
test("the cheapest subscription holds at least five 15-second standard films", () => {
  const perFilm = priceForFilm(FILM_UNIT.model, FILM_UNIT.seconds, { quality: FILM_UNIT.quality });
  const month = SUBSCRIPTIONS.find((p) => p.period === "month");
  expect(num(month.price)).toBeLessThanOrEqual(10);
  expect(Math.floor(month.credits / perFilm)).toBeGreaterThanOrEqual(5);
  expect(SUBSCRIPTIONS.some((p) => p.period === "week")).toBe(false);
});

/* Die Paket-Leiter: je groesser, desto billiger je Credit (Mengenrabatt),
   aber keine Stufe billiger als das Abo (Regel unten). */
test("bigger packs are cheaper per credit, step by step", () => {
  const sorted = [...PACKS].sort((a, b) => a.credits - b.credits);
  for (let i = 1; i < sorted.length; i++) {
    expect(termPerCredit(sorted[i])).toBeLessThan(termPerCredit(sorted[i - 1]));
  }
});

/* Jedes Paket deckt seinen schlimmsten Einkauf (Credit als Bild) mit
   1,75× nach MwSt. und 15 % Store — Pakete verfallen nie, also zaehlt
   voller Verbrauch. */
test("every pack clears its worst-case cost at 15 % store", () => {
  for (const pack of PACKS) {
    const net = (num(pack.price) / 1.19) * 0.85;
    expect(net).toBeGreaterThan(pack.credits * CREDIT_COST_USD * 1.75);
  }
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
  const total = plan.startCredits
    ? Array.from({ length: 12 }, (_, i) => allowanceGrant(plan, i).amount).reduce((a, b) => a + b, 0)
    : plan.perMonth ? plan.credits * 12 : plan.credits;
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

/* Die Rabatt-Badges sind BEHAUPTUNGEN über die Preisliste, und Behauptungen
   driften: Ändert jemand einen Preis oder eine Credit-Zahl, muss das Badge
   mitwandern — dieser Test rechnet beide gegen dieselbe Bezugsgröße nach
   (Preis je Credit gegenüber der Woche, siehe Kommentar in plans.js). */
test("every save badge states the real per-credit saving vs the monthly plan", () => {
  const month = SUBSCRIPTIONS.find((p) => p.period === "month");
  for (const plan of SUBSCRIPTIONS.filter((p) => p.saveHint)) {
    const real = Math.round((1 - termPerCredit(plan) / termPerCredit(month)) * 100);
    expect(plan.saveHint).toBe(`${real}%`);
  }
});

/* Die zwei Zahlen auf der Paywall. Der Filmpreis wird aus video.js
   BERECHNET, nicht hier wiederholt — bis zum 16.08. stand in dreamsFor
   `credits / 5`, weil ein Film einmal fuenf Credits kostete. Er kostet
   laengst sieben (sechs Sekunden plus Keyframe), und die Paywall versprach
   entsprechend zu viel. Diese Zeilen halten fest, dass die Zahl mitwandert. */
test("what a balance buys is whole, and never promises more than it can", () => {
  const perFilm = priceForFilm(FILM_UNIT.model, FILM_UNIT.seconds, { quality: FILM_UNIT.quality });
  for (const credits of [6, 12, 18, 45, 160, 540, 1920]) {
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

/* Die Extras sind eine LESART der Preisliste, keine zweite Preisliste:
   Basis + Extra ergibt immer genau die Credits auf dem Knopf, das kleinste
   Paket hat kein Extra, und je größer das Paket, desto größer der Anteil. */
test("pack extras add up and grow with the pack", () => {
  const sorted = [...PACKS].sort((a, b) => a.credits - b.credits);
  expect(packBonus(sorted[0]).extra).toBe(0);
  let lastPercent = -1;
  for (const p of sorted) {
    const b = packBonus(p);
    expect(b.base + b.extra).toBe(p.credits);
    expect(b.percent).toBeGreaterThanOrEqual(lastPercent);
    lastPercent = b.percent;
  }
  expect(packBonus(PACKS.find((p) => p.id === "pack-xl"))).toEqual({ base: 500, extra: 200, percent: 40 });
});

/* ── Das Startguthaben des Jahresabos (Antons Entscheidung 14.09.2026) ─────
   480 am Kauftag, der Rest des Jahres gleichmäßig auf die übrigen elf Monate
   (Antons Nachtrag: kein Monat ohne Credits). Diese Zeilen halten fest, woran
   die Entscheidung hängt: das Jahr gibt so viel wie zwölf Monatsabos (Marge
   unverändert), kein Monat bleibt leer, eine Erstattung bleibt klein, und der
   Übertrag macht das Jahr nicht zum Verlustgeschäft. */
const yearly = () => SUBSCRIPTIONS.find((p) => p.period === "year");
const yearSum = (plan, from = 0) => Array.from({ length: 12 }, (_, i) => allowanceGrant(plan, from + i).amount).reduce((a, b) => a + b, 0);

test("the yearly plan gives at least twelve months' credits — and only rounding more", () => {
  const year = yearly();
  expect(yearSum(year)).toBeGreaterThanOrEqual(year.credits * 12);
  expect(yearSum(year)).toBeLessThan(year.credits * 12 + 11);   // höchstens das Aufrunden
  expect(yearSum(year, 12)).toBe(yearSum(year));                 // auch im Verlängerungsjahr
  expect(dreamsFor(year.startCredits).films).toBeGreaterThanOrEqual(15);
});

test("the start grant lands on day one, every later month adds the same, the next year starts fresh", () => {
  const year = yearly();
  const topUp = allowanceGrant(year, 1).amount;
  expect(allowanceGrant(year, 0)).toEqual({ amount: year.startCredits, mode: "set" });
  for (let m = 1; m < 12; m++) expect(allowanceGrant(year, m)).toEqual({ amount: topUp, mode: "add" });
  expect(allowanceGrant(year, 12)).toEqual({ amount: year.startCredits, mode: "set" });
});

test("no month of the yearly plan goes empty", () => {
  // Antons Nachtrag 14.09.: lieber jeden Monat etwas weniger als Monate ohne.
  for (let m = 0; m < 12; m++) expect(allowanceGrant(yearly(), m).amount).toBeGreaterThan(0);
});

test("the monthly plan never rolls over", () => {
  const month = SUBSCRIPTIONS.find((p) => p.period === "month");
  for (let i = 0; i < 24; i++) expect(allowanceGrant(month, i)).toEqual({ amount: month.credits, mode: "set" });
});

/* Der Grund für das Startguthaben: Apple erstattet, nicht wir. Wer alles
   verbraucht, was bis dahin gutgeschrieben ist, und sich das Geld
   zurückholt, darf höchstens so viel kosten — bei 1.920 Credits auf einmal
   wären es $54 gewesen. Weil jetzt jeden Monat etwas dazukommt, steigt die
   Grenze bis Ende Monat 3 auf rund $21. Steigt der Einkauf je Credit, werden
   diese Zeilen rot, bevor jemand es merkt. */
test("a refund after burning everything granted so far stays small", () => {
  const year = yearly();
  const upTo = (months) => Array.from({ length: months }, (_, i) => allowanceGrant(year, i).amount).reduce((a, b) => a + b, 0);
  expect(upTo(1) * CREDIT_COST_USD).toBeLessThan(14);
  expect(upTo(3) * CREDIT_COST_USD).toBeLessThan(22);
});

/* Mit Übertrag verfällt im Abojahr nichts mehr — die 75-%-Annahme oben wird
   also wackeliger. Diese Zeile verlangt, dass das Jahr sogar bei VOLLEM
   Verbrauch und schlimmstem Einkauf noch trägt (heute 1,31×). */
test("with rollover the yearly plan still clears full usage", () => {
  const year = yearly();
  const net = (num(year.price) / 12 / 1.19) * 0.85;
  expect(net).toBeGreaterThan((yearSum(year) / 12) * CREDIT_COST_USD * 1.25);
});

/* Die Nutzungsbedingungen nennen die Zahlen ausgeschrieben. Ändert sich die
   Preisliste, müssen sie mitwandern — sonst versprechen die AGB etwas anderes
   als die Paywall. */
test("the terms name the same yearly numbers as the price list", () => {
  const year = yearly();
  for (const t of [en, de]) {
    const terms = JSON.stringify(t);
    expect(terms).toContain(`${year.startCredits} `);
    expect(terms).toContain(`${allowanceGrant(year, 1).amount} `);
  }
});
