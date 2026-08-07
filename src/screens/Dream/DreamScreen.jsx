import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppState } from "../../state/AppState.jsx";
import { taggedPhotosIn } from "../../lib/tags.js";
import { genId } from "../../lib/storage.js";
import { generate } from "../../lib/api.js";
import { bumpStreak } from "../../lib/streak.js";
import { neueKreatur } from "../../lib/creatures.js";
import Button from "../../components/Button.jsx";
import ScreenHeader from "../../components/ScreenHeader.jsx";
import "./dream.css";

/* ⚠ Bewusst ein 1:1-Port des alten Formulars, KEIN Wizard.
   Der sechsstufige Ablauf ist Phase 2 und ersetzt genau diese Datei —
   deshalb ist sie absichtlich klein gehalten. */
export default function DreamScreen() {
  const { state, update, toast } = useAppState();
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const [modus, setModus] = useState("sequence");
  const [laeuft, setLaeuft] = useState(false);

  async function absenden() {
    const sauber = text.trim();
    if (sauber.length < 8) return toast("⚠ Schreib etwas mehr auf.");

    setLaeuft(true);
    // Nur Referenzfotos mitschicken, deren Name wirklich vorkommt. Diese
    // Regel löst Phase 2 durch die ausdrückliche Zuordnung im Wizard ab.
    const cast = taggedPhotosIn(state, sauber);

    let urls = [];
    let quelle = "demo";
    try {
      urls = await generate({ dream: sauber, mode: modus, cast });
      quelle = "api";
    } catch (err) {
      console.error("[DreamRushes] Generierung fehlgeschlagen:", err);
      toast(`⚠ ${err.message}`);
    }

    const kreatur = neueKreatur(sauber);
    const eintrag = {
      id: genId("e"),
      createdAt: new Date().toISOString(),
      text: sauber,
      title: kreatur.title,
      mode: modus,
      cons: state.cons,
      media: { type: modus === "film" ? "video" : "image", urls, source: quelle },
      references: cast.map((c) => ({ tag: c.tag, category: c.category })),
      creatureId: kreatur.id,
    };

    // bumpStreak liefert {streak, lastDream} — lastDream ist ein DATUM.
    // Niemals den Traumtext dort hineinschreiben, sonst startet die Serie
    // bei jedem Traum neu.
    update({
      journal: [...(state.journal || []), eintrag],
      creatures: [...(state.creatures || []), kreatur],
      ...bumpStreak(state),
    });

    setLaeuft(false);
    toast(`✦ ${kreatur.name} kam dazu`);
    navigate("/tagebuch");
  }

  return (
    <main className="screen">
      <ScreenHeader
        titel="Traum aufschreiben"
        aktion={<Button variant="geist" onClick={() => navigate(-1)}>Abbrechen</Button>}
      />

      <textarea
        className="d-feld"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Ich flog über ein violettes Meer…"
        rows={9}
        autoFocus
        aria-label="Traumtext"
      />

      <fieldset className="d-modus">
        <legend>Was soll entstehen?</legend>
        <label>
          <input
            type="radio" name="modus" value="sequence"
            checked={modus === "sequence"} onChange={() => setModus("sequence")}
          />
          Bilder
        </label>
        <label>
          <input
            type="radio" name="modus" value="film"
            checked={modus === "film"} onChange={() => setModus("film")}
          />
          Film
        </label>
      </fieldset>

      <p className="d-hinweis">
        Genannte Referenzfotos werden zur Generierung an fal.ai übertragen.
      </p>

      <Button onClick={absenden} disabled={laeuft}>
        {laeuft ? "Wird erzeugt…" : "Traum beschwören"}
      </Button>
    </main>
  );
}
