import { useState, useMemo, useCallback } from "react";
import { analyze } from "../lib/api.js";
import { useVoiceInput } from "../lib/useVoiceInput.js";
import { PRICES } from "../lib/pricing.js";
import { spend } from "../lib/credits.js";
import { useAppState } from "../state/AppState.jsx";
import { t } from "../i18n/index.js";
import Button from "../components/Button.jsx";
import TagTextarea from "../components/TagTextarea.jsx";
import TagCard from "../components/TagCard.jsx";
import VoiceInterview from "./VoiceInterview.jsx";
import "./wizard.css";

export default function Step1Dream({ w, patch, seedAssignments }) {
  const { state, update, toast } = useAppState();
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(null);   // the analysis awaiting a decision
  const [card, setCard] = useState(null);         // the tag being looked at, if any
  const [interview, setInterview] = useState(false);
  const voice = useVoiceInput({
    onText: (text) => patch({ text }),
    // MIC_DENIED / READ_FAILED are our own codes; anything else is already a
    // user-facing message from the server (same contract as analyze/refine).
    onError: (msg) => toast(t.dream.voiceErrors[msg] || `⚠ ${msg}`),
  });

  const clean = w.text.trim();

  // Every avatar counts, with or without a photo: since an entry may carry
  // just a description, "has an image" is no longer what makes it usable.
  const knownTags = useMemo(() => {
    const tags = (state.cast || []).map((p) => p.tag).filter(Boolean);
    if (state.me) tags.push("me");
    return tags;
  }, [state.cast, state.me]);

  /* Tapping a highlighted name shows who it is. @me is not in the cast — it is
   * its own field, so it needs its own case. Stable identity on both callbacks:
   * TagCard registers window listeners keyed on onClose. */
  const openCard = useCallback((tag, rect) => {
    const avatar = tag === "me"
      ? { ...state.me, tag: "me", category: "person" }
      : (state.cast || []).find((p) => p.tag === tag);
    if (avatar) setCard({ avatar, rect });
  }, [state.cast, state.me]);

  const closeCard = useCallback(() => setCard(null), []);

  /** The single LLM call. Its result drives every later step. */
  async function runAnalysis() {
    if (clean.length < 8) return toast(t.wizard.tooShort);
    const paid = spend(state, PRICES.improve);
    if (!paid) return toast(t.wizard.noCredits);
    setBusy(true);
    try {
      const result = await analyze(clean);
      update(paid);          // only charge once the call actually succeeded
      setPreview(result);
    } catch (err) {
      console.error("[DreamRushes] analyze failed:", err);
      toast(`⚠ ${err.message}`);
    }
    setBusy(false);
  }

  /** Keep the improved wording. The original is preserved either way. */
  function accept() {
    patch({
      text: preview.text, originalText: w.originalText || clean, analysis: preview,
      title: preview.title || "", tagline: preview.tagline || "", step: 2,
    });
    seedAssignments(preview);
    setPreview(null);
  }

  /** Keep my own words, but still use everything else the analysis found. */
  function keepMine() {
    patch({
      originalText: w.originalText || clean, analysis: { ...preview, text: clean },
      title: preview.title || "", tagline: preview.tagline || "", step: 2,
    });
    seedAssignments(preview);
    setPreview(null);
  }

  /* What the interview brings back. The text goes into the same field the
   * typed path uses, so everything downstream is unchanged — but the people
   * and places it already identified are kept, and step 3 starts from them
   * instead of from a second analysis of the same words. */
  function fromInterview({ text, people, places }) {
    setInterview(false);
    if (!text) return;
    patch({ text, interview: { people, places } });
  }

  if (interview) {
    return <VoiceInterview onDone={fromInterview} onCancel={() => setInterview(false)} />;
  }

  if (preview) {
    return (
      <section className="wiz-body">
        <h1 className="wiz-title">{t.wizard.step1.previewTitle}</h1>
        <p className="wiz-lede">{t.wizard.step1.previewLede}</p>

        <div className="wiz-compare">
          <div className="wiz-compare-side">
            <h2 className="wiz-compare-label">{t.wizard.step1.yours}</h2>
            <p className="wiz-compare-text">{clean}</p>
          </div>
          <div className="wiz-compare-side wiz-compare-new">
            <h2 className="wiz-compare-label">{t.wizard.step1.improved}</h2>
            <p className="wiz-compare-text">{preview.text}</p>
          </div>
        </div>

        {preview.title && (
          <p className="wiz-poster-line">
            🎬 <strong>{preview.title}</strong>{preview.tagline ? ` — ${preview.tagline}` : ""}
          </p>
        )}

        <div className="wiz-actions">
          <Button variant="quiet" onClick={keepMine}>{t.wizard.step1.keepMine}</Button>
          <Button onClick={accept}>{t.wizard.step1.useImproved}</Button>
        </div>
      </section>
    );
  }

  return (
    <section className="wiz-body">
      <h1 className="wiz-title">{t.wizard.step1.title}</h1>

      {/* Talking comes first, and it is the biggest thing on the screen —
          this is the half-asleep case the app is actually for. Typing is
          right underneath for everyone else, and for anything easier written
          than said. */}
      <button className="wiz-tell" onClick={() => setInterview(true)}>
        <span className="wiz-tell-icon" aria-hidden="true">✦</span>
        <span className="wiz-tell-body">
          <span className="wiz-tell-title">{t.dream.interview}</span>
          <span className="wiz-tell-hint">{t.dream.interviewHint}</span>
        </span>
      </button>

      <div className="wiz-or"><span>{t.dream.or}</span></div>

      <div className="wiz-field-label">
        <span>{t.dream.label}</span>
        {voice.supported && (
          <span className={voice.listening ? "wiz-voice-on" : ""}>
            {voice.listening ? t.dream.voiceListening
              : voice.busy ? t.dream.voiceTranscribing
              : t.dream.voiceReady}
          </span>
        )}
      </div>

      {/* Names from the profile light up as they are typed, so it is visible
          which avatars this dream will pull in — before the wizard asks.
          Tapping one shows the photo and description behind the name. */}
      <TagTextarea
        className="wiz-textarea"
        value={w.text}
        tags={knownTags}
        onChange={(e) => patch({ text: e.target.value })}
        onTagClick={openCard}
        placeholder={t.dream.placeholder}
        rows={9}
        autoFocus
        aria-label={t.dream.textLabel}
      />

      {card && <TagCard avatar={card.avatar} anchor={card.rect} onClose={closeCard} />}

      {/* Dictation, which is not the same thing as the interview above: this
          one only writes down what you say, it never asks. */}
      {voice.supported && (
        <button
          className={"wiz-mic" + (voice.listening ? " wiz-mic-on" : "")}
          onClick={() => voice.toggle(w.text)}
          disabled={voice.busy}
          aria-label={t.dream.voiceLabel}
          aria-pressed={voice.listening}
        >
          🎙
        </button>
      )}

      {/* No skip: every later step runs on what this call returns — the
          characters, the places, the beats. Continuing without it would mean
          a wizard with nothing to show. */}
      <div className="wiz-actions wiz-actions-stack">
        <Button onClick={runAnalysis} variant="quiet" disabled={busy}>
          {busy ? t.wizard.step1.reading
                : `✨ ${t.wizard.step1.improve} · ${PRICES.improve ? `${PRICES.improve} ${t.wizard.credit}` : t.wizard.free}`}
        </Button>
      </div>

      <p className="wiz-hint">{t.wizard.step1.why}</p>
    </section>
  );
}
