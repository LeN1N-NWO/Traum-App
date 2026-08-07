// Dream Rushes — minimal backend (Bun)
// Holds the API keys server-side and proxies generation so the browser never
// sees credentials. Serves the static app too.
//
// Image generation → fal.ai (Nano Banana 2). Video generation → Higgsfield
// (Seedance) — Nano Banana is image-only, video hasn't moved yet.
//
//   1) bun install            (installs @higgsfield/client, video path only)
//   2) export FAL_KEY="YOUR_KEY_ID:YOUR_KEY_SECRET"          (from fal.ai/dashboard/keys, images)
//      export HF_CREDENTIALS="YOUR_KEY_ID:YOUR_KEY_SECRET"   (from platform.higgsfield.ai, video)
//   3) bun server.js          → http://localhost:8100
//
// Without deps/keys the server still boots and serves the app; /api/generate
// then returns a clear, actionable error instead of crashing.
//
// ⚠ LOCALHOST ONLY as it stands. /api/generate has no auth, no rate limit and
// no per-user quota — exposing this to the internet lets anyone spend your
// fal.ai/Higgsfield credits. Real accounts/quotas are blocked on the backend
// decision still pending in docs/STAND.md; until then, don't bind it to a
// public interface (or put an authenticating reverse proxy in front).

import { resolve, sep } from "node:path";

const PORT = process.env.PORT || 8100;
const ROOT = import.meta.dir;

// Reference photos are base64 dataURLs, so bodies are chunky — but not unbounded.
const MAX_BODY = 12 * 1024 * 1024;
const MAX_REFERENCES = 6;
const MAX_STYLE_CONTEXT = 5;
const MAX_DREAM = 2000;
const MAX_FRAGMENT = 120; // per pet/place description, mirrors the client-side cap

// Model slug on the Higgsfield platform SDK (video only — image generation
// moved to fal.ai, see FAL_MODEL_IMAGE below). CONFIRM against your dashboard's
// model catalog (cloud.higgsfield.ai) — platform slugs can differ from the
// in-app names. Override via env without editing code.
const MODELS = {
  filmVideo: process.env.HF_MODEL_VIDEO || "seedance-2/text-to-video",
};

// fal.ai model slug for image generation (Nano Banana 2). UNVERIFIED against
// fal.ai's actual model catalog — same kind of assumption as the Higgsfield
// slugs above, confirm at fal.ai/models before relying on this in production.
// Override via FAL_MODEL_IMAGE without editing code.
const FAL_MODEL_IMAGE = process.env.FAL_MODEL_IMAGE || "fal-ai/nano-banana-2";

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
//   3. What comes next. docs/STAND.md plans an LLM that builds director prompts
//      from this text; that step is where a real instruction/data boundary
//      appears. Cleaning at the edge now means it inherits sane input.
//
// Note: this also strips ZWJ, so emoji sequences (👨‍👩‍👧) degrade to their parts.
// Acceptable — they carry nothing for an image model, and ZWJ is a smuggling
// vector.
const PROMPT_CONTROL_CHARS =
  /[\u0000-\u0008\u000B-\u001F\u007F-\u009F\u00AD\u200B-\u200F\u202A-\u202E\u2060-\u2064\u2066-\u206F\uFEFF\uFFF9-\uFFFB]/g;
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

// Pet/place cast entries aren't sent as image data — unverified whether
// Higgsfield's image_references param handles non-face reference photos
// sensibly (same kind of unverified-slug gap noted in docs/STAND.md).
// Safe default: fold their short text description into the prompt instead.
// Revisit once the Higgsfield dashboard/docs confirm a dedicated non-face
// reference param.
//
// Because sanitizePromptText() guarantees every fragment is single-line, the
// newline below is the only structural break in the finished prompt — user text
// cannot forge one.
function withStyleContext(prompt, styleContext = []) {
  const clauses = styleContext.slice(0, MAX_STYLE_CONTEXT).map((s) => {
    const desc = sanitizeFragment(s.desc || s.tag || "", MAX_FRAGMENT);
    if (!desc) return null;
    return s.category === "pet" ? `a pet described as: ${desc}` : `a location described as: ${desc}`;
  }).filter(Boolean);
  if (!clauses.length) return prompt;
  return `${prompt}\nAlso present in the scene — ${clauses.join("; ")}.`;
}
// Cast tags are already constrained client-side to [a-z0-9]{1,12} at creation
// (see index.html), but the server never trusts client-side constraints —
// re-apply the same shape here before a tag ever reaches a prompt.
function sanitizeTag(raw) {
  return String(raw ?? "").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 12);
}

