import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppState } from "../state/AppState.jsx";
import { jobStatus } from "../lib/api.js";
import { genId } from "../lib/storage.js";
import { bumpStreak } from "../lib/streak.js";
import { newCreature } from "../lib/creatures.js";
import { t } from "../i18n/index.js";
import Button from "../components/Button.jsx";
import MediaCarousel from "../components/MediaCarousel.jsx";
import "./wizard.css";

export default function Step6Result({ w, patch }) {
  const { state, update, toast , openPaywall } = useAppState();
  const navigate = useNavigate();
  const isFilm = w.mode === "film";
  const urls = w.urls || [];

  /* A film is still rendering when this screen opens — the server queued it
   * and we come back for it. Polling every 6 seconds rather than streaming:
   * a 15-second render measured 280 seconds, so this asks about 45 times at
   * most, and it survives the page being reloaded because the id is in the
   * wizard state. Saving the entry before it arrives is allowed on purpose;
   * the journal keeps the job id and can collect it later. */
  const [failed, setFailed] = useState(false);
  const waiting = isFilm && !!w.jobId && urls.length === 0 && !failed;

  useEffect(() => {
    if (!waiting) return;
    let alive = true;
    const tick = async () => {
      try {
        const r = await jobStatus(w.jobId);
        if (!alive) return;
        if (r.status === "done") patch({ urls: r.urls || [] });
        else if (r.status === "failed" || r.status === "unknown") setFailed(true);
      } catch { /* a hiccup is not a failure — the next tick tries again */ }
    };
    tick();
    const id = setInterval(tick, 6000);
    return () => { alive = false; clearInterval(id); };
  }, [waiting, w.jobId, patch]);

  function save() {
    const references = Object.values(w.assignments)
      .filter((a) => a.avatar?.tag)
      .map((a) => ({ tag: a.avatar.tag, category: a.kind }));
    /* A film and a picture sequence are two different things a dream can
     * own, not two states of one field. Writing the film into `media` used
     * to overwrite the images it was made FROM — three pictures gone the
     * moment you animated one of them. They live side by side now; see
     * lib/entryMedia.js for the readers that hide the old shape. */
    const madeNow = isFilm
      ? { film: { urls, source: "api" } }
      : { media: { type: "image", urls, source: "api" } };

    /* Resumed from the journal: this dream already exists. It has its date,
     * its creature and its place in the streak — only the pictures are new,
     * so the entry is updated rather than written a second time. */
    if (w.entryId) {
      update({
        journal: (state.journal || []).map((e) => (e.id === w.entryId ? {
          ...e,
          mode: w.mode,
          style: w.styleId,
          format: w.format,
          imageCount: isFilm ? e.imageCount : w.imageCount,
          ...madeNow,
          references,
          analysis: w.analysis || e.analysis || null,
          // The title was only ever a placeholder while the dream had no
          // picture; a real one from the analysis may now replace it.
          title: (w.title || "").trim() || e.title,
          tagline: (w.tagline || "").trim() || e.tagline || "",
          ...(waiting ? { jobId: w.jobId } : {}),
        } : e)),
      });
      toast(t.wizard.step6.added);
      return navigate("/journal");
    }

    const creature = newCreature(w.text);
    const entry = {
      id: genId("e"),
      createdAt: new Date().toISOString(),
      text: w.text,
      originalText: w.originalText || w.text,
      // The analysis names the dream like a film; the creature name stays the
      // fallback for the (rare) path where no title came back.
      title: (w.title || "").trim() || creature.title,
      tagline: (w.tagline || "").trim(),
      mode: w.mode,
      style: w.styleId,
      format: w.format,
      imageCount: isFilm ? 0 : w.imageCount,
      // A film-first dream has no picture sequence yet; the empty media keeps
      // the shape uniform so "make the images" is offered for it later.
      media: { type: "image", urls: [], source: "none" },
      ...madeNow,
      // See Step2Output: kept so a later round of pictures starts for free.
      analysis: w.analysis || null,
      // Kept when the film is still rendering, so the entry can collect it
      // afterwards instead of the render being lost with the wizard state.
      ...(waiting ? { jobId: w.jobId } : {}),
      references,
      creatureId: creature.id,
    };

    update({
      journal: [...(state.journal || []), entry],
      creatures: [...(state.creatures || []), creature],
      ...bumpStreak(state),
    });
    toast(t.dream.caught(creature.name));
    navigate("/journal");

    /* Der eine Moment, an dem das Kaufblatt von selbst kommt — und zwar
     * NICHT am Ende des Onboardings, wo es hingehoert haette, wenn man nur
     * auf die Konversionszahlen schaut.
     *
     * Der Grund: Das Onboarding verspricht woertlich „Dein erster Traum geht
     * auf uns". Direkt danach nach Geld zu fragen, waere genau die Sorte
     * Widerspruch, die man einer App nicht verzeiht. Hier dagegen ist der
     * erste Traum fertig, sichtbar, im Tagebuch — die App hat geliefert,
     * bevor sie fragt. Das ist derselbe Aha-Moment, nur an der ehrlichen
     * Stelle.
     *
     * Genau EINMAL: `paywallSeen` verhindert, dass daraus eine Gewohnheit
     * wird. Verzoegert, damit erst das Journal steht und das Blatt darueber
     * aufgeht statt in den Wechsel hinein. */
    /* Gezaehlt werden nur SELBST gemachte Traeume. Ein frischer Install
     * bekommt zwei Seed-Traeume (seedJournal.js) — ohne diesen Filter waere
     * das Tagebuch nie leer und dieser Moment nie eingetreten. Beim Loeschen
     * des Seed-Journals kann der Filter mit verschwinden. */
    const own = (state.journal || []).filter((e) => !String(e.id).startsWith("e_seed"));
    if (!state.paywallSeen && own.length === 0) {
      update({ paywallSeen: true });
      setTimeout(() => openPaywall("first"), 900);
    }
  }

  return (
    <section className="wiz-body">
      <h1 className="wiz-title">{t.wizard.step6.title}</h1>

      {waiting ? (
        <div className="wiz-rendering" role="status" aria-live="polite">
          <div className="wiz-spinner" aria-hidden="true" />
          <p className="wiz-busy-text">{t.wizard.step6.rendering}</p>
          <p className="wiz-hint">{t.wizard.step6.renderingHint}</p>
        </div>
      ) : failed ? (
        <p className="wiz-empty">{t.wizard.step6.renderFailed}</p>
      ) : urls.length === 0 ? (
        <p className="wiz-empty">{t.wizard.step6.nothing}</p>
      ) : (
        <MediaCarousel urls={urls} type={isFilm ? "video" : "image"} />
      )}

      {/* Saving while it renders is deliberate: the entry keeps the job id
          and picks the film up later. Nobody has to sit and watch. */}
      <Button onClick={save}>
        {waiting ? t.wizard.step6.saveWhileRendering : t.wizard.step6.save}
      </Button>
    </section>
  );
}
