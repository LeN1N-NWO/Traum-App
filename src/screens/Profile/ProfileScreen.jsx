import { useState } from "react";
import { useAppState } from "../../state/AppState.jsx";
import ScreenHeader from "../../components/ScreenHeader.jsx";
import Card from "../../components/Card.jsx";
import AvatarListe from "./AvatarListe.jsx";
import AvatarDialog from "./AvatarDialog.jsx";
import LucidGuide from "./LucidGuide.jsx";
import "./profile.css";

export default function ProfileScreen() {
  const { state } = useAppState();
  const [dialogFuer, setDialogFuer] = useState(null);   // "person" | "pet" | "place" | null

  return (
    <main className="screen">
      <ScreenHeader titel="Profil" />

      {/* Attrappe: der Zähler liegt im localStorage und ist damit vom Menschen
          editierbar. Anzeige, keine Zugangskontrolle — echte Durchsetzung
          braucht das Backend. */}
      <Card className="p-credits">
        <span className="p-credits-zahl">{state.credits ?? 0}</span>
        <span className="p-credits-label">Credits</span>
        <span className="p-credits-hinweis">Aufladen bald verfügbar</span>
      </Card>

      <h2 className="p-abschnitt">Personen</h2>
      <AvatarListe kategorie="person" onNeu={() => setDialogFuer("person")} />

      <h2 className="p-abschnitt">Tiere</h2>
      <AvatarListe kategorie="pet" onNeu={() => setDialogFuer("pet")} />

      <h2 className="p-abschnitt">Orte</h2>
      <AvatarListe kategorie="place" onNeu={() => setDialogFuer("place")} />

      <h2 className="p-abschnitt">Klarträumen lernen</h2>
      <LucidGuide />

      {dialogFuer && (
        <AvatarDialog kategorie={dialogFuer} onSchliessen={() => setDialogFuer(null)} />
      )}
    </main>
  );
}
