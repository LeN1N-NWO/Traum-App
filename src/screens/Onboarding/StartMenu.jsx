import { t } from "../../i18n/index.js";
import Button from "../../components/Button.jsx";
import Mascot from "./Mascot.jsx";
import "./onboarding.css";

/* A picker shown before the app decides anything, while onboarding is still
 * being built (09.08.2026) — asked for explicitly: state.onboarded flipping
 * once and never again made the flow effectively unreachable after the
 * first look. This is the reversible fix: choose every launch, instead of
 * either "always" or "never" being baked into a stored flag.
 *
 * Not meant to survive to a real release — a returning user should not be
 * asked "onboarding or app?" on every open. Delete this file and let App.jsx
 * gate on state.onboarded again once the flow is settled. */
export default function StartMenu({ onOnboarding, onSkip }) {
  return (
    <main className="ob ob-center">
      <Mascot />
      <h1 className="ob-title">{t.onboarding.startMenuTitle}</h1>
      <p className="ob-text">{t.onboarding.startMenuText}</p>
      <div className="ob-actions">
        <Button onClick={onOnboarding}>{t.onboarding.startMenuOnboarding}</Button>
        <Button variant="ghost" onClick={onSkip}>{t.onboarding.startMenuSkip}</Button>
      </div>
    </main>
  );
}
