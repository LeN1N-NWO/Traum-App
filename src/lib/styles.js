/* Style templates — fixed constants, never an LLM call.
 *
 * The analysis guesses one of these; the wizard pre-selects it and the person
 * can change it. Each `prompt` fills the Art Style / Lighting / Camera /
 * Details slots of the Nano Banana six-element formula so the master prompt
 * reads as one intentional instruction rather than a keyword pile.
 *
 * `poster` styles the title card that opens every dream (see
 * buildPosterPrompt): which of the classic poster archetypes the layout
 * follows, what the title lettering looks like, and the restricted palette.
 * Archetypes were reverse-engineered from seven reference posters (Titanic,
 * Gladiator, E.T., Pulp Fiction, Léon, They Cloned Tyrone, Risky Business):
 * every one of them commits to ONE dominant motif and a strict vertical
 * hierarchy — tagline top, motif middle, title in the lower third, fine-print
 * billing block at the bottom.
 */
/** Verträgt dieser Stil den Foto-Anker?
 *
 *  Die Frage stand seit dem 24.08. als Produktentscheidung im STAND: Was
 *  wird aus `dreamlike` und `surreal`, die den Malerei-Look wörtlich
 *  bestellen? Die Antwort braucht keine Entscheidung, sondern eine
 *  Unterscheidung: Ein gemalter Stil BLEIBT gemalt und bekommt den Anker
 *  einfach nicht. So muss niemand zwischen „fotografisch" und „diesen Stil
 *  behalten" wählen.
 *
 *  ⚠ Die Vorgabe ist `true`: Ein unbekannter Stil ist eher ein neuer
 *  fotografischer als ein neuer gemalter, und der Anker ist der Grund,
 *  warum die Bilder seit dem 24.08. nach Fotografie aussehen. */
export function photorealFor(styleId) {
  return !styleById(styleId)?.painterly;
}

