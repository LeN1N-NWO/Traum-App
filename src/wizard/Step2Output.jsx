import { useNavigate } from "react-router-dom";
import { PRICES } from "../lib/pricing.js";
import { priceForFilm } from "../lib/video.js";
import { useAppState } from "../state/AppState.jsx";
import { genId } from "../lib/storage.js";
import { bumpStreak } from "../lib/streak.js";
import { newCreature } from "../lib/creatures.js";
import { t } from "../i18n/index.js";
import Card from "../components/Card.jsx";
import "./wizard.css";

export default function Step2Output({ w, patch }) {
  const { state, update, toast } = useAppState();
  const navigate = useNavigate();

  /** Save only: no generation, no cost, straight into the journal. */
  function saveOnly() {
    const creature = newCreature(w.text);
    const entry = {
      id: genId("e"),
      createdAt: new Date().toISOString(),
      text: w.text,
      originalText: w.originalText || w.text,
      title: (w.title || "").trim() || creature.title,
      tagline: (w.tagline || "").trim(),
      mode: "save",
      media: { type: "image", urls: [], source: "none" },
      // Kept so that turning this dream into pictures later costs nothing to
      // prepare: the characters and places have already been worked out once.
      analysis: w.analysis || null,
      references: [],
      creatureId: creature.id,
    };
    update({
      journal: [...(state.journal || []), entry],
      creatures: [...(state.creatures || []), creature],
      ...bumpStreak(state),
    });
    toast(t.wizard.step2.saved);
    navigate("/journal");
  }

  /** Continue to the cast step. An analysis always exists — step 1 cannot be
   *  skipped, because everything from here on is built on its output. */
  function choose(mode) {
    patch({ mode, styleId: w.analysis?.style || "dreamlike", step: 3 });
  }

  return (
    <section className="wiz-body">
      <h1 className="wiz-title">{t.wizard.step2.title}</h1>

      <Card as="button" className="wiz-choice" onClick={saveOnly}>
        <span className="wiz-choice-emoji" aria-hidden="true">💾</span>
        <span className="wiz-choice-body">
          <span className="wiz-choice-title">{t.wizard.step2.saveOnly}</span>
          <span className="wiz-choice-hint">{t.wizard.step2.saveOnlyHint}</span>
        </span>
        <span className="wiz-price wiz-price-free">{t.wizard.free}</span>
      </Card>

      <Card as="button" className="wiz-choice" onClick={() => choose("images")}>
        <span className="wiz-choice-emoji" aria-hidden="true">📸</span>
        <span className="wiz-choice-body">
          <span className="wiz-choice-title">{t.wizard.step2.images}</span>
          <span className="wiz-choice-hint">{t.wizard.step2.imagesHint}</span>
        </span>
        {/* The count (3/5/10) is chosen in step 5, after the characters are
            settled — deciding it here would front-load a detail the person
            cannot judge yet. Show the entry price only. */}
        <span className="wiz-price">{t.wizard.from} {PRICES.images[3]}</span>
      </Card>

      <Card as="button" className="wiz-choice" onClick={() => choose("film")}>
        <span className="wiz-choice-emoji" aria-hidden="true">🎬</span>
        <span className="wiz-choice-body">
          <span className="wiz-choice-title">{t.wizard.step2.film}</span>
          <span className="wiz-choice-hint">{t.wizard.step2.filmHint}</span>
        </span>
        {/* Same reasoning as above: renderer and length are chosen in step 5,
            so only the cheapest possible film is quoted here. */}
        <span className="wiz-price">{t.wizard.from} {priceForFilm("standard", 4)}</span>
      </Card>
    </section>
  );
}
