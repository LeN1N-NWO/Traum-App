import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAppState } from "../../state/AppState.jsx";
import { setVolume, getVolumes, startTimer, subscribe } from "../../lib/soundMixer.js";
import { SOUND_IDS } from "../../lib/noise.js";
import { t } from "../../i18n/index.js";
import { IconWindDown, IconWaves, IconLucid, IconConstellation } from "../../components/icons.jsx";
import SleepChecklist from "./SleepChecklist.jsx";
import LucidGuide from "../Profile/LucidGuide.jsx";
import SymbolsScreen from "../Symbols/SymbolsScreen.jsx";
import "./sleep.css";

/* The free-content home: everything around the dream, none of it costs a
 * credit. A tile overview opens one section at a time — no sub-routes, the
 * tab stays a single screen the back button cannot get lost in. */
const SECTIONS = ["checklist", "sounds", "guide", "symbols"];

/* Strich-Icons derselben Familie wie die Tab-Leiste — die Emoji sind raus
   (Antons Befund 25.08.: jede Plattform malt sie anders, und vier bunte
   Fremdkörper machen aus einer Übersicht einen Basar). Die Emoji-Felder in
   den Sprachdateien bleiben stehen, bis alle sieben nachgezogen sind —
   gelesen werden sie hier nicht mehr. */
const TILE_ICONS = {
  checklist: IconWindDown,
  sounds: IconWaves,
  guide: IconLucid,
  symbols: IconConstellation,
};

/* Volle Zeilen statt 2×2-Kacheln — Antons Wahl am 25.08. aus drei live
   umschaltbaren Varianten (A Altäre im Raster, B Zeilen, C stille
   Quadrate). Eine Zeile kann nicht ungleich neben ihrer Nachbarin stehen —
   genau die Krankheit des alten Rasters, in dem verschieden lange Texte
   die Kacheln gegeneinander verschoben. */

/* Vier Wahlmöglichkeiten, nicht acht: Wer im Dunkeln tippt, will nicht
   rechnen. 0 = aus. */
const TIMER_CHOICES = [0, 15, 30, 60];

export default function SleepScreen() {
  /* Der Abschnitt kann von außen gewünscht werden (Startseite →
     „Einschlafgeräusche starten"). Wie beim Atlas reist der Wunsch im
     Router-Zustand und nicht in der Adresse: Er gilt für DIESEN Sprung,
     nicht für ein Lesezeichen — und weil der Bildschirm beim Routenwechsel
     ohnehin neu montiert, genügt der Startwert. */
  const gewuenscht = useLocation().state?.view;
  const [view, setView] = useState(SECTIONS.includes(gewuenscht) ? gewuenscht : null);

  if (view) {
    const section = t.sleep.tiles[view];
    const Icon = TILE_ICONS[view];
    /* Dieselbe Bühne wie die Übersicht — Schein, Icon im Kreis, Serife —
       nur der Schein trägt die Farbe seines Raums (Antons Befund 25.08.:
       die Unterseiten sahen „mau" aus neben der neuen Hauptseite). Der
       ScreenHeader ist hier raus; er lebt in den übrigen Tabs weiter. */
    return (
      <main className="screen sl-screen">
        <div className={`sl-hero sl-hero-${view}`} aria-hidden="true" />
        <button className="sl-back" onClick={() => setView(null)}><span data-flip aria-hidden="true">‹</span> {t.sleep.title}</button>
        <header className="sl-head sl-head-sub">
          <span className="sl-head-icon" aria-hidden="true"><Icon /></span>
          <h1 className="sl-title sl-title-sub">{section.title}</h1>
          <p className="sl-sub">{section.text}</p>
        </header>
        {view === "checklist" && <SleepChecklist />}
        {view === "sounds" && <SoundMixerPanel />}
        {view === "guide" && <LucidGuide />}
        {view === "symbols" && <SymbolsScreen embedded />}
      </main>
    );
  }

  /* Kein ScreenHeader mehr: Die Übersicht ist die Bühne dieses Tabs, und
     sie bekommt eine echte Überschrift — zentriert, in der Serife der
     Traumtitel, mit dem Nachthimmel-Schein des Kaufblatts dahinter
     (Antons Befund 25.08.: die kleine Randüberschrift „ist doch keine
     Überschrift wert"). Die Unterseiten tragen seit dem Abend dieselbe
     Bühne in der Farbe ihres Raums — siehe oben im view-Zweig. */
  return (
    <main className="screen sl-screen">
      <div className="sl-hero" aria-hidden="true" />
      <header className="sl-head">
        <h1 className="sl-title">{t.sleep.title}</h1>
        <p className="sl-sub">{t.sleep.subtitle}</p>
      </header>
      <div className="sl-tiles">
        {SECTIONS.map((id) => {
          const Icon = TILE_ICONS[id];
          return (
            <button key={id} className={`sl-tile sl-tile-${id}`} onClick={() => setView(id)}>
              <span className="sl-tile-icon" aria-hidden="true"><Icon /></span>
              <span className="sl-tile-title">{t.sleep.tiles[id].title}</span>
              <span className="sl-tile-text">{t.sleep.tiles[id].text}</span>
            </button>
          );
        })}
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

  /* Das Mischpult — Antons Wahl (26.08.) aus zwei live umschaltbaren
     Gestalten; die Farbkarten-Variante ist ausgebaut. Drei stehende Fader
     wie an einem echten Pult, jede Rauschfarbe in ihrem eigenen Ton. */
  return (
    <div className="sl-sounds">
      <div className="sl-pult">
          {SOUND_IDS.map((id) => (
            <label key={id} className={`sl-fader sl-sound-${id}`} title={t.sleep.sounds.descs[id]}>
              <span className="sl-fader-slot">
                <input
                  className="sl-fader-range"
                  type="range" min="0" max="1" step="0.01"
                  value={vols[id]}
                  style={{ "--p": `${Math.round(vols[id] * 100)}%` }}
                  onChange={(e) => change(id, Number(e.target.value))}
                  aria-label={`${t.sleep.sounds.names[id]} — ${t.sleep.sounds.descs[id]}`}
                />
              </span>
              <output className="sl-fader-val" aria-hidden="true">{Math.round(vols[id] * 100)}</output>
              <span className="sl-fader-name">{t.sleep.sounds.names[id]}</span>
            </label>
          ))}
      </div>

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
