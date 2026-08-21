import { checkinOn, setCheckin, SLEEP_LEVELS } from "../lib/checkin.js";
import { useAppState } from "../state/AppState.jsx";
import { t } from "../i18n/index.js";
import "./morningCheckin.css";

/* Der Morgen-Check-in (Mehrwert P2a) — die Oberfläche zum Rechenteil aus
 * der Cloud-Session (checkin.js): EINE Frage, drei Stufen, ein Tipp.
 * Erscheint, solange der heutige Eintrag fehlt; danach eine stille
 * Bestätigung statt der Frage — die Karte verschwindet nicht sofort,
 * sonst wirkt der Tipp wie verschluckt. */
export default function MorningCheckin() {
  const { state, update } = useAppState();
  const today = checkinOn(state.checkins);

  function pick(level) {
    update({ checkins: setCheckin(state.checkins, level) });
  }

  return (
    <div className="mc" role="group" aria-label={t.checkin.question}>
      {today ? (
        <p className="mc-done">
          <span aria-hidden="true">{t.checkin.emoji[today.sleep]}</span> {t.checkin.thanks}
        </p>
      ) : (
        <>
          <p className="mc-q">{t.checkin.question}</p>
          <div className="mc-row">
            {SLEEP_LEVELS.map((lvl) => (
              <button key={lvl} className="mc-btn" onClick={() => pick(lvl)}>
                <span className="mc-emoji" aria-hidden="true">{t.checkin.emoji[lvl]}</span>
                <span className="mc-label">{t.checkin.levels[lvl]}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
