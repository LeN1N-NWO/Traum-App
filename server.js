// Dream Rushes — minimal backend (Bun)
// Holds the Higgsfield key server-side and proxies generation so the browser
// never sees credentials. Serves the static app too.
//
//   1) bun install            (installs @higgsfield/client)
//   2) export HF_CREDENTIALS="YOUR_KEY_ID:YOUR_KEY_SECRET"   (from platform.higgsfield.ai)
//   3) bun server.js          → http://localhost:8100
//
// Without deps/key the server still boots and serves the app; /api/generate
// then returns a clear, actionable error instead of crashing.
//
// ⚠ LOCALHOST ONLY as it stands. /api/generate has no auth, no rate limit and
// no per-user quota — exposing this to the internet lets anyone spend your
// Higgsfield credits. Real accounts/quotas are blocked on the backend decision
// still pending in docs/STAND.md; until then, don't bind it to a public
// interface (or put an authenticating reverse proxy in front).

import { resolve, sep } from "node:path";

const PORT = process.env.PORT || 8100;
const ROOT = import.meta.dir;

// Reference photos are base64 dataURLs, so bodies are chunky — but not unbounded.
const MAX_BODY = 12 * 1024 * 1024;
const MAX_REFERENCES = 6;
const MAX_STYLE_CONTEXT = 5;
const MAX_DREAM = 2000;

// Model slugs on the Higgsfield platform SDK. CONFIRM these against your
// dashboard's model catalog (cloud.higgsfield.ai) — platform slugs can differ
// from the in-app names. Override via env without editing code.
const MODELS = {
  sequenceImage: process.env.HF_MODEL_IMAGE || "nano-banana-2/text-to-image",
  filmVideo:     process.env.HF_MODEL_VIDEO || "seedance-2/text-to-video",
};

// Pet/place cast entries aren't sent as image data — unverified whether
// Higgsfield's image_references param handles non-face reference photos
// sensibly (same kind of unverified-slug gap noted in docs/STAND.md).
// Safe default: fold their short text description into the prompt instead.
// Revisit once the Higgsfield dashboard/docs confirm a dedicated non-face
// reference param.
function withStyleContext(prompt, styleContext = []) {
  if (!styleContext.length) return prompt;
  const clauses = styleContext.slice(0, 5).map((s) => {
    const desc = (s.desc || s.tag || "").trim();
    if (!desc) return null;
    return s.category === "pet" ? `featuring my pet ${desc}` : `set in a place like ${desc}`;
  }).filter(Boolean);
  return clauses.length ? `${prompt} (${clauses.join(", ")})` : prompt;
}

// ---- Higgsfield call (lazy import so the server boots without the dep) ----
async function higgsfieldGenerate({ prompt, kind, references = [], styleContext = [] }) {
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

  const model = kind === "film" ? MODELS.filmVideo : MODELS.sequenceImage;
  const input = { prompt: withStyleContext(prompt, styleContext), aspect_ratio: "9:16" };
  if (references.length) input.image_references = references; // person-category photos only — face-consistency refs

  const jobSet = await higgsfield.subscribe(model, { input, withPolling: true });
  if (!jobSet.isCompleted) throw new Error("GENERATION_FAILED");
  return jobSet.jobs.map((j) => j.results?.raw?.url).filter(Boolean);
}

// ---- static file serving ----
// The app directory also holds .env (the Higgsfield key!), .git/, package.json
// and docs/. Serving it naively hands all of that to anyone who asks, which
// would defeat the whole point of keeping the key server-side. Everything below
// exists to make that impossible; scripts/test-static.mjs keeps it that way.
const TYPES = { html:"text/html", js:"text/javascript", css:"text/css", png:"image/png", jpg:"image/jpeg", jpeg:"image/jpeg", gif:"image/gif", mp4:"video/mp4", webp:"image/webp" };
const ROOT_ABS = resolve(ROOT);
// Deny by default. The app is exactly one page plus whatever lives in clips/ —
// an extension allowlist alone was not enough (it still exposed package.json
// and scripts/*.js). Adding a new public asset is a deliberate edit here.
const PUBLIC_FILES = new Set(["/index.html"]);
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
        const dream = String(body.dream || "").trim();
        if (dream.length < 8) return json({ error: "Dream too short." }, 400);
        if (dream.length > MAX_DREAM) return json({ error: "Dream too long." }, 400);
        // Everything below crosses into a paid third-party API, so shape and
        // size are pinned here rather than trusted from the client.
        const references = (Array.isArray(body.references) ? body.references : [])
          .filter((r) => typeof r === "string")
          .slice(0, MAX_REFERENCES);
        const styleContext = (Array.isArray(body.styleContext) ? body.styleContext : [])
          .slice(0, MAX_STYLE_CONTEXT)
          .filter((s) => s && typeof s === "object")
          .map((s) => ({
            category: String(s.category || ""),
            tag: String(s.tag || "").slice(0, 40),
            desc: String(s.desc || "").slice(0, 120),
          }));
        // The dream-sequence-director skill turns `dream` into director-grade
        // prompts. Here we pass it straight through; swap in the skill's
        // Deakins/Seedance prompt builder for production quality.
        const urls = await higgsfieldGenerate({
          prompt: dream,
          kind: body.mode === "film" ? "film" : "sequence",
          references,
          styleContext,
        });
        return json({ ok: true, urls });
      } catch (e) {
        const map = {
          NO_CREDENTIALS: [503, "Backend has no Higgsfield key. Set HF_CREDENTIALS and restart."],
          NO_SDK:         [503, "SDK not installed. Run `bun install`, then restart."],
          GENERATION_FAILED: [502, "Higgsfield generation did not complete."],
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
console.log(process.env.HF_CREDENTIALS ? "Higgsfield key: loaded ✓" : "Higgsfield key: MISSING (app runs, generation disabled)");
