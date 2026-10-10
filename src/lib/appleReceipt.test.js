import { test, expect } from "bun:test";
import { join } from "node:path";
import { generateKeyPairSync, verify } from "node:crypto";
import { evaluateTransaction, createReceiptChecker, appleIapConfig, apiToken, decodeSignedPayload, PLAN_FOR_PRODUCT, APPLE_API } from "./appleReceipt.js";
import { PACKS, SUBSCRIPTIONS } from "./plans.js";

const ANNA = "0b5e6a3c-1f2d-4e5f-8a9b-0c1d2e3f4a5b";
const BEN = "9f8e7d6c-5b4a-4321-8fed-cba987654321";
const BUNDLE = "com.dreamrushes.app";
const NOW = 1_800_000_000_000;
const TXID = "2000000123456789";
const tx = (over = {}) => ({
  bundleId: BUNDLE, productId: "dreamrushes.credits.m", transactionId: TXID,
  appAccountToken: ANNA, environment: "Sandbox", type: "Consumable", ...over,
});

const { privateKey, publicKey } = generateKeyPairSync("ec", { namedCurve: "P-256" });
const CONFIG = { issuerId: "57246542-96fe-1a63-e053-0824d011072a", keyId: "ABC123DEFG", bundleId: BUNDLE,
                 privateKey: privateKey.export({ type: "pkcs8", format: "pem" }).trim() };

test("every product id maps to a plan that exists, and the app's table matches", async () => {
  const ids = [...PACKS, ...SUBSCRIPTIONS].map((p) => p.id).sort();
  expect(Object.values(PLAN_FOR_PRODUCT).sort()).toEqual(ids);
  // Dieselben IDs wie in der App (mobile/src/lib/iap.ts, PRODUCT_FOR).
  const iap = await Bun.file(join(import.meta.dir, "..", "..", "mobile", "src", "lib", "iap.ts")).text();
  for (const [sku, plan] of Object.entries(PLAN_FOR_PRODUCT)) {
    expect(iap).toMatch(new RegExp(`"?${plan}"?: \\{ sku: "${sku.replaceAll(".", "\\.")}"`));
  }
});

test("a pack credits the amount from plans.js, keyed by the transaction id", () => {
  expect(evaluateTransaction(tx(), ANNA, BUNDLE, NOW)).toEqual({
    ok: true, kind: "pack", amount: 150, ref: `apple-${TXID}`, plan: "pack-m", environment: "Sandbox",
  });
  expect(evaluateTransaction(tx({ quantity: 2 }), ANNA, BUNDLE, NOW).amount).toBe(300);
  // Gross- und Kleinschreibung der UUID spielen keine Rolle.
  expect(evaluateTransaction(tx({ appAccountToken: ANNA.toUpperCase() }), ANNA, BUNDLE, NOW).ok).toBe(true);
});

/* Der wichtigste Fall: ein echter Kauf, aber von jemand anderem. */
test("a transaction never credits an account it was not bought for", () => {
  expect(evaluateTransaction(tx(), BEN, BUNDLE, NOW)).toEqual({ ok: false, reason: "wrong_account" });
  expect(evaluateTransaction(tx({ appAccountToken: undefined }), ANNA, BUNDLE, NOW)).toEqual({ ok: false, reason: "wrong_account" });
  expect(evaluateTransaction(tx({ appAccountToken: "" }), "", BUNDLE, NOW)).toEqual({ ok: false, reason: "wrong_account" });
});

test("other apps, refunded, unknown or malformed transactions give nothing", () => {
  expect(evaluateTransaction(tx({ bundleId: "com.other.app" }), ANNA, BUNDLE, NOW).reason).toBe("wrong_app");
  expect(evaluateTransaction(tx(), ANNA, "", NOW).reason).toBe("wrong_app");
  expect(evaluateTransaction(tx({ revocationDate: NOW - 1 }), ANNA, BUNDLE, NOW).reason).toBe("revoked");
  expect(evaluateTransaction(tx({ productId: "com.other.coins" }), ANNA, BUNDLE, NOW).reason).toBe("unknown_product");
  expect(evaluateTransaction(tx({ transactionId: "../x" }), ANNA, BUNDLE, NOW).reason).toBe("invalid");
  expect(evaluateTransaction(null, ANNA, BUNDLE, NOW).reason).toBe("invalid");
});

test("a subscription sets this month's allowance, and only while it runs", () => {
  const monthly = tx({ productId: "dreamrushes.sub.monthly", type: "Auto-Renewable Subscription", expiresDate: NOW + 1000 });
  expect(evaluateTransaction(monthly, ANNA, BUNDLE, NOW)).toMatchObject({ ok: true, kind: "subscription", amount: 160, plan: "monthly" });
  const yearly = { ...monthly, productId: "dreamrushes.sub.yearly" };
  expect(evaluateTransaction(yearly, ANNA, BUNDLE, NOW)).toMatchObject({ ok: true, amount: 480, plan: "yearly" });
  expect(evaluateTransaction({ ...monthly, expiresDate: NOW - 1 }, ANNA, BUNDLE, NOW).reason).toBe("expired");
  expect(evaluateTransaction({ ...monthly, expiresDate: undefined }, ANNA, BUNDLE, NOW).reason).toBe("expired");
});

test("the config comes from the environment, all three parts or nothing", () => {
  const env = { APPLE_IAP_ISSUER_ID: CONFIG.issuerId, APPLE_IAP_KEY_ID: CONFIG.keyId, APPLE_IAP_KEY: CONFIG.privateKey.replace(/\n/g, "\\n") };
  expect(appleIapConfig(env)).toEqual(CONFIG);
  expect(appleIapConfig({ ...env, APPLE_IAP_KEY: "" })).toBe(null);
  expect(appleIapConfig({ ...env, APPLE_IAP_KEY_ID: " " })).toBe(null);
  expect(appleIapConfig({})).toBe(null);
});

