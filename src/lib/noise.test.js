import { test, expect } from "bun:test";
import { fillWhite, fillPink, fillBrown, SOUND_IDS } from "./noise.js";

// Deterministic "random" so the tests cannot flake.
function seeded() {
  let s = 42;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

for (const [name, fill] of [["white", fillWhite], ["pink", fillPink], ["brown", fillBrown]]) {
  test(`${name} noise stays within [-1, 1] and is not silence`, () => {
    const out = fill(new Float32Array(8192), seeded());
    let min = 1, max = -1;
    for (const v of out) { if (v < min) min = v; if (v > max) max = v; }
    expect(min).toBeGreaterThanOrEqual(-1);
    expect(max).toBeLessThanOrEqual(1);
    expect(max - min).toBeGreaterThan(0.1);   // actually moving, not near-silent
  });
}

// The whole point of the three colours: brown is smoother than pink is
// smoother than white. Mean |sample-to-sample| step is a fine proxy.
test("brown is smoother than pink is smoother than white", () => {
  const step = (fill) => {
    const out = fill(new Float32Array(8192), seeded());
    let sum = 0;
    for (let i = 1; i < out.length; i++) sum += Math.abs(out[i] - out[i - 1]);
    return sum / (out.length - 1);
  };
  expect(step(fillBrown)).toBeLessThan(step(fillPink));
  expect(step(fillPink)).toBeLessThan(step(fillWhite));
});

test("the mixer's sound list is exactly the three colours", () => {
  expect(SOUND_IDS).toEqual(["white", "pink", "brown"]);
});
