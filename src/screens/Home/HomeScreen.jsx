import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppState } from "../../state/AppState.jsx";
import { refreshStreak, streakAtRisk, STREAK_CAP } from "../../lib/streak.js";
import { t } from "../../i18n/index.js";
import Menagerie from "./Menagerie.jsx";
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
  const { state, update } = useAppState();
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

  const last = [...(state.journal || [])]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];

  const greeting = t.home.greeting[greetingKey(new Date().getHours())];
  const streak = state.streak || 0;
  /* Der einzige Tag, an dem ein Hinweis etwas nuetzt: gestern geschrieben,
     heute noch nicht. An jedem anderen Tag waere er entweder ueberfluessig
     oder eine Mahnung an etwas, das ohnehin vorbei ist. */
  const atRisk = streakAtRisk(state);

  return (
    <main className="screen h-screen">
      <div className="h-top">
        <p className="h-greeting">{greeting}</p>
        {streak > 0 && (
          <p className={"h-streak" + (atRisk ? " h-streak-risk" : "")}>
            <span aria-hidden="true">✦</span> {t.home.streak(streak)}
          </p>
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

      <h2 className="h-section">{t.home.menagerieHeading}</h2>
      <Menagerie />
    </main>
  );
}
