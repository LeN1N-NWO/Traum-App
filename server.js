// Dream Rushes — minimal backend (Bun)
// Holds the API keys server-side and proxies generation so the browser never
// sees credentials. Serves the static app too.
//
// Pipeline for every dream:
//   1) dream text + named reference metadata (tag/category/desc, NOT the
//      photos themselves — DeepSeek-V4-Flash is text-only, no vision on the
//      public API) go to DeepSeek, which writes a Nano-Banana-formula prompt
//      that binds each @tag to "its reference photo".
//   2) that prompt + the actual reference photos go to fal.ai (Nano Banana 2)
//      to render the image(s) — Nano Banana itself IS vision-capable, so the
//      real photo-matching happens here, guided by DeepSeek's prompt.
//   3) film mode additionally feeds the resulting still into fal.ai's
//      minimax/h3/image-to-video to animate it.
// DeepSeek is optional: if DEEPSEEK_KEY is unset or the call fails, step 1
// falls back to a local prompt template so image generation still works.
//
//   1) export FAL_KEY="YOUR_KEY_ID:YOUR_KEY_SECRET"        (fal.ai/dashboard/keys — required)
//      export DEEPSEEK_KEY="YOUR_KEY"                       (platform.deepseek.com — optional, better prompts)
//   2) bun server.js          → http://localhost:8100
//
// Without FAL_KEY the server still boots and serves the app; /api/generate
// then returns a clear, actionable error instead of crashing.
//
// ⚠ LOCALHOST ONLY as it stands. /api/generate has no auth, no rate limit and
// no per-user quota — exposing this to the internet lets anyone spend your
// fal.ai/DeepSeek credits. Real accounts/quotas are blocked on the backend
// decision still pending in docs/STAND.md; until then, don't bind it to a
// public interface (or put an authenticating reverse proxy in front).

import { resolve, sep } from "node:path";

const PORT = process.env.PORT || 8100;
// Web-Wurzel ist der Build, nicht das Repo. Damit liegen .env, .git/, docs/
// und der Servercode selbst ausserhalb dessen, was ueberhaupt aufloesbar ist —
// eine zweite, unabhaengige Schranke zusaetzlich zur Freigabeliste unten.
// Ohne vorherigen `vite build` gibt es kein dist/ und alles antwortet 404.
const ROOT = resolve(import.meta.dir, "dist");

// Reference photos are base64 dataURLs, so bodies are chunky — but not unbounded.
const MAX_BODY = 12 * 1024 * 1024;
const MAX_REFERENCES = 6;
const MAX_DREAM = 2000;
const MAX_FRAGMENT = 120; // per pet/place description, mirrors the client-side cap
const MAX_CRAFTED_PROMPT = 3000; // ceiling on what DeepSeek is allowed to hand to fal.ai

// fal.ai model slugs. UNVERIFIED against fal.ai's actual model catalog —
// confirm at fal.ai/models before relying on this in production. Override via
// env without editing code.
const FAL_MODEL_IMAGE = process.env.FAL_MODEL_IMAGE || "fal-ai/nano-banana-2";
// Reference photos need the EDIT variant of the model. Diagnosed 07.08.: the
// text-to-image endpoint silently ignores image_urls (it even accepts
// image_urls: 123 with a 200), so likenesses never reached the model. The
// /edit endpoint takes image_urls and demonstrably reproduces them.
const FAL_MODEL_IMAGE_EDIT = process.env.FAL_MODEL_IMAGE_EDIT || `${FAL_MODEL_IMAGE}/edit`;
// Given directly by the product owner, not a guess — still worth confirming
// the exact slug in the fal.ai dashboard before production use, model IDs
// there are usually namespaced (e.g. "fal-ai/minimax/...").
const FAL_MODEL_VIDEO = process.env.FAL_MODEL_VIDEO || "minimax/h3/image-to-video";
// Whisper v3 as hosted by fal.ai — used by /api/transcribe (dictation). Slug
// confirmed against fal.ai/models/fal-ai/wizper on 2026-08-08.
const FAL_MODEL_STT = process.env.FAL_MODEL_STT || "fal-ai/wizper";

// DeepSeek-V4-Flash: OpenAI-compatible chat completions API, text-only (no
// image input on the public API as of writing). Used purely to turn the dream
// + reference metadata into a well-formed Nano Banana prompt — the actual
// photos never go to DeepSeek, only to fal.ai afterwards.
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || "deepseek-v4-flash";
const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions";

