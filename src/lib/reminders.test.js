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
