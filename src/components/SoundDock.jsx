import { useEffect, useState } from "react";
import { useAppState } from "../state/AppState.jsx";
import { applyMix, isActive, setMuted, getMuted } from "../lib/soundMixer.js";
import { t } from "../i18n/index.js";
import "./SoundDock.css";

/* The floating mute toggle, visible whenever the sleep mix is playing — on
 * every screen, because the sound follows the person around the app.
 *
 * Also owns the autostart path: browsers only allow audio after a user
 * gesture, so "start my mix when the app opens" arms a one-shot listener
 * and the first tap anywhere starts the saved mix. In the Capacitor build
 * this can become a real autostart.
 */
export default function SoundDock() {
  const { state } = useAppState();
  const [, bump] = useState(0);          // mirror of the mixer's tiny state
  const rerender = () => bump((n) => n + 1);

  useEffect(() => {
    const mix = state.soundMix;
    if (!mix?.autoStart) return;
    if (!Object.values(mix.volumes || {}).some((v) => v > 0)) return;
    const arm = () => { applyMix(mix.volumes); rerender(); };
    window.addEventListener("pointerdown", arm, { once: true });
    return () => window.removeEventListener("pointerdown", arm);
    // Mount-only on purpose: this is "when the app opens", not a live sync.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!isActive()) return null;

  const muted = getMuted();
  return (
    <button
      className={"sounddock" + (muted ? " sounddock-muted" : "")}
      onClick={() => { setMuted(!muted); rerender(); }}
      aria-label={muted ? t.sleep.soundsUnmute : t.sleep.soundsMute}
      aria-pressed={muted}
    >
      {muted ? "🔇" : "🔊"}
    </button>
  );
}
