import { useNavigate } from "react-router-dom";
import { useAppState } from "../state/AppState.jsx";
import { genId } from "../lib/storage.js";
import { bumpStreak } from "../lib/streak.js";
import { newCreature } from "../lib/creatures.js";
import { t } from "../i18n/index.js";
import Button from "../components/Button.jsx";
import "./wizard.css";

export default function Step6Result({ w }) {
  const { state, update, toast } = useAppState();
  const navigate = useNavigate();
  const urls = w.urls || [];
  const isFilm = w.mode === "film";

  function save() {
    const creature = newCreature(w.text);
    const references = Object.values(w.assignments)
      .filter((a) => a.avatar?.tag)
      .map((a) => ({ tag: a.avatar.tag, category: a.kind }));

    const entry = {
      id: genId("e"),
      createdAt: new Date().toISOString(),
      text: w.text,
      originalText: w.originalText || w.text,
      title: creature.title,
      mode: w.mode,
      style: w.styleId,
      format: w.format,
      imageCount: isFilm ? 1 : w.imageCount,
      media: { type: isFilm ? "video" : "image", urls, source: "api" },
      references,
      creatureId: creature.id,
    };

    update({
      journal: [...(state.journal || []), entry],
      creatures: [...(state.creatures || []), creature],
      ...bumpStreak(state),
    });
    toast(t.dream.caught(creature.name));
    navigate("/journal");
  }

  return (
    <section className="wiz-body">
      <h1 className="wiz-title">{t.wizard.step6.title}</h1>

      {urls.length === 0 ? (
        <p className="wiz-empty">{t.wizard.step6.nothing}</p>
      ) : (
        <div className={"wiz-result" + (w.format === "16:9" ? " wiz-result-wide" : "")}>
          {isFilm
            ? <video src={urls[0]} controls playsInline autoPlay loop />
            : urls.map((u, i) => <img key={i} src={u} alt="" loading="lazy" />)}
        </div>
      )}

      <Button onClick={save}>{t.wizard.step6.save}</Button>
    </section>
  );
}
