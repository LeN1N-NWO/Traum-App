/* Die Meilenstein-Leiter hinter der Streak-Pille (Antons Go 22.08.,
 * Plan: docs/plans/2026-08-21-streak-board-gamification.md §4).
 *
 * Erste Ausbaustufe: NUR zeigen, was existiert. Die Wesen-Rarität hängt
 * schon heute an der Serie (creatures.js pickRarity) — die Leiter macht
 * die Schwellen sichtbar, statt neue Mechanik zu erfinden. Credits und
 * Schlummernacht kommen erst nach Antons Entscheidung (Plan §5/§6) —
 * ein Board, das Belohnungen verspricht, die es nicht gibt, wäre genau
 * die Sorte Lüge, die die App sonst vermeidet.
 *
 * `reward` ist ein i18n-SCHLÜSSEL (t.streakBoard.rewards[key]), kein
 * Text — die Texte wohnen in den Sprachdateien. */
export const MILESTONES = [
  { nights: 3,   reward: "warm" },
  { nights: 7,   reward: "epic" },
  { nights: 14,  reward: "steady" },
  { nights: 30,  reward: "legendary" },
  { nights: 60,  reward: "keeper" },
  { nights: 100, reward: "hundred" },
];

/* ── Die Mini-Geschenke (Antons Ja vom 22.08., Plan §5).
 *
 * Zwei Stellen, einmalig, klein: 7 Nächte → 1 Credit, 30 → 3. Der Deckel
 * von 4 Credits je Installation ist keine Zierde: Jeder verschenkte Credit
 * ist echtes Geld (credits.js-Kopf), und der Zustand liegt im localStorage,
 * den jeder Mensch löschen kann. Ohne Deckel wäre die Leiter eine
 * Geldpresse für den, der es merkt — mit Deckel kostet der schlimmste Fall
 * $0,32, weniger als das Willkommensgeschenk.
 *
 * Die Primärwährung bleibt die Menagerie: Wesen kosten uns nichts und sind
 * das, was man sich WIRKLICH erlaufen hat.
 *
 * Vergeben wird über `state.streakGifts` — die Liste der Schwellen, die
 * schon geflossen sind. Eine Liste statt eines Zählers, damit die Vergabe
 * idempotent bleibt, auch wenn die Serie reißt und wieder wächst: Wer
 * einmal die 7 hatte, bekommt sie kein zweites Mal. */
export const GIFTS = [
  { nights: 7, credits: 1 },
  { nights: 30, credits: 3 },
];
export const GIFT_CAP = 4;

/** Was an dieser Schwelle wartet — für die Leiter im Board. */
export function giftAt(nights) {
  return GIFTS.find((g) => g.nights === nights)?.credits || 0;
}

/** Das fällige Geschenk, oder null.
 *
 *  Rein: gibt den Patch zurück, der Aufrufer speichert ihn. Genau ein
 *  Geschenk je Aufruf — wer mit einer Serie von 30 aus dem Nichts
 *  auftaucht (Import, alter Stand), bekommt beim nächsten Durchlauf das
 *  zweite; ein Sprung über zwei Schwellen auf einmal ist so selten, dass
 *  Einfachheit hier mehr wert ist als Eile.
 *
 *  @returns {{nights:number, credits:number, patch:object}|null} */
export function giftFor(state) {
  const streak = state?.streak || 0;
  const given = Array.isArray(state?.streakGifts) ? state.streakGifts : [];
  const due = GIFTS.find((g) => streak >= g.nights && !given.includes(g.nights));
  if (!due) return null;

  const already = given.reduce((sum, n) => sum + giftAt(n), 0);
  const room = GIFT_CAP - already;
  if (room <= 0) return null;

  const credits = Math.min(due.credits, room);
  return {
    nights: due.nights,
    credits,
    /* Die Schwelle wird auch dann vermerkt, wenn der Deckel den Betrag
       kürzt — sonst stünde sie beim nächsten Start wieder an. */
    patch: { credits: (state?.credits || 0) + credits, streakGifts: [...given, due.nights] },
  };
}

/** Der nächste Meilenstein — oder null, wenn alle erreicht sind. */
export function nextMilestone(streak) {
  return MILESTONES.find((m) => (streak || 0) < m.nights) || null;
}

/** Wie weit der Weg zum nächsten Meilenstein ist, 0..1 (für den Ring). */
export function milestoneProgress(streak) {
  const nxt = nextMilestone(streak);
  if (!nxt) return 1;
  const idx = MILESTONES.indexOf(nxt);
  const base = idx === 0 ? 0 : MILESTONES[idx - 1].nights;
  return Math.max(0, Math.min(1, ((streak || 0) - base) / (nxt.nights - base)));
}
