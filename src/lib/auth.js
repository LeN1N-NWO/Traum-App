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
/* An Apple identity token is a signed JWT — around 1 KB in practice. The cap
   is generous enough that Apple can grow the payload and tight enough that
   nobody posts a megabyte at the sign-in endpoint. The nonce is ours: 32
   random bytes, hex or base64, never anywhere near this. */
const MAX_ID_TOKEN = 8192;
const MAX_NONCE = 256;

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
 * The token out of a WebSocket's `Sec-WebSocket-Protocol` header. Pure.
 *
 * A browser WebSocket cannot set an Authorization header, so the voice
 * interview (src/lib/voiceSession.js) offers its token as a subprotocol:
 * `dreamrushes, bearer.<token>`. S1, needsAccount() in gatekeeper.js.
 * @param {string|null|undefined} header
 * @returns {string|null}
 */
export const WS_PROTOCOL = "dreamrushes";
export function parseWsBearer(header) {
  if (typeof header !== "string") return null;
  const parts = header.split(",").map((p) => p.trim());
  if (!parts.includes(WS_PROTOCOL)) return null;
  const entry = parts.find((p) => p.startsWith("bearer."));
  const token = entry ? entry.slice("bearer.".length) : "";
  return token ? token : null;
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
    /* ⚠ Ein 5xx von Supabase ist KEIN Urteil über die Zugangsdaten — am
       12.09.2026 kam mitten in einem Prüflauf ein 504 von deren Gateway,
       während dieselbe Anfrage davor und danach sauber 400 lieferte. Roh
       durchgereicht sähe das für den Client aus wie ein Fehler bei ihm.
       Es ist dasselbe wie ein Netzwerkaussetzer: nicht deine Schuld,
       gleich nochmal. */
    const status = res.status >= 500 ? 503
      : res.status === 400 || res.status === 401 ? 401
      : res.status;
    const error = status === 401 ? "Invalid login credentials."
      : status === 503 ? "Sign-in is unavailable right now."
      : status === 429 ? "Too many attempts. Wait a moment and try again."
      : "Sign-in failed.";
    /* The code alone says too little: "validation_failed" covers a switched-off
       provider and a malformed field alike. Supabase puts the reason in `msg`
       (current) or `error_description` (older). It goes to the log — a
       rejection means nothing without its reason — and never to the client. */
    const code = data?.error_code || data?.error || String(res.status);
    const detail = data?.msg || data?.error_description;
    const cause = [code, detail].filter(Boolean).join(": ");
    /* ⚠ A sign-in method switched off in Supabase is OUR configuration fault,
       not a wrong credential — so 503, and say which switch, for every way in.
       Match the code, never the prose (measured on the real Supabase,
       15.09.2026): the switch being off answers `provider_disabled` with
       'Provider (issuer "…") is not enabled', the issuer sitting mid-sentence;
       a garbage token answers "Unable to detect issuer in ID token for Apple
       provider" — the word "provider", yet nothing is switched off. Older
       GoTrue versions said "Unsupported provider". */
    if (/provider_disabled/.test(code) || /unsupported provider/i.test(detail || "")) {
      return { ok: false, status: 503, error: "This sign-in method is not switched on for this project.", cause };
    }
    /* `code` rides along for callers that must tell rejections apart —
       sign-up does (weak password vs. bad address); sign-in deliberately not. */
    return { ok: false, status, error, cause, code };
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
  /* Signed up, link not clicked yet (since 03.10.2026 a normal state).
     Supabase says so only AFTER the password matched, so naming it reveals
     nothing to someone guessing — and "wrong password" here would send a
     person who typed everything right off to doubt their password. */
  if (!r.ok && /email_not_confirmed/.test(r.code || "")) {
    return { ok: false, status: 403, error: "Confirm your e-mail first.", reason: "unconfirmed", cause: r.cause };
  }
  if (!r.ok) return r;
  return { ok: true, session: publicSession(r.data) };
}

/**
 * Create an account with e-mail and password (03.10.2026).
 *
 * With "Confirm email" switched on in Supabase (it is, measured 03.10.2026:
 * `mailer_autoconfirm: false`) there is no session yet — Supabase mails a
 * link, and only after that click does passwordLogin() work. The answer is
 * then `{ ok: true, confirm: true }` and nothing else: Supabase returns a
 * user record here, and for an address that ALREADY has an account it
 * returns an invented one, so that sign-up does not reveal who is a member.
 * Passing on its id would hand the client a fake. With confirmation off,
 * Supabase answers with a session, and so do we — same shape as sign-in.
 *
 * ⚠ The built-in Supabase mailer only delivers to members of the Supabase
 *   team, a few per hour. Real people need custom SMTP in the dashboard.
 *
 * Same password discipline as passwordLogin(): one request body, never
 * logged, never kept.
 *
 * @returns {Promise<{ok: true, session: object} | {ok: true, confirm: true}
 *   | {ok: false, status: number, error: string, reason?: string, cause?: string}>}
 *   `reason` (weak | invalid | exists) lets the app say what to fix.
 */
