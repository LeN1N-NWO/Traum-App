import { useState, useEffect, useRef } from "react";
import { STYLES } from "../lib/styles.js";
import { beatsForCount } from "../lib/beats.js";
import { buildReferences, buildImagePrompt, buildPosterPrompt, buildGridPrompt } from "../lib/promptBuilder.js";
import { generate, uploadPanel, mediaUrl } from "../lib/api.js";
import { splitIntoPanels } from "../lib/splitGrid.js";
import { mapWithLimit } from "../lib/parallel.js";
import { priceForImages, PRICES, IMAGE_COUNTS, PREVIEW_COUNT } from "../lib/pricing.js";
import { VIDEO_MODELS, priceForFilm, clampSeconds, videoModel } from "../lib/video.js";
import { spend, canAfford } from "../lib/credits.js";
import { useAppState } from "../state/AppState.jsx";
import { t } from "../i18n/index.js";
import Button from "../components/Button.jsx";
import "./wizard.css";

// How many renders may be in flight at once. Three keeps a ten-image dream
// under a minute without firing ten paid calls simultaneously.
const GENERATION_WINDOW = 3;

export default function Step5Style({ w, patch }) {
  const { state, update, toast, openPaywall } = useAppState();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(0);
  const [done, setDone] = useState(0);
  // Re-entry guard. `busy` cannot do this job: it is state, so it is still
  // false for a second call that arrives in the same tick — and two runs mean
  // the credits are spent twice and every image is rendered twice. Seen for
  // real on 08.08.: one press produced six /api/generate calls.
  const running = useRef(false);

  const isFilm = w.mode === "film";
  /* The quick look is a mode, not a count: it always renders ONE image and
     cuts it into PREVIEW_COUNT panels, so it never has a poster and never
     honours the format choice (the grid is 16:9 by construction). Both
     controls are hidden while it is on rather than left there doing
     nothing. */
  const isPreview = !isFilm && w.preview;
  const count = isFilm ? 1 : isPreview ? PREVIEW_COUNT : w.imageCount;
  // A film resumed from a dream with images animates one of THEM — no new
  // keyframe is rendered, so that credit disappears from the price.
  const ownKeyframe = isFilm && !!w.keyframe;
  const price = isFilm
    ? priceForFilm(w.videoModel, w.seconds, { ownKeyframe })
    : isPreview ? PRICES.preview
    : priceForImages(w.imageCount);
  const assignments = Object.values(w.assignments);
  const named = assignments.filter((a) => a.avatar?.img).length;

  useEffect(() => {
    if (!busy) return;
    const id = setInterval(() => setMsg((i) => i + 1), 1400);
    return () => clearInterval(id);
  }, [busy]);

  async function run() {
    if (running.current) return;
    const paid = spend(state, price);
    if (!paid) return openPaywall("spent");
    running.current = true;
    setBusy(true);
    setDone(0);
    setMsg(0);

    // Everything below is local: no LLM call. The beats came from the single
    // analysis, the style is a constant, the reference clauses are built from
    // what the person assigned.
    const { references, clauses } = buildReferences(assignments);

    // The poster replaces the first image (same count, same price) — for
    // IMAGES only. A film no longer opens on it: large poster typography,
    // run through image-to-video, animates as a warping mess rather than a
    // title sequence — decided 09.08.2026 after the first version tried the
    // opposite. No title (analysis empty, field cleared) means no poster
    // either way.
    const title = (w.title || "").trim();
    // A preview has no poster — its three panels come out of one image, and
    // spending one of them on a title card would leave two scenes.
    const withPoster = !isFilm && !isPreview && title.length > 0;
    const sceneCount = withPoster ? count - 1 : count;
    const beats = sceneCount > 0 ? beatsForCount(w.analysis?.beats || [w.text], sceneCount) : [];
    const allBeats = w.analysis?.beats || [w.text];
    const jobs = withPoster ? ["__poster__", ...beats] : beats;
    /* Gattung und Beschreibung ECHT mitgeben, nicht plätten: Der Server
       sortiert Referenz-Filme nach Gattung (Personen vor Tieren vor Orten,
       filmReferences) und reicht die Beschreibung an den Regisseur weiter.
       Bis 18.08. stand hier category: "person", desc: "" für alle — für
       Bilder folgenlos, für Regie-Filme hätte es die Priorität zerstört.
       Gleicher Filter wie buildReferences (nur mit Bild), damit die
       Reihenfolge deckungsgleich bleibt. */
    const castForApi = assignments
      .filter((a) => a && a.avatar?.img)
      .map((a) => ({
        tag: a.avatar.tag,
        category: a.kind === "pet" ? "pet" : a.kind === "place" ? "place" : "person",
        desc: a.avatar.desc || "",
        img: a.avatar.img,
      }));

    /* The grid — one generation cut into several panels client-side — is now
     * exactly what "preview" MEANS, not something inferred from the shape of
     * the request. Until 10.08.2026 this line read `sceneCount === 3 &&
     * !withPoster`, which sounds equivalent and was not: the analysis fills
     * the title field automatically, so the poster was almost always on and
     * the grid almost never ran. The saving existed only for someone who
     * happened to clear a text field, and they were charged full price for
     * it anyway. A cheaper render has to be a button, not a side effect. */
    const useGrid = isPreview;

    try {
      // A film is one call and comes back as a job id, not as pictures: the
      // render takes minutes, so the server queues it and step 6 collects it.
      if (isFilm) {
        const { jobId } = await generate({
          dream: w.text, mode: "film", seconds: w.seconds,
          /* Bis 18.08.2026 fehlte diese Zeile: Der Preis richtete sich nach
             der Modellwahl, der Server renderte aber immer minimax — Premium
             wurde bezahlt und nie geliefert (Befund 2 im Film-Regie-Plan). */
          model: w.videoModel,
          cast: castForApi,
          // The chosen image, if any — the server then animates it directly
          // instead of rendering a fresh keyframe first.
          keyframe: w.keyframe || undefined,
          prompt: buildImagePrompt({
            beat: beats[0] || w.text, styleId: w.styleId, format: w.format, clauses, index: 1, total: 1,
          }),
        });
        update(paid);
        patch({ jobId, urls: [], step: 6 });
        running.current = false;
        setBusy(false);
        return;
      }

      // One request, one $0.08 generation, cut into three afterwards instead
      // of three separate $0.08 requests for the same three pictures.
      if (useGrid) {
        const { urls: gridUrls } = await generate({
          dream: w.text,
          mode: "image",
          cast: castForApi,
          prompt: buildGridPrompt({ beats, styleId: w.styleId, clauses }),
          aspectRatio: "16:9",
        });
        const gridUrl = mediaUrl(gridUrls[0]);
        if (!gridUrl) throw new Error(t.errors.unexpected);
        const blobs = await splitIntoPanels(gridUrl, beats.length);
        const panelUrls = [];
        for (const blob of blobs) {
          panelUrls.push(await uploadPanel(blob));
          setDone((n) => n + 1);
        }
        update(paid);
        patch({ urls: panelUrls, step: 6 });
        running.current = false;
        setBusy(false);
        return;
      }

      // Rendering runs a few at a time, not one after another: sequentially,
      // ten images meant minutes of staring at a spinner. The cap keeps us
      // from firing ten simultaneous paid calls at the provider.
      const perImage = await mapWithLimit(jobs, GENERATION_WINDOW, async (beat, i) => {
        const prompt = beat === "__poster__"
          ? buildPosterPrompt({
              title, tagline: (w.tagline || "").trim(),
              essence: allBeats.join(" "), styleId: w.styleId, format: w.format, clauses,
            })
          : buildImagePrompt({
              beat, styleId: w.styleId, format: w.format,
              clauses, index: withPoster ? i : i + 1, total: beats.length,
            });
        const { urls } = await generate({ dream: w.text, mode: "image", cast: castForApi, prompt });
        setDone((n) => n + 1);
        return urls;
      });
      update(paid);          // only charge once the images actually arrived
      patch({ urls: perImage.flat(), step: 6 });
    } catch (err) {
      console.error("[DreamRushes] generation failed:", err);
      toast(`⚠ ${err.message}`);
    }
    running.current = false;
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

      {/* The poster opens an image sequence (it replaces the first image, so
          the count and price stay untouched). Clearing the title is the
          opt-out: no title, no poster. Video-only, w.title/w.tagline still
          hold whatever "Improve with AI" found — that is also the journal
          card's title, so it is kept either way, just not offered for
          editing here when there is no poster left for it to describe. */}
      {!isFilm && !isPreview && (
        <>
          <h2 className="wiz-sub">{t.wizard.step5.posterLabel}</h2>
          <div className="wiz-poster-fields">
            <input
              className="wiz-input"
              value={w.title}
              onChange={(e) => patch({ title: e.target.value })}
              placeholder={t.wizard.step5.posterTitlePlaceholder}
              maxLength={60}
              aria-label={t.wizard.step5.posterTitleLabel}
            />
            <input
              className="wiz-input"
              value={w.tagline}
              onChange={(e) => patch({ tagline: e.target.value })}
              placeholder={t.wizard.step5.posterTaglinePlaceholder}
              maxLength={120}
              aria-label={t.wizard.step5.posterTaglineLabel}
            />
            <p className="wiz-hint">{t.wizard.step5.posterHint}</p>
          </div>
        </>
      )}

      {/* Hidden during a preview: the grid is 16:9 by construction and its
          panels come out near-portrait whatever is chosen here, so leaving
          the control visible would be a switch that changes nothing. */}
      {!isPreview && (
        <>
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
        </>
      )}

      {/* Film: the renderer and the length are the person's call, and both
          move the price. The premium model costs six times as much per
          second, so it is never a default — but for someone who wants a
          half-minute film in one unbroken take, it is the only way. */}
      {isFilm && (
        <>
          {/* The dream's own images, when it has some: the film animates one
              of them, and this row decides which. Same poster tiles as the
              journal, just small — recognition over novelty. */}
          {w.sourceUrls?.length > 0 && (
            <>
              <h2 className="wiz-sub">{t.wizard.step5.keyframeLabel}</h2>
              <div className="wiz-frames" role="group" aria-label={t.wizard.step5.keyframeLabel}>
                {w.sourceUrls.map((u) => (
                  <button
                    key={u}
                    className={"wiz-frame" + (w.keyframe === u ? " wiz-frame-on" : "")}
                    onClick={() => patch({ keyframe: u })}
                    aria-pressed={w.keyframe === u}
                  >
                    <img src={mediaUrl(u)} alt="" loading="lazy" />
                  </button>
                ))}
              </div>
              <p className="wiz-hint">{t.wizard.step5.keyframeHint}</p>
            </>
          )}

          <h2 className="wiz-sub">{t.wizard.step5.filmModelLabel}</h2>
          <div className="wiz-formats" role="group" aria-label={t.wizard.step5.filmModelLabel}>
            {VIDEO_MODELS.map((m) => (
              <button
                key={m.id}
                className={"wiz-format" + (w.videoModel === m.id ? " wiz-format-on" : "")}
                onClick={() => patch({ videoModel: m.id, seconds: clampSeconds(m.id, w.seconds) })}
                aria-pressed={w.videoModel === m.id}
              >
                <span>{t.wizard.step5.filmModels[m.id].name}</span>
                <small>{t.wizard.step5.filmModels[m.id].hint}</small>
              </button>
            ))}
          </div>

          <h2 className="wiz-sub">{t.wizard.step5.lengthLabel}</h2>
          <div className="wiz-seconds">
            <output className="wiz-seconds-value">{w.seconds}s</output>
            <input
              type="range"
              min={videoModel(w.videoModel).min}
              max={videoModel(w.videoModel).max}
              step={videoModel(w.videoModel).step}
              value={w.seconds}
              onChange={(e) => patch({ seconds: clampSeconds(w.videoModel, e.target.value) })}
              aria-label={t.wizard.step5.lengthLabel}
            />
            <div className="wiz-seconds-scale" aria-hidden="true">
              <span>{videoModel(w.videoModel).min}s</span>
              <span>{videoModel(w.videoModel).max}s</span>
            </div>
          </div>
        </>
      )}

      {!isFilm && (
        <>
          <h2 className="wiz-sub">{t.wizard.step5.countLabel}</h2>

          {/* The cheap look, full width above the three real counts — it is a
              different KIND of thing, not a fourth size, and putting it in
              the same row would read as "3 images but cheaper" rather than
              "smaller images". The hint says what you give up; nobody can
              guess "a third of the resolution" from a price. */}
          <button
            className={"wiz-preview" + (isPreview ? " wiz-preview-on" : "")}
            onClick={() => patch({ preview: !w.preview })}
            aria-pressed={isPreview}
          >
            <span className="wiz-preview-head">
              <span className="wiz-preview-name">{t.wizard.step5.previewName}</span>
              <span className="wiz-count-price">{PRICES.preview} {t.wizard.creditsN(PRICES.preview)}</span>
            </span>
            <span className="wiz-preview-hint">{t.wizard.step5.previewHint}</span>
          </button>

          <div className="wiz-counts" role="group" aria-label={t.wizard.step5.countLabel}>
            {IMAGE_COUNTS.map((n) => (
              <button
                key={n}
                className={"wiz-count" + (!isPreview && w.imageCount === n ? " wiz-count-on" : "")}
                onClick={() => patch({ imageCount: n, preview: false })}
                aria-pressed={!isPreview && w.imageCount === n}
              >
                <span className="wiz-count-n">{n}</span>
                <span className="wiz-count-label">{t.wizard.step5.countNames[n]}</span>
                <span className="wiz-count-price">{PRICES.images[n]} {t.wizard.creditsN(PRICES.images[n])}</span>
              </button>
            ))}
          </div>
        </>
      )}

      <div className="wiz-summary">
        <p>{isFilm ? t.wizard.step5.summaryFilmLength(w.seconds)
                   : isPreview ? t.wizard.step5.summaryPreview(count)
                   : t.wizard.step5.summaryImages(count)}</p>
        <p>{t.wizard.step5.summaryRefs(named)}</p>
      </div>

      <Button onClick={run} disabled={!canAfford(state, price)}>
        {t.wizard.step5.generate} · {price} {t.wizard.creditsN(price)}
      </Button>
      {/* Kein Satz, der nur feststellt — ein Weg. Wer die Preise sehen
          will, bevor er auf einen gesperrten Knopf drueckt, kommt hier hin. */}
      {!canAfford(state, price) && (
        <button className="wiz-topup" onClick={() => openPaywall("spent")}>
          {t.wizard.noCreditsCta}
        </button>
      )}
    </section>
  );
}
