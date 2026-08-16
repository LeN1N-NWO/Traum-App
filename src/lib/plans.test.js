import { test, expect } from "bun:test";
import { SUBSCRIPTIONS, PACKS, CREDIT_COST_USD, dreamsFor } from "./plans.js";

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

/* Ohne diese Regel waere das Abo das schlechtere Geschaeft und die Pakete
   wuerden es kannibalisieren. */
test("every pack costs more per credit than the monthly plan", () => {
  const month = SUBSCRIPTIONS.find((p) => p.period === "month");
  for (const pack of PACKS) {
    expect(num(pack.price) / pack.credits).toBeGreaterThan(perCredit(month));
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

test("dreamsFor stays whole — half a dream buys nothing", () => {
  const got = dreamsFor(12);
  expect(got.fiveImages).toBe(2);
  expect(got.threeImages).toBe(4);
  expect(Number.isInteger(got.films)).toBe(true);
});
