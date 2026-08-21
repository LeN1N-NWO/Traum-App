import { useState } from "react";
import { mediaUrl } from "../lib/api.js";
import { imageIndexForBeat } from "../lib/beats.js";
import { t } from "../i18n/index.js";
import Sheet from "./Sheet.jsx";
import "./storyboard.css";

/* Der Fünf-Szenen-Bogen als Leiste — Plan
 * docs/plans/2026-08-19-storyboard-vor-dem-film.md; Stufe B seit dem
 * 21.08. (Antons Go): im Film-Schritt sind die Szenen an- und abwählbar,
 * die Auswahl ERSETZT den Automatik-Schnitt.
 *
 * Seit dem 21.08. trägt jede Kachel ihren Szenentext (Antons Befund:
 * „bei den Zahlen müsste man eigentlich sehen, worum es geht") — die
 * nackte Nummer war ein Platzhalter, der nichts erzählte, dabei liegt
 * der Text längst in der Analyse. Mit Thumbnail liegt er als Zeile
 * darüber, ohne steht er allein auf der Kachel.
 *
 * Zwei Modi, an EINER Prop unterscheidbar:
 * - ohne onToggle (Journal): Antippen öffnet das Detail-Blatt — lesen,
 *   nichts verstellen.
 * - mit onToggle (Schritt 5, Film): Antippen schaltet die Szene an/aus.
 *   Das Blatt entfällt dort bewusst: zwei Bedeutungen auf einem Tipp
 *   wären ein Ratespiel, und der Text steht ja jetzt auf der Kachel.
 *
 * Ehrlichkeitsregel unverändert: ein Thumbnail erscheint NUR, wenn die
 * Beat↔Bild-Zuordnung sicher ist (imageIndexForBeat, Poster-Wahrheit).
 *
 * @param {string[]} beats   der Bogen aus der Analyse (englisch)
 * @param {object}  [entry]  Journal-Eintrag für Thumbnails (imageCount,
 *                           media.urls, media.poster) — ohne ihn Textkacheln
 * @param {Set<number>} [active]  Beats, die in den Film kommen; ohne = alle
 * @param {function} [onToggle]   (i) => void — macht die Kacheln zu Schaltern
 */
export default function Storyboard({ beats = [], entry = null, active = null, onToggle = null }) {
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
          const on = active ? active.has(i) : true;
          const cls = "sb-tile"
            + (onToggle ? (on ? " sb-on" : " sb-off") : (on ? "" : " sb-dim"));
          return (
            <button
              key={i}
              role="listitem"
              className={cls}
              onClick={() => (onToggle ? onToggle(i) : setOpen(i))}
              aria-label={t.storyboard.scene(i + 1, beats.length)}
              {...(onToggle ? { "aria-pressed": on } : {})}
            >
              {img && <img src={img} alt="" loading="lazy" />}
              {onToggle && on && <span className="sb-check" aria-hidden="true">✓</span>}
              <span className="sb-n" aria-hidden="true">{i + 1}</span>
              <span className="sb-text">{b}</span>
            </button>
          );
        })}
      </div>

      {open != null && (
        <Sheet label={t.storyboard.scene(open + 1, beats.length)} onClose={() => setOpen(null)}>
          {imgFor(open) && <img className="sb-sheet-img" src={imgFor(open)} alt="" />}
          <p className="sb-sheet-label">{t.storyboard.scene(open + 1, beats.length)}</p>
          <p className="sb-sheet-beat">{beats[open]}</p>
          {!imgFor(open) && <p className="sb-sheet-note">{t.storyboard.textOnly}</p>}
        </Sheet>
      )}
    </>
  );
}
