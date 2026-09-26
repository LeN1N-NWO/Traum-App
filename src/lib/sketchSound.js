/* Der Ton zum Glimpse (26.09.2026, Antons Ansage: „im Hintergrund wird
 * parallel auch das Audio erstellt"). Zwei Spuren, beide aus Text — damit
 * sie entstehen können, WÄHREND die Bilder gemalt werden (ein Modell, das
 * den fertigen Film anschaut, müsste auf ihn warten):
 *
 *   · Atmosphäre — fal-ai/mmaudio-v2/text-to-audio, $0,001/s:
 *     Geräusche aus den Dingen der Szenen (Sand, Zug, Meer …).
 *   · Musik — fal-ai/ace-step/prompt-to-audio (Open Source), $0,0002/s:
 *     Stil aus dem gewählten Look, Stimmung aus der Analyse.
 *
 * Der Server mischt beide (Musik leiser, ein- und ausgeblendet), das iPhone
 * legt die Spur unter den Film. Ton ist Kür: Scheitert er, bleibt der Film
 * stumm, nie scheitert der Glimpse daran.
 *
 * Alles hier ist eine feste Regel, keine zusätzliche KI — derselbe Traum
 * im selben Look klingt immer gleich gedacht, und es kostet nichts. */

/* Look → Musik. Jeder Stil der Tabelle in styles.js hat einen Eintrag;
   sketchSound.test.js prüft das, damit ein neuer Stil nicht stumm auf die
   Vorgabe fällt. */
export const STYLE_MUSIC = {
  ultrareal: "cinematic ambient score, soft strings, warm piano, subtle pulse",
  noir: "slow smoky jazz, muted trumpet, brushed drums, upright bass, late night",
  dreamlike: "dreamy ambient lullaby, soft felt piano, warm synth pads, shimmering bells",
  romantic: "tender romantic piano and strings, gentle waltz feel",
  dark: "dark ambient drone, low cello, distant choir, tense and slow",
  surreal: "surreal ambient, reversed piano, floating synth textures, music box",
  nostalgic: "nostalgic lo-fi, warm tape-saturated piano, vinyl crackle, soft guitar",
  adventurous: "adventurous orchestral, light percussion, soaring strings, hopeful",
  goldenage: "golden age hollywood orchestra, lush strings, harp, soft brass",
  fantasyanime: "fantasy anime score, gentle piano, flute, airy strings, wonder",
  ink: "minimal japanese ambient, koto, shakuhachi flute, sparse and calm",
  oilpaint: "classical chamber music, cello and piano, slow and warm",
  marker: "playful indie, ukulele, glockenspiel, light hand claps",
  actionfigure: "playful toy-box score, pizzicato strings, marimba, cheeky",
  marionette: "whimsical music box waltz, celesta, pizzicato, old-fashioned",
  clay: "playful claymation score, marimba, pizzicato strings, bouncy tuba",
  papercut: "delicate folk, acoustic guitar, glockenspiel, soft whistling",
  papiermache: "quirky folk, accordion, toy piano, gentle percussion",
  screenprint: "retro synth pop, warm analog synths, mellow drum machine",
};
const DEFAULT_MUSIC = STYLE_MUSIC.dreamlike;

/* Stimmung aus der Analyse — sie steht in der Sprache des Traums. Nur
   bekannte Wörter werden übersetzt; alles andere fällt weg, statt ein
   Musikmodell mit einem deutschen Wort zu verwirren. */
const MOODS = [
  [/(unheimlich|eerie|creepy|spooky|gruselig)/i, "eerie, mysterious"],
  [/(angst|fear|scared|panik|panic|bedroh|threat)/i, "tense, anxious"],
  [/(traurig|sad|melanch|wehmut|wehmüt|wistful|verlust|loss)/i, "melancholic, wistful"],
  [/(fröhlich|froh|happy|joy|heiter|lustig|funny|glück)/i, "joyful, light"],
  [/(ruhig|calm|peace|friedlich|sanft|gentle)/i, "calm, peaceful"],
  [/(geheim|mystery|mysteri|rätsel)/i, "mysterious"],
  [/(romant|liebe|love|zärtlich)/i, "tender, romantic"],
  [/(abenteuer|advent|aufregend|exciting|wild)/i, "adventurous, exciting"],
  [/(nostalg|erinner|memory|kindheit|childhood)/i, "nostalgic"],
  [/(verwirr|confus|seltsam|strange|bizarr|surreal)/i, "strange, surreal"],
];
export function moodWords(mood) {
  const m = String(mood || "");
  const hit = MOODS.find(([re]) => re.test(m));
  return hit ? hit[1] : "";
}

