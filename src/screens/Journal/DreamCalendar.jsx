import { useMemo, useState } from "react";
import { useAppState } from "../../state/AppState.jsx";
import { dreamsByDay, monthCells, localDateKey } from "../../lib/dreamDays.js";
import { t } from "../../i18n/index.js";
import Card from "../../components/Card.jsx";
import JournalCard from "./JournalCard.jsx";
import "./journal.css";

/* Which nights left a dream behind — and the way back into them.
 *
 * This sits in the Journal and not in the profile because what it marks IS
 * the journal: a lit square is a dream, and tapping it opens that dream.
 * As a profile widget it could only ever be a statistic to look at.
 */
export default function DreamCalendar({ onOpen }) {
  const { state } = useAppState();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [picked, setPicked] = useState(null);   // only set for days with several

  const byDay = useMemo(() => dreamsByDay(state.journal), [state.journal]);
  const cells = monthCells(year, month);
  const todayKey = localDateKey(now);

  function shift(by) {
    const d = new Date(year, month + by, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
    setPicked(null);   // a day from the old month must not stay open
  }

  /* One dream on that night opens straight away — that is the whole point of
   * tapping it. Several need a choice first, and it is shown directly under
   * the grid so the answer does not appear somewhere off-screen. */
  function pick(key) {
    const list = byDay.get(key);
    if (!list) return;
    if (list.length === 1) return onOpen(list[0].id);
    setPicked(key === picked ? null : key);
  }

  const atCurrentMonth = year === now.getFullYear() && month === now.getMonth();
  const pickedList = (picked && byDay.get(picked)) || [];

  return (
    /* No heading above it: the month name says what this is, and a second
       line of chrome is exactly the weight this thing should not have. The
       name only survives for screen readers. */
    <Card as="section" className="j-cal" aria-label={t.journal.calendar}>
      <div className="j-cal-head">
        <button className="j-cal-nav" onClick={() => shift(-1)} aria-label={t.journal.calPrev} data-flip>‹</button>
        <span className="j-cal-title">{t.journal.calMonths[month]} {year}</span>
        <button className="j-cal-nav" onClick={() => shift(1)}
                disabled={atCurrentMonth} aria-label={t.journal.calNext} data-flip>›</button>
      </div>

      <div className="j-cal-grid" role="grid" aria-label={t.journal.calLabel}>
        {t.journal.calWeekdays.map((wd) => (
          <span key={wd} className="j-cal-wd" role="columnheader">{wd}</span>
        ))}
        {cells.map((day, i) => {
          if (!day) return <span key={`pad${i}`} aria-hidden="true" />;
          const key = localDateKey(new Date(year, month, day));
          const list = byDay.get(key);
          const cls = "j-cal-day"
            + (list ? " j-cal-dreamt" : "")
            + (key === todayKey ? " j-cal-today" : "")
            + (key === picked ? " j-cal-picked" : "");

          // An empty day is not a control: nothing happens when it is
          // pressed, so it must not take focus or announce itself as one.
          if (!list) return <span key={key} className={cls}>{day}</span>;

          return (
            <button key={key} className={cls} onClick={() => pick(key)}
                    aria-label={t.journal.calDreamt(day, list.length)}
                    aria-expanded={list.length > 1 ? key === picked : undefined}>
              {day}
            </button>
          );
        })}
      </div>

      {pickedList.length > 1 && (
        <div className="j-cal-day-list">
          <p className="j-cal-day-lede">{t.journal.calSeveral(pickedList.length)}</p>
          {pickedList.map((e) => (
            <JournalCard key={e.id} entry={e} onOpen={onOpen} variant="row" />
          ))}
        </div>
      )}
    </Card>
  );
}