// ---- prompt hygiene (start) ----
// Scope note, because "prompt injection" means something narrower here than
// usual: the dream text is the user's OWN prompt for their OWN image. Someone
// writing "ignore previous instructions" into it is just using the app — there
// is no privilege boundary to cross and nothing to escalate to. So a blocklist
// of suspicious phrases would be theatre: trivially sidestepped by rewording or
// translating, and badly false-positive-prone (dreams are surreal — "I ignored
// everything I'd been told" is an ordinary sentence to find in one).
//
// What is actually worth defending:
//   1. PASTED text. A dream copied off a website can carry characters the user
//      cannot see — zero-width joiners, bidi overrides, Unicode TAG characters
//      (U+E0000..E007F) — which are invisible to them and fully visible to the
//      model. That is a genuine untrusted-data path into the prompt.
//   2. Prompt STRUCTURE. Free text used to be concatenated in raw, so a newline
//      or a stray ")" could restructure the instruction. Fragments are now
//      flattened and delimited so they can only ever read as data.
//   3. DeepSeek's OWN output. It's a second model call whose result becomes a
//      prompt for a third paid API — sanitised the same way as user input
//      before it's trusted, regardless of how well-behaved DeepSeek usually is.
//
// Note: this also strips ZWJ, so emoji sequences (👨‍👩‍👧) degrade to their parts.
// Acceptable — they carry nothing for an image model, and ZWJ is a smuggling
// vector.
const PROMPT_CONTROL_CHARS =
  /[\u{0000}-\u{0008}\u{000B}-\u{001F}\u{007F}-\u{009F}\u{00AD}\u{200B}-\u{200F}\u{202A}-\u{202E}\u{2060}-\u{2064}\u{2066}-\u{206F}\u{FEFF}\u{FFF9}-\u{FFFB}]/gu;
const PROMPT_TAG_CHARS = /[\u{E0000}-\u{E007F}]/gu; // invisible-text smuggling block

// Deliberately does NOT truncate — the caller decides whether an over-long
// dream is rejected or trimmed, so nobody silently loses half their dream.
function sanitizePromptText(raw) {
  let s = String(raw ?? "");
  try { s = s.normalize("NFKC"); } catch { /* lone surrogates etc. — keep as-is */ }
  s = s.replace(PROMPT_TAG_CHARS, "").replace(PROMPT_CONTROL_CHARS, "");
  s = s.replace(/[\r\n\t]+/g, " ");  // single line: only OUR separators shape the prompt
  return s.replace(/\s{2,}/g, " ").trim();
}

// Fragments get embedded inside a clause we build, so they also lose the
// characters that could break out of that clause.
function sanitizeFragment(raw, maxLen) {
  return sanitizePromptText(raw).replace(/[()[\]{}<>"“”'`]/g, "").replace(/\s{2,}/g, " ").trim().slice(0, maxLen);
}

// Cast tags are already constrained client-side to [a-z0-9]{1,12} at creation
// (see index.html), but the server never trusts client-side constraints —
// re-apply the same shape here before a tag ever reaches a prompt.
function sanitizeTag(raw) {
  return String(raw ?? "").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 12);
}

// Local fallback prompt (no LLM call) — used when DEEPSEEK_KEY is unset or
// the DeepSeek call fails, so image generation still works without it. Each
// cast entry the client sent (because its @tag literally appears in the
// dream text) becomes one @tag ↔ reference-image binding, spelled out in the
// prompt so Nano Banana uses that person's/pet's/place's actual likeness
// instead of inventing one whenever the dream mentions them by name.
function buildFallbackPrompt(dream, namedRefs = []) {
  const clauses = namedRefs.map((r, i) => {
    const tag = sanitizeTag(r.tag);
    if (!tag) return null;
    const kind = r.category === "pet" ? "pet" : r.category === "place" ? "place" : "person";
    const desc = sanitizeFragment(r.desc || "", MAX_FRAGMENT);
    const descClause = desc ? `, described as: ${desc}` : "";
    return `Reference image ${i + 1} shows @${tag} (${kind}${descClause}) — whenever "${tag}" appears in the dream below, depict them with this exact likeness, not a generic stand-in.`;
  }).filter(Boolean);
  const refBlock = clauses.length ? `\n${clauses.join(" ")}` : "";
  return `A cinematic, photoreal film still capturing this dream: ${dream}${refBlock}\nNatural cinematic lighting, 9:16 vertical framing, ultra-detailed, accurate hands and faces.`;
}

// DeepSeek-crafted prompt: same job as buildFallbackPrompt() above, but
// written by an LLM following Google's official Nano Banana 6-element
// formula (Subject, Action, Environment, Art Style, Lighting, Details, one
// flowing paragraph) instead of our fixed template — richer, varies per
// dream. DeepSeek never sees the actual photos (text-only API): it gets tag/
// category/description metadata and writes the @tag-binding clauses the same
// way buildFallbackPrompt() does, just in better prose.
async function craftPromptViaDeepseek(dream, namedRefs = []) {
  const key = process.env.DEEPSEEK_KEY;
  if (!key) throw new Error("NO_DEEPSEEK_KEY");

  const refLines = namedRefs.map((r) => {
    const tag = sanitizeTag(r.tag);
    const kind = r.category === "pet" ? "pet" : r.category === "place" ? "place" : "person";
    const desc = sanitizeFragment(r.desc || "", MAX_FRAGMENT);
    return `- @${tag} (${kind}${desc ? `: ${desc}` : ""})`;
  }).join("\n");

  const system = `You are a prompt engineer for Google's Nano Banana (Gemini) image model. Write ONE image prompt using its official 6-element formula — Subject, Action, Environment, Art Style, Lighting, Details — as a single flowing natural-language paragraph, not a keyword list. Style: cinematic, photoreal, 9:16 vertical framing, accurate hands and faces.
If named references are given below, weave in a clear binding clause for each one you use — e.g. "@rex, shown in his reference photo, ..." — so the image model uses that exact photo instead of inventing an appearance. Only use references actually relevant to the dream; never invent new named people/pets/places beyond what's given.
Output ONLY the finished prompt text. No preamble, no markdown, no quotes around it.`;
  const user = `Dream: "${dream}"\n\nAvailable named references (use only if relevant):\n${refLines || "(none)"}`;

  const res = await fetch(DEEPSEEK_API_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      messages: [{ role: "system", content: system }, { role: "user", content: user }],
      stream: false,
    }),
  });
  if (!res.ok) {
    console.error("[DreamRushes] DeepSeek request failed:", res.status, await res.text().catch(() => ""));
    throw new Error("DEEPSEEK_FAILED");
  }
  const data = await res.json().catch(() => null);
  const text = data?.choices?.[0]?.message?.content;
  if (!text || typeof text !== "string") throw new Error("DEEPSEEK_FAILED");
  // DeepSeek's output becomes a prompt for a paid third-party API next —
  // sanitise it exactly like user input, regardless of the source.
  const cleaned = sanitizePromptText(text).slice(0, MAX_CRAFTED_PROMPT);
  if (!cleaned) throw new Error("DEEPSEEK_FAILED");
  return cleaned;
}
// ---- prompt hygiene (end) ----

