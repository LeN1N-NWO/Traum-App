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
import { SKETCH_BASE, sketchGiftLeft } from "./sketchQuota.js";
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

/* ── Die großen Geschenke auf den vollen Ringen (Antons Entscheidung 10.10.) ─
 *
 * „Große Geschenke gibt es nur für Leute, die schon mal etwas gekauft
 * haben." Gerechnet am schlimmsten Fall (48 Glimpses, nur Pakete, kein
 * Abo): Wer kauft, bringt uns auch mit der ganzen Staffel nicht ins Minus;
 * wer nie kauft, machte jedes große Geschenk zum reinen Verlust.
 *
 *   24 → ein Traumfilm (FILM_GIFT Credits)          nach einem Kauf
 *   36 → zwei Traumfilme                            nach einem Kauf
 *   48 → 50 Credits, die volle Blüte                nach einem Kauf
 *   48 → 10 Glimpses (eigene Kategorie, sketchQuota) für alle anderen
 * Dazu bleibt an jedem vollen Ring der Film aus seinen 12 Träumen (iPhone).
 *
 * „Gekauft" = `paidAt`, gesetzt beim ersten bestätigten Apple-Kauf (Paket
 * oder Abo, Brücken-Befehl `purchase`). Entschieden wird, wenn der Platz
 * erreicht ist: Wer bei 24 noch nie gekauft hat und vor Traum 27 kauft,
 * bekommt den Film nachgereicht — danach ist der Platz vorbei.
 * Einkauf für uns: 98 Credits ≈ $2,77 je Käufer, 10 Glimpses ≈ $0,39 sonst.
 *
 * ⚠ Mit Konto führt der SERVER das Guthaben (S7) — dort müssen die
 * Credit-Geschenke gebucht werden, sonst sieht man sie nicht. Übergabe an
 * Hanni: docs/uebergabe/2026-10-10-hanni-server-aufnahmen-geschenke.md. */
export const BLOOM = 48;
export const BLOOM_CREDITS = 50;
export const BLOOM_GLIMPSES = 10;

/** Hat dieser Mensch schon einmal gekauft? */
export function isPaid(state) {
  return !!state?.paidAt;
}

/** Das große Geschenk auf Platz `num`, oder null. */
export function bigGiftAt(num, paid) {
  if (num === 24) return paid ? { kind: "ringFilm", credits: FILM_GIFT, glimpses: 0 } : null;
  if (num === 36) return paid ? { kind: "ringFilms", credits: 2 * FILM_GIFT, glimpses: 0 } : null;
  if (num === BLOOM) return paid ? { kind: "bloom", credits: BLOOM_CREDITS, glimpses: 0 } : { kind: "bloomGlimpses", credits: 0, glimpses: BLOOM_GLIMPSES };
  return null;
}

/** Was auf Platz `num` für diesen Menschen verschenkt wird, oder null.
 *  Die Viertel (3, 6, 9 …) je ein Glimpse — seit 10.10. in der eigenen
 *  Kategorie statt als 2 Credits im Geschenktopf; die vollen Ringe ihr
 *  großes Geschenk (oder nichts — der Ring-Film kommt vom iPhone). */
export function giftToGive(num, paid) {
  const slot = giftAtNum(num);
  if (!slot) return null;
  if (slot.kind === "glimpse") return { kind: "glimpse", credits: 0, glimpses: 1 };
  return bigGiftAt(num, paid);
}

/** Das fällige Geschenk, oder null.
 *
 *  ⚠ Seit 03.10. spätabends (Traum-Ring, dreamRing.js): Geschenke liegen
 *  auf den Vierteln jedes 12er-Rings — 3, 6, 9 je ein Glimpse, 12 der
 *  Film aus dem Ring (den macht das iPhone). Seit 10.10. dazu die großen
 *  Geschenke bei 24, 36, 48 (bigGiftAt). Die Leiter GIFTS oben bleibt nur
 *  für die alte Web-Ansicht stehen.
 *
 *  `giftedUpTo` merkt sich den letzten bezahlten Platz; Nummern laufen nur
 *  vorwärts, also zahlt nichts doppelt. Alte Stände ohne das Feld nehmen
 *  das höchste Viertel aus `streakGifts`. Genau ein Geschenk je Aufruf.
 *  `giftUnseen` hält es, bis die Startseite es geöffnet hat (`giftSeen`).
 *
 *  @returns {{nights:number, credits:number, glimpses:number, kind:string, patch:object}|null} */
export function giftFor(state, now = Date.now()) {
  const count = state?.count || 0;
  const given = Array.isArray(state?.streakGifts) ? state.streakGifts : [];
  const upTo = Number.isFinite(state?.giftedUpTo) ? state.giftedUpTo : Math.max(0, ...given.filter((n) => n % QUARTER === 0));
  const paid = isPaid(state);
  let num = nextGiftNum(upTo);
  let g = null;
  for (; num <= count; num = nextGiftNum(num)) {
    g = giftToGive(num, paid);
    if (g) break;
  }
  if (!g) return null;
  return {
    nights: num,
    credits: g.credits,
    glimpses: g.glimpses,
    kind: g.kind,
    patch: {
      ...(g.credits ? addGift(state, g.credits, now) : {}),
      ...(g.glimpses ? { glimpseGifts: sketchGiftLeft(state) + g.glimpses } : {}),
      giftedUpTo: num,
      giftUnseen: { nights: num, credits: g.credits, glimpses: g.glimpses, kind: g.kind, at: new Date(now).toISOString() },
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

/** Wie ein Geschenk heißt — „Dein erster Traumfilm", „20 Credits", „10 Glimpses". */
export function giftLabel(t, gift) {
  const kinds = t?.streakBoard?.giftKinds;
  const f = kinds?.[gift?.kind];
  const n = gift?.glimpses > 1 ? gift.glimpses : gift?.credits ?? 0;
  return f ? f(n) : `${n} credits`;
}

/** Geschenke, die Glimpses sind (eingelöst im Traum-Tab), statt Credits. */
export function isGlimpseGift(kind) {
  return kind === "glimpse" || kind === "bloomGlimpses";
}
