import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { STYLES } from "../lib/styles.js";
import { beatsForCount, beatCountForSeconds, evenIndices, trimSelection, selectionBeats } from "../lib/beats.js";
import { buildReferences, buildImagePrompt, buildPosterPrompt, buildGridPrompt } from "../lib/promptBuilder.js";
import { generate, renderImages, uploadPanel, mediaUrl, characterSheet } from "../lib/api.js";
import { needsSheet, renderRef, sheetFingerprint, compactDataUrl } from "../lib/sheets.js";
import { splitIntoPanels } from "../lib/splitGrid.js";
import { genId } from "../lib/storage.js";
import { bumpStreak, refreshStreak } from "../lib/streak.js";
import { newCreature } from "../lib/creatures.js";
import { priceForImages, PRICES, IMAGE_COUNTS, PREVIEW_COUNT } from "../lib/pricing.js";
import { VIDEO_MODELS, priceForFilm, clampSeconds, videoModel } from "../lib/video.js";
import { spend, canAfford } from "../lib/credits.js";
import { useAppState } from "../state/AppState.jsx";
import { t } from "../i18n/index.js";
import Button from "../components/Button.jsx";
import Storyboard from "../components/Storyboard.jsx";
import Sheet from "../components/Sheet.jsx";
import "./wizard.css";

