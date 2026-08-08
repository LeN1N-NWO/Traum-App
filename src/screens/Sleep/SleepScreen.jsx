import { useState } from "react";
import { useAppState } from "../../state/AppState.jsx";
import { setVolume, getVolumes } from "../../lib/soundMixer.js";
import { SOUND_IDS } from "../../lib/noise.js";
import { t } from "../../i18n/index.js";
import ScreenHeader from "../../components/ScreenHeader.jsx";
import SleepChecklist from "./SleepChecklist.jsx";
import LucidGuide from "../Profile/LucidGuide.jsx";
import "./sleep.css";

/* The free-content home: everything around the dream, none of it costs a
 * credit. A tile overview opens one section at a time — no sub-routes, the
 * tab stays a single screen the back button cannot get lost in. */
export default function SleepScreen() {
  const [view, setView] = useState(null);   // null | "checklist" | "sounds" | "guide"

  if (view) {
    const section = t.sleep.tiles[view];
    return (
      <main className="screen">
        <button className="sl-back" onClick={() => setView(null)}>‹ {t.sleep.title}</button>
        <ScreenHeader title={section.title} subtitle={section.text} />
        {view === "checklist" && <SleepChecklist />}
        {view === "sounds" && <SoundMixerPanel />}
        {view === "guide" && <LucidGuide />}
      </main>
    );
  }

  return (
    <main className="screen">
      <ScreenHeader title={t.sleep.title} subtitle={t.sleep.subtitle} />
      <div className="sl-tiles">
        {["checklist", "sounds", "guide"].map((id) => (
          <button key={id} className={`sl-tile sl-tile-${id}`} onClick={() => setView(id)}>
            <span className="sl-tile-emoji" aria-hidden="true">{t.sleep.tiles[id].emoji}</span>
            <span className="sl-tile-title">{t.sleep.tiles[id].title}</span>
            <span className="sl-tile-text">{t.sleep.tiles[id].text}</span>
          </button>
        ))}
      </div>
      <p className="sl-free">{t.sleep.free}</p>
    </main>
  );
}

/* Three sliders, one per noise colour — running them together IS the mix.
 * Volumes go straight to the mixer (a user gesture, so audio is allowed) and
 * into app state, which is what the autostart preference replays. */
function SoundMixerPanel() {
  const { state, update } = useAppState();
  const [vols, setVols] = useState(getVolumes);

  const savedMix = state.soundMix || { autoStart: false, volumes: {} };

  function change(id, v) {
    setVolume(id, v);
    const next = { ...vols, [id]: v };
    setVols(next);
    update({ soundMix: { ...savedMix, volumes: next } });
  }

  return (
    <div className="sl-sounds">
      <p className="sl-lede">{t.sleep.sounds.lede}</p>

      {SOUND_IDS.map((id) => (
        <label key={id} className="sl-slider">
          <span className="sl-slider-name">
            {t.sleep.sounds.names[id]}
            <small>{t.sleep.sounds.descs[id]}</small>
          </span>
          <input
            type="range" min="0" max="1" step="0.01"
            value={vols[id]}
            onChange={(e) => change(id, Number(e.target.value))}
            aria-label={t.sleep.sounds.names[id]}
          />
        </label>
      ))}

      <label className="sl-autostart">
        <input
          type="checkbox"
          checked={!!savedMix.autoStart}
          onChange={(e) => update({ soundMix: { ...savedMix, volumes: vols, autoStart: e.target.checked } })}
        />
        <span>
          {t.sleep.sounds.autoStart}
          <small>{t.sleep.sounds.autoStartHint}</small>
        </span>
      </label>

      <p className="sl-hint">{t.sleep.sounds.background}</p>
    </div>
  );
}
