/* Der getippte Weg durch die Einführungsumfrage — die Felder und die
 * Umrechnung in dasselbe Profil, das auch die Stimme liefert.
 *
 * ── Warum es das gibt (Befund vom 23.08.2026) ─────────────────────────────
 * Die Umfrage war NUR gesprochen. Ohne `GEMINI_KEY`, ohne Mikrofon-Erlaubnis
 * oder ohne stabile Verbindung endete sie in einer Fehlerzeile, und der
 * „fertig"-Knopf ist dort abgeschaltet (`state !== "live"`). Der einzige
 * Ausgang war das ×. Ergebnis: **gar kein Profil** — kein Name, kein Ziel,
 * keine Themen, und damit nichts, worauf Atlas, Empfehlungen und der
 * Traumbogen später aufbauen könnten. Auch die Willkommens-Credits gab es
 * nicht, weil die an `surveyDone` hängen.
 *
 * Das trifft nicht nur Fehlerfälle. Es trifft jeden, der um drei Uhr nachts
 * neben einem schlafenden Menschen liegt und nicht sprechen WILL.
 *
 * ── Die eine Regel, die diese Datei durchsetzt ────────────────────────────
 * ⚠ Der getippte Weg erfindet KEIN eigenes Vokabular. Die erlaubten Werte
 * unten sind wörtlich die Enums aus `ONBOARDING_TOOLS` (server.js), und die
 * Beschriftungen holt die Oberfläche aus `t.dreamer.*Values` — dieselben
 * Texte, die auch der Traumbogen anzeigt. Eine zweite Liste wäre eine
 * Liste, die driftet: Ein Wert, den nur der getippte Weg kennt, fiele im
 * Traumbogen auf seinen rohen Schlüssel zurück („almost-never" statt
 * „Fast nie"), und das sähe aus wie ein Fehler, weil es einer wäre.
 *
 * Deshalb liegen Felder und Umrechnung HIER und nicht im Formular: So sind
 * sie ohne DOM prüfbar, und der Abgleich mit den Werkzeugen ist ein Test,
 * keine Absichtserklärung.
 */

/* Die Enums, wörtlich aus ONBOARDING_TOOLS. Reihenfolge = Reihenfolge im
 * Formular, und die ist nicht beliebig: Der Name steht vorn, weil er die
 * leichteste Frage ist; das Ziel an zweiter Stelle, weil es seit dem
 * 23.08. die inhaltlich wichtigste ist (es entscheidet, was die App
 * überhaupt anbietet). Der Geburtstag steht hinten — er ist die einzige
 * Frage, die jemand als zudringlich empfinden kann. */
export const FORM_FIELDS = [
  { key: "name", kind: "text", maxLength: 40 },
  { key: "goal", kind: "choice", values: ["remember", "understand", "create", "sleep-better", "nightmares"] },
  { key: "recall", kind: "choice", values: ["nightly", "weekly", "rarely", "almost-never"] },
  { key: "lucid", kind: "choice", values: ["never-heard", "curious", "tried", "practicing"] },
  { key: "sleepHours", kind: "choice", values: ["under-6", "6-7", "7-8", "8-9", "over-9"] },
  { key: "timeBudget", kind: "choice", values: ["5", "10", "20", "30", "60plus"] },
  { key: "themes", kind: "chips", maxItems: 12, maxLength: 60 },
  { key: "birthday", kind: "date" },
];

/* Das leere Profil — dieselbe Form wie `collected.current` in
 * OnboardingSurvey.jsx. ⚠ Wer dort ein Feld ergänzt, ergänzt es hier: Ein
 * Profil mit fehlendem Schlüssel ist kein Fehler, den irgendwer sieht, es
 * ist nur eine Zeile, die im Traumbogen für immer leer bleibt. */
export function emptyProfile() {
  return {
    name: "", birthday: "", zodiac: null, recall: "", lucid: "", themes: [], goal: "",
    sleepHours: "", timeBudget: "", reminders: null,
  };
}

