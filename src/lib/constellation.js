/* Dein Sternbild (Antons Wahl 28.09.2026): Jede notierte Nacht zündet einen
 * Stern am Himmel der Startseite. Ist eine Stufe voll, verbinden sich ihre
 * Sterne und leuchten auf; dann wächst das Bild weiter — erst ein kleines W
 * aus fünf Sternen, am Ende ein großes Sternbild aus 33. Es trägt den Namen
 * des Motivs, das in den eigenen Träumen am häufigsten wiederkehrt
 * („Der Schwimmer" bei Wasser).
 *
 * Gezählt werden TRAUM-TAGE (seit 28.09. aus nights.js dreamNightCount —
 * „Nichts hängengeblieben" zählt nicht), nicht die Serie: Ein gerissener
 * Faden löscht keine Sterne — das Bild belohnt Dranbleiben, ohne zu
 * bestrafen. Für die Serie gibt es die Leiter.
 *
 * Reine Daten und Funktionen, damit Web, native App und Tests dieselbe
 * Rechnung sehen. Koordinaten 0…1 in einer Fläche von 16:10. */

/** Die Sterne in der Reihenfolge, in der sie aufleuchten. */
export const STARS = [
  // Stufe 1 — das W (5)
  [0.30, 0.48], [0.38, 0.24], [0.46, 0.44], [0.54, 0.20], [0.62, 0.42],
  // Stufe 2 (8)
  [0.70, 0.50], [0.64, 0.62], [0.56, 0.55],
  // Stufe 3 (12)
  [0.22, 0.52], [0.16, 0.64], [0.26, 0.70], [0.36, 0.62],
  // Stufe 4 (18)
  [0.78, 0.34], [0.86, 0.24], [0.46, 0.66], [0.42, 0.80], [0.52, 0.84], [0.60, 0.74],
  // Stufe 5 (25)
  [0.12, 0.30], [0.20, 0.22], [0.30, 0.16], [0.72, 0.16], [0.90, 0.46], [0.94, 0.60], [0.08, 0.80],
  // Stufe 6 (33)
  [0.50, 0.10], [0.62, 0.08], [0.80, 0.72], [0.72, 0.86], [0.30, 0.88], [0.20, 0.90], [0.04, 0.46], [0.96, 0.14],
];

/** Die Linien zwischen den Sternen (Indizes in STARS). */
export const EDGES = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [4, 5], [5, 6], [6, 7],
  [0, 8], [8, 9], [9, 10], [10, 11],
  [4, 12], [12, 13], [7, 14], [14, 15], [15, 16], [16, 17], [17, 6],
  [8, 18], [18, 19], [19, 20], [20, 1], [3, 21], [12, 22], [22, 23], [9, 24],
  [21, 26], [26, 25], [23, 27], [27, 28], [28, 17], [16, 29], [29, 30], [18, 31], [13, 32],
];

/** Wie viele Sterne jede Stufe vollmacht. */
export const STAGES = [5, 8, 12, 18, 25, 33];

/** Der Stand für n notierte Nächte: welche Stufe voll ist, wie viele
 *  Sterne leuchten, was als Nächstes kommt. */
export function skyState(nights) {
  const n = Math.max(0, Math.floor(nights || 0));
  const lit = Math.min(n, STARS.length);
  const done = STAGES.filter((s) => lit >= s).length;          // volle Stufen
  const next = STAGES[done] ?? null;                           // Ziel der laufenden Stufe
  const from = done ? STAGES[done - 1] : 0;
  return {
    lit,
    done,
    next,
    /** Sterne, die die laufende Stufe zeigt (leuchtend + blass vorgemerkt). */
    shown: next ?? STARS.length,
    /** Fortschritt in der laufenden Stufe, 0…1. */
    part: next ? (lit - from) / (next - from) : 1,
    left: next ? next - lit : 0,
    complete: lit >= STARS.length,
  };
}

/** Zu welcher Stufe gehört eine Linie? (Die ihres späteren Sterns.) */
export function edgeStage(edge) {
  const k = Math.max(edge[0], edge[1]);
  return STAGES.findIndex((s) => k < s);
}

/** Kalendertage mit IRGENDEINEM Eintrag. ⚠ Nicht für die Sterne — die
 *  zählen nur Traum-Tage (nights.js dreamNightCount, Antons Ansage 28.09.). */
export function notedNights(journal) {
  const days = new Set();
  for (const e of journal || []) {
    if (String(e?.id || "").startsWith("e_seed")) continue;
    const d = new Date(e?.createdAt);
    if (!isNaN(d)) days.add(`${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`);
  }
  return days.size;
}

/* ── Was am Ziel jeder Stufe wartet (Antons Ansage 28.09.: „bei jedem
 * Meilenstein mindestens einen Credit, später mehr"). Zusätzlich bei 5 der
 * Name des Sternbilds und bei 8 eine Schlummernacht. Die Credits kosten uns
 * je Credit etwa 2,8 Cent (bis 33 Nächte zusammen 14 Credits ≈ 40 Cent). */
export const SKY_REWARDS = {
  5: { credits: 1, name: true },
  8: { credits: 1, snooze: true },
  12: { credits: 2 },
  18: { credits: 2 },
  25: { credits: 3 },
  33: { credits: 5 },
};

/** Ist eine Stufen-Belohnung fällig? {stage, credits, snooze, patch} oder
 *  null. Idempotent: vergebene Stufen stehen in state.skyGifts. Immer nur
 *  EINE je Aufruf (die kleinste offene) — der Aufrufer ruft erneut. */
export function skyGift(state, nights, snoozeMax = 2) {
  const given = Array.isArray(state?.skyGifts) ? state.skyGifts : [];
  const stage = STAGES.find((s) => nights >= s && !given.includes(s));
  if (!stage) return null;
  const r = SKY_REWARDS[stage] || { credits: 1 };
  const snooze = !!r.snooze && (state?.snoozes || 0) < snoozeMax;
  return {
    stage, credits: r.credits, snooze,
    patch: { credits: (state?.credits || 0) + r.credits, skyGifts: [...given, stage], ...(snooze ? { snoozes: (state?.snoozes || 0) + 1 } : {}) },
  };
}
