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

// Gemini Live — the voice interview. fal has no realtime conversational
// model, so this one talks to Google directly.
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.1-flash-live-preview";
const GEMINI_WS =
  "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent";

/* What the assistant is told, and what it may do.
 *
 * The tools are the whole design. Without them the answer comes back as a
 * transcript, and somebody has to guess afterwards which words were a name
 * and which were a place — a second model call, a second bill, and a new way
 * to be wrong. With them, the assistant hands over `addPerson("Rex","pet")`
 * the moment it hears it, already structured.
 */
/* The onboarding survey speaks through the same relay as the dream
 * interview, but collects PROFILE facts, not a dream — different tools,
 * different briefing (see voiceSystem's onboarding branch). Every field is
 * optional by design: refusing a question must never stall the flow. */
const ONBOARDING_TOOLS = [{
  functionDeclarations: [
    {
      name: "setName",
      description: "What they want to be called. First name or nickname, exactly as they said it.",
      parameters: { type: "OBJECT", properties: { name: { type: "STRING" } }, required: ["name"] },
    },
    {
      name: "setBirthday",
      description: "Their date of birth as YYYY-MM-DD. Year may be 0000 if they only gave day and month.",
      parameters: { type: "OBJECT", properties: { date: { type: "STRING" } }, required: ["date"] },
    },
    {
      name: "setDreamRecall",
      description: "How often they remember their dreams.",
      parameters: {
        type: "OBJECT",
        properties: { frequency: { type: "STRING", description: "nightly | weekly | rarely | almost-never" } },
        required: ["frequency"],
      },
    },
    {
      name: "setLucidLevel",
      description: "Their relationship with lucid dreaming.",
      parameters: {
        type: "OBJECT",
        properties: { level: { type: "STRING", description: "never-heard | curious | tried | practicing" } },
        required: ["level"],
      },
    },
    {
      name: "addTheme",
      description: "A recurring dream, place, person or feeling they mention. Call once per theme.",
      parameters: { type: "OBJECT", properties: { name: { type: "STRING" } }, required: ["name"] },
    },
    {
      name: "setGoal",
      description: "What draws them to their dreams.",
      parameters: {
        type: "OBJECT",
        properties: { goal: { type: "STRING", description: "remember | understand | create | sleep-better" } },
        required: ["goal"],
      },
    },
    {
      name: "finish",
      description: "The survey is complete or they want to stop. Call this last.",
      parameters: { type: "OBJECT", properties: {} },
    },
  ],
}];

const VOICE_TOOLS = [{
  functionDeclarations: [
    {
      name: "setDreamText",
      description: "The dream as one flowing account, in the language the person spoke. Call this whenever they add to it; the newest call wins.",
      parameters: { type: "OBJECT", properties: { text: { type: "STRING" } }, required: ["text"] },
    },
    {
      name: "addPerson",
      description: "Someone or some animal who appeared in the dream. Call once per character.",
      parameters: {
        type: "OBJECT",
        properties: {
          name: { type: "STRING" },
          kind: { type: "STRING", description: "person or pet" },
          desc: { type: "STRING", description: "short visual description, empty if the dream gives none" },
        },
        required: ["name", "kind"],
      },
    },
    {
      name: "addPlace",
      description: "A distinct location in the dream. A dream that moves has more than one.",
      parameters: { type: "OBJECT", properties: { name: { type: "STRING" } }, required: ["name"] },
    },
    {
      name: "finish",
      description: "The person has told the whole dream and has nothing to add. Call this last.",
      parameters: { type: "OBJECT", properties: {} },
    },
  ],
}];

/* The briefing. Built per session, because the two things that make this feel
 * like a person rather than a form — knowing your name and knowing who is
 * already in your journal — are different for everyone.
 *
 * Both come from the client and are therefore untrusted: they go through the
 * same sanitiser as any other free text before they are put in a prompt. A tag
 * is [a-z0-9]{1,12} by construction, a name is trimmed hard. Neither can carry
 * a newline, so neither can pretend to be a new instruction paragraph.
 */
