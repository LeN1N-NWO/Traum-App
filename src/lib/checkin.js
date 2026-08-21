/* Der Morgen-Check-in — Plan 2026-08-21-mehrwert-inhalte.md, P2a.
 *
 * Ein Tap: „Wie hast du geschlafen?", drei Stufen. Mehr nicht.
 *
 * ⚠ Der Plan wollte zusätzlich „Stimmung des Traums?". Bewusst NICHT gebaut
 * (Antons Entscheidung 21.08.): Die Analyse liefert `analysis.mood` ohnehin
 * für jeden Traum, und morgens auf Home ist die Frage sinnlos, solange noch
 * kein Traum eingetragen ist. Eine Doppelfrage, deren zweite Hälfte meistens
 * ins Leere geht, ist schlechter als eine, die immer passt. Die interessante
 * Korrelation (Schlaf × Stimmung) entsteht trotzdem — die Stimmung kommt aus
 * der Analyse, siehe sleepByMood().
 *
 * Alles hier ist reine Rechnung über `state.checkins`, kein API-Aufruf, kein
 * externes Gedächtnis (ADR-0001).
 */
import { localDateKey } from "./dreamDays.js";
import { realDreams } from "./atlas.js";

/* Drei Stufen, absichtlich grob. Fünf Stufen zwingen zum Nachdenken; hier
 * soll man antworten, bevor man wach ist. Die Zahlen sind sortierbar (der
 * Schnitt unten braucht sie), die Bedeutung steht in der i18n. */
export const SLEEP_LEVELS = [1, 2, 3];

/** Der Eintrag von heute — oder null. Tagesschlüssel in ORTSZEIT
 *  (localDateKey), nie über new Date(iso): genau daran ist die
 *  Ereignis-Zuordnung am 17.08. gescheitert, weil ein um 00:30 notierter
 *  Traum in UTC auf den Vortag fiel. */
export function checkinOn(checkins, date = new Date()) {
  const key = localDateKey(date);
  return (checkins || []).find((c) => c && c.date === key) || null;
}

/** Setzt (oder ersetzt) den heutigen Eintrag und gibt die NEUE Liste zurück.
 *  Rein: der Aufrufer entscheidet, ob er sie speichert.
 *
 *  Die Liste wird bei 400 Einträgen gekappt (gut ein Jahr) — localStorage
 *  hat ~5 MB für alles zusammen, und ein Check-in ist zwar winzig, aber
 *  unbegrenztes Wachstum ist genau die Sorte Leck, die erst auffällt, wenn
 *  das Tagebuch nicht mehr speichert (save() meldet es seit 07.08.). */
const MAX_CHECKINS = 400;
export function setCheckin(checkins, sleep, date = new Date()) {
  const n = Number(sleep);
  if (!SLEEP_LEVELS.includes(n)) return checkins || [];
  const key = localDateKey(date);
  const rest = (checkins || []).filter((c) => c && c.date !== key);
  return [...rest, { date: key, sleep: n }]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-MAX_CHECKINS);
}

/** Der Schnitt der letzten `days` Tage, oder null wenn nichts da ist.
 *  Für die Atlas-Kachel: eine Zahl, keine Kurve. */
export function sleepAverage(checkins, days = 30, now = new Date()) {
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - days);
  const key = localDateKey(cutoff);
  const recent = (checkins || []).filter((c) => c && c.date >= key && SLEEP_LEVELS.includes(c.sleep));
  if (!recent.length) return null;
  return recent.reduce((s, c) => s + c.sleep, 0) / recent.length;
}

/** Die Korrelation, für die der Check-in überhaupt existiert: Welche
 *  Traumstimmung fiel auf welche Schlafqualität?
 *
 *  Die Stimmung kommt aus `analysis.mood` (Freitext in Traumsprache) — der
 *  Check-in fragt sie NICHT noch einmal ab. Zugeordnet wird über den
 *  Kalendertag in Ortszeit: der Traum von heute Nacht gehört zum Check-in
 *  von heute Morgen.
 *
 *  @returns {{sleep: number, moods: {mood: string, count: number}[]}[]}
 *           je Schlafstufe die häufigsten Stimmungen, Stufe absteigend.
 */
export function sleepByMood(checkins, journal) {
  const byDay = new Map();
  for (const c of checkins || []) {
    if (c && SLEEP_LEVELS.includes(c.sleep)) byDay.set(c.date, c.sleep);
  }
  const buckets = new Map(SLEEP_LEVELS.map((s) => [s, new Map()]));
  for (const e of realDreams(journal)) {
    const mood = String(e.analysis?.mood || "").trim().toLowerCase();
    if (!mood) continue;
    const sleep = byDay.get(localDateKey(new Date(e.createdAt)));
    if (!sleep) continue;
    const m = buckets.get(sleep);
    m.set(mood, (m.get(mood) || 0) + 1);
  }
  return SLEEP_LEVELS.slice().reverse().map((sleep) => ({
    sleep,
    moods: [...buckets.get(sleep).entries()]
      .map(([mood, count]) => ({ mood, count }))
      .sort((a, b) => b.count - a.count || a.mood.localeCompare(b.mood)),
  })).filter((row) => row.moods.length);
}
