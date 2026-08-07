import { useAppState } from "../../state/AppState.jsx";
import { t } from "../../i18n/index.js";
import "./profile.css";

export default function AvatarList({ category, onNew }) {
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
          {p.img
            ? <img src={p.img} alt={t.profile.referenceFor(p.tag)} loading="lazy" />
            : <div className="p-no-image" aria-hidden="true">?</div>}
          <span className="p-tag">@{p.tag}</span>
          {/* Used to be a <div> with no focus — now a real button, so the
              tiles are keyboard-operable. */}
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
