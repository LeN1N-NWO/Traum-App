import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppState } from "../../state/AppState.jsx";
import { refreshStreak } from "../../lib/streak.js";
import Button from "../../components/Button.jsx";
import Card from "../../components/Card.jsx";
import Menagerie from "./Menagerie.jsx";
import "./home.css";

function begruessung() {
  const h = new Date().getHours();
  if (h < 5) return "Gute Nacht";
  if (h < 11) return "Guten Morgen";
  if (h < 18) return "Hallo";
  return "Guten Abend";
}

export default function HomeScreen() {
  const { state, update } = useAppState();
  const navigate = useNavigate();

  // Eine abgerissene Serie fällt beim Ansehen auf 0 — sonst zeigt die App
  // nach zwei Wochen Pause weiter "9 Tage".
  useEffect(() => {
    const frisch = refreshStreak(state);
    if (frisch.streak !== state.streak) update(frisch);
    // Absichtlich nur beim Betreten: bei jeder Zustandsänderung zu prüfen
    // würde eine Schleife über update() auslösen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const letzter = [...(state.journal || [])]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];

  return (
    <main className="screen">
      <div className="h-kopf">
        <div className="h-mond" aria-hidden="true" />
        <p className="h-streak">🔥 {state.streak || 0} Tage</p>
      </div>

      <h1 className="h-gruss">{begruessung()}</h1>
      <p className="h-lede">Woran erinnerst du dich?</p>

      <Button onClick={() => navigate("/traum")}>Traum aufschreiben</Button>

      {letzter && (
        <>
          <h2 className="h-abschnitt">Zuletzt</h2>
          <Card as="button" className="h-letzter" onClick={() => navigate("/tagebuch")}>
            <span className="h-letzter-titel">{letzter.title || "Ohne Titel"}</span>
            <span className="h-letzter-text">{letzter.text}</span>
          </Card>
        </>
      )}

      <h2 className="h-abschnitt">Deine Wesen</h2>
      <Menagerie />
    </main>
  );
}
