import { useState } from "react";
import { useAppState } from "../../state/AppState.jsx";
import { t } from "../../i18n/index.js";
import ScreenHeader from "../../components/ScreenHeader.jsx";
import Card from "../../components/Card.jsx";
import AvatarList from "./AvatarList.jsx";
import AvatarDialog from "../../components/AvatarDialog.jsx";
import LucidGuide from "./LucidGuide.jsx";
import "./profile.css";

export default function ProfileScreen() {
  const { state } = useAppState();
  const [dialogFor, setDialogFor] = useState(null);   // "person" | "pet" | "place" | null
  const [editing, setEditing] = useState(null);       // ein vorhandener Eintrag

  return (
    <main className="screen">
      <ScreenHeader title={t.profile.title} />

      {/* A stand-in: the counter lives in localStorage and is editable by the
          user. Display, not access control — real enforcement needs the
          backend. */}
      <Card className="p-credits">
        <span className="p-credits-count">{state.credits ?? 0}</span>
        <span className="p-credits-label">{t.profile.credits}</span>
        <span className="p-credits-hint">{t.profile.creditsSoon}</span>
      </Card>

      <h2 className="p-section">{t.profile.people}</h2>
      <AvatarList category="person" onNew={() => setDialogFor("person")} onOpen={setEditing} />

      <h2 className="p-section">{t.profile.pets}</h2>
      <AvatarList category="pet" onNew={() => setDialogFor("pet")} onOpen={setEditing} />

      <h2 className="p-section">{t.profile.places}</h2>
      <AvatarList category="place" onNew={() => setDialogFor("place")} onOpen={setEditing} />

      <h2 className="p-section">{t.profile.guide}</h2>
      <LucidGuide />

      {dialogFor && (
        <AvatarDialog category={dialogFor} onClose={() => setDialogFor(null)} />
      )}

      {editing && (
        /* key: ohne ihn behielte der Dialog beim Wechsel zwischen zwei
           Einträgen die Feldinhalte des vorigen. */
        <AvatarDialog key={editing.id} avatar={editing} onClose={() => setEditing(null)} />
      )}
    </main>
  );
}