// ---- rewriting an existing dream ----
// Three levels behind one route, differing only in the system prompt. All of
// them are bounded by the same rule: the dream belongs to the person who
// dreamt it, so nothing may be invented, reordered or reinterpreted.
const REFINE_MODES = {
  correct:
    "Fix spelling, grammar and punctuation in the dream below. Change NOTHING else — " +
    "not a word choice, not the order, not the tone. Return only the corrected text.",
  rewrite:
    "Rewrite the dream below so it reads more vividly and flows better. Keep every event, " +
    "person and place exactly as given, in the same order, in the same emotional register, " +
    "in the same language and person. Invent nothing. Return only the rewritten text.",
  elaborate:
    "Work the dream below into a fuller piece of storytelling: add sensory detail and a " +
    "clearer arc. You may enrich HOW things are described, but you may NOT add events, " +
    "people or places that are not already there, and you may NOT change their order or " +
    "the emotional register. Keep the same language and person. Return only the text.",
};

async function refineDream(dream, mode) {
  const system = REFINE_MODES[mode];
  if (!system) throw new Error("BAD_MODE");
  const key = process.env.DEEPSEEK_KEY;
  if (!key) throw new Error("NO_DEEPSEEK_KEY");

  const res = await fetch(DEEPSEEK_API_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      messages: [
        { role: "system", content: `${system}\nNo preamble, no markdown, no quotes around it.` },
        { role: "user", content: dream },
      ],
      stream: false,
    }),
  });
  if (!res.ok) {
    console.error("[DreamRushes] refine request failed:", res.status, await res.text().catch(() => ""));
    throw new Error("REFINE_FAILED");
  }
  const data = await res.json().catch(() => null);
  const text = data?.choices?.[0]?.message?.content;
  if (typeof text !== "string") throw new Error("REFINE_FAILED");
  const cleaned = sanitizePromptText(text).slice(0, MAX_DREAM);
  if (!cleaned) throw new Error("REFINE_FAILED");
  return cleaned;
}


// ---- dream analysis (the ONE llm call per dream) ----
//
// This is the wizard's foundation. A single DeepSeek call returns everything
// the rest of the flow needs as structured JSON: the polished text, who and
// where appears in it, the dream broken into beats, and a style guess.
// Everything after this — assigning avatars, splitting beats into 3/5/10
// images, picking a style template, assembling the master prompt — is local
// logic with no further model calls. That is the whole token-economy design.
const ANALYSIS_STYLES = ["ultrareal", "noir", "dreamlike", "romantic", "dark", "surreal", "nostalgic", "adventurous"];
const MAX_ANALYSIS_ITEMS = 8;   // people or places; more is noise, not signal
const ANALYSIS_BEATS = 5;       // fixed: 3/5/10 images are all derived from these

