import { useEffect, useRef } from "react";
import { t } from "../../i18n/index.js";
import { IconPencil, IconSpellcheck, IconSparkle, IconBook, IconShare, IconTrash, IconHistory } from "../../components/icons.jsx";
import { useSheet } from "../../lib/useSheet.js";
import "./journal.css";

/* The full list, reached from the ⋯ button. The three rewrite modes also
   live behind "Rewrite" in the action row (RefineSheet) — this stays the
   one place that has EVERYTHING, deleting included, which is exactly why
   deleting is only here: it needs a deliberate trip, not a mis-tap.

   Icons from the shared set rather than emoji, same as everywhere else —
   emoji render at a different weight and colour on every platform, which
   is what made this menu the last screen that looked borrowed. */
/* Keine „Gratis"-Schilder mehr (Antons Frage 21.08.: „Müsst ihr
   überhaupt gratis hinschreiben?"): In einem Menü, in dem ALLES gratis
   ist, ist das Schild Rauschen — gratis wirkt nur neben Bezahltem.
   Kommt je ein bezahlter Punkt hierher, bekommt NUR er ein Preisschild. */
export default function EntryMenu({ onEdit, onRefine, onShare, onDelete, onClose, canShare, onOriginal }) {
  const firstRef = useRef(null);

  const sheet = useSheet(onClose);
  useEffect(() => { firstRef.current?.focus({ preventScroll: true }); }, []);

  return (
    <div className="j-menu-backdrop" {...sheet.backdropProps} onClick={sheet.close}>
      <div className="j-menu" {...sheet.panelProps} role="menu" aria-label={t.journal.menu} onClick={(e) => e.stopPropagation()}>
        <span className="sheet-grabber" aria-hidden="true" />
        <button ref={firstRef} role="menuitem" className="j-menu-item" onClick={() => sheet.close(onEdit)}>
          <span className="j-menu-label"><IconPencil />{t.journal.edit}</span>
        </button>

        <button role="menuitem" className="j-menu-item" onClick={() => sheet.close(() => onRefine("correct"))}>
          <span className="j-menu-label"><IconSpellcheck />{t.journal.correct}</span>
        </button>
        <button role="menuitem" className="j-menu-item" onClick={() => sheet.close(() => onRefine("rewrite"))}>
          <span className="j-menu-label"><IconSparkle />{t.journal.rewrite}</span>
        </button>
        <button role="menuitem" className="j-menu-item" onClick={() => sheet.close(() => onRefine("elaborate"))}>
          <span className="j-menu-label"><IconBook />{t.journal.elaborate}</span>
        </button>

        {/* Der erste Wortlaut, jederzeit nachlesbar — hierher verschoben,
            weil der Link unten am Eintrag „verloren angeheftet" wirkte
            (Antons Befund 21.08.). Erscheint nur, wenn es überhaupt ein
            abweichendes Original gibt. */}
        {onOriginal && (
          <button role="menuitem" className="j-menu-item" onClick={() => sheet.close(onOriginal)}>
            <span className="j-menu-label"><IconHistory />{t.journal.showOriginal}</span>
          </button>
        )}

        {/* Teilen bleibt direkt: navigator.share braucht die Nutzeraktivierung
            des Tippens, und der Umweg über die Ausblende-Animation kann sie
            kosten. */}
        {canShare && (
          <button role="menuitem" className="j-menu-item" onClick={onShare}>
            <span className="j-menu-label"><IconShare />{t.journal.share}</span>
          </button>
        )}

        <button role="menuitem" className="j-menu-item j-menu-danger" onClick={() => sheet.close(onDelete)}>
          <span className="j-menu-label"><IconTrash />{t.journal.delete}</span>
        </button>
      </div>
    </div>
  );
}
