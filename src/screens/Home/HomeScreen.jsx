import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppState } from "../../state/AppState.jsx";
import { refreshStreak } from "../../lib/streak.js";
import { t } from "../../i18n/index.js";
import Button from "../../components/Button.jsx";
import Card from "../../components/Card.jsx";
import Menagerie from "./Menagerie.jsx";
import "./home.css";

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

  return (
    <main className="screen">
      <div className="h-top">
        <div className="h-moon" aria-hidden="true" />
        <p className="h-streak">🔥 {t.home.streak(state.streak || 0)}</p>
      </div>

      <section className="h-hero">
        <p className="h-kicker">{t.home.kicker}</p>
        <h1 className="h-title">
          {t.home.title1}<br />
          <span className="h-title-accent">{t.home.title2}</span>
        </h1>
        <p className="h-lede">{t.home.lede}</p>
      </section>

      <Button onClick={() => navigate("/dream")}>{t.home.cta}</Button>

      {last && (
        <>
          <h2 className="h-section">{t.home.lastHeading}</h2>
          <Card as="button" className="h-last" onClick={() => navigate("/journal")}>
            <span className="h-last-title">{last.title || t.home.untitled}</span>
            <span className="h-last-text">{last.text}</span>
          </Card>
        </>
      )}

      <h2 className="h-section">{t.home.menagerieHeading}</h2>
      <Menagerie />
    </main>
  );
}
