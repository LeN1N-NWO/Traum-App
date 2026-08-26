import { useState } from "react";
import { mediaUrl } from "../lib/api.js";
import { imageIndexForBeat, beatKeyword } from "../lib/beats.js";
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
 * @param {function} [onRenderScene] (i) => void — leere Szene nachfüllen
 * @param {function} [onEditBeat] (i, text) => void — Wortlaut der Szene
 *                   ändern; der Aufrufer speichert ihn AM TRAUM, damit
 *                   Storyboard, Film und Bildauftrag dieselbe Fassung lesen
 * @param {number[]} [indices]  Quell-Indizes der gezeigten Beats, wenn
 *                   `beats` ein AUSSCHNITT der Analyse ist (Journal zeigt
 *                   seit dem 25.08. nur die Szenen, die auch Bilder werden —
 *                   Antons Befund: „es gibt jetzt nur noch vier, nicht mehr
 *                   fünf"). Alles, was in Traum-Daten zeigt — sceneImages,
 *                   sceneJobs, die Beat↔Bild-Zuordnung, die Rückrufe — läuft
 *                   über diese Abbildung; die ANZEIGE zählt weiter 1..n.
 *                   Ohne `indices`: Identität, nichts ändert sich.
 */
export default function Storyboard({
  beats = [], entry = null, active = null,
  onToggle = null, onRenderScene = null, onEditBeat = null,
  indices = null,
}) {
  const [open, setOpen] = useState(null);
  const [draft, setDraft] = useState(null);   // null = nur lesen
  if (!beats.length) return null;

  const urls = entry?.media?.urls || [];
  const srcOf = (i) => (indices ? indices[i] : i);
  const imgFor = (i) => {
    /* Nachgelieferte Einzelbilder (leere Kachel → „Bild erzeugen") gehen
       vor: sie wurden GENAU für diese Szene gemacht, die Sequenz-Zuordnung
       ist nur abgeleitet. */
    const scene = entry?.sceneImages?.[srcOf(i)];
    if (scene) return mediaUrl(scene);
    const idx = imageIndexForBeat(srcOf(i), {
      imageCount: entry?.imageCount ?? 0,
      poster: entry?.media?.poster,
      urlCount: urls.length,
    });
    return idx == null ? null : mediaUrl(urls[idx]);
  };
  // Szenen, deren Einzelbild gerade entsteht (Collector holt es ab).
  const cooking = new Set((entry?.sceneJobs || []).map((j) => j.beat));

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
              {/* Variante A (Antons Wahl 22.08.): ohne Bild trägt die
                  Kachel ein STICHWORT, keinen halben Satz — der ganze
                  Satz wartet im Blatt. Mit Bild erzählt das Bild. */}
              {!img && <span className="sb-text">{beatKeyword(b)}</span>}
              {cooking.has(srcOf(i)) && <span className="sb-cooking-dot" aria-hidden="true" />}
            </button>
          );
        })}
      </div>

      {open != null && (
        <Sheet
          label={t.storyboard.scene(open + 1, beats.length)}
          onClose={() => { setOpen(null); setDraft(null); }}
        >
          {imgFor(open) && <img className="sb-sheet-img" src={imgFor(open)} alt="" />}
          <p className="sb-sheet-label">{t.storyboard.scene(open + 1, beats.length)}</p>

          {/* Der Wortlaut, anpassbar vor dem Erzeugen (Antons Wunsch 22.08.).
              Gespeichert wird am TRAUM, nicht am Bildauftrag: Die Szenen sind
              der Bogen, aus dem später auch der Film schneidet — zwei
              Wahrheiten nebeneinander wären genau das Problem, das er
              vermeiden wollte. Die Anzahl der Szenen bleibt unberührt. */}
          {draft == null ? (
            <>
              <p className="sb-sheet-beat">{beats[open]}</p>
              {onEditBeat && (
                <button className="sb-sheet-edit" onClick={() => setDraft(beats[open])}>
                  <span aria-hidden="true">✎</span> {t.storyboard.editBeat}
                </button>
              )}
            </>
          ) : (
            <div className="sb-sheet-editor">
              <textarea
                className="sb-sheet-area"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={3}
                autoFocus
                aria-label={t.storyboard.editBeat}
              />
              <p className="sb-sheet-hint">{t.storyboard.editHint}</p>
              <div className="sb-sheet-editrow">
                <button className="sb-sheet-ghost" onClick={() => setDraft(null)}>
                  {t.storyboard.editCancel}
                </button>
                <button
                  className="sb-sheet-fill"
                  disabled={!draft.trim() || draft.trim() === beats[open]}
                  onClick={() => { onEditBeat(srcOf(open), draft.trim()); setDraft(null); }}
                >
                  {t.storyboard.editSave}
                </button>
              </div>
            </div>
          )}
          {/* Leere Szene: nachfüllen lassen (Antons Go 21.08.) — 1 Credit,
              läuft als Hintergrund-Auftrag, der Collector meldet sich.
              Während des Bearbeitens verschwindet der Knopf: Erst der
              Wortlaut, dann das Bild — sonst zahlt jemand für den Text,
              den er gerade verwirft. */}
          {draft == null && !imgFor(open) && cooking.has(srcOf(open)) && (
            <p className="sb-sheet-note">{t.storyboard.scenePending}</p>
          )}
          {draft == null && !imgFor(open) && !cooking.has(srcOf(open)) && onRenderScene && (
            <button
              className="sb-sheet-fill"
              onClick={() => { onRenderScene(srcOf(open)); setOpen(null); }}
            >
              {t.storyboard.fillScene} · 1 {t.wizard.creditsN(1)}
            </button>
          )}
          {draft == null && !imgFor(open) && !cooking.has(srcOf(open)) && !onRenderScene && (
            <p className="sb-sheet-note">{t.storyboard.textOnly}</p>
          )}
        </Sheet>
      )}
    </>
  );
}
