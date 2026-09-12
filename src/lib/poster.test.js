import { describe, it, expect } from "bun:test";
import { buildPosterPrompt, POSTER_ASPECT } from "./poster.js";

describe("buildPosterPrompt", () => {
  it("nennt Titel, Tagline, Format und die Referenz-Klausel", () => {
    const p = buildPosterPrompt({ title: "Dino im Abendrot", tagline: "Angst war nur der erste Schritt.", styleId: "clay" });
    expect(p).toContain('"Dino im Abendrot"');
    expect(p).toContain('"Angst war nur der erste Schritt."');
    expect(p).toContain(POSTER_ASPECT);
    expect(p).toContain("one-sheet");
    expect(p).toContain("Image 1 is a frame from the finished film");
    expect(p).toContain("ONE dominant visual idea");
  });
  it("ohne Tagline keine Tagline-Zeile; unbekannter Stil fällt weich", () => {
    const p = buildPosterPrompt({ title: "X", styleId: "gibt-es-nicht" });
    expect(p).not.toContain("tagline");
    expect(p).toContain('"X"');
  });
});
