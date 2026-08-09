import { useEffect, useRef, useState } from "react";
import { startVoiceSession } from "../../lib/voiceSession.js";
import { isVoice, DEFAULT_VOICE } from "../../lib/voices.js";
import { zodiacOf } from "../../lib/zodiac.js";
import { useAppState } from "../../state/AppState.jsx";
import { t } from "../../i18n/index.js";
import DreamScape from "../../components/DreamScape.jsx";
import VoicePicker from "../../components/VoicePicker.jsx";
import "../../wizard/voice.css";

/* The welcome survey, spoken. Same screen grammar as the dream interview
 * (same voice.css, same transcript) so the assistant feels like ONE person
 * throughout the app — only what it collects differs: profile facts via the
 * onboarding tool set, not a dream.
 *
 * Every field stays optional. onDone receives whatever was actually
 * answered; the caller decides nothing here beyond "they finished". */
export default function OnboardingSurvey({ onDone, onCancel }) {
  const { state: app, update } = useAppState();
  /* Same contract as VoiceInterview.jsx: no socket and no microphone until
   * a voice is settled, and asked only when none is stored yet. For a new
   * install this survey IS the first voice chat, so this is usually where
   * the one question gets asked. */
  const [voice, setVoice] = useState(() =>
    isVoice(app.voice) ? app.voice : null);
  const [state, setState] = useState("connecting");   // connecting|live|error
  const [error, setError] = useState(null);
  const [level, setLevel] = useState(0);
  const [speaking, setSpeaking] = useState(false);
  const [lines, setLines] = useState([]);
  const [typing, setTyping] = useState(false);
  const [draft, setDraft] = useState("");

  const session = useRef(null);
  const collected = useRef({ name: "", birthday: "", zodiac: null, recall: "", lucid: "", themes: [], goal: "" });
  const endRef = useRef(null);

  useEffect(() => {
    if (!voice) return;   // picker still up
    const s = startVoiceSession({
      onReady: () => setState("live"),
      onLevel: setLevel,
      onSpeaking: setSpeaking,
      onError: (code) => { setError(code); setState("error"); },
      onTranscript: ({ who, text }) =>
        setLines((prev) => {
          const last = prev[prev.length - 1];
          if (last && last.who === who) {
            return [...prev.slice(0, -1), { who, text: last.text + text }];
          }
          return [...prev, { who, text }];
        }),
      onTool: ({ name, args }) => {
        const c = collected.current;
        if (name === "setName" && args.name) c.name = String(args.name).slice(0, 40);
        if (name === "setBirthday" && args.date) {
          c.birthday = String(args.date).slice(0, 10);
          c.zodiac = zodiacOf(c.birthday);
        }
        if (name === "setDreamRecall" && args.frequency) c.recall = String(args.frequency).slice(0, 20);
        if (name === "setLucidLevel" && args.level) c.lucid = String(args.level).slice(0, 20);
        if (name === "addTheme" && args.name && c.themes.length < 12) {
          const theme = String(args.name).slice(0, 60);
          if (!c.themes.includes(theme)) c.themes.push(theme);
        }
        if (name === "setGoal" && args.goal) c.goal = String(args.goal).slice(0, 20);
        if (name === "finish") finish();
      },
    }, { mode: "onboarding", lang: app.language || "", voice });
    session.current = s;
    return () => s.stop();
    // Runs once when the picker confirms (null → id) — a second session
    // would open a second microphone.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voice]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [lines]);

  function finish() {
    session.current?.stop();
    onDone({ ...collected.current });
  }

  function send() {
    const clean = draft.trim();
    if (!clean) return;
    session.current?.say(clean);
    setDraft("");
    setTyping(false);
  }

  if (!voice) {
    return (
      <VoicePicker
        current={DEFAULT_VOICE}
        onDone={(id) => { update({ voice: id }); setVoice(id); }}
        onCancel={onCancel}
      />
    );
  }

  return (
    <div className="vi">
      <DreamScape level={level} speaking={speaking} />

      <header className="vi-top">
        <button className="vi-round" onClick={onCancel} aria-label={t.voice.cancel}>×</button>
        <span className="vi-title">{t.onboarding.surveyTitle}</span>
        <span className="vi-round vi-round-ghost" aria-hidden="true" />
      </header>

      <div className="vi-talk">
        {state === "connecting" && <p className="vi-status">{t.voice.connecting}</p>}
        {state === "error" && (
          <p className="vi-status vi-status-bad">{t.voice.errors[error] || t.voice.errors.SOCKET}</p>
        )}

        {lines.map((l, i) => (
          <p key={i} className={"vi-line " + (l.who === "you" ? "vi-line-you" : "vi-line-them")}>
            {l.text}
          </p>
        ))}
        <div ref={endRef} />
      </div>

      {typing ? (
        <div className="vi-compose">
          <input
            className="vi-input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder={t.voice.typePlaceholder}
            aria-label={t.voice.typePlaceholder}
            autoFocus
          />
          <button className="vi-send" onClick={send} aria-label={t.voice.send}>↑</button>
        </div>
      ) : (
        <div className="vi-actions">
          <button className="vi-action" onClick={() => setTyping(true)}>
            <span className="vi-action-icon">✎</span>
            <span className="vi-action-label">{t.voice.type}</span>
          </button>

          <div className="vi-mic" aria-hidden="true">
            <span className="vi-mic-ring" style={{ "--level": level }} />
            <span className="vi-mic-dot" />
          </div>

          <button className="vi-action" onClick={finish} disabled={state !== "live"}>
            <span className="vi-action-icon">✓</span>
            <span className="vi-action-label">{t.voice.finish}</span>
          </button>
        </div>
      )}

      <p className="vi-hint">
        {state === "live" ? (speaking ? t.voice.listening : t.voice.yourTurn) : " "}
      </p>
    </div>
  );
}
