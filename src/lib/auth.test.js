import { test, expect } from "bun:test";
import { parseBearer, authConfig, passwordLogin, appleLogin, refreshSession, verifyAccessToken, logout } from "./auth.js";

const config = { url: "https://projekt.supabase.co", anonKey: "anon-key" };
const UID = "3ecbfe28-21c1-4475-b931-1082d2b56ba7";

/* A stand-in for fetch. Records every call so a test can see what actually
   reached the network — including the calls that must NOT happen. */
function fakeFetch(reply) {
  const calls = [];
  const f = async (url, init) => {
    calls.push({ url, init, body: init?.body ? JSON.parse(init.body) : null });
    const r = typeof reply === "function" ? reply(url, init) : reply;
    if (r instanceof Error) throw r;
    return {
      ok: r.status < 400,
      status: r.status,
      json: async () => r.body,
    };
  };
  f.calls = calls;
  return f;
}

const SESSION = {
  access_token: "at-1", refresh_token: "rt-1", token_type: "bearer",
  expires_in: 3600, expires_at: 1789000000,
  user: { id: UID, email: "test@example.com" },
};

/* ── parseBearer ───────────────────────────────────────────────────────── */

test("a bearer header yields its token", () => {
  expect(parseBearer("Bearer abc.def.ghi")).toBe("abc.def.ghi");
  expect(parseBearer("bearer abc")).toBe("abc");        // schemes are case-insensitive
  expect(parseBearer("  Bearer\tabc  ")).toBe("abc");
});

/* An empty token must not read as "present but empty" — downstream that
   would become a request to Supabase with no credentials at all. */
test("anything that is not a usable token is null, not an empty string", () => {
  for (const bad of [undefined, null, 42, {}, "", "Bearer", "Bearer ", "Basic abc", "abc"]) {
    expect(parseBearer(bad)).toBe(null);
  }
});

/* ── authConfig ────────────────────────────────────────────────────────── */

test("both halves are needed, or sign-in counts as not configured", () => {
  expect(authConfig({ SUPABASE_URL: "https://a.co", SUPABASE_ANON_KEY: "k" }))
    .toEqual({ url: "https://a.co", anonKey: "k" });
  expect(authConfig({ SUPABASE_URL: "https://a.co" })).toBe(null);
  expect(authConfig({ SUPABASE_ANON_KEY: "k" })).toBe(null);
  expect(authConfig({})).toBe(null);
});

test("a trailing slash in the URL does not become a double slash in the path", () => {
  expect(authConfig({ SUPABASE_URL: "https://a.co/", SUPABASE_ANON_KEY: "k" }).url).toBe("https://a.co");
});

/* ── passwordLogin ─────────────────────────────────────────────────────── */

test("a correct password comes back as a session", async () => {
  const f = fakeFetch({ status: 200, body: SESSION });
  const r = await passwordLogin({ email: "test@example.com", password: "pw" }, { config, fetchImpl: f });
  expect(r.ok).toBe(true);
  expect(r.session.access_token).toBe("at-1");
  expect(r.session.user).toEqual({ id: UID, email: "test@example.com" });
  expect(f.calls[0].url).toBe("https://projekt.supabase.co/auth/v1/token?grant_type=password");
  expect(f.calls[0].init.headers.apikey).toBe("anon-key");
  expect(f.calls[0].body).toEqual({ email: "test@example.com", password: "pw" });
});

/* ⚠ The answer is a positive list, not a copy. Supabase hands back the whole
   user record; a field nobody decided to send must not reach a phone just
   because Supabase added it. */
test("only the agreed fields of a session reach the client", async () => {
  const f = fakeFetch({ status: 200, body: {
    ...SESSION,
    provider_refresh_token: "should-not-travel",
    user: { ...SESSION.user, app_metadata: { role: "admin" }, identities: [{ provider: "email" }], phone: "+49123" },
  } });
  const { session } = await passwordLogin({ email: "a@b.co", password: "pw" }, { config, fetchImpl: f });
  expect(Object.keys(session).sort())
    .toEqual(["access_token", "expires_at", "expires_in", "refresh_token", "token_type", "user"]);
  expect(Object.keys(session.user).sort()).toEqual(["email", "id"]);
  expect(JSON.stringify(session)).not.toContain("should-not-travel");
  expect(JSON.stringify(session)).not.toContain("app_metadata");
});

