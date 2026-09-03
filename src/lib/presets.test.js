import { test, expect, describe } from "bun:test";
import { PRESETS, DREAMFLOW, activePreset, applyPreset } from "./presets.js";
import { STYLES } from "./styles.js";
import { PACE_IDS } from "./video.js";

describe("Stil-Presets", () => {
  test("every style has exactly one tile, plus Dreamflow", () => {
    const stilIds = PRESETS.filter((p) => p.id !== DREAMFLOW).map((p) => p.styleId);
    expect([...stilIds].sort()).toEqual(STYLES.map((s) => s.id).sort());
    expect(PRESETS.filter((p) => p.id === DREAMFLOW)).toHaveLength(1);
  });

  test("every preset points at a real style and, if set, a real pace", () => {
    for (const p of PRESETS) {
      expect(STYLES.some((s) => s.id === p.styleId)).toBe(true);
      if (p.pace) expect(PACE_IDS).toContain(p.pace);
    }
  });

  /* Neun Kacheln in drei Spalten gehen nur auf, wenn zwei doppelt breit
     sind — sonst steht die letzte allein (Waise, gesehen in der Werkbank). */
  test("the grid closes: two wide tiles make eleven slots in three columns", () => {
    const slots = PRESETS.reduce((n, p) => n + (p.wide ? 2 : 1), 0);
    expect(PRESETS.filter((p) => p.wide)).toHaveLength(2);
    expect(slots % 3).toBe(2);   // letzte Reihe: genau die breite Kachel
    expect(PRESETS[PRESETS.length - 1].wide).toBe(true);
  });

  test("Dreamflow is the flow pace, whatever the style", () => {
    expect(activePreset({ styleId: "noir", pace: "flow" })).toBe(DREAMFLOW);
    expect(activePreset({ styleId: "noir", pace: "calm" })).toBe("noir");
  });

  test("picking Dreamflow sets style and pace together", () => {
    expect(applyPreset(DREAMFLOW, { pace: "fast" })).toEqual({ styleId: "dreamlike", pace: "flow" });
  });

  /* Sonst bliebe der Fluss still an, und die Kachel behauptete einen
     Stil, der nie so gerendert würde. */
  test("leaving Dreamflow for a style brings the pace back to the default", () => {
    expect(applyPreset("noir", { pace: "flow" })).toEqual({ styleId: "noir", pace: "calm" });
    expect(applyPreset("noir", { pace: "fast" })).toEqual({ styleId: "noir" });
  });

  test("an unknown preset falls back to the first style, never to Dreamflow", () => {
    expect(applyPreset("quatsch", {}).pace).toBeUndefined();
    expect(activePreset({})).not.toBe(DREAMFLOW);
  });
});
