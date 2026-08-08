import { mediaUrl } from "../../lib/api.js";
import { t } from "../../i18n/index.js";
import "./journal.css";

/* One dream as a poster tile: the image fills the card, the title sits on it.
 *
 * Everything inside is a <span>: the tile is a <button>, and a button may only
 * contain phrasing content — an <h2>/<p> in there is invalid markup that
 * browsers silently reflow. The heading level lives on the screen, not here.
 */
export default function JournalCard({ entry, onOpen }) {
  const d = new Date(entry.createdAt);
  const media = mediaUrl(entry.media?.urls?.[0]);
  const isVideo = entry.media?.type === "video";

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
        <span className="j-tile-title">{entry.title || t.journal.untitled}</span>
        <span className="j-tile-sub">{entry.tagline || entry.text}</span>
      </span>
    </button>
  );
}