// Named references for Nano Banana: each cast entry the client sent (because
// its @tag literally appears in the dream text) becomes one @tag ↔ reference
// image binding, spelled out in the prompt so the model uses that person's/
// pet's/place's actual likeness instead of inventing one whenever the dream
// mentions them by name.
function buildNanoBananaPrompt(dream, namedRefs = []) {
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
// ---- prompt hygiene (end) ----

// ---- fal.ai call (Nano Banana 2 — image generation only) ----
// Synchronous fal.ai REST endpoint (fal.run/<model>) rather than the queue
// API: simpler, no extra dependency, fine for image-gen latencies. Revisit if
// Nano Banana 2 runs long enough to need the queue+polling flow.
async function falGenerateImage({ dream, namedRefs = [] }) {
  const key = process.env.FAL_KEY;
  if (!key) throw new Error("NO_FAL_KEY");

  const input = {
    prompt: buildNanoBananaPrompt(dream, namedRefs),
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
    console.error("[DreamRushes] fal.ai request failed:", res.status, await res.text().catch(() => ""));
    throw new Error("GENERATION_FAILED");
  }
  const data = await res.json().catch(() => null);
  const urls = (data?.images || []).map((img) => img?.url).filter(Boolean);
  if (!urls.length) throw new Error("GENERATION_FAILED");
  return urls;
}

// ---- Higgsfield call (video only — lazy import so the server boots without the dep) ----
async function higgsfieldGenerateVideo({ prompt, references = [], styleContext = [] }) {
  if (!process.env.HF_CREDENTIALS && !(process.env.HF_API_KEY && process.env.HF_API_SECRET)) {
    throw new Error("NO_CREDENTIALS");
  }
  let sdk;
  try {
    sdk = await import("@higgsfield/client/v2");
  } catch {
    throw new Error("NO_SDK");
  }
  const { higgsfield, config } = sdk;
  if (process.env.HF_CREDENTIALS) config({ credentials: process.env.HF_CREDENTIALS });

  const input = { prompt: withStyleContext(prompt, styleContext), aspect_ratio: "9:16" };
  if (references.length) input.image_references = references; // person-category photos only — face-consistency refs

  const jobSet = await higgsfield.subscribe(MODELS.filmVideo, { input, withPolling: true });
  if (!jobSet.isCompleted) throw new Error("GENERATION_FAILED");
  return jobSet.jobs.map((j) => j.results?.raw?.url).filter(Boolean);
}

// ---- static file serving ----
// The app directory also holds .env (the fal.ai/Higgsfield keys!), .git/, package.json
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
        // Everything below crosses into a paid third-party API, so shape and
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
        // The dream-sequence-director skill turns `dream` into director-grade
        // prompts. Here we pass it straight through; swap in the skill's
        // Deakins/Seedance prompt builder for production quality.
        const urls = isFilm
          // Nano Banana 2 is image-only — video still goes through Higgsfield/
          // Seedance until that path also moves to fal.ai.
          ? await higgsfieldGenerateVideo({
              prompt: dream,
              references: cast.filter((c) => c.category === "person").map((c) => c.img),
              styleContext: cast.filter((c) => c.category !== "person"),
            })
          : await falGenerateImage({ dream, namedRefs: cast });
        return json({ ok: true, urls });
      } catch (e) {
        const map = {
          NO_CREDENTIALS: [503, "Backend has no Higgsfield key. Set HF_CREDENTIALS and restart."],
          NO_SDK:         [503, "SDK not installed. Run `bun install`, then restart."],
          NO_FAL_KEY:     [503, "Backend has no fal.ai key. Set FAL_KEY and restart."],
          GENERATION_FAILED: [502, "Image/video generation did not complete."],
        };
        const hit = map[e.message];
        if (hit) return json({ error: hit[1] }, hit[0]);
        // Don't echo internals (paths, SDK internals, key fragments) to the client.
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
console.log(process.env.FAL_KEY ? "fal.ai key: loaded ✓ (images)" : "fal.ai key: MISSING (image generation disabled)");
console.log(process.env.HF_CREDENTIALS ? "Higgsfield key: loaded ✓ (video)" : "Higgsfield key: MISSING (video generation disabled)");
