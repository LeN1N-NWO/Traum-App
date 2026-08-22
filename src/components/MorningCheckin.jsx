import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
  const today = checkinOn(state.checkins);

  function pick(level) {
    update({ checkins: setCheckin(state.checkins, level) });
  }

  return (
    <div className="mc" role="group" aria-label={t.checkin.question}>
      {today ? (
        /* Die Bestätigung verspricht „…treffen sich in deinem Atlas" — also
           führt sie auch dorthin. Ein Satz, der einen Ort nennt und nicht
           hingeht, lässt den Menschen suchen. */
        <button className="mc-done" onClick={() => navigate("/journal", { state: { view: "atlas" } })}>
          <span aria-hidden="true">{t.checkin.emoji[today.sleep]}</span>
          <span className="mc-done-text">{t.checkin.thanks}</span>
          <span className="mc-done-go" data-flip aria-hidden="true">›</span>
        </button>
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