function voiceSystem({ name = "", cast = [], lang = "", mode = "" } = {}) {
  if (mode === "onboarding") return onboardingSystem({ lang });
  const greeting = name
    ? `Their name is ${name}. Greet them by it in your very first sentence, then ask straight away ` +
      `what they dreamt. Use the name once more at most; repeating it every turn is what a machine ` +
      `does.\n\n`
    : `You do not know their name. Do not ask for it — open with a greeting and the first question.\n\n`;

  /* Which language to open in is a guess until they have said a word, so it
   * is taken from the phone's own setting. Getting it wrong for one sentence
   * is recoverable; the rule below hands control to them immediately. */
  const opening = lang
    ? `Their phone is set to "${lang}" — say your opening line in that language.\n\n`
    : "";

  const known = cast.length
    ? `These already exist in their journal, with a face on file: ${cast.join(", ")}. ` +
      `If they mention one, pass exactly that name to addPerson/addPlace — spelled the same — ` +
      `so the dream reuses the picture they already have instead of inventing a stranger. ` +
      `Do not bring these up yourself; they are only for recognising.\n\n`
    : "";

  return (
    "You are the dream interviewer in a dream journal app. Someone has just woken up and is " +
    "talking to you in the dark, probably still half asleep, probably holding the phone badly.\n\n" +

    greeting + opening + known +

    "HOW TO SPEAK\n" +
    "From their first words onward, speak the language THEY speak, whatever the setting above said — " +
    "if they answer in German, continue in German without remarking on the switch. " +
    "One or two short sentences per turn, never more. " +
    "No lists, no summaries of what they just said, no 'how interesting'. Warm, quiet, awake.\n\n" +

    "WHAT TO ASK\n" +
    "Your job is to get the dream out of them, not to interpret it. Ask for what is missing, in " +
    "roughly this order: what happened, then who was there, then where it was, then what it looked " +
    "like. One question at a time. Follow what they actually said — if they mention a house, ask " +
    "about the house, not about a checklist. Three or four questions is usually the whole interview; " +
    "stop once the dream has a shape, even if details are missing. A half-remembered dream is normal " +
    "and is not a problem to be solved.\n\n" +

    "WHAT NEVER TO DO\n" +
    "Never analyse, never say what a dream 'means', never reassure, never give sleep advice. If they " +
    "went through something frightening, acknowledge it in a few words and carry on with the account. " +
    "If they say they cannot remember more, accept it immediately and finish.\n\n" +

    "THE WRITTEN DREAM — this is what the whole conversation is for\n" +
    "Call setDreamText as the account grows, not only at the end; the newest call replaces the last. " +
    "Write it the way they would write it themselves: first person, past tense, their language, their " +
    "words, their images, in the order things happened. Turn their scattered answers into connected " +
    "sentences — that is the work — but add nothing that was not said. No invented details, no " +
    "adjectives they did not use, no interpretation, no moral, no tidy ending. If they said 'a big " +
    "dark dog', it stays a big dark dog and does not become a menacing hound. Leave out your own " +
    "questions and everything you said; only their dream goes in the text.\n\n" +

    "TOOLS\n" +
    "Call addPerson and addPlace the moment someone or somewhere is named — do not wait for the end. " +
    "Call finish when they are done, and call setDreamText one last time before you do."
  );
}

/* The welcome survey. Six questions, roughly two minutes, and every answer
 * is allowed to be "skip" — this buys them credits, it must never feel like
 * a form with required fields. */
function onboardingSystem({ lang = "" } = {}) {
  const opening = lang
    ? `Their phone is set to "${lang}" — open in that language, then follow whatever language they answer in.\n\n`
    : "";
  return (
    "You are the friendly voice inside a dream journal app, meeting a brand-new user for the " +
    "first time. This is a short welcome chat that personalises their profile — they get bonus " +
    "credits for finishing it, and they already know that.\n\n" +

    opening +

    "HOW TO SPEAK\n" +
    "Warm, brief, a little playful. One question per turn, one or two short sentences. Never " +
    "read out a list of options — ask naturally and map whatever they say onto the tool values.\n\n" +

    "THE QUESTIONS, in this order, one tool call the moment each is answered:\n" +
    "1. What should I call you? → setName\n" +
    "2. When were you born? Day, month and year — the year also gives their star sign. If they " +
    "prefer not to say the year, day and month are enough (year 0000). → setBirthday\n" +
    "3. How often do you remember your dreams? → setDreamRecall\n" +
    "4. Have you heard of lucid dreaming — knowing you're dreaming while it happens? Where are " +
    "they on that journey? → setLucidLevel\n" +
    "5. Is there a dream, place or person that keeps coming back at night? → addTheme, once per " +
    "thing they name\n" +
    "6. What brings you here — remembering more, understanding what dreams mean, turning them " +
    "into pictures, or sleeping better? → setGoal\n\n" +

    "RULES\n" +
    "Any question may be skipped the moment they hesitate or decline — move on cheerfully, never " +
    "press, never ask why. Never interpret their dreams or make health claims; if they share " +
    "something heavy, acknowledge it kindly in a few words and continue. After question 6, thank " +
    "them, tell them their bonus credits are in, and call finish."
  );
}

