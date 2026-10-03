import { expect, test } from "bun:test";
import { dayKey, dreamCount, dreamNightCount, isFilmNight, missedNights, snoozeBridge, snoozeEarn, streakInfo } from "./nights.js";

// Ein Tag in Ortszeit, als Datum mit Uhrzeit.
const at = (day, time = "08:00") => new Date(`${day}T${time}:00`);
// Ein Traum mit Glimpse — das, was die Serie zählt (seit 03.10.).
const dream = (day, time) => ({ id: `e${day}${time || ""}`, createdAt: at(day, time).toISOString(), text: "a dream", films: [{ url: "sketch:a.mp4", kind: "sketch" }] });
const textOnly = (day) => ({ id: `t${day}`, createdAt: at(day).toISOString(), text: "only words" });
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

test("nur Träume mit Glimpse/Film zählen; ein Text-Traum hält die Serie, zählt aber nicht", () => {
  expect(isFilmNight(textOnly("2026-09-28"))).toBe(false);
  expect(isFilmNight(dream("2026-09-28"))).toBe(true);
  expect(isFilmNight({ createdAt: at("2026-09-28").toISOString(), media: { urls: ["a.png"] } })).toBe(true);
  expect(isFilmNight({ createdAt: at("2026-09-28").toISOString(), kind: "moonfilm", films: [{ url: "sketch:m.mp4" }] })).toBe(false);
  // 30 Nächte nur Text: keine Serie, also keine Geschenke.
  const words = Array.from({ length: 30 }, (_, i) => textOnly(dayKey(new Date(2026, 8, 28 - i))));
  expect(streakInfo(words, { now: NOW })).toEqual({ streak: 0, atRisk: false, today: true });
  // Glimpse, Text, Glimpse: die Lücke ist gehalten, gezählt werden zwei.
  const mix = [dream("2026-09-26"), textOnly("2026-09-27"), dream("2026-09-28")];
  expect(streakInfo(mix, { now: NOW })).toEqual({ streak: 2, atRisk: false, today: true });
  // Heute nur Text: der Tag ist gehalten, nicht auf der Kippe.
  expect(streakInfo([dream("2026-09-27"), textOnly("2026-09-28")], { now: NOW })).toEqual({ streak: 1, atRisk: false, today: true });
});

test("die Zahl der Träume zählt jeden Traum mit Bild einmal — Lücken und Text egal", () => {
  const j = [dream("2026-09-01"), dream("2026-09-15", "07:00"), dream("2026-09-15", "08:00"), textOnly("2026-09-20"), blank("2026-09-21")];
  expect(dreamCount(j)).toBe(3);
  expect(dreamCount([])).toBe(0);
});
