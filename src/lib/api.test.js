import { test, expect, beforeEach, afterEach } from "bun:test";
import { setTokenSource, accessToken, jobStatus, photoCheck } from "./api.js";

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
  await expect(jobStatus("abc")).rejects.toThrow("Please sign in");
  expect(calls).toHaveLength(2);
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
