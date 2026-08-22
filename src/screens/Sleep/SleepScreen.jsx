import { useState, useEffect } from "react";
import { useAppState } from "../../state/AppState.jsx";
import { setVolume, getVolumes, startTimer, subscribe } from "../../lib/soundMixer.js";
import { SOUND_IDS } from "../../lib/noise.js";
import { t } from "../../i18n/index.js";
import ScreenHeader from "../../components/ScreenHeader.jsx";
import SleepChecklist from "./SleepChecklist.jsx";
import LucidGuide from "../Profile/LucidGuide.jsx";
import SymbolsScreen from "../Symbols/SymbolsScreen.jsx";
import "./sleep.css";

/* The free-content home: everything around the dream, none of it costs a
 * credit. A tile overview opens one section at a time — no sub-routes, the
 * tab stays a single screen the back button cannot get lost in. */
const SECTIONS = ["checklist", "sounds", "guide", "symbols"];

/* Vier Wahlmöglichkeiten, nicht acht: Wer im Dunkeln tippt, will nicht
   rechnen. 0 = aus. */
const TIMER_CHOICES = [0, 15, 30, 60];

export default function SleepScreen() {
  const [view, setView] = useState(null);   // null | one of SECTIONS

  if (view) {
    const section = t.sleep.tiles[view];
    return (
      <main className="screen">
        <button className="sl-back" onClick={() => setView(null)}><span data-flip aria-hidden="true">‹</span> {t.sleep.title}</button>
        <ScreenHeader title={section.title} subtitle={section.text} />
        {view === "checklist" && <SleepChecklist />}
        {view === "sounds" && <SoundMixerPanel />}
        {view === "guide" && <LucidGuide />}
        {view === "symbols" && <SymbolsScreen embedded />}
      </main>
    );
  }

  return (
    <main className="screen">
      <ScreenHeader title={t.sleep.title} subtitle={t.sleep.subtitle} />
      <div className="sl-tiles">
        {SECTIONS.map((id) => (
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
  const timer = savedMix.timer || 0;

  /* Das Ende des Einschlaf-Timers ist die einzige Änderung am Mix, die von
     selbst passiert — ohne diesen Melder stünden die Regler noch auf 40 %,
     während längst Stille ist. */
  useEffect(() => subscribe(() => setVols(getVolumes())), []);

  function change(id, v) {
    setVolume(id, v);
    const next = { ...vols, [id]: v };
    setVols(next);
    update({ soundMix: { ...savedMix, volumes: next } });
    // Der Timer zählt ab der letzten Berührung: Wer noch am Mischen ist,
    // schläft nicht — und will nicht in zwei Minuten in die Stille fallen.
    if (timer) startTimer(timer);
  }

  function pickTimer(minutes) {
    startTimer(minutes);
    update({ soundMix: { ...savedMix, volumes: vols, timer: minutes } });
  }

  return (
    <div className="sl-sounds">
      <p className="sl-lede">{t.sleep.sounds.lede}</p>

      {/* One row per noise colour: name as a chip, the track a pill that
          fills from the left, the loudness as a number at its end — the
          whole row reads at a glance in the dark, which is where this
          screen is actually used. */}
      {SOUND_IDS.map((id) => (
        <label key={id} className="sl-slider" title={t.sleep.sounds.descs[id]}>
          <span className="sl-chip">{t.sleep.sounds.names[id]}</span>
          <span className="sl-track">
            <input
              className="sl-range"
              type="range" min="0" max="1" step="0.01"
              value={vols[id]}
              style={{ "--p": `${Math.round(vols[id] * 100)}%` }}
              onChange={(e) => change(id, Number(e.target.value))}
              aria-label={`${t.sleep.sounds.names[id]} — ${t.sleep.sounds.descs[id]}`}
            />
            <output className="sl-val" aria-hidden="true">{Math.round(vols[id] * 100)}</output>
          </span>
        </label>
      ))}

      {/* Der Einschlaf-Timer (Mehrwert-Plan P3b): eine Zeile, vier Knöpfe.
          Ausgeblendet wird über eine Minute — ein Rauschen, das abrupt
          aufhört, weckt genau den, der gerade eingeschlafen ist. */}
      <div className="sl-timer" role="group" aria-label={t.sleep.sounds.timer}>
        <span className="sl-timer-label">{t.sleep.sounds.timer}</span>
        <div className="sl-timer-row">
          {TIMER_CHOICES.map((m) => (
            <button
              key={m}
              className={"sl-timer-btn" + (timer === m ? " sl-timer-on" : "")}
              aria-pressed={timer === m}
              onClick={() => pickTimer(m)}
            >
              {m === 0 ? t.sleep.sounds.timerOff : t.sleep.sounds.timerMin(m)}
            </button>
          ))}
        </div>
      </div>

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
