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

// What one credit costs us, in USD. Every price below derives from it.
export const CREDIT_COST_USD = 0.08;

/** Subscriptions: the allowance refills each month and does not roll over. */
export const SUBSCRIPTIONS = [
  { id: "monthly-s", price: "$2.99", period: "month", credits: 17 },
  { id: "monthly-m", price: "$5.99", period: "month", credits: 35, featured: true },
  { id: "yearly",    price: "$59.99", period: "year", credits: 35, perMonth: true, saveHint: "17%" },
];

/** One-off packs: bought once, never expire, no commitment. */
export const PACKS = [
  { id: "pack-s", price: "$2.99",  credits: 13 },
  { id: "pack-m", price: "$9.99",  credits: 46 },
  { id: "pack-l", price: "$19.99", credits: 92 },
];

/** Roughly how many dreams a credit balance buys, for the "what you get" line. */
export function dreamsFor(credits) {
  return {
    fiveImages: Math.floor(credits / 5),
    threeImages: Math.floor(credits / 3),
    films: Math.floor(credits / 5),
  };
}
