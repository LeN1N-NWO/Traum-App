import { useMemo, useState } from "react";
import ScreenHeader from "../../components/ScreenHeader.jsx";
import { useAppState } from "../../state/AppState.jsx";
import { symbolCounts, moodCounts, monthReview, realDreams } from "../../lib/atlas.js";
import { sleepAverage, sleepNights, sleepByMood } from "../../lib/checkin.js";
import SymbolIcon from "../../components/symbolIcons.jsx";
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

  /* Der Schlaf (Mehrwert-Plan P2a): die Antworten auf die Morgenfrage,
     hier zu Ende gerechnet. Der Check-in fragt bewusst nur EINS ab — die
     Stimmung liefert die Analyse, deshalb entsteht die Korrelation unten
     ohne eine zweite Frage. */
  const checkins = state.checkins || [];
  const sleepAvg = useMemo(() => sleepAverage(checkins), [checkins]);
  const nights = useMemo(() => sleepNights(checkins), [checkins]);
  const byMood = useMemo(() => sleepByMood(checkins, journal), [checkins, journal]);

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
                    <SymbolIcon id={month.topSymbol.id} className="at-fact-n" />
                    <span className="at-fact-label">{t.symbols.byId[month.topSymbol.id]?.label}</span>
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

          {/* Der Schlaf direkt unter dem Monat: beides sind Zusammenfassungen,
              die Listen kommen danach. Ohne eine einzige Antwort steht hier
              nur der Weg zur Frage — eine leere Kachel zu verstecken macht
              das Feature unauffindbar. */}
          <section className="at-sleep">
            <p className="j-original-label">{t.journal.atlasSleep}</p>
            {sleepAvg == null ? (
              <p className="at-sleep-empty">{t.journal.atlasSleepEmpty}</p>
            ) : (
              <>
                <div className="at-sleep-head">
                  <span className="at-sleep-moon" aria-hidden="true">{t.checkin.emoji[Math.round(sleepAvg)]}</span>
                  <div className="at-fact">
                    <span className="at-fact-n">{t.journal.atlasSleepAvg(t.checkin.levels[Math.round(sleepAvg)])}</span>
                    {/* Die Anzahl steht bewusst daneben: Ein Schnitt aus zwei
                        Nächten sieht sonst so sicher aus wie einer aus dreißig. */}
                    <span className="at-fact-label">{t.journal.atlasSleepNote(nights, sleepAvg)}</span>
                  </div>
                </div>
                {byMood.length > 0 && (
                  <div className="at-sleep-rows">
                    {byMood.map((row) => (
                      <div key={row.sleep} className="at-sleep-row">
                        <span className="at-sleep-row-moon" aria-hidden="true">{t.checkin.emoji[row.sleep]}</span>
                        <span className="at-sleep-row-level">{t.checkin.levels[row.sleep]}</span>
                        <span className="at-sleep-row-moods">
                          {row.moods.slice(0, 3).map((m) => m.mood).join(" · ")}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </section>

          {symbols.length > 0 && (
            <section>
              <p className="j-original-label">{t.journal.atlasSymbols}</p>
              <div className="at-symbols">
                {/* Sechs statt allem: der Atlas zeigt die Spitze, nicht das
                    Inventar — Antons Rückmeldung vom 21.08. („wirkt
                    überladen"). Der Rest bleibt über die Symbolseite im
                    Sleep-Tab erreichbar. */}
                {symbols.slice(0, 6).map((s) => {
                  const open = openSymbol === s.id;
                  return (
                    <div key={s.id} className="at-symbol">
                      <button
                        className="at-symbol-row"
                        aria-expanded={open}
                        onClick={() => setOpenSymbol(open ? null : s.id)}
                      >
                        <SymbolIcon id={s.id} className="at-symbol-emoji" />
                        <span className="at-symbol-label">{t.symbols.byId[s.id]?.label || s.id}</span>
                        <span className="at-symbol-count">×{s.count}</span>
                      </button>
                      {open && (
                        <div className="at-symbol-dreams">
                          {/* Die gängige Lesart — dieselbe Selbstbeobachtungs-
                              Haltung wie die Symbolseite, keine Diagnose. */}
                          {t.symbols.byId[s.id]?.meaning && (
                            <p className="at-symbol-meaning">{t.symbols.byId[s.id].meaning}</p>
                          )}
                          {s.entryIds.slice(0, 4).map((id) => {
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
