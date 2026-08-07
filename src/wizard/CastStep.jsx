import { useState } from "react";
import { useAppState } from "../state/AppState.jsx";
import { assignmentsOfKinds } from "./useWizard.js";
import { t } from "../i18n/index.js";
import Button from "../components/Button.jsx";
import AvatarDialog from "../components/AvatarDialog.jsx";
import "./wizard.css";

/* Shared by "who's in it" (people AND pets — the analysis tells them apart)
   and "where is it" (places): the mechanics are identical, only the wording
   and the kinds differ. */
export default function CastStep({
  w, patch, assign, dropAssignment,
  kinds, title, lede, emptyText, nextStep,
}) {
  const { state } = useAppState();
  const [pickerFor, setPickerFor] = useState(null);   // name awaiting a library choice
  const [createFor, setCreateFor] = useState(null);   // name awaiting a new avatar

  const items = assignmentsOfKinds(w.assignments, kinds);
  const isPlaces = kinds.includes("place");
  const library = (state.cast || []).filter((c) =>
    isPlaces ? c.category === "place" : c.category !== "place"
  );

  /** A freshly created avatar binds to the character that triggered the dialog. */
  function onCreated(avatar) {
    if (createFor) assign(createFor.name, { avatar, free: false });
    setCreateFor(null);
  }

  return (
    <section className="wiz-body">
      <h1 className="wiz-title">{title}</h1>
      <p className="wiz-lede">{lede}</p>

      {items.length === 0 ? (
        <p className="wiz-empty">{emptyText}</p>
      ) : (
        <div className="wiz-cast">
          {items.map((a) => (
            <div key={a.name} className={"wiz-person" + (a.avatar || a.free ? " wiz-person-set" : "")}>
              <div className="wiz-person-face">
                {a.avatar?.img
                  ? <img src={a.avatar.img} alt="" />
                  : <span aria-hidden="true">{a.free ? "✨" : a.kind === "pet" ? "🐾" : "?"}</span>}
              </div>

              <div className="wiz-person-body">
                <span className="wiz-person-name">{a.name}</span>
                <span className="wiz-person-state">
                  {a.avatar ? `@${a.avatar.tag}` : a.free ? t.wizard.cast.freeSet : t.wizard.cast.undecided}
                </span>
              </div>

              <div className="wiz-person-actions">
                <button className="wiz-mini" onClick={() => setPickerFor(a)}>
                  {a.avatar ? t.wizard.cast.change : t.wizard.cast.choose}
                </button>
                <button className="wiz-mini" onClick={() => setCreateFor(a)}>
                  {t.wizard.cast.createNew}
                </button>
                <button
                  className={"wiz-mini" + (a.free ? " wiz-mini-on" : "")}
                  onClick={() => assign(a.name, { free: !a.free, avatar: undefined })}
                  aria-pressed={!!a.free}
                >
                  {t.wizard.cast.letAi}
                </button>
                <button
                  className="wiz-mini wiz-mini-drop"
                  onClick={() => dropAssignment(a.name)}
                  aria-label={t.wizard.cast.removeLabel(a.name)}
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Button onClick={() => patch({ step: nextStep })}>{t.wizard.next}</Button>
      <p className="wiz-hint">{t.wizard.cast.note}</p>

      {pickerFor && (
        <LibraryPicker
          library={library}
          onPick={(avatar) => { assign(pickerFor.name, { avatar, free: false }); setPickerFor(null); }}
          onCreate={() => { setCreateFor(pickerFor); setPickerFor(null); }}
          onClose={() => setPickerFor(null)}
          name={pickerFor.name}
        />
      )}

      {createFor && (
        <AvatarDialog
          category={createFor.kind === "pet" ? "pet" : isPlaces ? "place" : "person"}
          suggestedName={createFor.name}
          suggestedDesc={createFor.hint || ""}
          onCreated={onCreated}
          onClose={() => setCreateFor(null)}
        />
      )}
    </section>
  );
}

function LibraryPicker({ library, onPick, onCreate, onClose, name }) {
  return (
    <div className="wiz-backdrop" onClick={onClose}>
      <div
        className="wiz-modal"
        role="dialog"
        aria-modal="true"
        aria-label={t.wizard.cast.pickTitle(name)}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="wiz-modal-title">{t.wizard.cast.pickTitle(name)}</h2>

        {library.length === 0 ? (
          <p className="wiz-empty">{t.wizard.cast.libraryEmpty}</p>
        ) : (
          <div className="wiz-lib">
            {library.map((c) => (
              <button key={c.id} className="wiz-lib-item" onClick={() => onPick(c)}>
                {c.img
                  ? <img src={c.img} alt="" />
                  : <span className="wiz-lib-blank" aria-hidden="true">?</span>}
                <span>@{c.tag}</span>
              </button>
            ))}
          </div>
        )}

        <div className="wiz-actions">
          <Button variant="ghost" onClick={onClose}>{t.wizard.cancel}</Button>
          <Button onClick={onCreate}>{t.wizard.cast.createNew}</Button>
        </div>
      </div>
    </div>
  );
}
