import { useEffect, useRef } from "react";
import { symbolById } from "../../lib/symbols.js";
import "./symbols.css";

export default function SymbolDetail({ symbolId, vorkommen, onSchliessen }) {
  const symbol = symbolById(symbolId);
  const schliessenRef = useRef(null);

  useEffect(() => {
    schliessenRef.current?.focus();
    const beiTaste = (e) => { if (e.key === "Escape") onSchliessen(); };
    document.addEventListener("keydown", beiTaste);
    return () => document.removeEventListener("keydown", beiTaste);
  }, [onSchliessen]);

  if (!symbol) return null;

  return (
    <div className="s-modal-hinter" onClick={onSchliessen}>
      <div
        className="s-modal"
        role="dialog"
        aria-modal="true"
        aria-label={symbol.label}
        onClick={(e) => e.stopPropagation()}
      >
        <button ref={schliessenRef} className="s-schliessen" onClick={onSchliessen} aria-label="Schließen">
          ×
        </button>

        <p className="s-modal-emoji" aria-hidden="true">{symbol.emoji}</p>
        <h2 className="s-modal-titel">{symbol.label}</h2>
        <p className="s-deutung">{symbol.meaning}</p>
        <p className="s-hinweis">Eine gängige Lesart zur Selbstbeobachtung — keine Diagnose.</p>

        <h3 className="s-vorkommen-titel">
          {vorkommen.length === 1 ? "In 1 Traum" : `In ${vorkommen.length} Träumen`}
        </h3>
        <ul className="s-vorkommen">
          {vorkommen.map((v) => (
            <li key={v.entryId}>
              <span className="s-v-datum">
                {new Date(v.createdAt).toLocaleDateString("de-DE", { day: "numeric", month: "short" })}
              </span>
              <span className="s-v-titel">{v.title || "Ohne Titel"}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