/* Supabase says "Invalid login credentials" for a wrong password AND for an
   address that has no account. Keeping that one answer is deliberate: any
   difference tells a stranger which addresses exist here. */
test("a rejected sign-in says the same thing whatever was wrong", async () => {
  const f = fakeFetch({ status: 400, body: { error_code: "invalid_credentials", msg: "Invalid login credentials" } });
  const r = await passwordLogin({ email: "a@b.co", password: "wrong" }, { config, fetchImpl: f });
  expect(r.ok).toBe(false);
  expect(r.status).toBe(401);
  expect(r.error).toBe("Invalid login credentials.");
});

/* ⚠ An unreachable Supabase must never look like a wrong password: the
   person would change a password that was never checked. */
test("a network failure is 503, not 401", async () => {
  const r = await passwordLogin({ email: "a@b.co", password: "pw" },
    { config, fetchImpl: fakeFetch(Object.assign(new Error("timed out"), { name: "TimeoutError" })) });
  expect(r.ok).toBe(false);
  expect(r.status).toBe(503);
});

/* ⚠ Am 12.09.2026 live gesehen: mitten in einem Prüflauf antwortete
   Supabases Gateway mit 504, während dieselbe Anfrage davor und danach 400
   lieferte. Roh durchgereicht sagt das dem Menschen „dein Passwort ist
   falsch", obwohl es nie geprüft wurde. */
test("a hiccup at Supabase is 503, not a verdict on the password", async () => {
  for (const status of [500, 502, 503, 504]) {
    const r = await passwordLogin({ email: "a@b.co", password: "pw" },
      { config, fetchImpl: fakeFetch({ status, body: {} }) });
    expect(r.status).toBe(503);
    expect(r.error).toBe("Sign-in is unavailable right now.");
  }
});

test("being throttled says so instead of blaming the password", async () => {
  const r = await passwordLogin({ email: "a@b.co", password: "pw" },
    { config, fetchImpl: fakeFetch({ status: 429, body: { error_code: "over_request_rate_limit" } }) });
  expect(r.status).toBe(429);
  expect(r.error).toContain("Too many attempts");
});

test("nonsense is refused before it reaches the network", async () => {
  const bad = [
    {},
    { email: "a@b.co" },
    { email: "", password: "pw" },
    { email: "a@b.co", password: "" },
    { email: 42, password: "pw" },
    { email: "a@b.co", password: "x".repeat(1025) },
    { email: `${"x".repeat(320)}@b.co`, password: "pw" },
  ];
  for (const input of bad) {
    const f = fakeFetch({ status: 200, body: SESSION });
    const r = await passwordLogin(input, { config, fetchImpl: f });
    expect(r.ok).toBe(false);
    expect(r.status).toBe(400);
    expect(f.calls.length).toBe(0);   // the point: no call, no cost, no log
  }
});

test("without configuration sign-in refuses instead of pretending", async () => {
  const r = await passwordLogin({ email: "a@b.co", password: "pw" }, { config: null });
  expect(r.ok).toBe(false);
  expect(r.status).toBe(503);
});

/* ── appleLogin ────────────────────────────────────────────────────────── */

test("an Apple identity token is traded for a session", async () => {
  const f = fakeFetch({ status: 200, body: SESSION });
  const r = await appleLogin({ identityToken: "apple.jwt.here", nonce: "n-1" }, { config, fetchImpl: f });
  expect(r.ok).toBe(true);
  expect(r.session.access_token).toBe("at-1");
  expect(f.calls[0].url).toBe("https://projekt.supabase.co/auth/v1/token?grant_type=id_token");
  expect(f.calls[0].body).toEqual({ provider: "apple", id_token: "apple.jwt.here", nonce: "n-1" });
});

/* ⚠ The one that catches the mistake worth catching: Apple gets SHA-256 of the
   nonce, Supabase gets the raw value and hashes it itself. Anything that
   "helpfully" hashes here would hash a hash, and the failure would read as a
   rejected token — Apple's fault, apparently. */
test("the nonce travels raw, and is left out when there is none", async () => {
  const f = fakeFetch({ status: 200, body: SESSION });
  await appleLogin({ identityToken: "t", nonce: "raw-nonce" }, { config, fetchImpl: f });
  expect(f.calls[0].body.nonce).toBe("raw-nonce");

  const g = fakeFetch({ status: 200, body: SESSION });
  await appleLogin({ identityToken: "t" }, { config, fetchImpl: g });
  expect("nonce" in g.calls[0].body).toBe(false);
});

