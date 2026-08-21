import { useEffect, useRef } from "react";
import { t } from "../i18n/index.js";
import "./LegalPage.css";

/* Die lesbare Rechtsseite hinter den Links im Consent-Gate (und im Profil).
 *
 * Ein Vollbild-Overlay, kein Sheet: die Texte sind lang, und ein Blatt, in
 * dem man zehn Abschnitte scrollt, fühlt sich nach Kleingedrucktem an — die
 * Seite soll das Gegenteil sagen. Kein Router-Eintrag, denn sie muss VOR der
 * App erreichbar sein (das Gate steht vor dem Router-Inhalt).
 *
 * `doc` ist "terms" oder "privacy"; alles Weitere kommt aus t.legal —
 * gleiche Abschnittszahl in allen Sprachen, das erzwingt der Shape-Check. */
export default function LegalPage({ doc, onClose }) {
  const closeRef = useRef(null);
  const d = t.legal[doc] || t.legal.terms;

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    /* stopPropagation: die Seite liegt manchmal IN einem Backdrop mit
       Klick-schließt-Verhalten (Profil → Einstellungen) — ohne das würde
       jeder Scroll-Klick hier die Ebene darunter zuklappen. */
    <div className="lp" role="dialog" aria-modal="true" aria-label={d.title}
         onClick={(e) => e.stopPropagation()}>
      <header className="lp-top">
        <button ref={closeRef} className="lp-close" onClick={onClose} aria-label={t.legal.close}>×</button>
        <span className="lp-toptitle">{d.title}</span>
        <span className="lp-close lp-close-ghost" aria-hidden="true" />
      </header>

      <div className="lp-scroll">
        <h1 className="lp-title">{d.title}</h1>
        <p className="lp-meta">{t.legal.updated}</p>
        <p className="lp-draft">{t.legal.draftNote}</p>

        {d.sections.map((s, i) => (
          <section key={i} className="lp-section">
            <h2 className="lp-h">{s.h}</h2>
            <p className="lp-p">{s.p}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
