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
