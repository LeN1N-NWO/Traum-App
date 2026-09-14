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

/* ── Kein Willkommensgeschenk mehr (Antons Entscheidung 14.09.2026) ───────
 * „Es gibt kein Willkommensgeschenk mehr, das kostet uns nur Geld."
 *
 * Bis dahin bekam jede Installation nach der Umfrage 4 Credits
 * (WELCOME_CREDITS, welcomeGrant). Die Zahl stammte aus der Bilderzeit und
 * kaufte seit dem Wegfall der Bilder ohnehin keinen Film mehr (billigster:
 * 11 Credits) — und sie wurde PRO INSTALLATION gezahlt, laut plans.js der
 * größte einzelne Kostenposten. Das Gratis-Erlebnis tragen jetzt die
 * Beispielfilme im Onboarding, Schreiben, Sprechen und der Schlaf-Tab.
 * Wer vorher schon Credits bekommen hat, behält sie (`credits` bleibt).
 * Neue Credits kommen nur noch aus Käufen, Abos, Apple-Offer-Codes und
 * Einladungsprämien (docs/plans/2026-09-14-codes-einladungen-plan.md). */

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
 *   `credits`  kommt aus Paketen (bis 14.09.2026 auch aus dem Willkommens-
 *              geschenk). Bleibt.
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

/** Monatsbeginn eines Abos nach plans.js/allowanceGrant (14.09.2026): Das
 *  Monatsabo und der Jahresbeginn SETZEN, im laufenden Abojahr wird
 *  DAZUGELEGT — das Startguthaben des Jahresabos darf nicht im zweiten Monat
 *  verschwinden. Gekaufte Credits bleiben in beiden Fällen unberührt. */
export function applyAllowanceGrant(state, grant) {
  if (grant.mode === "set") return refillAllowance(state, grant.amount);
  return { allowance: (state?.allowance ?? 0) + grant.amount, credits: state?.credits ?? 0 };
}

