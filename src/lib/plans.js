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
 *   ⚠ Das ist der EINKAUFSPREIS VON DAMALS und bleibt hier stehen, weil die
 *     ganze Credit-Skala darauf gebaut wurde. Tatsächlich gekauft wird seit
 *     20.08. Nano Banana Lite ($0,042) und seit 23.08. Seedream 5 Lite
 *     ($0,035, dafür 1440×2560 statt 768×1376) — siehe imageModel.js.
 *     Die Verkaufspreise haben sich BEWUSST nicht mitbewegt: die Ersparnis
 *     verbreitert die Marge und trägt die Gratis-Charakterbögen, sie
 *     verbilligt nichts für den Kunden. Wer die Skala je neu rechnet,
 *     rechnet sie gegen das Modell, das dann WIRKLICH läuft.
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
import { creditCostUsd } from "./gridLayout.js";

/** Was uns ein Credit im Einkauf kostet. Jeder Preis unten leitet sich daraus ab.
 *
 *  ⚠ Bis zum 24.08.2026 stand hier `0.08` — der nano-banana-2-Preis vom
 *  8. August, DREI Modellwechsel alt (Lite $0,042 → Seedream $0,035 → GPT
 *  Image 2 im Raster $0,0283). Der ganze Herleitungs-Kommentar oben rechnete
 *  gegen diese tote Zahl, und die Datei warnt sogar selbst davor („Wer die
 *  Skala je neu rechnet, rechnet sie gegen das Modell, das dann WIRKLICH
 *  läuft") — nur war sie selbst nicht nachgezogen worden.
 *
 *  Eine abgeschriebene Zahl veraltet still. Deshalb wird sie jetzt gerechnet:
 *  `creditCostUsd()` nimmt Stufe und Rastermaß des Modells, das WIRKLICH
 *  läuft, und teilt durch die Rasterplätze. Der nächste Modellwechsel zieht
 *  die ganze Preisliste von allein nach. */
export const CREDIT_COST_USD = creditCostUsd();

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
 *   Woche   $4,99 /  25 Cr = $0,200   (Impuls, jederzeit weg)
 *   Monat   $9,99 / 100 Cr = $0,100   (der Normalfall, deshalb hervorgehoben)
 *   Jahr   $79,99 / 100 Cr = $0,067   (67 % billiger je Credit als die Woche)
 *   Pakete                            teurer je Credit als jedes Abo, weil
 *                                     ohne Bindung — sonst wäre das Abo dumm.
 *
 * ── ⚠ Warum die Credit-ZAHLEN am 24.08.2026 gestiegen sind ───────────────
 * Die PREISE stehen unverändert; was sich verdoppelt hat, ist, wie viele
 * Credits man dafür bekommt (12→25, 45→100, 6/18/32→13/36/70).
 *
 * Grund: Ein Bild kostet uns seit dem 2×2-Raster $0,0283 statt $0,08 — ein
 * Drittel. Bisher galt „die Ersparnis verbreitert die Marge, sie verbilligt
 * nichts" (20.08.). Antons Entscheidung vom 24.08. kehrt das für BILDER um:
 * „Die Credits müssen steigen, vor allem für Bilder."
 *
 * ⚠⚠ Der Haken, an dem die Rechnung fast gescheitert wäre: Ein Credit kauft
 * ZWEI Dinge. Bilder sind billiger geworden, Film nicht. Hätten wir nur die
 * Zahlen erhöht und die Filmpreise gelassen, hätten wir nicht Bilder
 * verschenkt, sondern FILM — und beim Kino-Film lag das Jahresabo schon
 * vorher bei 1,3× statt der angepeilten 1,5×. Deshalb sind die
 * `creditsPerSecond` in video.js MITGEZOGEN (1/4/6 → 3/9/17; seit 31.08. je Modell zwei Qualitäten: H3 2–3, Seedance 2.5 8–17), aus derselben
 * Quelle hergeleitet. Erst danach ist die Erhöhung tragbar.
 *
 * Was der Kunde davon merkt (Monat, 45 → 100 Cr):
 *   Bilder:  11 Traumstrecken à 4  →  25 Traumstrecken à 4   (mehr als doppelt)
 *   Filme:    6 × „lebendig" 6 s   →   5 × „lebendig" 6 s    (annähernd gleich)
 * Genau so soll es sein: Die Ersparnis ist beim Bild entstanden und wird
 * beim Bild ausgezahlt.
 *
 * ⚠ Das Jahresabo ist und bleibt die BINDENDE Grenze der ganzen Liste — bei
 * 100 Credits liegt es auf 1,7×, bei 120 fiele es unter 1,5×. Wer die Zahlen
 * je wieder anfasst, rechnet ZUERST das Jahr gegen die teuerste Verwendung.
 * `node scripts/preis-durchreichen.mjs` rechnet alles nach.
 *
 * ⚠ Noch nichts davon kassiert. Die Zahlen sind so gebaut, dass sie beim
 * Anlegen der Store-Produkte unverändert übernommen werden können.
 */

/** Subscriptions: the allowance refills each period and does not roll over.
 *
 *  saveHint: EINE Bezugsgröße für beide Badges — der Preis je Credit
 *  gegenüber der Woche ($0,200). Monat $0,100 → 50 %, Jahr $0,067 → 67 %.
 *  Vorher trug nur das Jahr ein Badge (33 %, gerechnet gegen den Monat):
 *  zwei Badges mit zwei Bezugsgrößen wären Zahlen, die niemand nachrechnen
 *  kann. Antons Ansage 21.08.: der Monatsrabatt soll SICHTBAR sein — er
 *  existierte längst, stand nur nirgends. plans.test.js rechnet beide nach. */
export const SUBSCRIPTIONS = [
  { id: "weekly",    price: "$4.99",  period: "week",  credits: 25 },
  { id: "monthly",   price: "$9.99",  period: "month", credits: 100, featured: true, saveHint: "50%" },
  { id: "yearly",    price: "$79.99", period: "year",  credits: 100, perMonth: true, saveHint: "67%" },
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
  { id: "pack-s", price: "$2.99",  credits: 13 },
  { id: "pack-m", price: "$7.99",  credits: 36 },
  { id: "pack-l", price: "$14.99", credits: 70 },
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
