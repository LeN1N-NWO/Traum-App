import { useEffect, useRef, useState } from "react";

/* Voice input via the Web Speech API — client-side, no key, no server.
 *
 * `supported` is false wherever the API is missing; callers must hide the mic
 * then rather than show a button that does nothing. Notably: iOS Safari and
 * Capacitor WebViews are unreliable here. That is fine — on iOS the system
 * keyboard has its own dictation microphone that works in any text field, so
 * there is always a way to speak a dream. If we ever want an in-app mic on
 * iOS, that is a Capacitor plugin, not something to hand-roll.
 *
 * `base` is the text present when recording starts: results are appended to
 * it, so dictation extends what is already written instead of replacing it.
 */
export function useVoiceInput({ onText }) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const recRef = useRef(null);
  const baseRef = useRef("");
  const onTextRef = useRef(onText);
  onTextRef.current = onText;

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    setSupported(true);

    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";

    rec.onresult = (e) => {
      let out = "";
      for (let i = 0; i < e.results.length; i++) out += e.results[i][0].transcript;
      onTextRef.current((baseRef.current + " " + out).trim());
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);

    recRef.current = rec;
    return () => { try { rec.stop(); } catch { /* already stopped */ } };
  }, []);

  function toggle(currentText) {
    const rec = recRef.current;
    if (!rec) return;
    if (listening) { rec.stop(); return; }
    baseRef.current = currentText || "";
    setListening(true);
    try { rec.start(); } catch { setListening(false); }
  }

  return { supported, listening, toggle };
}
