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

/** New installs get a starter balance so the app is usable before top-ups exist. */
export const WELCOME_CREDITS = 25;

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
