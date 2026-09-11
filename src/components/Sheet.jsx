import { useEffect, useRef } from "react";
import { t } from "../i18n/index.js";
import { useSheet } from "../lib/useSheet.js";
import "./sheet.css";

/* Das eine kleine Blatt der App: Backdrop, Karte, Schließen — extrahiert aus
 * dem Storyboard (19.08.), als das Modell-Info-Blatt dasselbe Muster
 * brauchte. Zwei Overlays mit je eigenem Backdrop-Code wären der Anfang
 * derselben Drift, die bei den Icons verboten ist („aus EINEM Satz").
 *
 * Absichtlich dumm: keine Varianten, keine Größen, kein Portal. Der Inhalt
 * gehört dem Aufrufer, das Blatt besitzt nur Öffnen-Zu-Verhalten:
 * Backdrop-Klick, Escape und Herunterziehen schließen, der Schließen-Knopf
 * ist immer da und trägt immer denselben Text.
 *
 * Seit 11.09.: ein iOS-Sheet — steigt von unten auf, sinkt beim Schließen
 * wieder ab, statt in einem Frame zu verschwinden (useSheet.js). */
export default function Sheet({ label, onClose, children }) {
  const closeRef = useRef(null);
  const sheet = useSheet(onClose);
  useEffect(() => { closeRef.current?.focus({ preventScroll: true }); }, []);

  return (
    <div className="sheet-backdrop" {...sheet.backdropProps} onClick={sheet.close}>
      <div
        className="sheet-card"
        {...sheet.panelProps}
        role="dialog" aria-modal="true" aria-label={label}
        onClick={(e) => e.stopPropagation()}
      >
        <span className="sheet-grabber" aria-hidden="true" />
        {children}
        <button ref={closeRef} className="sheet-close" onClick={sheet.close}>{t.journal.close}</button>
      </div>
    </div>
  );
}
