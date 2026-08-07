/* Menagerie — every dream written down leaves a creature behind.
 *
 * Ported unchanged from the pre-React app. Pure flavour, not data: the
 * randomness stays random and is not tested.
 */
import { genId } from "./storage.js";

export const RARITIES = [
  ["Common", "rare-common", 55],
  ["Uncommon", "rare-uncommon", 25],
  ["Rare", "rare-rare", 12],
  ["Epic", "rare-epic", 6],
  ["Legendary", "rare-legendary", 2],
];

export const CREATURE_POOL = [
  { k: ["water", "ocean", "sea", "drown", "wave", "rain", "flood"], e: "🪼", names: ["Nyxjelly", "Tidewraith", "Deepglow"] },
  { k: ["fall", "falling", "fell", "drop", "sky", "float", "fly", "weightless"], e: "🌙", names: ["Voidmoth", "Lunefall", "Aetherling"] },
  { k: ["chase", "run", "escape", "monster", "dark", "fear", "scared", "teeth"], e: "🦑", names: ["Dreadmaw", "Shadowsquid", "Nightcrawl"] },
  { k: ["city", "building", "street", "stairs", "door", "house", "room"], e: "🏙️", names: ["Labyrinthine", "Grayspire", "Foldtown"] },
  { k: ["light", "neon", "glow", "fire", "sun", "gold", "bright"], e: "✨", names: ["Emberkin", "Neonwisp", "Glimmerfae"] },
  { k: ["love", "kiss", "warm", "friend", "family", "home", "soft"], e: "🕊️", names: ["Heartdove", "Warmthling", "Soulfeather"] },
  { k: ["snake", "animal", "beast", "wolf", "bird", "dog", "cat"], e: "🐉", names: ["Wyrmling", "Beastheart", "Fangshade"] },
  { k: ["death", "dead", "grave", "end", "lost", "cry", "gone"], e: "💀", names: ["Mournshade", "Lastbreath", "Hollowking"] },
];

const STANDARD = { e: "🌀", names: ["Mistling", "Fogform", "Driftghost"] };

export const ADJ = ["Whispering", "Drowned", "Endless", "Velvet", "Fractured",
                    "Silent", "Molten", "Hollow", "Radiant", "Weeping"];

const STOP = new Set(
  ("i a an the was were am is are of to in on at and or but my me we you it that " +
   "this through into past over under back backward forward").split(" ")
);

function pickRarity() {
  let r = Math.random() * 100, a = 0;
  for (const [n, c, w] of RARITIES) { a += w; if (r <= a) return [n, c]; }
  return ["Common", "rare-common"];
}

function matchCreature(text) {
  const t = String(text || "").toLowerCase();
  for (const c of CREATURE_POOL) if (c.k.some((k) => t.includes(k))) return c;
  return STANDARD;
}

function titleFrom(text) {
  const words = String(text || "").toLowerCase().replace(/[^a-z\s]/g, "")
    .split(/\s+/).filter((w) => w && !STOP.has(w));
  const noun = words.slice(0, 2).map((w) => w[0].toUpperCase() + w.slice(1)).join(" ") || "Dream";
  return ADJ[Math.floor(Math.random() * ADJ.length)] + " " + noun;
}

/** A creature (and a dream title) from a dream text. */
export function newCreature(text) {
  const basis = matchCreature(text);
  const [rare, rareClass] = pickRarity();
  return {
    id: genId("cr"),
    e: basis.e,
    name: basis.names[Math.floor(Math.random() * basis.names.length)],
    rare, rareClass,
    power: 20 + Math.floor(Math.random() * 80),
    lucid: 1 + Math.floor(Math.random() * 10),
    date: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
    title: titleFrom(text),
  };
}
