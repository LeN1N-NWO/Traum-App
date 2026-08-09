import { useEffect, useRef, useState } from "react";
import { VOICES } from "../lib/voices.js";
import { t } from "../i18n/index.js";
import Button from "./Button.jsx";
import "./voicePicker.css";

/* "Choose a voice" — the sheet that rises just before a voice chat begins.
 *
 * Tapping a name IS the preview: it selects the voice and plays its
 * introduction line in one gesture, because a list where selecting and
 * listening are two different taps makes everyone tap the wrong one first.
 * The sample comes from /api/voice-sample — the server generates it once
 * per (voice, language) with the SAME voice catalogue the live session
 * uses, then caches it; see server.js. There is no way to fake this
 * client-side: the API offers no prebuilt previews.
 *
 * The chosen id goes back through onDone; persisting it is the caller's
 * business (both voice screens store it in state.voice, so next time the
 * sheet opens with your voice already under the highlight).
 */
export default function VoicePicker({ current, onDone, onCancel }) {
  const [sel, setSel] = useState(current || VOICES[0].id);
  const [playing, setPlaying] = useState(false);
  const audio = useRef(null);

  useEffect(() => {
    const a = new Audio();
    // The moment a sample ends the wave settles — silence needs no spinner.
    a.onended = () => setPlaying(false);
    a.onerror = () => setPlaying(false);
    audio.current = a;
    return () => { a.pause(); a.src = ""; };
  }, []);

  function pick(id) {
    setSel(id);
    const a = audio.current;
    if (!a) return;
    a.pause();
    // The language decides which line is spoken — same source of truth as
    // the live session itself (document.documentElement.lang is what
    // setLanguage() wrote).
    a.src = `/api/voice-sample?voice=${id}&lang=${document.documentElement.lang || "en"}`;
    a.currentTime = 0;
    setPlaying(true);
    a.play().catch(() => setPlaying(false));
  }

  return (
    <div className="vp" role="dialog" aria-modal="true" aria-label={t.voice.pickTitle}>
      <button className="vp-close" onClick={onCancel} aria-label={t.voice.cancel}>×</button>

      <h1 className="vp-title">{t.voice.pickTitle}</h1>
      <p className="vp-hint">{t.voice.pickHint}</p>

      {/* The wave breathes while a sample plays — the sheet's only motion,
          so it reads as "this is the voice you are hearing". */}
      <div className={"vp-wave" + (playing ? " vp-wave-on" : "")} aria-hidden="true">
        {[18, 34, 52, 30, 44, 22].map((h, i) => (
          <span key={i} style={{ "--h": h + "px", "--i": i }} />
        ))}
      </div>

      <div className="vp-list" role="radiogroup" aria-label={t.voice.pickTitle}>
        {VOICES.map((v) => {
          const on = v.id === sel;
          return (
            <button key={v.id} role="radio" aria-checked={on}
                    className={"vp-row" + (on ? " vp-row-on" : "")}
                    onClick={() => pick(v.id)}>
              <span className="vp-name">{v.id}</span>
              <span className="vp-trait">{t.voice.traits[v.trait]}</span>
            </button>
          );
        })}
      </div>

      <div className="vp-foot">
        <Button onClick={() => onDone(sel)}>{t.voice.pickGo}</Button>
      </div>
    </div>
  );
}
