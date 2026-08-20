import { test, expect } from "bun:test";
import { sheetFingerprint, hasFreshSheet, needsSheet, renderRef } from "./sheets.js";

/* Die Bogen-Pflicht hängt an drei Regeln (Plan 2026-08-20-charakterbogen-
   pflicht.md): träge, gratis, veraltbar. Träge und gratis leben im Ablauf
   (Step5Style ruft nur aus einem bezahlten Render heraus); was hier prüfbar
   ist, ist die VERALTBARKEIT — wann ein Bogen gilt und wann das rohe Foto
   fällig ist. Ein Fehler in diese Richtung rendert mit einer Fassung der
   Figur, die der Mensch bewusst geändert hat. */

const lena = { tag: "lena", category: "person", desc: "", img: "data:image/png;base64,AAAA" };

test("a person with a photo and no sheet needs one", () => {
  expect(needsSheet(lena)).toBe(true);
});

test("a fresh sheet satisfies the rule and becomes the render reference", () => {
  const withSheet = { ...lena, sheet: "data:image/jpeg;base64,BBBB", sheetOf: sheetFingerprint(lena) };
  expect(needsSheet(withSheet)).toBe(false);
  expect(hasFreshSheet(withSheet)).toBe(true);
  expect(renderRef(withSheet)).toBe(withSheet.sheet);
});

test("changing the photo or the description invalidates the sheet", () => {
  const sheeted = { ...lena, sheet: "s", sheetOf: sheetFingerprint(lena) };
  const newPhoto = { ...sheeted, img: "data:image/png;base64,CCCC" };
  const newDesc = { ...sheeted, desc: "wearing a red coat" };
  expect(needsSheet(newPhoto)).toBe(true);
  expect(needsSheet(newDesc)).toBe(true);
  // NIE der veraltete Bogen — lieber das rohe (neue) Foto als die alte Fassung.
  expect(renderRef(newPhoto)).toBe(newPhoto.img);
});

test("places are exempt — a place IS its surroundings", () => {
  expect(needsSheet({ tag: "bahnhof", category: "place", img: "data:image/png;base64,DD" })).toBe(false);
});

test("pets get sheets too", () => {
  expect(needsSheet({ tag: "luna", category: "pet", img: "data:image/png;base64,EE" })).toBe(true);
});

test("without a photo there is nothing to normalise", () => {
  // Der 2-Credit-Weg aus der Beschreibung bleibt eine sichtbare, eigene
  // Entscheidung im AvatarDialog — nie ein stiller Automatismus.
  expect(needsSheet({ tag: "x", category: "person", desc: "tall, silver hair" })).toBe(false);
  expect(renderRef({ tag: "x", category: "person" })).toBe("");
});

test("the fingerprint is stable and order-independent of unrelated fields", () => {
  const a = sheetFingerprint({ img: "I", desc: "D" });
  expect(sheetFingerprint({ img: "I", desc: "D", tag: "egal", category: "pet" })).toBe(a);
  expect(sheetFingerprint({ img: "I2", desc: "D" })).not.toBe(a);
  expect(sheetFingerprint({ img: "I", desc: "D2" })).not.toBe(a);
});
