import { useId } from "react";

/* Die zwei gefüllten Zeichen für die Kacheln im Kaufblatt — und der Grund,
 * warum sie NICHT in icons.jsx stehen.
 *
 * Der Kopf von icons.jsx sagt: 24×24, currentColor, gleiche Strichstärke,
 * nichts gefüllt. Genau das lässt eine Reihe davon als eine Familie lesen.
 * Diese beiden brechen jede dieser Regeln — gefüllt, mit Verlauf, mit
 * eigenem Licht. Sie in dieselbe Datei zu legen wäre der Anfang vom Ende
 * jenes Satzes: Der nächste, der dort etwas sucht, fände zwei Sorten und
 * hielte beide für gleichwertig.
 *
 * Sie sind kein Bedienelement, sondern Grafik für genau eine Fläche: die
 * Kachel im Kaufblatt, wenn dort ausnahmsweise kein eigenes Material liegt.
 * Ein Umriss würde dort wirken wie eine Bedienoberfläche, die auf Eingabe
 * wartet — und niemand kauft von einer Schaltfläche, die nichts tut.
 */

/** @param {{size?: number}} props */
export function GlyphImages({ size = 54 }) {
  /* Eigene Kennung je Vorkommen: Zwei Verläufe mit derselben id im selben
     Dokument überschreiben einander, und das fällt erst auf, wenn das
     Kaufblatt einmal zweimal offen ist. */
  const id = useId();
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--gold)" />
          <stop offset="46%" stopColor="var(--warm)" />
          <stop offset="100%" stopColor="#d2683a" />
        </linearGradient>
      </defs>
      {/* Das hintere Blatt, angeschnitten — drei Bilder, nicht eines. */}
      <rect x="2.5" y="7" width="13" height="13" rx="2.6"
            transform="rotate(-8 9 13.5)" fill={`url(#${id})`} opacity=".42" />
      <rect x="6.5" y="4" width="15" height="15" rx="2.8" fill={`url(#${id})`} />
      <circle cx="11.6" cy="9.4" r="1.7" fill="#fff" opacity=".92" />
      {/* Der Horizont im Bild, als Aussparung statt als Strich gezeichnet:
          eine dunkle Form auf warmem Grund liest sich bei 24 px sauberer
          als eine helle Linie darauf. */}
      <path d="M7.6 17.5 11 13.6a1.5 1.5 0 0 1 2.2 0l1.1 1.2 1.7-1.9a1.5 1.5 0 0 1 2.2 0l2.3 2.6v2.9a1 1 0 0 1-1 1H8.6a1 1 0 0 1-1-1z"
            fill="var(--bg)" opacity=".33" />
    </svg>
  );
}

/** @param {{size?: number}} props */
export function GlyphFilm({ size = 54 }) {
  const id = useId();
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--gold)" />
          <stop offset="46%" stopColor="var(--warm)" />
          <stop offset="100%" stopColor="#d2683a" />
        </linearGradient>
      </defs>
      <rect x="2.5" y="4.5" width="19" height="15" rx="3" fill={`url(#${id})`} />
      <rect x="8" y="4.5" width="8" height="15" fill="var(--bg)" opacity=".22" />
      <g fill="var(--bg)" opacity=".45">
        <rect x="4" y="7" width="2.4" height="2.4" rx=".6" />
        <rect x="4" y="14.6" width="2.4" height="2.4" rx=".6" />
        <rect x="17.6" y="7" width="2.4" height="2.4" rx=".6" />
        <rect x="17.6" y="14.6" width="2.4" height="2.4" rx=".6" />
      </g>
      <path d="M10.6 9.2 14.6 12l-4 2.8z" fill="#fff" opacity=".9" />
    </svg>
  );
}
