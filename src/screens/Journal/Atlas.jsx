import { useMemo, useState } from "react";
import ScreenHeader from "../../components/ScreenHeader.jsx";
import { useAppState } from "../../state/AppState.jsx";
import { symbolCounts, moodCounts, monthReview, realDreams } from "../../lib/atlas.js";
import { symbolById } from "../../lib/symbols.js";
import { t } from "../../i18n/index.js";
import "./journal.css";

/* Der Traumatlas — die Muster, die die App längst speichert, endlich
 * sichtbar (Mehrwert-Plan P1b): dieser Monat in vier Zahlen, die
 * wiederkehrenden Symbole (antippbar → die Träume dazu, ein Tipp öffnet
 * den Traum), die Stimmungen. Alles reine Rechnung über state.journal,
 * bei jedem Rendern frisch — kein Cache, keine Migration, kein Aufruf.
 *
 * Er wohnt im Journal neben der Besetzung, aus demselben Grund wie sie:
 * Muster ÜBER Träumen gehören neben die Träume, nicht ins Profil. */
export default function Atlas({ onBack, onOpen }) {
  const { state } = useAppState();
  const [openSymbol, setOpenSymbol] = useState(null);

  const journal = state.journal || [];
  const dreams = useMemo(() => realDreams(journal), [journal]);
  const symbols = useMemo(() => symbolCounts(journal), [journal]);
  const moods = useMemo(() => moodCounts(journal), [journal]);
  const month = useMemo(() => monthReview(journal), [journal]);
  const byId = useMemo(() => new Map(journal.map((e) => [e.id, e])), [journal]);

  return (
    <>
      <button className="j-back" onClick={onBack}><span data-flip aria-hidden="true">‹</span> {t.journal.title}</button>
      <ScreenHeader title={t.journal.atlas} subtitle={t.journal.atlasLede} />

      {dreams.length === 0 ? (
        <p className="j-empty">{t.journal.atlasEmpty}</p>
      ) : (
        <>
          {/* Der Monat zuerst: die Zusammenfassung vor dem Detail. */}
          {month.count > 0 && (
            <section className="at-month">
              <p className="j-original-label">{t.journal.atlasMonth}</p>
              <div className="at-month-row">
                <div className="at-fact">
                  <span className="at-fact-n">{month.count}</span>
                  <span className="at-fact-label">{t.journal.atlasDreamsN(month.count)}</span>
                </div>
                {month.topSymbol && (
                  <div className="at-fact">
                    <span className="at-fact-n" aria-hidden="true">{symbolById(month.topSymbol.id)?.emoji}</span>
                    <span className="at-fact-label">{symbolById(month.topSymbol.id)?.label}</span>
                  </div>
                )}
                {month.topMood && (
                  <div className="at-fact">
                    <span className="at-fact-n">✨</span>
                    <span className="at-fact-label">{month.topMood.mood}</span>
                  </div>
                )}
                {month.topCast && (
                  <div className="at-fact">
                    <span className="at-fact-n">@</span>
                    <span className="at-fact-label">{month.topCast.tag}</span>
                  </div>
                )}
              </div>
            </section>
          )}

          {symbols.length > 0 && (
            <section>
              <p className="j-original-label">{t.journal.atlasSymbols}</p>
              <div className="at-symbols">
                {symbols.slice(0, 8).map((s) => {
                  const sym = symbolById(s.id);
                  const open = openSymbol === s.id;
                  return (
                    <div key={s.id} className="at-symbol">
                      <button
                        className="at-symbol-row"
                        aria-expanded={open}
                        onClick={() => setOpenSymbol(open ? null : s.id)}
                      >
                        <span className="at-symbol-emoji" aria-hidden="true">{sym?.emoji}</span>
                        <span className="at-symbol-label">{sym?.label || s.id}</span>
                        <span className="at-symbol-count">×{s.count}</span>
                      </button>
                      {open && (
                        <div className="at-symbol-dreams">
                          {/* Die gängige Lesart aus symbols.js — dieselbe
                              Selbstbeobachtungs-Haltung wie die Symbolseite,
                              ausdrücklich keine Diagnose. */}
                          {sym?.meaning && <p className="at-symbol-meaning">{sym.meaning}</p>}
                          {s.entryIds.map((id) => {
                            const e = byId.get(id);
                            if (!e) return null;
                            return (
                              <button key={id} className="at-dream" onClick={() => onOpen(id)}>
                                <span className="at-dream-title">{e.title || t.journal.untitled}</span>
                                <span className="at-dream-date">
                                  {new Date(e.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {moods.length > 0 && (
            <section>
              <p className="j-original-label">{t.journal.atlasMoods}</p>
              <div className="at-moods">
                {moods.slice(0, 6).map((m) => (
                  <span key={m.mood} className="at-mood">
                    {m.mood} <span className="at-symbol-count">×{m.count}</span>
                  </span>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </>
  );
}
