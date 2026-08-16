/* The plans on the paywall — and the arithmetic behind every number.
 *
 * ⚠ NOTHING here charges anybody. There is no payment provider, no store
 * account and no server-side balance yet, so the paywall is a shop window.
 * The numbers are real, though, so they can go straight into the store
 * listings once those exist.
 *
 * ── How the numbers were derived (prices checked 08.08.2026) ──────────────
 * Our own cost per dream is almost entirely image generation:
 *   fal.ai nano-banana-2, 1K            $0.08 per image
 *   fal.ai Hailuo 02 standard, 6s       $0.27 per video   ⚠ slug unconfirmed
 *   DeepSeek v4-flash, one analysis     $0.00026          → 0.065 % of a
 *                                                          five-image dream
 * So: 1 CREDIT = 1 IMAGE = $0.08 of cost. A film is a keyframe plus the
 * video, $0.35, which rounds to 5 credits.
 *
 * Selling price has to clear the store's cut BEFORE the margin:
 *   price = cost × markup / (1 − store share)
 * At Apple's standard 30 % that is $0.171 per credit for a 1.5× markup —
 * 38 % more than the same margin would need on the web. Budgeting for 30 %
 * is the conservative choice; Small Business Program (15 %) only improves it.
 *
 * Subscriptions get the 1.5× floor, one-off packs 1.9×. That is where the
 * "subscribe and get more" discount comes from — not from cutting under the
 * target margin.
 *
 * ⚠ The yearly plan is the one number that depends on an ASSUMPTION. Its
 * margin is only 1.25× if a subscriber burns every single credit every month.
 * It reaches the 1.5× target at roughly 75 % usage, which is why monthly
 * credits do not roll over. If real usage turns out higher, the yearly price
 * has to rise — check this against actual figures before it goes on sale.
 *
 * ── Two costs the maths above IGNORES (modelled 09.08.2026) ───────────────
 * The formula `price × markup / (1 − store share)` misses both of the
 * biggest real deductions, so every margin above is too optimistic:
 *
 * 1. VAT. In the EU, tax comes out of the sticker price BEFORE anything
 *    else: a German $5.99 is $5.03 net (÷1.19), and Apple's 30 % applies
 *    to the net. Real chain for monthly-m at 30 % store / 75 % usage:
 *    $5.99 → ÷1.19 → ×0.70 → −$2.10 credits = $1.42/month, not $2.09.
 *
 * 2. The welcome grant is paid PER INSTALL, not per customer. At a
 *    conversion rate c, every subscriber drags 1/c installs behind them;
 *    spread over an average stay of L months that is (1/L)·($0.24/c) per
 *    subscriber-month. At c = 5 %, L = 3: $1.60/month — MORE than the
 *    $1.42 the subscription itself earns. With both corrections applied,
 *    the standard 30 % store cut is structurally loss-making.
 *
 * Consequence: the Small Business Program (15 %) is a REQUIREMENT of this
 * price list, not a nice-to-have — with it the same numbers yield roughly
 * €0.50–1.30 contribution per subscriber-month. The metric that decides
 * everything is conversion: below ~4.5 % free-to-paid the welcome grant
 * eats the whole margin; at 8 % the picture is comfortable. Measure
 * conversion FIRST after launch, before trusting any number in this file.
 */

import { priceForFilm, videoModel } from "./video.js";

// What one credit costs us, in USD. Every price below derives from it.
export const CREDIT_COST_USD = 0.08;

