import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/Button.jsx";
import TagField from "../../components/TagField.jsx";
import { useAppState } from "../../state/AppState.jsx";
import { refine, reflect, mediaUrl, generate } from "../../lib/api.js";
import { reflectionContext } from "../../lib/atlas.js";
import { imageIndexForBeat, evenIndices } from "../../lib/beats.js";
import { filmOf, filmsOf, imagesOf, allMediaOf } from "../../lib/entryMedia.js";
import { spend } from "../../lib/credits.js";
import { PRICES, priceForImages, IMAGE_COUNTS } from "../../lib/pricing.js";
import { fallbackModel } from "../../lib/imageModel.js";
import { recoveryOptions } from "../../lib/recovery.js";
import { shareDream, downloadAll, canShareFiles } from "../../lib/share.js";
import { buildReferences, buildImagePrompt } from "../../lib/promptBuilder.js";
import { renderRef } from "../../lib/sheets.js";
import { t } from "../../i18n/index.js";
import Storyboard from "../../components/Storyboard.jsx";
import MascotLoader from "../../components/MascotLoader.jsx";
import Recurrence from "../../components/Recurrence.jsx";
import EntryMenu from "./EntryMenu.jsx";
import RefineSheet from "./RefineSheet.jsx";
import { DeckView, CastChips } from "./DreamViews.jsx";
import { IconImages, IconFilm, IconShare, IconSparkle, IconPencil, ChevronRight } from "../../components/icons.jsx";
import "./journal.css";

