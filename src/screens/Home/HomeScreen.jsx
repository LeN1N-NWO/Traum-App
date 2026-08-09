import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppState } from "../../state/AppState.jsx";
import { refreshStreak } from "../../lib/streak.js";
import { mediaUrl } from "../../lib/api.js";
import { imagesOf } from "../../lib/entryMedia.js";
import { t } from "../../i18n/index.js";
import Menagerie from "./Menagerie.jsx";
import "./home.css";

/** Which greeting fits the hour — the app is used late at night and early
 *  in the morning, and "Good evening" at 6am reads as a machine talking. */
function greetingKey(hour) {
  if (hour < 5) return "night";
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}

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

  // The last dream becomes the sky of the home screen — blurred and dimmed
  // far past recognition, so it reads as weather rather than as a thumbnail.
  // Without one, the gradient in .h-sky stands on its own.
  // A still only — this is a background element, and an <img> is all .h-sky
  // can blur. A film-only dream simply leaves the gradient standing.
  const backdrop = mediaUrl(imagesOf(last)[0]) || null;
  const greeting = t.home.greeting[greetingKey(new Date().getHours())];
  const streak = state.streak || 0;

  return (
    <main className="screen h-screen">
      <div className="h-sky" aria-hidden="true">
        {backdrop && <img className="h-sky-img" src={backdrop} alt="" />}
        <span className="h-sky-veil" />
        <span className="h-moon" />
      </div>

      <div className="h-top">
        <p className="h-greeting">{greeting}</p>
        {streak > 0 && (
          <p className="h-streak">
            <span aria-hidden="true">✦</span> {t.home.streak(streak)}
          </p>
        )}
      </div>

      <section className="h-hero">
        <h1 className="h-title">{t.home.title}</h1>
        <p className="h-lede">{t.home.lede}</p>
        <button className="h-cta" onClick={() => navigate("/dream")}>
          {t.home.cta}
        </button>
      </section>

      {last && (
        <button className="h-last" onClick={() => navigate("/journal")}>
          {backdrop && <img className="h-last-thumb" src={backdrop} alt="" loading="lazy" />}
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
