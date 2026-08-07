import Card from "../../components/Card.jsx";
import "./journal.css";

const MONATE = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];

export default function JournalCard({ eintrag, onOeffnen }) {
  const d = new Date(eintrag.createdAt);
  const bild = eintrag.media?.urls?.[0];
  const istVideo = eintrag.media?.type === "video";

  return (
    <Card as="button" className="j-karte" onClick={() => onOeffnen(eintrag.id)}>
      <div className="j-datum">
        <span className="j-tag">{d.getDate()}</span>
        <span className="j-monat">{MONATE[d.getMonth()]}</span>
      </div>
      <div className="j-inhalt">
        <h2 className="j-titel">{eintrag.title || "Ohne Titel"}</h2>
        <p className="j-text">{eintrag.text}</p>
      </div>
      {bild && !istVideo && <img className="j-vorschau" src={bild} alt="" loading="lazy" />}
      {bild && istVideo && <span className="j-vorschau j-video" aria-hidden="true">🎬</span>}
    </Card>
  );
}
