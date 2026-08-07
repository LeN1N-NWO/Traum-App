import Card from "../../components/Card.jsx";
import { t } from "../../i18n/index.js";
import "./journal.css";

export default function JournalCard({ entry, onOpen }) {
  const d = new Date(entry.createdAt);
  const media = entry.media?.urls?.[0];
  const isVideo = entry.media?.type === "video";

  return (
    <Card as="button" className="j-card" onClick={() => onOpen(entry.id)}>
      <div className="j-date">
        <span className="j-day">{d.getDate()}</span>
        <span className="j-month">{t.journal.months[d.getMonth()]}</span>
      </div>
      <div className="j-body">
        <h2 className="j-title">{entry.title || t.journal.untitled}</h2>
        <p className="j-text">{entry.text}</p>
      </div>
      {media && !isVideo && <img className="j-thumb" src={media} alt="" loading="lazy" />}
      {media && isVideo && <span className="j-thumb j-video" aria-hidden="true">🎬</span>}
    </Card>
  );
}
