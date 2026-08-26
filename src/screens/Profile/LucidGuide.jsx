import { useState } from "react";
import { useAppState } from "../../state/AppState.jsx";
import { reminderWish, reminderState, MAX_PER_DAY, DEFAULT_PER_DAY } from "../../lib/reminders.js";
import { t } from "../../i18n/index.js";
import "./profile.css";

/* The lucid dreaming guide — rebuilt 10.08.2026 from the evidence rather
 * than from folklore.
 *
 * Everything here traces to the International Lucid Dream Induction Study
 * (Aspy 2020, n=355, one week of practice) because it is the only large
 * head-to-head comparison of the popular techniques that exists. That has
 * consequences for what this screen says, and two of them are unusual:
 *
 *   1. The LEVERS come before the methods. In that study the choice of
 *      technique mattered less than falling asleep again within ten
 *      minutes (18.3 % vs 11.1 %) — so putting MILD at the top would
 *      have someone optimise the smaller variable first.
 *
 *   2. Reality checks are listed with their real result: adding them to
 *      MILD did NOT improve it. They are the single most recommended
 *      technique on the internet, so leaving that out would be the
 *      comfortable choice; a guide that tells you what actually failed
 *      is the only kind worth having at 3am.
 *
 * The screen is deliberately NOT a checklist — nothing here is ticked off,
 * and pretending it is would promise a result the evidence does not.
 */