// The master prompt. Its JSON schema is the CONTRACT between the model and
// the app: every field below is a marker the app reads by name, so the shape
// is fixed and normaliseAnalysis() enforces it. The language split is the
// core design decision — fields the person SEES stay in the language they
// wrote in; fields that feed the image model are always English, because
// that is what image models understand best.
const ANALYSIS_SYSTEM = `You read a dream someone just wrote down and return STRICT JSON. No prose, no markdown, no code fences — the response must parse as JSON directly.

Schema (every key is required, exactly these names):
{
  "language": string,      // BCP-47 code of the language the dream is written in, e.g. "de", "en", "tr"
  "text": string,          // the dream, cleaned up — in the SAME LANGUAGE as the input
  "people": [              // every person AND animal appearing in the dream, in order
    {
      "name": string,      // the name if the dream gives one ("Anton", "Rex"), else a short description in the dream's language ("eine fremde Frau")
      "kind": string,      // "person" or "pet" — an animal is "pet"
      "desc": string       // short VISUAL description if the dream provides one, else ""
    }
  ],
  "places": string[],      // every distinct location, in order, in the dream's language
  "beats": string[],       // EXACTLY 5 short scene descriptions, in order — ALWAYS IN ENGLISH
  "style": string,         // one of: ultrareal, noir, dreamlike, romantic, dark, surreal, nostalgic, adventurous
  "mood": string,          // one or two words, in the dream's language
  "title": string,         // a film title for this dream: 1-4 evocative words, in the dream's language, no quotes
  "tagline": string        // one short poster tagline (under 10 words), in the dream's language — like "Nothing on earth could come between them."
}

Why the language split matters: "text", "people[].name", "places" and "mood" are SHOWN to the person and must stay in the language they wrote in — a German dream gets a German improved text. "beats" are rendering instructions for an image model and must be English regardless of the dream's language.

Rules for "text": FIRST understand what actually happened in the dream, then retell it. The input is often dictated speech — fragmented, repetitive, thoughts spoken over each other, false starts. Do not just patch spelling: rewrite it as one flowing, well-told account in the dreamer's language. Merge repetitions, complete fragments, untangle sentences that ran into each other, and make the wording vivid and easy to picture. You may restructure sentences freely as long as the DREAM itself stays untouched: never invent events, people or places that are not there, never drop any, never change the emotional tone, never add interpretation. Keep it first person if it was first person.

Rules for "people": include the dreamer only if they appear as a visible character (then name them as the dream does — "ich"/"I" is fine). A dog, cat or other animal is kind "pet". Empty array if nobody appears.

Rules for "places": one entry per distinct location. A dream that moves from a bedroom to the sky over the sea has TWO places. Empty array if there is no discernible location.

Rules for "beats": exactly 5, always, even for a short dream — split it evenly. Each beat is one English sentence describing what is SEEN, not felt. Refer to people by their "name" so the app can bind reference images.

Rules for "title" and "tagline": they go on a film poster for this dream. The title is what a great director would call this film — short, concrete, evocative; never generic ("My Dream", "A Strange Night" are failures). The tagline is one line that makes a stranger want to watch — it hints at the emotional core without summarising the plot. Both stay in the dream's language.`;

/** One DeepSeek call → the structured shape the wizard runs on. */
async function analyzeDream(dream) {
  const key = process.env.DEEPSEEK_KEY;
  if (!key) throw new Error("NO_DEEPSEEK_KEY");

  const res = await fetch(DEEPSEEK_API_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      messages: [
        { role: "system", content: ANALYSIS_SYSTEM },
        { role: "user", content: `Dream:\n${dream}` },
      ],
      response_format: { type: "json_object" },
      stream: false,
    }),
  });
  if (!res.ok) {
    console.error("[DreamRushes] analyze request failed:", res.status, await res.text().catch(() => ""));
    throw new Error("ANALYZE_FAILED");
  }
  const data = await res.json().catch(() => null);
  const rawText = data?.choices?.[0]?.message?.content;
  if (typeof rawText !== "string") throw new Error("ANALYZE_FAILED");

  return normaliseAnalysis(rawText, dream);
}

