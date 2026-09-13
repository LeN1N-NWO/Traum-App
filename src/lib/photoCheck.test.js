import { test, expect } from "bun:test";
import { reasonOf, checkResult, REASONS } from "./photoCheck.js";

/* Ein falsch einsortierter Grund rät dem Menschen das Falsche — deshalb sind
   die Texte hier echte Anbieter-Formulierungen (Stand 13.09.2026) oder nah
   daran. */
test("ByteDance's face rule is a face reason, not a nudity filter", () => {
  expect(reasonOf("The request failed because the input image may contain real person", "InputImageSensitiveContentDetected.PrivacyInformation")).toBe("realface");
  expect(reasonOf("reference images that contain real human faces are not supported")).toBe("realface");
});

test("celebrities, minors, explicit, faces", () => {
  expect(reasonOf("Image appears to depict a public figure")).toBe("celebrity");
  expect(reasonOf("content may involve a minor")).toBe("minor");
  expect(reasonOf("NSFW content detected")).toBe("explicit");
  expect(reasonOf("no face detected in reference image")).toBe("noface");
  expect(reasonOf("multiple faces detected")).toBe("manyfaces");
  expect(reasonOf("partner_validation_failed")).toBe("provider");
  for (const r of ["realface", "celebrity", "minor", "explicit", "noface", "manyfaces", "provider"]) expect(REASONS).toContain(r);
});

test("a network or key problem is never shown as a rejection", () => {
  expect(checkResult({ error: "fetch failed" }).status).toBe("unavailable");
  expect(checkResult({ error: "NO_REPLICATE_TOKEN" }).status).toBe("unavailable");
  expect(checkResult({ error: "Request timed out" }).status).toBe("unavailable");
  expect(checkResult({ error: "Service Unavailable", status: 503 }).status).toBe("unavailable");
  expect(checkResult(null).status).toBe("unavailable");
});

test("accepted is ok, a real rejection is blocked with its reason", () => {
  expect(checkResult({ accepted: true })).toEqual({ status: "ok", reason: null });
  expect(checkResult({ accepted: false, error: "NSFW content detected" })).toEqual({ status: "blocked", reason: "explicit" });
  expect(checkResult({ code: "InputImageSensitiveContentDetected.PrivacyInformation", error: "may contain real person" })).toEqual({ status: "blocked", reason: "realface" });
});
