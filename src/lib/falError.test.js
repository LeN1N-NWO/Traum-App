import { test, expect } from "bun:test";
import { failureReason, isHopeless } from "./falError.js";

/* ⚠ Die Vorlage ist KEINE Erfindung. Das ist die Antwort, die fal am
   24.08.2026 um 21:46 auf Antons Freddy-Krüger-Traum wirklich geschickt
   hat (Auftrag 01a0354f-3674-7912-82a4-88c35edead4a, nachträglich am
   Response-Endpunkt abgefragt). Eine ausgedachte Fehlerform hätte genau
   das getestet, was ich mir vorstelle — und nicht das, was ankommt. */
const ECHT = {
  detail: [{
    loc: ["body", "prompt"],
    msg: "The content could not be processed because it contained material flagged by a content checker.",
    type: "content_policy_violation",
    url: "https://docs.fal.ai/errors#content_policy_violation",
  }],
};

test("der echte Policy-Fehler wird erkannt — Art UND Ort", () => {
  const r = failureReason(ECHT);
  expect(r.kind).toBe("policy");
  expect(r.where).toBe("prompt");
  expect(isHopeless(r)).toBe(true);
});

test("am Foto abgelehnt heisst 'image' — der Rat ist ein anderer", () => {
  /* Seedream hat am 23.08. genau so abgelehnt: auf body.image, nicht auf
     den Prompt. „Ändere deinen Text" wäre dort der falsche Rat gewesen. */
  const r = failureReason({ detail: [{ loc: ["body", "image"], type: "content_policy_violation", msg: "x" }] });
  expect(r.where).toBe("image");
});

test("ein unbekannter Ort bleibt null statt zu raten", () => {
  const r = failureReason({ detail: [{ loc: ["body"], type: "content_policy_violation", msg: "x" }] });
  expect(r.kind).toBe("policy");
  expect(r.where).toBe(null);
});

/* Die Rückfallebene für den Tag, an dem fal die Typbezeichnung umbenennt.
   Ohne sie fiele die Meldung still auf „unknown" zurück — und die App gäbe
   wieder den nutzlosen Rat „versuch es noch mal". */
test("auch ohne bekannten Typ zieht der Text noch", () => {
  const r = failureReason({ detail: [{ msg: "Request blocked by our safety system." }] });
  expect(r.kind).toBe("policy");
});

test("alles andere ist 'unknown' — und darf nochmal versucht werden", () => {
  const r = failureReason({ detail: [{ type: "validation_error", msg: "bad size" }] });
  expect(r.kind).toBe("unknown");
  expect(isHopeless(r)).toBe(false);
});

/* ⚠ Diese Funktion läuft IM Fehlerpfad. Wirft sie, kostet sie die
   Erstattung mit — der Kunde hätte dann kein Bild UND keine Credits. */
test("kaputte Eingaben werfen nicht", () => {
  for (const murks of [null, undefined, {}, { detail: "boom" }, { detail: [] }, { detail: [null] }]) {
    expect(() => failureReason(murks)).not.toThrow();
    expect(failureReason(murks).kind).toBe("unknown");
  }
  expect(isHopeless(null)).toBe(false);
});

test("die Meldung wird gekappt — ein Fehlertext ist kein Roman", () => {
  const r = failureReason({ detail: [{ msg: "x".repeat(5000) }] });
  expect(r.msg.length).toBe(300);
});

import { failureTextKey } from "./falError.js";

test("jeder Grund findet seinen Text — und ein unklarer Ort raet nicht", () => {
  expect(failureTextKey({ kind: "policy", where: "prompt" })).toBe("policyPrompt");
  expect(failureTextKey({ kind: "policy", where: "image" })).toBe("policyImage");
  expect(failureTextKey({ kind: "policy", where: null })).toBe("policyPlain");
  expect(failureTextKey({ kind: "unknown" })).toBe("renderFailed");
  expect(failureTextKey(null)).toBe("renderFailed");
});

/* ⚠ Der Drift-Wächter: Diese Schlüssel MÜSSEN in en.js existieren. Fehlt
   einer, zeigt die App an der heikelsten Stelle einen leeren Toast — und
   zwar nur genau dann, wenn jemand gerade abgelehnt wurde. */
test("jeder gelieferte Schluessel steht wirklich in en.js", async () => {
  const en = (await import("../i18n/en.js")).default;
  for (const r of [
    { kind: "policy", where: "prompt" }, { kind: "policy", where: "image" },
    { kind: "policy", where: null }, { kind: "unknown" }, null,
  ]) {
    expect(typeof en.errors[failureTextKey(r)]).toBe("string");
  }
});
