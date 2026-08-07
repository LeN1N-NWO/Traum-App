import { useState } from "react";
import { useAppState } from "../../state/AppState.jsx";
import { genId } from "../../lib/storage.js";
import { t } from "../../i18n/index.js";
import Button from "../../components/Button.jsx";
import "./profile.css";

// Mirrors sanitizeTag() in server.js: [a-z0-9] only, 12 chars max. The server
// re-checks anyway — this is so the person sees what actually lands.
function cleanTag(raw) {
  return String(raw || "").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 12);
}

export default function AvatarDialog({ category, onClose }) {
  const { state, update, toast } = useAppState();
  const [tag, setTag] = useState("");
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
    update({
      cast: [...(state.cast || []), {
        id: genId("c"), tag: clean, category, desc: "", img: image,
      }],
    });
    toast(t.avatarDialog.created(clean));
    onClose();
  }

  const title = t.avatarDialog.titleFor[category];

  return (
    <div className="p-backdrop" onClick={onClose}>
      <div
        className="p-modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="p-modal-title">{title}</h2>

        <label className="p-field">
          <span>{t.avatarDialog.nameLabel(cleanTag(tag) || "…")}</span>
          <input value={tag} onChange={(e) => setTag(e.target.value)} maxLength={20} autoFocus />
        </label>

        <label className="p-field">
          <span>{t.avatarDialog.photoLabel}</span>
          <input type="file" accept="image/*" onChange={readFile} />
        </label>

        {image && <img className="p-preview" src={image} alt={t.avatarDialog.previewAlt} />}

        <p className="p-hint">{t.avatarDialog.privacy}</p>

        <div className="p-actions">
          <Button variant="ghost" onClick={onClose}>{t.avatarDialog.cancel}</Button>
          <Button onClick={save}>{t.avatarDialog.save}</Button>
        </div>
      </div>
    </div>
  );
}
