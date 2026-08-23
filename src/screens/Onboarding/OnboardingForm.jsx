import { useState } from "react";
import { FORM_FIELDS, profileFromAnswers, hasAnything } from "../../lib/onboardingForm.js";
import { zodiacOf } from "../../lib/zodiac.js";
import { t } from "../../i18n/index.js";
import Button from "../../components/Button.jsx";
import Mascot from "./Mascot.jsx";
import "./onboarding.css";

/* Die Einführungsumfrage zum Tippen — derselbe Ertrag wie das Gespräch,
 * ohne Mikrofon, ohne Verbindung, ohne Stimme.
 *
 * ⚠ Sie ist KEIN Notnagel. Der Befund vom 23.08. war, dass es ohne
 * `GEMINI_KEY`, ohne Mikrofon-Erlaubnis oder ohne stabile Verbindung GAR
 * KEIN Profil gab — die Fehlerzeile hatte keinen Ausgang außer dem ×, und
 * damit fielen Name, Ziel, Themen UND die Willkommens-Credits weg (die
 * hängen an `surveyDone`). Genauso trifft es aber jeden, der um drei Uhr
 * nachts neben einem schlafenden Menschen liegt und nicht sprechen will.
 * Deshalb steht dieser Weg auch als eigene Wahl am Tor, nicht nur im
 * Fehlerfall.
 *
 * Was hier NICHT passiert: die Frage nach Erinnerungen. Ein angekreuztes
 * Kästchen ist der falsche Ort für etwas, das den iOS-Systemdialog auslöst —
 * den gibt es genau einmal (lib/reminders.js). Der Sprachweg notiert den
 * Wunsch, hier bleibt er leer, und der Systemdialog kommt in beiden Fällen
 * erst nach einem bewussten Tipp.
 *
 * Die Felder und die Umrechnung stehen in lib/onboardingForm.js — ohne DOM
 * prüfbar, und dort ist auch festgenagelt, dass die Werte dieselben sind,
 * die der Sprachweg liefert. */
