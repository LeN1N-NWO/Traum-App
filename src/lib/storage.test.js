import { test, expect } from "bun:test";
import { DEFAULT_STATE, genId, loadState, saveState } from "./storage.js";

/** Minimale localStorage-Attrappe — deshalb braucht dieser Test weder
 *  Browser noch DOM-Bibliothek. */
function fakeBackend(initial = null) {
  const map = new Map();
  if (initial !== null) map.set("dreamrushes_v1", initial);
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, v),
  };
}

test("leerer Speicher liefert die Vorgabewerte", () => {
  const s = loadState(fakeBackend());
  expect(s.journal).toEqual([]);
  expect(s.cast).toEqual([]);
  expect(s.credits).toBe(0);
});

test("kaputtes JSON wirft nicht, sondern faellt auf Vorgaben zurueck", () => {
  const s = loadState(fakeBackend("{nicht json"));
  expect(s.journal).toEqual([]);
});

test("alte cast-Eintraege bekommen id und category nachgeruestet", () => {
  const alt = JSON.stringify({ cast: [{ tag: "anna", img: "x" }] });
  const s = loadState(fakeBackend(alt));
  expect(s.cast[0].category).toBe("person");
  expect(s.cast[0].id).toBeTruthy();
  expect(s.cast[0].tag).toBe("anna");
});

test("gespeicherter Zustand ueberlebt eine Runde", () => {
  const backend = fakeBackend();
  saveState({ ...DEFAULT_STATE, streak: 7 }, backend);
  expect(loadState(backend).streak).toBe(7);
});

test("voller Speicher meldet false statt zu werfen", () => {
  const voll = {
    getItem: () => null,
    setItem: () => { throw new Error("QuotaExceededError"); },
  };
  expect(saveState(DEFAULT_STATE, voll)).toBe(false);
});

test("genId erzeugt eindeutige Werte mit Praefix", () => {
  const a = genId("c"), b = genId("c");
  expect(a.startsWith("c_")).toBe(true);
  expect(a).not.toBe(b);
});
