import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppState } from "../../state/AppState.jsx";
import { taggedPhotosIn } from "../../lib/tags.js";
import { genId } from "../../lib/storage.js";
import { generate } from "../../lib/api.js";
import { bumpStreak } from "../../lib/streak.js";
import { newCreature } from "../../lib/creatures.js";
import { useVoiceInput } from "../../lib/useVoiceInput.js";
import { t } from "../../i18n/index.js";
import Button from "../../components/Button.jsx";
import ScreenHeader from "../../components/ScreenHeader.jsx";
import "./dream.css";

/* Interim screen. The six-step wizard replaces this file — see
   docs/specs/2026-08-07-app-umbau-design.md. Kept deliberately small. */
export default function DreamScreen() {
  const { state, update, toast } = useAppState();
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const [mode, setMode] = useState("sequence");
  const [busy, setBusy] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState(0);
  const voice = useVoiceInput({ onText: setText });

  // Rotate the loading copy so a long generation doesn't look frozen.
  useEffect(() => {
    if (!busy) return;
    const id = setInterval(() => setLoadingMsg((i) => i + 1), 1400);
    return () => clearInterval(id);
  }, [busy]);

  async function submit() {
    const clean = text.trim();
    if (clean.length < 8) return toast(t.dream.tooShort);

    setBusy(true);
    setLoadingMsg(0);
    // Only send reference photos whose name actually appears. The wizard
    // replaces this rule with explicit assignment.
    const cast = taggedPhotosIn(state, clean);

    let urls = [];
    let source = "demo";
    try {
      urls = await generate({ dream: clean, mode, cast });
      source = "api";
    } catch (err) {
      console.error("[DreamRushes] generation failed:", err);
      toast(`⚠ ${err.message}`);
    }

    const creature = newCreature(clean);
    const entry = {
      id: genId("e"),
      createdAt: new Date().toISOString(),
      text: clean,
      title: creature.title,
      mode,
      cons: state.cons,
      media: { type: mode === "film" ? "video" : "image", urls, source },
      references: cast.map((c) => ({ tag: c.tag, category: c.category })),
      creatureId: creature.id,
    };

    // bumpStreak returns {streak, lastDream} — lastDream is a DATE. Never put
    // the dream text there or the streak restarts on every dream.
    update({
      journal: [...(state.journal || []), entry],
      creatures: [...(state.creatures || []), creature],
      ...bumpStreak(state),
    });

    setBusy(false);
    toast(t.dream.caught(creature.name));
    navigate("/journal");
  }

  return (
    <main className="screen">
      <ScreenHeader
        title={t.dream.title}
        action={<Button variant="ghost" onClick={() => navigate(-1)}>{t.dream.cancel}</Button>}
      />

      <div className="d-label">
        <span>{t.dream.label}</span>
        {voice.supported && (
          <span className={voice.listening ? "d-voice-on" : ""}>
            {voice.listening ? t.dream.voiceListening : t.dream.voiceReady}
          </span>
        )}
      </div>

      <textarea
        className="d-field"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={t.dream.placeholder}
        rows={9}
        autoFocus
        aria-label={t.dream.textLabel}
      />

      {voice.supported && (
        <button
          className={"d-mic" + (voice.listening ? " d-mic-on" : "")}
          onClick={() => voice.toggle(text)}
          aria-label={t.dream.voiceLabel}
          aria-pressed={voice.listening}
        >
          🎙
        </button>
      )}

      <fieldset className="d-mode">
        <legend>{t.dream.modeLegend}</legend>
        <label>
          <input
            type="radio" name="mode" value="sequence"
            checked={mode === "sequence"} onChange={() => setMode("sequence")}
          />
          <span>{t.dream.modeImages}<small>{t.dream.modeImagesHint}</small></span>
        </label>
        <label>
          <input
            type="radio" name="mode" value="film"
            checked={mode === "film"} onChange={() => setMode("film")}
          />
          <span>{t.dream.modeFilm}<small>{t.dream.modeFilmHint}</small></span>
        </label>
      </fieldset>

      <p className="d-hint">{t.dream.privacy}</p>

      <Button onClick={submit} disabled={busy}>
        {busy ? t.dream.submitting : t.dream.submit}
      </Button>

      {busy && (
        <div className="d-loading" role="status" aria-live="polite">
          <div className="d-spinner" aria-hidden="true" />
          <p className="d-loading-text">
            {t.dream.loading[loadingMsg % t.dream.loading.length]}
          </p>
        </div>
      )}
    </main>
  );
}