test("an Apple session is shaped like every other one", async () => {
  const f = fakeFetch({ status: 200, body: { ...SESSION, user: { id: UID, email: "abc@privaterelay.appleid.com", identities: [{ provider: "apple" }] } } });
  const { session } = await appleLogin({ identityToken: "t" }, { config, fetchImpl: f });
  expect(session.user).toEqual({ id: UID, email: "abc@privaterelay.appleid.com" });
  expect(Object.keys(session).sort()).toEqual(
    ["access_token", "expires_at", "expires_in", "refresh_token", "token_type", "user"]);
});

/* ⚠⚠ The switch nobody remembers: Apple must be enabled in Supabase. That
   answers 400, which for a password rightly means "wrong credentials" — here
   it would send whoever debugs it to the phone, the token and Apple, and never
   to the switch. Our configuration fault, so: 503, and it names the switch. */
test("a provider that is switched off is our fault, not a wrong credential", async () => {
  /* Wording read off the real Supabase (15.09.2026), not guessed. The issuer
     sits MID-sentence, so a phrase match on "provider is not enabled" would
     miss it — hence the code. */
  const f = fakeFetch({ status: 400, body: { error_code: "provider_disabled", msg: 'Provider (issuer "https://appleid.apple.com") is not enabled' } });
  const r = await appleLogin({ identityToken: "t" }, { config, fetchImpl: f });
  expect(r.ok).toBe(false);
  expect(r.status).toBe(503);
  expect(r.error).toContain("not switched on");
});

/* ⚠⚠ Measured on the real Supabase (15.09.2026): a garbage token answers
   "Unable to detect issuer in ID token for Apple provider". The word
   "provider" appears even where the switch is perfectly fine — matching on it
   would send every rejected token to the wrong place. */
test("a broken token is not mistaken for a switched-off provider", async () => {
  const f = fakeFetch({ status: 400, body: { error_code: "validation_failed", msg: "Unable to detect issuer in ID token for Apple provider" } });
  const r = await appleLogin({ identityToken: "not.a.jwt" }, { config, fetchImpl: f });
  expect(r.status).toBe(401);
  expect(r.error).toBe("Invalid login credentials.");
});

/* The rule lives in authCall, not in one provider: any way in whose switch is
   off in Supabase is a configuration fault, the password one included. */
test("a switched-off sign-in method is 503 for the password way too", async () => {
  const f = fakeFetch({ status: 400, body: { error_code: "email_provider_disabled", msg: "Email logins are disabled" } });
  const r = await passwordLogin({ email: "a@b.co", password: "pw" }, { config, fetchImpl: f });
  expect(r.status).toBe(503);
  expect(r.error).toContain("not switched on");
});

test("a token Apple did not sign is refused as a credential", async () => {
  const f = fakeFetch({ status: 401, body: { error_code: "bad_jwt" } });
  const r = await appleLogin({ identityToken: "forged" }, { config, fetchImpl: f });
  expect(r.status).toBe(401);
  expect(r.error).toBe("Invalid login credentials.");
});

test("a network failure during Apple sign-in is 503, not a verdict", async () => {
  const r = await appleLogin({ identityToken: "t" },
    { config, fetchImpl: fakeFetch(new Error("connect ECONNREFUSED")) });
  expect(r.status).toBe(503);
});

test("nonsense from the app is refused before it reaches the network", async () => {
  const bad = [
    {},
    { identityToken: "" },
    { identityToken: 42 },
    { identityToken: "x".repeat(8193) },
    { identityToken: "t", nonce: 42 },
    { identityToken: "t", nonce: "x".repeat(257) },
  ];
  for (const input of bad) {
    const f = fakeFetch({ status: 200, body: SESSION });
    const r = await appleLogin(input, { config, fetchImpl: f });
    expect(r.ok).toBe(false);
    expect(r.status).toBe(400);
    expect(f.calls.length).toBe(0);
  }
});

test("without configuration Apple sign-in refuses instead of pretending", async () => {
  const r = await appleLogin({ identityToken: "t" }, { config: null });
  expect(r.ok).toBe(false);
  expect(r.status).toBe(503);
});

/* ── refreshSession ────────────────────────────────────────────────────── */

