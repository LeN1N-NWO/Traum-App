import { useState, useEffect } from "react";
import { STYLES } from "../lib/styles.js";
import { beatsForCount } from "../lib/beats.js";
import { buildReferences, buildImagePrompt } from "../lib/promptBuilder.js";
import { generate } from "../lib/api.js";
import { mapWithLimit } from "../lib/parallel.js";
import { priceForImages, PRICES } from "../lib/pricing.js";
import { useAppState } from "../state/AppState.jsx";
import { t } from "../i18n/index.js";
import Button from "../components/Button.jsx";
import "./wizard.css";

// How many renders may be in flight at once. Three keeps a ten-image dream
// under a minute without firing ten paid calls simultaneously.
const GENERATION_WINDOW = 3;

export default function Step5Style({ w, patch }) {
  const { toast } = useAppState();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(0);
  const [done, setDone] = useState(0);

  const isFilm = w.mode === "film";
  const count = isFilm ? 1 : w.imageCount;
  const price = isFilm ? PRICES.film : priceForImages(w.imageCount);
  const assignments = Object.values(w.assignments);
  const named = assignments.filter((a) => a.avatar?.img).length;

  useEffect(() => {
    if (!busy) return;
    const id = setInterval(() => setMsg((i) => i + 1), 1400);
    return () => clearInterval(id);
  }, [busy]);

  async function run() {
    setBusy(true);
    setDone(0);
    setMsg(0);

    // Everything below is local: no LLM call. The beats came from the single
    // analysis, the style is a constant, the reference clauses are built from
    // what the person assigned.
    const beats = beatsForCount(w.analysis?.beats || [w.text], count);
    const { references, clauses } = buildReferences(assignments);

    try {
      // Rendering runs a few at a time, not one after another: sequentially,
      // ten images meant minutes of staring at a spinner. The cap keeps us
      // from firing ten simultaneous paid calls at the provider.
      const perImage = await mapWithLimit(beats, GENERATION_WINDOW, async (beat, i) => {
        const prompt = buildImagePrompt({
          beat, styleId: w.styleId, format: w.format,
          clauses, index: i + 1, total: beats.length,
        });
        const got = await generate({
          dream: w.text,
          mode: isFilm ? "film" : "image",
          cast: references.map((r) => ({ tag: r.tag, category: "person", desc: "", img: r.img })),
          prompt,
        });
        setDone((n) => n + 1);
        return got;
      });
      patch({ urls: perImage.flat(), step: 6 });
    } catch (err) {
      console.error("[DreamRushes] generation failed:", err);
      toast(`⚠ ${err.message}`);
    }
    setBusy(false);
  }

  if (busy) {
    return (
      <section className="wiz-body wiz-busy" role="status" aria-live="polite">
        <div className="wiz-spinner" aria-hidden="true" />
        <p className="wiz-busy-text">{t.dream.loading[msg % t.dream.loading.length]}</p>
        {count > 1 && <p className="wiz-busy-count">{t.wizard.step5.progress(done, count)}</p>}
      </section>
    );
  }

  return (
    <section className="wiz-body">
      <h1 className="wiz-title">{t.wizard.step5.title}</h1>

      <div className="wiz-styles" role="group" aria-label={t.wizard.step5.styleLabel}>
        {STYLES.map((s) => (
          <button
            key={s.id}
            className={"wiz-style" + (w.styleId === s.id ? " wiz-style-on" : "")}
            onClick={() => patch({ styleId: s.id })}
            aria-pressed={w.styleId === s.id}
          >
            <span className="wiz-style-emoji" aria-hidden="true">{s.emoji}</span>
            <span>{s.label}</span>
          </button>
        ))}
      </div>

      <h2 className="wiz-sub">{t.wizard.step5.formatLabel}</h2>
      <div className="wiz-formats" role="group" aria-label={t.wizard.step5.formatLabel}>
        {["9:16", "16:9"].map((f) => (
          <button
            key={f}
            className={"wiz-format" + (w.format === f ? " wiz-format-on" : "")}
            onClick={() => patch({ format: f })}
            aria-pressed={w.format === f}
          >
            <span className={f === "9:16" ? "wiz-format-tall" : "wiz-format-wide"} aria-hidden="true" />
            <span>{f}</span>
            <small>{f === "9:16" ? t.wizard.step5.portrait : t.wizard.step5.landscape}</small>
          </button>
        ))}
      </div>

      <div className="wiz-summary">
        <p>{isFilm ? t.wizard.step5.summaryFilm : t.wizard.step5.summaryImages(count)}</p>
        <p>{t.wizard.step5.summaryRefs(named)}</p>
      </div>

      <Button onClick={run}>{t.wizard.step5.generate} · {price} {t.wizard.credits}</Button>
    </section>
  );
}