export default function OnboardingForm({ onDone, onCancel, onVoiceInstead }) {
  const [answers, setAnswers] = useState({ themes: [] });
  const [themeDraft, setThemeDraft] = useState("");

  const set = (key, value) => setAnswers((prev) => ({ ...prev, [key]: value }));

  /* Eine zweite Berührung auf dieselbe Antwort nimmt sie zurück. Ohne das
     gäbe es keinen Weg mehr aus einer versehentlich getippten Auswahl —
     und „alles ist optional" wäre nach dem ersten Fehlgriff eine Lüge. */
  const toggle = (key, value) => set(key, answers[key] === value ? "" : value);

  function addTheme() {
    const clean = themeDraft.trim();
    if (!clean) return;
    /* ⚠ Doppeltes hier abfangen, nicht erst in profileFromAnswers. Die
       Umrechnung wirft Duplikate ohnehin weg — täte sie es allein, stünde
       „Fliegen" zweimal auf dem Bildschirm und einmal im Profil. Ein
       Formular, das etwas anderes zeigt als es liefert, ist ein Formular,
       dem man beim nächsten Feld auch nicht mehr glaubt. */
    const vorhanden = answers.themes || [];
    if (vorhanden.includes(clean)) { setThemeDraft(""); return; }
    set("themes", [...vorhanden, clean]);
    setThemeDraft("");
  }

  function finish() {
    onDone(profileFromAnswers(answers, zodiacOf));
  }

  /* Aus derselben Liste, aus der auch die Umrechnung liest — eine zweite
     Aufzählung hier wäre die Stelle, an der die Wege auseinanderlaufen. */
  const field = Object.fromEntries(FORM_FIELDS.map((f) => [f.key, f]));
  const label = {
    goal: t.onboarding.formGoal,
    recall: t.onboarding.formRecall,
    lucid: t.onboarding.formLucid,
    sleepHours: t.onboarding.formSleep,
    timeBudget: t.onboarding.formTime,
  };
  /* Die Beschriftungen der WERTE kommen aus dem Traumbogen, nicht von hier.
     Derselbe Wert muss überall denselben Satz tragen — sonst heißt er im
     Formular anders als auf der Karte, die ihn hinterher anzeigt. */
  const values = {
    goal: t.dreamer.goalValues,
    recall: t.dreamer.recallValues,
    lucid: t.dreamer.lucidValues,
    sleepHours: t.dreamer.sleepValues,
    timeBudget: t.dreamer.timeValues,
  };

  const answered = hasAnything(profileFromAnswers(answers, zodiacOf));

  return (
    <main className="ob ob-form-screen">
      <header className="ob-form-top">
        <button className="vi-round" onClick={onCancel} aria-label={t.voice.cancel}>×</button>
        <Mascot />
      </header>

      <h1 className="ob-title">{t.onboarding.formTitle}</h1>
      <p className="ob-text">{t.onboarding.formIntro}</p>

      <div className="ob-form">
        <label className="ob-q">
          <span className="ob-q-label">{t.onboarding.formName}</span>
          <input
            className="ob-input"
            type="text"
            maxLength={field.name.maxLength}
            value={answers.name || ""}
            onChange={(e) => set("name", e.target.value)}
            placeholder={t.onboarding.formNamePlaceholder}
            autoComplete="given-name"
          />
        </label>

        {["goal", "recall", "lucid", "sleepHours", "timeBudget"].map((key) => (
          <fieldset className="ob-q" key={key}>
            <legend className="ob-q-label">{label[key]}</legend>
            <div className="ob-choices">
              {field[key].values.map((v) => (
                <button
                  key={v}
                  type="button"
                  className={"ob-choice" + (answers[key] === v ? " ob-choice-on" : "")}
                  aria-pressed={answers[key] === v}
                  onClick={() => toggle(key, v)}
                >
                  {values[key][v]}
                </button>
              ))}
            </div>
          </fieldset>
        ))}

        <div className="ob-q">
          <span className="ob-q-label">{t.onboarding.formThemes}</span>
          {(answers.themes || []).length > 0 && (
            <div className="ob-chips">
              {answers.themes.map((name, i) => (
                <button
                  key={`${name}-${i}`}
                  type="button"
                  className="ob-chip"
                  aria-label={t.onboarding.formThemesRemove(name)}
                  onClick={() => set("themes", answers.themes.filter((_, j) => j !== i))}
                >
                  {name} <span aria-hidden="true">×</span>
                </button>
              ))}
            </div>
          )}
          {(answers.themes || []).length < field.themes.maxItems && (
            <div className="ob-chip-add">
              <input
                className="ob-input"
                type="text"
                maxLength={field.themes.maxLength}
                value={themeDraft}
                onChange={(e) => setThemeDraft(e.target.value)}
                /* Enter fügt hinzu, statt das Formular abzuschicken — sonst
                   wäre die häufigste Geste in einem Textfeld ausgerechnet
                   die, die den ganzen Fragebogen beendet. */
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTheme(); } }}
                placeholder={t.onboarding.formThemesPlaceholder}
              />
              <button type="button" className="ob-chip-go" onClick={addTheme}
                      disabled={!themeDraft.trim()}>
                {t.onboarding.formThemesAdd}
              </button>
            </div>
          )}
        </div>

        <label className="ob-q">
          <span className="ob-q-label">{t.onboarding.formBirthday}</span>
          <input
            className="ob-input"
            type="date"
            value={answers.birthday || ""}
            onChange={(e) => set("birthday", e.target.value)}
          />
          <span className="ob-q-hint">{t.onboarding.formBirthdayHint}</span>
        </label>
      </div>

      <div className="ob-actions ob-form-actions">
        <Button onClick={finish}>
          {answered ? t.onboarding.formDone : t.onboarding.gateLater}
        </Button>
        {onVoiceInstead && (
          <Button variant="ghost" onClick={onVoiceInstead}>
            {t.onboarding.formVoiceInstead}
          </Button>
        )}
      </div>
    </main>
  );
}
