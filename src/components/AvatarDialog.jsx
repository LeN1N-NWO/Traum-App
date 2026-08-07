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
   the wizard can bind it to that character. */
export default function AvatarDialog({ category, suggestedName = "", onCreated, onClose }) {
  const { state, update, toast } = useAppState();
  const [tag, setTag] = useState(cleanTag(suggestedName));
  const [desc, setDesc] = useState("");
  const [image, setImage] = useState("");

  function readFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImage(String(reader.result));
    reader.onerror = () => toast(t.avatarDialog.readFailed);
    reader.readAsDataURL(file);
  }

  function save() {
    const clean = cleanTag(tag);
    if (!clean) return toast(t.avatarDialog.needName);
    if ((state.cast || []).some((p) => p.tag === clean)) return toast(t.avatarDialog.exists(clean));
    const avatar = { id: genId("c"), tag: clean, category, desc: desc.trim(), img: image };
    update({ cast: [...(state.cast || []), avatar] });
    toast(t.avatarDialog.created(clean));
    onCreated?.(avatar);
    onClose();
  }

  const title = t.avatarDialog.titleFor[category];

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
          <span>{t.avatarDialog.photoLabel}</span>
          <input type="file" accept="image/*" onChange={readFile} />
        </label>

        {image && <img className="av-preview" src={image} alt={t.avatarDialog.previewAlt} />}

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

        <p className="av-hint">{t.avatarDialog.privacy}</p>

        <div className="av-actions">
          <Button variant="ghost" onClick={onClose}>{t.avatarDialog.cancel}</Button>
          <Button onClick={save}>{t.avatarDialog.save}</Button>
        </div>
      </div>
    </div>
  );
}
