/* Die EINE Zählung der Nächte (Antons Befund 28.09.2026: Die Serie zeigte
 * „1 Tag", das Journal sieben Träume, die Sterne wieder etwas anderes — und
 * „Nichts hängengeblieben" zählte als Traum).
 *
 * Ab jetzt rechnen Sterne, Serie, Geschenke und Schlummernächte alle aus
 * dem JOURNAL, nicht aus mitgeführten Zählern (state.streak/lastDream
 * liefen auseinander, weil nicht jeder Speicherweg sie hochzählte):
 *
 *   · Ein Traum-Tag ist ein KALENDERTAG in Ortszeit, an dem mindestens ein
 *     echter Traum steht. Sieben Träume an einem Tag sind ein Tag.
 *   · „Nichts hängengeblieben" ist KEIN Traum: Es zählt nirgends mit, hält
 *     aber die Serie offen — wie eine Schlummernacht (so steht es auch auf
 *     dem Knopf: „hält deine Serie").
 *   · Die Serie = Traum-Tage in Folge bis heute; ist heute noch nichts
 *     notiert, zählt sie bis gestern und steht „auf der Kippe".
 *
 * ⚠ Ortszeit, nicht UTC: Das alte todayStr() nahm toISOString() — ein
 * Traum um 1 Uhr nachts in Berlin landete damit auf dem Vortag. */
import { isBlank } from "./blankNight.js";

const isSeed = (e) => String(e?.id || "").startsWith("e_seed");

/** Der Mondfilm (03.10., moonCycle.js) steht im Journal, ist aber KEIN
 *  Traum: Er zählt weder für Serie noch Ring. */
export const MOON_FILM_KIND = "moonfilm";
export function isMoonFilm(entry) {
  return entry?.kind === MOON_FILM_KIND;
}

/** Kalendertag in Ortszeit, „2026-09-28". */
export function dayKey(d) {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
}
function shift(d, days) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);   // über setDate: Sommerzeit-Wechsel bleiben ein Tag
  return x;
}

/** Tage mit mindestens einem echten Traum. */
export function dreamDays(journal) {
  const out = new Set();
  for (const e of journal || []) {
    if (!e || isSeed(e) || isBlank(e) || isMoonFilm(e)) continue;
    const t = new Date(e.createdAt);
    if (!isNaN(t)) out.add(dayKey(t));
  }
  return out;
}

/** Tage mit „Nichts hängengeblieben". */
export function blankDays(journal) {
  const out = new Set();
  for (const e of journal || []) if (e && isBlank(e) && !isNaN(new Date(e.createdAt))) out.add(dayKey(e.createdAt));
  return out;
}

/** Wie viele Traum-Tage insgesamt — die Sterne. */
export function dreamNightCount(journal) {
  return dreamDays(journal).size;
}

/**
 * Die Serie aus dem Journal.
 * @param {Array} journal
 * @param {{bridged?: string[], now?: Date}} opts  bridged = von Schlummernächten überbrückte Tage
 * @returns {{streak: number, atRisk: boolean, today: boolean}}
 */
export function streakInfo(journal, { bridged = [], now = new Date() } = {}) {
  const dreams = dreamDays(journal), blanks = blankDays(journal), bridge = new Set(bridged);
  const held = (k) => blanks.has(k) || bridge.has(k);
  const todayKey = dayKey(now);
  const todayDone = dreams.has(todayKey) || held(todayKey);
  let cursor = todayDone ? now : shift(now, -1);
  let streak = 0;
  for (let i = 0; i < 3660; i++) {
    const k = dayKey(cursor);
    if (dreams.has(k)) streak += 1;
    else if (!held(k)) break;
    cursor = shift(cursor, -1);
  }
  return { streak, atRisk: streak > 0 && !todayDone, today: todayDone };
}

/** Verpasste Nächte zwischen dem letzten notierten Tag und gestern —
 *  was eine Schlummernacht schließen müsste. Leer, wenn es keine Lücke
 *  gibt oder vor ihr keine Serie stand. */
export function missedNights(journal, { bridged = [], now = new Date() } = {}) {
  const dreams = dreamDays(journal), blanks = blankDays(journal), bridge = new Set(bridged);
  const active = (k) => dreams.has(k) || blanks.has(k) || bridge.has(k);
  if (active(dayKey(now))) return [];
  const missed = [];
  let cursor = shift(now, -1);
  for (let i = 0; i < 60; i++) {
    const k = dayKey(cursor);
    if (active(k)) break;
    missed.push(k);
    cursor = shift(cursor, -1);
  }
  if (missed.length === 60) return [];
  // Vor der Lücke muss eine Serie stehen — sonst gibt es nichts zu retten.
  const before = streakInfo(journal, { bridged, now: shift(cursor, 0) });
  return before.streak > 0 && missed.length ? missed : [];
}

/** Schlummernacht einlösen? {used, patch} oder null. Idempotent: Die
 *  überbrückten Tage stehen danach in snoozeDays, die Lücke ist zu. */
export function snoozeBridge(state, now = new Date()) {
  const have = state?.snoozes || 0;
  if (!have) return null;
  const missed = missedNights(state.journal, { bridged: state.snoozeDays || [], now });
  if (!missed.length || missed.length > have) return null;
  return { used: missed.length, patch: { snoozeDays: [...(state.snoozeDays || []), ...missed], snoozes: have - missed.length } };
}

/** Je sieben Traum-Tage in Folge eine Schlummernacht, höchstens zwei. */
export function snoozeEarn(state, streak, now = new Date(), every = 7, max = 2) {
  const today = dayKey(now);
  if (!streak || streak % every !== 0 || state?.snoozeEarnedDay === today || (state?.snoozes || 0) >= max) return null;
  return { patch: { snoozes: (state?.snoozes || 0) + 1, snoozeEarnedDay: today } };
}
