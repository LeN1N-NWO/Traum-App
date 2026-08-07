import { useAppState } from "../../state/AppState.jsx";
import { t } from "../../i18n/index.js";
import "./home.css";

export default function Menagerie() {
  const { state } = useAppState();
  const creatures = [...(state.creatures || [])].reverse();   // newest first

  if (creatures.length === 0) {
    return <p className="h-empty">{t.home.menagerieEmpty}</p>;
  }

  return (
    <div className="h-menagerie">
      {creatures.map((c) => (
        <div key={c.id} className="h-creature">
          <span className="h-creature-emoji" aria-hidden="true">{c.e}</span>
          <span className="h-creature-name">{c.name}</span>
          <span className={"h-creature-rare " + c.rareClass}>{c.rare}</span>
          <span className="h-creature-date">{c.date}</span>
        </div>
      ))}
    </div>
  );
}
