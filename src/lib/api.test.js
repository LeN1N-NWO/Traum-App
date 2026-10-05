import { test, expect, beforeEach, afterEach } from "bun:test";
import { setTokenSource, accessToken, jobStatus, photoCheck, mediaUrl, setMediaKey } from "./api.js";
import { mediaSignature } from "./mediaSign.js";
import { t } from "../i18n/index.js";

/* S1 Schritt 2: Die bezahlten Routen tragen das Zugangstoken, sobald die
   native Seite eine Quelle hereinreicht — und gehen ohne Quelle unverändert
   raus (Web-Entwicklungsbau, lokal ohne Konto). */

const realFetch = globalThis.fetch;
let calls;
function serve(...responses) {
  calls = [];
  globalThis.fetch = async (url, init = {}) => {
    calls.push({ url: String(url), auth: new Headers(init.headers || {}).get("authorization") });
    const [status, body] = responses[Math.min(calls.length - 1, responses.length - 1)];
    return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
  };
}
beforeEach(() => setTokenSource(null));
afterEach(() => { globalThis.fetch = realFetch; setTokenSource(null); });

test("without a token source nothing changes — no header at all", async () => {
  serve([200, { ok: true, status: "pending" }]);
  await jobStatus("abc");
  expect(calls).toHaveLength(1);
  expect(calls[0].auth).toBe(null);
});

test("with a source, polling and paid posts carry the bearer token", async () => {
  setTokenSource(async () => "tok-1");
  serve([200, { ok: true, status: "pending" }]);
  await jobStatus("abc");
  serve([200, { status: "ok" }]);
  await photoCheck({ image: "data:x", category: "person" });
  expect(calls[0].auth).toBe("Bearer tok-1");
});

test("signed out (source gives null): the request still goes out, without a token", async () => {
  setTokenSource(async () => null);
  serve([200, { ok: true, status: "pending" }]);
  await jobStatus("abc");
  expect(calls[0].auth).toBe(null);
});

test("a 401 is retried exactly once with a fresh token", async () => {
  const asked = [];
  setTokenSource(async (fresh) => { asked.push(fresh); return fresh ? "tok-new" : "tok-old"; });
  serve([401, { error: "Please sign in to continue.", reason: "signin" }], [200, { ok: true, status: "done" }]);
  const r = await jobStatus("abc");
  expect(r.status).toBe("done");
  expect(calls.map((c) => c.auth)).toEqual(["Bearer tok-old", "Bearer tok-new"]);
  expect(asked).toEqual([false, true]);
});

test("no endless loop: a second 401 is handed back as an error", async () => {
  setTokenSource(async (fresh) => (fresh ? "tok-new" : "tok-old"));
  serve([401, { error: "Please sign in to continue.", reason: "signin" }]);
  await expect(jobStatus("abc")).rejects.toThrow(t.errors.signIn);
  expect(calls).toHaveLength(2);
});

test("a 401 without reason 'signin' is not a sign-in matter — no retry, no fresh token", async () => {
  const asked = [];
  setTokenSource(async (fresh) => { asked.push(fresh); return "tok"; });
  serve([401, { error: "Not authorised." }]);
  await expect(jobStatus("abc")).rejects.toThrow("Not authorised.");
  expect(calls).toHaveLength(1);
  expect(asked).toEqual([false]);
});

test("a guest hitting a paid route reads the sign-in text from the language file, not the server's English", async () => {
  setTokenSource(async () => null);                 // Gast: keine Sitzung
  serve([401, { error: "Please sign in to continue.", reason: "signin" }]);
  await expect(photoCheck({ image: "data:x", category: "person" })).rejects.toThrow(t.errors.signIn);
});

test("a source that throws counts as signed out, never as a crash", async () => {
  setTokenSource(async () => { throw new Error("bridge gone"); });
  expect(await accessToken()).toBe(null);
});

test("a hanging bridge does not hang the app: after the wait, no token", async () => {
  setTokenSource(() => new Promise(() => {}));
  const t0 = Date.now();
  expect(await accessToken()).toBe(null);
  expect(Date.now() - t0).toBeGreaterThanOrEqual(4_900);
}, 10_000);

/* S2: Die Web-Ansichten zeigen Medien über mediaUrl() — mit Schlüssel
   signiert, ohne Schlüssel wie bisher. Ins Tagebuch geht nie die signierte
   Form (die bliebe nach 20 Minuten tot liegen). */
test("mediaUrl signs /media/ paths once a media key is set, and only those", () => {
  const key = { uid: "0b5e6a3c-1f2d-4e5f-8a9b-0c1d2e3f4a5b", exp: Math.floor(Date.now() / 1000) + 600, key: "ab".repeat(32) };
  try {
    expect(mediaUrl("/media/abc.png")).toBe("/media/abc.png");
    setMediaKey(key);
    expect(mediaUrl("/media/abc.png")).toBe(`/media/abc.png?u=${key.uid}&e=${key.exp}&s=${mediaSignature(key.key, "abc.png")}`);
    expect(mediaUrl("/clips/style-a.mp4")).toBe("/clips/style-a.mp4");
    expect(mediaUrl("data:image/png;base64,AAAA")).toBe("data:image/png;base64,AAAA");
    setMediaKey({ ...key, key: 42 });   // kaputter Schlüssel: unsigniert statt Absturz
    expect(mediaUrl("/media/abc.png")).toBe("/media/abc.png");
  } finally {
    setMediaKey(null);
  }
  expect(mediaUrl("/media/abc.png")).toBe("/media/abc.png");
});

/* S7: Reicht das Guthaben im Konto nicht, antwortet der Server 402 mit
   reason "credits" — die App zeigt die übersetzte Meldung, nicht den
   englischen Servertext. */
test("a 402 for missing credits shows the translated message", async () => {
  globalThis.fetch = async () => new Response(JSON.stringify({ error: "Not enough credits.", reason: "credits" }), { status: 402 });
  try {
    await photoCheck({ image: "data:image/png;base64,AAAA", category: "person" });
    throw new Error("should have thrown");
  } catch (e) {
    expect(e.message).toBe(t.wizard.noCredits);
  } finally {
    globalThis.fetch = realFetch;
  }
});
