import { useMemo, useState } from "react";
import { useAppState } from "../../state/AppState.jsx";
import { dreamDays, monthCells, localDateKey } from "../../lib/dreamDays.js";
import { t } from "../../i18n/index.js";
import Card from "../../components/Card.jsx";
import "./profile.css";

/* Which nights left a dream behind — the first statistics view.
 * Data comes straight from the journal; there is nothing extra to store. */
export default function DreamCalendar() {
  const { state } = useAppState();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const days = useMemo(() => dreamDays(state.journal), [state.journal]);
  const cells = monthCells(year, month);
  const todayKey = localDateKey(now);

  function shift(by) {
    const d = new Date(year, month + by, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  }

  const atCurrentMonth = year === now.getFullYear() && month === now.getMonth();

  return (
    <Card className="p-cal">
      <div className="p-cal-head">
        <button className="p-cal-nav" onClick={() => shift(-1)} aria-label={t.profile.calPrev}>‹</button>
        <span className="p-cal-title">{t.profile.calMonths[month]} {year}</span>
        <button className="p-cal-nav" onClick={() => shift(1)}
                disabled={atCurrentMonth} aria-label={t.profile.calNext}>›</button>
      </div>

      <div className="p-cal-grid" role="grid" aria-label={t.profile.calLabel}>
        {t.profile.calWeekdays.map((wd) => (
          <span key={wd} className="p-cal-wd" role="columnheader">{wd}</span>
        ))}
        {cells.map((day, i) => {
          if (!day) return <span key={`pad${i}`} aria-hidden="true" />;
          const key = localDateKey(new Date(year, month, day));
          const dreamt = days.has(key);
          return (
            <span key={key}
                  className={"p-cal-day" + (dreamt ? " p-cal-dreamt" : "") + (key === todayKey ? " p-cal-today" : "")}
                  aria-label={dreamt ? t.profile.calDreamt(day) : undefined}>
              {day}
            </span>
          );
        })}
      </div>
    </Card>
  );
}
