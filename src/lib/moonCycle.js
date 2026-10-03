/* Der Mondzyklus auf der Startseite (Antons Wahl 03.10.2026: „Der Ring mit
 * Fäden"). Ein Ring aus den Nächten von Vollmond zu Vollmond; jede Nacht mit
 * Traum zeigt ihr Bild, Nächte mit demselben Motiv verbindet ein Faden quer
 * durch den Ring. Am Morgen nach dem nächsten Vollmond macht das iPhone aus
 * den Bildern des Zyklus den MONDFILM — er ist die Belohnung, nicht Credits.
 *
 * Reine Rechnung, damit Brücke und Tests dieselben Tage sehen. Tage sind
 * Kalendertage in Ortszeit (nights.js dayKey) — wie die Serie. */
import { moonAge } from "./moon.js";
import { dayKey } from "./nights.js";

const SYNODIC = 29.530588853;
const DAY = 864e5;

/** Die letzten beiden und der nächste Vollmond (genaue Zeitpunkte). */
export function fullMoons(now = new Date()) {
  const a = moonAge(now);                                  // 0 = Neumond, 0,5 = Vollmond
  const since = (((a - 0.5) % 1) + 1) % 1 * SYNODIC;       // Tage seit dem letzten Vollmond
  const last = new Date(now.getTime() - since * DAY);
  return { prev: new Date(last.getTime() - SYNODIC * DAY), last, next: new Date(last.getTime() + SYNODIC * DAY) };
}

function addDays(d, n) {
  const x = new Date(d);
  x.setHours(12, 0, 0, 0);
  x.setDate(x.getDate() + n);
  return x;
}

/** Die Nächte eines Zyklus als Kalendertage: der Tag NACH dem Vollmond bis
 *  einschließlich des Vollmond-Tags danach (29 oder 30 Nächte). */
export function cycleDays(fromFull, toFull) {
  const out = [];
  const end = dayKey(toFull);
  for (let d = addDays(fromFull, 1), i = 0; i < 40; i++, d = addDays(d, 1)) {
    const k = dayKey(d);
    out.push(k);
    if (k === end) break;
  }
  return out;
}

/**
 * Der Ring für heute.
 * @param {Array<{id:string, day:string, motif:string|null, img:string|null}>} dreams  echte Träume (ohne Mondfilme)
 * @returns {{days: Array, threads: Array<[number, number, string]>, left: number, count: number, top: {motif:string, n:number}|null, nextFull: Date}}
 */
export function cycleRing(dreams, now = new Date()) {
  const { last, next } = fullMoons(now);
  const keys = cycleDays(last, next);
  const today = dayKey(now);
  const byDay = new Map();
  for (const d of dreams) {
    if (!keys.includes(d.day)) continue;
    const cur = byDay.get(d.day);
    // Pro Nacht EIN Bild: am liebsten ein Traum mit Bild.
    if (!cur || (!cur.img && d.img)) byDay.set(d.day, d);
  }
  const days = keys.map((k, i) => {
    const d = byDay.get(k) || null;
    return { key: k, index: i, today: k === today, future: k > today, dreamId: d?.id ?? null, img: d?.img ?? null, motif: d?.motif ?? null };
  });
  // Fäden: aufeinanderfolgende Nächte mit demselben Motiv.
  const lastOf = new Map(), threads = [], count = new Map();
  for (const d of days) {
    if (!d.dreamId || !d.motif) continue;
    if (lastOf.has(d.motif)) threads.push([lastOf.get(d.motif), d.index, d.motif]);
    lastOf.set(d.motif, d.index);
    count.set(d.motif, (count.get(d.motif) || 0) + 1);
  }
  const [topMotif, topN] = [...count.entries()].sort((a, b) => b[1] - a[1])[0] || [];
  const ti = keys.indexOf(today);
  return {
    days, threads, nextFull: next,
    left: ti < 0 ? keys.length : keys.length - 1 - ti,
    count: days.filter((d) => d.dreamId).length,
    top: topN ? { motif: topMotif, n: topN } : null,
  };
}

/** Ist ein Mondfilm fällig? Der zuletzt VOLLENDETE Zyklus, sobald der Tag
 *  nach seinem Vollmond da ist, mit mindestens `min` Bildern, und noch
 *  nicht gemacht (`done` = Schlüssel bisheriger Filme). */
export function pendingMoonFilm(dreams, done = [], now = new Date(), min = 3) {
  const { prev, last } = fullMoons(now);
  const key = dayKey(last);
  if (done.includes(key) || dayKey(now) <= key) return null;
  const keys = new Set(cycleDays(prev, last));
  const picks = dreams.filter((d) => keys.has(d.day) && d.img).sort((a, b) => (a.day < b.day ? -1 : 1));
  if (picks.length < min) return null;
  const count = new Map();
  for (const d of picks) if (d.motif) count.set(d.motif, (count.get(d.motif) || 0) + 1);
  const top = [...count.entries()].sort((a, b) => b[1] - a[1])[0] || null;
  return { key, full: last, dreams: picks, motif: top ? top[0] : null };
}
