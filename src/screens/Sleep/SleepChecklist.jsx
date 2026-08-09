import { useAppState } from "../../state/AppState.jsx";
import { localDateKey } from "../../lib/dreamDays.js";
import { t } from "../../i18n/index.js";
import "./sleep.css";

/* The wind-down checklist — tick the steps off as tonight's ritual.
 *
 * The ticks belong to ONE night: they are stored with today's local date and
 * an entry from any other date reads as empty, so the list resets itself
 * every day without a timer. Content lives in i18n like all copy; the steps
 * follow the sleep-hygiene evidence (light, temperature, timing, PMR,
 * breathing) rather than folklore.
 *
 * Redesigned 09.08.2026 after the Hatch reference: a grid of calm cards,
 * each with its own soft-lit glyph, instead of a row list — a ritual reads
 * better as a set of small altars than as a to-do list. A done card dims
 * and folds its text away: finished steps should stop asking for the eye,
 * that is the whole reward.
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

      <div className="sl-grid">
        {items.map((it) => {
          const done = saved.includes(it.id);
          return (
            <button key={it.id}
                    className={"sl-card" + (done ? " sl-card-done" : "")}
                    onClick={() => toggle(it.id)}
                    aria-pressed={done}>
              <span className="sl-card-tick" aria-hidden="true">✓</span>
              <span className="sl-card-art" aria-hidden="true">{GLYPHS[it.id] || GLYPHS.light}</span>
              <span className="sl-card-title">{it.title}</span>
              <span className="sl-card-text">{it.text}</span>
            </button>
          );
        })}
      </div>

      <p className="sl-hint">{t.sleep.checklist.hint}</p>
    </div>
  );
}

/* One glyph per ritual step, same stroke family as icons.jsx but local:
   nothing else in the app wants a showerhead. Keyed by the item ids from
   i18n — a translation may reword a step but never renames its id. */
const glyph = (children) => (
  <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor"
       strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

const GLYPHS = {
  light: glyph(<>
    <path d="M9 18h6M10.5 21h3" />
    <path d="M12 3a6.2 6.2 0 0 0-3.4 11.4c.8.55 1.4 1.4 1.4 2.6h4c0-1.2.6-2.05 1.4-2.6A6.2 6.2 0 0 0 12 3Z" />
  </>),
  shower: glyph(<>
    <path d="M7 9a5 5 0 0 1 10 0" />
    <path d="M12 4V2.8M4.5 13.5l.9-.9M19.5 13.5l-.9-.9" opacity=".6" />
    <path d="M8 13.2c0 1.2 1 1.8 1 3a1.6 1.6 0 0 1-3.2 0c0-1.2 1-1.8 1.1-3 .05-.5 1.05-.5 1.1 0Z" />
    <path d="M17.1 13.2c0 1.2 1 1.8 1 3a1.6 1.6 0 0 1-3.2 0c0-1.2 1-1.8 1.1-3 .05-.5 1.05-.5 1.1 0Z" />
    <path d="M12.6 17.2c0 1.2 1 1.8 1 3a1.6 1.6 0 0 1-3.2 0c0-1.2 1-1.8 1.1-3 .05-.5 1.05-.5 1.1 0Z" />
  </>),
  cool: glyph(<>
    <path d="M10 14.2V5a2 2 0 0 1 4 0v9.2a3.6 3.6 0 1 1-4 0Z" />
    <path d="M12 11v6" />
    <circle cx="12" cy="17.6" r="1.3" />
  </>),
  caffeine: glyph(<>
    <path d="M4.5 9h11v6.5a4 4 0 0 1-4 4h-3a4 4 0 0 1-4-4Z" />
    <path d="M15.5 10.5h1.8a2.2 2.2 0 0 1 0 4.4h-1.8" />
    <path d="m3.5 3.5 17 17" />
  </>),
  screens: glyph(<>
    <rect x="7" y="3.5" width="10" height="17" rx="2.2" />
    <path d="M10.5 6h3" opacity=".6" />
    <path d="m9.8 12.9 1.7 1.7 3.2-3.6" />
  </>),
  relax: glyph(<>
    <circle cx="12" cy="6" r="2.4" />
    <path d="M5 13.5c2.2 1.6 4.5 2.4 7 2.4s4.8-.8 7-2.4" />
    <path d="M6.5 19c1.8 1 3.6 1.5 5.5 1.5s3.7-.5 5.5-1.5" opacity=".55" />
  </>),
  breathe: glyph(<>
    <path d="M3.5 8.5h9a2.5 2.5 0 1 0-2.4-3.2" />
    <path d="M3.5 12.5h13.7a2.8 2.8 0 1 1-2.6 3.7" opacity=".8" />
    <path d="M3.5 16.5h6.2a2.2 2.2 0 1 1-2.1 2.9" opacity=".55" />
  </>),
};