export default function JournalDetail({ entry, onClose, onOpen }) {
  const { state, update, toast, openPaywall } = useAppState();
  const navigate = useNavigate();
  const closeRef = useRef(null);

  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(entry.text);
  const [busy, setBusy] = useState(false);
  const [proposal, setProposal] = useState(null);   // reworked text awaiting a decision
  /* ⚠ Ein umgeschriebener Text kann aus zwei Gründen dastehen: weil jemand
     „Umschreiben" gedrückt hat (dann wird er nur übernommen), oder weil ein
     Traum an der Inhaltsprüfung gescheitert ist (dann soll direkt danach
     gerendert werden — sonst schickt man jemanden nach dem Umschreiben noch
     einmal auf die Suche nach dem richtigen Knopf). */
  const [proposalRenders, setProposalRenders] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [refinePick, setRefinePick] = useState(false);   // the "how should I rewrite it?" sheet
  /* Welche Fassung des Films gerade läuft. `null` heißt „die neueste" —
     wer nachbessert, will sein Neuestes sehen, und ein fester Index würde
     beim Eintreffen der nächsten Fassung auf die falsche zeigen. */
  const [fassung, setFassung] = useState(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e) => { if (e.key === "Escape" && !menuOpen) onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, menuOpen]);

  /* Kein eigener Abholer mehr: Offene Aufträge (Film UND Bilder) sammelt
     seit dem 21.08. der App-weite Collector in AppState ein — vorher kam
     ein „Speichern — ich hole ihn später ab"-Film nur an, solange genau
     dieser Bildschirm offen blieb. Wer im Startscreen wartete, wartete
     umsonst. Eine Mechanik, ein Ort (collector.js).

     Die Marke `pending` zählt mit: Zwischen „Erzeugen" gedrückt und der
     ersten Auftragsnummer liegt die Bogen-Erzeugung, und in diesem Fenster
     darf das Detail nicht „Bilder machen" anbieten, als wäre nichts los. */
  const pendingImages = (entry.imageJobs || []).length > 0 || !!entry.pending;

  /** Write a new text onto the entry. The first version is never touched.
   *  Die Reflection fällt dabei weg: sie beschreibt den ALTEN Wortlaut,
   *  und eine Deutung zum falschen Text ist schlechter als keine. */
  function commitText(text) {
    update({
      journal: state.journal.map((e) =>
        e.id === entry.id
          ? { ...e, text, reflection: undefined, originalText: e.originalText || e.text, editedAt: new Date().toISOString() }
          : e
      ),
    });
  }

  /* Die Reflection — gratis (Textarbeit), einmal je Wortlaut: das Ergebnis
     wird AM EINTRAG gespeichert, damit Wiederlesen keinen zweiten Aufruf
     kostet und die Deutung stabil bleibt, statt bei jedem Öffnen eine
     andere zu sein. Der Kontext kommt aus dem eigenen Journal (atlas.js) —
     das, was kein Lexikon-Deuter hat. */
  async function runReflect() {
    setBusy(true);
    try {
      const text = await reflect(entry.text, reflectionContext(state.journal, entry), state.language);
      update({
        journal: state.journal.map((e) =>
          e.id === entry.id ? { ...e, reflection: { text, at: new Date().toISOString() } } : e
        ),
      });
    } catch (err) {
      console.error("[DreamRushes] reflect failed:", err);
      toast(`⚠ ${err.message}`);
    }
    setBusy(false);
  }

  function saveEdit() {
    const clean = draft.trim();
    if (clean.length < 8) return toast(t.wizard.tooShort);
    commitText(clean);
    setEditing(false);
    toast(t.journal.edited);
  }

  async function runRefine(mode) {
    setMenuOpen(false);
    const cost = PRICES[mode];
    const paid = spend(state, cost);
    if (!paid) return openPaywall("spent");
    setBusy(true);
    try {
      const text = await refine(entry.text, mode);
      update(paid);            // charge only after it actually came back
      setProposal(text);
    } catch (err) {
      console.error("[DreamRushes] refine failed:", err);
      toast(`⚠ ${err.message}`);
    }
    setBusy(false);
  }

  /* Den beanstandeten Namen von der KI ersetzen lassen — Antons Ansage vom
   * 24.08.2026: „Dann soll er einfach auf den Button klicken, und die AI soll
   * die Lösung umschreiben, dass dieser Name nicht vorkommt."
   *
   * GRATIS, wie jede Textarbeit in dieser App (pricing.js: eine Analyse
   * kostet $0,00026). Für einen Fehler Geld zu nehmen, den unser Modell
   * verursacht hat, wäre die falsche Reihenfolge.
   *
   * ⚠ Es wird NICHT stillschweigend umgeschrieben. Der Vorschlag geht durch
   * denselben Vergleichsdialog wie jedes andere Umschreiben: Es ist sein
   * Traum, und ein Text, der sich hinter seinem Rücken ändert, ist genau das
   * Gegenteil von dem, was diese App verspricht. */
  async function fixNames() {
    setBusy(true);
    try {
      const text = await refine(entry.text, "unname");
      setProposalRenders(true);
      setProposal(text);
    } catch (err) {
      console.error("[DreamRushes] unname failed:", err);
      toast(`⚠ ${err.message}`);
    }
    setBusy(false);
  }

  async function doShare() {
    setMenuOpen(false);
    // Film first, then the stills — the same order the page shows them in.
    const urls = allMediaOf(entry);
    if (urls.length === 0) return toast(t.journal.shareNothing);
    setBusy(true);
    try {
      const result = await shareDream({ urls, title: entry.title, text: entry.text });
      if (result === "unsupported") {
        downloadAll(urls, entry.title);
        toast(t.journal.shareUnsupported);
      } else if (result === "shared") {
        toast(t.journal.shared);
      }
      // "cancelled" is a normal outcome — say nothing.
    } catch (err) {
      console.error("[DreamRushes] share failed:", err);
      toast(`⚠ ${err.message}`);
    }
    setBusy(false);
  }

  /* Den Wortlaut einer Szene ändern (Antons Wunsch 22.08.: „damit man den
   * Text nochmal anpassen kann, direkt bevor man generiert").
   *
   * Gespeichert wird am TRAUM, in analysis.beats — genau deshalb, weil er
   * „nicht irgendwie ein Problem später" wollte: Aus diesem einen Feld
   * lesen die Kacheln, der Bildauftrag (renderScene unten) und der
   * Filmschnitt. Eine zweite Fassung nur für den Bildauftrag wären zwei
   * Wahrheiten, die ab dem nächsten Film auseinanderlaufen.
   *
   * ⚠ Nur der TEXT ändert sich, nie die ANZAHL der Szenen: An der Länge
   * von beats hängen die Beat↔Bild-Zuordnung (imageIndexForBeat), die
   * Szenenwahl im Film-Schritt und die Sekundenrechnung. Wer hier später
   * Hinzufügen oder Löschen einbaut, muss diese drei mitdenken. */
  function editBeat(i, text) {
    const clean = String(text || "").trim();
    const beats = entry.analysis?.beats || [];
    if (!clean || !beats[i] || clean === beats[i]) return;
    update({
      journal: state.journal.map((e) => (e.id === entry.id ? {
        ...e,
        analysis: { ...e.analysis, beats: beats.map((b, k) => (k === i ? clean : b)) },
      } : e)),
    });
  }

  /* Eine leere Storyboard-Kachel nachfüllen (Antons Go 21.08.): EIN Bild
   * für GENAU diese Szene — 1 Credit, als Hintergrund-Auftrag; der
   * Collector schreibt es nach sceneImages[beat] und meldet sich. Die
   * Referenzen werden aus entry.references + Bibliothek rekonstruiert,
   * damit die echten Gesichter auch im Nachzügler-Bild stimmen. */
  async function renderScene(i) {
    const beats = entry.analysis?.beats || [];
    if (!beats[i]) return;
    const paid = spend(state, PRICES.scene);
    if (!paid) return openPaywall("spent");

    const pool = [...(state.cast || []), ...(state.me ? [state.me] : [])];
    const byTag = new Map(pool.filter((a) => a?.tag).map((a) => [a.tag, a]));
    const assigns = (entry.references || [])
      .map((r) => ({ kind: r.category || "person", avatar: byTag.get(r.tag) }))
      .filter((a) => a.avatar?.img);
    const { clauses } = buildReferences(assigns);
    const cast = assigns.map(({ kind, avatar }) => {
      const category = kind === "pet" ? "pet" : kind === "place" ? "place" : "person";
      return {
        tag: avatar.tag, category, desc: avatar.desc || "",
        img: renderRef({ ...avatar, category, desc: avatar.desc || "" }),
      };
    });

    /* Der Weltanker auch beim Nachzügler (22.08., Bildkette): das
       nächstgelegene FRÜHERE Szenenbild — nachgefüllte Einzelbilder zuerst,
       sonst die abgeleitete Sequenz-Zuordnung. So fügt sich die neue Szene
       in die Welt der Strecke ein, statt eine eigene zu erfinden. */
    let anchor = null;
    for (let j = i - 1; j >= 0 && !anchor; j--) {
      anchor = entry.sceneImages?.[j] || null;
      if (!anchor) {
        const idx = imageIndexForBeat(j, {
          imageCount: entry.imageCount ?? 0,
          poster: entry.media?.poster,
          urlCount: (entry.media?.urls || []).length,
        });
        if (idx != null) anchor = entry.media.urls[idx];
      }
    }

    setBusy(true);
    try {
      const res = await generate({
        dream: entry.text, mode: "image", cast,
        sequenceRef: anchor || undefined,
        prompt: buildImagePrompt({
          beat: beats[i], styleId: entry.style || entry.analysis?.style || "dreamlike",
          format: entry.format || "9:16", clauses, index: i + 1, total: beats.length,
          prevFrame: !!anchor,
        }),
      });
      update({
        ...paid,
        journal: state.journal.map((e) => (e.id === entry.id ? {
          ...e,
          ...(res.jobId
            ? { sceneJobs: [...(e.sceneJobs || []), { id: res.jobId, beat: i }] }
            : { sceneImages: { ...(e.sceneImages || {}), [i]: res.urls?.[0] } }),
        } : e)),
      });
      toast(t.storyboard.scenePending);
    } catch (err) {
      console.error("[DreamRushes] scene render failed:", err);
      toast(`⚠ ${err.message}`);
    }
    setBusy(false);
  }

  /* Choosing "save only" was never meant to be final — it just deferred the
   * decision. This hands the dream back to the wizard, which picks up at the
   * cast step: the text is written, so the only thing still open is what to
   * make of it. The entry id travels along so the result updates this dream
   * instead of writing a second copy of it. */
  function make(mode, textOverride, opts = {}) {
    navigate("/dream", {
      state: {
        resume: {
          entryId: entry.id,
          mode,
          /* Plan B: mit dem Ausweichmodell rendern. Reist als Teil des
             Wiedereinstiegs mit, damit der Wizard Preis UND Auftrag daraus
             baut — eine Quelle statt zwei. */
          fallback: opts.fallback === true,
          // A film made from this dream animates one of its own images; the
          // wizard shows them and lets the person pick which one. Only local
          // copies qualify — an old entry may still hold fal URLs, and those
          // expire, so offering them would offer a picture that is gone.
          urls: imagesOf(entry).filter((u) => typeof u === "string" && u.startsWith("/media/")),
          text: textOverride || entry.text,
          originalText: entry.originalText || entry.text,
          title: entry.title || "",
          tagline: entry.tagline || "",
          // Changed words mean the old reading no longer describes this
          // dream — it is re-read rather than reused.
          analysis: textOverride ? null : entry.analysis || null,
        },
      },
    });
  }

  function remove() {
    update({ journal: state.journal.filter((e) => e.id !== entry.id) });
    toast(t.journal.deleted);
    onClose();
  }

  const d = new Date(entry.createdAt);
  /* Alle Fassungen dieses Traums, älteste zuerst — und die, die gerade
     läuft. Antons Ansage 03.09.2026: „Alle diese Träume können in diese
     Kachel reinkommen … es kann sein, dass eine Person so lange
     weitermacht, bis er wirklich passt." */
  const filme = filmsOf(entry);
  const gezeigt = fassung != null && filme[fassung] ? fassung : filme.length - 1;
  const film = filme.length ? filme[gezeigt].url : filmOf(entry);
  const images = imagesOf(entry);
  // The film leads if there is one — it is the finished thing the pictures
  // were a step towards, so it takes the hero and the top of the page.
  const hero = mediaUrl(film || images[0]) || null;
  const heroIsVideo = !!film;

  /* Antons Wahl vom 21.08. aus je drei Varianten: die Kino-Strecke
     (DreamViews.jsx) mit dem Ornament-Titel — Traumname mittig in der
     Serifen-Schrift der Karten, ✦-Zierlinie, Tagline kursiv darunter.
     Nur Träume MIT Bildern swipen — reiner Text bleibt die alte Seite. */
  const hasMedia = images.length > 0;
  const swipes = hasMedia && !editing && !proposal;
  const slimHead = swipes;
  const dateLabel = d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="j-backdrop" onClick={onClose}>
      <div
        className="j-modal"
        role="dialog"
        aria-modal="true"
        aria-label={entry.title || t.journal.untitled}
        onClick={(e) => e.stopPropagation()}
      >
        {/* The dream opens with its own image behind the title. The hero is a
            CROP of the first image (top-biased), which is why the app draws
            the title itself: on a poster the rendered title sits in the lower
            third, below this crop, so the two never collide. The full poster
            is still right there in the carousel underneath. */}
        {slimHead ? (
          /* Kompakter Kopf: nur die Werkzeuge — der Titel bekommt je nach
             gewählter Behandlung seinen eigenen Auftritt (unten bzw. im
             ersten Panel). */
          <div className="j-slimhead">
            <div className="j-modal-tools j-modal-tools-inline">
              <button className="j-close" onClick={() => setMenuOpen(true)} aria-label={t.journal.menu}>⋯</button>
              <button ref={closeRef} className="j-close" onClick={onClose} aria-label={t.journal.close}>×</button>
            </div>
            {/* Der Titel: mittig, Serife, Ornament — der KI-erdachte
                Traumname bekommt den Auftritt eines Buchtitelblatts. */}
            <header className="j-title-block">
              <p className="j-title-eyebrow">{dateLabel}</p>
              <h2 className="j-title-serif">{entry.title || t.journal.untitled}</h2>
              <div className="j-title-orn" aria-hidden="true"><span>✦</span></div>
              {entry.tagline && (
                <p className="j-title-tagline j-title-tagline-italic">{entry.tagline}</p>
              )}
            </header>
          </div>
        ) : (
        <div className="j-hero">
          {hero && !heroIsVideo && <img className="j-hero-img" src={hero} alt="" />}
          {hero && heroIsVideo && <video className="j-hero-img" src={hero} muted loop autoPlay playsInline />}
          {!hero && <div className="j-hero-blank" aria-hidden="true" />}
          <div className="j-hero-scrim" aria-hidden="true" />

          <div className="j-modal-tools">
            <button className="j-close" onClick={() => setMenuOpen(true)} aria-label={t.journal.menu}>⋯</button>
            <button ref={closeRef} className="j-close" onClick={onClose} aria-label={t.journal.close}>×</button>
          </div>

          <div className="j-hero-meta">
            <p className="j-modal-date">
              {d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
            </p>
            <h2 className="j-hero-title">{entry.title || t.journal.untitled}</h2>
            {entry.tagline && <p className="j-hero-tagline">{entry.tagline}</p>}
          </div>
        </div>
        )}

        {/* Die Kino-Strecke liegt VOLLBREIT über dem Inhalt — Bild zuerst,
            alles Sekundäre darunter. */}
        {/* ⚠ Ohne den Film (03.09.2026): Er hat seit dem Videofeld genau
            EINEN Ort auf dieser Seite. Vorher lief er hier als erste Karte
            der Strecke UND unten als Player — zweimal derselbe Film, und
            keiner der beiden war eindeutig der, den man meint. Die Strecke
            zeigt jetzt, was sie ist: die Bilder. */}
        {swipes && <DeckView entry={entry} images={images} />}

        <div className="j-content">
        {/* ── Das Videofeld (Antons Ansage 03.09.2026: „den Videoplayer dann
            einbauen bei den Träumen statt dieser Kacheln") ────────────────
            Der Film führt die Seite an: ganz oben, in voller Breite, mit
            Bedienleiste und Ton. Vorher stand er WEIT unten, hinter dem
            Storyboard, den Knöpfen und dem Traumtext — das Fertige lag
            hinter seinem Arbeitsmaterial.

            Solange er rendert, steht hier dasselbe Feld mit dem Standbild
            darin, statt eines Platzhalters woanders: Der Platz, an dem der
            Film erscheinen wird, ist von Anfang an derselbe. */}
        {(film || entry.jobId) && (
          <div className="j-videofeld">
            {film ? (
              <>
                <video
                  /* `key` auf die Adresse: Ohne ihn tauscht React nur das
                     src-Attribut, und ein laufendes <video> übernimmt das
                     nicht zuverlässig — beim Umschalten zwischen zwei
                     Fassungen liefe die alte weiter. */
                  key={film}
                  className="j-video"
                  src={mediaUrl(film)}
                  controls
                  playsInline
                  preload="metadata"
                  poster={images[0] ? mediaUrl(images[0]) : undefined}
                />
                {/* Die Fassungen dieses Traums, sobald es mehr als eine
                    gibt. Beschriftet mit dem, was sie unterscheidet —
                    Tempo und Länge —, nicht mit einer nackten Nummer:
                    „Fassung 2" sagt niemandem, was er gleich sieht. */}
                {filme.length > 1 && (
                  <div className="j-takes" role="group" aria-label={t.journal.takesLabel}>
                    {filme.map((f, i) => (
                      <button
                        key={f.url}
                        className={"j-take" + (i === gezeigt ? " j-take-on" : "")}
                        onClick={() => setFassung(i)}
                        aria-pressed={i === gezeigt}
                      >
                        <span className="j-take-n">{i + 1}</span>
                        <span className="j-take-label">
                          {f.pace ? t.wizard.step5.paceNames[f.pace] || f.pace : t.journal.takeUnknown}
                          {f.seconds ? ` · ${f.seconds}s` : ""}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div
                /* Ohne Standbild ein ruhigeres Feld: Ein 9:16-Rahmen ohne
                   Bild darin sind 700 Pixel Leere mit einem schlafenden
                   Frosch am Grund. Mit Standbild bleibt das Filmformat, da
                   ist die Fläche ja gefüllt. */
                className={`j-video-wait${images[0] ? "" : " j-video-wait-leer"}`}
                role="status"
                aria-live="polite"
              >
                {images[0] && <img className="j-video-still" src={mediaUrl(images[0])} alt="" />}
                {/* Der Frosch wartet mit (Antons Ansage 03.09.): Er legt
                    sich hin und schläft, solange der Film rendert. Das ist
                    hier nicht nur Zierde — wer auf einen Traum wartet,
                    schaut lieber einem Schlafenden zu als einem Ring. */}
                <div className="j-video-wait-body">
                  <MascotLoader />
                  <span>{t.journal.filmRendering}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* The one action that spends credits leads the page — moved up from
            below the whole story, where it was the last thing anyone saw
            after scrolling past everything else. One way forward at a time,
            in the order the dream actually grows: words → pictures →
            motion. A dream with nothing yet is only offered pictures.
            Offering a film there asked someone to buy the most expensive
            thing in the app before they had seen a single frame of what it
            would look like. The film is offered once there ARE pictures,
            when they know what they are animating. Both hidden while a film
            renders: that one is on its way, not missing. */}
        {/* Der Bogen, aus dem die Bilder entstanden — antippbar, mit dem
            Bild je Szene, wo die Zuordnung sicher ist (Plan: Storyboard vor
            dem Film, Stufe A). Nur wenn eine Analyse existiert: Seeds und
            handgeschriebene Alt-Einträge haben keinen Bogen. */}
        {/* ⚠ Nur solange es KEINEN Film gibt und keiner läuft (03.09.2026):
            Das Storyboard ist das Arbeitsmaterial, aus dem der Film wurde.
            Steht der Film oben, hat es seine Aufgabe erfüllt — es unter dem
            fertigen Film zu wiederholen macht aus dem Produkt eine Beilage
            seiner eigenen Vorstufe. */}
        {!editing && !proposal && !film && !entry.jobId && entry.analysis?.beats?.length > 0 && (() => {
          /* ⚠ Gezeigt werden die Szenen, die auch BILDER werden — nicht der
             rohe Fünfer-Bogen der Analyse (Antons Befund 25.08.: „es gibt
             jetzt nur noch vier, nicht mehr fünf"). Die Analyse liefert
             absichtlich fünf Quell-Beats (beats.js, SOURCE_BEATS); welche
             davon Bilder werden, entscheidet dieselbe evenIndices-Formel
             wie beim Rendern — zwei verschiedene Spreads würden eine Kachel
             zeigen, die nie ein Bild bekommt. `indices` hält Bearbeiten,
             Nachfüllen und die Bild-Zuordnung auf den Quell-Indizes. */
          const alle = entry.analysis.beats;
          const off = entry.media?.poster === true ? 1 : 0;
          const bestellt = (Number(entry.imageCount) || 0) - off;
          /* Zwei Fälle, bewusst getrennt: BEZAHLTE Bilder werden gezeigt,
             wie sie sind — auch fünf aus der Zeit des imageCount-5-Fehlers;
             sie existieren und haben Geld gekostet. Nur der PLAN eines noch
             ungerenderten Traums fällt auf die angebotenen Zahlen zurück,
             denn genau so viele Bilder wird „Bilder machen" bestellen. */
          const hatBilder = (entry.media?.urls?.length || 0) > 0;
          const n = hatBilder
            ? (bestellt >= 1 && bestellt <= alle.length ? bestellt : alle.length)
            : Math.min(IMAGE_COUNTS.includes(bestellt) ? bestellt : IMAGE_COUNTS[0], alle.length);
          const sel = evenIndices(alle.length, n);
          return (
            <div className="j-storyboard">
              <p className="j-original-label">{t.storyboard.label}</p>
              <Storyboard
                beats={sel.map((i) => alle[i])}
                indices={sel}
                entry={entry}
                onRenderScene={renderScene}
                onEditBeat={editBeat}
              />
            </div>
          );
        })()}

        {/* Eine Zeile statt drei Blöcke (Antons Ansage 21.08.): der warme
            Hauptknopf (Bilder machen ODER Kurzfilm machen) nimmt nicht mehr
            die ganze Breite, die stillen Werkzeuge (Umschreiben, Bearbeiten,
            Teilen) stehen transparent daneben und wickeln auf schmalen
            Schirmen darunter. Löschen bleibt bewusst allein im ⋯-Menü. */}
        {!editing && !proposal && (() => {
          /* ⚠ …und nicht, wenn der Film schon da ist (03.09.2026). Vorher
             stand unter dem fertigen Film „Noch keine Bilder. Welche
             machen?" samt warmem Hauptknopf — die App bot als
             Nächstliegendes ausgerechnet das Produkt an, von dem sie sich
             gerade verabschiedet (docs/plans/2026-08-31-nur-noch-film.md).
             Bilder sind Handwerk hinter dem Film, kein Nachtisch danach. */
          const offerImages = !entry.jobId && !pendingImages && images.length === 0 && !film;
          /* ── Warum es nicht ging, und was man tun kann (24.08.2026) ──────
             Bis hierher stand bei einem gescheiterten Traum nur „Bilder
             machen" — derselbe Knopf wie beim unberührten Traum, und beim
             Policy-Fall führt er garantiert zum selben Ergebnis.
             `failReason` kommt vom Server durch den Collector bis hierher. */
          /* Welche Wege es jetzt gibt, entscheidet EINE Regel (recovery.js) —
             nicht drei Bedingungen in diesem Bildschirm. Dort steht auch,
             warum ein zweiter Modellwechsel nach einem gescheiterten Plan B
             kein Angebot mehr ist, sondern eine Wette auf Kosten des Kunden. */
          const weg = images.length === 0
            ? recoveryOptions(entry, { fallbackAvailable: !!fallbackModel() })
            : recoveryOptions(null);
          /* ⚠ ODER der Traum war von Anfang an ein Film (03.09.2026): Bis
             hierher verlangte das Angebot Bilder — „erst zeigen, was man
             animiert". Für einen Traum, der als Film angelegt wurde und
             dessen Render scheiterte, war das eine Sackgasse: Er hat keine
             Bilder und bekommt deshalb nur „Bilder machen" angeboten, also
             genau das, was er nie wollte. Mit dem Rückbau des Bildprodukts
             wird das der Normalfall, nicht die Ausnahme. */
          /* ⚠ Und ein vorhandener Film schliesst den nächsten NICHT aus
             (Antons Ansage 03.09.2026): „Wenn bereits Träume da sind, kann
             man noch so einen Button hinzufügen: nochmals generieren mit
             Änderungen. Es kann sein, dass eine Person so lange weitermacht,
             bis er wirklich passt." Der Knopf heisst dann anders und steht
             still neben den anderen, statt als warmer Hauptknopf — der
             erste Film ist ein Angebot, der zweite eine Entscheidung. */
          const offerFilm = !entry.jobId && !pendingImages
            && (images.length > 0 || entry.mode === "film" || !!film);
          /* ⚠ Was LÄUFT, bekommt einen Platz — und zwar DEN, auf den die Hand
             gerade gedrückt hat (Antons Befund 31.08.: „Dieser Kurzfilm-machen-
             Knopf sollte in dem Moment, wenn man den angeklickt hat, eine Art
             Wartuhr … Text geändert werden").
             Vorher verschwand der Knopf beim Absenden ersatzlos. Für die App
             war das sauber (`offerFilm` wurde falsch), für den Menschen sah es
             aus, als hätte sein Druck nichts getan — die einzige Rückmeldung
             stand weit oben, wo der Film später landet, oft außerhalb des
             Bildes. Ein Knopf, der auf Druck spurlos verschwindet, ist keine
             Antwort. */
          const laeuft = pendingImages ? "images" : (entry.jobId && !film) ? "film" : null;
          return (
            <div className="j-make">
              {weg.message && <p className="j-make-warn">⚠ {t.errors[weg.message]}</p>}
              {offerImages && !weg.message && <p className="j-make-lede">{t.journal.makeLede}</p>}
              {offerFilm && !film && <p className="j-make-lede">{t.journal.makeFilmLede}</p>}
              <div className="j-acts">
                {laeuft && (
                  <span className="j-make-btn j-make-wait" role="status" aria-live="polite">
                    <span className="wiz-spinner" aria-hidden="true" />
                    <span className="j-make-title">
                      {laeuft === "film" ? t.journal.filmPending : t.journal.imagesPending}
                    </span>
                  </span>
                )}
                {offerImages && weg.rewrite && (
                  /* Der HAUPTknopf bei einer Textablehnung — er steht vor
                     „nochmal versuchen" und vor Plan B, weil er der einzige
                     ist, der die Ursache anfasst. Gratis. */
                  <button className="j-make-btn" onClick={fixNames} disabled={busy}>
                    <IconSparkle />
                    <span className="j-make-title">{t.journal.fixNames}</span>
                    <ChevronRight />
                  </button>
                )}
                {offerImages && (
                  /* ⚠ Nach einer TEXT-Ablehnung wird daraus ein stiller
                     Nebenknopf. Unverändert noch einmal zu senden führt
                     garantiert zur selben Ablehnung — er darf nicht der
                     erste sein, auf den die Hand fällt. */
                  <button
                    className={weg.rewrite ? "j-act" : "j-make-btn"}
                    onClick={() => make("images")}
                  >
                    <IconImages />
                    <span className={weg.rewrite ? undefined : "j-make-title"}>
                      {weg.message ? t.journal.tryAgainAnyway : t.journal.makeImages}
                    </span>
                    {!weg.message && <ChevronRight />}
                  </button>
                )}
                {offerImages && weg.otherModel && (
                  /* ⚠ Der Knopf heisst „anderes Modell", nicht „das, das
                     das darf". Nano Banana ist bei geschuetzten Figuren
                     ANDERS streng, nicht weniger — versprochen wird hier
                     nichts, und eine App, die mit dem Umgehen von
                     Inhaltsfiltern wirbt, fliegt beim Anbieter raus. */
                  <button className="j-act j-act-planb"
                          onClick={() => make("images", null, { fallback: true })}>
                    <IconImages />
                    <span>{t.journal.tryOtherModel(priceForImages(entry.imageCount || IMAGE_COUNTS[0], true))}</span>
                  </button>
                )}
                {offerFilm && (
                  <button
                    className={film ? "j-act" : "j-make-btn"}
                    onClick={() => make("film")}
                  >
                    <IconFilm />
                    <span className={film ? undefined : "j-make-title"}>
                      {film ? t.journal.makeFilmAgain : t.journal.makeFilm}
                    </span>
                    {!film && <ChevronRight />}
                  </button>
                )}
                <button className="j-act" onClick={() => setRefinePick(true)} disabled={busy}>
                  <IconSparkle />
                  <span>{t.journal.actRewrite}</span>
                </button>
                <button className="j-act" onClick={() => setEditing(true)}>
                  <IconPencil />
                  <span>{t.journal.actEdit}</span>
                </button>
                <button className="j-act" onClick={doShare} disabled={busy || allMediaOf(entry).length === 0}>
                  <IconShare />
                  <span>{t.journal.actShare}</span>
                </button>
              </div>
            </div>
          );
        })()}

        {busy && <p className="j-working">{t.journal.working}</p>}

        {/* Der Film steht seit dem 03.09.2026 OBEN im Videofeld, nicht mehr
            hier unten hinter Storyboard, Knöpfen und Text. Hier bleibt nur
            noch die Meldung für laufende BILD-Aufträge — der wartende Film
            hat seinen Platz oben, dort wo er erscheinen wird. */}
        {pendingImages && (
          <div className="j-film-wait" role="status" aria-live="polite">
            <span className="wiz-spinner" aria-hidden="true" />
            <span>{t.journal.renderingTile}</span>
          </div>
        )}

        {proposal ? (
          <RefineProposal
            current={entry.text}
            proposal={proposal}
            renders={proposalRenders}
            onKeep={() => { setProposal(null); setProposalRenders(false); }}
            onAccept={() => {
              const text = proposal;
              commitText(text);
              setProposal(null);
              if (proposalRenders) {
                setProposalRenders(false);
                /* Direkt weiter in den Render — mit dem NEUEN Text, und ohne
                   die alte Analyse: Sie beschreibt eine Fassung, in der der
                   Name noch vorkam, und ihre Szenentexte gingen genauso
                   wieder in die Ablehnung. */
                make("images", text);
              } else {
                toast(t.journal.edited);
              }
            }}
          />
        ) : editing ? (
          <>
            {/* Same field as in the wizard: names from the profile light up
                while the text is reworked, and tapping one shows who it is.
                Which avatars a rewritten dream will pull in matters most
                here — the images beside it were made from the old wording. */}
            <TagField
              className="j-edit"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={8}
              autoFocus
              aria-label={t.journal.editing}
            />
            <div className="j-edit-actions">
              <Button variant="ghost" onClick={() => { setDraft(entry.text); setEditing(false); }}>
                {t.journal.cancelEdit}
              </Button>
              <Button onClick={saveEdit}>{t.journal.save}</Button>
            </div>
          </>
        ) : swipes ? null : (
          <DreamStory text={entry.text} urls={images} type="image" />
        )}

        {/* Die Besetzung mit Gesichtern statt der nackten @tag-Zeile. */}
        {entry.references?.length > 0 && (
          <CastChips refs={entry.references} cast={state.cast || []} me={state.me} />
        )}

        {/* Was an diesem Traum schon einmal da war — gezählt, nicht gedeutet,
            und deshalb ÜBER der Reflection: erst der Befund, dann die
            Lesart. Antippen führt in den früheren Traum (Mehrwert-Plan P2b). */}
        {!editing && !proposal && onOpen && (
          <Recurrence journal={state.journal || []} entry={entry} onOpen={onOpen} />
        )}

        {/* Die Reflection: Spiegel, nicht Orakel (Mehrwert-Plan P1a). Ein
            ruhiger Absatzblock unter der Besetzung — erst auf Wunsch, dann
            dauerhaft. Der Hinweis darunter sagt ehrlich, was das ist: EINE
            mögliche Lesart, keine Wahrheit über den Menschen. */}
        {!editing && !proposal && (
          <div className="j-reflect">
            {entry.reflection ? (
              <>
                <p className="j-original-label">{t.journal.reflectTitle}</p>
                <p className="j-reflect-text">{entry.reflection.text}</p>
                <p className="j-reflect-note">{t.journal.reflectNote}</p>
              </>
            ) : (
              <button className="j-reflect-btn" onClick={runReflect} disabled={busy}>
                <IconSparkle />
                <span className="j-reflect-btn-body">
                  <span>{t.journal.reflectCta}</span>
                  <small>{t.journal.reflectHint}</small>
                </span>
              </button>
            )}
          </div>
        )}

        {/* Der erste Wortlaut — aufgerufen über das ⋯-Menü (der frühere
            Link unten am Eintrag wirkte „verloren angeheftet", Antons
            Befund 21.08.). Nochmaliges Antippen im Menü blendet ihn aus. */}
        {showOriginal && entry.originalText && entry.originalText !== entry.text && (
          <div className="j-original">
            <p className="j-original-label">{t.journal.original}</p>
            <p className="j-original-text">{entry.originalText}</p>
          </div>
        )}
        </div>

        {menuOpen && (
          <EntryMenu
            canShare={allMediaOf(entry).length > 0}
            onEdit={() => { setMenuOpen(false); setEditing(true); }}
            onRefine={runRefine}
            onShare={doShare}
            onOriginal={entry.originalText && entry.originalText !== entry.text
              ? () => { setMenuOpen(false); setShowOriginal((v) => !v); }
              : null}
            onDelete={() => { setMenuOpen(false); remove(); }}
            onClose={() => setMenuOpen(false)}
          />
        )}

        {refinePick && (
          <RefineSheet
            onPick={(mode) => { setRefinePick(false); runRefine(mode); }}
            onClose={() => setRefinePick(false)}
          />
        )}
      </div>
    </div>
  );
}

/* The dream as a photo story: a passage of text, then the picture it
 * describes, then the next passage — the way a comic reads.
 *
 * The split is by SENTENCES, distributed evenly across the images, because
 * that is the only structure the text reliably has. The beats that produced
 * the images are English and live in the analysis, not in the entry, so they
 * cannot line the two up; an even spread gets the order right, which is what
 * matters. The first image stays first, the last passage stays last.
 */
function DreamStory({ text, urls = [], type }) {
  // Only image sequences become a story. One image or a film has nothing to
  // interleave, so the text stays whole.
  if (type !== "image" || urls.length < 2) {
    return (
      <>
        <p className="j-modal-text">{text}</p>
        {urls.length === 1 && <img className="j-story-img" src={mediaUrl(urls[0])} alt="" loading="lazy" />}
      </>
    );
  }

  const sentences = String(text).match(/[^.!?…]+[.!?…]*\s*/g) || [text];
  const per = Math.ceil(sentences.length / urls.length);
  const passages = [];
  for (let i = 0; i < urls.length; i++) {
    const part = sentences.slice(i * per, (i + 1) * per).join("").trim();
    if (part) passages.push(part);
  }

  return (
    <div className="j-story">
      {urls.map((u, i) => (
        <div key={i} className="j-story-panel">
          <img className="j-story-img" src={mediaUrl(u)} alt="" loading="lazy" />
          {passages[i] && <p className="j-story-text">{passages[i]}</p>}
        </div>
      ))}
      {/* Anything left over when there are more passages than pictures. */}
      {passages.slice(urls.length).map((p, i) => (
        <p key={`rest${i}`} className="j-story-text">{p}</p>
      ))}
    </div>
  );
}

function RefineProposal({ current, proposal, onKeep, onAccept, renders = false }) {
  return (
    <div className="j-proposal">
      <h3 className="j-proposal-title">
        {renders ? t.journal.fixNamesTitle : t.journal.refineTitle}
      </h3>
      <p className="j-proposal-lede">
        {renders ? t.journal.fixNamesLede : t.journal.refineLede}
      </p>

      <p className="j-compare-label">{t.journal.before}</p>
      <p className="j-compare-text">{current}</p>
      <p className="j-compare-label">{t.journal.after}</p>
      <p className="j-compare-text j-compare-new">{proposal}</p>

      <div className="j-edit-actions">
        <Button variant="ghost" onClick={onKeep}>{t.journal.keep}</Button>
        {/* ⚠ „Übernehmen" wäre hier gelogen: Der Knopf gibt auch Geld aus.
            Was er kostet, steht drauf — dieselbe Regel wie überall sonst. */}
        <Button onClick={onAccept}>{renders ? t.journal.acceptAndMake : t.journal.accept}</Button>
      </div>
    </div>
  );
}
