import { test, expect } from "bun:test";
import { dedupePeople } from "./people.js";

/* Antons Befund vom 22.08.: „Die Erkennung von dem Text ist ein Witz. Hier
   wird ein Arzt und dann ein Arzt. Zwei separate Menschen erkannt."

   Die Prompt-Regel verlangt es richtig — aber ein Prompt ist eine Bitte, kein
   Vertrag. Hier steht die Durchsetzung, und hier wird sie bewacht. */

const durch = (namen) =>
  namen.map((name) => ({ name, kind: "person", desc: "" })).filter(dedupePeople());

test("derselbe Mensch, dreimal genannt, ist eine Figur", () => {
  expect(durch(["ein Arzt", "der Arzt", "Arzt"]).map((p) => p.name)).toEqual(["Arzt"]);
});

test("der Artikel fliegt auch aus dem angezeigten Namen", () => {
  // Eine Besetzungsliste führt „Arzt", nicht „ein Arzt".
  expect(durch(["eine fremde Frau"]).map((p) => p.name)).toEqual(["fremde Frau"]);
  expect(durch(["The old man"]).map((p) => p.name)).toEqual(["old man"]);
});

/* ⚠ Die Gegenrichtung ist der schlimmere Fehler: Zwei Menschen, die der Traum
   unterscheidet, zusammenzuwerfen ließe eine Figur verschwinden, die es
   wirklich gab. „anderer" bleibt deshalb Teil des Schlüssels. */
test("zwei Ärzte, die der Traum unterscheidet, bleiben zwei", () => {
  expect(durch(["ein Arzt", "ein anderer Arzt"]).map((p) => p.name))
    .toEqual(["Arzt", "anderer Arzt"]);
  expect(durch(["Arzt mit Brille", "junger Arzt"]).length).toBe(2);
});

test("gestapelte Artikel werden alle abgeräumt", () => {
  expect(durch(["eine der Frauen"]).map((p) => p.name)).toEqual(["Frauen"]);
});

test("Groß- und Kleinschreibung und Zeichen entscheiden nichts", () => {
  expect(durch(["Luna", "luna", "LUNA!"]).length).toBe(1);
});

test("der erste Auftritt gewinnt — er stand im Traum zuerst", () => {
  expect(durch(["der Arzt", "ein Arzt"]).map((p) => p.name)).toEqual(["Arzt"]);
});

test("Namen ohne Artikel bleiben unangetastet", () => {
  expect(durch(["Anton", "Rex", "Mara"]).map((p) => p.name)).toEqual(["Anton", "Rex", "Mara"]);
});

test("Leeres fällt heraus, statt eine namenlose Figur anzulegen", () => {
  expect(durch(["", "   ", "der"]).length).toBe(0);
});
