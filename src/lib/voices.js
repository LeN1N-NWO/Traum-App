/* The assistant's six possible voices — the client-side mirror of server.js's
 * VOICE_NAMES allowlist (ids must match exactly, they travel in the hello
 * frame and into Gemini's setup).
 *
 * The ids are Gemini's own voice names, kept as display names on purpose:
 * they are star names — Sulafat, Achernar, Vindemiatrix — which could not
 * fit a dream app better if we had invented them. What gets translated is
 * only the one-word character under each name; `trait` is the key into
 * t.voice.traits.
 */
export const VOICES = [
  { id: "Sulafat", trait: "warm" },
  { id: "Achernar", trait: "soft" },
  { id: "Vindemiatrix", trait: "gentle" },
  { id: "Leda", trait: "young" },
  { id: "Puck", trait: "bright" },
  { id: "Charon", trait: "deep" },
];

export const DEFAULT_VOICE = "Sulafat";

export function isVoice(id) {
  return VOICES.some((v) => v.id === id);
}
