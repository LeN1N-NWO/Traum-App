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

/* ── Die Geschenke (Neufassung 03.10.2026, Antons Ansage) ─────────────────
 *
 * „Jetzt ist es so ein Credit, das klingt nach gar nichts." Stimmt: Ein
 * Credit ist ein Sechzehntel eines Films. Bis heute gab es 7 → 1 und
 * 30 → 3, Deckel 4. Jetzt bekommt jede Stufe etwas, das man in Dingen
 * ausdrücken kann, nicht in einer Zahl:
 *
 *   3  → ein Glimpse (SKETCH_BASE: erstes Bild + Ton)
 *   7  → dein erster Traumfilm (genau der Preis von FILM_UNIT, 15 s)
 *   14 → 20 · 30 → 50 · 60 → 100 · 100 → 160 (ein Monat Abo-Guthaben)
 *
 * Warum das bezahlbar ist: Es zählen seit 03.10. NUR Träume mit Glimpse
 * oder Film (nights.js dreamCount) — keine Serie, nur die Zahl. 5 Glimpses
 * je Monat sind gratis — die 3 ist ein Vorgeschmack, ab der 7 hat jemand
 * mindestens zweimal Credits ausgegeben, also gekauft (es gibt kein
 * Willkommensgeschenk mehr) oder einen zweiten Monat lang Gratis-Glimpses
 * gemacht.
 * Geschenkt wird in den Geschenk-Topf (credits.js giftCredits), der nach
 * 30 Tagen verfällt; was nicht eingelöst wird, kostet nichts.
 *
 * Bis zum 30. Traum höchstens 2 + 16 + 20 + 50 = 88 Credits ≈ $2,50
 * Einkauf (03.10.: ein 15-s-Film „Standard" kostet 16 Credits).
 *
 * Vergeben wird über `state.streakGifts` — die Liste der Schwellen, die
 * schon geflossen sind. Eine Liste statt eines Zählers, damit die Vergabe
 * idempotent bleibt, auch wenn Träume gelöscht und neue gemacht werden:
 * Wer einmal die 7 hatte, bekommt sie kein zweites Mal. */
import { addGift } from "./credits.js";
import { giftAtNum, nextGiftNum, QUARTER } from "./dreamRing.js";
import { FILM_UNIT } from "./plans.js";
import { SKETCH_BASE } from "./sketchQuota.js";
import { priceForFilm } from "./video.js";

export const FILM_GIFT = priceForFilm(FILM_UNIT.model, FILM_UNIT.seconds, { quality: FILM_UNIT.quality });

/** `kind` sagt der Oberfläche, wie das Geschenk heißt (i18n
 *  streakBoard.giftKinds): ein Glimpse, ein Film, Credits, ein Monat. */
export const GIFTS = [
  { nights: 3, credits: SKETCH_BASE, kind: "glimpse" },
  { nights: 7, credits: FILM_GIFT, kind: "film" },
  { nights: 14, credits: 20, kind: "credits" },
  { nights: 30, credits: 50, kind: "credits" },
  { nights: 60, credits: 100, kind: "credits" },
  { nights: 100, credits: 160, kind: "month" },
];
/* Je Installation höchstens die ganze Leiter einmal. */
export const GIFT_CAP = GIFTS.reduce((sum, g) => sum + g.credits, 0);

/** Was an dieser Schwelle wartet — für die Leiter im Board. */
export function giftAt(nights) {
  return GIFTS.find((g) => g.nights === nights)?.credits || 0;
}

/** Das ganze Geschenk an dieser Schwelle, oder null. */
export function giftInfo(nights) {
  return GIFTS.find((g) => g.nights === nights) || null;
}

/** Das fällige Geschenk, oder null.
 *
 *  ⚠ Seit 03.10. spätabends (Traum-Ring, dreamRing.js): Geschenke liegen
 *  auf den Vierteln jedes 12er-Rings — 3, 6, 9 je ein Glimpse, 12 der
 *  Film aus dem Ring (den macht das iPhone, hier gibt es dafür nichts).
 *  Die Leiter GIFTS oben bleibt nur für die alte Web-Ansicht stehen.
 *
 *  `giftedUpTo` merkt sich den letzten bezahlten Platz; Nummern laufen nur
 *  vorwärts, also zahlt nichts doppelt. Alte Stände ohne das Feld nehmen
 *  das höchste Viertel aus `streakGifts`. Genau ein Geschenk je Aufruf.
 *  `giftUnseen` hält es, bis die Startseite es geöffnet hat (`giftSeen`).
 *
 *  @returns {{nights:number, credits:number, kind:string, patch:object}|null} */
export function giftFor(state, now = Date.now()) {
  const count = state?.count || 0;
  const given = Array.isArray(state?.streakGifts) ? state.streakGifts : [];
  const upTo = Number.isFinite(state?.giftedUpTo) ? state.giftedUpTo : Math.max(0, ...given.filter((n) => n % QUARTER === 0));
  let num = nextGiftNum(upTo);
  while (num <= count && giftAtNum(num)?.kind !== "glimpse") num = nextGiftNum(num);
  if (num > count) return null;
  const g = giftAtNum(num);
  return {
    nights: num,
    credits: g.credits,
    kind: g.kind,
    patch: {
      ...addGift(state, g.credits, now),
      giftedUpTo: num,
      giftUnseen: { nights: num, credits: g.credits, kind: g.kind, at: new Date(now).toISOString() },
    },
  };
}

/** Der nächste Meilenstein — oder null, wenn alle erreicht sind. */
export function nextMilestone(count) {
  return MILESTONES.find((m) => (count || 0) < m.nights) || null;
}

/** Wie weit der Weg zum nächsten Meilenstein ist, 0..1 (für den Ring). */
export function milestoneProgress(streak) {
  const nxt = nextMilestone(streak);
  if (!nxt) return 1;
  const idx = MILESTONES.indexOf(nxt);
  const base = idx === 0 ? 0 : MILESTONES[idx - 1].nights;
  return Math.max(0, Math.min(1, ((streak || 0) - base) / (nxt.nights - base)));
}

/** Wie ein Geschenk heißt — „Dein erster Traumfilm", „20 Credits". */
export function giftLabel(t, gift) {
  const kinds = t?.streakBoard?.giftKinds;
  const f = kinds?.[gift?.kind];
  return f ? f(gift.credits) : `${gift?.credits ?? 0} credits`;
}
