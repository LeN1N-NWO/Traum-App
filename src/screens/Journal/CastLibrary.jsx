import { useState } from "react";
import AvatarList from "../Profile/AvatarList.jsx";
import AvatarDialog from "../../components/AvatarDialog.jsx";
import ScreenHeader from "../../components/ScreenHeader.jsx";
import { t } from "../../i18n/index.js";
import "./journal.css";

/* People, pets and places — the cast the dreams are drawn from.
 *
 * It sits in the Journal tab rather than the profile: these entries only
 * exist to be referenced by dreams, so they belong beside them, not beside
 * the account. The profile keeps what is about the person themselves.
 */
export default function CastLibrary({ onBack }) {
  const [dialogFor, setDialogFor] = useState(null);   // "person" | "pet" | "place" | null
  const [editing, setEditing] = useState(null);       // an existing cast entry

  return (
    <>
      <button className="j-back" onClick={onBack}><span data-flip aria-hidden="true">‹</span> {t.journal.title}</button>
      <ScreenHeader title={t.journal.library} subtitle={t.journal.libraryLede} />

      <h2 className="p-section">{t.profile.people}</h2>
      <AvatarList category="person" onNew={() => setDialogFor("person")} onEdit={setEditing} />

      <h2 className="p-section">{t.profile.pets}</h2>
      <AvatarList category="pet" onNew={() => setDialogFor("pet")} onEdit={setEditing} />

      <h2 className="p-section">{t.profile.places}</h2>
      <AvatarList category="place" onNew={() => setDialogFor("place")} onEdit={setEditing} />

      {dialogFor && <AvatarDialog category={dialogFor} onClose={() => setDialogFor(null)} />}
      {editing && (
        <AvatarDialog category={editing.category} existing={editing} onClose={() => setEditing(null)} />
      )}
    </>
  );
}
