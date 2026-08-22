import { test, expect } from "bun:test";
import { checkinOn, setCheckin, sleepAverage, sleepNights, sleepByMood, SLEEP_LEVELS } from "./checkin.js";

/* Der Check-in ist winzig — aber er hängt an zwei Stellen, an denen dieses
   Projekt schon einmal geblutet hat: Kalendertage in Ortszeit (der
   Zeitzonen-Fehler vom 17.08.) und unbegrenzt wachsende Listen im
   localStorage. Beides wird hier festgenagelt. */

const d = (iso) => new Date(iso);

test("a fresh day has no check-in yet", () => {
  expect(checkinOn([], d("2026-08-21T07:00:00"))).toBe(null);
  expect(checkinOn(null, d("2026-08-21T07:00:00"))).toBe(null);
});

test("setting and reading back uses the same local day", () => {
  const list = setCheckin([], 2, d("2026-08-21T07:00:00"));
  expect(checkinOn(list, d("2026-08-21T23:30:00")).sleep).toBe(2);
});

/* ⚠ Die Falle vom 17.08.: Ein Traum um 00:30 Ortszeit liegt in UTC noch am
   Vortag. Wer den Tagesschlüssel über die UTC-Teile bildet, ordnet den
   Check-in dem falschen Tag zu — und das trifft ausgerechnet die Nacht,
   um die es geht.

   ⚠⚠ Dieser Test wird ZEITZONENUNABHÄNGIG geschrieben, und das ist der
   eigentliche Punkt: Die erste Fassung verglich schlicht mit "2026-08-21"
   und war damit in der CI wertlos — der Container läuft auf UTC, dort sind
   Ortszeit und UTC identisch, die Rot-Probe (Schlüssel über toISOString)
   lief glatt durch. Auf einem Rechner in Berlin hätte derselbe Test
   angeschlagen. Ein Test, der nur auf manchen Maschinen etwas bewacht,
   bewacht nichts. Deshalb wird hier die INVARIANTE geprüft: Der Schlüssel
   muss zu den LOKALEN Datumsfeldern passen — das gilt in jeder Zone. */
test("the day key follows local calendar fields, in any timezone", () => {
  for (const iso of ["2026-08-21T00:30:00", "2026-08-21T23:45:00", "2026-01-01T00:05:00"]) {
    const when = d(iso);
    const soll = `${when.getFullYear()}-${String(when.getMonth() + 1).padStart(2, "0")}-${String(when.getDate()).padStart(2, "0")}`;
    expect(setCheckin([], 3, when)[0].date).toBe(soll);
  }
});

test("a check-in just after midnight belongs to that new day, not the day before", () => {
  const kurzNachMitternacht = d("2026-08-21T00:30:00");
  const list = setCheckin([], 3, kurzNachMitternacht);
  // Derselbe Kalendertag → gefunden; der Tag davor → nicht.
  const gestern = new Date(kurzNachMitternacht);
  gestern.setDate(gestern.getDate() - 1);
  expect(checkinOn(list, kurzNachMitternacht)).not.toBe(null);
  expect(checkinOn(list, gestern)).toBe(null);
});

test("answering twice on one day replaces, never appends", () => {
  let list = setCheckin([], 1, d("2026-08-21T07:00:00"));
  list = setCheckin(list, 3, d("2026-08-21T08:00:00"));
  expect(list.length).toBe(1);
  expect(list[0].sleep).toBe(3);
});

test("an invalid level changes nothing", () => {
  const before = setCheckin([], 2, d("2026-08-21T07:00:00"));
  for (const bad of [0, 4, -1, 2.5, null, undefined, NaN, "viel", {}]) {
    expect(setCheckin(before, bad, d("2026-08-22T07:00:00"))).toEqual(before);
  }
});

/* Ein numerischer String IST gültig — und das ist kein Schlupfloch, sondern
   der Normalfall: Ein Knopf oder ein Radio liefert seinen Wert immer als
   String ("2"), nie als Zahl. Die erste Fassung dieses Tests verlangte das
   Gegenteil und hätte die Komponente gezwungen, vor jedem Aufruf selbst zu
   casten — eine Falle, die genau einmal vergessen wird. */
