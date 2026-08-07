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

/* Used from the profile screen AND from the wizard, where a character the
   analysis found has no avatar yet. `suggestedName` pre-fills the field with
   the name from the dream; `onCreated` hands the new avatar straight back so
   the wizard can bind it to that character.

   Pass `avatar` to open an existing entry instead: the fields are pre-filled
   and saving updates that entry rather than adding a second one. */
export default function AvatarDialog({ category, avatar = null, suggestedName = "", suggestedDesc = "", onCreated, onClose }) {
  const { state, update, toast } = useAppState();
  const editing = Boolean(avatar);
  const [tag, setTag] = useState(cleanTag(avatar ? avatar.tag : suggestedName));
  const [desc, setDesc] = useState(avatar ? avatar.desc || "" : suggestedDesc);
  const [image, setImage] = useState(avatar ? avatar.img || "" : "");
  // An entry without a photo is fine — description alone is enough for the
  // renderer. So "no image" must stay distinguishable from "not touched".
  const cat = avatar ? avatar.category : category;

  function readFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImage(String(reader.result));
    reader.onerror = () => toast(t.avatarDialog.readFailed);
    reader.readAsDataURL(file);
  }

  // A name alone gives the renderer nothing to work from — it needs either a
  // photo to match or words to draw from. Applies to editing too, so an entry
  // cannot be emptied out after the fact.
  const hasSubstance = Boolean(image) || Boolean(desc.trim());

  function save() {
    const clean = cleanTag(tag);
    if (!clean) return toast(t.avatarDialog.needName);
    if (!hasSubstance) return toast(t.avatarDialog.needPhotoOrDesc);
    // When editing, the entry's own name is not a clash with itself.
    const clash = (state.cast || []).some((p) => p.tag === clean && p.id !== avatar?.id);
    if (clash) return toast(t.avatarDialog.exists(clean));

    if (editing) {
      const next = { ...avatar, tag: clean, category: cat, desc: desc.trim(), img: image };
      update({ cast: (state.cast || []).map((p) => (p.id === avatar.id ? next : p)) });
      toast(t.avatarDialog.updated(clean));
      onCreated?.(next);
      return onClose();
    }

    const created = { id: genId("c"), tag: clean, category: cat, desc: desc.trim(), img: image };
    update({ cast: [...(state.cast || []), created] });
    toast(t.avatarDialog.created(clean));
    onCreated?.(created);
    onClose();
  }

  const title = editing ? t.avatarDialog.editTitleFor[cat] : t.avatarDialog.titleFor[cat];
  const renamed = editing && cleanTag(tag) && cleanTag(tag) !== avatar.tag;

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

        {renamed && <p className="av-hint av-warn">{t.avatarDialog.renameHint(cleanTag(tag))}</p>}

        <label className="av-field">
          <span>{image ? t.avatarDialog.photoLabelReplace : t.avatarDialog.photoLabel}</span>
          <input type="file" accept="image/*" onChange={readFile} />
        </label>

        {image && (
          <div className="av-photo">
            <img className="av-preview" src={image} alt={t.avatarDialog.previewAlt} />
            <Button
              variant="ghost"
              onClick={() => { setImage(""); toast(t.avatarDialog.photoRemoved); }}
            >
              {t.avatarDialog.removePhoto}
            </Button>
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
            {editing ? t.avatarDialog.saveChanges : t.avatarDialog.save}
          </Button>
        </div>
      </div>
    </div>
  );
}
