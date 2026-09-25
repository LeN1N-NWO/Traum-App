import { describe, expect, test } from "bun:test";
import { checkEnv } from "./check-env.mjs";

const APP = "/opt/dreamrushes/app";
const GOOD = {
  API_TOKEN: "a".repeat(64),
  DREAMRUSHES_MEDIA: "/var/lib/dreamrushes/media",
  FAL_KEY: "x", DEEPSEEK_KEY: "x", GEMINI_KEY: "x", DATABASE_URL: "x",
};

const errorsOf = (patch) => checkEnv({ ...GOOD, ...patch }, APP).errors;

describe("checkEnv", () => {
  test("eine vollständige Datei geht durch, ohne Warnung", () => {
    expect(checkEnv(GOOD, APP)).toEqual({ errors: [], warnings: [] });
  });

  test("ohne API_TOKEN kein Start", () => {
    expect(errorsOf({ API_TOKEN: undefined })).toHaveLength(1);
    expect(errorsOf({ API_TOKEN: "" })[0]).toContain("API_TOKEN fehlt");
  });

  test("kurzes Token und der Platzhalter aus .env.example halten an", () => {
    expect(errorsOf({ API_TOKEN: "geheim" })[0]).toContain("kürzer");
    // Der Platzhalter ist 27 Zeichen — er scheitert schon an der Länge.
    expect(errorsOf({ API_TOKEN: "ein-langes-zufaelliges-wort" })).toHaveLength(1);
    expect(errorsOf({ API_TOKEN: "b".repeat(32) })).toEqual([]);
  });

  test("Medienordner: Pflicht, absolut, außerhalb des Checkouts", () => {
    expect(errorsOf({ DREAMRUSHES_MEDIA: undefined })[0]).toContain("fehlt");
    expect(errorsOf({ DREAMRUSHES_MEDIA: "media" })[0]).toContain("absolut");
    expect(errorsOf({ DREAMRUSHES_MEDIA: `${APP}/media` })[0]).toContain("im Checkout");
    expect(errorsOf({ DREAMRUSHES_MEDIA: APP })[0]).toContain("im Checkout");
    expect(errorsOf({ DREAMRUSHES_MEDIA: `${APP}/../app/media` })[0]).toContain("im Checkout");
    // Nachbarordner mit gleichem Anfang ist NICHT im Checkout.
    expect(errorsOf({ DREAMRUSHES_MEDIA: `${APP}-media` })).toEqual([]);
  });

  test("PORT muss zu Caddy passen", () => {
    expect(errorsOf({ PORT: "8100" })).toEqual([]);
    expect(errorsOf({ PORT: "3000" })[0]).toContain("8100");
  });

  test("fehlende Dienst-Schlüssel warnen nur", () => {
    const r = checkEnv({ ...GOOD, FAL_KEY: undefined, DATABASE_URL: "" }, APP);
    expect(r.errors).toEqual([]);
    expect(r.warnings).toHaveLength(2);
  });
});
