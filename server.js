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

const PORT = process.env.PORT || 8100;
const ROOT = import.meta.dir;

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
const TYPES = { html:"text/html", js:"text/javascript", css:"text/css", png:"image/png", mp4:"video/mp4", json:"application/json", svg:"image/svg+xml", webp:"image/webp" };
async function serveStatic(pathname) {
  const rel = pathname === "/" ? "/index.html" : pathname;
  const file = Bun.file(ROOT + rel);
  if (!(await file.exists())) return new Response("Not found", { status: 404 });
  const ext = rel.split(".").pop();
  return new Response(file, { headers: { "content-type": TYPES[ext] || "application/octet-stream" } });
}

Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);

    if (url.pathname === "/api/generate" && req.method === "POST") {
      try {
        const body = await req.json();
        const dream = (body.dream || "").trim();
        if (dream.length < 8) return json({ error: "Dream too short." }, 400);
        // The dream-sequence-director skill turns `dream` into director-grade
        // prompts. Here we pass it straight through; swap in the skill's
        // Deakins/Seedance prompt builder for production quality.
        const urls = await higgsfieldGenerate({
          prompt: dream,
          kind: body.mode === "film" ? "film" : "sequence",
          references: Array.isArray(body.references) ? body.references : [],
          styleContext: Array.isArray(body.styleContext) ? body.styleContext.slice(0, 5) : [],
        });
        return json({ ok: true, urls });
      } catch (e) {
        const map = {
          NO_CREDENTIALS: [503, "Backend has no Higgsfield key. Set HF_CREDENTIALS and restart."],
          NO_SDK:         [503, "SDK not installed. Run `bun install`, then restart."],
          GENERATION_FAILED: [502, "Higgsfield generation did not complete."],
        };
        const [code, msg] = map[e.message] || [500, "Server error: " + e.message];
        return json({ error: msg }, code);
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