// The model's answer is untrusted input twice over: it becomes prompt material
// for a paid third-party call, and it drives the UI. Shape, length and content
// are all pinned here rather than hoped for. Exported so it can be tested
// against malformed answers without touching the network.
export function normaliseAnalysis(rawText, fallbackDream = "") {
  let parsed;
  try {
    // Models sometimes fence JSON despite being told not to.
    const unfenced = String(rawText).replace(/^\s*```(?:json)?\s*|\s*```\s*$/g, "");
    parsed = JSON.parse(unfenced);
  } catch {
    throw new Error("ANALYZE_FAILED");
  }
  if (!parsed || typeof parsed !== "object") throw new Error("ANALYZE_FAILED");

  const text = sanitizePromptText(parsed.text).slice(0, MAX_DREAM) || sanitizePromptText(fallbackDream).slice(0, MAX_DREAM);
  if (!text) throw new Error("ANALYZE_FAILED");

  const list = (value) =>
    (Array.isArray(value) ? value : [])
      .map((v) => sanitizeFragment(v, MAX_FRAGMENT))
      .filter(Boolean)
      .slice(0, MAX_ANALYSIS_ITEMS);

  // People are structured ({name, kind, desc}) so the app can tell pets from
  // humans and pre-fill descriptions. Bare strings are tolerated — an older
  // or sloppier model answer degrades to kind "person" instead of failing.
  const people = (Array.isArray(parsed.people) ? parsed.people : [])
    .map((p) => {
      if (typeof p === "string") return { name: sanitizeFragment(p, MAX_FRAGMENT), kind: "person", desc: "" };
      if (!p || typeof p !== "object") return null;
      return {
        name: sanitizeFragment(p.name, MAX_FRAGMENT),
        kind: p.kind === "pet" ? "pet" : "person",
        desc: sanitizeFragment(p.desc || "", MAX_FRAGMENT),
      };
    })
    .filter((p) => p && p.name)
    .slice(0, MAX_ANALYSIS_ITEMS);

  // Beats drive the image count, so their number is pinned, not trusted.
  // Too few: pad by repeating the last one rather than failing the whole
  // analysis over a formatting slip. Too many: take the first five.
  let beats = list(parsed.beats).slice(0, ANALYSIS_BEATS);
  if (beats.length === 0) beats = [text.slice(0, MAX_FRAGMENT)];
  while (beats.length < ANALYSIS_BEATS) beats.push(beats[beats.length - 1]);

  const style = ANALYSIS_STYLES.includes(parsed.style) ? parsed.style : "dreamlike";

  return {
    // Kept so the app can one day pick its UI language from it; validated so
    // a hallucinated value cannot smuggle arbitrary text into the client.
    language: /^[a-z]{2,3}(-[A-Za-z0-9]{2,8})?$/.test(parsed.language) ? parsed.language : "",
    text,
    people,
    places: list(parsed.places),
    beats,
    style,
    mood: sanitizeFragment(parsed.mood || "", 40),
    // Poster text. Both are SHOWN (dream's language) and later embedded in a
    // prompt we build, so they get the fragment treatment: quotes and brackets
    // stripped, length pinned. Empty is legal — the client then falls back to
    // plain scene images instead of a poster.
    title: sanitizeFragment(parsed.title || "", 60),
    tagline: sanitizeFragment(parsed.tagline || "", 120),
  };
}


