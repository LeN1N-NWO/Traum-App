import { useState } from "react";
import { useAppState } from "../../state/AppState.jsx";
import { t } from "../../i18n/index.js";
import ScreenHeader from "../../components/ScreenHeader.jsx";
import Card from "../../components/Card.jsx";
import AvatarList from "./AvatarList.jsx";
import AvatarDialog from "../../components/AvatarDialog.jsx";
import DreamCalendar from "./DreamCalendar.jsx";
import "./profile.css";

export default function ProfileScreen() {
  const { state } = useAppState();
  const [dialogFor, setDialogFor] = useState(null);   // "person" | "pet" | "place" | null
  const [editing, setEditing] = useState(null);       // an existing cast entry

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
      <AvatarList category="person" onNew={() => setDialogFor("person")} onEdit={setEditing} />

      <h2 className="p-section">{t.profile.pets}</h2>
      <AvatarList category="pet" onNew={() => setDialogFor("pet")} onEdit={setEditing} />

      <h2 className="p-section">{t.profile.places}</h2>
      <AvatarList category="place" onNew={() => setDialogFor("place")} onEdit={setEditing} />

      {/* The lucid guide moved to the Sleep tab, where the rest of the free
          content lives. Statistics start here instead. */}
      <h2 className="p-section">{t.profile.calendar}</h2>
      <DreamCalendar />

      {dialogFor && (
        <AvatarDialog category={dialogFor} onClose={() => setDialogFor(null)} />
      )}

      {editing && (
        <AvatarDialog
          category={editing.category}
          existing={editing}
          onClose={() => setEditing(null)}
        />
      )}
    </main>
  );
}
