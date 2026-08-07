import { useAppState } from "../../state/AppState.jsx";
import { t } from "../../i18n/index.js";
import "./profile.css";

export default function AvatarList({ category, onNew, onOpen }) {
  const { state, update, toast } = useAppState();
  const entries = (state.cast || []).filter((p) => p.category === category);

  function remove(id, tag) {
    update({ cast: state.cast.filter((p) => p.id !== id) });
    toast(t.profile.removed(tag));
  }

  return (
    <div className="p-grid">
      {entries.map((p) => (
        /* The tile stays a <div>: the open and delete controls are siblings,
           because a button inside a button is invalid and the delete target
           would swallow clicks meant for the tile. */
        <div key={p.id} className="p-tile">
          <button
            className="p-open"
            onClick={() => onOpen?.(p)}
            aria-label={t.profile.openLabel(p.tag)}
          >
            {p.img
              ? <img src={p.img} alt="" loading="lazy" />
              : <div className="p-no-image" aria-hidden="true">?</div>}
            <span className="p-tag">@{p.tag}</span>
            {!p.img && <span className="p-nophoto">{t.profile.noPhoto}</span>}
          </button>
          <button
            className="p-remove"
            onClick={() => remove(p.id, p.tag)}
            aria-label={t.profile.deleteLabel(p.tag)}
          >
            ×
          </button>
        </div>
      ))}

      <button className="p-tile p-new" onClick={onNew}>
        <span aria-hidden="true">+</span>
        <span className="p-tag">{t.profile.new}</span>
      </button>
    </div>
  );
}
