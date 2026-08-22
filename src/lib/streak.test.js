import { test, expect } from "bun:test";
import { bumpStreak, refreshStreak, todayStr, weightedRarities, streakAtRisk, STREAK_CAP } from "./streak.js";
import { RARITIES } from "./creatures.js";

const today = todayStr();
const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
const lastWeek = new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10);

test("the very first dream starts the streak at 1", () => {
  expect(bumpStreak({ streak: 0, lastDream: null })).toEqual({ streak: 1, lastDream: today });
});

test("a dream on consecutive days counts up", () => {
  expect(bumpStreak({ streak: 3, lastDream: yesterday })).toEqual({ streak: 4, lastDream: today });
});

test("a second dream the same day changes nothing", () => {
  expect(bumpStreak({ streak: 4, lastDream: today })).toEqual({ streak: 4, lastDream: today });
});

test("a gap restarts the streak", () => {
  expect(bumpStreak({ streak: 9, lastDream: lastWeek })).toEqual({ streak: 1, lastDream: today });
});

test("refreshStreak resets a broken streak", () => {
  expect(refreshStreak({ streak: 9, lastDream: lastWeek }).streak).toBe(0);
});

test("refreshStreak leaves a running streak alone", () => {
  expect(refreshStreak({ streak: 3, lastDream: yesterday }).streak).toBe(3);
});

/* Die Serie belohnt, sie bestraft nicht — deshalb pruefen diese Zeilen vor
   allem, dass NICHTS schlechter wird. */
test("without a streak the odds are untouched", () => {
  expect(weightedRarities(RARITIES, 0)).toBe(RARITIES);
});

test("a streak shifts weight from Common to everything rarer", () => {
  const w = weightedRarities(RARITIES, STREAK_CAP);
  expect(w[0][2]).toBeLessThan(RARITIES[0][2]);          // Common seltener
  for (let i = 1; i < w.length; i++) {
    expect(w[i][2]).toBeGreaterThan(RARITIES[i][2]);     // alles andere haeufiger
  }
});

test("the odds still add up to a hundred", () => {
  for (const s of [0, 3, 7, 14, 40]) {
    const total = weightedRarities(RARITIES, s).reduce((a, r) => a + r[2], 0);
    expect(total).toBeCloseTo(100, 6);
  }
});

test("the order of rarities never inverts", () => {
  // Sonst waere „Legendary" haeufiger als „Rare" und das Wort wertlos.
  for (const s of [0, 5, 14, 100]) {
    const w = weightedRarities(RARITIES, s);
    for (let i = 1; i < w.length - 1; i++) {
      expect(w[i][2]).toBeGreaterThan(w[i + 1][2]);
    }
  }
});

test("the reward caps — a month-long streak is not better than two weeks", () => {
  expect(weightedRarities(RARITIES, 40)).toEqual(weightedRarities(RARITIES, STREAK_CAP));
});

test("at risk only on the one day a hint would help", () => {
  const heute = "2026-08-16";
  const gestern = "2026-08-15";
  expect(streakAtRisk({ lastDream: gestern, streak: 3 }, heute)).toBe(true);
  expect(streakAtRisk({ lastDream: heute, streak: 3 }, heute)).toBe(false);   // schon geschrieben
  expect(streakAtRisk({ lastDream: "2026-08-13", streak: 3 }, heute)).toBe(false); // laengst vorbei
  expect(streakAtRisk({ lastDream: gestern, streak: 0 }, heute)).toBe(false); // nichts zu halten
  expect(streakAtRisk({}, heute)).toBe(false);
});

/* ── Die Schlummernacht (Antons Ja vom 22.08., Plan §6) ──────────────────
   Sie ist das Netz unter der Serie. Wenn sie falsch rechnet, passiert genau
   das, was sie verhindern soll: Jemand verliert eine Serie, die er sich
   verdient hat — oder er behält eine, die längst gerissen ist. */
import { snoozeCheck, nextSnoozeIn, SNOOZE_EVERY, SNOOZE_MAX } from "./streak.js";

const tag = (iso) => iso;   // Lesbarkeit: Tagesschlüssel sind Strings

