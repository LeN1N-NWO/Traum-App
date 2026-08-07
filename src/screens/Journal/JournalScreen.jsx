import { useState, useMemo } from "react";
import { useAppState } from "../../state/AppState.jsx";
import ScreenHeader from "../../components/ScreenHeader.jsx";
import JournalCard from "./JournalCard.jsx";
import JournalDetail from "./JournalDetail.jsx";
import "./journal.css";

export default function JournalScreen() {
  const { state } = useAppState();
  const [suche, setSuche] = useState("");
  const [offenId, setOffenId] = useState(null);

  // Neueste zuerst. Die Sortierung NICHT in den Speicher schreiben — die
  // Reihenfolge ist Darstellung, keine Eigenschaft der Daten.
  const eintraege = useMemo(() => {
    const q = suche.trim().toLowerCase();
    return [...(state.journal || [])]
      .filter((e) => !q || (e.text + " " + (e.title || "")).toLowerCase().includes(q))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [state.journal, suche]);

  const gesamt = state.journal?.length || 0;
  const offen = eintraege.find((e) => e.id === offenId) || null;

  return (
    <main className="screen">
      <ScreenHeader
        titel="Tagebuch"
        unterzeile={gesamt === 1 ? "1 Traum" : `${gesamt} Träume`}
      />

      <input
        className="j-suche"
        type="search"
        value={suche}
        onChange={(e) => setSuche(e.target.value)}
        placeholder="Träume durchsuchen…"
        aria-label="Träume durchsuchen"
      />

      {eintraege.length === 0 ? (
        <p className="j-leer">
          {suche ? "Nichts gefunden." : "Noch keine Träume aufgeschrieben."}
        </p>
      ) : (
        <div className="j-liste">
          {eintraege.map((e) => (
            <JournalCard key={e.id} eintrag={e} onOeffnen={setOffenId} />
          ))}
        </div>
      )}

      {offen && <JournalDetail eintrag={offen} onSchliessen={() => setOffenId(null)} />}
    </main>
  );
}
