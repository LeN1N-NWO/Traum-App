/* Who is asking (ADR-0005). The missing half of src/lib/db.js.
 *
 * db.js can act on behalf of a person — withUser() declares one at the start
 * of a transaction and Row Level Security does the rest. What it cannot do is
 * say WHO that person is. This file answers exactly that, and nothing else.
 *
 * ── Why the server sits in the middle ────────────────────────────────────
 * Supabase Auth would happily talk to the client directly; the anon key is
 * built to be public. We still route it through server.js, for the same
 * reason fal, DeepSeek and Gemini are routed through it (ADR-0005: "Der
 * Client spricht weiterhin nur mit server.js"): one place that speaks to
 * providers, one place where the rate limit applies, and a client bundle
 * that holds no provider addresses at all. It also keeps the door open —
 * a second sign-in path later (Sign in with Apple, or a company SSO) becomes
 * one more endpoint HERE, while everything downstream keeps working, because
 * verifyAccessToken() below does not care how a session came to be.
 *
 * ── Why no @supabase/supabase-js ─────────────────────────────────────────
 * Four REST calls against a documented API. The SDK would add a dependency
 * tree to save four `fetch` calls that look exactly like the fourteen this
 * server already makes.
 *
 * ── Why the token is verified at Supabase and not here ───────────────────
 * Verifying a JWT locally means holding the signing secret (or fetching and
 * caching JWKS) and getting the algorithm check right — the kind of code
 * where a mistake is silent and total. Asking Supabase costs one request and
 * cannot be got subtly wrong. If that round-trip ever shows up in a
 * measurement, local verification is the optimisation — not before.
 *
 * ⚠ Nothing here logs a password, a token or a refresh token. They pass
 *   through as values and are never interpolated into a message. A log line
 *   is read by people and pasted into chats (same reasoning as the password
 *   redaction in db.js).
 */

/* Every outgoing call gets a deadline — S4 in docs/ARCHITEKTUR.md, fixed on
   11.09.2026 for the other fourteen. Auth is a small JSON round-trip; ten
   seconds is generous and still short enough that a hanging Supabase does
   not hold a request open. */
const AUTH_TIMEOUT = 10_000;

/* Caps before anything reaches the network. Not about SQL injection — these
   travel as JSON values — but about refusing nonsense cheaply, and about the
   one shape that actually matters: bcrypt-based hashing truncates, so an
   unbounded password field is a way to waste memory, not to be more secure. */
const MAX_EMAIL = 320;      // the longest address RFC 5321 permits
const MAX_PASSWORD = 1024;

/**
 * The token out of an `Authorization: Bearer …` header. Pure.
 * @param {string|null|undefined} header
 * @returns {string|null} null whenever there is nothing usable — an empty
 *   token must never read as "present but empty" further down.
 */
export function parseBearer(header) {
  if (typeof header !== "string") return null;
  const m = /^Bearer[ \t]+(\S+)$/i.exec(header.trim());
  return m ? m[1] : null;
}

/**
 * Where Supabase Auth lives, from the environment. Pure.
 *
 * Both halves are needed or neither is: a URL without the key cannot call
 * anything, and a key without the URL has nowhere to go. Returning null for
 * "not configured" mirrors db.js — sign-in is optional exactly as the
 * database is, and a checkout without it runs on without accounts.
 *
 * @returns {{ url: string, anonKey: string } | null}
 */