test("jede siebte Nacht bringt eine Schlummernacht, höchstens zwei", () => {
  // Serie 6 → 7: verdient.
  const s6 = { streak: 6, lastDream: "2026-08-21", snoozes: 0 };
  // bumpStreak rechnet gegen HEUTE, also wird der Zustand relativ gebaut.
  const heute = todayStr();
  const gestern = new Date(new Date(heute) - 864e5).toISOString().slice(0, 10);
  expect(bumpStreak({ ...s6, lastDream: gestern }).snoozes).toBe(1);
  // Serie 13 → 14: die zweite.
  expect(bumpStreak({ streak: 13, lastDream: gestern, snoozes: 1 }).snoozes).toBe(2);
  // Serie 20 → 21 mit vollem Vorrat: bleibt bei zwei.
  expect(bumpStreak({ streak: 20, lastDream: gestern, snoozes: SNOOZE_MAX }).snoozes).toBe(SNOOZE_MAX);
  // Eine Nacht, die keine Siebte ist, bringt nichts.
  expect(bumpStreak({ streak: 3, lastDream: gestern, snoozes: 1 }).snoozes).toBeUndefined();
});

test("eine verpasste Nacht wird überbrückt, die Serie lebt", () => {
  const zustand = { streak: 9, lastDream: "2026-08-20", snoozes: 1 };
  const rettung = snoozeCheck(zustand, tag("2026-08-22"));
  expect(rettung.used).toBe(1);
  expect(rettung.patch).toEqual({ lastDream: "2026-08-21", snoozes: 0 });
  // Danach ist die Lücke geschlossen: kein zweiter Zugriff.
  expect(snoozeCheck({ ...zustand, ...rettung.patch }, tag("2026-08-22"))).toBe(null);
});

test("ohne Lücke passiert nichts", () => {
  expect(snoozeCheck({ streak: 5, lastDream: "2026-08-22", snoozes: 2 }, tag("2026-08-22"))).toBe(null);
  expect(snoozeCheck({ streak: 5, lastDream: "2026-08-21", snoozes: 2 }, tag("2026-08-22"))).toBe(null);
});

/* ⚠ Keine Teilrettung: Zwei fehlende Nächte mit nur einer Schlummernacht
   verbrauchen sie NICHT. Sie zu opfern und die Serie trotzdem zu verlieren
   wäre der schlechteste aller Ausgänge. */
test("reicht der Vorrat nicht für alle Lücken, wird nichts verbraucht", () => {
  expect(snoozeCheck({ streak: 9, lastDream: "2026-08-19", snoozes: 1 }, tag("2026-08-22"))).toBe(null);
  // Mit zweien reicht es genau.
  const rettung = snoozeCheck({ streak: 9, lastDream: "2026-08-19", snoozes: 2 }, tag("2026-08-22"));
  expect(rettung).toEqual({ used: 2, patch: { lastDream: "2026-08-21", snoozes: 0 } });
});

test("ohne Vorrat, ohne Serie oder ohne Datum gibt es nichts zu retten", () => {
  expect(snoozeCheck({ streak: 9, lastDream: "2026-08-20", snoozes: 0 }, tag("2026-08-22"))).toBe(null);
  expect(snoozeCheck({ streak: 0, lastDream: "2026-08-20", snoozes: 2 }, tag("2026-08-22"))).toBe(null);
  expect(snoozeCheck({ streak: 9, snoozes: 2 }, tag("2026-08-22"))).toBe(null);
  expect(snoozeCheck(null, tag("2026-08-22"))).toBe(null);
});

test("der Weg zur nächsten Schlummernacht zählt rückwärts", () => {
  expect(nextSnoozeIn({ streak: 0, snoozes: 0 })).toBe(SNOOZE_EVERY);
  expect(nextSnoozeIn({ streak: 5, snoozes: 0 })).toBe(2);
  expect(nextSnoozeIn({ streak: 8, snoozes: 1 })).toBe(6);
  // Voller Vorrat: kein Weg mehr, es gibt nichts zu holen.
  expect(nextSnoozeIn({ streak: 5, snoozes: SNOOZE_MAX })).toBe(null);
});
