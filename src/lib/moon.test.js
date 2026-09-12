import { describe, it, expect } from "bun:test";
import { moonAge, moonPhase, moonIllumination, moonWaxing, moonForNight, moonStrip, MOON_PHASES } from "./moon.js";

/* Prüfsteine sind echte Termine (NASA/Meeus, UTC). Die mittlere Rechnung
   darf bis zu einem halben Tag danebenliegen — geprüft wird deshalb die
   PHASE am Termin, nicht die Minute. */
const VOLLMOND = new Date("2026-09-26T12:00:00Z");   // Vollmond 26.09.2026
const NEUMOND = new Date("2026-09-11T12:00:00Z");    // Neumond 11.09.2026

describe("moon", () => {
  it("kennt Neumond und Vollmond an echten Terminen", () => {
    expect(moonPhase(NEUMOND)).toBe("new");
    expect(moonPhase(VOLLMOND)).toBe("full");
    expect(moonIllumination(NEUMOND)).toBeLessThan(0.05);
    expect(moonIllumination(VOLLMOND)).toBeGreaterThan(0.95);
  });

  it("nimmt nach dem Neumond zu und nach dem Vollmond ab", () => {
    const nachNeu = new Date(NEUMOND.getTime() + 4 * 86400000);
    const nachVoll = new Date(VOLLMOND.getTime() + 4 * 86400000);
    expect(moonWaxing(nachNeu)).toBe(true);
    expect(moonPhase(nachNeu)).toBe("waxingCrescent");
    expect(moonWaxing(nachVoll)).toBe(false);
    expect(moonPhase(nachVoll)).toBe("waningGibbous");
  });

  it("läuft rund: das Alter bleibt zwischen 0 und 1, jede Phase ist bekannt", () => {
    for (let k = 0; k < 40; k++) {
      const d = new Date(NEUMOND.getTime() + k * 0.9 * 86400000);
      const a = moonAge(d);
      expect(a).toBeGreaterThanOrEqual(0);
      expect(a).toBeLessThan(1);
      expect(MOON_PHASES).toContain(moonPhase(d));
    }
  });

  it("rechnet die Nacht dem Vorabend zu (wer morgens notiert, träumte gestern)", () => {
    const morgens = new Date(2026, 8, 27, 3, 30);      // 27.09., 03:30 Ortszeit
    const abends = new Date(2026, 8, 26, 23, 0);       // 26.09., 23:00
    expect(moonForNight(morgens).at.slice(0, 10)).toBe(moonForNight(abends).at.slice(0, 10));
  });

  it("liefert den Streifen mit heute in der Mitte", () => {
    const s = moonStrip(new Date(2026, 8, 26));
    expect(s).toHaveLength(5);
    expect(s[2].today).toBe(true);
    expect(s[2].day).toBe(26);
    expect(s[0].day).toBe(24);
    expect(s[4].day).toBe(28);
  });
});
