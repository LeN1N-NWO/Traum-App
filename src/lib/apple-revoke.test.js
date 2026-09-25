import { test, expect } from "bun:test";
import { generateKeyPairSync, verify } from "node:crypto";
import { appleRevokeConfig, clientSecret, revokeAppleForDeletion } from "./apple-revoke.js";

/* A throwaway P-256 key, like the .p8 Apple hands out — so the signature is
   checked for real against its public half, not just its shape. */
const { privateKey, publicKey } = generateKeyPairSync("ec", { namedCurve: "P-256" });
const PEM = privateKey.export({ type: "pkcs8", format: "pem" });
const config = { teamId: "TEAM123456", keyId: "KEY1234567", clientId: "com.dreamrushes.app", privateKey: PEM };
const SUB = "000123.abcdef.4567";

const idToken = (sub) => `x.${Buffer.from(JSON.stringify({ sub })).toString("base64url")}.y`;

/* Records every call, so a test can see what reached Apple — and what must not. */
function fakeFetch(replies) {
  const calls = [];
  const f = async (url, init) => {
    calls.push({ url, form: Object.fromEntries(new URLSearchParams(init.body)) });
    const r = replies[calls.length - 1];
    if (r instanceof Error) throw r;
    return { ok: r.status < 400, status: r.status, json: async () => { if (r.body === undefined) throw new Error("empty"); return r.body; } };
  };
  f.calls = calls;
  return f;
}
const TOKEN_OK = { status: 200, body: { access_token: "at", refresh_token: "rt", id_token: idToken(SUB) } };
const REVOKE_OK = { status: 200 };   // Apple answers 200 with an empty body

/* ── appleRevokeConfig ─────────────────────────────────────────────────── */

test("config needs team, key id and key — the client id has a default", () => {
  const env = { APPLE_TEAM_ID: "T", APPLE_SIGNIN_KEY_ID: "K", APPLE_SIGNIN_KEY: "-----BEGIN PRIVATE KEY-----\\nabc\\n-----END PRIVATE KEY-----" };
  const c = appleRevokeConfig(env);
  expect(c.clientId).toBe("com.dreamrushes.app");
  // A one-line .env value with literal \n gets its line breaks back.
  expect(c.privateKey).toBe("-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----");
  for (const k of ["APPLE_TEAM_ID", "APPLE_SIGNIN_KEY_ID", "APPLE_SIGNIN_KEY"]) {
    expect(appleRevokeConfig({ ...env, [k]: "" })).toBe(null);
  }
});

/* ── clientSecret ──────────────────────────────────────────────────────── */

test("the client secret is an ES256 JWT Apple can verify with our key", () => {
  const jwt = clientSecret(config, 1_800_000_000);
  const [h, p, s] = jwt.split(".");
  expect(JSON.parse(Buffer.from(h, "base64url"))).toEqual({ alg: "ES256", kid: "KEY1234567", typ: "JWT" });
  expect(JSON.parse(Buffer.from(p, "base64url"))).toEqual({
    iss: "TEAM123456", iat: 1_800_000_000, exp: 1_800_000_300, aud: "https://appleid.apple.com", sub: "com.dreamrushes.app",
  });
  // ⚠ Raw r||s (64 bytes), not DER — Apple rejects DER as invalid_client.
  const sig = Buffer.from(s, "base64url");
  expect(sig.length).toBe(64);
  expect(verify("sha256", Buffer.from(`${h}.${p}`), { key: publicKey, dsaEncoding: "ieee-p1363" }, sig)).toBe(true);
});

/* ── revokeAppleForDeletion ────────────────────────────────────────────── */

test("a fresh code is traded for tokens and the refresh token is revoked", async () => {
  const f = fakeFetch([TOKEN_OK, REVOKE_OK]);
  expect(await revokeAppleForDeletion("code-1", SUB, { config, fetchImpl: f })).toEqual({ ok: true });
  expect(f.calls[0].url).toBe("https://appleid.apple.com/auth/token");
  expect(f.calls[0].form).toMatchObject({ client_id: "com.dreamrushes.app", code: "code-1", grant_type: "authorization_code" });
  expect(f.calls[0].form.client_secret.split(".").length).toBe(3);
  expect(f.calls[1].url).toBe("https://appleid.apple.com/auth/revoke");
  expect(f.calls[1].form).toMatchObject({ token: "rt", token_type_hint: "refresh_token" });
});

/* ⚠⚠ The code must come from the Apple ID behind this account. Signed in as
   A, confirming with Apple ID B must not revoke B's link. */
test("a code from a different Apple ID is refused and nothing is revoked", async () => {
  const f = fakeFetch([{ status: 200, body: { refresh_token: "rt", id_token: idToken("000999.other") } }]);
  const r = await revokeAppleForDeletion("code-1", SUB, { config, fetchImpl: f });
  expect(r).toMatchObject({ ok: false, status: 403 });
  expect(f.calls.length).toBe(1);
});

test("an account without an Apple sub never matches", async () => {
  const f = fakeFetch([TOKEN_OK]);
  expect((await revokeAppleForDeletion("code-1", null, { config, fetchImpl: f })).status).toBe(403);
});

test("a spent or expired code asks the person to confirm again", async () => {
  const f = fakeFetch([{ status: 400, body: { error: "invalid_grant" } }]);
  const r = await revokeAppleForDeletion("old", SUB, { config, fetchImpl: f });
  expect(r).toMatchObject({ ok: false, status: 400 });
  expect(f.calls.length).toBe(1);
});

test("Apple failing is a 503, never a success", async () => {
  const cases = [
    [new Error("network down")],
    [{ status: 401, body: { error: "invalid_client" } }],
    [{ status: 500, body: {} }],
    [TOKEN_OK, { status: 500 }],            // token fine, revoke fails
    [TOKEN_OK, new Error("timeout")],
    [{ status: 200, body: { id_token: idToken(SUB) } }],   // no token to revoke
  ];
  for (const replies of cases) {
    const r = await revokeAppleForDeletion("code-1", SUB, { config, fetchImpl: fakeFetch(replies) });
    expect(r).toMatchObject({ ok: false, status: 503 });
  }
});

test("without config or code nothing reaches Apple", async () => {
  const f = fakeFetch([]);
  expect((await revokeAppleForDeletion("code-1", SUB, { config: null, fetchImpl: f })).status).toBe(503);
  for (const bad of [undefined, null, "", "   ", 42, "x".repeat(2000)]) {
    expect((await revokeAppleForDeletion(bad, SUB, { config, fetchImpl: f })).status).toBe(400);
  }
  expect((await revokeAppleForDeletion("code-1", SUB, { config: { ...config, privateKey: "not a key" }, fetchImpl: f })).status).toBe(503);
  expect(f.calls.length).toBe(0);
});
