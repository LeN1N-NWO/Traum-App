import { useEffect, useRef, useState } from "react";
import { startVoiceSession } from "../lib/voiceSession.js";
import { isVoice, DEFAULT_VOICE } from "../lib/voices.js";
import { useAppState } from "../state/AppState.jsx";
import { t } from "../i18n/index.js";
import DreamScape from "../components/DreamScape.jsx";
import VoicePicker from "../components/VoicePicker.jsx";
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
export default function VoiceInterview({ onDone, onEarly, onDraft, onCancel }) {
  const { state: app, update } = useAppState();
  /* The chosen voice, or null while the picker is up — the session must not
   * open (and the microphone must not turn on) until one is settled.
   *
   * Asked exactly ONCE, on the first voice chat ever. After that the stored
   * choice is used straight away and this screen goes directly to talking:
   * being asked "which voice?" every time you want to tell a dream at 3am
   * is a toll booth in front of the one thing the app is for. Changing it
   * later lives in Profile → Settings. */
  const [voice, setVoice] = useState(() =>
    isVoice(app.voice) ? app.voice : null);
  const [state, setState] = useState("connecting");   // connecting|live|error
  const [error, setError] = useState(null);
  // Zählt „Nochmal versuchen" hoch — der Session-Effekt hängt daran und
  // baut die Verbindung sauber neu auf, statt an der toten zu kleben.
  const [attempt, setAttempt] = useState(0);
  const [level, setLevel] = useState(0);
  const [speaking, setSpeaking] = useState(false);
  const [lines, setLines] = useState([]);
  const [typing, setTyping] = useState(false);
  const [draft, setDraft] = useState("");

  const session = useRef(null);
  const collected = useRef({ text: "", people: [], places: [] });
  const endRef = useRef(null);

  /* Who the assistant is talking to. The survey name wins — it is what they
   * said they want to be CALLED, while the tag is an @mention that merely
   * resembles one (stored lowercase; first letter goes back up for speech).
   * Read once at mount — see the effect below. */
  const who = useRef({
    name: app.profile?.name
      || (app.me?.tag ? app.me.tag[0].toUpperCase() + app.me.tag.slice(1) : ""),
    cast: (app.cast || []).map((c) => c.tag).filter(Boolean),
    // Chosen once in LanguagePicker, not guessed from the device — see
    // voiceSession.js and voiceSystem() in server.js for what this drives.
    lang: app.language || "",
  });

  useEffect(() => {
    if (!voice) return;   // picker still up — no socket, no microphone
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
        if (name === "setDreamText" && args.text) { c.text = args.text; draftSettled(); }
        if (name === "addPerson" && args.name) {
          if (!c.people.some((p) => p.name === args.name)) {
            c.people.push({ name: args.name, kind: args.kind === "pet" ? "pet" : "person", desc: args.desc || "" });
          }
        }
        if (name === "addPlace" && args.name && !c.places.includes(args.name)) c.places.push(args.name);
        if (name === "finish") finish();
      },
    }, { ...who.current, voice });
    session.current = s;
    return () => s.stop();
    // Runs once when the picker confirms (null → id) — a second session
    // would open a second microphone. `attempt` re-runs it deliberately,
    // after the person pressed "try again" on the error panel.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voice, attempt]);

  /* Die Uhr gegen die tote Schleife: Antwortet der Voice-Dienst nicht
     binnen 12 Sekunden mit „ready" (kein Server, kein Schlüssel, kaputtes
     Netz), wird aus dem wortlosen „Waking up…" ein Fehler mit Auswegen.
     Antons Befund 21.08.: ohne API hing der Schirm einfach still. */
  useEffect(() => {
    if (!voice || state !== "connecting") return;
    const id = setTimeout(() => {
      session.current?.stop();
      setError("TIMEOUT");
      setState("error");
    }, 12000);
    return () => clearTimeout(id);
  }, [voice, state, attempt]);

  function retry() {
    setLines([]);
    setError(null);
    setState("connecting");
    setAttempt((a) => a + 1);
  }

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [lines]);

  /* Vorauslesen, während noch geredet wird (Antons Wunsch 22.08.: „schon
   * eher laufen lassen").
   *
   * Die Stimme ruft setDreamText, sobald der Traum Form annimmt — meist
   * lange vor dem Abschied. Steht dieser Text ein paar Sekunden still, ist
   * er mit hoher Wahrscheinlichkeit der endgültige, und die Auswertung kann
   * JETZT loslaufen statt nach dem letzten Wort. Damit ist sie oft schon
   * fertig, wenn der Bildschirm umschaltet.
   *
   * Der Preis für einen Fehlgriff ist bekannt und winzig: Ändert sich der
   * Text danach doch noch, wirft der Aufrufer das Ergebnis weg und liest neu
   * — ein DeepSeek-Aufruf kostet $0,00026. Der Deckel unten verhindert
   * trotzdem, dass ein Mensch, der in kurzen Sätzen erzählt, ein Dutzend
   * Läufe auslöst. */
  const draftTimer = useRef(null);
  const drafts = useRef(0);
  const MAX_DRAFTS = 3;
  const DRAFT_STILL_MS = 2500;

  function draftSettled() {
    if (!onDraft || drafts.current >= MAX_DRAFTS) return;
    clearTimeout(draftTimer.current);
    draftTimer.current = setTimeout(() => {
      const text = (collected.current.text || "").trim();
      // Unter 80 Zeichen ist es noch kein Traum, sondern ein Satzanfang.
      if (text.length < 80) return;
      drafts.current += 1;
      onDraft(text);
    }, DRAFT_STILL_MS);
  }

  useEffect(() => () => clearTimeout(draftTimer.current), []);

  /* Der Abschied (Antons Befund 22.08.: „sie konnte nicht mal aussprechen,
   * schon waren wir weiter").
   *
   * Drei Dinge in dieser Reihenfolge, und die Reihenfolge ist der Punkt:
   *   1. Mikrofon aus — wer „fertig" gesagt hat, will nicht weiter belauscht
   *      werden. Die Verbindung bleibt offen, sonst kämen die letzten
   *      Tonstücke des Abschiedssatzes nie an.
   *   2. Der Traum geht SOFORT an den Aufrufer (onEarly) — die Analyse läuft
   *      damit los, WÄHREND die Stimme noch spricht. Genau die Sekunden, die
   *      man vorher als Ladebalken absaß, sind jetzt der Abschied.
   *   3. Erst wenn der letzte Ton verklungen ist, wird umgeschaltet.
   *
   * `closing` ist der Riegel dagegen, dass das zweimal läuft: Die Stimme
   * ruft `finish` als Werkzeug auf, und der Mensch kann gleichzeitig auf
   * „Fertig" tippen. */
  const closing = useRef(false);
  async function finish() {
    if (closing.current) return;
    closing.current = true;

    session.current?.stopListening();
    const c = collected.current;
    // Whatever was actually said beats whatever the model summarised — if it
    // never called setDreamText, the transcript is still a dream.
    const text = (c.text || lines.filter((l) => l.who === "you").map((l) => l.text).join(" ")).trim();
    const payload = { text, people: c.people, places: c.places };

    onEarly?.(payload);
    await session.current?.drain();
    session.current?.stop();
    onDone(payload);
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
        <span className="vi-title">{t.voice.title}</span>
        <span className="vi-round vi-round-ghost" aria-hidden="true" />
      </header>

      <div className="vi-talk">
        {state === "connecting" && <p className="vi-status">{t.voice.connecting}</p>}
        {/* Gestaltet statt einer kleinen roten Zeile: Überschrift, was
            passiert ist, und zwei Auswege — nochmal, oder zurück. */}
        {state === "error" && (
          <div className="vi-error" role="alert">
            <p className="vi-error-title">{t.voice.errorTitle}</p>
            <p className="vi-error-msg">{t.voice.errors[error] || t.voice.errors.SOCKET}</p>
            <p className="vi-error-hint">{t.voice.errorHint}</p>
            <div className="vi-error-actions">
              <button className="vi-error-btn vi-error-primary" onClick={retry}>{t.voice.retry}</button>
              <button className="vi-error-btn" onClick={onCancel}>{t.voice.back}</button>
            </div>
          </div>
        )}

        {lines.map((l, i) => (
          <p key={i} className={"vi-line " + (l.who === "you" ? "vi-line-you" : "vi-line-them")}>
            {l.text}
          </p>
        ))}
        <div ref={endRef} />
      </div>

      {/* Im Fehlerzustand keine Bedienleiste: Das Mikro ist tot und
          Getipptes ginge ins Leere — die Auswege stehen im Fehler-Feld. */}
      {state === "error" ? null : typing ? (
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