/* Dinge in den Szenen → Geräusche. Ganze Wörter (wie pickParticles), damit
   „stare" kein „star" und „seat" kein „sea" wird. Höchstens vier, sonst
   wird die Atmosphäre ein Brei. */
const SOUNDS = [
  [/\b(sea|ocean|waves?|beach|shore|meer|strand|welle[n]?)\b/i, "gentle ocean waves"],
  [/\b(rain|raining|regen)\b/i, "soft rain"],
  [/\b(storm|thunder|gewitter|donner)\b/i, "distant thunder"],
  [/\b(wind|windy|breeze|sand|desert|wüste)\b/i, "soft wind"],
  [/\b(train|railway|carriage|zug|bahn)\b/i, "a distant train rumbling"],
  [/\b(forest|woods|trees?|wald|bäume)\b/i, "rustling leaves, night birds"],
  [/\b(fire|flames?|burning|feuer|kamin)\b/i, "crackling fire"],
  [/\b(city|street|traffic|stadt|straße)\b/i, "distant city hum"],
  [/\b(clocks?|uhr|uhren|ticking)\b/i, "clocks ticking"],
  [/\b(bells?|chimes?|glocke[n]?)\b/i, "wind chimes"],
  [/\b(water|river|stream|lake|fluss|wasser)\b/i, "flowing water"],
  [/\b(birds?|crane|vogel|vögel|kranich)\b/i, "wings fluttering"],
  [/\b(snow|ice|schnee|eis)\b/i, "cold hush, crunching snow"],
  [/\b(night|stars|moon|nacht|sterne|mond)\b/i, "crickets at night"],
  [/\b(door|doors|tür|türen)\b/i, "a creaking door"],
  [/\b(piano|klavier)\b/i, "a faint piano note echoing"],
];
export function ambienceWords(beats) {
  const text = (Array.isArray(beats) ? beats : []).join(" ");
  const out = [];
  for (const [re, sound] of SOUNDS) {
    if (re.test(text) && !out.includes(sound)) out.push(sound);
    if (out.length >= 4) break;
  }
  return out;
}

/* Die langsame Kamera des Glimpse will langsame Musik. */
export const SOUND_BPM = 68;
/* Nie: Stimmen, Gesang, harte Geräusche — der Ton liegt unter einem Traum. */
export const SOUND_NEGATIVE = "speech, voice, talking, singing, vocals, lyrics, harsh noise, distortion, loud impacts";

/** Beide Prompts für einen Glimpse. `seconds` = Filmlänge (gedeckelt). */
export function buildSoundPrompts({ styleId, mood, beats, seconds }) {
  const music = [STYLE_MUSIC[styleId] || DEFAULT_MUSIC, moodWords(mood), `slow, ${SOUND_BPM} bpm`, "instrumental, no vocals", "cinematic, soft dynamics"]
    .filter(Boolean).join(", ");
  const things = ambienceWords(beats);
  const ambience = ["dreamy night ambience", ...(things.length ? things : ["soft wind", "distant hum"]), "calm, spacious, gentle"]
    .join(", ");
  return { music, ambience, negative: SOUND_NEGATIVE, seconds: soundSeconds(seconds) };
}

/** Dauer der Tonspur: Filmlänge, auf ganze Sekunden, 8 bis 45. */
export function soundSeconds(seconds) {
  const s = Math.ceil(Number(seconds) || 16);
  return Math.max(8, Math.min(45, s));
}

/** Einkauf der Tonspur in USD — beide Modelle zahlen je Sekunde. */
export const SOUND_USD_PER_SECOND = 0.001 + 0.0002;
export function soundCostUsd(seconds) {
  return soundSeconds(seconds) * SOUND_USD_PER_SECOND;
}
