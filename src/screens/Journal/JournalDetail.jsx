import { useEffect, useRef } from "react";
import Button from "../../components/Button.jsx";
import { useAppState } from "../../state/AppState.jsx";
import { t } from "../../i18n/index.js";
import "./journal.css";

export default function JournalDetail({ entry, onClose }) {
  const { state, update, toast } = useAppState();
  const closeRef = useRef(null);

  // Pull focus into the dialog and wire Escape — otherwise the keyboard stays
  // stuck behind the modal.
  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  function remove() {
    update({ journal: state.journal.filter((e) => e.id !== entry.id) });
    toast(t.journal.deleted);
    onClose();
  }

  const d = new Date(entry.createdAt);
  return (
    <div className="j-backdrop" onClick={onClose}>
      <div
        className="j-modal"
        role="dialog"
        aria-modal="true"
        aria-label={entry.title || t.journal.untitled}
        onClick={(e) => e.stopPropagation()}
      >
        <button ref={closeRef} className="j-close" onClick={onClose} aria-label={t.journal.close}>
          ×
        </button>

        <p className="j-modal-date">
          {d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
        </p>
        <h2 className="j-modal-title">{entry.title || t.journal.untitled}</h2>

        {entry.media?.urls?.length > 0 && (
          <div className="j-media">
            {entry.media.type === "video"
              ? <video src={entry.media.urls[0]} controls playsInline />
              : entry.media.urls.map((u, i) => <img key={i} src={u} alt="" loading="lazy" />)}
          </div>
        )}

        <p className="j-modal-text">{entry.text}</p>

        {entry.references?.length > 0 && (
          <p className="j-references">
            {t.journal.referencesUsed} {entry.references.map((r) => "@" + r.tag).join(", ")}
          </p>
        )}

        <Button variant="quiet" onClick={remove}>{t.journal.delete}</Button>
      </div>
    </div>
  );
}
