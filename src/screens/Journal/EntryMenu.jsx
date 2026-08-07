import { useEffect, useRef } from "react";
import { PRICES } from "../../lib/pricing.js";
import { t } from "../../i18n/index.js";
import "./journal.css";

/* A menu rather than a row of buttons: there are already eight actions here
   and they would not fit side by side on a phone. */
export default function EntryMenu({ onEdit, onRefine, onShare, onDelete, onClose, canShare }) {
  const firstRef = useRef(null);

  useEffect(() => {
    firstRef.current?.focus();
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="j-menu-backdrop" onClick={onClose}>
      <div className="j-menu" role="menu" aria-label={t.journal.menu} onClick={(e) => e.stopPropagation()}>
        <button ref={firstRef} role="menuitem" className="j-menu-item" onClick={onEdit}>
          <span>✏️ {t.journal.edit}</span>
          <span className="j-menu-free">{t.wizard.free}</span>
        </button>

        <button role="menuitem" className="j-menu-item" onClick={() => onRefine("correct")}>
          <span>🔤 {t.journal.correct}</span>
          <span className="j-menu-price">{PRICES.correct}</span>
        </button>
        <button role="menuitem" className="j-menu-item" onClick={() => onRefine("rewrite")}>
          <span>✨ {t.journal.rewrite}</span>
          <span className="j-menu-price">{PRICES.rewrite}</span>
        </button>
        <button role="menuitem" className="j-menu-item" onClick={() => onRefine("elaborate")}>
          <span>📖 {t.journal.elaborate}</span>
          <span className="j-menu-price">{PRICES.elaborate}</span>
        </button>

        {canShare && (
          <button role="menuitem" className="j-menu-item" onClick={onShare}>
            <span>📤 {t.journal.share}</span>
            <span className="j-menu-free">{t.wizard.free}</span>
          </button>
        )}

        <button role="menuitem" className="j-menu-item j-menu-danger" onClick={onDelete}>
          <span>🗑 {t.journal.delete}</span>
        </button>
      </div>
    </div>
  );
}
