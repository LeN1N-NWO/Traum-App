import { useAppState } from "../../state/AppState.jsx";
import "./home.css";

export default function Menagerie() {
  const { state } = useAppState();
  const kreaturen = [...(state.creatures || [])].reverse();   // neueste zuerst

  if (kreaturen.length === 0) {
    return (
      <p className="h-leer">
        Noch keine Wesen. Jeder aufgeschriebene Traum lässt eines zurück.
      </p>
    );
  }

  return (
    <div className="h-menagerie">
      {kreaturen.map((c) => (
        <div key={c.id} className="h-wesen">
          <span className="h-wesen-emoji" aria-hidden="true">{c.e}</span>
          <span className="h-wesen-name">{c.name}</span>
          <span className={"h-wesen-rar " + c.rareClass}>{c.rare}</span>
          <span className="h-wesen-datum">{c.date}</span>
        </div>
      ))}
    </div>
  );
}
