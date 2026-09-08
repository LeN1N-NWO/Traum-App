import { test, expect } from "bun:test";
import { autoMatch, startsFree } from "./useWizard.js";

/* Antons Ansage vom 22.08.2026: „Immer wenn im Traum jemand von ‚ich' spricht
   oder auch in Englisch ‚I', muss das Profilbild mitverknüpft sein — damit er
   sofort weiß: das bist du."

   Der Fehler dahinter: Die Analyse antwortet in der Sprache des Traums, die
   Selbstwort-Liste war aber rein englisch. Ein deutsch erzählter Traum bot
   dem Träumer eine Fremdfigur für sich selbst an. */

const me = { img: "data:image/jpeg;base64,AAA", tag: "anton" };

test("„ich\" in jeder Schreibweise führt aufs eigene Porträt", () => {
  for (const name of ["ich", "Ich", " ICH ", "Ich selbst", "Ich (der Träumer)", "der Träumer", "die Träumerin"]) {
    expect(autoMatch(name, [], me)?.id).toBe("me");
  }
});

test("Englisch bleibt, wie es war", () => {
  for (const name of ["I", "me", "Myself", "the dreamer", "Myself (the dreamer)"]) {
    expect(autoMatch(name, [], me)?.id).toBe("me");
  }
});

/* Umlaute faltet normalise() zusammen: Das Modell schreibt mal „Träumer",
   mal „Traeumer", und daran darf die Erkennung nicht hängen. */
test("Traeumer ohne Umlaut trifft genauso", () => {
  expect(autoMatch("der Traeumer", [], me)?.id).toBe("me");
});

test("ohne hinterlegtes Porträt gibt es nichts zu verknüpfen", () => {
  expect(autoMatch("ich", [], null)).toBe(null);
  expect(autoMatch("ich", [], { tag: "anton" })).toBe(null);   // kein Bild
});

/* ⚠ Die Gegenprobe: „Michael" enthält „mich", „Iris" beginnt mit „i".
   Verglichen wird der GANZE Name, nie ein Teilstück. */
test("Namen, die zufällig ein Selbstwort enthalten, bleiben Fremdfiguren", () => {
  const cast = [{ id: "c1", tag: "Michael" }, { id: "c2", tag: "Iris" }];
  expect(autoMatch("Michael", cast, me)?.id).toBe("c1");
  expect(autoMatch("Iris", cast, me)?.id).toBe("c2");
});

test("eine eindeutige Besetzung wird weiterhin erkannt, eine doppelte nicht", () => {
  expect(autoMatch("Luna", [{ id: "c1", tag: "luna" }], me)?.id).toBe("c1");
  expect(autoMatch("Luna", [{ id: "c1", tag: "Luna" }, { id: "c2", tag: "luna" }], me)).toBe(null);
});

/* Björns Hinweis (31.08., von Anton weitergegeben): Orte starten auf „die KI
   erfindet es" — für einen Club legt niemand ein Foto an. Menschen bleiben
   unentschieden, dort ist das Zuordnen der Zweck des Schritts. */
test("Orte starten frei, Menschen nicht", () => {
  expect(startsFree("place", undefined)).toBe(true);
  expect(startsFree("person", undefined)).toBe(false);
});

test("Ein gefundener Eintrag aus der Bibliothek gewinnt gegen die Vorauswahl", () => {
  expect(startsFree("place", { tag: "berghain" })).toBe(false);
});
