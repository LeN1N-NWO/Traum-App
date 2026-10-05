import { afterEach, expect, test } from "bun:test";
import { DB_KEY, SLOTS_KEY, activeStateKey, loadState, releaseSlot, saveState, selectStateKey, slotFor } from "./storage.js";

/* Ein Bereich je Konto (ADR-0009). Die Fälle sind die aus dem ADR — jeder
   mit dem, was ein Mensch am Gerät sehen würde. */

function fakeBackend(entries = {}) {
  const map = new Map(Object.entries(entries));
  return {
    map,
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, v),
  };
}
const dream = (id) => ({ id, text: `Traum ${id}`, createdAt: "2026-10-05T00:00:00Z" });
/** Was das Konto auf dem Gerät sieht: Bereich wählen, lesen. */
function viewAs(account, backend) {
  selectStateKey(slotFor(account, backend));
  return loadState(backend);
}

afterEach(() => selectStateKey(null));

test("ohne Verzeichnis gilt der alte Eintrag — Web-App und Geräte von heute", () => {
  const b = fakeBackend({ [DB_KEY]: JSON.stringify({ journal: [dream("a")] }) });
  expect(slotFor(null, b)).toBe(DB_KEY);
  expect(loadState(b).journal.map((e) => e.id)).toEqual(["a"]);
  expect(b.map.has(SLOTS_KEY)).toBe(false);   // ein Gast schreibt kein Verzeichnis
});

test("das erste Konto übernimmt das Geräte-Journal, ohne Kopie", () => {
  const alt = JSON.stringify({ journal: [dream("a")], consent: { v: 4 }, language: "de", onboarded: true });
  const b = fakeBackend({ [DB_KEY]: alt });
  expect(slotFor("X", b)).toBe(DB_KEY);
  expect(viewAs("X", b).journal.map((e) => e.id)).toEqual(["a"]);
  expect(b.map.get(DB_KEY)).toBe(alt);   // unverändert, nichts verschoben
});

test("nach dem Abmelden: leeres Journal, keine Einwilligung — Sprache und Onboarding bleiben", () => {
  const b = fakeBackend({ [DB_KEY]: JSON.stringify({ journal: [dream("a")], consent: { v: 4 }, language: "de", onboarded: true, me: { img: "gesicht" } }) });
  slotFor("X", b);
  const gast = viewAs(null, b);
  expect(activeStateKey()).toBe(`${DB_KEY}@guest-X`);
  expect(gast.journal).toEqual([]);
  expect(gast.me).toBe(null);
  expect(gast.consent).toBeUndefined();
  expect(gast.language).toBe("de");
  expect(gast.onboarded).toBe(true);
});

test("zweites Konto: übernimmt, was der Gast angelegt hat — sieht nichts vom ersten", () => {
  const b = fakeBackend({ [DB_KEY]: JSON.stringify({ journal: [dream("a")] }) });
  slotFor("X", b);
  viewAs(null, b);
  saveState({ ...loadState(b), journal: [dream("g")] }, b);   // Gast tippt einen Traum
  expect(viewAs("Y", b).journal.map((e) => e.id)).toEqual(["g"]);
  expect(viewAs("X", b).journal.map((e) => e.id)).toEqual(["a"]);
  expect(viewAs("Y", b).journal.map((e) => e.id)).toEqual(["g"]);
  expect(viewAs(null, b).journal).toEqual([]);
});

test("Schreiben trifft nur den aktiven Bereich", () => {
  const b = fakeBackend({ [DB_KEY]: JSON.stringify({ journal: [dream("a")] }) });
  slotFor("X", b);
  viewAs("Y", b);
  saveState({ ...loadState(b), journal: [dream("y")] }, b);
  expect(viewAs("X", b).journal.map((e) => e.id)).toEqual(["a"]);
});

test("wiederholtes Fragen: dieselbe Zuordnung, kein zweiter Bereich", () => {
  const b = fakeBackend({ [DB_KEY]: JSON.stringify({ journal: [dream("a")] }) });
  const vorher = b.getItem(SLOTS_KEY);
  const k1 = slotFor("X", b), k2 = slotFor("X", b), k3 = slotFor("X", b);
  expect([k1, k2, k3]).toEqual([DB_KEY, DB_KEY, DB_KEY]);
  expect(vorher).toBe(null);
  expect(JSON.parse(b.getItem(SLOTS_KEY))).toEqual({ owners: { X: DB_KEY }, guest: `${DB_KEY}@guest-X` });
});

test("Konto gelöscht: seine Träume bleiben als Gast auf dem Gerät", () => {
  const b = fakeBackend({ [DB_KEY]: JSON.stringify({ journal: [dream("a")] }) });
  slotFor("X", b);
  expect(releaseSlot("X", b)).toBe(DB_KEY);
  expect(viewAs(null, b).journal.map((e) => e.id)).toEqual(["a"]);
  expect(JSON.parse(b.getItem(SLOTS_KEY)).owners).toEqual({});
});

test("Kontingent voll: kein Verzeichnis, Verhalten wie vor ADR-0009", () => {
  const b = fakeBackend({ [DB_KEY]: JSON.stringify({ journal: [dream("a")] }) });
  b.setItem = (k, v) => { if (k === SLOTS_KEY) throw new Error("QuotaExceededError"); b.map.set(k, v); };
  expect(slotFor("X", b)).toBe(DB_KEY);
  expect(b.map.has(SLOTS_KEY)).toBe(false);
  expect(viewAs("X", b).journal.map((e) => e.id)).toEqual(["a"]);
});

test("kaputtes Verzeichnis zählt wie keins", () => {
  const b = fakeBackend({ [DB_KEY]: JSON.stringify({ journal: [dream("a")] }), [SLOTS_KEY]: "{kaputt" });
  expect(slotFor(null, b)).toBe(DB_KEY);
  expect(viewAs("X", b).journal.map((e) => e.id)).toEqual(["a"]);
});

test("ein vorhandener Gast-Eintrag wird beim Übernehmen nicht überschrieben", () => {
  const b = fakeBackend({ [DB_KEY]: JSON.stringify({ language: "de" }), [`${DB_KEY}@guest-X`]: JSON.stringify({ journal: [dream("alt")] }) });
  slotFor("X", b);
  expect(viewAs(null, b).journal.map((e) => e.id)).toEqual(["alt"]);
});
