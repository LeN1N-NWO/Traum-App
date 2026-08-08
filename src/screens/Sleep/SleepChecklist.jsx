import { useAppState } from "../../state/AppState.jsx";
import { localDateKey } from "../../lib/dreamDays.js";
import { t } from "../../i18n/index.js";
import Card from "../../components/Card.jsx";
import "./sleep.css";

/* The wind-down checklist — tick the steps off as tonight's ritual.
 *
 * The ticks belong to ONE night: they are stored with today's local date and
 * an entry from any other date reads as empty, so the list resets itself
 * every day without a timer. Content lives in i18n like all copy; the steps
 * follow the sleep-hygiene evidence (light, temperature, timing, PMR,
 * breathing) rather than folklore.
 */
export default function SleepChecklist() {
  const { state, update } = useAppState();

  const today = localDateKey(new Date());
  const saved = state.sleepCheck?.date === today ? state.sleepCheck.done : [];
  const items = t.sleep.checklist.items;

  function toggle(id) {
    const done = saved.includes(id) ? saved.filter((d) => d !== id) : [...saved, id];
    update({ sleepCheck: { date: today, done } });
  }

  return (
    <div className="sl-checklist">
      <p className="sl-lede">{t.sleep.checklist.lede}</p>

      <div className="sl-progress" role="progressbar"
           aria-valuenow={saved.length} aria-valuemin={0} aria-valuemax={items.length}
           aria-label={t.sleep.checklist.progressLabel}>
        {items.map((it) => (
          <span key={it.id} className={"sl-progress-seg" + (saved.includes(it.id) ? " sl-progress-on" : "")} />
        ))}
      </div>
      <p className="sl-progress-text">{t.sleep.checklist.remaining(items.length - saved.length)}</p>

      {items.map((it) => {
        const done = saved.includes(it.id);
        return (
          <Card as="button" key={it.id}
                className={"sl-check" + (done ? " sl-check-done" : "")}
                onClick={() => toggle(it.id)}
                aria-pressed={done}>
            <span className="sl-check-dot" aria-hidden="true">{done ? "✓" : ""}</span>
            <span className="sl-check-body">
              <span className="sl-check-title">{it.title}</span>
              <span className="sl-check-text">{it.text}</span>
            </span>
          </Card>
        );
      })}

      <p className="sl-hint">{t.sleep.checklist.hint}</p>
    </div>
  );
}
