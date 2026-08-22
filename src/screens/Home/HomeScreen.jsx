import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppState } from "../../state/AppState.jsx";
import { refreshStreak, streakAtRisk, bumpStreak, nextSnoozeIn, STREAK_CAP } from "../../lib/streak.js";
import StreakBoard from "../../components/StreakBoard.jsx";
import MorningCheckin from "../../components/MorningCheckin.jsx";
import { hasPendingJobs } from "../../lib/collector.js";
import { blankNight, nightMarked, isBlank } from "../../lib/blankNight.js";
import { t } from "../../i18n/index.js";
// Vite-gebündelt wie das Intro-Video: 666 KB, ohne Ton, transkodiert aus
// media/video/Faultier-002.mov (7,3 MB).
import homeVideo from "../../assets/home-faultier.mp4";
import "./home.css";

/** Which greeting fits the hour — the app is used late at night and early
 *  in the morning, and "Good evening" at 6am reads as a machine talking. */
function greetingKey(hour) {
  if (hour < 5) return "night";
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}

/* The home screen, as a poster.
 *
 * The film lives INSIDE a rounded card rather than behind the whole screen
 * (chosen 09.08.2026 from three built variants). Two things follow from
 * that and are the reason it won: the card has an edge, so the video reads
 * as a picture someone framed instead of as a background that leaked; and
 * everything below it — last night, the menagerie — sits on calm dark
 * again, where lists belong. A full-bleed video made those look like
 * subtitles.
 *
 * The title and the CTA sit ON the card's lower edge, over the scrim. That
 * is what makes the sloth look at the person reading the question rather
 * than at a caption underneath it.
 */
