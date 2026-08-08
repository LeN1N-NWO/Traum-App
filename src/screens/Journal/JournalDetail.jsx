import { useEffect, useRef, useState } from "react";
import Button from "../../components/Button.jsx";
import { useAppState } from "../../state/AppState.jsx";
import { refine, mediaUrl } from "../../lib/api.js";
import { spend } from "../../lib/credits.js";
import { PRICES } from "../../lib/pricing.js";
import { shareDream, downloadAll, canShareFiles } from "../../lib/share.js";
import { t } from "../../i18n/index.js";
import EntryMenu from "./EntryMenu.jsx";
import MediaCarousel from "../../components/MediaCarousel.jsx";
import "./journal.css";

export default function JournalDetail({ entry, onClose }) {
  const { state, update, toast } = useAppState();
  const closeRef = useRef(null);

  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(entry.text);
  const [busy, setBusy] = useState(false);
  const [proposal, setProposal] = useState(null);   // reworked text awaiting a decision
  const [showOriginal, setShowOriginal] = useState(false);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e) => { if (e.key === "Escape" && !menuOpen) onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, menuOpen]);

  /** Write a new text onto the entry. The first version is never touched. */
  function commitText(text) {
    update({
      journal: state.journal.map((e) =>
        e.id === entry.id
          ? { ...e, text, originalText: e.originalText || e.text, editedAt: new Date().toISOString() }
          : e
      ),
    });
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
    if (!paid) return toast(t.journal.noCredits);
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
    const urls = entry.media?.urls || [];
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

  function remove() {
    update({ journal: state.journal.filter((e) => e.id !== entry.id) });
    toast(t.journal.deleted);
    onClose();
  }

  const d = new Date(entry.createdAt);
  const urls = entry.media?.urls || [];
  const isVideo = entry.media?.type === "video";
  const hero = mediaUrl(urls[0]) || null;

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
        <div className="j-hero">
          {hero && !isVideo && <img className="j-hero-img" src={hero} alt="" />}
          {hero && isVideo && <video className="j-hero-img" src={hero} muted loop autoPlay playsInline />}
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

        <div className="j-content">
        {busy && <p className="j-working">{t.journal.working}</p>}

        {proposal ? (
          <RefineProposal
            current={entry.text}
            proposal={proposal}
            onKeep={() => setProposal(null)}
            onAccept={() => { commitText(proposal); setProposal(null); toast(t.journal.edited); }}
          />
        ) : editing ? (
          <>
            <textarea
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
        ) : (
          <DreamStory text={entry.text} urls={urls} type={entry.media?.type} />
        )}

        {/* Films keep the carousel: there is one clip, not a sequence to
            walk through. */}
        {entry.media?.type === "video" && urls.length > 0 && <MediaCarousel urls={urls} type={entry.media.type} />}

        {entry.references?.length > 0 && (
          <p className="j-references">
            {t.journal.referencesUsed} {entry.references.map((r) => "@" + r.tag).join(", ")}
          </p>
        )}

        {/* The first thing they wrote stays reachable, however often it is
            reworked afterwards. */}
        {entry.originalText && entry.originalText !== entry.text && (
          <div className="j-original">
            <button className="j-original-toggle" onClick={() => setShowOriginal((v) => !v)}>
              {showOriginal ? t.journal.hideOriginal : t.journal.showOriginal}
            </button>
            {showOriginal && (
              <>
                <p className="j-original-label">{t.journal.original}</p>
                <p className="j-original-text">{entry.originalText}</p>
              </>
            )}
          </div>
        )}
        </div>

        {menuOpen && (
          <EntryMenu
            canShare={urls.length > 0}
            onEdit={() => { setMenuOpen(false); setEditing(true); }}
            onRefine={runRefine}
            onShare={doShare}
            onDelete={() => { setMenuOpen(false); remove(); }}
            onClose={() => setMenuOpen(false)}
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
