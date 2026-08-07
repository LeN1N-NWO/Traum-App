import { useNavigate } from "react-router-dom";
import { PRICES, IMAGE_COUNTS, priceForImages } from "../lib/pricing.js";
import { useAppState } from "../state/AppState.jsx";
import { genId } from "../lib/storage.js";
import { bumpStreak } from "../lib/streak.js";
import { newCreature } from "../lib/creatures.js";
import { taggedPhotosIn } from "../lib/tags.js";
import { t } from "../i18n/index.js";
import Card from "../components/Card.jsx";
import "./wizard.css";

export default function Step2Output({ w, patch, seedAssignments }) {
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
      title: creature.title,
      mode: "save",
      media: { type: "image", urls: [], source: "none" },
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

  /** Continue to the cast step. Without an analysis, guess locally. */
  function choose(mode) {
    if (!w.analysis) {
      // No paid analysis: derive characters from avatars the text names.
      const found = taggedPhotosIn(state, w.text);
      const people = found.filter((f) => f.category !== "place").map((f) => f.tag);
      const places = found.filter((f) => f.category === "place").map((f) => f.tag);
      const local = { text: w.text, people, places, beats: [w.text], style: "dreamlike", mood: "" };
      patch({ mode, analysis: local, styleId: "dreamlike", step: 3 });
      seedAssignments(local);
      return;
    }
    patch({ mode, styleId: w.analysis.style || "dreamlike", step: 3 });
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
        <span className="wiz-price">{t.wizard.from} {priceForImages(w.imageCount)}</span>
      </Card>

      {/* The count sits under the images card because it only applies there —
          film always renders a single still and animates it. */}
      <div className="wiz-counts" role="group" aria-label={t.wizard.step2.countLabel}>
        {IMAGE_COUNTS.map((n) => (
          <button
            key={n}
            className={"wiz-count" + (w.imageCount === n ? " wiz-count-on" : "")}
            onClick={() => patch({ imageCount: n })}
            aria-pressed={w.imageCount === n}
          >
            <span className="wiz-count-n">{n}</span>
            <span className="wiz-count-label">{t.wizard.step2.countNames[n]}</span>
            <span className="wiz-count-price">{PRICES.images[n]} {t.wizard.credits}</span>
          </button>
        ))}
      </div>

      <Card as="button" className="wiz-choice" onClick={() => choose("film")}>
        <span className="wiz-choice-emoji" aria-hidden="true">🎬</span>
        <span className="wiz-choice-body">
          <span className="wiz-choice-title">{t.wizard.step2.film}</span>
          <span className="wiz-choice-hint">{t.wizard.step2.filmHint}</span>
        </span>
        <span className="wiz-price">{PRICES.film}</span>
      </Card>
    </section>
  );
}
