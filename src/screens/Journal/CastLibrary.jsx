import { useState } from "react";
import CastGroup from "./CastGroup.jsx";
import AvatarDialog from "../../components/AvatarDialog.jsx";
import ScreenHeader from "../../components/ScreenHeader.jsx";
import { useAppState } from "../../state/AppState.jsx";
import { t } from "../../i18n/index.js";
import "./journal.css";

/* People, pets and places — the cast the dreams are drawn from.
 *
 * It sits in the Journal tab rather than the profile: these entries only
 * exist to be referenced by dreams, so they belong beside them, not beside
 * the account. The profile keeps what is about the person themselves.
 *
 * Seit 17.08.2026 eine Rollenliste statt dreier Kachelraster — Begründung im
 * Kopf von CastGroup.jsx. Zwei Dinge sind dabei umgezogen und nicht
 * verschwunden:
 *
 * 1. **Angelegt wird über EINEN Knopf**, nicht über drei Kacheln. Der Dialog
 *    fragt danach nach der Gattung — er bekommt hier bewusst KEINE mit, und
 *    genau dieses Fehlen ist das Signal (siehe AvatarDialog.jsx).
 * 2. **Gelöscht wird im Dialog**, nicht in der Zeile. Vorher hing an jeder
 *    Kachel ein ×, und es war das kontraststärkste Element darauf: die
 *    einzige unumkehrbare Handlung mit dem lautesten Platz. Jetzt liegt sie
 *    einen Schritt tiefer, dort wo man die Figur ohnehin ansieht.
 */
export default function CastLibrary({ onBack }) {
  const { state } = useAppState();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(null);       // an existing cast entry

  const empty = !(state.cast || []).length;

  return (
    <>
      <button className="j-back" onClick={onBack}><span data-flip aria-hidden="true">‹</span> {t.journal.title}</button>
      <ScreenHeader title={t.journal.library} subtitle={t.journal.libraryLede} />

      {empty ? (
        <p className="cl-empty">{t.journal.libraryCount(0)}</p>
      ) : (
        <>
          <CastGroup category="person" label={t.profile.people} onEdit={setEditing} />
          <CastGroup category="pet" label={t.profile.pets} onEdit={setEditing} />
          <CastGroup category="place" label={t.profile.places} onEdit={setEditing} />
        </>
      )}

      <button className="cl-new" onClick={() => setCreating(true)}>{t.journal.castNew}</button>

      {creating && <AvatarDialog onClose={() => setCreating(false)} />}
      {editing && (
        <AvatarDialog category={editing.category} existing={editing} onClose={() => setEditing(null)} />
      )}
    </>
  );
}