export default function LucidGuide() {
  const [open, setOpen] = useState(null);
  const { state, update, toast } = useAppState();

  return (
    <div className="p-lucid">
      <p className="sl-lede">{t.lucid.lede}</p>

      {/* The three things the data says matter most, as figures — a number
          that beat a technique is more persuasive than any adjective. */}
      <h2 className="p-lucid-head">{t.lucid.leversTitle}</h2>
      <div className="p-levers">
        {t.lucid.levers.map((l) => (
          /* ⚠ KEINE Kennzahl mehr über dem Titel (Antons Entscheidung
             26.08.). Sie ist an dieser Stelle ZWEIMAL gescheitert: erst als
             „18 % vs 11 %" (22.08.: „die Information bringt niemand"), dann
             als Verhältnis in Worten. Der Grund war beide Male derselbe —
             EIN Wert kann keinen Vergleich ausdrücken, und ohne Bezugsgröße
             ist er keine Aussage.

             Dazu kam ein Sachfehler: 11 → 18 ist Faktor 1,64, „fast doppelt
             so oft" liest jeder als 1,8–1,9. Auf einem Bildschirm, der „was
             die Studienlage WIRKLICH hergibt" verspricht, stand die
             aufgeblasene Zahl in der größten Schrift.

             Und die Reihe lud zu einer falschen Rechnung ein: „zweimal" und
             „dreimal" untereinander lesen sich addierbar — dabei landen
             BEIDE Hebel bei denselben 18 von 100 und unterscheiden sich nur
             in der Vergleichsgröße. Die Zahlen stehen weiterhin im Text,
             mit ihrer Einheit, wo sie belegen statt zu behaupten. */
          <div className="p-lever" key={l.title}>
            <span className="p-lever-title">{l.title}</span>
            <span className="p-lever-text">{l.text}</span>
          </div>
        ))}
      </div>

      <h2 className="p-lucid-head">{t.lucid.methodsTitle}</h2>
      <div className="p-methods">
        {t.lucid.methods.map((m) => {
          const isOpen = open === m.id;
          return (
            <div className={"p-method" + (isOpen ? " p-method-open" : "")} key={m.id}>
              <button className="p-method-top"
                      onClick={() => setOpen(isOpen ? null : m.id)}
                      aria-expanded={isOpen}>
                <span className="p-method-head">
                  <span className="p-method-name">{m.name}</span>
                  {/* The success rate sits ON the closed card: the whole
                      point of this rewrite is that you can compare the
                      methods without opening any of them. */}
                  {m.rate && <span className="p-method-rate">{m.rate}</span>}
                </span>
                <span className="p-method-sum">{m.summary}</span>
                <span className="p-method-chev" aria-hidden="true">{isOpen ? "−" : "+"}</span>
              </button>

              {isOpen && (
                <div className="p-method-open-body">
                  <ol className="p-steps">
                    {m.steps.map((s, i) => (
                      <li className="p-step" key={i}>
                        <span className="p-step-n" aria-hidden="true">{i + 1}</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ol>
                  <p className="p-method-note">{m.note}</p>
                  {/* Nur unter den Realitätschecks: Sie sind die EINZIGE
                      Methode hier, die tagsüber stattfindet — alles andere
                      passiert nachts, und wofür man nachts eine Erinnerung
                      bräuchte, schläft man gerade. */}
                  {m.id === "rc" && <ReminderSwitch state={state} update={update} toast={toast} />}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="p-lucid-source">{t.lucid.sourceNote}</p>
    </div>
  );
}

/* Der Erinnerungs-Schalter — Antons Ansage vom 26.08.: „Für den
 * Realitätscheck können wir so einen Button hinzufügen, der dann später,
 * wenn wir das auf Xcode haben, Erinnerungen auslösen kann … dass man dann
 * eine Erinnerung bekommt: ‚Mach jetzt diesen Test'."
 *
 * ⚠ Hier wird HEUTE noch nichts erinnert. Der Schalter sammelt nur den
 * WUNSCH ein (reminders.js, seit dem 23.08. gebaut und bis jetzt von
 * niemandem benutzt) — das Planen der Benachrichtigungen macht die native
 * Schicht nach der Xcode-Portierung.
 *
 * Und das ist keine Bequemlichkeit, sondern der Grund, warum reminders.js
 * so gebaut ist: **iOS gibt für die Benachrichtigungs-Erlaubnis genau EINEN
 * Versuch.** Wer sie ablehnt, kann sie nur noch in den Systemeinstellungen
 * geben — wohin niemand geht. Deshalb trennt die Datei WUNSCH von
 * ERLAUBNIS: Der Systemdialog erscheint später nur noch Leuten, die hier
 * schon Ja gesagt haben. Wer das je zusammenlegt, verbrennt den einen
 * Versuch bei allen anderen mit.
 *
 * Für die Portierung (docs/plans/2026-08-23-shape-auswertung.md §1):
 * `state.reminders` liefert `{ wants, perDay, granted, askedAt }`. Die
 * native Seite fragt `mayAskForPermission()`, zeigt DANN den Systemdialog
 * und schreibt das Ergebnis mit `reminderAnswered()` zurück. Die Zeiten
 * selbst gehören in die Wachstunden verteilt — ein Realitätscheck nachts
 * um drei erinnert niemanden, er weckt ihn. */
function ReminderSwitch({ state, update, toast }) {
  const reminders = state.reminders || null;
  const an = reminderState(reminders) !== "hidden";
  const proTag = reminders?.perDay || DEFAULT_PER_DAY;

  function umschalten() {
    const wunsch = reminderWish(!an, proTag);
    update({ reminders: { ...(reminders || {}), ...wunsch } });
    if (!an) toast(t.lucid.reminderOn);
  }

  return (
    <div className="p-remind">
      <button
        className={"p-remind-btn" + (an ? " p-remind-on" : "")}
        onClick={umschalten}
        aria-pressed={an}
      >
        <span className="p-remind-dot" aria-hidden="true" />
        {an ? t.lucid.reminderActive(proTag) : t.lucid.reminderAsk}
      </button>

      {/* Die Häufigkeit erst NACH dem Ja: Vorher ist sie eine Frage zu
          einer Sache, die noch gar nicht stattfindet. */}
      {an && (
        <div className="p-remind-row" role="group" aria-label={t.lucid.reminderPerDay}>
          {Array.from({ length: MAX_PER_DAY }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              className={"p-remind-n" + (proTag === n ? " p-remind-n-on" : "")}
              aria-pressed={proTag === n}
              onClick={() => update({ reminders: { ...reminders, ...reminderWish(true, n) } })}
            >{n}×</button>
          ))}
        </div>
      )}

      <p className="p-remind-hint">{an ? t.lucid.reminderSoon : t.lucid.reminderWhy}</p>
    </div>
  );
}
