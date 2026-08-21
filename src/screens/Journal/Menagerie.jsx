import { useAppState } from "../../state/AppState.jsx";
import ScreenHeader from "../../components/ScreenHeader.jsx";
import { t } from "../../i18n/index.js";
import "./journal.css";

/* Die Menagerie — umgezogen von der Titelseite (Antons Entscheidung
 * 21.08.): Sie ist eine Sammlung, die aus aufgeschriebenen Träumen
 * entsteht, also wohnt sie bei den anderen Sammlungen (Besetzung,
 * Traumatlas) als Nebenraum UNTER den Träumen. Die Titelseite behält
 * ihren einen Zweck: den nächsten Traum anfangen. */
export default function Menagerie({ onBack }) {
  const { state } = useAppState();
  const creatures = [...(state.creatures || [])].reverse();   // newest first

  return (
    <>
      <button className="j-back" onClick={onBack}><span data-flip aria-hidden="true">\u2039</span> {t.journal.title}</button>
      <ScreenHeader title={t.home.menagerieHeading} subtitle={t.journal.menagerieLede} />

      {creatures.length === 0 ? (
        <p className="j-empty">{t.home.menagerieEmpty}</p>
      ) : (
        <div className="j-menagerie">
          {creatures.map((c) => (
            <div key={c.id} className="j-creature">
              <span className="j-creature-emoji" aria-hidden="true">{c.e}</span>
              <span className="j-creature-name">{c.name}</span>
              <span className={"j-creature-rare " + c.rareClass}>{c.rare}</span>
              <span className="j-creature-date">{c.date}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
