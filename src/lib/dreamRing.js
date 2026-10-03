/* Der Traum-Ring (Antons Entwurf 03.10.2026, Variante A) — ersetzt den
 * Mondzyklus-Ring (moonCycle.js) auf der Startseite.
 *
 * Wie eine Uhr: 12 Plätze, die 12 oben, die 3 rechts, die 6 unten, die 9
 * links. Jeder Traum mit Glimpse oder Film füllt den nächsten freien Platz
 * — egal wann („Selbst wenn du ein Jahr brauchst, bis du deine 30 Träume
 * gefüllt hast, ist das vollkommen egal"). Kein Datum, keine leeren
 * Nächte, keine Serie. Ist der Ring voll, laufen die Nummern weiter
 * (13–24, 25–36 …) — „Warum müssen wir die Nummer neu setzen?"
 *
 * Geschenke sitzen symmetrisch auf den Vierteln: 3, 6, 9 je ein Glimpse
 * (in den Geschenk-Topf, credits.js), 12 = Ring voll → aus genau diesen 12
 * Träumen macht das iPhone gratis einen Film (glimpse-layer.tsx).
 *
 * Rein, ohne DOM — getestet in dreamRing.test.js. */
import { SKETCH_BASE } from "./sketchQuota.js";

export const RING_SIZE = 12;
export const QUARTER = 3;

/** Was auf Platz `num` (1, 2, 3 …) wartet — oder null. */
export function giftAtNum(num) {
  if (!(num > 0) || num % QUARTER !== 0) return null;
  if (num % RING_SIZE === 0) return { kind: "ring", credits: 0 };
  return { kind: "glimpse", credits: SKETCH_BASE };
}

/** Der nächste Platz mit Geschenk nach `count` Träumen. */
export function nextGiftNum(count) {
  return (Math.floor((count || 0) / QUARTER) + 1) * QUARTER;
}

/**
 * Der Ring, in dem der NÄCHSTE Traum landet.
 * @param {Array<{id:string, img:string|null, motif:string|null}>} films  Träume mit Bild, älteste zuerst
 * @returns {{ringNo:number, start:number, next:number, slots:Array, threads:Array<[number,number,string]>, top:{motif:string,n:number}|null}}
 */
export function dreamRing(films) {
  const list = films || [];
  const count = list.length;
  const ringNo = Math.floor(count / RING_SIZE) + 1;
  const start = (ringNo - 1) * RING_SIZE;                 // Nummern start+1 … start+12
  const slots = [];
  for (let k = 1; k <= RING_SIZE; k++) {
    const num = start + k;
    const d = list[num - 1] || null;
    slots.push({
      num, pos: k % RING_SIZE,                            // 0 = oben (die 12), 3 = rechts …
      dreamId: d ? d.id : null, img: d ? d.img || null : null, motif: d ? d.motif || null : null,
      gift: giftAtNum(num),
    });
  }
  const lastOf = new Map(), threads = [], n = new Map();
  for (const s of slots) {
    if (!s.dreamId || !s.motif) continue;
    if (lastOf.has(s.motif)) threads.push([lastOf.get(s.motif), s.num, s.motif]);
    lastOf.set(s.motif, s.num);
    n.set(s.motif, (n.get(s.motif) || 0) + 1);
  }
  const [topMotif, topN] = [...n.entries()].sort((a, b) => b[1] - a[1])[0] || [];
  return { ringNo, start, next: count + 1, slots, threads, top: topN ? { motif: topMotif, n: topN } : null };
}

/** Ein voller Ring, dessen Film noch fehlt — oder null.
 *  `done` = die Schlüssel schon gemachter Filme (state.moonFilms). */
export function pendingRingFilm(films, done = []) {
  const list = films || [];
  const full = Math.floor(list.length / RING_SIZE);
  for (let r = 1; r <= full; r++) {
    const key = `ring-${r}`;
    if (done.includes(key)) continue;
    const dreams = list.slice((r - 1) * RING_SIZE, r * RING_SIZE);
    const n = new Map();
    for (const d of dreams) if (d.motif) n.set(d.motif, (n.get(d.motif) || 0) + 1);
    const [motif, times] = [...n.entries()].sort((a, b) => b[1] - a[1])[0] || [];
    return { key, ringNo: r, dreams, motif: times > 1 ? motif : null };
  }
  return null;
}