export default function Step5Style({ w, patch }) {
  const { state, update, toast, openPaywall } = useAppState();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [modelInfo, setModelInfo] = useState(null);  // Modell-id, deren ⓘ offen ist
  const [styleInfo, setStyleInfo] = useState(null);  // Stil-id, deren ⓘ offen ist
  const [msg, setMsg] = useState(0);
  const [done, setDone] = useState(0);
  const [prep, setPrep] = useState("");  // Figur, deren Bogen gerade entsteht
  // Der letzte Fehler, als sichtbarer Block im Formular statt als Toast:
  // ein Toast ist nach vier Sekunden weg, und wer auf den Spinner gestarrt
  // hat, sieht danach nur ein wortloses Formular (Antons Befund 21.08.).
  const [fail, setFail] = useState(null);
  /* Die Regie-Auswahl im Storyboard (Stufe B, Antons Go 21.08.): Beat-
     Indizes in Tipp-Reihenfolge. null heißt Automatik — dann wählt
     weiterhin evenIndices, und zwar bei jedem Längenwechsel neu; erst
     der erste Tipp friert die Wahl als Antons eigene ein. */
  const [pick, setPick] = useState(null);
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

  /* Der Szenenbogen und was die gewählte Länge davon trägt — für das
     Storyboard UND für den Film-Aufruf, deshalb hier oben statt im JSX.
     `order` ist immer schon auf die Kappung gestutzt: schrumpft die
     Länge, fällt die älteste eigene Wahl raus (trimSelection). */
  const arc = w.analysis?.beats || [];
  const filmSecs = clampSeconds(w.videoModel, w.seconds);
  const sceneCap = Math.max(1, Math.min(beatCountForSeconds(filmSecs), arc.length));
  const order = trimSelection(pick ?? evenIndices(arc.length, sceneCap), sceneCap);

  function toggleScene(i) {
    // Funktional statt über den Render-Abschluss: zwei Tipps im selben
    // Tick würden sonst beide vom selben alten Stand rechnen und der
    // erste ginge still verloren (React batcht setState).
    setPick((prev) => {
      const base = trimSelection(prev ?? evenIndices(arc.length, sceneCap), sceneCap);
      const has = base.includes(i);
      // Die letzte Szene bleibt: ein Film aus null Szenen ist keiner.
      if (has && base.length <= 1) return base;
      return trimSelection(has ? base.filter((x) => x !== i) : [...base, i], sceneCap);
    });
  }

  /* Die von der Analyse empfohlene Filmlänge stellt den Regler vor, solange
     der Mensch ihn nicht selbst bewegt hat (secondsTouched). Deklarativ hier
     statt an den drei Stellen, an denen die Analyse in den Wizard fliesst —
     so gilt dieselbe Regel auch nach einem Modellwechsel: 20 empfohlene
     Sekunden werden bei „Lebendig" zu 15 geklemmt und bei „Kino" wieder 20,
     statt am ersten Klemmwert kleben zu bleiben. */
  const recommended = w.analysis?.filmSeconds || null;
  useEffect(() => {
    if (!isFilm || w.secondsTouched || !recommended) return;
    const want = clampSeconds(w.videoModel, recommended);
    if (want !== w.seconds) patch({ seconds: want });
  }, [isFilm, recommended, w.videoModel, w.secondsTouched, w.seconds, patch]);

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
    setFail(null);

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
    const members = assignments
      .filter((a) => a && a.avatar?.img)
      .map((a) => ({
        avatar: a.avatar,
        member: {
          tag: a.avatar.tag,
          category: a.kind === "pet" ? "pet" : a.kind === "place" ? "place" : "person",
          desc: a.avatar.desc || "",
          img: a.avatar.img,
          sheet: a.avatar.sheet,
          sheetOf: a.avatar.sheetOf,
        },
      }));

    /* Die Bogen-Pflicht (Plan 2026-08-20-charakterbogen-pflicht.md): Fotos
       von Personen und Tieren werden VOR dem Render einmalig zu einem Bogen
       normalisiert — grau, Ganzkörper + Gesicht — und ab da referenziert der
       Bogen, nicht das Foto. Bezahlt bewiesen: das Foto blutet seine
       Umgebung in die Szenen (Lenas Segelboot), der Bogen nicht.

       TRÄGE und GENAU HIER, nie beim Anlegen: so hängen die Kosten immer an
       einem bezahlten Render und 1000 angelegte Figuren kosten $0 (Antons
       Stresstest). GRATIS für den Menschen — finanziert aus der
       Lite-Ersparnis. Und wie der Regisseur Kür, nie Pflicht: schlägt ein
       Bogen fehl, geht das rohe Foto raus, wie all die Monate zuvor. */
    /* Arbeitskopien statt state.cast in jedem Patch: Der zweite Bogen einer
       Runde würde sonst über die VERALTETE Liste mappen und den ersten
       stillschweigend wieder löschen. */
    let workingCast = state.cast || [];
    let workingMe = state.me;
    for (const { avatar, member } of members) {
      if (!needsSheet(member)) continue;
      setPrep(member.tag);
      try {
        const url = await characterSheet({ photo: member.img, desc: member.desc, category: member.category });
        /* Als kompakter data:-URI gespeichert: nur den versteht fal sicher
           (ein /media/-Pfad zeigt auf diesen Rechner), und als JPEG belastet
           er die localStorage-Quota weniger als das Foto selbst. */
        member.sheet = await compactDataUrl(mediaUrl(url));
        member.sheetOf = sheetFingerprint(member);
        // Am richtigen Ort festschreiben: Besetzungs-Einträge haben eine id,
        // das eigene Porträt lebt in state.me.
        if (avatar.id) {
          workingCast = workingCast.map((p) =>
            p.id === avatar.id ? { ...p, sheet: member.sheet, sheetOf: member.sheetOf } : p);
          update({ cast: workingCast });
        } else if (workingMe?.tag === member.tag) {
          workingMe = { ...workingMe, sheet: member.sheet, sheetOf: member.sheetOf };
          update({ me: workingMe });
        }
      } catch (err) {
        console.error("[DreamRushes] character sheet skipped:", err);
      }
    }
    setPrep("");

    const castForApi = members.map(({ member }) => ({
      tag: member.tag,
      category: member.category,
      desc: member.desc,
      img: renderRef(member),
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
          /* Stil und Szenenbogen für den Regisseur. Bis 19.08.2026 fehlten
             beide Zeilen: Die Regieanweisung verlangte ausdrücklich einen
             Stil-Anker, bekam nie einen — der Film wusste vom gewählten Stil
             nichts. Und der Regisseur zerlegte den Traum ein zweites Mal in
             Szenen, obwohl die Analyse das längst getan hatte. Nur die ID,
             nie der Stiltext: der Server schlägt ihn selbst nach. */
          styleId: w.styleId,
          /* Die Regie-Auswahl aus dem Storyboard, chronologisch sortiert —
             ohne Beats der ganze Text wie zuvor. Der Server schneidet mit
             beatsForSeconds nach: für eine Auswahl, die die Kappung schon
             einhält, ist das die Identität (evenIndices(n, n)) — er reicht
             Antons Wahl unverändert an den Regisseur durch. */
          beats: arc.length ? selectionBeats(arc, order) : allBeats,
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
        const gridUrls = await renderImages({
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
        patch({ urls: panelUrls, poster: false, step: 6 });
        running.current = false;
        setBusy(false);
        return;
      }

      /* Aufträge abgeben statt warten (Antons Ansage 21.08.: „Wir sollten
         einfach weiter die App benutzen können"): Jeder Submit dauert
         unter einer Sekunde — gewartet wird nicht hier, sondern im
         Journal. Der Traum steht dort sofort als Kachel „wird gerade
         erstellt", der Abholer in AppState sammelt die Bilder ein, und
         ein Toast meldet sich, wenn alles da ist.

         Scheitert ein Submit MITTENDRIN, werden die schon abgegebenen
         Aufträge trotzdem zum Eintrag — sie rendern ja bereits und sind
         sonst bezahltes Treibgut. Bezahlt wird deshalb NACH der
         Schleife und nur, was wirklich abgegeben wurde (1 Credit = 1
         Bild, pricing.js). */
      const submitted = [];
      const readyUrls = [];   // ältere Serverstände antworten noch direkt mit urls
      let submitError = null;
      for (let i = 0; i < jobs.length; i++) {
        const beat = jobs[i];
        const prompt = beat === "__poster__"
          ? buildPosterPrompt({
              title, tagline: (w.tagline || "").trim(),
              essence: allBeats.join(" "), styleId: w.styleId, format: w.format, clauses,
            })
          : buildImagePrompt({
              beat, styleId: w.styleId, format: w.format,
              clauses, index: withPoster ? i : i + 1, total: beats.length,
            });
        try {
          const res = await generate({ dream: w.text, mode: "image", cast: castForApi, prompt });
          if (res.jobId) submitted.push({ id: res.jobId });
          else if (res.urls) readyUrls.push(...res.urls);
        } catch (err) {
          submitError = err;
          break;
        }
        setDone((n) => n + 1);
      }
      if (submitError && submitted.length === 0 && readyUrls.length === 0) throw submitError;

      const charge = spend(state, submitted.length + readyUrls.length) || {};
      const references = assignments
        .filter((a) => a.avatar?.tag)
        .map((a) => ({ tag: a.avatar.tag, category: a.kind }));
      const pendingMedia = { type: "image", urls: readyUrls, source: "api", poster: withPoster };

      if (w.entryId) {
        // Aus dem Journal fortgesetzt: der Traum existiert schon — er
        // bekommt nur Zuschnitt und offene Aufträge (Regeln wie Step6).
        update({
          ...charge,
          journal: (state.journal || []).map((e) => (e.id === w.entryId ? {
            ...e,
            mode: "images", style: w.styleId, format: w.format, imageCount: w.imageCount,
            media: pendingMedia,
            ...(submitted.length ? { imageJobs: submitted } : {}),
            references,
            analysis: w.analysis || e.analysis || null,
            title: (w.title || "").trim() || e.title,
            tagline: (w.tagline || "").trim() || e.tagline || "",
          } : e)),
        });
      } else {
        // Der Stand VOR dem Hochzählen — wie in Step2/Step6: die Serie,
        // die man sich verdient hat, zählt für diesen Wurf.
        const creature = newCreature(w.text, refreshStreak(state).streak);
        const entry = {
          id: genId("e"),
          createdAt: new Date().toISOString(),
          text: w.text,
          originalText: w.originalText || w.text,
          title: (w.title || "").trim() || creature.title,
          tagline: (w.tagline || "").trim(),
          mode: "images", style: w.styleId, format: w.format, imageCount: w.imageCount,
          media: pendingMedia,
          ...(submitted.length ? { imageJobs: submitted } : {}),
          analysis: w.analysis || null,
          references,
          creatureId: creature.id,
        };
        update({
          ...charge,
          journal: [...(state.journal || []), entry],
          creatures: [...(state.creatures || []), creature],
          ...bumpStreak(state),
        });
      }

      toast(t.wizard.step5.queuedNote);
      navigate("/journal");

      /* Das Erster-Traum-Kaufblatt — die ganze Begründung steht in
         Step6Result. Der Moment wandert mit hierher: der Traum steht
         sichtbar im Journal, die App hat geliefert, bevor sie fragt. */
      const own = (state.journal || []).filter((e) => !String(e.id).startsWith("e_seed"));
      if (!state.paywallSeen && own.length === 0) {
        update({ paywallSeen: true });
        setTimeout(() => openPaywall("first"), 900);
      }
    } catch (err) {
      console.error("[DreamRushes] generation failed:", err);
      setFail(err.message);
    }
    running.current = false;
    setBusy(false);
  }

  if (busy) {
    return (
      <section className="wiz-body wiz-busy" role="status" aria-live="polite">
        <div className="wiz-spinner" aria-hidden="true" />
        <p className="wiz-busy-text">{t.dream.loading[msg % t.dream.loading.length]}</p>
        {/* Der einmalige Bogen-Moment einer neuen Figur erklärt sich selbst,
            statt wie eine hängende Generierung auszusehen. */}
        {prep && <p className="wiz-busy-count">{t.wizard.step5.preparingRef(prep)}</p>}
        {!prep && count > 1 && <p className="wiz-busy-count">{t.wizard.step5.progress(done, count)}</p>}
      </section>
    );
  }

  return (
    <section className="wiz-body">
      <h1 className="wiz-title">{t.wizard.step5.title}</h1>

      {/* Der Fehler des letzten Versuchs, mit dem Weg zurück. Der
          Generieren-Knopf unten IST das „nochmal" — nichts wurde
          abgebucht, das Formular steht noch genauso da. */}
      {fail && (
        <div className="wiz-error" role="alert">
          <p className="wiz-error-title">{t.wizard.step5.failedTitle}</p>
          <p className="wiz-error-msg">{fail}</p>
          <p className="wiz-error-note">{t.wizard.step5.failedNote}</p>
          <button className="wiz-error-home" onClick={() => navigate("/")}>
            {t.wizard.step5.failedHome}
          </button>
        </div>
      )}

      <div className="wiz-styles" role="group" aria-label={t.wizard.step5.styleLabel}>
        {STYLES.map((s) => (
          /* Gleiches Muster wie bei den Filmmodellen: das ⓘ liegt NEBEN
             dem Auswahlknopf in dessen Ecke, nie als Knopf im Knopf.
             Name aus den Sprachdateien, styles.js bleibt der Fallback —
             vorher standen die Stilnamen englisch fest im UI (derselbe
             Fehlertyp wie beim Traumatlas, 21.08.). */
          <div key={s.id} className="wiz-style-wrap">
            <button
              className={"wiz-style" + (w.styleId === s.id ? " wiz-style-on" : "")}
              onClick={() => patch({ styleId: s.id })}
              aria-pressed={w.styleId === s.id}
            >
              <span className="wiz-style-emoji" aria-hidden="true">{s.emoji}</span>
              <span>{t.styles.byId[s.id]?.label || s.label}</span>
            </button>
            <button
              className="wiz-model-info"
              aria-label={`${t.wizard.step5.aboutStyle}: ${t.styles.byId[s.id]?.label || s.label}`}
              onClick={() => setStyleInfo(s.id)}
            >i</button>
          </div>
        ))}
      </div>

      {styleInfo && (
        <Sheet label={t.styles.byId[styleInfo]?.label || styleInfo} onClose={() => setStyleInfo(null)}>
          <p className="sb-sheet-label">{t.wizard.step5.styleLabel}</p>
          <h3 className="wiz-model-title">
            {STYLES.find((s) => s.id === styleInfo)?.emoji}{" "}
            {t.styles.byId[styleInfo]?.label || styleInfo}
          </h3>
          <p className="wiz-model-text">{t.styles.byId[styleInfo]?.info}</p>
        </Sheet>
      )}

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
              /* Das ⓘ liegt NEBEN dem Auswahlknopf, absolut in dessen Ecke —
                 ein Knopf im Knopf wäre derselbe Fehler wie der <div>-
                 Löschknopf der Cast-Kacheln (STAND: Barrierefreiheit). */
              <div key={m.id} className="wiz-model">
                <button
                  className={"wiz-format" + (w.videoModel === m.id ? " wiz-format-on" : "")}
                  onClick={() => patch({ videoModel: m.id, ...(w.secondsTouched ? { seconds: clampSeconds(m.id, w.seconds) } : {}) })}
                  aria-pressed={w.videoModel === m.id}
                >
                  <span>{t.wizard.step5.filmModels[m.id].name}</span>
                  <small>{t.wizard.step5.filmModels[m.id].hint}</small>
                  <small className="wiz-model-name">{t.wizard.step5.filmModels[m.id].model}</small>
                </button>
                <button
                  className="wiz-model-info"
                  aria-label={`${t.wizard.step5.aboutModel}: ${t.wizard.step5.filmModels[m.id].name}`}
                  onClick={() => setModelInfo(m.id)}
                >i</button>
              </div>
            ))}
          </div>

          {modelInfo && (
            <Sheet label={t.wizard.step5.filmModels[modelInfo].name} onClose={() => setModelInfo(null)}>
              <p className="sb-sheet-label">{t.wizard.step5.filmModels[modelInfo].model}</p>
              <h3 className="wiz-model-title">{t.wizard.step5.filmModels[modelInfo].name}</h3>
              <p className="wiz-model-text">{t.wizard.step5.filmModels[modelInfo].info}</p>
            </Sheet>
          )}

          <h2 className="wiz-sub">{t.wizard.step5.lengthLabel}</h2>
          <div className="wiz-seconds">
            <output className="wiz-seconds-value">{w.seconds}s</output>
            <input
              type="range"
              min={videoModel(w.videoModel).min}
              max={videoModel(w.videoModel).max}
              step={videoModel(w.videoModel).step}
              value={w.seconds}
              onChange={(e) => patch({ seconds: clampSeconds(w.videoModel, e.target.value), secondsTouched: true })}
              aria-label={t.wizard.step5.lengthLabel}
            />
            {recommended && (() => {
              const m = videoModel(w.videoModel);
              const at = clampSeconds(w.videoModel, recommended);
              const pct = ((at - m.min) / (m.max - m.min)) * 100;
              return (
                <div className="wiz-seconds-ideal" aria-hidden="true">
                  <span className="wiz-seconds-ideal-pin" style={{ insetInlineStart: `${pct}%` }}>
                    <span className="wiz-seconds-ideal-dot" />
                    <span className="wiz-seconds-ideal-label">{t.wizard.step5.ideal}</span>
                  </span>
                </div>
              );
            })()}
            <div className="wiz-seconds-scale" aria-hidden="true">
              <span>{videoModel(w.videoModel).min}s</span>
              <span>{videoModel(w.videoModel).max}s</span>
            </div>
          </div>

          {/* Das Storyboard zeigt, was die Länge trägt — und seit Stufe B
              (21.08.) entscheidet der Mensch selbst, WELCHE Szenen das
              sind: Antippen schaltet eine Szene an oder aus, die Auswahl
              ersetzt den Automatik-Schnitt und geht so an den Regisseur.
              Solange niemand tippt, wählt weiter evenIndices — dieselbe
              Rechnung wie auf dem Server, nur sichtbar gemacht. */}
          {arc.length > 0 && (() => {
            const entry = w.entryId ? state.journal.find((e) => e.id === w.entryId) : null;
            return (
              <>
                <h2 className="wiz-sub">{t.storyboard.label}</h2>
                <Storyboard beats={arc} entry={entry} active={new Set(order)} onToggle={toggleScene} />
                <p className="wiz-hint">{t.storyboard.pickNote(order.length, sceneCap)}</p>
              </>
            );
          })()}
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