test("a numeric string is accepted — that is what a button hands over", () => {
  const list = setCheckin([], "3", d("2026-08-21T07:00:00"));
  expect(list).toEqual([{ date: "2026-08-21", sleep: 3 }]);
  expect(typeof list[0].sleep).toBe("number");
});

test("the list is capped — localStorage is shared with the whole journal", () => {
  let list = [];
  for (let i = 0; i < 450; i++) {
    const day = new Date("2025-01-01T07:00:00");
    day.setDate(day.getDate() + i);
    list = setCheckin(list, SLEEP_LEVELS[i % 3], day);
  }
  expect(list.length).toBe(400);
  // Gekappt wird das ÄLTESTE: der jüngste Eintrag muss überleben.
  expect(list[list.length - 1].date).toBe("2026-03-26");
});

test("the average covers only the window asked for", () => {
  const now = d("2026-08-21T09:00:00");
  let list = setCheckin([], 3, d("2026-08-20T07:00:00"));
  list = setCheckin(list, 1, d("2026-01-05T07:00:00"));   // weit draußen
  expect(sleepAverage(list, 30, now)).toBe(3);
  expect(sleepAverage([], 30, now)).toBe(null);
});

/* Schnitt und Anzahl stehen in der Atlas-Kachel NEBENEINANDER. Laufen sie
   über verschiedene Fenster, lügt die Kachel leise: „2,0 von 3 · 30 Nächte
   notiert", obwohl der Schnitt aus zweien stammt. Deshalb teilen sich beide
   dieselbe Filterung — hier festgenagelt. */
test("count and average always describe the same nights", () => {
  const now = d("2026-08-21T09:00:00");
  let list = setCheckin([], 3, d("2026-08-20T07:00:00"));
  list = setCheckin(list, 1, d("2026-08-19T07:00:00"));
  list = setCheckin(list, 1, d("2026-01-05T07:00:00"));   // weit draußen
  expect(sleepNights(list, 30, now)).toBe(2);
  expect(sleepAverage(list, 30, now)).toBe(2);
  expect(sleepNights(list, 365, now)).toBe(3);
  expect(sleepNights([], 30, now)).toBe(0);
});

/* Die Korrelation, für die der Check-in existiert. Die Stimmung kommt aus
   der ANALYSE, nicht aus einer zweiten Frage — deshalb ist sleepByMood die
   Stelle, an der Antons Entscheidung (nur eine Frage) sich beweist. */
test("mood comes from the analysis and lands on the matching sleep level", () => {
  const checkins = [
    ...setCheckin([], 3, d("2026-08-20T07:00:00")),
    ...setCheckin([], 1, d("2026-08-21T07:00:00")),
  ];
  const journal = [
    { id: "a", createdAt: "2026-08-20T06:30:00", analysis: { mood: "ruhig" } },
    { id: "b", createdAt: "2026-08-21T06:30:00", analysis: { mood: "aufgewühlt" } },
    { id: "c", createdAt: "2026-08-21T05:00:00", analysis: { mood: "aufgewühlt" } },
  ];
  const rows = sleepByMood(checkins, journal);
  expect(rows[0]).toEqual({ sleep: 3, moods: [{ mood: "ruhig", count: 1 }] });
  expect(rows[1]).toEqual({ sleep: 1, moods: [{ mood: "aufgewühlt", count: 2 }] });
});

test("dreams without a check-in on their day are simply left out", () => {
  const journal = [{ id: "a", createdAt: "2026-08-19T06:30:00", analysis: { mood: "ruhig" } }];
  expect(sleepByMood([], journal)).toEqual([]);
});

test("seed dreams never colour the correlation", () => {
  const checkins = setCheckin([], 2, d("2026-08-21T07:00:00"));
  const journal = [{ id: "e_seed1", createdAt: "2026-08-21T06:30:00", analysis: { mood: "ruhig" } }];
  expect(sleepByMood(checkins, journal)).toEqual([]);
});
