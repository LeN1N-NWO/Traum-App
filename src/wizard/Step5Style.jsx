import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { STYLES } from "../lib/styles.js";
import { beatsForCount, trimSelection, selectionBeats } from "../lib/beats.js";
import { selectBeats, shotPlan, recommendation } from "../lib/cut.js";
import { buildReferences, buildImagePrompt, buildGridPrompt } from "../lib/promptBuilder.js";
import { generate, renderImages, uploadPanel, mediaUrl, characterSheet } from "../lib/api.js";
import { needsSheet, renderRef, sheetFingerprint, compactDataUrl } from "../lib/sheets.js";
import { splitIntoPanels } from "../lib/splitGrid.js";
import { GRID_COLS, GRID_ROWS, GRID_SLOTS } from "../lib/gridLayout.js";
import { genId } from "../lib/storage.js";
import { bumpStreak, refreshStreak } from "../lib/streak.js";
import { newCreature } from "../lib/creatures.js";
import { priceForImages, PRICES, IMAGE_COUNTS, PREVIEW_COUNT } from "../lib/pricing.js";
import { VIDEO_MODELS, QUALITIES, priceForFilm, clampSeconds, videoModel, filmQuality, shotBudget } from "../lib/video.js";
import { spend, canAfford } from "../lib/credits.js";
import { useAppState } from "../state/AppState.jsx";
import { t } from "../i18n/index.js";
import Button from "../components/Button.jsx";
import ButtonTapOverlay from "../components/ButtonTapOverlay.jsx";
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
  /* Das Maskottchen tippt den Knopf nach (Antons Ansage 25.08.). Reines
     Beiwerk: Es liegt ÜBER dem Bildschirm und hält nichts auf — der Auftrag
     ist längst unterwegs, wenn das erste Einzelbild läuft. */
  const [tap, setTap] = useState(null);
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
    ? priceForFilm(w.videoModel, w.seconds, { ownKeyframe, quality: w.quality })
    : isPreview ? PRICES.preview
    /* ⚠ Plan B kostet mehr, weil er uns mehr kostet: Nano Banana im
       4K-Raster $0,16 gegen $0,113. Die Zahl steht in pricing.js, nicht
       hier — und sie ist am Jahresabo nachgerechnet, dem engsten Plan. */
    : priceForImages(w.imageCount, w.fallback);
  const assignments = Object.values(w.assignments);
  const named = assignments.filter((a) => a.avatar?.img).length;

  /* Der Szenenbogen und was die gewählte Länge davon trägt — für das
     Storyboard UND für den Film-Aufruf, deshalb hier oben statt im JSX.
     `order` ist immer schon auf die Kappung gestutzt: schrumpft die
     Länge, fällt die älteste eigene Wahl raus (trimSelection). */
  /* ── Der Schnitt (03.09.2026) ──────────────────────────────────────────
     `sceneCap` kommt jetzt aus dem MODELL (shotBudget: wie viele Schnitte
     diese Länge bei diesem Renderer trägt), und die Vorauswahl aus dem
     GEWICHT der Szenen (selectBeats), nicht mehr aus ihrer Position.

     Vorher wählte evenIndices die erste und die letzte Szene — an fünf
     echten Traumprotokollen nachgemessen verlor das in drei von fünf
     Fällen genau das Ereignis, um das es ging (Trockenlauf-Bericht vom
     03.09.). Wer selbst tippt, überschreibt das weiterhin: `pick` schlägt
     die Automatik, wie seit dem 21.08. */
  const arc = w.analysis?.beats || [];
  const filmSecs = clampSeconds(w.videoModel, w.seconds);
  const sceneCap = Math.max(1, Math.min(shotBudget(w.videoModel, filmSecs), arc.length));
  const autoPick = selectBeats(w.analysis, sceneCap);
  const order = trimSelection(pick ?? autoPick, sceneCap);
  const maxSecs = videoModel(w.videoModel).max;
  const rat = recommendation(w.analysis, sceneCap, filmSecs, maxSecs, shotBudget(w.videoModel, maxSecs));

  function toggleScene(i) {
    // Funktional statt über den Render-Abschluss: zwei Tipps im selben
    // Tick würden sonst beide vom selben alten Stand rechnen und der
    // erste ginge still verloren (React batcht setState).
    setPick((prev) => {
      const base = trimSelection(prev ?? autoPick, sceneCap);
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

  /* `tapRect` ist der Knopf, so wie er im Moment des Drucks auf dem
     Bildschirm lag — gemessen im Klick-Ereignis, weil er eine Zeile später
     weg ist (`if (busy) return …`). Er kommt erst NACH den Wächtern in den
     Zustand: Wer nicht genug Credits hat, sieht das Kaufblatt, keinen
     Frosch. */
  async function run(tapRect = null) {
    if (running.current) return;
    /* Nur die Kassenprüfung — abgebucht wird später, Auftrag für Auftrag
       (Bilder) bzw. beim erfolgreichen Absenden (Film/Vorschau). Wer den
       Preis nicht aufbringt, kommt gar nicht erst bis zur Anlage. */
    if (!spend(state, price)) return openPaywall("spent");
    if (tapRect) setTap(tapRect);
    running.current = true;
    setBusy(true);
    setDone(0);
    setMsg(0);
    setFail(null);

    // Everything below is local: no LLM call. The beats came from the single
    // analysis, the style is a constant, the reference clauses are built from
    // what the person assigned.
    const { references, clauses } = buildReferences(assignments);

    /* Kein Poster mehr (Antons Ansage 21.08.: „Wir gehen ganz weg von
       dieser Titelbildgenerierung mit dem Text — das kommt komisch
       rüber"): Jedes Bild ist eine Szene, der Titel lebt weiter auf der
       Journal-Kachel — als echte Typografie der App statt als gemalte
       Buchstaben, die je nach Modell-Laune mal Deutsch, mal Kauderwelsch
       waren. Alte Einträge mit Poster bleiben lesbar: media.poster wird
       weiter GELESEN (beats.js, Storyboard), nur nie mehr geschrieben. */
    const beats = count > 0 ? beatsForCount(w.analysis?.beats || [w.text], count) : [];
    const allBeats = w.analysis?.beats || [w.text];
    const jobs = beats;

    /* ⚠ DER TRAUM ENTSTEHT HIER — nicht wenn die Bilder fertig sind.
     *
     * Antons Befund vom 22.08.: Er drückte auf Erzeugen, ging ins Journal
     * und fand nichts. Kein Wunder: Bis heute wurde der Eintrag erst NACH
     * dem letzten Submit geschrieben, und davor liegt noch die
     * Bogen-Erzeugung, die eine Minute dauern kann. Wer in diesem Fenster
     * wegklickt oder neu lädt, verliert seinen Traum — obwohl längst
     * bezahlt und beauftragt war.
     *
     * Jetzt: Eintrag zuerst, mit `pending` als Marke „Aufträge gehen
     * gerade raus". Ab dieser Zeile überlebt der Traum jeden Bildschirm-
     * wechsel; die Aufträge hängen sich einzeln an, der Collector in
     * AppState holt sie überall in der App ab. Bricht die Sitzung mitten
     * im Abgeben ab, räumt clearStalePending() beim nächsten Start die
     * Marke weg und der Traum steht da — ohne Bilder, aber da. */
    const entryId = w.entryId || genId("e");
    const isNewEntry = !w.entryId;
    const entryRefs = assignments
      .filter((a) => a.avatar?.tag)
      .map((a) => ({ tag: a.avatar.tag, category: a.kind }));
    const commonFields = {
      mode: isFilm ? "film" : "images",
      style: w.styleId, format: w.format,
      imageCount: isFilm ? 0 : w.imageCount,
      analysis: w.analysis || null,
      references: entryRefs,
      pending: { kind: isFilm ? "film" : "images", n: isFilm ? 1 : jobs.length },
      /* ⚠ Am TRAUM, nicht nur im Wizard: Bei acht Szenen reicht der
         Ketten-Läufer in AppState den zweiten Block nach, und der liest
         allein den Journaleintrag. Stünde die Marke nur hier, ginge Block 2
         zum Hauptmodell — also genau zu dem, das eben abgelehnt hat. */
      fallback: w.fallback === true ? true : undefined,
      // Ein neuer Versuch beginnt ohne den alten Grund.
      failReason: undefined,
    };

    if (isNewEntry) {
      // Der Stand VOR dem Hochzählen — wie in Step2/Step6: die Serie, die
      // man sich verdient hat, zählt für diesen Wurf.
      const creature = newCreature(w.text, refreshStreak(state).streak);
      update((prev) => ({
        journal: [...(prev.journal || []), {
          id: entryId,
          createdAt: new Date().toISOString(),
          text: w.text,
          originalText: w.originalText || w.text,
          title: (w.title || "").trim() || creature.title,
          tagline: (w.tagline || "").trim(),
          media: { type: "image", urls: [], source: "none" },
          creatureId: creature.id,
          ...commonFields,
        }],
        creatures: [...(prev.creatures || []), creature],
        ...bumpStreak(prev),
      }));
      patch({ entryId });
    } else {
      update((prev) => ({
        journal: (prev.journal || []).map((e) => (e.id === entryId ? {
          ...e, ...commonFields,
          title: (w.title || "").trim() || e.title,
          tagline: (w.tagline || "").trim() || e.tagline || "",
        } : e)),
      }));
    }

    /* Alle Patches ab hier gehen über prev, nie über das `state` aus dem
       Renderzeitpunkt: Zwischen zwei Submits liegt ein Netzwerkaufruf, und
       die veraltete Journalliste würde den gerade angelegten Traum wieder
       überschreiben. */
    const patchEntry = (fields) => update((prev) => ({
      journal: (prev.journal || []).map((e) => (e.id === entryId ? { ...e, ...fields } : e)),
    }));
    const clearPending = () => patchEntry({ pending: undefined });
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
          /* ⚠⚠ `img2` FEHLTE hier bis zum 25.08.2026 — und das kostete gleich
             zweimal, beides lautlos:
               1. `characterSheet({ photo2: member.img2 })` bekam undefined.
                  Das ZWEITE Foto (Ganzkörper) erreichte den Bogen also nie.
                  Die Zwei-Fotos-Funktion vom 23.08. war im Wizard tot, seit
                  es sie gibt — der Bogen wurde immer aus einem Bild gemacht
                  und die Statur dazuerfunden.
               2. `sheetFingerprint(member)` rechnete damit über eine ANDERE
                  Gestalt als `hasFreshSheet(avatar)` später prüft (das kennt
                  img2). Gemessen: 17epxza gegen 1xthkk2. Der Bogen galt also
                  bei JEDEM Render als veraltet und wurde neu gemacht —
                  $0,017, jedes Mal, für nichts. */
          img2: a.avatar.img2,
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
        const url = await characterSheet({
          photo: member.img, photo2: member.img2, desc: member.desc, category: member.category,
        });
        /* Als kompakter data:-URI gespeichert: nur den versteht fal sicher
           (ein /media/-Pfad zeigt auf diesen Rechner), und als JPEG belastet
           er die localStorage-Quota weniger als das Foto selbst. */
        member.sheet = await compactDataUrl(mediaUrl(url));
        member.sheetOf = sheetFingerprint(member);
        /* ⚠ Über den TAG festschreiben, nicht über die id (25.08.2026).
           Vorher entschied `avatar.id` darüber, WOHIN der Bogen geht: mit id
           ins Ensemble, ohne id ins eigene Porträt. Eine Figur, deren id
           nicht zu `state.cast` passt — oder ein eigenes Porträt, das eine
           id trägt — schrieb den Bogen dann nirgendwohin. Kein Fehler, keine
           Meldung: Beim nächsten Render wird er einfach neu gemacht, wieder
           für Geld.

           Der Tag ist die Identität einer Figur (autoMatch, buildReferences,
           renderRef arbeiten alle darüber). Also entscheidet er auch hier —
           und BEIDE Orte werden angefasst, weil eine Figur nur an einem von
           beiden liegen kann und wir nicht raten müssen, an welchem. */
        const bogen = { sheet: member.sheet, sheetOf: member.sheetOf };
        const imEnsemble = workingCast.some((p) => p?.tag === member.tag);
        if (imEnsemble) {
          workingCast = workingCast.map((p) => (p?.tag === member.tag ? { ...p, ...bogen } : p));
        }
        if (workingMe?.tag === member.tag) workingMe = { ...workingMe, ...bogen };
        if (imEnsemble || workingMe?.tag === member.tag) {
          update({ cast: workingCast, me: workingMe });
        } else {
          /* Weder im Ensemble noch das eigene Porträt: Der Bogen wäre
             verloren. Das ist kein stiller Fall — er hat gerade Geld
             gekostet. */
          console.warn(`[DreamRushes] Bogen für @${member.tag} hat keinen Ort — nicht gespeichert.`);
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
          /* Preis und Bestellung gehen durch DIESELBE Funktion (filmQuality):
             Wer hier die Vorgabe schickt statt der aufgelösten Stufe, riskiert,
             dass Client und Server verschieden auflösen. */
          quality: filmQuality(w.videoModel, w.quality).id,
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
          /* Der Schnittplan: welche Szene wann und wie lange (cut.js). Er
             ersetzt die gleichmäßige Verteilung im Regisseur-Brief — der
             Höhepunkt bekommt den längsten Block, ein Weg fliegt raus.
             Gerechnet wird er HIER, weil hier die Analyse mit ihrer
             Gewichtung liegt und hier der Mensch im Storyboard mitgeredet
             hat; der Server prüft ihn nur nach. */
          shots: arc.length ? shotPlan(w.analysis, order, filmSecs) : undefined,
          // The chosen image, if any — the server then animates it directly
          // instead of rendering a fresh keyframe first.
          keyframe: w.keyframe || undefined,
          prompt: buildImagePrompt({
            beat: beats[0] || w.text, styleId: w.styleId, format: w.format, clauses, index: 1, total: 1,
          }),
        });
        /* Der Auftrag hängt SOFORT am Traum, nicht erst wenn jemand in
           Schritt 6 auf Speichern drückt: Bis heute war ein Film, den man
           nicht abwartete, verloren — Auftrag bezahlt, Ergebnis nirgends.
           Jetzt sammelt ihn der Collector ein, egal wo man gerade ist. */
        update((prev) => ({
          ...(spend(prev, price) || {}),
          journal: (prev.journal || []).map((e) => (e.id === entryId
            ? { ...e, jobId, pending: undefined } : e)),
        }));
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
        update((prev) => ({
          ...(spend(prev, price) || {}),
          journal: (prev.journal || []).map((e) => (e.id === entryId ? {
            ...e, pending: undefined,
            media: { type: "image", urls: panelUrls, source: "api", poster: false },
          } : e)),
        }));
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
      /* Die Strecke ist seit dem 22.08. eine KETTE (Antons Ansage: das
         fertige Bild wird zur Referenz des nächsten — sonst „sieht alles
         nicht wie ein Film aus, sondern wie verschiedene Sachen"). Hier
         geht deshalb nur SZENE 1 raus; sobald ihr Bild da ist, reicht der
         Ketten-Läufer in AppState die nächste nach, mit dem Bild als
         Weltanker. Abgerechnet wird weiter je Einreichung.

         Die Szenentexte wandern MIT in die Kette: Wer 3 von 5 Szenen
         bestellt, rendert eine Auswahl — die Analyse-Liste wäre für
         Szene 2 und 3 die falsche Quelle.

         Alt-Server, der sofort mit urls antwortet: dann läuft die Kette
         gleich hier in der Schleife weiter, mit der frischen URL als
         Anker — dieselbe Logik, nur ohne Warten. */
      /* ── Der Rasterweg (Antons Entscheidung 24.08.2026) ─────────────────
       *
       * Vier Szenen entstehen in EINEM Bild, nicht in vier. Der Grund ist
       * gemessen, nicht ästhetisch: $0,113 für ein 2×2 gegen $0,272 für vier
       * Einzelbilder derselben Stufe — und die vier Kacheln teilen sich von
       * selbst Licht, Palette und Welt, wofür die Kette sonst vier Runden
       * und vier Wartezeiten braucht.
       *
       * ⚠ 2×2 ist die Rastereinheit, nicht 3×3: Ein Behälter im Verhältnis
       * (2×9):(2×16) zerfällt in exakte 9:16-Kacheln — dasselbe Format wie
       * die App. Deshalb ist es der einzige Zuschnitt, der ohne Sonderformat
       * auskommt (gridLayout.js).
       *
       * ⚠ Der Preis bleibt 1 Credit JE SZENE, nicht je Auftrag. Vier Credits
       * für ein Rasterbild ist richtig: Der Mensch bekommt vier Bilder. Was
       * sich geändert hat, ist unser Einkauf — nicht sein Preis.
       *
       * Bei acht Szenen gehen zwei Raster raus, das zweite verankert auf der
       * LETZTEN KACHEL des ersten. Deshalb wartet die Kette dort nicht nur
       * auf das Bild, sondern auf den Schnitt (imageChain.js).
       */
      const SCHRITT = GRID_SLOTS;

      const submitted = [];
      const readyUrls = [];
      let submitError = null;
      /* ⚠ Kein `lastSyncUrl` mehr. Es hielt das zuletzt SOFORT gelieferte Bild
         als Anker für die nächste Runde fest — seit der Alt-Server-Zweig wie
         die Warteschlange abbricht, gibt es keine nächste Runde mehr, die es
         lesen könnte. Beim Raster wäre es ohnehin das falsche Bild gewesen:
         das ungeschnittene Raster statt seiner letzten Kachel. Den Anker
         setzt jetzt ausschließlich die Kette (imageChain.js). */
      for (let i = 0; i < jobs.length; i += SCHRITT) {
        const block = jobs.slice(i, i + SCHRITT);
        const prompt = SCHRITT > 1
          ? buildGridPrompt({
              beats: block, styleId: w.styleId, clauses,
              cols: GRID_COLS, rows: GRID_ROWS, tile: w.format,
            })
          : buildImagePrompt({
              beat: block[0], styleId: w.styleId, format: w.format,
              clauses, index: i + 1, total: jobs.length, prevFrame: false,
            });
        try {
          const res = await generate({
            dream: w.text, mode: "image", cast: castForApi, prompt,
            grid: SCHRITT > 1,
            fallback: w.fallback === true,
          });
          if (res.jobId) {
            submitted.push({ id: res.jobId, tiles: block.length, grid: SCHRITT > 1 });
            update((prev) => ({
              // Je SZENE bezahlt, nicht je Auftrag — siehe oben.
              ...(spend(prev, block.length) || {}),
              journal: (prev.journal || []).map((e) => (e.id === entryId ? {
                ...e,
                imageJobs: [...(e.imageJobs || []), { id: res.jobId, tiles: block.length, grid: SCHRITT > 1 }],
                /* Eine Kette gibt es nur, wenn nach diesem Block noch etwas
                   kommt. Bei vier Szenen im 2×2 ist das nie der Fall — sie
                   entstehen in einem Zug, genau wie Anton es entworfen hat. */
                ...(jobs.length > i + block.length
                  ? { chain: { next: i + block.length, total: jobs.length, beats: jobs, step: SCHRITT } }
                  : {}),
              } : e)),
            }));
            // Warteschlangen-Welt: ab hier übernimmt der Ketten-Läufer.
            setDone((n) => n + 1);
            break;
          } else if (res.urls?.length) {
            /* Alt-Server, der sofort mit Bildern antwortet.
             *
             * ⚠ Seit dem Rasterweg darf das Ergebnis NICHT mehr direkt nach
             * media.urls: Es ist ein Bild mit vier Szenen darin, und
             * ungeschnitten wäre es ein Rasterbild als Traumbild. Also
             * genauso einreihen wie einen Warteschlangen-Auftrag — als
             * bereits entschieden — und den Schnitt-Effekt in AppState
             * dieselbe Arbeit tun lassen. Eine Mechanik statt zwei. */
            readyUrls.push(...res.urls);
            update((prev) => ({
              ...(spend(prev, block.length) || {}),
              journal: (prev.journal || []).map((e) => (e.id === entryId ? {
                ...e,
                imageJobs: [
                  ...(e.imageJobs || []),
                  { id: `sync${i}`, url: res.urls[0], tiles: block.length, grid: SCHRITT > 1 },
                ],
                ...(jobs.length > i + block.length
                  ? { chain: { next: i + block.length, total: jobs.length, beats: jobs, step: SCHRITT } }
                  : {}),
              } : e)),
            }));
            setDone((n) => n + 1);
            break;
          }
        } catch (err) {
          submitError = err;
          break;
        }
        setDone((n) => n + 1);
      }
      if (submitError && submitted.length === 0 && readyUrls.length === 0) {
        /* Kein Auftrag ist rausgegangen, also gibt es auch nichts zu warten:
           Der Traum bleibt stehen (Text, Analyse, Wesen), nur die Marke geht
           weg — sonst behauptete die Kachel für immer, sie arbeite. */
        clearPending();
        throw submitError;
      }

      /* Bezahlt und angehängt ist längst alles (Schleife oben) — hier
         bleibt nur noch, die Marke zu löschen: Ab jetzt wartet der Traum
         nicht mehr auf Aufträge, sondern auf Bilder, und dafür gibt es die
         Auftragsnummern am Eintrag. */
      clearPending();

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
      /* Die Marke muss weg, egal woran es lag — eine Kachel, die ewig
         „wird erstellt" behauptet, ist schlimmer als ein Traum ohne Bild. */
      clearPending();
      setFail(err.message);
      /* ⚠ Der Frosch geht SOFORT weg, wenn es schiefging. Eine Ablehnung
         durch den Inhaltsfilter kommt schnell zurück — schneller als die
         sechs Sekunden. Wer sie hinter einem fröhlichen Maskottchen
         wegblendet, hat die Selbstheilung vom 24.08. wieder zugebaut. */
      setTap(null);
    }
    running.current = false;
    setBusy(false);
  }

  /* Steht in BEIDEN Zweigen, weil der Druck den Bildschirm sofort
     umschaltet: Der Einspieler liegt fest am Sichtfenster (`position:
     fixed`), also ist ihm egal, wo im Baum er hängt — aber nicht, ob er
     überhaupt noch gerendert wird. */
  const einspieler = tap && <ButtonTapOverlay rect={tap} onDone={() => setTap(null)} />;

  /* ⚠ `!tap`: Der Bildschirm wartet, bis das Maskottchen durch ist (Antons
     Befund 31.08.: „Der Button war zu schnell weg, und das Maskottchen kam
     dann später rein"). Vorher schaltete der Druck sofort auf den
     Warte-Bildschirm um — der Frosch tippte also auf einen Knopf, den es
     nicht mehr gab.
     ⚠ Das ist KEIN Widerspruch zur Regel „der Einspieler ist nie ein Tor":
     Aufgehalten wird nur die ANZEIGE. Der Auftrag ist längst unterwegs
     (run() sendet vor dem ersten Einzelbild), und ein Fehler räumt `tap`
     sofort ab — die Ablehnung erscheint also weiterhin ohne Verzögerung. */
  if (busy && !tap) {
    return (
      <section className="wiz-body wiz-busy" role="status" aria-live="polite">
        {einspieler}
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
                  onClick={() => patch({ videoModel: m.id, quality: null, ...(w.secondsTouched ? { seconds: clampSeconds(m.id, w.seconds) } : {}) })}
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

          {/* Der Qualitätsschalter (Antons Ansage 31.08.: „einen Button unter
              den Modellen, je nachdem, welche Qualität wir haben wollen").
              Zahlen kommen aus der Modelltabelle, nie aus den Sprachdateien —
              die Hinweistexte nennen deshalb keine Credits mehr. Beim
              Modellwechsel fällt die Wahl auf `null` zurück, also auf die
              Vorgabe des NEUEN Modells: 720p bei Seedance kostet neunmal so
              viel wie bei H3 ein Stufenwechsel, das erbt man nicht still. */}
          <h2 className="wiz-sub">{t.wizard.step5.qualityLabel}</h2>
          <div className="wiz-formats" role="group" aria-label={t.wizard.step5.qualityLabel}>
            {QUALITIES.map((q) => {
              const k = filmQuality(w.videoModel, q);
              const on = filmQuality(w.videoModel, w.quality).id === q;
              return (
                <button
                  key={q}
                  className={"wiz-format" + (on ? " wiz-format-on" : "")}
                  onClick={() => patch({ quality: q })}
                  aria-pressed={on}
                >
                  <span>{t.wizard.step5.qualityNames[q]}</span>
                  <small>{k.resolution} · {k.creditsPerSecond} {t.wizard.creditsN(k.creditsPerSecond)}/s</small>
                </button>
              );
            })}
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
                {/* Die Empfehlung als SATZ, nicht als Nadel (Skill
                    regisseur-schnitt, Schritt 6). Sie sagt, was diese Länge
                    trägt und was der Traum bräuchte — und bei einem
                    einzigen Shot sagt sie ehrlich, dass fünf Sekunden ein
                    Bild sind und keine Geschichte. */}
                <p className="wiz-cut-note">
                  {rat.einBild ? t.wizard.step5.cutOneShot
                    : rat.alle ? t.wizard.step5.cutAll(rat.beats)
                    : t.wizard.step5.cutSome(rat.passt, rat.beats)}
                  {rat.mehrBei && ` ${t.wizard.step5.cutMoreAt(rat.beiMax, rat.mehrBei)}`}
                  {rat.zweiteiler && ` ${t.wizard.step5.cutTwoParter}`}
                </p>
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

      {einspieler}
      <Button
        onClick={(e) => run(e.currentTarget.getBoundingClientRect())}
        disabled={!canAfford(state, price)}
      >
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