export default function HomeScreen() {
  const { state, update, toast } = useAppState();
  const navigate = useNavigate();

  // A broken streak drops to 0 when you look at it — otherwise the app keeps
  // claiming "9 days" after a fortnight away.
  useEffect(() => {
    const fresh = refreshStreak(state);
    if (fresh.streak !== state.streak) update(fresh);
    // Deliberately on entry only: re-checking on every state change would
    // loop through update().
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Der letzte TRAUM, nie eine leere Nacht: „Zuletzt geträumt" über einem
  // Eintrag ohne Text wäre genau die Lüge, die der Vermerk vermeiden soll.
  const last = [...(state.journal || [])]
    .filter((e) => !isBlank(e))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];

  /* Die Startseite kennt zwei Momente (Antons „mach mal", 22.08.):
     morgens ist sie der Erzähl-Moment, abends der Einschlaf-Moment —
     dieselbe Seite, andere Betonung. `evening` steuert den Gruß und
     den Einschlafgeräusche-Kurzweg. */
  const hourKey = greetingKey(new Date().getHours());
  const evening = hourKey === "evening" || hourKey === "night";
  const greeting = t.home.greeting[hourKey];
  const rendering = hasPendingJobs(state.journal);
  const streak = state.streak || 0;
  /* Der einzige Tag, an dem ein Hinweis etwas nuetzt: gestern geschrieben,
     heute noch nicht. An jedem anderen Tag waere er entweder ueberfluessig
     oder eine Mahnung an etwas, das ohnehin vorbei ist. */
  const atRisk = streakAtRisk(state);
  const [board, setBoard] = useState(false);

  /* „Nichts hängengeblieben" (Antons Ja 22.08., Plan §3): Ein Tipp, der die
     Serie hält, ohne einen Traum zu erfinden. Er erscheint nur, solange die
     heutige Nacht noch keinen Vermerk hat — und abends nicht, denn abends
     ist die Nacht noch nicht vorbei. */
  const nachtOffen = !evening && !nightMarked(state.journal);
  function markBlankNight() {
    update({
      journal: [...(state.journal || []), blankNight()],
      ...bumpStreak(state),
    });
    toast(t.home.blankDone);
  }

  return (
    <main className="screen h-screen">
      <div className="h-top">
        <p className="h-greeting">{greeting}</p>
        {/* Antippbar seit 22.08. (Antons Go): dahinter liegt die
            Meilenstein-Leiter — was die Serie schon gebracht hat und
            was auf dem Weg wartet. */}
        {streak > 0 && (
          <button
            className={"h-streak orbit" + (atRisk ? " h-streak-risk" : "")}
            onClick={() => setBoard(true)}
            aria-haspopup="dialog"
          >
            <span aria-hidden="true">✦</span> {t.home.streak(streak)} <span aria-hidden="true" data-flip>›</span>
          </button>
        )}
      </div>

      <section className="h-poster">
        <video className="h-poster-video" src={homeVideo}
               autoPlay muted loop playsInline aria-hidden="true" />
        <div className="h-poster-scrim" aria-hidden="true" />
        <div className="h-poster-body">
          <h1 className="h-title">{t.home.title}</h1>
          <p className="h-lede">{t.home.lede}</p>
          <button className="h-cta" onClick={() => navigate("/dream")}>
            {t.home.cta}
          </button>
        </div>
      </section>

      {/* Läuft gerade ein Auftrag, sagt die Startseite es — der Collector
          arbeitet überall, also darf man hier ruhig weiterziehen. */}
      {rendering && (
        <button className="h-rendering" onClick={() => navigate("/journal")}>
          <span className="h-rendering-dot" aria-hidden="true" />
          <span className="h-rendering-text">{t.home.renderingLine}</span>
          <span aria-hidden="true" data-flip>›</span>
        </button>
      )}

      {/* Der Morgen-Check-in (Mehrwert P2a): eine Frage, drei Stufen —
          nur solange der heutige Eintrag fehlt bzw. als stille
          Bestätigung danach. Abends fragt niemand nach dem Schlaf. */}
      {!evening && <MorningCheckin />}

      {/* Direkt unter der Schlaf-Frage, weil er zum selben Moment gehört:
          aufgewacht, kurz hineingehorcht, nichts da. Bewusst leise gesetzt —
          er ist die Notausfahrt, nicht die Hauptstraße. */}
      {nachtOffen && (
        <button className="h-blank" onClick={markBlankNight}>
          <span className="h-blank-text">{t.home.blankCta}</span>
          <span className="h-blank-hint">{t.home.blankHint}</span>
        </button>
      )}

      {/* Abends der Weg ins Einschlafen — die Brücke zum Schlaf-Tab. */}
      {evening && (
        <button
          className="h-sounds"
          /* Direkt in die Klänge, nicht auf die Übersicht: Der Knopf
             verspricht „Einschlafgeräusche starten", und ein Zwischenhalt,
             an dem man dasselbe noch einmal antippt, macht aus einer
             Abkürzung einen Umweg (Antons Befund 22.08.). Der Wunsch reist
             im Router-Zustand — dieselbe Technik wie beim Atlas. */
          onClick={() => navigate("/sleep", { state: { view: "sounds" } })}
        >
          <span aria-hidden="true">🌊</span>
          <span className="h-sounds-text">{t.home.soundsShortcut}</span>
          <span aria-hidden="true" data-flip>›</span>
        </button>
      )}

      {/* Was die Serie einbringt — und nur, solange sie noch etwas einbringt.
          Kein Countdown, keine Drohung: die Zeile sagt, was BESSER wird, nie
          was verloren geht. Begruendung in streak.js. */}
      {streak > 0 && (
        <p className="h-streak-note">
          {atRisk ? t.home.streakRisk : t.home.streakPerk(Math.min(streak, STREAK_CAP), STREAK_CAP)}
        </p>
      )}

      {last && (
        <button className="h-last" onClick={() => navigate("/journal")}>
          <span className="h-last-body">
            <span className="h-last-label">{t.home.lastHeading}</span>
            <span className="h-last-title">{last.title || t.home.untitled}</span>
            <span className="h-last-text">{last.tagline || last.text}</span>
          </span>
        </button>
      )}

      {/* Die Menagerie wohnt seit 21.08. im Journal (Antons Entscheidung):
          Sammlungen zu Sammlungen — die Titelseite hat EINEN Zweck, den
          nächsten Traum anfangen. */}

      {board && (
        <StreakBoard
          streak={streak}
          snoozes={state.snoozes || 0}
          nextIn={nextSnoozeIn(state)}
          onClose={() => setBoard(false)}
        />
      )}
    </main>
  );
}
