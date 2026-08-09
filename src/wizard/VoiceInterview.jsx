import { useEffect, useRef, useState } from "react";
import { startVoiceSession } from "../lib/voiceSession.js";
import { t } from "../i18n/index.js";
import DreamScape from "../components/DreamScape.jsx";
import "./voice.css";

/* The dream interview. The assistant asks, the person answers out loud, and
 * the words appear as they are said — that is the whole screen.
 *
 * Everything spoken is also written down, deliberately: half the reason to
 * talk to a phone at 3am is that you cannot see, and the other half is that
 * you do not trust it heard you. The transcript answers the second one.
 *
 * Typing stays available throughout, not as a fallback for when the voice
 * fails but as an equal way in — some things are easier to write than to say
 * out loud, and a dream is often one of them.
 */
export default function VoiceInterview({ onDone, onCancel }) {
  const [state, setState] = useState("connecting");   // connecting|live|error
  const [error, setError] = useState(null);
  const [level, setLevel] = useState(0);
  const [speaking, setSpeaking] = useState(false);
  const [lines, setLines] = useState([]);
  const [typing, setTyping] = useState(false);
  const [draft, setDraft] = useState("");

  const session = useRef(null);
  const collected = useRef({ text: "", people: [], places: [] });
  const endRef = useRef(null);

  useEffect(() => {
    const s = startVoiceSession({
      onReady: () => setState("live"),
      onLevel: setLevel,
      onSpeaking: setSpeaking,
      onError: (code) => { setError(code); setState("error"); },
      onTranscript: ({ who, text }) =>
        // Gemini streams a turn in fragments; appending to the last line of
        // the same speaker keeps it one sentence instead of a stutter of
        // half-words.
        setLines((prev) => {
          const last = prev[prev.length - 1];
          if (last && last.who === who) {
            return [...prev.slice(0, -1), { who, text: last.text + text }];
          }
          return [...prev, { who, text }];
        }),
      onTool: ({ name, args }) => {
        const c = collected.current;
        if (name === "setDreamText" && args.text) c.text = args.text;
        if (name === "addPerson" && args.name) {
          if (!c.people.some((p) => p.name === args.name)) {
            c.people.push({ name: args.name, kind: args.kind === "pet" ? "pet" : "person", desc: args.desc || "" });
          }
        }
        if (name === "addPlace" && args.name && !c.places.includes(args.name)) c.places.push(args.name);
        if (name === "finish") finish();
      },
    });
    session.current = s;
    return () => s.stop();
    // Mount only: a second session would open a second microphone.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [lines]);

  function finish() {
    session.current?.stop();
    const c = collected.current;
    // Whatever was actually said beats whatever the model summarised — if it
    // never called setDreamText, the transcript is still a dream.
    const text = c.text || lines.filter((l) => l.who === "you").map((l) => l.text).join(" ");
    onDone({ text: text.trim(), people: c.people, places: c.places });
  }

  function send() {
    const clean = draft.trim();
    if (!clean) return;
    session.current?.say(clean);
    setDraft("");
    setTyping(false);
  }

  return (
    <div className="vi">
      <DreamScape level={level} speaking={speaking} />

      <header className="vi-top">
        <button className="vi-round" onClick={onCancel} aria-label={t.voice.cancel}>×</button>
        <span className="vi-title">{t.voice.title}</span>
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
        {state === "live" ? (speaking ? t.voice.listening : t.voice.yourTurn) : " "}
      </p>
    </div>
  );
}