/* ── Preisliste, neu gerechnet 16.08.2026 ─────────────────────────────────
 *
 * Die alte Liste (2,99 / 5,99 / 59,99 im Monatsrhythmus) hatte zwei Probleme,
 * die erst die korrigierte Rechnung oben sichtbar gemacht hat:
 *
 * 1. Sie war ZU BILLIG. Nicht aus Bescheidenheit, sondern rechnerisch: mit
 *    MwSt. und Store-Anteil blieben von $5,99 noch $1,42 im Monat, und davon
 *    ging die Gratis-Credit-Last ab. Die Branchendaten zeigen zusätzlich,
 *    dass teurere Apps im Median DOPPELT so gut konvertieren — der Preis ist
 *    ein Qualitätssignal, kein Hindernis. Mirror nimmt $7,99 im Monat für
 *    reine Textdeutung; wir rendern Filme.
 *
 * 2. Sie kannte kein WOCHEN-ABO. Das ist inzwischen das umsatzstärkste
 *    Format der Branche (55,5 % gegenüber 43,3 % zwei Jahre zuvor), und für
 *    eine App, die man nach einem besonderen Traum aufmacht, ist es das
 *    passende Einstiegsversprechen: eine Woche ausprobieren, nicht ein Jahr
 *    unterschreiben.
 *
 * Die Preise je Credit sind ABSICHTLICH gestaffelt — Bindung wird belohnt:
 *   Woche   $4,99 / 12 Cr = $0,416   (Impuls, jederzeit weg)
 *   Monat   $9,99 / 45 Cr = $0,222   (der Normalfall, deshalb hervorgehoben)
 *   Jahr   $79,99 / 45 Cr = $0,148   (33 % billiger als zwölf Monate)
 *   Pakete                           teurer je Credit als jedes Abo, weil
 *                                    ohne Bindung — sonst wäre das Abo dumm.
 *
 * Deckungsbeitrag beim realistischen Fall (19 % MwSt., 15 % Small Business
 * Program, 75 % Verbrauch): Monat $9,99 → netto $7,14 − $2,70 Credits =
 * $4,44. Zum Vergleich die alte Liste: $1,42. Das ist der Unterschied
 * zwischen „trägt sich ab 4,5 % Conversion" und „trägt sich früher".
 *
 * ⚠ Noch nichts davon kassiert. Die Zahlen sind so gebaut, dass sie beim
 * Anlegen der Store-Produkte unverändert übernommen werden können.
 */

/** Subscriptions: the allowance refills each period and does not roll over. */
export const SUBSCRIPTIONS = [
  { id: "weekly",    price: "$4.99",  period: "week",  credits: 12 },
  { id: "monthly",   price: "$9.99",  period: "month", credits: 45, featured: true },
  { id: "yearly",    price: "$79.99", period: "year",  credits: 45, perMonth: true, saveHint: "33%" },
];

/* One-off packs: bought once, never expire, no commitment.
 *
 * Neu gesetzt am 16.08.2026, weil Anton eine Kollision gefunden hat, die
 * meine Preisprüfung durchgelassen hatte: pack-s stand bei $4,99 für 15
 * Credits — gegen das Wochen-Abo mit $4,99 für 12. Gleiches Geld, MEHR
 * Credits, und sie verfallen nie. Das Abo war an dieser Stelle strikt das
 * schlechtere Angebot, und niemand mit klarem Kopf hätte es genommen.
 *
 * Warum die Prüfung das nicht sah: Sie rechnete den Abopreis auf den Monat
 * hoch und verglich dann je Credit. Über ein Jahr gewinnt das Wochen-Abo
 * damit haushoch — nur vergleicht so niemand. Im Kaufmoment steht da
 * „$4,99 → 15, für immer" neben „$4,99 → 12, läuft ab", und das entscheidet.
 *
 * Zwei Regeln, beide jetzt in plans.test.js festgenagelt:
 *   1. Kein Paket teilt einen Preispunkt mit einem Abo. Ein direkter
 *      Vergleich bei identischem Preis ist immer ein Vergleich, den eine
 *      Seite verliert.
 *   2. Jedes Paket ist je Credit teurer als JEDES Abo — auch als die erste
 *      Woche des Wochen-Abos. Das ist der Aufschlag für Unvergänglichkeit,
 *      und er ist der ehrliche Grund, warum Pakete existieren: nicht als
 *      besseres Geschäft, sondern als eines ohne Bindung.
 */
export const PACKS = [
  { id: "pack-s", price: "$2.99",  credits: 6 },
  { id: "pack-m", price: "$7.99",  credits: 18 },
  { id: "pack-l", price: "$14.99", credits: 32 },
];

/** Was ein Guthaben konkret hergibt — die Zahlen hinter den zwei Symbolen
 *  auf der Paywall.
 *
 *  Der Filmpreis wird BERECHNET, nicht angenommen: Bis zum 16.08.2026 stand
 *  hier `credits / 5`, weil ein Film einmal fünf Credits kostete. Er kostet
 *  längst sieben (sechs Sekunden Voreinstellung plus ein Keyframe), und die
 *  Paywall versprach entsprechend zu viel. Ein Preis, der an zwei Stellen
 *  steht, driftet — also steht er nur noch an einer.
 */
export function dreamsFor(credits) {
  const perFilm = priceForFilm("standard", videoModel("standard").preset);
  return {
    images: credits,                          // 1 Credit = 1 Bild, per Definition
    films: Math.floor(credits / perFilm),
  };
}
