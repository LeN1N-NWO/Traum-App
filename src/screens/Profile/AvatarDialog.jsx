import { useState } from "react";
import { useAppState } from "../../state/AppState.jsx";
import { genId } from "../../lib/storage.js";
import Button from "../../components/Button.jsx";
import "./profile.css";

// Spiegelt sanitizeTag() in server.js: nur [a-z0-9], höchstens 12 Zeichen.
// Der Server prüft ohnehin erneut — hier geht es darum, dass der Mensch
// sofort sieht, was tatsächlich ankommt.
function saeubereTag(roh) {
  return String(roh || "").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 12);
}

export default function AvatarDialog({ kategorie, onSchliessen }) {
  const { state, update, toast } = useAppState();
  const [tag, setTag] = useState("");
  const [bild, setBild] = useState("");

  function dateiLesen(e) {
    const datei = e.target.files?.[0];
    if (!datei) return;
    const leser = new FileReader();
    leser.onload = () => setBild(String(leser.result));
    leser.onerror = () => toast("⚠ Foto konnte nicht gelesen werden.");
    leser.readAsDataURL(datei);
  }

  function speichern() {
    const sauber = saeubereTag(tag);
    if (!sauber) return toast("⚠ Bitte einen Namen aus Buchstaben oder Zahlen angeben.");
    if ((state.cast || []).some((p) => p.tag === sauber)) return toast(`⚠ @${sauber} gibt es schon.`);
    update({
      cast: [...(state.cast || []), {
        id: genId("c"), tag: sauber, category: kategorie, desc: "", img: bild,
      }],
    });
    toast(`@${sauber} angelegt`);
    onSchliessen();
  }

  const bezeichnung = kategorie === "place" ? "Ort" : kategorie === "pet" ? "Tier" : "Person";

  return (
    <div className="p-modal-hinter" onClick={onSchliessen}>
      <div
        className="p-modal"
        role="dialog"
        aria-modal="true"
        aria-label={`${bezeichnung} anlegen`}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="p-modal-titel">{bezeichnung} anlegen</h2>

        <label className="p-feld">
          <span>Name (wird zu @{saeubereTag(tag) || "…"})</span>
          <input value={tag} onChange={(e) => setTag(e.target.value)} maxLength={20} autoFocus />
        </label>

        <label className="p-feld">
          <span>Referenzfoto</span>
          <input type="file" accept="image/*" onChange={dateiLesen} />
        </label>

        {bild && <img className="p-vorschau" src={bild} alt="Vorschau des gewählten Fotos" />}

        <p className="p-hinweis">
          Das Foto wird bei der Bildgenerierung an fal.ai übertragen.
        </p>

        <div className="p-aktionen">
          <Button variant="geist" onClick={onSchliessen}>Abbrechen</Button>
          <Button onClick={speichern}>Speichern</Button>
        </div>
      </div>
    </div>
  );
}
