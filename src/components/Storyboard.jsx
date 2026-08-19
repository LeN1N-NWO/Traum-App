import { useState } from "react";
import { mediaUrl } from "../lib/api.js";
import { imageIndexForBeat } from "../lib/beats.js";
import { t } from "../i18n/index.js";
import "./storyboard.css";

/* Der Fünf-Szenen-Bogen als antippbare Leiste — Plan
 * docs/plans/2026-08-19-storyboard-vor-dem-film.md, Stufe A (nur zeigen,
 * nichts abwählen; Stufe B liegt bewusst auf Eis).
 *
 * Zwei Ehrlichkeitsregeln tragen die Komponente:
 * - Ein Thumbnail erscheint NUR, wenn die Beat↔Bild-Zuordnung sicher ist
 *   (imageIndexForBeat antwortet sonst null — Einträge von vor dem
 *   19.08. tragen keine Poster-Wahrheit, und raten hieße, das
 *   Alligator-Bild auf die Abflug-Szene zu legen). Ohne Bild steht die
 *   Szenennummer, nie ein Fragezeichen.
 * - `active` (Set von Beat-Indizes) dimmt Szenen, die bei der gewählten
 *   Filmlänge NICHT in den Film kommen — dieselbe Auswahl, die der Server
 *   trifft (beatsForSeconds), nur sichtbar gemacht. Gedimmt heißt
 *   informiert, nicht gesperrt: antippen und ansehen geht weiter.
 *
 * @param {string[]} beats   der Bogen aus der Analyse (englisch)
 * @param {object}  [entry]  Journal-Eintrag für Thumbnails (imageCount,
 *                           media.urls, media.poster) — ohne ihn Textkacheln
 * @param {Set<number>} [active]  Beats, die in den Film kommen; ohne = alle
 */
export default function Storyboard({ beats = [], entry = null, active = null }) {
  const [open, setOpen] = useState(null);
  if (!beats.length) return null;

  const urls = entry?.media?.urls || [];
  const imgFor = (i) => {
    const idx = imageIndexForBeat(i, {
      imageCount: entry?.imageCount ?? 0,
      poster: entry?.media?.poster,
      urlCount: urls.length,
    });
    return idx == null ? null : mediaUrl(urls[idx]);
  };

  return (
    <>
      <div className="sb" role="list" aria-label={t.storyboard.label}>
        {beats.map((b, i) => {
          const img = imgFor(i);
          const dimmed = active ? !active.has(i) : false;
          return (
            <button
              key={i}
              role="listitem"
              className={"sb-tile" + (dimmed ? " sb-dim" : "")}
              onClick={() => setOpen(i)}
              aria-label={t.storyboard.scene(i + 1, beats.length)}
            >
              {img ? <img src={img} alt="" loading="lazy" /> : <span className="sb-tile-n" aria-hidden="true">{i + 1}</span>}
            </button>
          );
        })}
      </div>

      {open != null && (
        <div className="sb-backdrop" onClick={() => setOpen(null)}>
          <div
            className="sb-sheet"
            role="dialog"
            aria-modal="true"
            aria-label={t.storyboard.scene(open + 1, beats.length)}
            onClick={(e) => e.stopPropagation()}
          >
            {imgFor(open) && <img className="sb-sheet-img" src={imgFor(open)} alt="" />}
            <p className="sb-sheet-label">{t.storyboard.scene(open + 1, beats.length)}</p>
            <p className="sb-sheet-beat">{beats[open]}</p>
            {!imgFor(open) && <p className="sb-sheet-note">{t.storyboard.textOnly}</p>}
            <button className="sb-sheet-close" onClick={() => setOpen(null)}>{t.journal.close}</button>
          </div>
        </div>
      )}
    </>
  );
}
