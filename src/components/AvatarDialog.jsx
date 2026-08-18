import { useRef, useState } from "react";
import { useAppState } from "../state/AppState.jsx";
import { genId } from "../lib/storage.js";
import { characterSheet, mediaUrl } from "../lib/api.js";
import { PRICES } from "../lib/pricing.js";
import { spend, canAfford } from "../lib/credits.js";
import { t } from "../i18n/index.js";
import Button from "./Button.jsx";
import { IconImages, IconSparkle } from "./icons.jsx";
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
  const { state, update, toast, openPaywall } = useAppState();
  const isEdit = Boolean(existing);

  const [tag, setTag] = useState(cleanTag(existing?.tag || suggestedName));
  const [desc, setDesc] = useState(existing?.desc || suggestedDesc);
  const [image, setImage] = useState(existing?.img || "");
  const [drawing, setDrawing] = useState(false);
  const fileRef = useRef(null);

  /* Die Gattung, und warum sie manchmal hier gewählt wird.
   *
   * Der Wizard weiß aus dem Zusammenhang, was er anlegt — er fragt beim
   * Personen-Schritt nach einer Person. Die Besetzungsliste weiß es nicht:
   * Sie hat seit 17.08. EINEN Anlegen-Knopf statt drei Kacheln.
   *
   * Das Signal ist deshalb das FEHLEN der Angabe, nicht ein zusätzlicher
   * Schalter: Wer `category` übergibt, bekommt alles wie bisher; wer nichts
   * übergibt, bekommt die Wahl. Ein eigener `pickCategory`-Schalter wäre
   * dieselbe Information zweimal — und die beiden könnten sich widersprechen. */
  const [kind, setKind] = useState(existing?.category || category || "person");
  const choosing = !isEdit && !isMe && !category;

  /* Der Charakterbogen. Ohne Foto reicht die Beschreibung als WORTE in
     jeden Bildauftrag, und der Renderer erfindet die Figur jedes Mal neu —
     eine Zehnerstrecke zeigt dann zehn verschiedene Menschen mit demselben
     Namen. Ein einmal erzeugtes Bild macht daraus eine Referenz, ab da
     läuft es über denselben Pfad wie ein echtes Foto.

     Erst NACH dem Rendern abgebucht, wie überall sonst: ein fehlgeschlagener
     Aufruf darf nichts kosten. */
  const sheetPrice = PRICES.characterSheet;
  async function drawCharacter() {
    const text = desc.trim();
    if (!text || drawing) return;
    if (!canAfford(state, sheetPrice)) return openPaywall("spent");
    setDrawing(true);
    try {
      const url = await characterSheet({ desc: text, category: existing?.category || category });
      setImage(mediaUrl(url));
      update(spend(state, sheetPrice));
    } catch (err) {
      toast(`⚠ ${err.message}`);
    }
    setDrawing(false);
  }

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

    const avatar = { id: genId("c"), tag: clean, category: kind, desc: desc.trim(), img: image };
    update({ cast: [...(state.cast || []), avatar] });
    toast(t.avatarDialog.created(clean));
    onCreated?.(avatar);
    onClose();
  }

  /* Löschen sitzt seit 17.08. hier statt an jeder Zeile der Liste. Vorher
     hing an jeder Kachel ein × — die einzige unumkehrbare Handlung, und
     zugleich das kontraststärkste Element darauf.
     Die Träume behalten ihre `references`: Dass eine Figur in einer Nacht
     vorkam, bleibt wahr, auch wenn man sie aus der Bibliothek nimmt. Alte
     Einträge dürfen sich nicht rückwirkend ändern. */
  function removeEntry() {
    update({ cast: (state.cast || []).filter((p) => p.id !== existing.id) });
    toast(t.profile.removed(existing.tag));
    onClose();
  }

  const title = isMe
    ? t.avatarDialog.meTitle
    : isEdit
      ? t.avatarDialog.editTitleFor[existing.category] || t.avatarDialog.editTitleFor.person
      : t.avatarDialog.titleFor[kind];

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

        {/* Steht VOR dem Namen, weil es die Überschrift mitbestimmt: Erst
            entscheidet sich, was angelegt wird, dann wie es heißt. */}
        {choosing && (
          <div className="av-field">
            <span>{t.avatarDialog.kindLabel}</span>
            <div className="av-kinds" role="radiogroup" aria-label={t.avatarDialog.kindLabel}>
              {["person", "pet", "place"].map((id) => (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={kind === id}
                  className={"av-kind" + (kind === id ? " av-kind-on" : "")}
                  onClick={() => setKind(id)}
                >
                  {t.avatarDialog.kindFor[id]}
                </button>
              ))}
            </div>
          </div>
        )}

        <label className="av-field">
          <span>{t.avatarDialog.nameLabel(cleanTag(tag) || "…")}</span>
          <input value={tag} onChange={(e) => setTag(e.target.value)} maxLength={20} autoFocus />
        </label>

        {/* The native file input is invisible on purpose — every browser
            draws its own "Choose File" chrome for it, which is exactly the
            thing that read as out of place here. It still does the actual
            picking; the button just proxies the click onto it. */}
        <div className="av-field">
          <span>{t.avatarDialog.photoLabel}</span>

          {image ? (
            <div className="av-photo-set">
              <img className="av-preview" src={image} alt={t.avatarDialog.previewAlt} />
              <div className="av-photo-row">
                <button type="button" className="av-photo-btn" onClick={() => fileRef.current?.click()}>
                  {t.avatarDialog.photoReplace}
                </button>
                <button
                  type="button" className="av-photo-btn av-photo-btn-ghost"
                  onClick={() => setImage("")}
                >
                  {t.avatarDialog.photoRemove}
                </button>
              </div>
            </div>
          ) : (
            <>
              <button type="button" className="av-upload" onClick={() => fileRef.current?.click()}>
                <IconImages />
                <span>{t.avatarDialog.photoAdd}</span>
              </button>

              {/* Erscheint erst, wenn es etwas zu zeichnen GIBT. Vorher wäre
                  es ein Knopf, der nur „beschreib erst mal" sagen kann. */}
              {desc.trim().length >= 10 && (
                <button type="button" className="av-draw" onClick={drawCharacter} disabled={drawing}>
                  <IconSparkle />
                  <span className="av-draw-body">
                    <span>{drawing ? t.avatarDialog.drawingNow : t.avatarDialog.drawFromDesc}</span>
                    <small>{t.avatarDialog.drawHint}</small>
                  </span>
                  <span className="av-draw-price">{sheetPrice} {t.wizard.creditsN(sheetPrice)}</span>
                </button>
              )}
            </>
          )}

          <input
            ref={fileRef}
            className="av-file-hidden"
            type="file"
            accept="image/*"
            onChange={readFile}
            tabIndex={-1}
            aria-hidden="true"
          />
        </div>

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

        {/* Getrennt von Abbrechen und Speichern, unter einer Linie und ohne
            Fläche: Es ist die einzige Handlung hier, die sich nicht
            zurücknehmen lässt, und sie soll nicht neben dem Speichern-Knopf
            unter dem Daumen liegen. `isMe` bekommt sie nie — das eigene
            Porträt gibt es genau einmal und es wird geändert, nicht gelöscht. */}
        {isEdit && !isMe && (
          <button className="av-delete" onClick={removeEntry}>
            {t.avatarDialog.delete}
          </button>
        )}
      </div>
    </div>
  );
}
