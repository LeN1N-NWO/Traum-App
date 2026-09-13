/* Der Wunsch nach Erinnerungen — und warum er NICHT dasselbe ist wie die
 * Erlaubnis dafür.
 *
 * Antons Frage vom 23.08.: Kann der Sprachassistent die Benachrichtigung
 * gleich freischalten, wenn jemand im Gespräch „ja" sagt? Muss man das
 * trotzdem noch antippen?
 *
 * Technisch: ja, ginge. Ein Werkzeugaufruf könnte die System-Abfrage
 * auslösen. Gemacht wird es trotzdem nicht, aus einem Grund, der keine
 * Geschmacksfrage ist:
 *
 *   **iOS vergibt für die Benachrichtigungs-Erlaubnis genau EINEN
 *   Versuch.** Wird sie abgelehnt, darf die App nie wieder fragen — die
 *   Erlaubnis ist dann nur noch in den Systemeinstellungen zu holen,
 *   wohin niemand geht.
 *
 * Damit ist die Sache asymmetrisch: Ein Tipp zu viel kostet eine Sekunde,
 * ein verhörtes „nein" kostet die Funktion für immer. Spracherkennung ist
 * gut, aber nicht so gut. Dazu kommt: Der Systemdialog erscheint MITTEN
 * im Gespräch, während das Mikrofon läuft — der denkbar schlechteste
 * Moment, um jemanden vor eine unwiderrufliche Wahl zu stellen.
 *
 * Die Aufteilung ist deshalb:
 *   · Die STIMME sammelt die Absicht ein (setReminderWish) — beiläufig,
 *     im Fluss des Gesprächs, ohne Systemdialog.
 *   · Der FINGER gibt sie frei, später, an einer ruhigen Stelle, mit
 *     einem Knopf, auf dem steht, was er tut.
 *
 * Der Gewinn bleibt trotzdem der ganze: Der Systemdialog erscheint nur
 * noch für Leute, die schon Ja gesagt haben. Genau darum geht es bei der
 * Vorab-Frage — nicht darum, den Tipp zu sparen.
 *
 * ⚠ Hier wird nichts angefordert und nichts gesendet. Diese Datei ist
 * reine Zustandslogik; die Erlaubnis selbst holt die native Schicht nach
 * der Xcode-Portierung (docs/plans/2026-08-23-shape-auswertung.md §1).
 */

/* Wie viele Erinnerungen am Tag höchstens. Vier, weil die untersuchten
   Apps bei vier aufhören und weil die fünfte niemanden mehr erinnert,
   sondern nur noch stört. */
export const MAX_PER_DAY = 4;
export const DEFAULT_PER_DAY = 2;

/** Was aus einer Antwort im Gespräch wird. Rein: gibt den Patch zurück,
 *  speichert nichts.
 *
 *  `granted` bleibt bewusst UNBERÜHRT — der Wunsch ist keine Erlaubnis.
 *  Wer die beiden Felder je zusammenlegt, hat den ganzen Punkt dieser
 *  Datei aufgehoben. */
export function reminderWish(wants, perDay) {
  if (typeof wants !== "boolean") return null;
  const n = Math.round(Number(perDay));
  return {
    wants,
    perDay: wants ? (n >= 1 && n <= MAX_PER_DAY ? n : DEFAULT_PER_DAY) : 0,
    askedAt: null,
  };
}

/** Darf die App JETZT den Systemdialog zeigen?
 *
 *  Drei Bedingungen, und alle drei sind Sperren gegen denselben Fehler —
 *  den einen Versuch zu verbrennen:
 *    1. Jemand muss den Wunsch geäußert haben. Ohne Ja kein Dialog.
 *    2. Der Dialog darf nicht schon einmal gezeigt worden sein: Ein
 *       zweiter Aufruf tut auf iOS gar nichts, sieht für den Menschen
 *       aber aus, als wäre der Knopf kaputt.
 *    3. Es darf nicht schon erlaubt sein — dann gäbe es nichts zu fragen.
 */
export function mayAskForPermission(reminders) {
  if (!reminders || reminders.wants !== true) return false;
  if (reminders.askedAt) return false;
  if (reminders.granted === true) return false;
  return true;
}

/** Was der Knopf zeigen soll. Vier Zustände, und jeder hat einen anderen
 *  nächsten Schritt — deshalb eine Funktion und keine Kette von `&&` in
 *  der Oberfläche.
 *
 *  @returns {"hidden"|"ask"|"blocked"|"on"}
 *    hidden  — kein Wunsch geäußert, der Knopf hat nichts zu suchen
 *    ask     — Wunsch da, Dialog noch nie gezeigt: der Knopf fragt
 *    blocked — Dialog war da und wurde abgelehnt: nur noch Einstellungen
 *    on      — läuft
 */
export function reminderState(reminders) {
  if (!reminders || reminders.wants !== true) return "hidden";
  if (reminders.granted === true) return "on";
  if (reminders.askedAt) return "blocked";
  return "ask";
}

/** Das Ergebnis des Systemdialogs festhalten. `askedAt` wird IMMER
 *  gesetzt, auch bei Zustimmung — es beantwortet „wurde schon gefragt?",
 *  nicht „wurde abgelehnt?". Die beiden zu verwechseln hieße, jemandem
 *  nach einem Ja denselben Dialog noch einmal anzubieten. */