const FIELD = Object.fromEntries(FORM_FIELDS.map((f) => [f.key, f]));

/** Ein Auswahlwert, der NICHT in der Liste steht, wird verworfen — nicht
 *  durchgereicht. Er käme aus einem veralteten Formular oder aus einem
 *  manipulierten Zustand, und im Traumbogen stünde danach sein roher
 *  Schlüssel. Lieber eine leere Zeile als eine falsche. */
function choice(key, value) {
  const f = FIELD[key];
  return f?.values?.includes(String(value)) ? String(value) : "";
}

/** Themen: getrimmt, leere raus, Duplikate raus, gedeckelt.
 *  Dieselben Grenzen wie im Sprachweg (12 Stück, 60 Zeichen) — der
 *  Traumbogen zeigt sie nebeneinander an und weiß nicht, woher sie kamen. */
function themes(list) {
  const out = [];
  for (const raw of Array.isArray(list) ? list : []) {
    const clean = String(raw || "").trim().slice(0, FIELD.themes.maxLength);
    if (clean && !out.includes(clean)) out.push(clean);
    if (out.length >= FIELD.themes.maxItems) break;
  }
  return out;
}

/** Ein Datum nur, wenn es die Form YYYY-MM-DD hat.
 *
 *  ⚠ Kein `new Date()`-Test: Der Sprachweg lässt ausdrücklich `0000` als
 *  Jahr zu (wer nur Tag und Monat nennt), und `new Date("0000-05-14")`
 *  wäre je nach Laufzeit gültig oder nicht. Geprüft wird die FORM, den Rest
 *  entscheidet `zodiacOf` — dieselbe Funktion wie im Sprachweg. */
function birthday(value) {
  const clean = String(value || "").trim().slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(clean) ? clean : "";
}

/** Antworten aus dem Formular → das Profil, das `onDone` erwartet.
 *
 *  `zodiacFor` wird hereingereicht statt importiert, damit diese Datei ohne
 *  weitere Abhängigkeit testbar bleibt; das Formular gibt `zodiacOf` mit —
 *  dieselbe Funktion, die auch der Sprachweg benutzt.
 *
 *  Alles ist optional und bleibt leer. Das ist der Vertrag mit onDone(),
 *  und er ist im Sprachweg derselbe: Wer nichts sagt, bekommt trotzdem ein
 *  Profil — nur ein leeres. */
export function profileFromAnswers(answers = {}, zodiacFor = () => null) {
  const p = emptyProfile();
  p.name = String(answers.name || "").trim().slice(0, FIELD.name.maxLength);
  p.goal = choice("goal", answers.goal);
  p.recall = choice("recall", answers.recall);
  p.lucid = choice("lucid", answers.lucid);
  p.sleepHours = choice("sleepHours", answers.sleepHours);
  p.timeBudget = choice("timeBudget", answers.timeBudget);
  p.themes = themes(answers.themes);
  p.birthday = birthday(answers.birthday);
  p.zodiac = p.birthday ? zodiacFor(p.birthday) : null;
  /* ⚠ `reminders` bleibt hier IMMER null. Der getippte Weg fragt nicht
     danach — und das ist Absicht, keine Auslassung: Der Erinnerungswunsch
     führt zum iOS-Systemdialog, und den gibt es genau einmal (siehe
     lib/reminders.js). Eine beiläufig angekreuzte Kästchen-Frage in einem
     Formular ist ein schlechterer Ort dafür als ein bewusster Tipp später. */
  return p;
}

/** Hat jemand überhaupt etwas gesagt? Entscheidet, ob der „fertig"-Knopf
 *  ein Profil verspricht oder nur höflich zumacht. */
export function hasAnything(profile) {
  if (!profile) return false;
  return Boolean(
    profile.name || profile.goal || profile.recall || profile.lucid ||
    profile.sleepHours || profile.timeBudget || profile.birthday ||
    (profile.themes || []).length,
  );
}
