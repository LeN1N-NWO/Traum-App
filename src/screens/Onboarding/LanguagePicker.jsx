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
 * Choosing here does two things, not one: it mutates `t` in place so every
 * component reads the new copy from its very next render (setLanguage()),
 * and it writes state.language, which is the command the rest of the app
 * — the voice assistant included — reads from then on. See VoiceInterview
 * and OnboardingSurvey: they pass state.language into startVoiceSession
 * instead of guessing from the device.
 */
export default function LanguagePicker() {
  const { update } = useAppState();

  function choose(id) {
    setLanguage(id);      // t is correct before the state update re-renders anything
    update({ language: id });
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
