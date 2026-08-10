import { useState } from "react";
import { analyze } from "../lib/api.js";
import { PRICES } from "../lib/pricing.js";
import { spend } from "../lib/credits.js";
import { useAppState } from "../state/AppState.jsx";
import { t } from "../i18n/index.js";
import Button from "../components/Button.jsx";
import TagField from "../components/TagField.jsx";
import VoiceInterview from "./VoiceInterview.jsx";
import "./wizard.css";

/* The interview names people and places out loud; the analysis names them
 * again from the finished text. Same dream, two sources — union them by name,
 * so nothing that was said is dropped just because the written account
 * happened to phrase it differently. */
function mergeInterview(analysis, people = [], places = []) {
  const nameOf = (x) => String(typeof x === "string" ? x : x?.name || "").trim().toLowerCase();
  const known = (list) => new Set((list || []).map(nameOf).filter(Boolean));
  const seenPeople = known(analysis.people);
  const seenPlaces = known(analysis.places);
  return {
    ...analysis,
    people: [...(analysis.people || []), ...people.filter((p) => p?.name && !seenPeople.has(nameOf(p)))],
    places: [...(analysis.places || []), ...places.filter((p) => p && !seenPlaces.has(nameOf(p)))],
  };
}

export default function Step1Dream({ w, patch, seedAssignments }) {
  const { state, update, toast } = useAppState();
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(null);   // the analysis awaiting a decision
  const [interview, setInterview] = useState(false);
  const [reading, setReading] = useState(false);  // analysing what the interview brought back

  const clean = w.text.trim();

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

  /* What the interview brings back.
   *
   * It does NOT land on the empty text field. Someone who has just spent two
   * minutes talking has answered every question the analysis would ask, so
   * asking them to press "improve" afterwards is asking twice — the reading
   * runs on its own and they arrive at the comparison, dream already titled.
   *
   * The people and places named out loud are folded into the analysis, so a
   * name that only ever came up in conversation still gets a tile in step 3. */
  async function fromInterview({ text, people, places }) {
    setInterview(false);
    if (!text) return;
    patch({ text });
    setReading(true);
    try {
      setPreview(mergeInterview(await analyze(text), people, places));
    } catch (err) {
      console.error("[DreamRushes] analyze after interview failed:", err);
      // The dream itself is safe in the field — this only costs the polish.
      toast(`⚠ ${err.message}`);
    }
    setReading(false);
  }

  if (interview) {
    return <VoiceInterview onDone={fromInterview} onCancel={() => setInterview(false)} />;
  }

  /* Between the last word spoken and the comparison. Without this the empty
     form flashes up for a second, which reads as "it lost everything". */
  if (reading) {
    return (
      <section className="wiz-body">
        <div className="wiz-rendering" role="status" aria-live="polite">
          <div className="wiz-spinner" aria-hidden="true" />
          <p className="wiz-busy-text">{t.dream.reading}</p>
          <p className="wiz-hint">{t.dream.readingHint}</p>
        </div>
      </section>
    );
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
      </div>

      {/* Names from the profile light up as they are typed, so it is visible
          which avatars this dream will pull in — before the wizard asks.
          Tapping one shows the photo and description behind the name. */}
      <TagField
        className="wiz-textarea"
        value={w.text}
        onChange={(e) => patch({ text: e.target.value })}
        placeholder={t.dream.placeholder}
        rows={9}
        autoFocus
        aria-label={t.dream.textLabel}
      />

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
