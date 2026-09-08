/* Style templates — fixed constants, never an LLM call.
 *
 * The analysis guesses one of these; the wizard pre-selects it and the person
 * can change it. Each `prompt` fills the Art Style / Lighting / Camera /
 * Details slots of the Nano Banana six-element formula so the master prompt
 * reads as one intentional instruction rather than a keyword pile.
 *
 * `poster` describes the title card that opens a dream: which of the classic
 * poster archetypes the layout follows, what the title lettering looks like,
 * and the restricted palette. ⚠ Nothing reads it today (08.09.2026) — the
 * poster builder it was written for is gone; the eight mood styles keep it
 * as a spec for when a title card returns, the craft styles never had one.
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
 *  ⚠ `painterly` heißt „ohne Foto-Anker", nicht „gemalt": Auch die
 *  FOTOGRAFIERTEN Handwerksstile (Knete, Papier, Marionette, Spielfigur)
 *  tragen die Marke. Der Anker bestellt „echte Haut mit sichtbaren Poren"
 *  (cinematography.js, PHOTOREAL) — eine Knetfigur mit Poren ist ein
 *  Prompt, der sich selbst widerspricht. Dass die Szene fotografiert ist,
 *  steht bei diesen Stilen im Prompttext selbst.
 *
 *  ⚠ Die Vorgabe ist `true`: Ein unbekannter Stil ist eher ein neuer
 *  fotografischer als ein neuer gemalter, und der Anker ist der Grund,
 *  warum die Bilder seit dem 24.08. nach Fotografie aussehen. */
export function photorealFor(styleId) {
  return !styleById(styleId)?.painterly;
}

/** Die Stile, die der Wizard SOFORT zeigt — der Rest steht hinter „Mehr
 *  Stile". Dieselbe Liste bekommt die Analyse zum Raten: Wer einen Traum
 *  aufschreibt, soll einen Stimmungs-Stil vorgeschlagen bekommen, keinen
 *  Handwerksstil — »Knete« ist eine Wahl, nie ein Vorschlag. */
export function featuredStyles() {
  return STYLES.filter((s) => s.featured);
}

export function moreStyles() {
  return STYLES.filter((s) => !s.featured);
}

/** Der Stil-Anker für den Film-Regisseur: Look UND Bewegung. Die
 *  Bewegungssprache (`motion`) gibt es nur bei den Stilen aus der
 *  Prompt-Bibliothek; die acht Stimmungs-Stile beschreiben nur den Look,
 *  und Seedance bewegt sie, wie es will. */
export function filmStyleAnchor(styleId) {
  const s = styleById(styleId);
  return s.motion ? `${s.prompt}\n${s.motion}` : s.prompt;
}

