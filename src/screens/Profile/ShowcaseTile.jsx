import { useEffect, useRef, useState } from "react";
import { GlyphImages, GlyphFilm } from "./ShowcaseGlyph.jsx";

/* Eine der beiden Kacheln im Kaufblatt: eine Fläche, auf der die Ware läuft,
 * mit der Zahl als Bildunterschrift.
 *
 * Drei Dinge, die hier nicht offensichtlich sind:
 *
 * 1. **Jede URL kann ins Leere zeigen.** Die lokalen Kopien unter /media/
 *    gehören dem Gerät und können fehlen — gelöscht, nie erzeugt, oder das
 *    Tagebuch stammt aus einem anderen Install. Am 16.08. ist genau das
 *    passiert: ein Ordner weg, alle Verweise tot. Eine Kaufseite mit einem
 *    kaputten Bild ist schlimmer als eine ohne Bild, deshalb fliegt hier
 *    jede URL raus, die sich nicht laden lässt.
 *
 *    Und dann greift `backup`, nicht sofort der Glyph: Seed-Bilder bzw. der
 *    Dummy-Film liegen im Auslieferungsstand und können gar nicht fehlen.
 *    Ohne diese Stufe wäre die Kaufseite eines langjährigen Nutzers karger
 *    als die eines neuen — ausgerechnet WEIL er viel geträumt hat.
 *
 * 2. **Reduzierte Bewegung heißt hier wirklich keine Bewegung.** Nicht
 *    langsamer, nicht dezenter. Dieses Blatt geht in einer Traum-App oft
 *    nachts um drei auf; wer Bewegung abgestellt hat, meint es ernst.
 *
 * 3. **Die Überblendung liegt in CSS, nicht hier.** Der Zustand ist nur ein
 *    Index; welches Bild wie lange sichtbar ist und wie es zoomt, steht in
 *    paywall.css. Sonst müsste jede Änderung am Rhythmus durch JavaScript.
 */

const STILL_MS = 3400;

const reducedMotion = () =>
  typeof matchMedia === "function" &&
  matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * @param {object} props
 * @param {"stills"|"film"} props.kind
 * @param {string[]} props.urls   Was gezeigt wird, Neuestes zuerst
 * @param {string[]} [props.backup]  Greift erst, wenn von `urls` nichts lädt
 * @param {number} props.count    Die grosse Zahl
 * @param {string} props.label    Ihr Wort, schon in der richtigen Mehrzahl
 */
export default function ShowcaseTile({ kind, urls, backup = [], count, label }) {
  const [broken, setBroken] = useState([]);
  const [at, setAt] = useState(0);
  const videoRef = useRef(null);

  const ok = (list) => list.filter((u) => !broken.includes(u));
  const live = ok(urls).length ? ok(urls) : ok(backup);
  const still = kind === "stills";

  /* Der Reihum-Takt der Standbilder. Filme brauchen ihn nicht: sie sagen
     selbst Bescheid, wenn sie zu Ende sind (onEnded). */
  useEffect(() => {
    if (!still || live.length < 2 || reducedMotion()) return;
    const id = setInterval(() => setAt((i) => (i + 1) % live.length), STILL_MS);
    return () => clearInterval(id);
  }, [still, live.length]);

  /* Fällt ein Bild weg, kann der Index hinter dem Ende liegen. */
  useEffect(() => {
    if (at >= live.length) setAt(0);
  }, [at, live.length]);

  const fail = (url) => setBroken((b) => (b.includes(url) ? b : [...b, url]));

  const Glyph = still ? GlyphImages : GlyphFilm;

  return (
    <div className={"pw-tile pw-tile-" + kind}>
      {live.length === 0 ? (
        <div className="pw-tile-glyph"><Glyph /></div>
      ) : still ? (
        <div className="pw-tile-stack">
          {live.map((url, i) => (
            <img
              key={url}
              src={url}
              alt=""
              className={i === at ? "is-on" : ""}
              onError={() => fail(url)}
            />
          ))}
        </div>
      ) : (
        <video
          ref={videoRef}
          className="pw-tile-video"
          src={live[Math.min(at, live.length - 1)]}
          autoPlay={!reducedMotion()}
          muted
          playsInline
          /* Ein einzelner Film läuft in sich; mehrere reichen weiter. */
          loop={live.length === 1}
          onEnded={() => live.length > 1 && setAt((i) => (i + 1) % live.length)}
          onError={() => fail(live[Math.min(at, live.length - 1)])}
        />
      )}

      <div className="pw-tile-scrim" aria-hidden="true" />
      <div className="pw-tile-pin" aria-hidden="true"><Glyph size={15} /></div>
      <div className="pw-tile-meta">
        <span className="pw-tile-num">{count}</span>
        <span className="pw-tile-lab">{label}</span>
      </div>
    </div>
  );
}
