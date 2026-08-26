import { useAppState } from "../../state/AppState.jsx";
import { setLanguage } from "../../i18n/index.js";
import { LOCALES } from "../../lib/locales.js";
import "./onboarding.css";

/* Before the wordmark, before the slides, before anything else: which
 * language. Every label is written in ITS OWN language on purpose — the
 * one screen in the app where translating a label would defeat the label's
 * whole purpose, someone who cannot read English yet still has to find
 * "Deutsch" or "العربية" in this list.
 *
 * Choosing here does three things, not one: it mutates `t` in place so
 * every component reads the new copy from its very next render
 * (setLanguage()), it writes state.language, which is the command the rest
 * of the app — the voice assistant included — reads from then on (see
 * VoiceInterview and OnboardingSurvey, which pass state.language into
 * startVoiceSession instead of guessing from the device), and it calls
 * onChosen() so the caller can move on — App.jsx's Gate() decides the next
 * phase itself rather than this component assuming what comes after it.
 */
export default function LanguagePicker({ onChosen }) {
  const { update } = useAppState();

  async function choose(id) {
    /* ERST warten, DANN den Re-Render anstoßen: setLanguage ist seit dem
       26.08. async (die fünf eingefrorenen Sprachen werden nachgeladen).
       Für en/de löst es sofort auf; für die anderen ist das Warten genau
       die Garantie, dass t gefüllt ist, bevor irgendetwas neu rendert. */
    await setLanguage(id);
    update({ language: id });
    onChosen?.();
  }

  return (
    <main className="ob ob-center">
      <p className="lp-mark" aria-hidden="true">✦</p>
      <ul className="lp-list">
        {LOCALES.map((l) => (
          <li key={l.id}>
            <button className="lp-btn" onClick={() => choose(l.id)} lang={l.id} dir={l.rtl ? "rtl" : "ltr"}>
              {l.label}
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}
