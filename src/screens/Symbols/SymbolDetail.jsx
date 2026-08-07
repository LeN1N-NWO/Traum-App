import { useEffect, useRef } from "react";
import { symbolById } from "../../lib/symbols.js";
import { t } from "../../i18n/index.js";
import "./symbols.css";

export default function SymbolDetail({ symbolId, occurrences, onClose }) {
  const symbol = symbolById(symbolId);
  const closeRef = useRef(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!symbol) return null;

  return (
    <div className="s-backdrop" onClick={onClose}>
      <div
        className="s-modal"
        role="dialog"
        aria-modal="true"
        aria-label={symbol.label}
        onClick={(e) => e.stopPropagation()}
      >
        <button ref={closeRef} className="s-close" onClick={onClose} aria-label={t.symbols.close}>
          ×
        </button>

        <p className="s-modal-emoji" aria-hidden="true">{symbol.emoji}</p>
        <h2 className="s-modal-title">{symbol.label}</h2>
        <p className="s-meaning">{symbol.meaning}</p>
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
