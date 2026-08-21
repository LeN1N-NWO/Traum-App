import { useMemo, useState } from "react";
import { useAppState } from "../../state/AppState.jsx";
import { SYMBOLS, SYMBOL_CATEGORIES, symbolOccurrences } from "../../lib/symbols.js";
import { t } from "../../i18n/index.js";
import ScreenHeader from "../../components/ScreenHeader.jsx";
import Card from "../../components/Card.jsx";
import SymbolDetail from "./SymbolDetail.jsx";
import "./symbols.css";

/* `embedded` drops the screen chrome so the Sleep tab can host this as one of
   its sections — symbols are dream knowledge, and that is where the free
   content lives. Still a whole screen component, not a fragment: the detail
   modal and the occurrence lookup belong together. */
export default function SymbolsScreen({ embedded = false }) {
  const { state } = useAppState();
  const [openId, setOpenId] = useState(null);

  // Recomputed on every render rather than stored: a symbol added later then
  // enriches old dreams retroactively, with no migration.
  const occurrences = useMemo(() => symbolOccurrences(state.journal), [state.journal]);

  /* Namen und Lesarten kommen seit 21.08. aus den Sprachdateien
     (t.symbols.byId/categories) — symbols.js behält nur die englischen
     Stichwortlisten und Fallbacks. Vorher stand der Atlas in einer
     deutschen App voller englischer Symbolnamen. */
  const groups = Object.entries(SYMBOL_CATEGORIES)
    .map(([key, cat]) => ({
      key, ...cat,
      label: t.symbols.categories[key] || cat.label,
      symbols: SYMBOLS.filter((s) => s.category === key && occurrences.has(s.id)),
    }))
    .filter((g) => g.symbols.length > 0);

  const Wrap = embedded ? "div" : "main";

  return (
    <Wrap className={embedded ? "" : "screen"}>
      {!embedded && <ScreenHeader title={t.symbols.title} subtitle={t.symbols.subtitle} />}

      {groups.length === 0 ? (
        <p className="s-empty">{t.symbols.empty}</p>
      ) : (
        groups.map((g) => (
          <section key={g.key} className="s-group">
            <h2 className="s-group-title">
              <span aria-hidden="true">{g.emoji}</span> {g.label}
            </h2>
            <div className="s-grid">
              {g.symbols.map((s) => (
                <Card as="button" key={s.id} className="s-tile" onClick={() => setOpenId(s.id)}>
                  <span className="s-emoji" aria-hidden="true">{s.emoji}</span>
                  <span className="s-label">{t.symbols.byId[s.id]?.label || s.label}</span>
                  <span className="s-count">{occurrences.get(s.id).length}×</span>
                </Card>
              ))}
            </div>
          </section>
        ))
      )}

      {openId && (
        <SymbolDetail
          symbolId={openId}
          occurrences={occurrences.get(openId) || []}
          onClose={() => setOpenId(null)}
        />
      )}
    </Wrap>
  );
}
