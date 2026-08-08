import { useState } from "react";
import { useAppState } from "../state/AppState.jsx";
import { genId } from "../lib/storage.js";
import { t } from "../i18n/index.js";
import Button from "./Button.jsx";
import "./AvatarDialog.css";

// Mirrors sanitizeTag() in server.js: [a-z0-9] only, 12 chars max. The server
// re-checks anyway — this is so the person sees what actually lands.
function cleanTag(raw) {
  return String(raw || "").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 12);
}

/* Used from the profile screen AND from the wizard.
 *
 * Three modes, one component:
 *   - new, blank            (profile: the "+" tile)
 *   - new, pre-filled       (wizard: a character the analysis found —
 *                            `suggestedName`/`suggestedDesc`)
 *   - editing an existing   (profile: tapping a tile — `existing`)
 *
 * `onCreated` hands the saved avatar back so the wizard can bind it straight
 * to the character that triggered the dialog.
 *
 * `isMe` is a fourth mode: the dreamer's own avatar. It lives in state.me
 * rather than in the cast — there is exactly one of it, the wizard matches
 * "I"/"me" against it, and it must not collide with or be deleted alongside
 * the ordinary entries.
 */
export default function AvatarDialog({
  category,
  suggestedName = "",
  suggestedDesc = "",
  existing = null,
  isMe = false,
  onCreated,
  onClose,
}) {
  const { state, update, toast } = useAppState();
  const isEdit = Boolean(existing);

  const [tag, setTag] = useState(cleanTag(existing?.tag || suggestedName));
  const [desc, setDesc] = useState(existing?.desc || suggestedDesc);
  const [image, setImage] = useState(existing?.img || "");

  function readFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImage(String(reader.result));
    reader.onerror = () => toast(t.avatarDialog.readFailed);
    reader.readAsDataURL(file);
  }

  // A name on its own gives the renderer nothing to work from — it needs
  // either a photo to match or words to draw from. Applies to editing too, so
  // an entry cannot be emptied out after the fact.
  const hasSubstance = Boolean(image) || Boolean(desc.trim());

  function save() {
    const clean = cleanTag(tag);
    if (!clean) return toast(t.avatarDialog.needName);
    if (!hasSubstance) return toast(t.avatarDialog.needPhotoOrDesc);

    if (isMe) {
      const saved = { tag: clean, desc: desc.trim(), img: image };
      update({ me: saved });
      toast(t.avatarDialog.saved(clean));
      onCreated?.(saved);
      onClose();
      return;
    }

    // A name may collide with anyone EXCEPT the entry being edited.
    const collides = (state.cast || []).some((p) => p.tag === clean && p.id !== existing?.id);
    if (collides) return toast(t.avatarDialog.exists(clean));

    if (isEdit) {
      const saved = { ...existing, tag: clean, desc: desc.trim(), img: image };
      const patch = {
        cast: (state.cast || []).map((p) => (p.id === existing.id ? saved : p)),
      };

      // Journal entries record which references a dream used, by TAG. Renaming
      // without fixing those would leave old dreams pointing at a name that no
      // longer exists — it is the same person, so the record follows along.
      if (existing.tag !== clean) {
        patch.journal = (state.journal || []).map((entry) => ({
          ...entry,
          references: (entry.references || []).map((r) =>
            r.tag === existing.tag ? { ...r, tag: clean } : r
          ),
        }));
      }

      update(patch);
      toast(t.avatarDialog.saved(clean));
      onCreated?.(saved);
      onClose();
      return;
    }

    const avatar = { id: genId("c"), tag: clean, category, desc: desc.trim(), img: image };
    update({ cast: [...(state.cast || []), avatar] });
    toast(t.avatarDialog.created(clean));
    onCreated?.(avatar);
    onClose();
  }

  const title = isMe
    ? t.avatarDialog.meTitle
    : isEdit
      ? t.avatarDialog.editTitleFor[existing.category] || t.avatarDialog.editTitleFor.person
      : t.avatarDialog.titleFor[category];

  return (
    <div className="av-backdrop" onClick={onClose}>
      <div
        className="av-modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="av-title">{title}</h2>

        <label className="av-field">
          <span>{t.avatarDialog.nameLabel(cleanTag(tag) || "…")}</span>
          <input value={tag} onChange={(e) => setTag(e.target.value)} maxLength={20} autoFocus />
        </label>

        <label className="av-field">
          <span>{isEdit && image ? t.avatarDialog.photoReplace : t.avatarDialog.photoLabel}</span>
          <input type="file" accept="image/*" onChange={readFile} />
        </label>

        {image && (
          <div className="av-preview-row">
            <img className="av-preview" src={image} alt={t.avatarDialog.previewAlt} />
            <button className="av-drop" onClick={() => setImage("")}>
              {t.avatarDialog.photoRemove}
            </button>
          </div>
        )}

        {/* Without a photo the description is the only thing the renderer has
            to go on, so it is worth asking for either way. */}
        <label className="av-field">
          <span>{image ? t.avatarDialog.descLabelOptional : t.avatarDialog.descLabel}</span>
          <input
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            maxLength={120}
            placeholder={t.avatarDialog.descPlaceholder}
          />
        </label>

        {/* Sichtbar, bevor gespeichert wird — nicht erst als Meldung danach. */}
        {!hasSubstance && <p className="av-hint av-warn">{t.avatarDialog.needPhotoOrDescHint}</p>}

        <p className="av-hint">{t.avatarDialog.privacy}</p>

        <div className="av-actions">
          <Button variant="ghost" onClick={onClose}>{t.avatarDialog.cancel}</Button>
          <Button onClick={save} disabled={!hasSubstance}>
            {isEdit ? t.avatarDialog.saveChanges : t.avatarDialog.save}
          </Button>
        </div>
      </div>
    </div>
  );
}
