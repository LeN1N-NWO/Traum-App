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
    resolution: "768P",
    audio: false,                 // liefert von sich aus eine AAC-Spur; einen
                                  // generate_audio-Parameter kennt es nicht,
                                  // also darf er auch nicht gesendet werden
  },
  {
    id: "premium",
    slug: "bytedance/seedance-2.5/image-to-video",
    creditsPerSecond: 6,          // $0.473/s ÷ $0.08 — rounded up, never down
    min: 5, max: 30, step: 5, preset: 15,
    resolution: "720p",
    audio: true,                  // nativer Ton über generate_audio
  },
];

export function videoModel(id) {
  return VIDEO_MODELS.find((m) => m.id === id) || VIDEO_MODELS[0];
}

/* Der komplette fal-Auftrag für einen Film, als reine Funktion — damit die
 * Form je Modell TESTBAR ist, ohne das Netz zu berühren.
 *
 * Warum das nicht im Server inline steht: Bis 17.08.2026 war die
 * 5–15-Sekunden-Klemme von minimax hart in falSubmitVideo verdrahtet.
 * Solange nur ein Modell existierte, fiel das nicht auf; mit dem zweiten
 * hätte sie Premiums 30 Sekunden stillschweigend auf 15 gedrückt — bezahlt
 * worden wären die 30. Modellwissen gehört in die Modelltabelle, nicht in
 * die Versandfunktion.
 *
 * `duration` wird hier je Modell geklemmt. Der Server ruft DIESE Funktion —
 * der Client kann lügen, die Tabelle nicht. */
export function videoSubmitBody(modelId, { imageUrl, prompt, seconds }) {
  const m = videoModel(modelId);
  const body = {
    image_url: imageUrl,
    prompt,
    duration: clampSeconds(m.id, seconds),
    resolution: m.resolution,
  };
  // Nur senden, wo der Parameter existiert: ein unbekanntes Feld kann bei
  // einem strengen Validator den ganzen Auftrag kosten.
  if (m.audio) body.generate_audio = true;
  return { slug: m.slug, body };
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
