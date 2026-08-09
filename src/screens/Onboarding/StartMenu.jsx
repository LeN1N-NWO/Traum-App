import Button from "../../components/Button.jsx";
import Mascot from "./Mascot.jsx";
import "./onboarding.css";

/* A picker shown before the app decides anything, while onboarding is still
 * being built (09.08.2026) — asked for explicitly: state.onboarded flipping
 * once and never again made the flow effectively unreachable after the
 * first look. This is the reversible fix: choose every launch, instead of
 * either "always" or "never" being baked into a stored flag.
 *
 * Deliberately hardcoded English, not `t.onboarding.*` — this runs BEFORE
 * LanguagePicker (see App.jsx's Gate()), so `t` still holds whatever
 * language was left over from the last test run. Reading `t` here made
 * this screen render in Arabic the moment someone had ever picked Arabic
 * once, with no way back to the picker short of clearing storage — the
 * opposite of "ask every launch". A screen whose whole job is to run
 * before language exists cannot itself depend on it.
 *
 * ⚠ DO NOT REMOVE THIS ON YOUR OWN INITIATIVE (standing decision, Anton,
 * 10.08.2026). It stays until he says otherwise, in those words. It reads
 * like an oversight — a returning user being asked "onboarding or app?" on
 * every launch is obviously wrong for a shipped app — which is exactly why
 * it kept getting listed as the top thing to fix. It is not an oversight:
 * the onboarding is still being worked on, and gating it behind
 * state.onboarded makes it a one-shot that is unreachable the moment it has
 * been seen once.
 *
 * When the word comes: delete this file, and let App.jsx's Gate() branch on
 * state.language and state.onboarded again (both already exist and are
 * already written on the happy path). */
export default function StartMenu({ onOnboarding, onSkip }) {
  return (
    <main className="ob ob-center" lang="en" dir="ltr">
      <Mascot />
      <h1 className="ob-title">Before we go in</h1>
      <p className="ob-text">See the onboarding flow, or skip straight to the app?</p>
      <div className="ob-actions">
        <Button onClick={onOnboarding}>Show onboarding</Button>
        <Button variant="ghost" onClick={onSkip}>Skip to app</Button>
      </div>
    </main>
  );
}
