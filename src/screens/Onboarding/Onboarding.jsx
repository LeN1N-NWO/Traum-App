import { useRef, useState } from "react";
import { useAppState } from "../../state/AppState.jsx";
import { welcomeGrant } from "../../lib/credits.js";
import { t } from "../../i18n/index.js";
import Button from "../../components/Button.jsx";
import DreamScape from "../../components/DreamScape.jsx";
import AvatarDialog from "../../components/AvatarDialog.jsx";
import { IconBook, IconSparkle } from "../../components/icons.jsx";
import OnboardingSurvey from "./OnboardingSurvey.jsx";
import Mascot from "./Mascot.jsx";
import "./onboarding.css";

/* The first run: an animated opening, three swipes of what the app does,
 * then the voice survey that personalises the profile — rewarded with the
 * welcome credits, which is WHY they are no longer granted silently on
 * install: a gift with a face converts better than a balance that was
 * always there.
 *
 * Placeholder by design ("erstmal dumm", 09.08.2026): the opening animation
 * is the DreamScape until a rendered film replaces it, and the mascot is a
 * simple wisp until there is real art. The FLOW is the deliverable here.
 */
export default function Onboarding({ onExit }) {
  const { state, update, toast } = useAppState();
  const [phase, setPhase] = useState("slides");   // slides | gate | survey | selfie
  const [dot, setDot] = useState(0);
  const [addPhoto, setAddPhoto] = useState(false);
  const track = useRef(null);
  const profileRef = useRef(null);   // what the survey collected, once done

  const slides = t.onboarding.slides;

  function onScroll() {
    const el = track.current;
    if (el) setDot(Math.round(el.scrollLeft / el.clientWidth));
  }

  /* The single exit. Everything before it only moves between phases.
   * Signals completion via onExit() rather than leaving the caller to infer
   * it from state.onboarded flipping — the start menu (App.jsx) reopens
   * this component on demand even when state.onboarded is already true, so
   * that flip would not fire a second time and the screen would go nowhere. */
  function complete({ surveyDone = false, profile = null } = {}) {
    const grant = surveyDone ? welcomeGrant(state) : null;
    update({
      onboarded: true,
      ...(surveyDone ? { surveyDone: true } : {}),
      ...(profile ? { profile } : {}),
      ...(grant || {}),
    });
    // Only promise credits that were actually added — someone who installed
    // before the survey existed already has the grant, and re-promising it
    // would be a lie with a ✦ on it.
    if (grant) toast(t.onboarding.granted);
    else if (surveyDone) toast(t.onboarding.thanks);
    onExit?.();
  }

  if (phase === "survey") {
    return (
      <OnboardingSurvey
        onDone={(profile) => { profileRef.current = profile; setPhase("selfie"); }}
        onCancel={() => setPhase("gate")}
      />
    );
  }

  if (phase === "selfie") {
    const profile = profileRef.current;
    return (
      <main className="ob ob-center">
        <Mascot />
        <h1 className="ob-title">{t.onboarding.selfieTitle}</h1>
        <p className="ob-text">{t.onboarding.selfieText}</p>
        <div className="ob-actions">
          <Button onClick={() => setAddPhoto(true)}>{t.onboarding.selfieAdd}</Button>
          <Button variant="ghost" onClick={() => complete({ surveyDone: true, profile })}>
            {t.onboarding.selfieSkip}
          </Button>
        </div>
        {addPhoto && (
          <AvatarDialog
            category="person"
            isMe
            existing={state.me ? { ...state.me, category: "person", id: "me" } : null}
            onClose={() => { setAddPhoto(false); complete({ surveyDone: true, profile }); }}
          />
        )}
      </main>
    );
  }

  if (phase === "gate") {
    return (
      <main className="ob ob-center">
        <Mascot />
        <h1 className="ob-title">{t.onboarding.gateTitle}</h1>
        <p className="ob-text">{t.onboarding.gateText}</p>
        <p className="ob-reward">{t.onboarding.gateReward}</p>
        <div className="ob-actions">
          <Button onClick={() => setPhase("survey")}>{t.onboarding.gateStart}</Button>
          <Button variant="ghost" onClick={() => complete()}>{t.onboarding.gateLater}</Button>
        </div>
      </main>
    );
  }

  return (
    <main className="ob">
      <div className="ob-slides" ref={track} onScroll={onScroll}>
        {/* The opening: animation and the name, nothing to read. */}
        <section className="ob-slide ob-slide-hero">
          <DreamScape level={0} speaking={false} />
          <div className="ob-hero-text">
            <p className="ob-wordmark">Dream Rushes</p>
            <p className="ob-tagline">{t.onboarding.tagline}</p>
          </div>
          <span className="ob-swipe" aria-hidden="true">‹ {t.onboarding.swipe}</span>
        </section>

        {slides.map((s, i) => (
          <section key={i} className="ob-slide">
            <div className="ob-card" aria-hidden="true">
              {i === 0 ? <IconBook /> : i === 1 ? <IconSparkle /> : <FilmGlyph />}
            </div>
            <h1 className="ob-title">{s.title}</h1>
            <p className="ob-text">{s.text}</p>
          </section>
        ))}
      </div>

      <div className="ob-foot">
        <div className="ob-dots" aria-hidden="true">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className={"ob-dot" + (i === dot ? " ob-dot-on" : "")} />
          ))}
        </div>
        <Button onClick={() => setPhase("gate")}>{t.onboarding.start}</Button>
      </div>
    </main>
  );
}

/* Bigger than the shared 24px icons on purpose — this one is artwork, not
   chrome. Inline rather than in icons.jsx: nothing else wants a 72px glyph. */
function FilmGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"
         strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3.5" y="5" width="17" height="14" rx="2" />
      <path d="M8 5v14M16 5v14" />
      <path d="M3.5 9h2.2M18.3 9h2.2M3.5 15h2.2M18.3 15h2.2" />
      <path d="m10.8 10.2 3 1.8-3 1.8Z" />
    </svg>
  );
}
