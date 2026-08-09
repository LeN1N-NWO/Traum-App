/* The film options: which renderer, and how many seconds.
 *
 * Both cost and price are derived from ONE number per model — its per-second
 * rate — so a price change is a single edit and the credit figures cannot
 * drift away from what we actually pay.
 *
 * Rates confirmed 08.08.2026 (fal.ai model pages); minimax duration range
 * re-measured 09.08.2026 — the queue ACCEPTS any duration at submit and only
 * validates at render time, so a wrong minimum here costs real credits and
 * comes back as a failed job minutes later:
 *   minimax/h3   768P   $0.08 / second   5–15s  ("ge: 5" per its validator)
 *   seedance 2.5 720p   $0.473 / second  up to 30s, native single take
 *
 * 1 credit = $0.08 = one image, so minimax/h3 works out at exactly one
 * credit per second of film. That is a happy accident worth keeping: it is
 * the rare pricing rule a person can hold in their head.
 */
import { PRICES } from "./pricing.js";

export const VIDEO_MODELS = [
  {
    id: "standard",
    slug: "minimax/h3/image-to-video",
    creditsPerSecond: 1,          // $0.08/s ÷ $0.08 per credit
    min: 5, max: 15, step: 1, preset: 6,
  },
  {
    id: "premium",
    slug: "bytedance/seedance-2.5/image-to-video",
    creditsPerSecond: 6,          // $0.473/s ÷ $0.08 — rounded up, never down
    min: 5, max: 30, step: 5, preset: 15,
  },
];

export function videoModel(id) {
  return VIDEO_MODELS.find((m) => m.id === id) || VIDEO_MODELS[0];
}

/** What a film costs: the animation, plus a keyframe — unless the film
 *  animates an image the dream already has, which costs nothing new. */
export function priceForFilm(modelId, seconds, { ownKeyframe = false } = {}) {
  const m = videoModel(modelId);
  const secs = clampSeconds(modelId, seconds);
  return secs * m.creditsPerSecond + (ownKeyframe ? 0 : PRICES.keyframe);
}

/** Keep a length inside what the model actually accepts — fal rejects the
 *  rest with a validation error, and finding that out costs a round trip. */
export function clampSeconds(modelId, seconds) {
  const m = videoModel(modelId);
  const n = Math.round((Number(seconds) || m.preset) / m.step) * m.step;
  return Math.min(Math.max(n, m.min), m.max);
}