export const STYLES = [
  {
    id: "ultrareal",
    featured: true,
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
    featured: true,
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
    featured: true,
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
    featured: true,
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
    featured: true,
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
    featured: true,
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
    featured: true,
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
    featured: true,
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

  /* ── Die Handwerksstile (Antons Auswahl vom 08.09.2026) ────────────────
   *
   * Quelle: „Atomic Gains · Animation Style Prompts, Volume One" — 33
   * Master-Prompts für Seedance 2.5. Anton hat elf davon ausgewählt:
   * Nr. 1, 3, 6, 9, 11, 13, 14, 20, 22, 25, 28.
   *
   * ⚠ Die Vorlagen sind VIDEO-Prompts. Etwa die Hälfte jedes Textes ist
   * Bewegungssprache („animate on twos", „smear frames", „pendulum weight
   * settling a beat late") — dem Bildmodell hilft das nichts, dem
   * Film-Regisseur schon. Deshalb zwei Felder je Stil, beide wörtlich aus
   * der Vorlage, nur getrennt:
   *   `prompt`  — der LOOK (Material, Linie, Farbe, Licht, Kamera, analoge
   *               Eigenart). Landet in jedem Raster.
   *   `motion`  — die BEWEGUNG. Landet über filmStyleAnchor() beim
   *               Regisseur, nie im Bild.
   * Die „Avoid"-Listen bleiben drin: Bei diesen Stilen ist das Verbot
   * („no CGI, no photorealism") die halbe Miete, weil das Modell sonst in
   * seinen Standardlook zurückfällt.
   *
   * Alle elf sind `painterly: true` — siehe photorealFor(): Der Foto-Anker
   * bestellt Poren, und die haben weder Knete noch Gouache. Keiner ist
   * `featured` außer Ink und Claymation: die zwei, die am weitesten von den
   * acht Stimmungs-Stilen weg liegen, damit die erste Reihe die Bandbreite
   * zeigt statt zehn Spielarten von „cinematic". */
  {
    id: "goldenage",
    painterly: true,
    label: "Old Animation",
    emoji: "🎞",
    prompt: "An authentic late-1930s hand-painted American theatrical animated feature, created using " +
            "traditional pencil animation, hand-inked acetate cels, opaque cel paint and separately " +
            "painted gouache backgrounds. Characters have clean but subtly imperfect dark charcoal or " +
            "brown-black ink outlines with gentle variation in thickness; simplified but believable " +
            "anatomy, rounded organic forms, strong readable silhouettes, expressive eyes and faces, " +
            "elegant hands and clear theatrical posing. Hair and clothing simplified into large graphic " +
            "shapes. Mostly flat opaque cel-painted colours with restrained two-tone shadow shapes; " +
            "surfaces matte and graphic. Backgrounds look like lavish hand-painted gouache storybook " +
            "paintings with visible brush texture, softened distant detail and atmospheric perspective — " +
            "softer edges and less outlining than the characters. Restrained early-Technicolor palette of " +
            "aged ivory, cream, faded peach, dusty rose, brick red, ochre, warm brown, sage green, olive, " +
            "muted turquoise, dusty blue, smoky purple and charcoal — physical paint pigments, not digital " +
            "RGB. Lighting painted into the artwork as broad graphic light and shadow shapes: warm cream or " +
            "golden sunlight, smoky blue, violet and grey nights rather than pure black. Only subtle " +
            "analogue character: very fine film grain, slight celluloid warmth, soft optical resolution, " +
            "tiny registration imperfections. Avoid photorealism, 3D CGI, modern Pixar-style rendering, " +
            "anime, vector art, glossy digital painting, HDR lighting, neon colours, heavy VHS effects, " +
            "exaggerated sepia and extreme rubber-hose styling.",
    motion: "The animation moves like photographed cel animation: held drawings between key poses, " +
            "clear theatrical staging, hair and clothing as large graphic shapes, never modern " +
            "interpolated smoothness or rubber-hose extremes.",
  },
  {
    id: "fantasyanime",
    painterly: true,
    label: "90s Fantasy Anime",
    emoji: "🐉",
    prompt: "Lush 1990s fantasy OVA anime with beautiful hand-painted backgrounds and elevated " +
            "cinematic staging. Characters feature elegant fantasy anime design: expressive eyes, " +
            "stylized noses, long hair flowing in large drawn masses, capes, armour, tunics, jewellery " +
            "and layered cloth; anatomy stylized but credible. Backgrounds are vital: forests, ruined " +
            "temples, mountains, castles, moonlit plains and magical skies, richly painted, atmospheric " +
            "and detailed, with warm firelight, cool moonlight, hand-painted mist and magical glow. " +
            "Cel colour soft but rich, classic shadow shapes with subtle painted highlights. Magic " +
            "effects hand-drawn and luminous — sparkles, rune circles, energy trails, light bursts. " +
            "Avoid modern hyper-rendered fantasy game imagery.",
    motion: "Motion feels romantic and dramatic: lingering beauty shots, cape movement, elegant sword " +
            "swings, magical transformations, painterly wind and grand fantasy framing.",
  },
  {
    id: "ink",
    featured: true,
    painterly: true,
    label: "Ink",
    emoji: "🖌",
    prompt: "Sophisticated East Asian sumi-e ink-wash painting on textured rice paper: bold black " +
            "calligraphic brushwork, diluted grey washes, restrained mineral pigments, negative space. " +
            "The image must feel physically painted with wet ink, never digitally illustrated. " +
            "Characters are formed from confident calligraphic silhouettes with elegant simplified " +
            "anatomy; facial detail concentrated around the eyes, brows, mouth and hands; clothing " +
            "flows as broad expressive brush shapes rather than individually rendered folds. Natural " +
            "brush behaviour: strokes begin dark and saturated, then gradually dry and break apart — " +
            "feathered edges, pooled ink, uneven absorption, dry-brush texture, subtle rice-paper fibres. " +
            "Backgrounds are atmospheric ink washes: distant mountains fade into pale grey, mist is " +
            "untouched paper, rain is rapid brush marks, clouds emerge from negative space. Restrained " +
            "accents of oxidised red, muted indigo, pale jade, faded ochre or mineral gold while black " +
            "ink and warm paper remain dominant. Wide shots sparse and monumental; telephoto shots " +
            "compress mountains into layered ink silhouettes; close-ups simplify the background and " +
            "concentrate brush detail around the eyes. No generic anime rendering, digital watercolour " +
            "filters, CGI, glossy surfaces or photorealistic textures.",
    motion: "Movement exploits the ink medium: sword swings become sweeping brush arcs, running figures " +
            "stretch briefly into directional ink marks, impacts erupt into black splashes, smoke blooms " +
            "through wet-in-wet pigment. During extreme motion characters may partially dissolve into " +
            "brush strokes before reforming; slow moments remain elegant and controlled.",
  },
  {
    id: "oilpaint",
    painterly: true,
    label: "Oil Painting",
    emoji: "🖼",
    prompt: "Painterly textured 3D, prestige-series hybrid cinematic look: characters and environments " +
            "fully dimensional with believable weight, but absolutely every visible surface treated as " +
            "hand-painted illustration rather than photoreal CG. Skin is layered painted colour shapes " +
            "with visible directional brushwork, simplified pores and sculptural highlights; eyes carry " +
            "small painted highlights and slightly exaggerated expressive shapes; hair reads as broad " +
            "painted clumps and graphic masses, never individual strands; clothing has illustrated " +
            "weave, frayed edges and wear painted into the material. Architecture, metal, dust, " +
            "concrete and grime carry obvious painterly texture with irregular brush marks. Lighting " +
            "theatrical and strongly motivated, usually one dominant source; shadows contain visible " +
            "painted colour transitions rather than smooth digital gradients. Cinematography in " +
            "prestige live-action drama language: 50mm–135mm lenses, shallow depth of field, strong " +
            "foreground layering, carefully composed close-ups. Fine illustrated grain and subtle " +
            "paper-like texture unify every frame. Must not appear: photoreal pores, photographic skin, " +
            "individually simulated hair strands, clean glossy CG surfaces, flat cel shading, " +
            "children's-cartoon proportions, excessively saturated cheerful lighting.",
    motion: "Grounded body mechanics and subtle dramatic acting; slow pushes, restrained handheld " +
            "drift and rack focus. Smoke, dust, sparks and atmosphere are hand-drawn 2D painterly " +
            "animation composited over the scene, moving on deliberately stylized frame timing rather " +
            "than realistic particle simulation. No weightless motion-capture float.",
  },
  {
    id: "marker",
    painterly: true,
    label: "Marker Doodle",
    emoji: "🖍",
    prompt: "Everything drawn with felt-tip marker pens on ordinary paper: bleeding ink, overlapping " +
            "strokes, uneven colouring, colour wandering outside the outlines, visible paper fibres. " +
            "Character designs are simple and childlike, but the drawing is confident and the staging " +
            "is sophisticated. No vector illustration, no clean tablet rendering, no digital smoothness.",
    motion: "Fast movement produces thick marker smears and exaggerated drawing deformation; the " +
            "animation is far more sophisticated than the simple designs suggest.",
  },
  {
    id: "actionfigure",
    painterly: true,
    label: "Action Figure",
    emoji: "🦸",
    prompt: "Late-1990s live-action / CGI action-figure fantasy: small articulated action figures have " +
            "come to life inside a completely realistic human-sized world. The environment stays fully " +
            "photoreal and live-action — real rooms, real furniture, wood, carpet, dust, fabric, " +
            "household objects, natural imperfections, believable practical lighting. The living " +
            "characters are 15–25 cm tall manufactured action figures and must always look like REAL " +
            "PHYSICAL TOYS, never miniature humans: injection-moulded hard plastic bodies, slightly " +
            "glossy painted surfaces, tiny moulded costume details, visible seams, screw holes, ball " +
            "joints, hinge joints, moulded hair, painted eyes, paint wear and subtle scratches; clothes " +
            "are sculpted plastic. Constantly emphasise the scale difference: table edges are cliffs, " +
            "carpet fibres thick vegetation, chair legs columns. Shot like a professionally " +
            "photographed 1990s adventure movie, camera near action-figure eye level, macro and " +
            "close-focus photography, low angles, believable optical depth of field rather than " +
            "miniature tilt-shift. Naturalistic practical lighting with real reflections on glossy " +
            "moulded plastic and accurate small contact shadows. Do not turn the environment into CGI; " +
            "no cute vinyl toys, no oversized cartoon eyes, no smooth Pixar-like surfaces.",
    motion: "Limbs pivot around visible joints, shoulders rotate mechanically, heads turn from the neck " +
            "joint, torso movement slightly restricted — a rigid articulated object brought to life, " +
            "with convincing weight, momentum, impacts and small physical reactions. No rubbery limbs, " +
            "no squash-and-stretch, no cartoon physics, no weightless CGI movement.",
  },
  {
    id: "marionette",
    painterly: true,
    label: "Puppet Theatre",
    emoji: "🎭",
    prompt: "Filmed marionette theatre on a miniature gilded proscenium stage. Every character is a " +
            "carved wooden marionette with a glossy painted face, fixed glass eyes, a hinged jaw and " +
            "articulated wooden limbs. Fine control strings rise from wrists, knees and head into the " +
            "darkness above the stage and catch the light — string presence is honest and visible. Sets " +
            "are theatrical machinery: painted canvas backdrops, flat scenery wings sliding in grooves, " +
            "a cardboard moon on a wire. Lighting is warm footlight cream from below and a follow-spot " +
            "from front-of-house, throwing tall soft shadows on the backdrop; the crimson curtain and " +
            "gilt gold frame are allowed in wide shots. Camera sits in the auditorium: wides, gentle " +
            "push-ins, occasional close-ups where wood grain and chipped paint show. Must not appear: " +
            "stringless figures, flesh-like skin, 3D CG smoothness, real ocean or sky, camera positions " +
            "impossible from a theatre seat.",
    motion: "Limbs swing with real pendulum weight, always settling a beat after the body stops; the " +
            "hinged jaw claps when a puppet speaks; facial expressions never change. Wave-boards rock " +
            "in sequence for water. String movement stays visible throughout.",
  },
  {
    id: "clay",
    featured: true,
    painterly: true,
    label: "Claymation",
    emoji: "🗿",
    prompt: "Premium handcrafted claymation stop-motion, photographed practically on miniature sets. " +
            "Characters look physically sculpted by hand from soft modelling clay: chunky rounded " +
            "proportions, simplified anatomy, large expressive eyes, oversized hands, broad mouths and " +
            "charmingly imperfect facial shapes, with subtle handmade irregularities, tiny dents, " +
            "fingerprints and slightly uneven sculpted surfaces. Clay combined with real tactile " +
            "materials: thick wool, yarn, fuzzy fibres, felt, fabric and coarse handmade hair with " +
            "visible individual strands and clumps. Environments are elaborate hand-built miniature sets " +
            "of painted wood, plaster, clay, fabric and tiny practical props — physically constructed, " +
            "slightly imperfect, richly textured. Warm practical miniature lighting, soft directional " +
            "shadows, rich saturated colours, subtle cinematic depth of field; macro and medium-close " +
            "photography reveals the physical textures of clay, wool, paint and miniature scenery. " +
            "Avoid smooth digital 3D surfaces, plastic CGI, perfect geometry, realistic human skin, " +
            "digital motion blur or overly clean computer-generated environments.",
    motion: "Authentic frame-by-frame stop-motion timing: roughly twelve unique poses per second on " +
            "twos, tiny positional variations between frames, brief held poses, slightly stepped " +
            "movement, strong readable key poses. Facial expressions change through visibly sculpted " +
            "pose changes. Camera mostly locked, controlled pushes and small pans. No fluid CGI " +
            "interpolation, no 60fps smoothness.",
  },
  {
    id: "papercut",
    painterly: true,
    label: "Paper Cut-Out",
    emoji: "✂️",
    prompt: "Handcrafted paper cut-out stop-motion, built entirely from layered pieces of real textured " +
            "paper and photographed as a physical miniature artwork. Every character, object and " +
            "environment is cut, torn and layered paper: rough deckled edges, visible paper fibres, " +
            "wrinkles, creases, uneven cuts, tiny imperfections and subtle variations in thickness — " +
            "nothing digitally perfect or vector-clean. Strong physical depth through stacked layers: " +
            "foreground foliage, characters, terrain, mountains, clouds and distant scenery sit on " +
            "separate planes, producing small natural shadows between layers. Warm handmade palette of " +
            "faded ochre, burnt orange, rust red, deep navy, dusty teal, cream, tan and muted brown — " +
            "painted, dyed or printed craft paper with slight mottling rather than smooth gradients. " +
            "Characters simplified into readable graphic silhouettes assembled from small articulated " +
            "paper pieces. Soft practical studio illumination falling across a real paper diorama, " +
            "delicate contact shadows emphasising the thickness of each layer. Avoid smooth vector " +
            "graphics, flat digital illustration, glossy CGI, perfect geometric edges, realistic 3D " +
            "materials or heavy motion blur.",
    motion: "Traditional cut-out stop motion: slightly stepped frame-by-frame posing, tiny positional " +
            "changes, brief holds, deliberate limb rotations, subtle handmade jitter; paper leaves " +
            "shift, clouds slide across layers, gentle parallax on slow pushes and pans. Never " +
            "perfectly fluid.",
  },
  {
    id: "papiermache",
    painterly: true,
    label: "Papier-mâché",
    emoji: "📰",
    prompt: "Handcrafted papier-mâché stop-motion fantasy using newspaper pulp, cardboard armatures, " +
            "layered tissue, glued torn-paper strips and hand-painted matte surfaces. Surfaces display " +
            "their physical construction: paper overlaps, warped cardboard, wrinkled tissue, dried glue " +
            "deposits, paint streaks, torn edges and subtle newspaper fragments beneath the colour. " +
            "Characters have exaggerated handmade proportions, uneven noses, slightly mismatched eyes, " +
            "irregular fingers and visible sculptural asymmetry; robes are layered coloured tissue over " +
            "wire-supported bodies. Magic is completely physical: spiralling paper ribbons, cut-paper " +
            "stars, confetti sparks, translucent tissue circles, handmade paper lightning; smoke is " +
            "shredded tissue, fire is layered red and orange cut paper. No digital glowing particles, " +
            "smooth CGI magic, clay surfaces or realistic fabric.",
    motion: "Sophisticated traditional replacement and armature stop-motion with slightly stepped " +
            "timing and tiny tactile imperfections; petals and leaves unfold section by section, " +
            "frame by frame.",
  },
  {
    id: "screenprint",
    painterly: true,
    label: "Vintage Poster",
    emoji: "🖨",
    prompt: "A mid-century screen-printed poster using only four to six physical-looking ink colours. " +
            "Print character: heavy paper texture, slightly uneven ink, tiny missing pigment spots, " +
            "overprinted colours, visible halftone patterns, minor colour-registration errors, edges " +
            "occasionally bleeding into paper fibres. Characters and scenery reduced to large geometric " +
            "shapes, bold silhouettes, strong negative space and limited shading; shadows as one solid " +
            "secondary ink; faces simplified into a few carefully placed graphic elements. Striking " +
            "graphic compositions — extreme diagonals, huge foreground silhouettes, minimal depth. Dust " +
            "as halftone clouds, speed as bold printed wedges. Must not appear: gradients, CGI " +
            "materials, realistic shadows, photographic texture, detailed 3D environments.",
    motion: "When objects move quickly, individual colour layers lag behind by a frame or two; impacts " +
            "create graphic burst shapes; transitions happen as huge blocks of ink wiping across the " +
            "frame.",
  },
];

export function styleById(id) {
  return STYLES.find((s) => s.id === id) || STYLES.find((s) => s.id === "dreamlike");
}
