import { test, expect } from "bun:test";
import { readFileSync } from "node:fs";
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

/* ⚠ Ein echtes NUL-Byte im Quelltext laesst Git die Datei fuer BINAER
   halten: `git diff` sagt dann nur noch „Binary files differ", und niemand
   kann eine Aenderung daran mehr pruefen. Genau das war am 24.08.2026 bei
   sheets.js und gatekeeper.js der Fall — beide benutzen NUL als Trenner,
   hatten es aber als Byte statt als Escape `\0` geschrieben. Zur Laufzeit
   identisch, in der Durchsicht der Unterschied zwischen lesbar und blind. */
test("kein Quelltext enthaelt ein echtes NUL-Byte", async () => {
  const { readdirSync, readFileSync, statSync } = await import("node:fs");
  const { join } = await import("node:path");
  const wurzel = new URL("../..", import.meta.url).pathname;
  const treffer = [];
  (function lauf(dir) {
    for (const name of readdirSync(dir)) {
      if (name === "node_modules" || name === ".git" || name === "dist" || name === "media") continue;
      const voll = join(dir, name);
      if (statSync(voll).isDirectory()) { lauf(voll); continue; }
      if (!/\.(js|jsx|mjs|json|css|md)$/.test(name)) continue;
      if (readFileSync(voll, "utf8").includes("\0")) treffer.push(voll.slice(wurzel.length));
    }
  })(join(wurzel, "src"));
  expect(treffer).toEqual([]);
});

/* ── ⚠ Gefunden im bezahlten Clooney-Lauf am 25.08.2026 ───────────────────
   Der Bogen war fertig gerendert, sah richtig aus — und war danach nirgends
   gespeichert. Zwei Ursachen, beide lautlos, beide in Step5Style:

     1. `img2` fehlte in der Figur, die an den Bogen ging. Das ZWEITE Foto
        (Ganzkoerper) erreichte ihn nie — die Zwei-Fotos-Funktion vom 23.08.
        war im Wizard tot, seit es sie gibt.
     2. Dadurch rechnete `sheetFingerprint` ueber eine ANDERE Gestalt als
        `hasFreshSheet` spaeter prueft. Der Bogen galt bei JEDEM Render als
        veraltet und wurde neu gemacht: $0,017, jedes Mal, fuer nichts.

   Die beiden Tests hier pruefen die REGEL dahinter, nicht die Stelle:
   Wer den Fingerabdruck ueber eine gekuerzte Figur rechnet, bekommt einen
   anderen — und muss es merken. */

test("eine Figur OHNE img2 hat einen anderen Fingerabdruck als mit", () => {
  const voll = { tag: "ich", desc: "D", img: "AAA", img2: "BBB" };
  const { img2, ...gekuerzt } = voll;
  expect(sheetFingerprint(gekuerzt)).not.toBe(sheetFingerprint(voll));
});

/* ⚠ Der eigentliche Waechter: Wer den Bogen ueber eine gekuerzte Figur
   stempelt und ihn spaeter an der vollen prueft, bekommt „veraltet" — und
   zahlt bei jedem Render neu. */
test("ein Bogen, gestempelt ohne img2, gilt an der vollen Figur als veraltet", () => {
  const voll = { tag: "ich", category: "person", desc: "D", img: "AAA", img2: "BBB" };
  const { img2, ...gekuerzt } = voll;
  const falschGestempelt = { ...voll, sheet: "BOGEN", sheetOf: sheetFingerprint(gekuerzt) };
  expect(hasFreshSheet(falschGestempelt)).toBe(false);
  expect(needsSheet(falschGestempelt)).toBe(true);     // wuerde neu gerendert

  const richtigGestempelt = { ...voll, sheet: "BOGEN", sheetOf: sheetFingerprint(voll) };
  expect(hasFreshSheet(richtigGestempelt)).toBe(true);
  expect(needsSheet(richtigGestempelt)).toBe(false);
});

/* ⚠ Verdrahtungstest: Die Figur, die der Wizard baut, MUSS img2 tragen.
   Ohne diese Zeile faellt der Fehler oben beim naechsten Umbau wieder rein
   — und wieder ohne Fehlermeldung. */
test("der Wizard reicht img2 an den Bogen weiter", () => {
  const src = readFileSync(new URL("../wizard/Step5Style.jsx", import.meta.url), "utf8");
  const block = src.match(/const members = assignments[\s\S]*?\}\)\);/)?.[0] || "";
  expect(block.length).toBeGreaterThan(0);
  expect(block).toContain("img2:");
});

/* Und der Bogen muss einen ORT finden. Vorher entschied `avatar.id`
   darueber; eine Figur, deren id nicht passte, verlor ihn lautlos. */
test("der Bogen wird ueber den TAG festgeschrieben, nicht ueber die id", () => {
  const src = readFileSync(new URL("../wizard/Step5Style.jsx", import.meta.url), "utf8");
  expect(src).toMatch(/p\?\.tag === member\.tag/);
  expect(src).not.toMatch(/if \(avatar\.id\) \{/);
});
