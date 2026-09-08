import { test, expect, describe } from "bun:test";
import { PRESETS, DREAMFLOW, activePreset, applyPreset, featuredPresets, morePresets } from "./presets.js";
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

  /* Kacheln in drei Spalten gehen nur auf, wenn die Zellenzahl durch drei
     teilbar ist — sonst steht die letzte allein (Waise, gesehen in der
     Werkbank). Seit 08.09. gilt das ZWEIMAL: für die erste Reihe allein
     und für alles zusammen, nachdem „More styles" aufgeklappt ist. */
  test("the grid closes — the first row alone, and everything together", () => {
    const zellen = (liste) => liste.reduce((n, p) => n + (p.wide ? 2 : 1), 0);
    expect(zellen(featuredPresets()) % 3).toBe(0);
    expect(zellen([...featuredPresets(), ...morePresets()]) % 3).toBe(0);
    // Nur Dreamflow ist breit: 2 + 10 = 12 Zellen. Wer eine Kachel dazunimmt
    // oder wegnimmt, muss die Breiten neu setzen — dieser Test sagt es ihm.
    expect(PRESETS.filter((p) => p.wide).map((p) => p.id)).toEqual([DREAMFLOW]);
  });

  test("first row: Dreamflow plus the featured styles; the rest behind the button", () => {
    const erste = featuredPresets();
    expect(erste[0].id).toBe(DREAMFLOW);
    expect(erste.length).toBe(1 + STYLES.filter((s) => s.featured).length);
    expect(erste.length + morePresets().length).toBe(PRESETS.length);
    expect(morePresets().some((p) => p.id === DREAMFLOW)).toBe(false);
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