export async function passwordSignup({ email, password } = {}, { config, fetchImpl } = {}) {
  if (!config) return { ok: false, status: 503, error: "Sign-in is not configured." };
  if (typeof email !== "string" || typeof password !== "string"
      || !email.trim() || !password
      || email.length > MAX_EMAIL || password.length > MAX_PASSWORD) {
    return { ok: false, status: 400, error: "E-mail and password are required." };
  }

  const r = await authCall("/auth/v1/signup", {
    body: { email: email.trim(), password },
    config,
    fetchImpl,
  });
  if (!r.ok) {
    /* authCall() reads every 400 as "wrong credentials" — right for sign-in,
       wrong here, where nothing was compared. Sorted by Supabase's code. */
    const code = r.code || "";
    if (/weak_password/.test(code)) {
      return { ok: false, status: 422, error: "That password is too weak.", reason: "weak", cause: r.cause };
    }
    if (/email_address_invalid|validation_failed/.test(code)) {
      return { ok: false, status: 400, error: "That doesn't look like an e-mail address.", reason: "invalid", cause: r.cause };
    }
    /* Only reachable with confirmation OFF — with it on, Supabase hides an
       existing address behind the invented user above. The anon key is
       public, so hiding it here would protect nothing Supabase itself shows. */
    if (/user_already_exists|email_exists/.test(code)) {
      return { ok: false, status: 409, error: "There is already an account for this e-mail.", reason: "exists", cause: r.cause };
    }
    if (/signup_disabled/.test(code)) {
      return { ok: false, status: 503, error: "This sign-in method is not switched on for this project.", cause: r.cause };
    }
    return r;
  }
  if (r.data.access_token) return { ok: true, session: publicSession(r.data) };
  return { ok: true, confirm: true };
}

/* Supabase's own minimum (measured 03.10.2026: "Password should be at least
   6 characters"). Checked here BEFORE a reset code is spent — see below. */
const MIN_PASSWORD = 6;
/* Recovery codes are 6 digits by default; projects can raise it to 10. */
const CODE_RE = /^\d{6,10}$/;

/**
 * Forgot password, step 1: mail a recovery code (03.10.2026).
 *
 * Code, not link: the link would land on a web page we do not have, or
 * need a deep link back into the app; a code is typed into the app wherever
 * the mail was opened. ⚠ The Supabase "Reset Password" template must show
 * `{{ .Token }}` — the default one only carries the link.
 *
 * Supabase answers an unknown address exactly like a known one, and so do
 * we: "is there an account for this address" is not a question for strangers.
 *
 * @returns {Promise<{ok: true} | {ok: false, status: number, error: string, cause?: string}>}
 */
export async function requestPasswordReset({ email } = {}, { config, fetchImpl } = {}) {
  if (!config) return { ok: false, status: 503, error: "Sign-in is not configured." };
  if (typeof email !== "string" || !email.trim() || email.length > MAX_EMAIL) {
    return { ok: false, status: 400, error: "An e-mail address is required." };
  }
  const r = await authCall("/auth/v1/recover", { body: { email: email.trim() }, config, fetchImpl });
  if (!r.ok) {
    if (/email_address_invalid|validation_failed/.test(r.code || "")) {
      return { ok: false, status: 400, error: "That doesn't look like an e-mail address.", reason: "invalid", cause: r.cause };
    }
    return r;
  }
  return { ok: true };
}

/**
 * Forgot password, step 2: code + new password → new password, signed in.
 *
 * Two calls: the code buys a short session (verify, type "recovery"), and
 * that session sets the password (PUT /user).
 *
 * ⚠ A code works ONCE. So everything that can be checked is checked before
 *   it is spent — a password Supabase would refuse as too short would
 *   otherwise burn the code and send the person back to step 1.
 *
 * @returns {Promise<{ok: true, session: object, othersSignedOut: boolean, cause?: string}
 *   | {ok: false, status: number, error: string, reason?: string, cause?: string}>}
 *   `reason`: code (wrong or expired), weak, invalid.
 */
