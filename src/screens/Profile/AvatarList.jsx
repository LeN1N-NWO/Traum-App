import { useAppState } from "../../state/AppState.jsx";
import { t } from "../../i18n/index.js";
import "./profile.css";

export default function AvatarList({ category, onNew, onEdit }) {
  const { state, update, toast } = useAppState();
  const entries = (state.cast || []).filter((p) => p.category === category);

  function remove(id, tag) {
    update({ cast: state.cast.filter((p) => p.id !== id) });
    toast(t.profile.removed(tag));
  }

  return (
    <div className="p-grid">
      {entries.map((p) => (
        <div key={p.id} className="p-tile">
          {/* The tile body is its own button so the delete button can sit
              beside it — a button inside a button is invalid HTML. */}
          <button className="p-tile-open" onClick={() => onEdit(p)} aria-label={t.profile.editLabel(p.tag)}>
            {p.img
              ? <img src={p.img} alt="" loading="lazy" />
              : <span className="p-no-image" aria-hidden="true">?</span>}
            <span className="p-tag">@{p.tag}</span>
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
