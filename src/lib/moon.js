/* Die Mondphase eines Tages — gerechnet, nicht abgefragt.
 *
 * Antons Wunsch 12.09.2026: Im Journal sollen die aktuellen Mondphasen
 * stehen, und ein gespeicherter Traum soll die Phase SEINER Nacht behalten.
 *
 * ⚠ Ortsunabhängig, und das ist keine Vereinfachung: Die Phase ist der
 * Winkel zwischen Sonne, Erde und Mond — zur selben Minute sehen Berlin und
 * Sydney denselben beleuchteten Anteil. Ortsabhängig sind nur Auf- und
 * Untergang und die DREHUNG der Sichel (auf der Südhalbkugel liegt sie
 * spiegelbildlich). Deshalb braucht das hier keinen Standort und keine
 * Erlaubnis; nur das Datum.
 *
 * Rechenweg: mittleres synodisches Monat (29,530588853 Tage) ab einem
 * bekannten Neumond. Das ist die klassische Näherung — sie liegt gegenüber
 * den echten Ephemeriden um bis zu ±14 Stunden daneben, also unter einem
 * halben Tag. Für „welche Phase hatte die Nacht?" genügt das; für
 * Finsternisse oder Gezeiten nicht, und beides steht nicht an.
 *
 * Als Anker dient der Neumond vom 6. Januar 2000, 18:14 UTC — der
 * Standardwert aus Meeus' „Astronomical Algorithms".
 */
const SYNODIC = 29.530588853;                    // Tage von Neumond zu Neumond
const NEW_MOON_2000 = Date.UTC(2000, 0, 6, 18, 14) / 86400000;   // in Tagen

/** Wie weit der Mond im Zyklus ist: 0 = Neumond, 0,5 = Vollmond, <1. */
export function moonAge(date = new Date()) {
  const tage = (date instanceof Date ? date.getTime() : new Date(date).getTime()) / 86400000;
  const zyklen = (tage - NEW_MOON_2000) / SYNODIC;
  return zyklen - Math.floor(zyklen);
}

/* Die acht Phasen, wie sie jeder Kalender führt. Die vier „Punkte"
   (Neumond, Halbmonde, Vollmond) sind SCHMALER als die vier Zwischenphasen:
   sie bezeichnen einen Augenblick, nicht eine Woche. Ein Tag daneben und es
   ist wieder „zunehmend" — deshalb ±1/32 Zyklus (etwa 22 Stunden) um den
   Punkt, der Rest teilt sich auf die Zwischenphasen. */
export const MOON_PHASES = ["new", "waxingCrescent", "firstQuarter", "waxingGibbous", "full", "waningGibbous", "lastQuarter", "waningCrescent"];

/** Der Phasen-Schlüssel zu einem Datum (→ MOON_PHASES, i18n `t.moon.*`). */
export function moonPhase(date = new Date()) {
  const a = moonAge(date);
  const punkt = 1 / 32;
  if (a < punkt || a >= 1 - punkt) return "new";
  if (Math.abs(a - 0.25) < punkt) return "firstQuarter";
  if (Math.abs(a - 0.5) < punkt) return "full";
  if (Math.abs(a - 0.75) < punkt) return "lastQuarter";
  if (a < 0.25) return "waxingCrescent";
  if (a < 0.5) return "waxingGibbous";
  if (a < 0.75) return "waningGibbous";
  return "waningCrescent";
}

/** Wie viel vom Mond leuchtet: 0 = dunkel, 1 = voll. */
export function moonIllumination(date = new Date()) {
  return (1 - Math.cos(2 * Math.PI * moonAge(date))) / 2;
}

/** Nimmt der Mond zu? (Für die Drehung der Sichel in der Darstellung.) */
export function moonWaxing(date = new Date()) {
  return moonAge(date) < 0.5;
}

/** Alles, was am Traum gespeichert wird — klein und ohne Ortsbezug.
 *
 *  ⚠ Die NACHT gehört dem Vorabend: Wer um 03:00 aufschreibt, hat in der
 *  Nacht des Vortags geträumt. Deshalb zieht `forNight` vor 12:00 Ortszeit
 *  einen Tag ab — dieselbe Regel, mit der die Serie zählt (streak.js).
 */
export function moonForNight(date = new Date()) {
  const d = date instanceof Date ? new Date(date.getTime()) : new Date(date);
  if (d.getHours() < 12) d.setDate(d.getDate() - 1);
  d.setHours(22, 0, 0, 0);                       // die Nacht, nicht der Moment
  return { phase: moonPhase(d), illum: Math.round(moonIllumination(d) * 100) / 100, waxing: moonWaxing(d), at: d.toISOString() };
}

/** Die Tage um heute für den Streifen im Journal (Antons Referenz: SUN 24
 *  … THU 28). `before`/`after` in Tagen, Vorgabe zwei zurück, zwei vor. */
export function moonStrip(date = new Date(), before = 2, after = 2) {
  const heute = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 22, 0, 0, 0);
  const out = [];
  for (let k = -before; k <= after; k++) {
    const d = new Date(heute.getTime());
    d.setDate(d.getDate() + k);
    out.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
      day: d.getDate(), weekday: d.getDay(), today: k === 0,
      phase: moonPhase(d), illum: Math.round(moonIllumination(d) * 100) / 100, waxing: moonWaxing(d),
    });
  }
  return out;
}
