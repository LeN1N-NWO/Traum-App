import { test, expect } from "bun:test";
import { recoveryOptions } from "./recovery.js";
import en from "../i18n/en.js";

const POLICY_TEXT = { kind: "policy", where: "prompt", msg: "x" };

test("ohne Grund gibt es nichts anzubieten", () => {
  expect(recoveryOptions({}).message).toBe(null);
  expect(recoveryOptions(null).rewrite).toBe(false);
});

/* Antons erster Punkt: ZWEI Wege, nicht einer. */
test("beim ersten Nein stehen beide Wege offen", () => {
  const o = recoveryOptions({ failReason: POLICY_TEXT });
  expect(o.rewrite).toBe(true);
  expect(o.otherModel).toBe(true);
  expect(o.message).toBe("policyPrompt");
});

/* ⚠ Antons zweiter Punkt, und der eigentliche Grund fuer diese Datei:
   Hat Plan B schon gelaufen und trotzdem versagt, ist ein weiterer
   Modellwechsel keine Option mehr, sondern eine Wette auf Kosten des
   Kunden — sechs Credits fuer ein sicheres Nein. */
test("nach einem gescheiterten Plan B bleibt nur noch das Umschreiben", () => {
  const o = recoveryOptions({ failReason: POLICY_TEXT, fallback: true });
  expect(o.otherModel).toBe(false);
  expect(o.rewrite).toBe(true);
  expect(o.message).toBe("policyBothModels");
});

/* Bei einer FOTO-Ablehnung ist der Traumtext unschuldig. Ihn umschreiben zu
   lassen waere Beschaeftigungstherapie — und der Fehler bliebe. */
test("wurde das FOTO abgelehnt, hilft Umschreiben nicht", () => {
  const o = recoveryOptions({ failReason: { kind: "policy", where: "image" } });
  expect(o.rewrite).toBe(false);
  expect(o.otherModel).toBe(true);
  expect(o.message).toBe("policyImage");
});

test("ein gewoehnlicher Fehlschlag ist keine Policy-Sache", () => {
  const o = recoveryOptions({ failReason: { kind: "unknown" } });
  expect(o.rewrite).toBe(false);
  expect(o.otherModel).toBe(false);
  expect(o.retry).toBe(true);
  expect(o.message).toBe("renderFailed");
});

test("gibt es gar kein Ausweichmodell, wird auch keines angeboten", () => {
  expect(recoveryOptions({ failReason: POLICY_TEXT },
    { fallbackAvailable: false }).otherModel).toBe(false);
});

/* ⚠ Drift-Waechter: Jede Meldung, die diese Datei nennen KANN, muss es in
   en.js auch geben. Sonst steht an der heikelsten Stelle der App ein leerer
   Absatz — und zwar nur bei jemandem, dem gerade etwas abgelehnt wurde. */
test("jede genannte Meldung existiert wirklich", () => {
  const faelle = [
    { failReason: POLICY_TEXT },
    { failReason: POLICY_TEXT, fallback: true },
    { failReason: { kind: "policy", where: "image" } },
    { failReason: { kind: "policy", where: null } },
    { failReason: { kind: "unknown" } },
  ];
  for (const e of faelle) {
    expect(typeof en.errors[recoveryOptions(e).message]).toBe("string");
  }
});
