import { mediaUrl } from "../../lib/api.js";
import { filmOf, imagesOf } from "../../lib/entryMedia.js";
import { t } from "../../i18n/index.js";
import "./journal.css";

/* One dream, in either of the journal's two views.
 *
 * "tile"  — a poster card, image filling it, title on top of the image.
 * "row"   — a compact list line: title, opening words, small thumbnail.
 *
 * Everything inside is a <span>: the card is a <button>, and a button may
 * only contain phrasing content — an <h2>/<p> in there is invalid markup
 * that browsers silently reflow. The heading level lives on the screen.
 */
export default function JournalCard({ entry, onOpen, variant = "tile" }) {
  const d = new Date(entry.createdAt);
  // A dream that became a film shows the film: it is the newest and most
  // finished thing about it, and a still from the sequence would under-sell
  // what is actually in there.
  const film = filmOf(entry);
  const media = mediaUrl(film || imagesOf(entry)[0]);
  const isVideo = !!film;
  const title = entry.title || t.journal.untitled;

  if (variant === "row") {
    return (
      <button className="j-row" onClick={() => onOpen(entry.id)}>
        <span className="j-row-date">
          <span className="j-row-day">{d.getDate()}</span>
          <span className="j-row-month">{t.journal.months[d.getMonth()]}</span>
        </span>
        <span className="j-row-body">
          <span className="j-row-title">{title}</span>
          <span className="j-row-text">{entry.tagline || entry.text}</span>
        </span>
        {media && !isVideo && <img className="j-row-thumb" src={media} alt="" loading="lazy" />}
        {media && isVideo && <video className="j-row-thumb" src={media} muted playsInline preload="metadata" />}
      </button>
    );
  }

  return (
    <button className="j-tile" onClick={() => onOpen(entry.id)}>
      {media && !isVideo && <img className="j-tile-img" src={media} alt="" loading="lazy" />}
      {/* Muted, no autoplay: a wall of playing videos would be noise and
          battery. The still first frame is all the tile needs. */}
      {media && isVideo && <video className="j-tile-img" src={media} muted playsInline preload="metadata" />}
      {!media && <span className="j-tile-blank" aria-hidden="true" />}

      <span className="j-tile-scrim" aria-hidden="true" />

      <span className="j-tile-date">
        {d.getDate()} {t.journal.months[d.getMonth()]}
      </span>

      <span className="j-tile-body">
        <span className="j-tile-title">{title}</span>
        <span className="j-tile-sub">{entry.tagline || entry.text}</span>
      </span>
    </button>
  );
}
