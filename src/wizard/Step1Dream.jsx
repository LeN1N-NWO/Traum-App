import { useState } from "react";
import { analyze } from "../lib/api.js";
import { useVoiceInput } from "../lib/useVoiceInput.js";
import { PRICES } from "../lib/pricing.js";
import { spend } from "../lib/credits.js";
import { useAppState } from "../state/AppState.jsx";
import { t } from "../i18n/index.js";
import Button from "../components/Button.jsx";
import "./wizard.css";

export default function Step1Dream({ w, patch, seedAssignments }) {
  const { state, update, toast } = useAppState();
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(null);   // the analysis awaiting a decision
  const voice = useVoiceInput({ onText: (text) => patch({ text }) });

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
    patch({ text: preview.text, originalText: w.originalText || clean, analysis: preview, step: 2 });
    seedAssignments(preview);
    setPreview(null);
  }

  /** Keep my own words, but still use everything else the analysis found. */
  function keepMine() {
    patch({ originalText: w.originalText || clean, analysis: { ...preview, text: clean }, step: 2 });
    seedAssignments(preview);
    setPreview(null);
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

      <div className="wiz-field-label">
        <span>{t.dream.label}</span>
        {voice.supported && (
          <span className={voice.listening ? "wiz-voice-on" : ""}>
            {voice.listening ? t.dream.voiceListening : t.dream.voiceReady}
          </span>
        )}
      </div>

      <textarea
        className="wiz-textarea"
        value={w.text}
        onChange={(e) => patch({ text: e.target.value })}
        placeholder={t.dream.placeholder}
        rows={9}
        autoFocus
        aria-label={t.dream.textLabel}
      />

      {voice.supported && (
        <button
          className={"wiz-mic" + (voice.listening ? " wiz-mic-on" : "")}
          onClick={() => voice.toggle(w.text)}
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
        <Button onClick={runAnalysis} disabled={busy}>
          {busy ? t.wizard.step1.reading : `✨ ${t.wizard.step1.improve} · ${PRICES.improve} ${t.wizard.credit}`}
        </Button>
      </div>

      <p className="wiz-hint">{t.wizard.step1.why}</p>
    </section>
  );
}