export function authConfig(env = process.env) {
  const url = String(env.SUPABASE_URL || "").trim().replace(/\/+$/, "");
  const anonKey = String(env.SUPABASE_ANON_KEY || "").trim();
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

/** What the client is allowed to see of a Supabase session.
 *
 *  Deliberately a positive list, the same discipline as backupEntry() in
 *  journalBackup.js: Supabase's answer carries the whole user record
 *  (app_metadata, identities, every timestamp). None of that is the client's
 *  business, and copying it wholesale means a future Supabase field travels
 *  to a phone without anyone deciding it should. */
function publicSession(raw) {
  return {
    access_token: raw.access_token,
    refresh_token: raw.refresh_token,
    token_type: raw.token_type || "bearer",
    expires_in: raw.expires_in,
    expires_at: raw.expires_at,
    user: raw.user ? { id: raw.user.id, email: raw.user.email } : null,
  };
}

/** One call to Supabase Auth. Errors become a verdict, never an exception:
 *  the callers all have to answer the client either way, and a thrown
 *  network error and a rejected password need the same shape here. */
async function authCall(path, { method = "POST", body, token, config, fetchImpl = fetch }) {
  const headers = { apikey: config.anonKey, "content-type": "application/json" };
  /* Without a session token the anon key IS the authorisation — that is how
     the password grant authenticates the request itself. */
  headers.authorization = `Bearer ${token || config.anonKey}`;

  let res;
  try {
    res = await fetchImpl(`${config.url}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(AUTH_TIMEOUT),
    });
  } catch (e) {
    /* A timeout and a dead network look the same to the person waiting, and
       both mean: not our fault, try again. Never 401 — that would tell
       someone their password is wrong when it never got looked at. */
    return { ok: false, status: 503, error: "Sign-in is unavailable right now.", cause: e?.name || "fetch failed" };
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    /* Supabase answers a wrong password and an unknown address with the same
       "Invalid login credentials", and that is right — anything more precise
       is an oracle for which addresses have accounts. We keep it generic. */
    const status = res.status === 400 || res.status === 401 ? 401 : res.status;
    return {
      ok: false,
      status,
      error: status === 401 ? "Invalid login credentials." : "Sign-in failed.",
      cause: data?.error_code || data?.error || String(res.status),
    };
  }
  return { ok: true, data: data || {} };
}

/**
 * Sign in with e-mail and password.
 *
 * ⚠ This is the ONLY place in the codebase that sees a password, and it does
 *   not keep it: the value goes into one request body and out of scope. It is
 *   never logged, never stored, never compared here — Supabase holds the
 *   hash and makes the decision.
 *
 * @returns {Promise<{ok: true, session: object} | {ok: false, status: number, error: string, cause?: string}>}
 */
export async function passwordLogin({ email, password } = {}, { config, fetchImpl } = {}) {
  if (!config) return { ok: false, status: 503, error: "Sign-in is not configured." };
  if (typeof email !== "string" || typeof password !== "string"
      || !email.trim() || !password
      || email.length > MAX_EMAIL || password.length > MAX_PASSWORD) {
    return { ok: false, status: 400, error: "E-mail and password are required." };
  }

  const r = await authCall("/auth/v1/token?grant_type=password", {
    body: { email: email.trim(), password },
    config,
    fetchImpl,
  });
  if (!r.ok) return r;
  return { ok: true, session: publicSession(r.data) };
}

/**
 * Trade a refresh token for a fresh session.
 *
 * Access tokens are short-lived by design (an hour by default). Without this
 * the app would ask for the password again every hour, and an app that asks
 * often is an app whose password gets typed in the wrong place eventually.
 */
export async function refreshSession(refreshToken, { config, fetchImpl } = {}) {
  if (!config) return { ok: false, status: 503, error: "Sign-in is not configured." };
  if (typeof refreshToken !== "string" || !refreshToken.trim()) {
    return { ok: false, status: 400, error: "A refresh token is required." };
  }

  const r = await authCall("/auth/v1/token?grant_type=refresh_token", {
    body: { refresh_token: refreshToken.trim() },
    config,
    fetchImpl,
  });
  if (!r.ok) return r;
  return { ok: true, session: publicSession(r.data) };
}

/**
 * Who does this access token belong to?
 *
 * ⚠⚠ The one function the whole per-person boundary rests on. Whatever it
 *    returns becomes the `userId` handed to withUser(), and from there
 *    auth.uid() and every RLS policy. It therefore answers ONLY from
 *    Supabase's verdict on the token — never from anything in the request
 *    body, and never from an unverified claim inside the token itself.
 *
 * Provider-neutral on purpose: password, magic link, Sign in with Apple or a
 * company SSO all end in a Supabase session, and all of them verify here
 * unchanged. A new sign-in path never has to touch this function.
 *
 * @returns {Promise<{userId: string, email: string|null} | null>} null for
 *   every failure — expired, forged, revoked, or Supabase unreachable. A
 *   caller that cannot tell a person apart must refuse, not guess.
 */
export async function verifyAccessToken(token, { config, fetchImpl } = {}) {
  if (!config) return null;
  if (typeof token !== "string" || !token.trim()) return null;

  const r = await authCall("/auth/v1/user", { method: "GET", token: token.trim(), config, fetchImpl });
  if (!r.ok || !r.data?.id) return null;
  return { userId: r.data.id, email: r.data.email ?? null };
}

/**
 * End the session at Supabase, so the refresh token stops working.
 *
 * Dropping the tokens on the device would be enough for the person in front
 * of it, and nowhere near enough for a device that was lost: a refresh token
 * is valid until someone says otherwise. This says otherwise. Failure is not
 * worth an error to the client — the tokens are being discarded either way.
 */
export async function logout(token, { config, fetchImpl } = {}) {
  if (!config) return { ok: true };
  const t = typeof token === "string" ? token.trim() : "";
  if (!t) return { ok: true };
  const r = await authCall("/auth/v1/logout?scope=global", { body: {}, token: t, config, fetchImpl });
  return { ok: true, revoked: r.ok };
}
