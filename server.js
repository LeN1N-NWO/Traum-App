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
const ROOT = import.meta.dir;

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
// Given directly by the product owner, not a guess — still worth confirming
// the exact slug in the fal.ai dashboard before production use, model IDs
// there are usually namespaced (e.g. "fal-ai/minimax/...").
const FAL_MODEL_VIDEO = process.env.FAL_MODEL_VIDEO || "minimax/h3/image-to-video";

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

  const res = await fetch(`https://fal.run/${FAL_MODEL_IMAGE}`, {
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

// ---- orchestration ----
// Step 1 (DeepSeek, optional) + step 2 (fal.ai, required) from the pipeline
// comment at the top of the file. DeepSeek failing or being unconfigured
// degrades to the local template rather than blocking generation.
async function generateImages({ dream, namedRefs }) {
  let prompt;
  try {
    prompt = await craftPromptViaDeepseek(dream, namedRefs);
  } catch (e) {
    console.error("[DreamRushes] DeepSeek prompt crafting unavailable, using local template:", e.message);
    prompt = buildFallbackPrompt(dream, namedRefs);
  }
  return falGenerateImage({ prompt, namedRefs });
}

// Film mode: render a keyframe still first (same pipeline as image mode),
// then animate it. minimax/h3 is image-to-video, so it needs a source image
// — there's no text-to-video path anymore.
async function generateVideo({ dream, namedRefs }) {
  const stills = await generateImages({ dream, namedRefs });
  const keyframe = stills[0];
  if (!keyframe) throw new Error("GENERATION_FAILED");
  return falGenerateVideo({ imageUrl: keyframe, prompt: dream });
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
const PUBLIC_FILES = new Set([
  "/index.html",
  "/symbole.html",  // Symbolsammlung und Lebensereignisse
  "/fotos.html",    // Foto-Bibliothek (benannte Referenzfotos)
  "/app.css",       // gemeinsames Stylesheet beider Seiten
  "/app.js",        // gemeinsame Speicherschicht + Symbolerkennung
]);
const PUBLIC_DIRS = ["/clips/"];
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

        const isFilm = body.mode === "film";
        const urls = isFilm
          ? await generateVideo({ dream, namedRefs: cast })
          : await generateImages({ dream, namedRefs: cast });
        return json({ ok: true, urls });
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

    return serveStatic(url.pathname);
  },
});

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json" } });
}

console.log(`Dream Rushes running → http://localhost:${PORT}`);
console.log(process.env.FAL_KEY ? "fal.ai key: loaded ✓ (images + video)" : "fal.ai key: MISSING (generation disabled)");
console.log(process.env.DEEPSEEK_KEY ? "DeepSeek key: loaded ✓ (LLM-crafted prompts)" : "DeepSeek key: MISSING (using local prompt template)");
