import { expect, test } from "bun:test";
import { dayKey, dreamNightCount, missedNights, snoozeBridge, snoozeEarn, streakInfo } from "./nights.js";

// Ein Tag in Ortszeit, als Datum mit Uhrzeit.
const at = (day, time = "08:00") => new Date(`${day}T${time}:00`);
const dream = (day, time) => ({ id: `e${day}${time || ""}`, createdAt: at(day, time).toISOString(), text: "a dream" });
const blank = (day) => ({ id: `b${day}`, createdAt: at(day).toISOString(), kind: "blank" });
const NOW = at("2026-09-28", "10:00");

test("sieben Träume an einem Tag sind EIN Tag; Beispielträume zählen nicht", () => {
  const j = [dream("2026-09-28", "07:00"), dream("2026-09-28", "07:30"), dream("2026-09-28", "09:00"), { id: "e_seed_1", createdAt: at("2026-09-27").toISOString() }];
  expect(dreamNightCount(j)).toBe(1);
});

test("„Nichts hängengeblieben“ ist kein Traum — hält aber die Serie offen", () => {
  expect(dreamNightCount([blank("2026-09-28")])).toBe(0);
  const j = [dream("2026-09-25"), dream("2026-09-26"), blank("2026-09-27"), dream("2026-09-28")];
  expect(streakInfo(j, { now: NOW })).toEqual({ streak: 3, atRisk: false, today: true });
});

test("heute noch nichts: die Serie zählt bis gestern und steht auf der Kippe", () => {
  const j = [dream("2026-09-26"), dream("2026-09-27")];
  expect(streakInfo(j, { now: NOW })).toEqual({ streak: 2, atRisk: true, today: false });
  expect(streakInfo([dream("2026-09-25")], { now: NOW }).streak).toBe(0);
});

test("Ortszeit: ein Traum um 1 Uhr nachts gehört zu seinem eigenen Tag", () => {
  expect(dayKey(at("2026-09-28", "01:00"))).toBe("2026-09-28");
});

test("Schlummernacht: schließt die Lücke nur, wenn der Vorrat reicht — und nur einmal", () => {
  const j = [dream("2026-09-25"), dream("2026-09-26")];
  expect(missedNights(j, { now: NOW })).toEqual(["2026-09-27"]);
  const s = { journal: j, snoozes: 1 };
  const used = snoozeBridge(s, NOW);
  expect(used).toEqual({ used: 1, patch: { snoozeDays: ["2026-09-27"], snoozes: 0 } });
  const after = { ...s, ...used.patch };
  expect(snoozeBridge(after, NOW)).toBeNull();
  expect(streakInfo(j, { bridged: after.snoozeDays, now: NOW })).toMatchObject({ streak: 2, atRisk: true });
  expect(snoozeBridge({ journal: [dream("2026-09-24")], snoozes: 1 }, NOW)).toBeNull();    // zwei Nächte fehlen, eine liegt da
});

test("je sieben Traum-Tage eine Schlummernacht, höchstens zwei, einmal am Tag", () => {
  expect(snoozeEarn({ snoozes: 0 }, 7, NOW)).toEqual({ patch: { snoozes: 1, snoozeEarnedDay: "2026-09-28" } });
  expect(snoozeEarn({ snoozes: 0, snoozeEarnedDay: "2026-09-28" }, 7, NOW)).toBeNull();
  expect(snoozeEarn({ snoozes: 2 }, 14, NOW)).toBeNull();
  expect(snoozeEarn({ snoozes: 0 }, 6, NOW)).toBeNull();
});
