import { useMemo } from "react";
import { useAppState } from "../../state/AppState.jsx";
import { castByCategory, initialOf } from "../../lib/castStats.js";
import { t } from "../../i18n/index.js";

/* Eine Gattung der Besetzung als Rollenliste — Name links, Häufigkeit rechts,
 * Haarlinie dazwischen. Die Form ist der Abspann eines Films, und das ist
 * kein Zitat um seiner selbst willen: Ein Abspann muss viele Namen in wenig
 * Höhe lesbar halten, und genau das ist hier das Problem. Nach einem Jahr hat
 * jemand vierzig Figuren, nicht acht.
 *
 * Was diese Ansicht vom alten Kachelraster unterscheidet, ist nicht die Form,
 * sondern die **Reihenfolge**: sortiert nach Häufigkeit statt nach
 * Anlagedatum. Damit sagt die Liste selbst etwas aus — wer oben steht, taucht
 * in den Nächten am häufigsten auf. Die Zahl lag von Anfang an im Zustand und
 * wurde nirgends gezeigt (siehe castStats.js).
 *
 * Eine leere Gattung bekommt keine Überschrift: Drei Wörter über nichts
 * sehen aus wie ein Ladefehler. Angelegt wird über den einen Knopf unten,
 * nicht über drei verstreute Kacheln.
 */
export default function CastGroup({ category, label, onEdit }) {
  const { state } = useAppState();
  /* Memoisiert, weil castByCategory für die Auftritts-Zählung das GANZE
     Journal durchsucht — und dieses Bauteil dreimal montiert ist (Person,
     Tier, Ort). Ohne Memo: drei volle Journal-Läufe bei jedem Re-Render
     des Providers, auch wenn sich nur ein Toast geändert hat. */
  const rows = useMemo(
    () => castByCategory(state.cast, state.journal, category),
    [state.cast, state.journal, category],
  );
  if (!rows.length) return null;

  return (
    <section className="cl-group">
      <h2 className="cl-label">{label}</h2>
      {rows.map((entry) => (
        <button key={entry.id} className="cl-row" onClick={() => onEdit(entry)}>
          {entry.img ? (
            <img className="cl-face" src={entry.img} alt="" loading="lazy" />
          ) : (
            /* Vorher stand hier ein Fragezeichen — das liest sich als
               „kaputt". Der Anfangsbuchstabe sagt dasselbe und behauptet
               nichts Schlechtes: unfertig, nicht defekt. */
            <span className="cl-face cl-initial" aria-hidden="true">{initialOf(entry.tag)}</span>
          )}

          <span className="cl-name">{entry.tag}</span>

          <span className="cl-count">
            {entry.count > 0 ? (
              <>
                <b>{entry.count}</b> {t.journal.castDreamsN(entry.count)}
              </>
            ) : (
              <em className="cl-never">{t.journal.castNever}</em>
            )}
          </span>
        </button>
      ))}
    </section>
  );
}
