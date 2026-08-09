import { useEffect, useState } from "react";
import { useAppState } from "../../state/AppState.jsx";
import { isVoice, DEFAULT_VOICE } from "../../lib/voices.js";
import { t } from "../../i18n/index.js";
import VoicePicker from "../../components/VoicePicker.jsx";
import { ChevronRight } from "../../components/icons.jsx";
import "./profile.css";

/* Settings. One entry today — which voice the assistant speaks in — and
 * built as a LIST rather than as that one control, because the second and
 * third setting are coming and a screen that has to be redesigned to hold
 * them is a screen built wrong.
 *
 * This is also the only way to change the voice after the first chat: the
 * picker no longer appears before every conversation (see VoiceInterview),
 * so the choice has to live somewhere permanent, and "somewhere permanent"
 * is what settings are.
 */
export default function Settings({ onClose }) {
  const { state, update } = useAppState();
  const [picking, setPicking] = useState(false);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const voice = isVoice(state.voice) ? state.voice : DEFAULT_VOICE;

  if (picking) {
    return (
      <VoicePicker
        current={voice}
        onDone={(id) => { update({ voice: id }); setPicking(false); }}
        onCancel={() => setPicking(false)}
      />
    );
  }

  return (
    <div className="p-set-backdrop" onClick={onClose}>
      <div className="p-set" role="dialog" aria-modal="true"
           aria-label={t.profile.settings} onClick={(e) => e.stopPropagation()}>
        <div className="p-set-grab" aria-hidden="true" />
        <h2 className="p-set-title">{t.profile.settings}</h2>

        <button className="p-set-row" onClick={() => setPicking(true)}>
          <span className="p-set-body">
            <span className="p-set-label">{t.profile.voiceSetting}</span>
            <span className="p-set-hint">{t.profile.voiceSettingHint}</span>
          </span>
          {/* The current voice as its own value, not buried in the hint —
              this row answers "which voice do I have?" without a tap. */}
          <span className="p-set-value">{voice}</span>
          <ChevronRight />
        </button>

        <button className="p-set-close" onClick={onClose}>{t.profile.done}</button>
      </div>
    </div>
  );
}