export function reminderAnswered(reminders, granted, now = Date.now()) {
  return { ...(reminders || { wants: true, perDay: DEFAULT_PER_DAY }), granted: !!granted, askedAt: now };
}

/* ── Der Plan, seit es die native Schicht gibt (13.09.2026) ────────────────
 *
 * Antons Ansage: „Serie, Check-in, Erinnerung, Rekorder um drei Uhr nachts —
 * das muss alles gebaut werden jetzt." Und: „Wenn jemand aus dem Schlaf
 * kommt, die App anmachen und nicht noch einmal klicken müssen."
 *
 * Drei Erinnerungen und ein Verhalten:
 *   morning     täglich (Vorgabe 07:30) „Was hast du geträumt?" → Rekorder
 *   evening     täglich (Vorgabe 22:00) „Zeit zum Runterkommen" → Schlaf-Tab
 *   reality     die Realitätschecks (wants/perDay von oben), 10–20 Uhr
 *   autoRecord  App morgens geöffnet, heute noch nichts eingetragen →
 *               der Rekorder läuft sofort (einmal je Tag)
 *
 * Alles hier ist rein: Die native Schicht (mobile/src/lib/notifications.ts)
 * liest den Plan und plant; diese Datei entscheidet nur, WAS geplant wird. */
export const DEFAULT_TIMES = { morning: "07:30", evening: "22:00" };
export const REALITY_WINDOW = { from: 10, to: 20 };
export const AUTO_RECORD_WINDOW = { from: 3, to: 11 };

const TIME = /^([01]\d|2[0-3]):([0-5]\d)$/;
export function parseTime(value, fallback) {
  const m = TIME.exec(String(value || "")) || TIME.exec(fallback);
  return { hour: Number(m[1]), minute: Number(m[2]) };
}

/** Der vollständige Plan aus dem gespeicherten Zustand — mit Vorgaben für
 *  alles, was noch nie eingestellt wurde. Morgens und abends starten AUS:
 *  Eingeschaltet wird mit einem Tipp (Startseite oder Einstellungen), nie
 *  still im Hintergrund. `autoRecord` startet AN — es ist keine
 *  Benachrichtigung, sondern Antons Wunsch an das Öffnen der App. */
export function reminderPlan(reminders) {
  const r = reminders || {};
  return {
    morning: { on: r.morning?.on === true, time: TIME.test(r.morning?.time) ? r.morning.time : DEFAULT_TIMES.morning },
    evening: { on: r.evening?.on === true, time: TIME.test(r.evening?.time) ? r.evening.time : DEFAULT_TIMES.evening },
    reality: { on: r.wants === true, perDay: r.wants === true ? (r.perDay || DEFAULT_PER_DAY) : 0 },
    autoRecord: r.autoRecord !== false,
  };
}

/** Eine Einstellung ändern. Rein, gibt den neuen Zustand zurück. */
export function setReminder(reminders, key, patch) {
  const r = { ...(reminders || {}) };
  if (key === "morning" || key === "evening") {
    const cur = reminderPlan(r)[key];
    const time = TIME.test(patch?.time) ? patch.time : cur.time;
    r[key] = { on: typeof patch?.on === "boolean" ? patch.on : cur.on, time };
  } else if (key === "autoRecord") {
    r.autoRecord = patch?.on !== false;
  } else if (key === "dismissAsk") {
    r.homeAskDismissed = true;
  }
  return r;
}

/** Ist irgendetwas eingeschaltet, das eine Benachrichtigung braucht? */
export function needsNotifications(reminders) {
  const p = reminderPlan(reminders);
  return p.morning.on || p.evening.on || p.reality.on;
}

/** Die Uhrzeiten der Realitätschecks für EINEN Tag: das Fenster in gleiche
 *  Stücke geteilt, in jedem Stück ein Zeitpunkt — gestreut, damit der Check
 *  nicht zur Routine wird (sonst prüft man um 14:00, nicht im Traum), aber
 *  deterministisch je Tag, damit ein erneutes Planen dieselben Zeiten ergibt. */
export function realityTimes(perDay, dayKey) {
  const n = Math.max(0, Math.min(MAX_PER_DAY, Math.round(Number(perDay) || 0)));
  if (!n) return [];
  let h = 2166136261;
  for (const ch of String(dayKey)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
  const rnd = () => { h = Math.imul(h ^ (h >>> 13), 1103515245) >>> 0; return (h % 10000) / 10000; };
  const span = (REALITY_WINDOW.to - REALITY_WINDOW.from) * 60;
  const slot = span / n;
  return Array.from({ length: n }, (_, i) => {
    const minute = Math.floor(REALITY_WINDOW.from * 60 + i * slot + slot * (0.15 + rnd() * 0.7));
    return { hour: Math.floor(minute / 60), minute: minute % 60 };
  });
}

/** Soll die App beim Öffnen sofort den Rekorder zeigen? Nur morgens, nur
 *  wenn heute noch kein Traum eingetragen ist, nur einmal je Tag — wer die
 *  App danach ein zweites Mal öffnet, will etwas anderes. */
export function shouldAutoRecord(reminders, { now = new Date(), todayKey, hasEntryToday }) {
  if (!reminderPlan(reminders).autoRecord) return false;
  const hour = now.getHours();
  if (hour < AUTO_RECORD_WINDOW.from || hour >= AUTO_RECORD_WINDOW.to) return false;
  if (hasEntryToday) return false;
  return reminders?.lastAutoOpen !== todayKey;
}
