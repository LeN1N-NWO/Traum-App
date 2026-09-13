import { test, expect } from "bun:test";
import {
  reminderWish, mayAskForPermission, reminderState, reminderAnswered,
  MAX_PER_DAY, DEFAULT_PER_DAY,
} from "./reminders.js";

/* Diese Datei bewacht EINE Sache: dass der Wunsch nie zur Erlaubnis wird.
   iOS gibt einen einzigen Versuch — ein verhörtes „ja" im Sprachgespräch
   darf ihn nicht verbrauchen. Alle Tests unten sind Varianten davon. */

test("a wish is recorded, never granted", () => {
  const w = reminderWish(true, 3);
  expect(w).toEqual({ wants: true, perDay: 3, askedAt: null });
  // ⚠ Das Feld darf gar nicht erst existieren — sonst liest es jemand als „ja".
  expect("granted" in w).toBe(false);
});

test("no answer, no record", () => {
  expect(reminderWish(undefined, 2)).toBe(null);
  expect(reminderWish("ja", 2)).toBe(null);
  expect(reminderWish(null, 2)).toBe(null);
});

test("a no means none per day, not the default", () => {
  expect(reminderWish(false, 3)).toEqual({ wants: false, perDay: 0, askedAt: null });
});

test("a missing or silly number falls back instead of failing", () => {
  for (const bad of [undefined, null, 0, -1, 99, NaN, "drei"]) {
    expect(reminderWish(true, bad).perDay).toBe(DEFAULT_PER_DAY);
  }
  expect(reminderWish(true, MAX_PER_DAY).perDay).toBe(MAX_PER_DAY);
  expect(reminderWish(true, 2.6).perDay).toBe(3);   // gerundet, nicht abgelehnt
});

/* Der Kern: Ohne ausdrücklichen Wunsch darf der Systemdialog NIE kommen.
   Das ist die ganze Begründung der Vorab-Frage — wer hier lockert,
   verbrennt den einen Versuch bei Leuten, die nie Ja gesagt haben. */
test("without a spoken yes the system dialog stays shut", () => {
  expect(mayAskForPermission(null)).toBe(false);
  expect(mayAskForPermission({})).toBe(false);
  expect(mayAskForPermission(reminderWish(false))).toBe(false);
  expect(mayAskForPermission(reminderWish(true))).toBe(true);
});

test("the dialog is offered exactly once — a second call would do nothing on iOS", () => {
  const nachNein = reminderAnswered(reminderWish(true, 2), false);
  expect(mayAskForPermission(nachNein)).toBe(false);
  const nachJa = reminderAnswered(reminderWish(true, 2), true);
  expect(mayAskForPermission(nachJa)).toBe(false);
});

/* askedAt beantwortet „wurde schon gefragt?", nicht „wurde abgelehnt?".
   Wer das verwechselt, bietet nach einem Ja denselben Dialog noch einmal an. */
test("asking is recorded even when the answer was yes", () => {
  const w = reminderAnswered(reminderWish(true, 2), true, 1000);
  expect(w.askedAt).toBe(1000);
  expect(w.granted).toBe(true);
});

test("the button knows all four states apart", () => {
  expect(reminderState(null)).toBe("hidden");
  expect(reminderState(reminderWish(false))).toBe("hidden");
  expect(reminderState(reminderWish(true, 2))).toBe("ask");
  expect(reminderState(reminderAnswered(reminderWish(true, 2), false))).toBe("blocked");
  expect(reminderState(reminderAnswered(reminderWish(true, 2), true))).toBe("on");
});

test("an answer without a prior wish still records — the tap itself is consent", () => {
  const w = reminderAnswered(null, true, 500);
  expect(w.wants).toBe(true);
  expect(w.granted).toBe(true);
  expect(w.askedAt).toBe(500);
});

/* ── Der Plan (13.09.2026) ─────────────────────────────────────────── */
import { reminderPlan, setReminder, realityTimes, shouldAutoRecord, needsNotifications, parseTime, DEFAULT_TIMES, REALITY_WINDOW } from "./reminders.js";

test("morning and evening start off, auto-record starts on", () => {
  const p = reminderPlan(null);
  expect(p.morning).toEqual({ on: false, time: DEFAULT_TIMES.morning });
  expect(p.evening).toEqual({ on: false, time: DEFAULT_TIMES.evening });
  expect(p.reality).toEqual({ on: false, perDay: 0 });
  expect(p.autoRecord).toBe(true);
  expect(needsNotifications(null)).toBe(false);
});

test("a setting changes only what it names, and a bad time keeps the old one", () => {
  let r = setReminder(null, "morning", { on: true });
  expect(reminderPlan(r).morning).toEqual({ on: true, time: "07:30" });
  r = setReminder(r, "morning", { time: "25:99" });
  expect(reminderPlan(r).morning).toEqual({ on: true, time: "07:30" });
  r = setReminder(r, "morning", { time: "06:45" });
  expect(reminderPlan(r).morning.time).toBe("06:45");
  expect(reminderPlan(r).evening.on).toBe(false);
  expect(needsNotifications(r)).toBe(true);
  expect(parseTime("06:45", "07:30")).toEqual({ hour: 6, minute: 45 });
});

test("reality checks stay inside the window, in order, the same for the same day", () => {
  for (const n of [1, 2, 3, 4]) {
    const a = realityTimes(n, "2026-09-13");
    expect(a.length).toBe(n);
    expect(realityTimes(n, "2026-09-13")).toEqual(a);
    let last = -1;
    for (const t of a) {
      const m = t.hour * 60 + t.minute;
      expect(m).toBeGreaterThanOrEqual(REALITY_WINDOW.from * 60);
      expect(m).toBeLessThan(REALITY_WINDOW.to * 60);
      expect(m).toBeGreaterThan(last);
      last = m;
    }
  }
  expect(realityTimes(0, "x")).toEqual([]);
});

test("auto-record: mornings only, once a day, never after a dream was written", () => {
  const at = (h) => new Date(2026, 8, 13, h, 5);
  const base = { todayKey: "2026-09-13", hasEntryToday: false };
  expect(shouldAutoRecord(null, { ...base, now: at(3) })).toBe(true);
  expect(shouldAutoRecord(null, { ...base, now: at(10) })).toBe(true);
  expect(shouldAutoRecord(null, { ...base, now: at(11) })).toBe(false);
  expect(shouldAutoRecord(null, { ...base, now: at(2) })).toBe(false);
  expect(shouldAutoRecord(null, { ...base, now: at(7), hasEntryToday: true })).toBe(false);
  expect(shouldAutoRecord({ lastAutoOpen: "2026-09-13" }, { ...base, now: at(7) })).toBe(false);
  expect(shouldAutoRecord({ autoRecord: false }, { ...base, now: at(7) })).toBe(false);
});
