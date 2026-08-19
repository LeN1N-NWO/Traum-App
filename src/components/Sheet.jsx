import { useEffect, useRef } from "react";
import { t } from "../i18n/index.js";
import "./sheet.css";

/* Das eine kleine Blatt der App: Backdrop, Karte, Schließen — extrahiert aus
 * dem Storyboard (19.08.), als das Modell-Info-Blatt dasselbe Muster
 * brauchte. Zwei Overlays mit je eigenem Backdrop-Code wären der Anfang
 * derselben Drift, die bei den Icons verboten ist („aus EINEM Satz").
 *
 * Absichtlich dumm: keine Varianten, keine Größen, kein Portal. Der Inhalt
 * gehört dem Aufrufer, das Blatt besitzt nur Öffnen-Zu-Verhalten:
 * Backdrop-Klick und Escape schließen, der Schließen-Knopf ist immer da
 * und trägt immer denselben Text. */
export default function Sheet({ label, onClose, children }) {
  const closeRef = useRef(null);
  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet-card" role="dialog" aria-modal="true" aria-label={label} onClick={(e) => e.stopPropagation()}>
        {children}
        <button ref={closeRef} className="sheet-close" onClick={onClose}>{t.journal.close}</button>
      </div>
    </div>
  );
}
