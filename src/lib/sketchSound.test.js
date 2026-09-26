import { expect, test } from "bun:test";
import { STYLE_MUSIC, buildSoundPrompts, ambienceWords, moodWords, soundSeconds, soundCostUsd } from "./sketchSound.js";
import { STYLES } from "./styles.js";

test("jeder Look hat seine Musik — ein neuer Stil fällt nicht still auf die Vorgabe", () => {
  for (const s of STYLES) expect(`${s.id}: ${Boolean(STYLE_MUSIC[s.id])}`).toBe(`${s.id}: true`);
});

test("Geräusche aus den Szenen: ganze Wörter, höchstens vier", () => {
  expect(ambienceWords(["A train crosses the sea at night."])).toEqual(["gentle ocean waves", "a distant train rumbling", "crickets at night"]);
  expect(ambienceWords(["I stare at the seat and see Rex."])).toEqual([]);
  expect(ambienceWords(["sea rain storm wind train forest fire"]).length).toBe(4);
});

test("Stimmung: bekannte Wörter übersetzt, Unbekanntes fällt weg", () => {
  expect(moodWords("unheimlich")).toBe("eerie, mysterious");
  expect(moodWords("wehmütig")).toBe("melancholic, wistful");
  expect(moodWords("blau")).toBe("");
});

test("die Prompts: Look, Tempo, keine Stimmen; Atmosphäre ohne Treffer hat einen ruhigen Grund", () => {
  const p = buildSoundPrompts({ styleId: "noir", mood: "geheimnisvoll", beats: ["He walks in the rain."], seconds: 25.8 });
  expect(p.music).toContain("jazz");
  expect(p.music).toContain("mysterious");
  expect(p.music).toContain("68 bpm");
  expect(p.music).toContain("no vocals");
  expect(p.ambience).toContain("soft rain");
  expect(p.negative).toContain("vocals");
  expect(p.seconds).toBe(26);
  expect(buildSoundPrompts({ styleId: "unbekannt", beats: [] }).ambience).toContain("soft wind");
});

test("Dauer gedeckelt, Einkauf je Sekunde", () => {
  expect(soundSeconds(2)).toBe(8);
  expect(soundSeconds(99)).toBe(45);
  expect(soundCostUsd(16.2)).toBeCloseTo(17 * 0.0012, 6);
});
