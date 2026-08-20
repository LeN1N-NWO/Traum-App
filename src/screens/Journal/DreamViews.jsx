import { useState } from "react";
import { mediaUrl } from "../../lib/api.js";
import { t } from "../../i18n/index.js";

/* Die Kino-Ansicht des Traums — Antons Wahl vom 21.08. aus drei Varianten
 * („nicht runterscrollen wie eine Wurst — Bild sehen und seitlich
 * weiterswipen"): Vollbild-Panels, Text als Untertitel auf dem Bild,
 * horizontal gesnappt. Der Traum als Stories-Strecke.
 *
 * Dazu: splitPassages (Satz-Verteilung wie die alte DreamStory) und
 * CastChips (die „Wer kommt vor?"-Zeile mit echten Avatar-Fotos statt
 * einer nackten @tag-Textzeile).
 */

/** Der Text als Absätze, gleichmäßig auf n Panels verteilt — nach SÄTZEN,
 *  weil das die einzige Struktur ist, die der Text verlässlich hat. */
export function splitPassages(text, n) {
  if (n < 1) return [String(text || "")];
  const sentences = String(text || "").match(/[^.!?…]+[.!?…]*\s*/g) || [String(text || "")];
  const per = Math.ceil(sentences.length / n);
  const out = [];
  for (let i = 0; i < n; i++) {
    const part = sentences.slice(i * per, (i + 1) * per).join("").trim();
    out.push(part);
  }
  return out;
}

/* Die Besetzungszeile. Bis 20.08. war das ein Satz („References used:
 * @lena") — die App speichert aber Gesichter zu diesen Namen, und eine
 * Zeile, die sie nicht zeigt, verschenkt genau das, was die Referenzen
 * besonders macht. Avatar aus der Besetzung (oder dem eigenen Porträt)
 * per Tag; ohne Bild trägt die Kachel den Anfangsbuchstaben. */
export function CastChips({ refs = [], cast = [], me }) {
  if (!refs.length) return null;
  const lookup = (tag) => {
    if (me?.tag === tag) return me;
    return cast.find((c) => c.tag === tag) || null;
  };
  return (
    <div className="j-cast">
      <p className="j-cast-label">{t.journal.referencesUsed}</p>
      <div className="j-cast-row">
        {refs.map((r) => {
          const member = lookup(r.tag);
          const img = member?.img;
          return (
            <figure key={r.tag} className="j-cast-chip">
              {img
                ? <img className="j-cast-face" src={img} alt="" />
                : <span className="j-cast-face j-cast-initial" aria-hidden="true">{[...r.tag][0]?.toUpperCase() || "?"}</span>}
              <figcaption className="j-cast-name">@{r.tag}</figcaption>
            </figure>
          );
        })}
      </div>
    </div>
  );
}

/* Der Snap-Zeiger: welcher Kartenindex gerade im Fenster steht. Ein
 * onScroll-Rechenschritt statt IntersectionObserver — die Panels sind
 * gleich breit, also IST die Position der Index. */
function useSnapIndex() {
  const [idx, setIdx] = useState(0);
  const onScroll = (e) => {
    const el = e.currentTarget;
    const w = el.firstElementChild?.clientWidth || 1;
    setIdx(Math.round(el.scrollLeft / (w + 1e-6)));
  };
  return [idx, onScroll];
}

function Dots({ count, active }) {
  if (count < 2) return null;
  return (
    <div className="j-dots" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <span key={i} className={"j-dot" + (i === active ? " j-dot-on" : "")} />
      ))}
    </div>
  );
}

export function DeckView({ entry, film, images }) {
  const [idx, onScroll] = useSnapIndex();
  const passages = splitPassages(entry.text, images.length);
  const panels = [
    ...(film ? [{ kind: "film", src: film }] : []),
    ...images.map((u, i) => ({ kind: "image", src: u, text: passages[i] })),
  ];

  return (
    <section className="j-cine-wrap" aria-label={entry.title || t.journal.untitled}>
      <div className="j-cine" onScroll={onScroll}>
        {panels.map((p, i) => (
          <figure key={i} className="j-cine-panel">
            {p.kind === "film"
              ? <video className="j-cine-media" src={mediaUrl(p.src)} controls playsInline preload="metadata" />
              : <img className="j-cine-media" src={mediaUrl(p.src)} alt="" loading="lazy" />}
            {p.text && (
              <>
                <div className="j-cine-scrim" aria-hidden="true" />
                <figcaption className="j-cine-text">{p.text}</figcaption>
              </>
            )}
          </figure>
        ))}
      </div>
      <Dots count={panels.length} active={idx} />
    </section>
  );
}