export const STYLES = [
  {
    id: "ultrareal",
    label: "Ultra Real",
    emoji: "🎥",
    // Deakins grammar: one motivated light source, minimal fill, eye-level
    // 40mm, shadows left alone. Serves the story, never the technique.
    prompt: "Naturalistic photoreal cinematography in the style of Roger Deakins: " +
            "one motivated single-source key light, minimal fill with deep honest shadows, " +
            "40mm lens at eye level, T2.8, shallow but restrained depth of field, " +
            "mixed colour temperatures (warm tungsten practicals against cool daylight), " +
            "Kodak Vision3 film-stock colour, fine grain, clean lens without flares, " +
            "invisible technique — nothing ornamental.",
    poster: {
      archetype: "a lone quiet figure small against generous negative space, photographic and unstaged, city or landscape reduced to a silhouette line",
      lettering: "understated clean sans-serif, wide letter-spacing",
      palette: "muted naturals — bone white, slate, one restrained warm accent",
    },
  },
  {
    id: "noir",
    label: "Film Noir",
    emoji: "🕶",
    prompt: "Classic 1940s film noir: hard low-key black-and-white lighting, " +
            "venetian-blind shadow stripes, single harsh key with no fill, wet streets " +
            "and drifting cigarette smoke, deep blacks with glinting highlights, " +
            "35mm lens, slight dutch angle, high-contrast silver-gelatin texture.",
    poster: {
      archetype: "high-contrast face or silhouette cut by hard shadow stripes, smoke curling through a single shaft of light",
      lettering: "bold condensed pulp-novel capitals, slightly distressed",
      palette: "black and white with one blood-red accent",
    },
  },
  {
    id: "dreamlike",
    /* ⚠ Bewusst GEMALT — und deshalb ohne Foto-Anker (siehe photorealFor()).
       Dieser Stil bestellt den Malerei-Look wörtlich; ihm zusätzlich zu
       sagen „das ist eine Fotografie, kein Gemälde" wäre ein Prompt, der
       sich selbst widerspricht, und ein widersprüchlicher Prompt ist
       schlechter als ein schweigender. Wer das ändern will, ändert zuerst
       den Prompttext darunter. */
    painterly: true,
    label: "Dreamlike",
    emoji: "🌙",
    prompt: "Soft dreamlike realism: gentle haze and bloom around every light source, " +
            "muted violet and deep blue palette, diffuse directionless moonlight, " +
            "50mm lens with soft-focus falloff at the frame edges, delicate grain, " +
            "shapes dissolving slightly where the light fades.",
    poster: {
      archetype: "one iconic symbolic moment against a vast night sky — a single silhouette, an outstretched hand, a glowing shape — no faces",
      lettering: "clean luminous logo-like lettering with a soft glow",
      palette: "deep blue and violet night tones with one silver-white light",
    },
  },
  {
    id: "romantic",
    label: "Romantic",
    emoji: "💗",
    prompt: "Warm romantic cinematography: golden-hour backlight with gentle lens flare, " +
            "85mm portrait lens, soft focus falloff, amber and rose palette, " +
            "glowing skin tones, tender intimate framing with shallow depth of field.",
    poster: {
      archetype: "two large faces in a soft overlapping montage filling the upper half, the pivotal place or object small and dramatic below",
      lettering: "elegant refined serif capitals, generously spaced",
      palette: "warm amber and rose against a deep twilight blue",
    },
  },
  {
    id: "dark",
    label: "Dark",
    emoji: "🌑",
    prompt: "Dark cinematic thriller look: hard low-key lighting with deep crushed shadows, " +
            "cold desaturated palette, teal-black tonality, high contrast, " +
            "wide 28mm lens making spaces loom, unsettling negative space, " +
            "faint fog catching the single light source.",
    poster: {
      archetype: "a lone figure swallowed by darkness and negative space, lit by a single cold source, surroundings barely suggested",
      lettering: "sharp cold sans-serif capitals, tightly set",
      palette: "near-black and steel blue with one pale accent",
    },
  },
  {
    id: "surreal",
    /* ⚠ Bewusst GEMALT — und deshalb ohne Foto-Anker (siehe photorealFor()).
       Dieser Stil bestellt den Malerei-Look wörtlich; ihm zusätzlich zu
       sagen „das ist eine Fotografie, kein Gemälde" wäre ein Prompt, der
       sich selbst widerspricht, und ein widersprüchlicher Prompt ist
       schlechter als ein schweigender. Wer das ändern will, ändert zuerst
       den Prompttext darunter. */
    painterly: true,
    label: "Surreal",
    emoji: "🌀",
    prompt: "Surrealist composition: impossible scale and geometry, saturated unnatural colour, " +
            "crisp edges against dreamlike distortion, flat even lighting like a Magritte painting, " +
            "deep focus where everything is unnervingly sharp, calm and wrong at once.",
    poster: {
      archetype: "flat graphic composition on a single solid colour field, one motif repeated or mirrored in an impossible way",
      lettering: "bold graphic display type, slightly off-kilter",
      palette: "one saturated field colour plus two flat accents",
    },
  },
  {
    id: "nostalgic",
    label: "Nostalgic",
    emoji: "📻",
    prompt: "Faded analogue memory: 35mm film grain, slight halation and colour shift, " +
            "warm washed-out palette, soft vignette, drugstore-print contrast, " +
            "the light of a late summer afternoon in an old photograph.",
    poster: {
      archetype: "hand-painted illustrated montage in the classic 1980s one-sheet manner, the key moment painted small beneath the main figure",
      lettering: "casual handwritten script title, like a signature",
      palette: "sun-faded warm tones, cream, dusty red",
    },
  },
  {
    id: "adventurous",
    label: "Adventure",
    emoji: "🧭",
    prompt: "Sweeping adventure cinematography: wide vistas on a 24mm lens, dynamic low angles, " +
            "rich saturated colour, dramatic directional sunlight with long shadows, " +
            "dust and atmosphere in the air, epic sense of scale.",
    poster: {
      archetype: "one heroic full-length figure centred against an immense backlit landscape, monochromatic light flooding the whole frame",
      lettering: "monumental epic serif capitals",
      palette: "one dominant golden or storm tone over the entire poster",
    },
  },
];

export function styleById(id) {
  return STYLES.find((s) => s.id === id) || STYLES.find((s) => s.id === "dreamlike");
}
