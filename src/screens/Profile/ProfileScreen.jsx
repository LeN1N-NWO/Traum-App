import { useState } from "react";
import { useAppState } from "../../state/AppState.jsx";
import { welcomeGrant } from "../../lib/credits.js";
import { t } from "../../i18n/index.js";
import AvatarDialog from "../../components/AvatarDialog.jsx";
import OnboardingSurvey from "../Onboarding/OnboardingSurvey.jsx";
import Paywall from "./Paywall.jsx";
import Settings from "./Settings.jsx";
import { IconGear } from "../../components/icons.jsx";
import "./profile.css";

/* The profile is about the person, not their material: people, pets and
 * places moved to the Journal tab, where the dreams that reference them are,
 * and so did the calendar — every square in it opens a dream, which makes it
 * a way into the journal rather than a fact about you.
 * What is left is who you are here — your face, your balance, your record.
 */
export default function ProfileScreen() {
  const { state, update, toast } = useAppState();
  const [editingMe, setEditingMe] = useState(false);
  const [paywall, setPaywall] = useState(false);
  const [survey, setSurvey] = useState(false);
  const [settings, setSettings] = useState(false);

  const me = state.me;
  const dreams = state.journal?.length || 0;
  const streak = state.streak || 0;

  /* Same completion as the onboarding path — skipping there was never meant
   * to be final, only deferred, so the reward stays claimable here. */
  function surveyDone(profile) {
    setSurvey(false);
    const grant = welcomeGrant(state);
    update({ surveyDone: true, profile, ...(grant || {}) });
    toast(grant ? t.onboarding.granted : t.onboarding.thanks);
  }

  return (
    <main className="screen">
      {/* Credits as a quiet line in the corner. They are a balance, not an
          achievement — the old full-width card gave them a weight the number
          has not earned until it can actually be topped up. */}
      <div className="p-top">
        <h1 className="p-title">{t.profile.title}</h1>
        <button className="p-credits-pill" onClick={() => setPaywall(true)}>
          <span className="p-credits-dot" aria-hidden="true">✦</span>
          {state.credits ?? 0}
          <span className="p-credits-word">{t.profile.credits}</span>
        </button>
        {/* Round, next to the balance — the two things you reach for from
            this corner are "top up" and "change something". */}
        <button className="p-gear" onClick={() => setSettings(true)}
                aria-label={t.profile.settings}>
          <IconGear />
        </button>
      </div>

      <div className="p-hero">
        {/* The portrait sits in a soft blob rather than a circle: a circle
            reads as an account avatar, this reads as a character. */}
        <button
          className="p-face"
          onClick={() => setEditingMe(true)}
          aria-label={me?.img ? t.profile.changePhoto : t.profile.addPhoto}
        >
          <span className="p-face-glow" aria-hidden="true" />
          {me?.img
            ? <img className="p-face-img" src={me.img} alt="" />
            : <span className="p-face-empty" aria-hidden="true">+</span>}
        </button>

        <p className="p-hero-name">{me?.tag ? `@${me.tag}` : t.profile.you}</p>
        <p className="p-hero-hint">{me?.img ? t.profile.meSet : t.profile.meEmpty}</p>

        <div className="p-stats">
          <span className="p-stat">
            <b>{dreams}</b>
            {t.profile.statDreams}
          </span>
          <span className="p-stat">
            <b>{streak}</b>
            {t.profile.statStreak}
          </span>
        </div>
      </div>

      {/* Skipped the welcome survey? The offer — and its credits — wait
          here rather than expiring. Gone once done: a finished survey is
          not an achievement to look at. */}
      {!state.surveyDone && (
        <button className="p-survey" onClick={() => setSurvey(true)}>
          <span className="p-survey-body">
            <span className="p-survey-title">{t.onboarding.profileCard}</span>
            <span className="p-survey-hint">{t.onboarding.profileCardHint}</span>
          </span>
          <span aria-hidden="true">›</span>
        </button>
      )}

      {survey && (
        <OnboardingSurvey onDone={surveyDone} onCancel={() => setSurvey(false)} />
      )}

      {editingMe && (
        <AvatarDialog
          category="person"
          existing={me ? { ...me, category: "person", id: "me" } : null}
          isMe
          onClose={() => setEditingMe(false)}
        />
      )}

      {settings && <Settings onClose={() => setSettings(false)} />}

      {paywall && <Paywall onClose={() => setPaywall(false)} />}
    </main>
  );
}