test("a refresh token buys a fresh session", async () => {
  const f = fakeFetch({ status: 200, body: { ...SESSION, access_token: "at-2" } });
  const r = await refreshSession("rt-1", { config, fetchImpl: f });
  expect(r.ok).toBe(true);
  expect(r.session.access_token).toBe("at-2");
  expect(f.calls[0].url).toContain("grant_type=refresh_token");
  expect(f.calls[0].body).toEqual({ refresh_token: "rt-1" });
});

test("a missing refresh token is refused without a call", async () => {
  const f = fakeFetch({ status: 200, body: SESSION });
  for (const bad of [undefined, null, "", "   ", 7]) {
    const r = await refreshSession(bad, { config, fetchImpl: f });
    expect(r.status).toBe(400);
  }
  expect(f.calls.length).toBe(0);
});

/* ── verifyAccessToken — the function the whole boundary rests on ──────── */

test("a valid token names the person it belongs to", async () => {
  const f = fakeFetch({ status: 200, body: { id: UID, email: "test@example.com", app_metadata: {} } });
  expect(await verifyAccessToken("at-1", { config, fetchImpl: f })).toEqual({ userId: UID, email: "test@example.com", appleSub: null });
  expect(f.calls[0].url).toBe("https://projekt.supabase.co/auth/v1/user");
  expect(f.calls[0].init.method).toBe("GET");
  // The token under test must be what authorises the call — not the anon key.
  expect(f.calls[0].init.headers.authorization).toBe("Bearer at-1");
});

/* Deleting an Apple account needs its Apple `sub` (apple-revoke.js). */
test("an Apple-linked account carries its Apple sub, a password account none", async () => {
  const apple = { provider: "apple", identity_data: { sub: "000123.abc.4567" }, provider_id: "000123.abc.4567" };
  const email = { provider: "email", identity_data: { sub: UID } };
  const ask = (identities) => verifyAccessToken("at-1", { config, fetchImpl: fakeFetch({ status: 200, body: { id: UID, email: null, identities } }) });
  expect((await ask([email, apple])).appleSub).toBe("000123.abc.4567");
  expect((await ask([email])).appleSub).toBe(null);
  expect((await ask(undefined)).appleSub).toBe(null);
  // Older GoTrue answers without identity_data still name the sub.
  expect((await ask([{ provider: "apple", provider_id: "000999.x" }])).appleSub).toBe("000999.x");
});

/* ⚠⚠ Every failure is the same failure here. Whatever this returns becomes
   the userId behind auth.uid(); "I could not check" must never come back as
   a person. */
test("every kind of failure returns null, never a person", async () => {
  const cases = [
    fakeFetch({ status: 401, body: { msg: "invalid JWT" } }),        // expired or forged
    fakeFetch({ status: 403, body: {} }),                            // revoked
    fakeFetch({ status: 200, body: { email: "a@b.co" } }),           // answer without an id
    fakeFetch({ status: 500, body: {} }),                            // Supabase having a bad day
    fakeFetch(new Error("network down")),                            // unreachable
  ];
  for (const f of cases) {
    expect(await verifyAccessToken("at-1", { config, fetchImpl: f })).toBe(null);
  }
});

test("an absent token is refused without asking anyone", async () => {
  const f = fakeFetch({ status: 200, body: { id: UID } });
  for (const bad of [undefined, null, "", "  ", 42]) {
    expect(await verifyAccessToken(bad, { config, fetchImpl: f })).toBe(null);
  }
  expect(await verifyAccessToken("at-1", { config: null })).toBe(null);
  expect(f.calls.length).toBe(0);
});

/* ── logout ────────────────────────────────────────────────────────────── */

test("signing out revokes the session at Supabase", async () => {
  const f = fakeFetch({ status: 204, body: null });
  const r = await logout("at-1", { config, fetchImpl: f });
  expect(r.ok).toBe(true);
  expect(r.revoked).toBe(true);
  expect(f.calls[0].url).toContain("/auth/v1/logout?scope=global");
  expect(f.calls[0].init.headers.authorization).toBe("Bearer at-1");
});

/* The tokens are being thrown away either way — a failed revocation is not
   something to hand the person as an error they cannot act on. */
test("signing out never fails the caller", async () => {
  expect(await logout("at-1", { config, fetchImpl: fakeFetch(new Error("down")) })).toEqual({ ok: true, revoked: false });
  expect(await logout("", { config })).toEqual({ ok: true });
  expect(await logout("at-1", { config: null })).toEqual({ ok: true });
});
