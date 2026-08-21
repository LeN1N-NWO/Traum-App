import { MILESTONES, nextMilestone } from "../lib/streakBoard.js";
import { t } from "../i18n/index.js";
import Sheet from "./Sheet.jsx";
import "./streakBoard.css";

/* Das Blatt hinter der Streak-Pille (Antons Go 22.08.): die Serie groß,
 * darunter die Meilenstein-Leiter — erreichte abgehakt, der nächste
 * hervorgehoben, ferne angedeutet. Es zeigt nur, was existiert: die
 * Wesen-Rarität steigt wirklich mit der Serie (creatures.js). Credits
 * und Schlummernacht kommen erst nach Antons Entscheidung dazu
 * (Plan streak-board-gamification §5/§6). */
export default function StreakBoard({ streak = 0, onClose }) {
  const nxt = nextMilestone(streak);

  return (
    <Sheet label={t.streakBoard.title} onClose={onClose}>
      <p className="sb-sheet-label">{t.streakBoard.title}</p>
      <p className="stb-count">
        <span className="stb-count-n">{streak}</span> {t.streakBoard.nights(streak)}
      </p>
      <p className="stb-lede">
        {nxt ? t.streakBoard.next(nxt.nights - streak) : t.streakBoard.done}
      </p>

      <ol className="stb-ladder">
        {MILESTONES.map((m) => {
          const state = streak >= m.nights ? "done" : nxt && m.nights === nxt.nights ? "next" : "far";
          return (
            <li key={m.nights} className={"stb-rung stb-" + state}>
              <span className="stb-check" aria-hidden="true">
                {state === "done" ? "✓" : m.nights}
              </span>
              <span className="stb-body">
                <span className="stb-rung-title">{t.streakBoard.rung(m.nights)}</span>
                <span className="stb-rung-reward">{t.streakBoard.rewards[m.reward]}</span>
              </span>
            </li>
          );
        })}
      </ol>

      <p className="stb-note">{t.streakBoard.note}</p>
    </Sheet>
  );
}
