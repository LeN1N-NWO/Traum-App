import { describe, expect, test } from "bun:test";
import { checkEnv } from "./check-env.mjs";

const APP = "/opt/dreamrushes/app";
const GOOD = {
  SUPABASE_URL: "https://x.supabase.co", SUPABASE_ANON_KEY: "k",
  DREAMRUSHES_MEDIA: "/var/lib/dreamrushes/media",
  MEDIA_SECRET: "f".repeat(64),
  FAL_KEY: "x", DEEPSEEK_KEY: "x", GEMINI_KEY: "x", DATABASE_URL: "x",
};

const errorsOf = (patch) => checkEnv({ ...GOOD, ...patch }, APP).errors;

describe("checkEnv", () => {
  test("eine vollständige Datei geht durch, ohne Warnung", () => {
    expect(checkEnv(GOOD, APP)).toEqual({ errors: [], warnings: [] });
  });

  /* S1: Bezahltes nur mit Konto — ohne Supabase könnte sich niemand
     anmelden, der Server liefe also, aber niemand käme an einen Traum. */
  test("ohne Supabase kein Start", () => {
    expect(errorsOf({ SUPABASE_URL: undefined })[0]).toContain("SUPABASE");
    expect(errorsOf({ SUPABASE_ANON_KEY: "" })[0]).toContain("SUPABASE");
    expect(errorsOf({ SUPABASE_URL: undefined, SUPABASE_ANON_KEY: undefined })).toHaveLength(1);
  });

  /* S2: ohne Geheimnis keine Signatur, ohne Signatur keine Medien. */
  test("MEDIA_SECRET: Pflicht und lang genug", () => {
    expect(errorsOf({ MEDIA_SECRET: undefined })[0]).toContain("MEDIA_SECRET fehlt");
    expect(errorsOf({ MEDIA_SECRET: "kurz" })[0]).toContain("zu kurz");
    expect(errorsOf({ MEDIA_SECRET: "a".repeat(32) })).toEqual([]);
  });

  /* Das alte gemeinsame Geheimnis sperrt die App komplett aus (sie schickt
     x-api-token nicht). Seit S1 ist es auf dem Server ein Fehler. */
  test("ein gesetztes API_TOKEN hält an — es würde die App aussperren", () => {
    expect(errorsOf({ API_TOKEN: "a".repeat(64) })[0]).toContain("API_TOKEN");
    expect(errorsOf({ API_TOKEN: "" })).toEqual([]);
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

/* TRUST_PROXY steht in der Dienstdatei, nicht in der .env (S5). Fehlt er,
   startet der Server trotzdem — und alle Nutzer teilen sich einen Eimer.
   Das fällt niemandem auf, also hält es dieser Test fest. */
test("die Dienstdatei schaltet TRUST_PROXY ein", async () => {
  const unit = await Bun.file(new URL("./dreamrushes.service", import.meta.url)).text();
  const lines = unit.split("\n").map((l) => l.trim());
  expect(lines).toContain("Environment=TRUST_PROXY=1");
});

/* Dasselbe für S1: Ohne REQUIRE_AUTH=1 startet der Server auch — und alles,
   was Geld kostet, steht jedem im Internet offen. deploy.sh prüft es nach
   dem Start zusätzlich am laufenden Dienst. */
test("die Dienstdatei schaltet REQUIRE_AUTH ein", async () => {
  const unit = await Bun.file(new URL("./dreamrushes.service", import.meta.url)).text();
  const lines = unit.split("\n").map((l) => l.trim());
  expect(lines).toContain("Environment=REQUIRE_AUTH=1");
});
