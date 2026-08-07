import { useMemo, useState } from "react";
import { useAppState } from "../../state/AppState.jsx";
import { SYMBOLS, SYMBOL_CATEGORIES, symbolOccurrences } from "../../lib/symbols.js";
import ScreenHeader from "../../components/ScreenHeader.jsx";
import Card from "../../components/Card.jsx";
import SymbolDetail from "./SymbolDetail.jsx";
import "./symbols.css";

export default function SymbolsScreen() {
  const { state } = useAppState();
  const [offenId, setOffenId] = useState(null);

  // Vorkommen werden bei jedem Rendern neu berechnet, nicht gespeichert: ein
  // später ergänztes Symbol reichert dadurch auch alte Träume rückwirkend an.
  const vorkommen = useMemo(() => symbolOccurrences(state.journal), [state.journal]);

  const nachKategorie = Object.entries(SYMBOL_CATEGORIES)
    .map(([key, kat]) => ({
      key, ...kat,
      symbole: SYMBOLS.filter((s) => s.category === key && vorkommen.has(s.id)),
    }))
    .filter((g) => g.symbole.length > 0);

  return (
    <main className="screen">
      <ScreenHeader titel="Symbole" unterzeile="Wiederkehrende Motive aus deinen Träumen" />

      {nachKategorie.length === 0 ? (
        <p className="s-leer">
          Noch keine Symbole gefunden. Schreib ein paar Träume auf — die
          Erkennung arbeitet mit englischen Stichwörtern.
        </p>
      ) : (
        nachKategorie.map((g) => (
          <section key={g.key} className="s-gruppe">
            <h2 className="s-gruppe-titel">
              <span aria-hidden="true">{g.emoji}</span> {g.label}
            </h2>
            <div className="s-raster">
              {g.symbole.map((s) => (
                <Card as="button" key={s.id} className="s-kachel" onClick={() => setOffenId(s.id)}>
                  <span className="s-emoji" aria-hidden="true">{s.emoji}</span>
                  <span className="s-label">{s.label}</span>
                  <span className="s-anzahl">{vorkommen.get(s.id).length}×</span>
                </Card>
              ))}
            </div>
          </section>
        ))
      )}

      {offenId && (
        <SymbolDetail
          symbolId={offenId}
          vorkommen={vorkommen.get(offenId) || []}
          onSchliessen={() => setOffenId(null)}
        />
      )}
    </main>
  );
}