export async function resetPassword({ email, code, password } = {}, { config, fetchImpl } = {}) {
  if (!config) return { ok: false, status: 503, error: "Sign-in is not configured." };
  if (typeof email !== "string" || typeof code !== "string" || typeof password !== "string"
      || !email.trim() || email.length > MAX_EMAIL || !password || password.length > MAX_PASSWORD) {
    return { ok: false, status: 400, error: "E-mail, code and password are required." };
  }
  if (!CODE_RE.test(code.trim())) {
    return { ok: false, status: 400, error: "That code is wrong or has expired.", reason: "code" };
  }
  if (password.length < MIN_PASSWORD) {
    return { ok: false, status: 422, error: "That password is too weak.", reason: "weak" };
  }

  const v = await authCall("/auth/v1/verify", {
    body: { type: "recovery", email: email.trim(), token: code.trim() },
    config,
    fetchImpl,
  });
  if (!v.ok) {
    /* authCall() calls a refused code "wrong credentials" — here it is the code. */
    if (v.status === 401 || v.status === 403 || /otp_expired|otp_invalid/.test(v.code || "")) {
      return { ok: false, status: 401, error: "That code is wrong or has expired.", reason: "code", cause: v.cause };
    }
    return v;
  }
  if (!v.data.access_token) return { ok: false, status: 503, error: "Sign-in is unavailable right now." };

  const u = await authCall("/auth/v1/user", {
    method: "PUT",
    body: { password },
    token: v.data.access_token,
    config,
    fetchImpl,
  });
  /* The new password equals the old one: nothing to change, and the person
     knows their password — that is a success, not an error. */
  if (!u.ok && !/same_password/.test(u.code || "")) {
    if (/weak_password/.test(u.code || "")) {
      return { ok: false, status: 422, error: "That password is too weak.", reason: "weak", cause: u.cause };
    }
    return u;
  }

  /* Every OTHER device is signed out (Hanni, 04.10.2026): whoever resets a
     password because a phone went missing expects that phone to lose access.
     scope=others keeps this session and revokes the refresh tokens of the
     rest; their access tokens run out within the hour. Also after
     same_password — the reason for resetting may be the lost phone, not a
     forgotten password. A failure here does not undo the reset: the new
     password is set, so the person gets in, and the caller logs it. */
  const out = await authCall("/auth/v1/logout?scope=others", {
    body: {},
    token: v.data.access_token,
    config,
    fetchImpl,
  });
  return { ok: true, session: publicSession(v.data), othersSignedOut: out.ok, ...(out.ok ? {} : { cause: out.cause }) };
}

/**
 * Sign in with Apple — the second way in, and the first one that creates an
 * account by itself (Übergabe 2026-09-14: "Konten ohne dich").
 *
 * The phone runs Apple's own sheet and comes back with an identity token: a
 * JWT signed by Apple. We hand it to Supabase, which checks Apple's signature
 * and either finds the person or creates them. From the next line on, nothing
 * can tell this session from a password one — same shape, same verifyAccessToken().
 *
 * ⚠ The nonce travels RAW here and hashed at Apple. The app generates a random
 *   value, sends SHA-256 of it into signInAsync(), and Apple puts that hash in
 *   the token. Supabase hashes what we send and compares. Sending the hash
 *   instead of the raw value therefore fails — it would hash a hash — and it
 *   fails as "invalid credentials", which reads like Apple's fault. It is not.
 *
 * ⚠ We never see an Apple password, and often not a real address either:
 *   "Hide My Mail" delivers a @privaterelay.appleid.com forwarder. That is a
 *   valid address to us and must not be treated as second-class — it is the
 *   only one such a person has.
 *
 * @returns {Promise<{ok: true, session: object} | {ok: false, status: number, error: string, cause?: string}>}
 */
export async function appleLogin({ identityToken, nonce } = {}, { config, fetchImpl } = {}) {
  if (!config) return { ok: false, status: 503, error: "Sign-in is not configured." };
  if (typeof identityToken !== "string" || !identityToken.trim()
      || identityToken.length > MAX_ID_TOKEN
      || (nonce !== undefined && nonce !== null
          && (typeof nonce !== "string" || nonce.length > MAX_NONCE))) {
    return { ok: false, status: 400, error: "An Apple identity token is required." };
  }

  const r = await authCall("/auth/v1/token?grant_type=id_token", {
    body: {
      provider: "apple",
      id_token: identityToken.trim(),
      ...(nonce ? { nonce } : {}),
    },
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
  return { userId: r.data.id, email: r.data.email ?? null, appleSub: appleSubOf(r.data) };
}

/* The Apple `sub` behind an account, or null for a password-only account.
   Deleting needs it (apple-revoke.js): an Apple-linked account must revoke
   its Apple tokens first, and only with a code from the same Apple ID.
   GoTrue keeps it in the identity as identity_data.sub; provider_id and the
   older `id` field carry the same value and are the fallbacks. */
function appleSubOf(user) {
  const apple = Array.isArray(user?.identities) ? user.identities.find((i) => i?.provider === "apple") : null;
  const sub = apple?.identity_data?.sub || apple?.provider_id || apple?.id;
  return typeof sub === "string" && sub ? sub : null;
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
