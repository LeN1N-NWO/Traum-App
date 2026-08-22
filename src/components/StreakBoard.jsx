import { MILESTONES, nextMilestone, giftAt } from "../lib/streakBoard.js";
import { SNOOZE_MAX } from "../lib/streak.js";
import { t } from "../i18n/index.js";
import Sheet from "./Sheet.jsx";
import "./streakBoard.css";

/* Das Blatt hinter der Streak-Pille (Antons Go 22.08.): die Serie groß,
 * darunter die Meilenstein-Leiter — erreichte abgehakt, der nächste
 * hervorgehoben, ferne angedeutet. Es zeigt nur, was existiert: die
 * Wesen-Rarität steigt wirklich mit der Serie (creatures.js).
 *
 * Seit dem 22.08. (Antons Ja) trägt die Leiter zusätzlich die zwei Sprossen
 * mit echtem Guthaben, und darunter steht der Schutz: die Schlummernächte.
 * Beides ist gebaut, nicht versprochen — genau das war die Bedingung. */
export default function StreakBoard({ streak = 0, snoozes = 0, nextIn = null, onClose }) {
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
            /* Das wandernde Licht auf der NÄCHSTEN Sprosse (Antons Wunsch
               22.08.: „das will ich hier wieder sehen") — dieselbe Technik
               wie an der Pille, src/styles/orbit.css. Nur die eine Sprosse:
               Wanderte es an mehreren, zeigte es nirgendwohin. */
            <li key={m.nights} className={"stb-rung stb-" + state + (state === "next" ? " orbit" : "")}>
              <span className="stb-check" aria-hidden="true">
                {state === "done" ? "✓" : m.nights}
              </span>
              <span className="stb-body">
                <span className="stb-rung-title">
                  {t.streakBoard.rung(m.nights)}
                  {/* Die zwei Sprossen, an denen wirklich Credits fließen
                      (Plan §5) — sichtbar, damit die Leiter nicht mehr
                      verspricht, als sie hält, und nicht weniger. */}
                  {giftAt(m.nights) > 0 && (
                    <span className="stb-gift">{t.streakBoard.giftBadge(giftAt(m.nights))}</span>
                  )}
                </span>
                <span className="stb-rung-reward">{t.streakBoard.rewards[m.reward]}</span>
              </span>
            </li>
          );
        })}
      </ol>

      {/* Zone 3 des Plans: der Schutz. Er steht UNTER der Leiter, weil er
          kein Ziel ist, sondern ein Netz — man arbeitet nicht darauf hin,
          man ist froh, dass es da ist. */}
      <div className="stb-shield">
        <p className="stb-shield-row">
          <span className="stb-shield-moons" aria-hidden="true">
            {Array.from({ length: SNOOZE_MAX }, (_, i) => (i < snoozes ? "🌙" : "◦")).join(" ")}
          </span>
          <span className="stb-shield-title">{t.streakBoard.snoozeTitle(snoozes)}</span>
        </p>
        <p className="stb-shield-note">
          {nextIn == null ? t.streakBoard.snoozeFull : t.streakBoard.snoozeNext(nextIn)}
        </p>
      </div>

      <p className="stb-note">{t.streakBoard.note}</p>
    </Sheet>
  );
}
