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
 * It also settles the grid question. The 3-image tier CAN be rendered as one
 * wide image cut into three (Step5Style's `useGrid`), which would make this
 * giveaway cost $0.08 instead of $0.24 — tempting, given how thin the
 * margins in plans.js are. Measured on a real render: the panels come out
 * 459×768 against 768×1376 for a normal still, a third of the pixels. So
 * that saving would be taken precisely on the one dream that has to be
 * good, and against the rule two paragraphs up. The free dream renders
 * full-size. If the grid is ever wanted, it belongs in front of someone as
 * a labelled cheaper choice, not behind their first impression.
 */
export const WELCOME_CREDITS = 3;

export function canAfford(state, cost) {
  return (state?.credits ?? 0) >= cost;
}

/** @returns a patch for update(), or null when the balance is too low. */
export function spend(state, cost) {
  if (!canAfford(state, cost)) return null;
  return { credits: (state.credits ?? 0) - cost };
}

/** One-time welcome grant. Flagged so it never repeats, including for people
 *  who installed before the grant existed. */
export function welcomeGrant(state) {
  if (state?.creditsGranted) return null;
  return { credits: (state?.credits ?? 0) + WELCOME_CREDITS, creditsGranted: true };
}
