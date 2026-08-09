import { useEffect, useRef } from "react";
import { PRICES } from "../../lib/pricing.js";
import { t } from "../../i18n/index.js";
import { IconPencil, IconSpellcheck, IconSparkle, IconBook, IconShare, IconTrash } from "../../components/icons.jsx";
import "./journal.css";

/* The full list, reached from the ⋯ button. The three rewrite modes also
   live behind "Rewrite" in the action row (RefineSheet) — this stays the
   one place that has EVERYTHING, deleting included, which is exactly why
   deleting is only here: it needs a deliberate trip, not a mis-tap.

   Icons from the shared set rather than emoji, same as everywhere else —
   emoji render at a different weight and colour on every platform, which
   is what made this menu the last screen that looked borrowed. */
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
          <span className="j-menu-label"><IconPencil />{t.journal.edit}</span>
          <span className="j-menu-free">{t.wizard.free}</span>
        </button>

        <button role="menuitem" className="j-menu-item" onClick={() => onRefine("correct")}>
          <span className="j-menu-label"><IconSpellcheck />{t.journal.correct}</span>
          <span className={PRICES.correct ? "j-menu-price" : "j-menu-free"}>{PRICES.correct || t.wizard.free}</span>
        </button>
        <button role="menuitem" className="j-menu-item" onClick={() => onRefine("rewrite")}>
          <span className="j-menu-label"><IconSparkle />{t.journal.rewrite}</span>
          <span className={PRICES.rewrite ? "j-menu-price" : "j-menu-free"}>{PRICES.rewrite || t.wizard.free}</span>
        </button>
        <button role="menuitem" className="j-menu-item" onClick={() => onRefine("elaborate")}>
          <span className="j-menu-label"><IconBook />{t.journal.elaborate}</span>
          <span className={PRICES.elaborate ? "j-menu-price" : "j-menu-free"}>{PRICES.elaborate || t.wizard.free}</span>
        </button>

        {canShare && (
          <button role="menuitem" className="j-menu-item" onClick={onShare}>
            <span className="j-menu-label"><IconShare />{t.journal.share}</span>
            <span className="j-menu-free">{t.wizard.free}</span>
          </button>
        )}

        <button role="menuitem" className="j-menu-item j-menu-danger" onClick={onDelete}>
          <span className="j-menu-label"><IconTrash />{t.journal.delete}</span>
        </button>
      </div>
    </div>
  );
}
