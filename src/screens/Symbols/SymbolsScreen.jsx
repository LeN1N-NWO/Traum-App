import { useMemo, useState } from "react";
import { useAppState } from "../../state/AppState.jsx";
import { SYMBOLS, SYMBOL_CATEGORIES, symbolOccurrences } from "../../lib/symbols.js";
import { t } from "../../i18n/index.js";
import ScreenHeader from "../../components/ScreenHeader.jsx";
import Card from "../../components/Card.jsx";
import SymbolDetail from "./SymbolDetail.jsx";
import "./symbols.css";

export default function SymbolsScreen() {
  const { state } = useAppState();
  const [openId, setOpenId] = useState(null);

  // Recomputed on every render rather than stored: a symbol added later then
  // enriches old dreams retroactively, with no migration.
  const occurrences = useMemo(() => symbolOccurrences(state.journal), [state.journal]);

  const groups = Object.entries(SYMBOL_CATEGORIES)
    .map(([key, cat]) => ({
      key, ...cat,
      symbols: SYMBOLS.filter((s) => s.category === key && occurrences.has(s.id)),
    }))
    .filter((g) => g.symbols.length > 0);

  return (
    <main className="screen">
      <ScreenHeader title={t.symbols.title} subtitle={t.symbols.subtitle} />

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
                  <span className="s-label">{s.label}</span>
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
    </main>
  );
}