/* Two things have to be true before Gemini can be set up: the socket to Google
 * must be open, and the client must have said who is talking. They arrive in
 * either order, so both paths call this and the second one through wins. */
function sendVoiceSetup(ws) {
  const up = ws.data.upstream;
  if (ws.data.setupSent || up?.readyState !== 1 || !ws.data.greeted) return;
  ws.data.setupSent = true;
  clearTimeout(ws.data.helloTimer);

  up.send(JSON.stringify({
    setup: {
      model: `models/${GEMINI_MODEL}`,
      generationConfig: { responseModalities: ["AUDIO"] },
      systemInstruction: { parts: [{ text: voiceSystem(ws.data.who) }] },
      tools: ws.data.who?.mode === "onboarding" ? ONBOARDING_TOOLS : VOICE_TOOLS,
      inputAudioTranscription: {},   // what THEY said, as text
      outputAudioTranscription: {},  // what IT said, as text
    },
  }));
  try { ws.send(JSON.stringify({ type: "ready" })); } catch { /* client gone */ }
}

/* Gemini Live does not speak first on its own — it waits for a turn. This is
 * that turn: an instruction, not something the person said. It never reaches
 * the transcript, because only audio is transcribed back to the client. */
const VOICE_OPENING_CUE =
  "[The app has just opened and the microphone is live. Say your greeting and your first " +
  "question now, in one or two short sentences.]";

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
//
// ⚠ THAT CEILING HAS BEEN REACHED (measured 08.08.2026). A 15-second video on
// minimax/h3 does not finish inside the synchronous request — it times out,
// and the render is paid for but lost. Images and short clips are unaffected.
// Anything longer needs queue.fal.run: submit, poll status_url, fetch
// response_url. Do that BEFORE offering film lengths above ~10 seconds.
// Revisit if a model runs long enough to need the queue+polling flow.
async function falGenerateImage({ prompt, namedRefs = [], aspectRatio = "9:16" }) {
  const key = process.env.FAL_KEY;
  if (!key) throw new Error("NO_FAL_KEY");

  const input = {
    prompt,
    aspect_ratio: aspectRatio, // unverified param name/value for this model, see FAL_MODEL_IMAGE note above
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

/* ---- the queue path ----
 *
 * Video does NOT go through fal.run. Measured 08.08.2026: a 15-second render
 * on minimax/h3 takes 280 seconds, far past what a held-open HTTP request
 * survives — and a timeout there means fal still renders it, still bills for
 * it, and nobody ever collects it. Paid for and lost.
 *
 * So: submit to the queue, hand the client a job id, let it come back. The
 * job outlives the request, which is the whole point.
 *
 * Jobs live on disk rather than in a Map, because a server restart during a
 * five-minute render would otherwise orphan something the person paid for.
 */
const JOBS_DIR = resolve(import.meta.dir, "media", "jobs");
const JOB_ID = /^[a-z0-9]{6,32}$/;

async function readJob(id) {
  if (!JOB_ID.test(id)) return null;
  const f = Bun.file(resolve(JOBS_DIR, `${id}.json`));
  return (await f.exists()) ? f.json() : null;
}
const writeJob = (id, job) => Bun.write(resolve(JOBS_DIR, `${id}.json`), JSON.stringify(job));

/** Hand the work to fal's queue and return our own job id. */
async function falSubmitVideo({ imageUrl, prompt, seconds }) {
  const key = process.env.FAL_KEY;
  if (!key) throw new Error("NO_FAL_KEY");

  const res = await fetch(`https://queue.fal.run/${FAL_MODEL_VIDEO}`, {
    method: "POST",
    headers: { Authorization: `Key ${key}`, "content-type": "application/json" },
    body: JSON.stringify({
      image_url: imageUrl,
      prompt,
      // minimax/h3 accepts 5–15 ("ge: 5" per its validator, re-measured
      // 09.08.2026 — the queue only enforces this at RENDER time, so a bad
      // value here would burn the fee and come back as a failed job).
      duration: Math.min(Math.max(Number(seconds) || 6, 5), 15),
      resolution: "768P",
    }),
  });
  if (!res.ok) {
    console.error("[DreamRushes] fal.ai video submit failed:", res.status, await res.text().catch(() => ""));
    throw new Error("GENERATION_FAILED");
  }
  const { request_id, status_url, response_url } = await res.json();
  if (!request_id) throw new Error("GENERATION_FAILED");

  /* status_url/response_url are stored VERBATIM from fal's answer, never
   * rebuilt from the model slug: the queue routes under the model FAMILY
   * ("minimax/h3"), not the full slug ("minimax/h3/image-to-video") — a
   * hand-built path 405s, and jobStatus reads every failure as "pending",
   * so a finished film would never be collected. Found 09.08.2026 when a
   * COMPLETED render sat unclaimed behind exactly that 405. */
  const id = genJobId();
  await writeJob(id, {
    requestId: request_id, model: FAL_MODEL_VIDEO,
    statusUrl: status_url, responseUrl: response_url,
    createdAt: Date.now(), status: "pending",
  });
  return id;
}

function genJobId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/** Where a job stands. Finished media is copied locally before it is handed
 *  over, exactly like the synchronous path — the fal URL is never the record. */
async function jobStatus(id) {
  const job = await readJob(id);
  if (!job) return { status: "unknown" };
  if (job.status === "done") return { status: "done", urls: job.urls };
  if (job.status === "failed") return { status: "failed" };

  const key = process.env.FAL_KEY;
  /* Jobs written since 09.08.2026 carry fal's own URLs. Older ones fall back
   * to the model FAMILY (first two slug segments) — the full slug is exactly
   * the 405 that kept finished films uncollectable. */
  const family = job.model.split("/").slice(0, 2).join("/");
  const base = job.responseUrl || `https://queue.fal.run/${family}/requests/${job.requestId}`;
  const statusUrl = job.statusUrl || `${base}/status`;
  const s = await fetch(statusUrl, { headers: { Authorization: `Key ${key}` } });
  if (!s.ok) return { status: "pending" };            // a hiccup is not a failure
  const st = await s.json();

  if (st.status === "FAILED") {
    await writeJob(id, { ...job, status: "failed" });
    return { status: "failed" };
  }
  if (st.status !== "COMPLETED") return { status: "pending" };

  const r = await fetch(base, { headers: { Authorization: `Key ${key}` } });
  const data = await r.json().catch(() => null);
  const url = data?.video?.url || data?.videos?.[0]?.url;
  if (!url) {
    await writeJob(id, { ...job, status: "failed" });
    return { status: "failed" };
  }
  const urls = await storeAll([url]);
  await writeJob(id, { ...job, status: "done", urls });
  return { status: "done", urls };
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

/** Write bytes under a name derived from their own content — never from
 *  anything the model or the client chose — and hand back the path they
 *  will be served at. Shared by the fetch-and-copy path below and by the
 *  panel-upload endpoint, which has bytes already and nothing to fetch. */
async function storeBytes(bytes, contentType) {
  const ext = MEDIA_TYPES[String(contentType || "").split(";")[0].trim()];
  if (!ext || !bytes.length || bytes.length > MAX_MEDIA_BYTES) return null;
  const name = `${Bun.hash(bytes).toString(36)}.${ext}`;
  await Bun.write(resolve(MEDIA_DIR, name), bytes);
  return `/media/${name}`;
}

/** Copy one generated file locally. Returns "/media/<name>", or null to keep
 *  using the provider URL — a failed copy must never fail the generation the
 *  person already paid for. */
async function storeMedia(url) {
  try {
    if (!/^https:\/\//.test(url)) return null;
    const res = await fetch(url);
    if (!res.ok) return null;
    return await storeBytes(new Uint8Array(await res.arrayBuffer()), res.headers.get("content-type"));
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
async function generateImages({ dream, namedRefs, prompt: readyPrompt, aspectRatio }) {
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
  return falGenerateImage({ prompt, namedRefs, aspectRatio });
}

// Film mode: render a keyframe still first (same pipeline as image mode),
// then animate it. minimax/h3 is image-to-video, so it needs a source image
// — there's no text-to-video path anymore.
/** Film: render the keyframe (fast, synchronous) and hand the animation to
 *  the queue. Returns a job id, not a URL — the client comes back for it.
 *
 *  With `keyframe` set, no keyframe is rendered at all: the film animates an
 *  image the dream already owns. The value is a /media/ path, NEVER a URL —
 *  resolveMedia() only matches names this server itself wrote, so the client
 *  cannot point this at an arbitrary file or host. fal gets the bytes as a
 *  data URI because the /media/ path only exists on this machine; fal could
 *  never fetch it (verified live 09.08.2026: minimax/h3 accepts data URIs). */
async function startVideo({ dream, namedRefs, prompt, seconds, keyframe }) {
  if (keyframe) {
    const hit = resolveMedia(keyframe);
    const file = hit && Bun.file(resolve(MEDIA_DIR, hit.name));
    if (!hit || !(await file.exists())) throw new Error("GENERATION_FAILED");
    const b64 = Buffer.from(await file.arrayBuffer()).toString("base64");
    const dataUri = `data:${MEDIA_MIME[hit.ext]};base64,${b64}`;
    return falSubmitVideo({ imageUrl: dataUri, prompt: prompt || dream, seconds });
  }
  const stills = await generateImages({ dream, namedRefs, prompt });
  const first = stills[0];
  if (!first) throw new Error("GENERATION_FAILED");
  return falSubmitVideo({ imageUrl: first, prompt: prompt || dream, seconds });
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

  /* The voice interview runs through here rather than browser-to-Google.
   *
   * It has to: the browser would need GEMINI_KEY to open that socket, and a
   * key in a bundle is a key everyone has. So the client talks to us, we hold
   * the key, and we pass frames through in both directions. The relay reads
   * nothing except the one message it must translate — the audio config —
   * and never stores what is said. */
  websocket: {
    async open(ws) {
      const key = process.env.GEMINI_KEY;
      if (!key) {
        ws.send(JSON.stringify({ type: "error", code: "NO_GEMINI_KEY" }));
        return ws.close();
      }

      const upstream = new WebSocket(`${GEMINI_WS}?key=${key}`);
      ws.data.upstream = upstream;

      // The setup frame carries the name and the cast, so it cannot be sent
      // until the client has told us who is talking. Whichever of the two
      // arrives second (socket open / "hello") triggers it. The timer is the
      // backstop: a client that never introduces itself still gets a session,
      // just an anonymous one, instead of a socket that stays silent forever.
      upstream.addEventListener("open", () => sendVoiceSetup(ws));
      ws.data.helloTimer = setTimeout(() => {
        ws.data.greeted = true;
        sendVoiceSetup(ws);
      }, 2000);

      // Straight through. Blobs stay blobs — the audio never becomes a string
      // on the way past, which would corrupt it and cost a copy per frame.
      upstream.addEventListener("message", (e) => {
        /* The greeting may only be sent once Gemini has confirmed the setup,
         * so the first frames are inspected — and only those. Gemini sends
         * everything as binary frames, including this one (measured, not
         * assumed: a string test here silently never matched and the
         * assistant stayed mute). The size guard keeps a stray audio frame
         * from being decoded for nothing; setupComplete is ~26 bytes. */
        if (!ws.data.kicked) {
          const head = typeof e.data === "string" ? e.data
            : e.data.byteLength <= 4096 ? new TextDecoder().decode(e.data) : "";
          if (head.includes("setupComplete")) ws.data.kicked = true;
        }
        if (ws.data.kicked && !ws.data.cued) {
          ws.data.cued = true;
          try {
            upstream.send(JSON.stringify({
              clientContent: {
                turns: [{ role: "user", parts: [{ text: VOICE_OPENING_CUE }] }],
                turnComplete: true,
              },
            }));
          } catch { /* upstream died between frames */ }
        }
        try { ws.send(e.data); } catch { /* client already gone */ }
      });
      upstream.addEventListener("close", () => { try { ws.close(); } catch {} });
      upstream.addEventListener("error", () => {
        try { ws.send(JSON.stringify({ type: "error", code: "UPSTREAM" })); ws.close(); } catch {}
      });
    },

    message(ws, data) {
      /* The client's very first frame is a "hello" naming the dreamer. It is
       * ours, not Gemini's, so it stops here. Everything after it is audio and
       * goes straight through — which is why this only looks at frame one:
       * JSON.parse on every audio frame would be the most expensive thing the
       * relay does. */
      if (!ws.data.greeted) {
        ws.data.greeted = true;
        if (typeof data === "string" && data.includes('"hello"')) {
          try {
            const msg = JSON.parse(data);
            if (msg.type === "hello") {
              ws.data.who = {
                name: sanitizeFragment(msg.name, 40),
                cast: (Array.isArray(msg.cast) ? msg.cast : [])
                  .map(sanitizeTag).filter(Boolean).slice(0, 40),
                // A BCP-47 tag and nothing else: it is quoted into the prompt,
                // so it may not carry anything but letters, digits and dashes.
                lang: String(msg.lang || "").replace(/[^A-Za-z0-9-]/g, "").slice(0, 12),
                // Allowlisted, never interpolated: picks briefing and tools.
                mode: msg.mode === "onboarding" ? "onboarding" : "",
              };
              return sendVoiceSetup(ws);   // never forwarded upstream
            }
          } catch { /* not our handshake — fall through and treat as traffic */ }
        }
        // An older client, or a frame we do not recognise: Gemini still needs
        // its setup before anything else, so send it now with what we know.
        sendVoiceSetup(ws);
      }

      const up = ws.data.upstream;
      if (up?.readyState === 1) up.send(data);
    },

    close(ws) {
      clearTimeout(ws.data.helloTimer);
      try { ws.data.upstream?.close(); } catch { /* already gone */ }
    },
  },

  async fetch(req, server) {
    const url = new URL(req.url);

    if (url.pathname === "/api/voice") {
      if (server.upgrade(req, { data: { upstream: null } })) return undefined;
      return new Response("Expected a WebSocket upgrade.", { status: 426 });
    }

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

        // The one caller that needs a canvas wider than the app's own
        // portrait default: a multi-panel grid, which only reads as several
        // pictures once it is wide enough to cut into portrait-ish strips.
        // Allowlisted rather than passed through — this reaches fal.ai
        // verbatim, so it is a value, never client-supplied text.
        const aspectRatio = body.aspectRatio === "16:9" ? "16:9" : undefined;

        // Two shapes come back from here, and the client handles both:
        //   images → { urls }   (fast enough to wait for)
        //   film   → { jobId }  (minutes; the client collects it later)
        if (body.mode === "film") {
          // Only a /media/-shaped name survives; startVideo re-validates it
          // against resolveMedia before touching the filesystem.
          const keyframe = typeof body.keyframe === "string" ? body.keyframe : undefined;
          const jobId = await startVideo({ dream, namedRefs: cast, prompt, seconds: body.seconds, keyframe });
          return json({ ok: true, jobId });
        }
        const urls = await generateImages({ dream, namedRefs: cast, prompt, aspectRatio });
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

    // Collecting a film. Deliberately a GET with no body: the client may ask
    // days later, from a cold start, with nothing but the id it saved.
    if (url.pathname === "/api/job" && req.method === "GET") {
      try {
        return json({ ok: true, ...(await jobStatus(url.searchParams.get("id") || "")) });
      } catch (e) {
        console.error("[DreamRushes] /api/job failed:", e);
        return json({ error: "Server error." }, 500);
      }
    }

    // The grid feature (one generation, several panels) is cut client-side
    // with <canvas> — that is where the Vanilla-JS stack already has an image
    // decoder, so the server does not need one. This is therefore the one
    // endpoint that stores bytes the CLIENT produced rather than something a
    // model returned. It is no more trusted for that: storeBytes names the
    // file from a hash of its own content and only writes it at all if the
    // content-type maps to a real image extension, so nothing about the
    // request — not its size, not its declared type — reaches the filesystem
    // unchecked.
    if (url.pathname === "/api/panel" && req.method === "POST") {
      try {
        if (Number(req.headers.get("content-length") || 0) > MAX_BODY) {
          return json({ error: "Request too large." }, 413);
        }
        const bytes = new Uint8Array(await req.arrayBuffer());
        const stored = await storeBytes(bytes, req.headers.get("content-type"));
        if (!stored) return json({ error: "Not a storable image." }, 400);
        return json({ ok: true, url: stored });
      } catch (e) {
        console.error("[DreamRushes] /api/panel failed:", e);
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
console.log(process.env.GEMINI_KEY ? "Gemini key: loaded ✓ (voice interview)" : "Gemini key: MISSING (voice interview disabled)");
