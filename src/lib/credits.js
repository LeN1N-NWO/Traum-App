/* Credit balance.
 *
 * ⚠ This is bookkeeping, NOT access control. The balance lives in
 * localStorage, which the person can edit freely — anyone determined to get
 * free generations already can. Real enforcement belongs on the server, next
 * to the accounts backend that does not exist yet. What this file buys us is
 * an honest flow: prices are visible, spending is visible, and every call
 * site already asks permission, so the switch to a server-held balance
 * changes these three functions and nothing else.
 */

/* New installs get enough to make one complete dream — three images, at full
 * quality. Three, not five, and not the old twenty-five:
 *
 *   Every free credit is $0.08 of real money we hand out, and localStorage
 *   makes it repeatable by anyone who clears their site data. At 25 that was
 *   $2.00 per install, unlimited times.
 *
 *   Three credits cost $0.24. Against $2.09 of profit per subscriber-month
 *   and a three-month average stay, the giveaway pays for itself at a 3.8 %
 *   conversion rate — inside what freemium apps actually reach. At five
 *   credits it would need 6.4 %, which is not.
 *
 *   ⚠ Correction (09.08.2026): the 3.8 % ignores VAT. In the EU the tax
 *   comes off the sticker price BEFORE Apple's cut, so the $2.09 above is
 *   really ~$1.42 at the standard 30 % — break-even is ~4.5–5 %, not 3.8 %.
 *   Under the Small Business Program (15 %) it drops back to ~3.7 %. The
 *   fuller model (store cut × VAT × burn × conversion × stay) lives in the
 *   header of plans.js; the decision it forces is unchanged — fewer free
 *   credits, not worse ones — but the safety margin is thinner than this
 *   comment originally believed.
 *
 *   Deliberately NOT solved by rendering the free dream on a cheaper model:
 *   the first dream someone sees decides whether they ever pay for another,
 *   so it gets the same renderer as everything else. Fewer, not worse.
 *
 * ── The grant is now a written promise (10.08.2026) ───────────────────────
 * The welcome no longer says "3 credits" anywhere; it says "your first dream
 * is on us" (t.onboarding.gateReward, seven locales). That is better copy —
 * a dream is a thing, three credits is a conversion someone has to do — but
 * it also binds this number: the grant has to buy exactly one smallest
 * dream, no less and no more. credits.test.js pins that relationship,
 * because the promise and the numbers live in nine different files.
 *
 * It also settles the grid question. The smallest tier CAN be rendered as one
 * wide image cut into panels (Step5Style's `useGrid`), which would make this
 * giveaway cost one render instead of four — tempting, given how thin the
 * margins in plans.js are. Measured on a real render: the panels come out
 * 459×768 against 768×1376 for a normal still, a third of the pixels. So
 * that saving would be taken precisely on the one dream that has to be
 * good, and against the rule two paragraphs up. The free dream renders
 * full-size. If the grid is ever wanted, it belongs in front of someone as
 * a labelled cheaper choice, not behind their first impression.
 */
/* ⚠ Von 3 auf 4 mitgezogen am 23.08.2026, als die Bildzahlen auf 4/8
 * umgestellt wurden. Die Regel ist die Beziehung, nicht die Zahl: Das
 * Geschenk zahlt GENAU EINEN kleinsten Traum. Wäre es bei 3 geblieben,
 * hätte der erste Traum plötzlich einen Credit gekostet, den niemand hat —
 * und das Versprechen „dein erster Traum geht auf uns" wäre eine Lüge mit
 * einem ✦ davor gewesen. credits.test.js nagelt die Beziehung fest.
 *
 * ⚠ Es KOSTET auch mehr: 4 × $0,035 = $0,14 je Installation statt $0,105.
 * Das Geschenk wird PRO INSTALLATION gezahlt, nicht pro Kunde — laut
 * plans.js ist es damit der größte einzelne Kostenposten überhaupt, und
 * ein Drittel mehr davon ist keine Kleinigkeit. Wer die Conversion misst,
 * misst gegen diese Zahl. */
export const WELCOME_CREDITS = 4;

/* ── Zwei Töpfe, nicht einer (16.08.2026) ─────────────────────────────────
 *
 * Anton hat beim Durchsehen der Preisliste gefragt, wie die App eigentlich
 * unterscheiden soll, welche Credits verfallen und welche bleiben. Antwort:
 * bis eben gar nicht — es gab eine Zahl. Damit wäre die erste Abrechnung
 * eines Abos nicht durchführbar gewesen, ohne jemandem etwas wegzunehmen,
 * das er bezahlt hat:
 *
 *   `allowance` kommt aus einem Abo, füllt sich zum Periodenbeginn neu auf
 *              und wird dabei zurückgesetzt, nicht addiert (plans.js: „does
 *              not roll over" — daran hängt die Jahresrechnung).
 *   `credits`  kommt aus Paketen und aus dem Willkommensgeschenk. Bleibt.
 *              Auch wenn ein Abo endet.
 *
 * Ausgegeben wird IMMER zuerst das Verfallende. Das ist zugleich das
 * Freundlichere und das Naheliegende: Was ohnehin abläuft, soll zuerst
 * genutzt werden. Andersherum verlöre jemand mit Abo bei jeder Abrechnung
 * genau die Credits, die er zusätzlich gekauft hat.
 *
 * ⚠ Bleibt Buchhaltung, keine Zugangskontrolle — beides liegt im
 * localStorage. Der Punkt ist, dass das MODELL stimmt, bevor es einen
 * Server gibt, der es durchsetzt.
 */

/** Was zusammen zur Verfügung steht. Die einzige Zahl, die jemand sieht —
 *  die Trennung ist Buchhaltung, keine Aufgabe für den Menschen. */
export function totalCredits(state) {
  return (state?.credits ?? 0) + (state?.allowance ?? 0);
}

export function canAfford(state, cost) {
  return totalCredits(state) >= cost;
}

/** @returns a patch for update(), or null when the balance is too low. */
export function spend(state, cost) {
  if (!canAfford(state, cost)) return null;
  const allowance = state.allowance ?? 0;
  const fromAllowance = Math.min(allowance, cost);
  return {
    allowance: allowance - fromAllowance,
    credits: (state.credits ?? 0) - (cost - fromAllowance),
  };
}

/** Periodenbeginn eines Abos: das Guthaben wird GESETZT, nicht addiert.
 *  Gekaufte Credits bleiben unberührt — sie gehören nicht dem Abo. */
export function refillAllowance(state, credits) {
  return { allowance: credits, credits: state?.credits ?? 0 };
}

/** One-time welcome grant. Flagged so it never repeats, including for people
 *  who installed before the grant existed. */
export function welcomeGrant(state) {
  if (state?.creditsGranted) return null;
  return { credits: (state?.credits ?? 0) + WELCOME_CREDITS, creditsGranted: true };
}
