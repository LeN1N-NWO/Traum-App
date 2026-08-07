import { useEffect, useRef, useState } from "react";
import Button from "../../components/Button.jsx";
import { useAppState } from "../../state/AppState.jsx";
import { refine } from "../../lib/api.js";
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

  return (
    <div className="j-backdrop" onClick={onClose}>
      <div
        className="j-modal"
        role="dialog"
        aria-modal="true"
        aria-label={entry.title || t.journal.untitled}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="j-modal-tools">
          <button className="j-close" onClick={() => setMenuOpen(true)} aria-label={t.journal.menu}>⋯</button>
          <button ref={closeRef} className="j-close" onClick={onClose} aria-label={t.journal.close}>×</button>
        </div>

        <p className="j-modal-date">
          {d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
        </p>
        <h2 className="j-modal-title">{entry.title || t.journal.untitled}</h2>

        {urls.length > 0 && (
          <MediaCarousel urls={urls} type={entry.media.type} />
        )}

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
          <p className="j-modal-text">{entry.text}</p>
        )}

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
