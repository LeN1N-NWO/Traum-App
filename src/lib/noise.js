/* Noise generators for the sleep sound mixer.
 *
 * The sounds are SYNTHESISED, not shipped: a few seconds of looped noise is
 * indistinguishable from a recording for this purpose, costs zero download,
 * works offline, and has no licence attached. Pure functions over
 * Float32Array — the Web Audio wiring lives in soundMixer.js, so this part
 * runs under bun test without an AudioContext.
 *
 * White = every frequency equally (harsh, like static).
 * Pink  = energy falls with frequency (rain-like, the classic sleep noise).
 * Brown = falls faster still (deep, ocean-like rumble).
 */

export function fillWhite(out, random = Math.random) {
  for (let i = 0; i < out.length; i++) out[i] = random() * 2 - 1;
  return out;
}

// Paul Kellet's economy pink-noise filter — the standard trick: run white
// noise through a handful of leaky integrators tuned to lose ~3 dB/octave.
export function fillPink(out, random = Math.random) {
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < out.length; i++) {
    const w = random() * 2 - 1;
    b0 = 0.99886 * b0 + w * 0.0555179;
    b1 = 0.99332 * b1 + w * 0.0750759;
    b2 = 0.96900 * b2 + w * 0.1538520;
    b3 = 0.86650 * b3 + w * 0.3104856;
    b4 = 0.55000 * b4 + w * 0.5329522;
    b5 = -0.7616 * b5 - w * 0.0168980;
    out[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
    b6 = w * 0.115926;
  }
  return clampUnit(out);
}

// Brownian noise: integrate white noise and leak, so it wanders slowly
// instead of drifting off to infinity.
export function fillBrown(out, random = Math.random) {
  let last = 0;
  for (let i = 0; i < out.length; i++) {
    const w = random() * 2 - 1;
    last = (last + 0.02 * w) / 1.02;
    out[i] = last * 3.5;
  }
  return clampUnit(out);
}

function clampUnit(out) {
  for (let i = 0; i < out.length; i++) {
    if (out[i] > 1) out[i] = 1;
    else if (out[i] < -1) out[i] = -1;
  }
  return out;
}

export const NOISE_FILLS = { white: fillWhite, pink: fillPink, brown: fillBrown };
export const SOUND_IDS = Object.keys(NOISE_FILLS);