/* Das Token prüfen wir so, wie Apple es liest: Signatur gegen den
   öffentlichen Schlüssel, im JWS-Format (r||s), nicht im Node-Standard. */
test("the API token is an ES256 JWT Apple can verify", () => {
  const token = apiToken(CONFIG, 1000);
  const [h, p, s] = token.split(".");
  expect(JSON.parse(Buffer.from(h, "base64url"))).toEqual({ alg: "ES256", kid: CONFIG.keyId, typ: "JWT" });
  expect(JSON.parse(Buffer.from(p, "base64url"))).toEqual({ iss: CONFIG.issuerId, iat: 1000, exp: 1300, aud: "appstoreconnect-v1", bid: BUNDLE });
  const sig = Buffer.from(s, "base64url");
  expect(sig.length).toBe(64);
  expect(verify("sha256", Buffer.from(`${h}.${p}`), { key: publicKey, dsaEncoding: "ieee-p1363" }, sig)).toBe(true);
  // Gegenprobe: ein verändertes Token fällt durch.
  expect(verify("sha256", Buffer.from(`${h}.${p}x`), { key: publicKey, dsaEncoding: "ieee-p1363" }, sig)).toBe(false);
});

/* Apple, gespielt: Production kennt nur „real", die Sandbox nur „test". */
const jws = (payload) => `h.${Buffer.from(JSON.stringify(payload)).toString("base64url")}.s`;
function fakeApple({ production = {}, sandbox = {}, status = {} } = {}) {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url, auth: init?.headers?.authorization });
    const env = url.startsWith(APPLE_API.Production) ? "Production" : "Sandbox";
    if (status[env]) return new Response("", { status: status[env] });
    const id = url.split("/").pop();
    const known = (env === "Production" ? production : sandbox)[id];
    if (!known) return new Response(JSON.stringify({ errorCode: 4040010 }), { status: 404 });
    return new Response(JSON.stringify({ signedTransactionInfo: jws(known) }), { status: 200 });
  };
  return { fetchImpl, calls };
}

test("a real purchase is found in Production, with our signed token", async () => {
  const apple = fakeApple({ production: { [TXID]: tx({ environment: "Production" }) } });
  const c = createReceiptChecker({ config: CONFIG, fetchImpl: apple.fetchImpl });
  expect((await c.lookup(TXID)).tx.environment).toBe("Production");
  expect(apple.calls).toHaveLength(1);
  expect(apple.calls[0].url).toBe(`${APPLE_API.Production}/inApps/v1/transactions/${TXID}`);
  expect(apple.calls[0].auth).toMatch(/^Bearer [\w-]+\.[\w-]+\.[\w-]+$/);
});

test("sandbox purchases are only looked up when ALLOW_SANDBOX_PURCHASES is on", async () => {
  const apple = fakeApple({ sandbox: { [TXID]: tx() } });
  const off = createReceiptChecker({ config: CONFIG, fetchImpl: apple.fetchImpl });
  expect(await off.lookup(TXID)).toEqual({ reason: "not_found" });
  expect(apple.calls.map((x) => x.url.startsWith(APPLE_API.Sandbox))).toEqual([false]);   // Sandbox nie gefragt

  const on = createReceiptChecker({ config: CONFIG, allowSandbox: true, fetchImpl: apple.fetchImpl });
  expect((await on.lookup(TXID)).tx.environment).toBe("Sandbox");
  expect(await on.lookup("999")).toEqual({ reason: "not_found" });
});

test("trouble on our side or Apple's says retry — never 'invalid'", async () => {
  for (const s of [401, 429, 500, 503]) {
    const c = createReceiptChecker({ config: CONFIG, allowSandbox: true, fetchImpl: fakeApple({ status: { Production: s } }).fetchImpl });
    expect(await c.lookup(TXID)).toEqual({ reason: "apple_unavailable", retry: true, status: s });
  }
  const offline = createReceiptChecker({ config: CONFIG, fetchImpl: async () => { throw new Error("ECONNRESET"); } });
  expect(await offline.lookup(TXID)).toEqual({ reason: "apple_unavailable", retry: true });
  expect(await createReceiptChecker({ config: null }).lookup(TXID)).toEqual({ reason: "not_configured", retry: true });
  const badKey = createReceiptChecker({ config: { ...CONFIG, privateKey: "kein schlüssel" }, fetchImpl: fakeApple().fetchImpl });
  expect(await badKey.lookup(TXID)).toEqual({ reason: "apple_unavailable", retry: true });
});

test("an answer that names the wrong environment is not trusted", async () => {
  const apple = fakeApple({ production: { [TXID]: tx({ environment: "Sandbox" }) } });
  const c = createReceiptChecker({ config: CONFIG, fetchImpl: apple.fetchImpl });
  expect(await c.lookup(TXID)).toEqual({ reason: "apple_unavailable", retry: true, status: "mismatch" });
});

test("only digit transaction ids reach Apple at all", async () => {
  const apple = fakeApple();
  const c = createReceiptChecker({ config: CONFIG, allowSandbox: true, fetchImpl: apple.fetchImpl });
  for (const id of ["../../v2/x", "", "12a", 42, null, "1".repeat(33)]) expect(await c.lookup(id)).toEqual({ reason: "invalid" });
  expect(apple.calls).toHaveLength(0);
});

test("decodeSignedPayload reads the middle part, and nothing else", () => {
  expect(decodeSignedPayload(jws({ a: 1 }))).toEqual({ a: 1 });
  for (const bad of [undefined, "", "x", "a.b.c", "a.bnVsbA.c"]) expect(decodeSignedPayload(bad)).toBe(null);
});
