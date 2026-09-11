import { useEffect, useRef } from "react";
import { symbolById } from "../../lib/symbols.js";
import SymbolIcon from "../../components/symbolIcons.jsx";
import { t } from "../../i18n/index.js";
import { useSheet } from "../../lib/useSheet.js";
import "./symbols.css";

export default function SymbolDetail({ symbolId, occurrences, onClose }) {
  const symbol = symbolById(symbolId);
  const closeRef = useRef(null);
  // Name und Lesart aus den Sprachdateien; symbols.js bleibt der Fallback.
  const label = t.symbols.byId[symbolId]?.label || symbol?.label;
  const meaning = t.symbols.byId[symbolId]?.meaning || symbol?.meaning;

  const sheet = useSheet(onClose);
  useEffect(() => { closeRef.current?.focus({ preventScroll: true }); }, []);

  if (!symbol) return null;

  return (
    <div className="s-backdrop" {...sheet.backdropProps} onClick={sheet.close}>
      <div
        className="s-modal"
        {...sheet.panelProps}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        onClick={(e) => e.stopPropagation()}
      >
        <span className="sheet-grabber sheet-grabber-over" aria-hidden="true" />
        <button ref={closeRef} className="s-close" onClick={sheet.close} aria-label={t.symbols.close}>
          ×
        </button>

        <SymbolIcon id={symbolId} className="s-modal-icon" />
        <h2 className="s-modal-title">{label}</h2>
        <p className="s-meaning">{meaning}</p>
        <p className="s-disclaimer">{t.symbols.disclaimer}</p>

        <h3 className="s-occ-title">{t.symbols.occurrences(occurrences.length)}</h3>
        <ul className="s-occ">
          {occurrences.map((o) => (
            <li key={o.entryId}>
              <span className="s-occ-date">
                {new Date(o.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
              </span>
              <span className="s-occ-title-text">{o.title || t.symbols.untitled}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
