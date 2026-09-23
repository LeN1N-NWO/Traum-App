/* Sign in with Apple: revoke the person's Apple tokens when they delete
 * their account.
 *
 * ── Why ───────────────────────────────────────────────────────────────────
 * App Review 5.1.1(v) requires in-app account deletion, and Apple's page on
 * it says apps that support Sign in with Apple should revoke the user's
 * tokens through the REST API (developer.apple.com/support/offering-account-
 * deletion-in-your-app). Supabase Auth does not do this on user deletion
 * (supabase/auth#1308, closed "not planned"), so we do it here.
 *
 * ── How (Weg A, Hanni 23.09.2026) ─────────────────────────────────────────
 * We keep NO Apple token anywhere. Deleting asks the phone for Apple's sheet
 * once more; it hands back a fresh authorization code (valid five minutes,
 * single use). This file trades that code for tokens and revokes them at
 * once, inside the same request. Storing Apple's refresh token at sign-in
 * would spare the person one sheet — and leave a long-lived credential in
 * our database for every Apple account, forever. Least privilege says no.
 *
 * ── Order matters ────────────────────────────────────────────────────────
 * server.js revokes FIRST and deletes the Supabase user only after Apple
 * said yes. The other way round, a failed revocation would leave a deleted
 * account whose Apple link can never be revoked again (the code is spent,
 * and nobody can sign in to retry).
 *
 * ⚠ Nothing here logs a code, a token or the private key. They pass through
 *   as values (same rule as auth.js).
 */

import { createPrivateKey, sign } from "node:crypto";

const APPLE = "https://appleid.apple.com";
/* Same deadline as the Supabase calls in auth.js: a small form POST. */
const APPLE_TIMEOUT = 10_000;
/* An authorization code is a short opaque string (~64 chars today). The cap
   refuses nonsense before it reaches Apple, nothing more. */
const MAX_CODE = 1024;
/* The client_secret JWT: Apple accepts up to six months; we sign a fresh
   one per request, so five minutes is plenty. */
const SECRET_TTL = 300;

/**
 * Apple's side of the deletion, from the environment. Pure.
 *
 * All four or nothing — like authConfig(). Missing values are not a crash:
 * a checkout without the key runs on; only deleting an Apple account then
 * answers 503 and says why.
 *
 * APPLE_SIGNIN_KEY is the .p8 file's content. In a one-line .env value the
 * line breaks may be written as a literal "\n"; they are restored here.
 *
 * @returns {{ teamId: string, keyId: string, clientId: string, privateKey: string } | null}
 */
export function appleRevokeConfig(env = process.env) {
  const teamId = String(env.APPLE_TEAM_ID || "").trim();
  const keyId = String(env.APPLE_SIGNIN_KEY_ID || "").trim();
  const clientId = String(env.APPLE_CLIENT_ID || "com.dreamrushes.app").trim();
  const privateKey = String(env.APPLE_SIGNIN_KEY || "").replace(/\\n/g, "\n").trim();
  if (!teamId || !keyId || !clientId || !privateKey) return null;
  return { teamId, keyId, clientId, privateKey };
}

const b64url = (buf) => Buffer.from(buf).toString("base64url");

/**
 * The client_secret Apple wants: an ES256 JWT signed with our Sign in with
 * Apple key. Exported for the test, which checks it against the public key.
 */
export function clientSecret(config, now = Math.floor(Date.now() / 1000)) {
  const header = { alg: "ES256", kid: config.keyId, typ: "JWT" };
  const payload = { iss: config.teamId, iat: now, exp: now + SECRET_TTL, aud: APPLE, sub: config.clientId };
  const input = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`;
  /* ⚠ ieee-p1363: JWS wants the raw 64-byte r||s signature. Node's default is
     DER, which Apple rejects as "invalid_client" — the kind of error that
     reads like a wrong key when the key is fine. */
  const sig = sign("sha256", Buffer.from(input), { key: createPrivateKey(config.privateKey), dsaEncoding: "ieee-p1363" });
  return `${input}.${b64url(sig)}`;
}

/* The `sub` of the id_token in Apple's token answer. Not verified — it
   arrived over TLS as the direct reply to a request only we can sign, which
   is the check. Anything unreadable is null. */
function subOf(idToken) {
  try {
    return JSON.parse(Buffer.from(String(idToken).split(".")[1], "base64url").toString("utf8")).sub || null;
  } catch {
    return null;
  }
}

async function appleCall(path, form, fetchImpl) {
  try {
    const res = await fetchImpl(`${APPLE}${path}`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(form).toString(),
      signal: AbortSignal.timeout(APPLE_TIMEOUT),
    });
    const data = await res.json().catch(() => null);
    return { ok: res.ok, status: res.status, data };
  } catch (e) {
    return { ok: false, status: 0, data: null, cause: e?.name || "fetch failed" };
  }
}

/**
 * Trade the fresh code for tokens and revoke them — for exactly the Apple
 * account behind the session. Errors are a verdict, never an exception.
 *
 * @param {string} code        the authorization code from the phone
 * @param {string} expectedSub the Apple `sub` of the signed-in account
 * @returns {Promise<{ ok: true } | { ok: false, status: number, error: string, cause?: string }>}
 */
export async function revokeAppleForDeletion(code, expectedSub, { config, fetchImpl = fetch, now } = {}) {
  if (!config) return { ok: false, status: 503, error: "Deleting an Apple account is not set up on this server." };
  if (typeof code !== "string" || !code.trim() || code.length > MAX_CODE) {
    return { ok: false, status: 400, error: "An Apple confirmation is required." };
  }

  let secret;
  try {
    secret = clientSecret(config, now);
  } catch {
    /* A malformed key is a server problem, not the person's. */
    return { ok: false, status: 503, error: "Deleting an Apple account is not set up on this server.", cause: "bad key" };
  }
  const client = { client_id: config.clientId, client_secret: secret };

  const t = await appleCall("/auth/token", { ...client, code: code.trim(), grant_type: "authorization_code" }, fetchImpl);
  if (!t.ok) {
    /* invalid_grant = the code is spent or older than five minutes. The
       person can simply confirm again. Everything else is on us or Apple. */
    if (t.status === 400 && t.data?.error === "invalid_grant") {
      return { ok: false, status: 400, error: "The Apple confirmation has expired. Please try again." };
    }
    return { ok: false, status: 503, error: "Apple could not be reached. Please try again.", cause: t.cause || t.data?.error || `token ${t.status}` };
  }

  /* ⚠ The code must belong to THIS account. Otherwise someone signed in as
     A could confirm with Apple ID B and revoke B's link while deleting A. */
  if (!expectedSub || subOf(t.data?.id_token) !== expectedSub) {
    return { ok: false, status: 403, error: "That Apple ID does not belong to this account." };
  }

  /* Revoking the refresh token ends the whole grant; the access token is the
     fallback if Apple ever answers without one. */
  const token = t.data?.refresh_token || t.data?.access_token;
  if (!token) return { ok: false, status: 503, error: "Apple could not be reached. Please try again.", cause: "no token" };
  const r = await appleCall("/auth/revoke", {
    ...client, token, token_type_hint: t.data?.refresh_token ? "refresh_token" : "access_token",
  }, fetchImpl);
  if (!r.ok) return { ok: false, status: 503, error: "Apple could not be reached. Please try again.", cause: r.cause || `revoke ${r.status}` };
  return { ok: true };
}
