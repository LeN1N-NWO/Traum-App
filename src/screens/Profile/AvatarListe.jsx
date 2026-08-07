import { useAppState } from "../../state/AppState.jsx";
import "./profile.css";

export default function AvatarListe({ kategorie, onNeu }) {
  const { state, update, toast } = useAppState();
  const eintraege = (state.cast || []).filter((p) => p.category === kategorie);

  function loeschen(id, tag) {
    update({ cast: state.cast.filter((p) => p.id !== id) });
    toast(`@${tag} entfernt`);
  }

  return (
    <div className="p-raster">
      {eintraege.map((p) => (
        <div key={p.id} className="p-kachel">
          {p.img
            ? <img src={p.img} alt={`Referenzfoto für @${p.tag}`} loading="lazy" />
            : <div className="p-kein-bild" aria-hidden="true">?</div>}
          <span className="p-tag">@{p.tag}</span>
          {/* Früher ein <div> ohne Fokus — jetzt ein echter Knopf, damit die
              Kacheln per Tastatur bedienbar sind. */}
          <button
            className="p-loeschen"
            onClick={() => loeschen(p.id, p.tag)}
            aria-label={`@${p.tag} löschen`}
          >
            ×
          </button>
        </div>
      ))}

      <button className="p-kachel p-neu" onClick={onNeu}>
        <span aria-hidden="true">+</span>
        <span className="p-tag">Neu</span>
      </button>
    </div>
  );
}
