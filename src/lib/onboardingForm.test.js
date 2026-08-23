import { test, expect } from "bun:test";
import { readFileSync } from "node:fs";
import {
  FORM_FIELDS, emptyProfile, profileFromAnswers, hasAnything,
} from "./onboardingForm.js";
import { zodiacOf } from "./zodiac.js";
import en from "../i18n/en.js";

const server = readFileSync(new URL("../../server.js", import.meta.url), "utf8");
const survey = readFileSync(
  new URL("../screens/Onboarding/OnboardingSurvey.jsx", import.meta.url), "utf8");

const feld = Object.fromEntries(FORM_FIELDS.map((f) => [f.key, f]));

/* ── Die Drift-Wächter ────────────────────────────────────────────────────
   Der getippte Weg und der gesprochene Weg fuellen DASSELBE Profil. Laufen
   ihre Wertelisten auseinander, bricht nichts — es steht nur irgendwann ein
   roher Schluessel im Traumbogen, wo ein Satz stehen sollte. Diese drei
   Tests sind der einzige Ort, an dem das auffaellt. */

test("jeder Auswahlwert steht wortgleich im Werkzeug auf dem Server", () => {
  const werkzeug = {
    goal: "setGoal", recall: "setDreamRecall", lucid: "setLucidLevel",
    sleepHours: "setSleepHours", timeBudget: "setTimeBudget",
  };
  for (const [key, name] of Object.entries(werkzeug)) {
    // Der Block dieses einen Werkzeugs, bis zum naechsten `name:`.
    const block = server.split(`name: "${name}"`)[1]?.split("name: \"")[0] || "";
    expect(block.length).toBeGreaterThan(0);
    for (const wert of feld[key].values) {
      expect(block).toContain(wert);
    }
  }
});

test("jeder Auswahlwert hat einen Text im Traumbogen — sonst steht dort der Schluessel", () => {
  const karte = {
    goal: en.dreamer.goalValues, recall: en.dreamer.recallValues,
    lucid: en.dreamer.lucidValues, sleepHours: en.dreamer.sleepValues,
    timeBudget: en.dreamer.timeValues,
  };
  for (const [key, texte] of Object.entries(karte)) {
    const fehlend = feld[key].values.filter((v) => !texte[v]);
    expect(fehlend).toEqual([]);
  }
});

test("das leere Profil hat genau die Felder, die der Sprachweg auch fuellt", () => {
  /* `collected.current = { … }` aus OnboardingSurvey.jsx — dieselbe Form,
     oder onDone bekommt zwei verschiedene Gestalten desselben Dings. */
  const block = survey.match(/const collected = useRef\(\{([\s\S]*?)\n\s*\}\);/)?.[1] || "";
  expect(block.length).toBeGreaterThan(0);
  const gesprochen = [...block.matchAll(/(\w+):/g)].map((m) => m[1]).sort();
  expect(Object.keys(emptyProfile()).sort()).toEqual(gesprochen);
});

/* ── Die Umrechnung ───────────────────────────────────────────────────── */

test("ein leeres Formular ergibt ein leeres Profil, keinen Fehler", () => {
  const p = profileFromAnswers({}, zodiacOf);
  expect(p).toEqual(emptyProfile());
  expect(hasAnything(p)).toBe(false);
});

test("ein unbekannter Auswahlwert wird verworfen, nicht durchgereicht", () => {
  const p = profileFromAnswers({ goal: "weltherrschaft", recall: "nightly" }, zodiacOf);
  expect(p.goal).toBe("");
  expect(p.recall).toBe("nightly");
});

test("der Name wird getrimmt und gekappt", () => {
  const p = profileFromAnswers({ name: "  " + "a".repeat(60) + "  " }, zodiacOf);
  expect(p.name).toBe("a".repeat(40));
});

test("Themen: getrimmt, ohne Leere, ohne Duplikate, hoechstens zwoelf", () => {
  const p = profileFromAnswers({
    themes: ["  Fliegen ", "Fliegen", "", "   ", ...Array.from({ length: 20 }, (_, i) => `t${i}`)],
  }, zodiacOf);
  expect(p.themes[0]).toBe("Fliegen");
  expect(p.themes.filter((x) => x === "Fliegen")).toHaveLength(1);
  expect(p.themes).toHaveLength(12);
  expect(p.themes).not.toContain("");
});

test("der Geburtstag setzt das Sternzeichen — und nur in der richtigen Form", () => {
  const gut = profileFromAnswers({ birthday: "1988-05-14" }, zodiacOf);
  expect(gut.birthday).toBe("1988-05-14");
  expect(gut.zodiac).toBe(zodiacOf("1988-05-14"));

  for (const murks of ["14.05.1988", "1988-5-14", "morgen", ""]) {
    const p = profileFromAnswers({ birthday: murks }, zodiacOf);
    expect(p.birthday).toBe("");
    expect(p.zodiac).toBe(null);
  }
});

/* Der Sprachweg laesst ausdruecklich `0000` als Jahr zu, wenn jemand nur Tag
   und Monat nennt. Ein `new Date()`-Test haette genau das verworfen. */
test("Jahr 0000 ueberlebt — Tag und Monat allein sind eine gueltige Antwort", () => {
  const p = profileFromAnswers({ birthday: "0000-05-14" }, zodiacOf);
  expect(p.birthday).toBe("0000-05-14");
  expect(p.zodiac).toBe(zodiacOf("0000-05-14"));
});

test("der Erinnerungswunsch bleibt leer — er gehoert hinter einen bewussten Tipp", () => {
  const p = profileFromAnswers({ reminders: { wants: true, perDay: 3 } }, zodiacOf);
  expect(p.reminders).toBe(null);
});

test("hasAnything erkennt jede einzelne beantwortete Frage", () => {
  expect(hasAnything(profileFromAnswers({ name: "Anton" }, zodiacOf))).toBe(true);
  expect(hasAnything(profileFromAnswers({ goal: "nightmares" }, zodiacOf))).toBe(true);
  expect(hasAnything(profileFromAnswers({ themes: ["Wasser"] }, zodiacOf))).toBe(true);
  expect(hasAnything(profileFromAnswers({ birthday: "1988-05-14" }, zodiacOf))).toBe(true);
  expect(hasAnything(null)).toBe(false);
});