// ---- fal.ai calls ----
// Synchronous fal.ai REST endpoint (fal.run/<model>) rather than the queue
// API: simpler, no extra dependency, fine for image/video-gen latencies.
// Revisit if a model runs long enough to need the queue+polling flow.
async function falGenerateImage({ prompt, namedRefs = [] }) {
  const key = process.env.FAL_KEY;
  if (!key) throw new Error("NO_FAL_KEY");

  const input = {
    prompt,
    aspect_ratio: "9:16", // unverified param name/value for this model, see FAL_MODEL_IMAGE note above
  };
  const imageUrls = namedRefs.map((r) => r.img).filter(Boolean);
  if (imageUrls.length) input.image_urls = imageUrls;

  // With references the request MUST go to the edit endpoint — the plain
  // text-to-image endpoint ignores image_urls without erroring, which is how
  // likenesses silently went missing for days. See FAL_MODEL_IMAGE_EDIT note.
  const model = imageUrls.length ? FAL_MODEL_IMAGE_EDIT : FAL_MODEL_IMAGE;

  const res = await fetch(`https://fal.run/${model}`, {
    method: "POST",
    headers: { Authorization: `Key ${key}`, "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    console.error("[DreamRushes] fal.ai image request failed:", res.status, await res.text().catch(() => ""));
    throw new Error("GENERATION_FAILED");
  }
  const data = await res.json().catch(() => null);
  const urls = (data?.images || []).map((img) => img?.url).filter(Boolean);
  if (!urls.length) throw new Error("GENERATION_FAILED");
  return urls;
}

async function falGenerateVideo({ imageUrl, prompt }) {
  const key = process.env.FAL_KEY;
  if (!key) throw new Error("NO_FAL_KEY");

  const res = await fetch(`https://fal.run/${FAL_MODEL_VIDEO}`, {
    method: "POST",
    headers: { Authorization: `Key ${key}`, "content-type": "application/json" },
    body: JSON.stringify({ image_url: imageUrl, prompt }), // param names unverified, see FAL_MODEL_VIDEO note above
  });
  if (!res.ok) {
    console.error("[DreamRushes] fal.ai video request failed:", res.status, await res.text().catch(() => ""));
    throw new Error("GENERATION_FAILED");
  }
  const data = await res.json().catch(() => null);
  const url = data?.video?.url;
  if (!url) throw new Error("GENERATION_FAILED");
  return [url];
}

// Dictation: the client records audio (MediaRecorder) and sends it as a
// base64 data URI; Wizper auto-detects the spoken language, so German and
// English both come back as written text without a language toggle.
async function falTranscribe(audioDataUri) {
  const key = process.env.FAL_KEY;
  if (!key) throw new Error("NO_FAL_KEY");

  const res = await fetch(`https://fal.run/${FAL_MODEL_STT}`, {
    method: "POST",
    headers: { Authorization: `Key ${key}`, "content-type": "application/json" },
    body: JSON.stringify({ audio_url: audioDataUri, task: "transcribe" }),
  });
  if (!res.ok) {
    console.error("[DreamRushes] fal.ai transcribe request failed:", res.status, await res.text().catch(() => ""));
    throw new Error("TRANSCRIBE_FAILED");
  }
  const data = await res.json().catch(() => null);
  const text = data?.text;
  if (typeof text !== "string") throw new Error("TRANSCRIBE_FAILED");
  return text;
}

// ---- local media copies ----
// fal.ai hands back URLs on ITS hosting, with no promise about how long they
// stay reachable. A dream journal that quietly empties out months later is
// worthless, so every generated file is copied here and the journal is given
// the local path instead. The fal URL is the fallback, not the record.
const MEDIA_DIR = resolve(import.meta.dir, "media");
const MEDIA_TYPES = {
  "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp",
  "video/mp4": "mp4", "video/quicktime": "mp4",
};
const MEDIA_MIME = { png: "image/png", jpg: "image/jpeg", webp: "image/webp", mp4: "video/mp4" };
const MAX_MEDIA_BYTES = 60 * 1024 * 1024;

/** Copy one generated file locally. Returns "/media/<name>", or null to keep
 *  using the provider URL — a failed copy must never fail the generation the
 *  person already paid for. */
async function storeMedia(url) {
  try {
    if (!/^https:\/\//.test(url)) return null;
    const res = await fetch(url);
    if (!res.ok) return null;
    const ext = MEDIA_TYPES[(res.headers.get("content-type") || "").split(";")[0].trim()];
    if (!ext) return null;
    const bytes = new Uint8Array(await res.arrayBuffer());
    if (!bytes.length || bytes.length > MAX_MEDIA_BYTES) return null;
    // Named from a hash of the content, so the filename can never carry
    // anything the model or the client chose.
    const name = `${Bun.hash(bytes).toString(36)}.${ext}`;
    await Bun.write(resolve(MEDIA_DIR, name), bytes);
    return `/media/${name}`;
  } catch (e) {
    console.error("[DreamRushes] could not store media locally:", e.message);
    return null;
  }
}

async function storeAll(urls) {
  return Promise.all(urls.map(async (u) => (await storeMedia(u)) || u));
}

// Only ever serves files this server wrote: the name must be exactly the
// hash-plus-extension shape produced above, so nothing else is addressable.
const MEDIA_NAME = /^\/media\/([a-z0-9]{1,20}\.(png|jpg|webp|mp4))$/;
/** The filename a /media/ request resolves to, or null. Exported so the
 *  serving rules can be tested without the network. */
export function resolveMedia(pathname) {
  let rel;
  try { rel = decodeURIComponent(pathname); } catch { return null; }  // malformed %-escape
  const hit = MEDIA_NAME.exec(rel);
  return hit ? { name: hit[1], ext: hit[2] } : null;
}

async function serveMedia(pathname) {
  const hit = resolveMedia(pathname);
  if (!hit) return new Response("Not found", { status: 404 });
  const file = Bun.file(resolve(MEDIA_DIR, hit.name));
  if (!(await file.exists())) return new Response("Not found", { status: 404 });
  return new Response(file, {
    headers: {
      "content-type": MEDIA_MIME[hit.ext],
      // Content-addressed names never change meaning, so they cache forever.
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}

// ---- orchestration ----
// Step 1 (DeepSeek, optional) + step 2 (fal.ai, required) from the pipeline
// comment at the top of the file. DeepSeek failing or being unconfigured
// degrades to the local template rather than blocking generation.
async function generateImages({ dream, namedRefs, prompt: readyPrompt }) {
  // The wizard assembles its own prompt locally (beats, style template,
  // reference clauses) and sends it here — that path costs no LLM call at
  // all. Only the older single-shot form, which sends raw dream text, still
  // asks DeepSeek to word it.
  let prompt = readyPrompt;
  if (!prompt) {
    try {
      prompt = await craftPromptViaDeepseek(dream, namedRefs);
    } catch (e) {
      console.error("[DreamRushes] DeepSeek prompt crafting unavailable, using local template:", e.message);
      prompt = buildFallbackPrompt(dream, namedRefs);
    }
  }
  return falGenerateImage({ prompt, namedRefs });
}

// Film mode: render a keyframe still first (same pipeline as image mode),
// then animate it. minimax/h3 is image-to-video, so it needs a source image
// — there's no text-to-video path anymore.
async function generateVideo({ dream, namedRefs, prompt }) {
  const stills = await generateImages({ dream, namedRefs, prompt });
  const keyframe = stills[0];
  if (!keyframe) throw new Error("GENERATION_FAILED");
  return falGenerateVideo({ imageUrl: keyframe, prompt: prompt || dream });
}

// ---- static file serving ----
// The app directory also holds .env (the fal.ai/DeepSeek keys!), .git/, package.json
// and docs/. Serving it naively hands all of that to anyone who asks, which
// would defeat the whole point of keeping the key server-side. Everything below
// exists to make that impossible; scripts/test-static.mjs keeps it that way.
const TYPES = { html:"text/html", js:"text/javascript", css:"text/css", png:"image/png", jpg:"image/jpeg", jpeg:"image/jpeg", gif:"image/gif", mp4:"video/mp4", webp:"image/webp" };
const ROOT_ABS = resolve(ROOT);
// Deny by default. The app is exactly one page plus whatever lives in clips/ —
// an extension allowlist alone was not enough (it still exposed package.json
// and scripts/*.js). Adding a new public asset is a deliberate edit here.
// Der Build erzeugt genau eine Seite plus gehashte Assets; clips/ kommt
// unveraendert aus public/. Ein neues oeffentliches Asset ist eine bewusste
// Aenderung hier.
const PUBLIC_FILES = new Set(["/index.html"]);
const PUBLIC_DIRS = ["/assets/", "/clips/"];
export function resolveStatic(pathname) {
  let rel;
  try { rel = decodeURIComponent(pathname); } catch { return null; } // malformed %-escape
  if (rel === "/") rel = "/index.html";
  if (rel.includes("\0")) return null;
  // blocks .env, .git/config, .gitignore … and any encoded ../ that decoded here
  if (rel.split("/").some((seg) => seg.startsWith("."))) return null;
  if (!PUBLIC_FILES.has(rel) && !PUBLIC_DIRS.some((d) => rel.startsWith(d))) return null;
  const ext = rel.split(".").pop().toLowerCase();
  if (!Object.hasOwn(TYPES, ext)) return null; // unknown/extension-less → never served
  const abs = resolve(ROOT_ABS, "." + rel);
  if (abs !== ROOT_ABS && !abs.startsWith(ROOT_ABS + sep)) return null; // escaped the app dir
  return { abs, ext };
}
async function serveStatic(pathname) {
  const hit = resolveStatic(pathname);
  if (!hit) return new Response("Not found", { status: 404 });
  const file = Bun.file(hit.abs);
  if (!(await file.exists())) return new Response("Not found", { status: 404 });
  return new Response(file, { headers: { "content-type": TYPES[hit.ext] } });
}

Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);

    if (url.pathname === "/api/analyze" && req.method === "POST") {
      try {
        if (Number(req.headers.get("content-length") || 0) > MAX_BODY) {
          return json({ error: "Request too large." }, 413);
        }
        const body = await req.json();
        const dream = sanitizePromptText(body.dream);
        if (dream.length < 8) return json({ error: "Dream too short." }, 400);
        if (dream.length > MAX_DREAM) return json({ error: "Dream too long." }, 400);
        return json({ ok: true, analysis: await analyzeDream(dream) });
      } catch (e) {
        const map = {
          NO_DEEPSEEK_KEY: [503, "Backend has no DeepSeek key. Set DEEPSEEK_KEY and restart."],
          ANALYZE_FAILED: [502, "Could not read that dream. Try again."],
        };
        const hit = map[e.message];
        if (hit) return json({ error: hit[1] }, hit[0]);
        console.error("[DreamRushes] /api/analyze failed:", e);
        return json({ error: "Server error." }, 500);
      }
    }

    if (url.pathname === "/api/refine" && req.method === "POST") {
      try {
        if (Number(req.headers.get("content-length") || 0) > MAX_BODY) {
          return json({ error: "Request too large." }, 413);
        }
        const body = await req.json();
        const dream = sanitizePromptText(body.dream);
        if (dream.length < 8) return json({ error: "Dream too short." }, 400);
        if (dream.length > MAX_DREAM) return json({ error: "Dream too long." }, 400);
        return json({ ok: true, text: await refineDream(dream, body.mode) });
      } catch (e) {
        const map = {
          BAD_MODE: [400, "Unknown refine mode."],
          NO_DEEPSEEK_KEY: [503, "Backend has no DeepSeek key. Set DEEPSEEK_KEY and restart."],
          REFINE_FAILED: [502, "Could not rework that dream. Try again."],
        };
        const hit = map[e.message];
        if (hit) return json({ error: hit[1] }, hit[0]);
        console.error("[DreamRushes] /api/refine failed:", e);
        return json({ error: "Server error." }, 500);
      }
    }

    if (url.pathname === "/api/transcribe" && req.method === "POST") {
      try {
        if (Number(req.headers.get("content-length") || 0) > MAX_BODY) {
          return json({ error: "Recording too large." }, 413);
        }
        const body = await req.json();
        // Only a data URI is accepted — never a URL. Forwarding a
        // client-supplied URL to fal.ai would make this route a fetch-proxy
        // for whatever address the client names (SSRF by delegation).
        const audio = typeof body.audio === "string" ? body.audio : "";
        if (!/^data:audio\/[\w.+-]+;base64,/.test(audio)) {
          return json({ error: "Expected a base64 audio data URI." }, 400);
        }
        const text = sanitizePromptText(await falTranscribe(audio));
        return json({ ok: true, text });
      } catch (e) {
        const map = {
          NO_FAL_KEY: [503, "Backend has no fal.ai key. Set FAL_KEY and restart."],
          TRANSCRIBE_FAILED: [502, "Could not transcribe that recording. Try again."],
        };
        const hit = map[e.message];
        if (hit) return json({ error: hit[1] }, hit[0]);
        console.error("[DreamRushes] /api/transcribe failed:", e);
        return json({ error: "Server error." }, 500);
      }
    }

    if (url.pathname === "/api/generate" && req.method === "POST") {
      try {
        if (Number(req.headers.get("content-length") || 0) > MAX_BODY) {
          return json({ error: "Request too large." }, 413);
        }
        const body = await req.json();
        // Sanitise before validating, so length limits apply to what actually
        // reaches the model — not to padding that gets stripped afterwards.
        const dream = sanitizePromptText(body.dream);
        if (dream.length < 8) return json({ error: "Dream too short." }, 400);
        if (dream.length > MAX_DREAM) return json({ error: "Dream too long." }, 400);
        // Everything below crosses into paid third-party APIs, so shape and
        // size are pinned here rather than trusted from the client.
        //
        // `cast`: the client already filtered this down to cast members whose
        // @tag literally appears in the dream text (see index.html tryBackend())
        // — that's the "only use a reference photo when its name is actually
        // mentioned" rule. The server re-sanitises every field regardless;
        // never trust a client-side filter as the only guard.
        const cast = (Array.isArray(body.cast) ? body.cast : [])
          .slice(0, MAX_REFERENCES)
          .filter((c) => c && typeof c === "object" && typeof c.img === "string" && c.img)
          .map((c) => ({
            tag: sanitizeTag(c.tag),
            category: ["person", "pet", "place"].includes(c.category) ? c.category : "person",
            desc: String(c.desc || "").slice(0, MAX_FRAGMENT),
            img: c.img,
          }))
          .filter((c) => c.tag);

        // A prompt assembled by the wizard. It skips DeepSeek entirely, but it
        // still passes through the same hygiene as anything else that reaches
        // a paid API — a client-built prompt is no more trusted than a
        // model-built one.
        const prompt = body.prompt
          ? sanitizePromptText(body.prompt).slice(0, MAX_CRAFTED_PROMPT)
          : undefined;

        const isFilm = body.mode === "film";
        const urls = isFilm
          ? await generateVideo({ dream, namedRefs: cast, prompt })
          : await generateImages({ dream, namedRefs: cast, prompt });
        // Hand back local paths where the copy worked, provider URLs where it
        // did not — the client stores whatever it gets.
        return json({ ok: true, urls: await storeAll(urls) });
      } catch (e) {
        const map = {
          NO_FAL_KEY: [503, "Backend has no fal.ai key. Set FAL_KEY and restart."],
          GENERATION_FAILED: [502, "Image/video generation did not complete."],
        };
        const hit = map[e.message];
        if (hit) return json({ error: hit[1] }, hit[0]);
        // Don't echo internals (paths, key fragments) to the client.
        console.error("[DreamRushes] /api/generate failed:", e);
        return json({ error: "Server error." }, 500);
      }
    }

    if (url.pathname.startsWith("/media/")) return serveMedia(url.pathname);

    return serveStatic(url.pathname);
  },
});

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json" } });
}

console.log(`Dream Rushes running → http://localhost:${PORT}`);
console.log(process.env.FAL_KEY ? "fal.ai key: loaded ✓ (images + video)" : "fal.ai key: MISSING (generation disabled)");
console.log(process.env.DEEPSEEK_KEY ? "DeepSeek key: loaded ✓ (LLM-crafted prompts)" : "DeepSeek key: MISSING (using local prompt template)");
