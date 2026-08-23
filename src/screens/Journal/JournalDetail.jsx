import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/Button.jsx";
import TagField from "../../components/TagField.jsx";
import { useAppState } from "../../state/AppState.jsx";
import { refine, reflect, mediaUrl, generate } from "../../lib/api.js";
import { reflectionContext } from "../../lib/atlas.js";
import { imageIndexForBeat } from "../../lib/beats.js";
import { filmOf, imagesOf, allMediaOf } from "../../lib/entryMedia.js";
import { spend } from "../../lib/credits.js";
import { PRICES } from "../../lib/pricing.js";
import { shareDream, downloadAll, canShareFiles } from "../../lib/share.js";
import { buildReferences, buildImagePrompt } from "../../lib/promptBuilder.js";
import { renderRef } from "../../lib/sheets.js";
import { t } from "../../i18n/index.js";
import Storyboard from "../../components/Storyboard.jsx";
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
  const [showOriginal, setShowOriginal] = useState(false);
  const [refinePick, setRefinePick] = useState(false);   // the "how should I rewrite it?" sheet

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
      const text = await reflect(entry.text, reflectionContext(state.journal, entry));
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
  function make(mode, textOverride) {
    navigate("/dream", {
      state: {
        resume: {
          entryId: entry.id,
          mode,
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
  const film = filmOf(entry);
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
        {swipes && <DeckView entry={entry} film={film} images={images} />}

        <div className="j-content">
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
        {!editing && !proposal && entry.analysis?.beats?.length > 0 && (
          <div className="j-storyboard">
            <p className="j-original-label">{t.storyboard.label}</p>
            <Storyboard
              beats={entry.analysis.beats}
              entry={entry}
              onRenderScene={renderScene}
              onEditBeat={editBeat}
            />
          </div>
        )}

        {/* Eine Zeile statt drei Blöcke (Antons Ansage 21.08.): der warme
            Hauptknopf (Bilder machen ODER Kurzfilm machen) nimmt nicht mehr
            die ganze Breite, die stillen Werkzeuge (Umschreiben, Bearbeiten,
            Teilen) stehen transparent daneben und wickeln auf schmalen
            Schirmen darunter. Löschen bleibt bewusst allein im ⋯-Menü. */}
        {!editing && !proposal && (() => {
          const offerImages = !entry.jobId && !pendingImages && images.length === 0;
          const offerFilm = !entry.jobId && !film && !pendingImages && images.length > 0;
          return (
            <div className="j-make">
              {offerImages && <p className="j-make-lede">{t.journal.makeLede}</p>}
              {offerFilm && <p className="j-make-lede">{t.journal.makeFilmLede}</p>}
              <div className="j-acts">
                {offerImages && (
                  <button className="j-make-btn" onClick={() => make("images")}>
                    <IconImages />
                    <span className="j-make-title">{t.journal.makeImages}</span>
                    <ChevronRight />
                  </button>
                )}
                {offerFilm && (
                  <button className="j-make-btn" onClick={() => make("film")}>
                    <IconFilm />
                    <span className="j-make-title">{t.journal.makeFilm}</span>
                    <ChevronRight />
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

        {/* The film comes first, above the words and the stills it was made
            from: it is the finished piece, they are the working material.
            Controls on, unmuted, no autoplay — a film someone paid for is
            watched deliberately, not glimpsed as a silent loop. */}
        {film && !swipes && (
          <video className="j-film" src={mediaUrl(film)} controls playsInline preload="metadata" />
        )}

        {/* Noch unterwegs (Film oder Bilder): der App-weite Collector
            fragt nach — dieser Bildschirm zeigt es nur an. */}
        {((!film && entry.jobId) || pendingImages) && (
          <div className="j-film-wait" role="status" aria-live="polite">
            <span className="wiz-spinner" aria-hidden="true" />
            <span>{pendingImages ? t.journal.renderingTile : t.journal.filmRendering}</span>
          </div>
        )}

        {proposal ? (
          <RefineProposal
            current={entry.text}
            proposal={proposal}
            onKeep={() => setProposal(null)}
            onAccept={() => { commitText(proposal); setProposal(null); toast(t.journal.edited); }}
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

function RefineProposal({ current, proposal, onKeep, onAccept }) {
  return (
    <div className="j-proposal">
      <h3 className="j-proposal-title">{t.journal.refineTitle}</h3>
      <p className="j-proposal-lede">{t.journal.refineLede}</p>

      <p className="j-compare-label">{t.journal.before}</p>
      <p className="j-compare-text">{current}</p>
      <p className="j-compare-label">{t.journal.after}</p>
      <p className="j-compare-text j-compare-new">{proposal}</p>

      <div className="j-edit-actions">
        <Button variant="ghost" onClick={onKeep}>{t.journal.keep}</Button>
        <Button onClick={onAccept}>{t.journal.accept}</Button>
      </div>
    </div>
  );
}
