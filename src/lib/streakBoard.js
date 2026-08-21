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
