import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppState } from "../../state/AppState.jsx";
import { refreshStreak } from "../../lib/streak.js";
import { t } from "../../i18n/index.js";
import Menagerie from "./Menagerie.jsx";
// Vite-gebündelt wie das Intro-Video: 666 KB, ohne Ton, transkodiert aus
// media/video/Faultier-002.mov (7,3 MB). Läuft leicht abgedunkelt als
// Hintergrund — siehe die Varianten unten.
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

/* ⚠ DEV-ONLY (09.08.2026): three layout variants behind a floating A/B/C
 * switcher, so Anton can pick one live. Once chosen, the two losers and the
 * switcher get deleted and the winner becomes THE home screen. The variants:
 *   a  „Himmel"  — the video replaces the sky gradient in the top 62vh,
 *                  everything else keeps its place.
 *   b  „Kino"    — the video runs full-screen behind everything; the cards
 *                  float over it as glass.
 *   c  „Karte"   — the video lives inside one big rounded poster card with
 *                  the title and CTA on its lower edge, Withings-style.
 */
export default function HomeScreen() {
  const { state, update } = useAppState();
  const navigate = useNavigate();
  const [variant, setVariant] = useState(() =>
    localStorage.getItem("dev_home_variant") || "a");

  function pick(v) {
    setVariant(v);
    localStorage.setItem("dev_home_variant", v);
  }

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

  const topRow = (
    <div className="h-top">
      <p className="h-greeting">{greeting}</p>
      {streak > 0 && (
        <p className="h-streak">
          <span aria-hidden="true">✦</span> {t.home.streak(streak)}
        </p>
      )}
    </div>
  );

  const lastCard = last && (
    <button className="h-last" onClick={() => navigate("/journal")}>
      <span className="h-last-body">
        <span className="h-last-label">{t.home.lastHeading}</span>
        <span className="h-last-title">{last.title || t.home.untitled}</span>
        <span className="h-last-text">{last.tagline || last.text}</span>
      </span>
    </button>
  );

  const switcher = (
    <div className="h-dev-switch" aria-hidden="true">
      {["a", "b", "c"].map((v) => (
        <button key={v}
                className={"h-dev-pill" + (v === variant ? " h-dev-on" : "")}
                onClick={() => pick(v)}>
          {v.toUpperCase()}
        </button>
      ))}
    </div>
  );

  if (variant === "c") {
    return (
      <main className="screen h-screen h-v-c">
        {topRow}
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
        {lastCard}
        <h2 className="h-section">{t.home.menagerieHeading}</h2>
        <Menagerie />
        {switcher}
      </main>
    );
  }

  return (
    <main className={`screen h-screen h-v-${variant}`}>
      <div className={variant === "b" ? "h-cine" : "h-sky"} aria-hidden="true">
        <video className="h-bg-video" src={homeVideo}
               autoPlay muted loop playsInline />
        <span className="h-sky-veil" />
      </div>

      {topRow}

      <section className="h-hero">
        <h1 className="h-title">{t.home.title}</h1>
        <p className="h-lede">{t.home.lede}</p>
        <button className="h-cta" onClick={() => navigate("/dream")}>
          {t.home.cta}
        </button>
      </section>

      {lastCard}

      <h2 className="h-section">{t.home.menagerieHeading}</h2>
      <Menagerie />
      {switcher}
    </main>
  );
}
