/* Style templates — fixed constants, never an LLM call.
 *
 * The analysis guesses one of these six; the wizard pre-selects it and the
 * person can change it. Each template fills the Art Style / Lighting / Details
 * slots of the Nano Banana six-element formula so the master prompt reads as
 * one intentional instruction rather than a keyword pile.
 */
export const STYLES = [
  {
    id: "dreamlike",
    label: "Dreamlike",
    emoji: "🌙",
    prompt: "Soft dreamlike realism, gentle haze and bloom around light sources, " +
            "muted violet and deep blue palette, diffuse moonlight, delicate grain.",
  },
  {
    id: "romantic",
    label: "Romantic",
    emoji: "💗",
    prompt: "Warm romantic cinematography, golden hour backlight and lens flare, " +
            "soft focus falloff, amber and rose palette, tender intimate framing.",
  },
  {
    id: "dark",
    label: "Dark",
    emoji: "🌑",
    prompt: "Dark cinematic thriller look, hard low-key lighting with deep crushed " +
            "shadows, cold desaturated palette, high contrast, unsettling negative space.",
  },
  {
    id: "surreal",
    label: "Surreal",
    emoji: "🌀",
    prompt: "Surrealist composition with impossible scale and geometry, saturated " +
            "unnatural colour, crisp edges against dreamlike distortion, Magritte-like calm.",
  },
  {
    id: "nostalgic",
    label: "Nostalgic",
    emoji: "📻",
    prompt: "Faded analogue memory, 35mm film grain, slight halation and colour " +
            "shift, warm washed-out palette, soft vignette, the look of an old photograph.",
  },
  {
    id: "adventurous",
    label: "Adventure",
    emoji: "🧭",
    prompt: "Sweeping adventure cinematography, wide vistas and dynamic camera angles, " +
            "rich saturated colour, dramatic directional sunlight, epic sense of scale.",
  },
];

export function styleById(id) {
  return STYLES.find((s) => s.id === id) || STYLES[0];
}
