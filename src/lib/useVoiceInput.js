import { useRef, useState } from "react";
import { transcribe } from "./api.js";

/* Voice input: record with MediaRecorder, transcribe with Whisper (Wizper on
 * fal.ai) via /api/transcribe.
 *
 * This replaced the Web Speech API on 2026-08-08. That API was hardwired to
 * en-US, understood German not at all and English poorly, and never worked in
 * iOS Safari or Capacitor WebViews. MediaRecorder works in all of those, and
 * Whisper auto-detects the spoken language — so the same mic button now takes
 * German and English without a toggle.
 *
 * The trade-off is latency: nothing appears while speaking; the text arrives
 * once, after the recording is stopped and transcribed. `busy` covers that
 * gap so the UI can say "transcribing…" instead of looking dead.
 *
 * `base` is the text present when recording starts: the transcript is
 * appended to it, so dictation extends what is already written instead of
 * replacing it.
 */

// Whisper handles any container; the browser picks whichever it can record.
// Safari (incl. Capacitor WebViews) records audio/mp4, everyone else webm.
const MIME_CANDIDATES = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"];

// Auto-stop as a safety net: bounds the upload (the server rejects bodies
// over 12 MB) and stops a mic left running by accident from recording forever.
const MAX_RECORDING_MS = 5 * 60 * 1000;

export function useVoiceInput({ onText, onError }) {
  const supported =
    typeof navigator !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof MediaRecorder !== "undefined";

  const [listening, setListening] = useState(false);
  const [busy, setBusy] = useState(false);
  const recRef = useRef(null);
  const baseRef = useRef("");
  const onTextRef = useRef(onText);
  const onErrorRef = useRef(onError);
  onTextRef.current = onText;
  onErrorRef.current = onError;

  async function start(currentText) {
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      onErrorRef.current?.("MIC_DENIED");
      return;
    }

    const mimeType = MIME_CANDIDATES.find((m) => MediaRecorder.isTypeSupported(m));
    const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    const chunks = [];
    rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };

    const timer = setTimeout(() => { if (rec.state === "recording") rec.stop(); }, MAX_RECORDING_MS);

    rec.onstop = async () => {
      clearTimeout(timer);
      for (const track of stream.getTracks()) track.stop(); // release the mic promptly
      setListening(false);
      recRef.current = null;

      const blob = new Blob(chunks, { type: rec.mimeType || "audio/webm" });
      if (!blob.size) return;

      setBusy(true);
      try {
        const dataUri = await blobToDataUri(blob);
        const text = (await transcribe(dataUri)).trim();
        if (text) onTextRef.current((baseRef.current + " " + text).trim());
      } catch (err) {
        onErrorRef.current?.(err.message);
      }
      setBusy(false);
    };

    baseRef.current = currentText || "";
    recRef.current = rec;
    setListening(true);
    rec.start();
  }

  function toggle(currentText) {
    if (busy) return;
    const rec = recRef.current;
    if (rec) {
      if (rec.state === "recording") rec.stop();
      return;
    }
    start(currentText);
  }

  return { supported, listening, busy, toggle };
}

function blobToDataUri(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("READ_FAILED"));
    reader.readAsDataURL(blob);
  });
}
