import { useEffect, useRef } from "react";
import Button from "../../components/Button.jsx";
import { useAppState } from "../../state/AppState.jsx";
import "./journal.css";

export default function JournalDetail({ eintrag, onSchliessen }) {
  const { state, update, toast } = useAppState();
  const schliessenRef = useRef(null);

  // Fokus in den Dialog holen und Escape belegen — sonst bleibt die Tastatur
  // hinter dem Modal hängen.
  useEffect(() => {
    schliessenRef.current?.focus();
    const beiTaste = (e) => { if (e.key === "Escape") onSchliessen(); };
    document.addEventListener("keydown", beiTaste);
    return () => document.removeEventListener("keydown", beiTaste);
  }, [onSchliessen]);

  function loeschen() {
    update({ journal: state.journal.filter((e) => e.id !== eintrag.id) });
    toast("Eintrag gelöscht");
    onSchliessen();
  }

  const d = new Date(eintrag.createdAt);
  return (
    <div className="j-modal-hinter" onClick={onSchliessen}>
      <div
        className="j-modal"
        role="dialog"
        aria-modal="true"
        aria-label={eintrag.title || "Traumeintrag"}
        onClick={(e) => e.stopPropagation()}
      >
        <button ref={schliessenRef} className="j-schliessen" onClick={onSchliessen} aria-label="Schließen">
          ×
        </button>

        <p className="j-modal-datum">
          {d.toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" })}
        </p>
        <h2 className="j-modal-titel">{eintrag.title || "Ohne Titel"}</h2>

        {eintrag.media?.urls?.length > 0 && (
          <div className="j-medien">
            {eintrag.media.type === "video"
              ? <video src={eintrag.media.urls[0]} controls playsInline />
              : eintrag.media.urls.map((u, i) => <img key={i} src={u} alt="" loading="lazy" />)}
          </div>
        )}

        <p className="j-modal-text">{eintrag.text}</p>

        {eintrag.references?.length > 0 && (
          <p className="j-referenzen">
            Verwendete Fotos: {eintrag.references.map((r) => "@" + r.tag).join(", ")}
          </p>
        )}

        <Button variant="still" onClick={loeschen}>Eintrag löschen</Button>
      </div>
    </div>
  );
}
