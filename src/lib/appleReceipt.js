/* Apple-Käufe prüfen, bevor sie ins Konto gehen (B1, 10.10.2026).
 *
 * Die App schickt nach einem Kauf die Transaktions-ID an
 * POST /api/purchases/verify. Der Server fragt Apple selbst, was es mit
 * dieser Transaktion auf sich hat (App-Store-Server-API, „Get Transaction
 * Info"). Hannis Entscheidung 10.10. (Weg C): Die Antwort kommt über HTTPS
 * direkt von Apple auf eine Anfrage, die nur wir signieren können — wir
 * müssen also keine Zertifikatskette prüfen und brauchen kein npm-Paket.
 * Der Server bleibt paketfrei (deploy/deploy.sh: kein `bun install`).
 * Signiert wird ein kurzes ES256-Token mit unserem In-App-Purchase-
 * Schlüssel, genau wie bei apple-revoke.js — mit node:crypto.
 *
 * Danach entscheidet evaluateTransaction(), was gutgeschrieben wird:
 *   - nur unsere App (Bundle-ID),
 *   - nur ein Produkt aus der Tabelle unten,
 *   - nur für das Konto, das den Kauf gemacht hat: `appAccountToken` setzt
 *     die App beim Kauf auf die Konto-ID (mobile/src/lib/iap.ts). Ohne
 *     Token oder mit fremdem Token gibt es nichts — sonst könnte jemand
 *     die Transaktions-ID eines anderen an sein eigenes Konto hängen,
 *   - nichts Erstattetes (`revocationDate`), kein abgelaufenes Abo.
 * Doppelt gebucht wird nie: Die Ledger-Kennung ist die Transaktions-ID,
 * der Unique-Index credits_ledger_no_double_booking fängt jede Wiederholung.
 *
 * ⚠ Sandbox: TestFlight-Käufe sind IMMER Sandbox. Der Server fragt die
 *   Sandbox nur, solange ALLOW_SANDBOX_PURCHASES=1 gesetzt ist (Hannis
 *   Entscheidung 10.10.: an für den TestFlight-Durchlauf, aus vor dem
 *   Store-Start). Apples Empfehlung: erst Production, bei „nicht gefunden"
 *   die Sandbox.
 *
 * ⚠ Abos: Hier nur der Kauf bzw. eine Verlängerung, die die App meldet —
 *   das Abo-Guthaben wird für den Monat GESETZT (allowanceGrant, Monat 0).
 *   Die monatlichen Raten des Jahresabos, Kündigung und Erstattung kommen
 *   über Apples Server-Benachrichtigungen auf einem eigenen Branch. */
import { createPrivateKey, sign } from "node:crypto";
import { PACKS, SUBSCRIPTIONS, allowanceGrant } from "./plans.js";

/** Dieselben Produkt-IDs wie in mobile/src/lib/iap.ts (PRODUCT_FOR) und in
 *  App Store Connect. Die Mengen kommen aus plans.js — nie aus dem Beleg
 *  und nie von der App. */
export const PLAN_FOR_PRODUCT = {
  "dreamrushes.credits.s": "pack-s",
  "dreamrushes.credits.m": "pack-m",
  "dreamrushes.credits.l": "pack-l",
  "dreamrushes.credits.xl": "pack-xl",
  "dreamrushes.sub.monthly": "monthly",
  "dreamrushes.sub.yearly": "yearly",
};

export const APPLE_API = {
  Production: "https://api.storekit.itunes.apple.com",
  Sandbox: "https://api.storekit-sandbox.itunes.apple.com",
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TRANSACTION_ID = /^\d{1,32}$/;
// Apple erlaubt höchstens 60 Minuten; kurz ist besser, falls eins ins Log rutscht.
const TOKEN_TTL = 5 * 60;

/**
 * Der In-App-Purchase-Schlüssel aus der Umgebung, oder null. Nie aus dem
 * Repository (AGENTS.md): App Store Connect → Benutzer und Zugriff →
 * Integrationen → In-App-Kauf.
 * @returns {{ issuerId: string, keyId: string, privateKey: string, bundleId: string } | null}
 */
export function appleIapConfig(env = process.env) {
  const issuerId = String(env.APPLE_IAP_ISSUER_ID || "").trim();
  const keyId = String(env.APPLE_IAP_KEY_ID || "").trim();
  const privateKey = String(env.APPLE_IAP_KEY || "").replace(/\\n/g, "\n").trim();
  const bundleId = String(env.APPLE_BUNDLE_ID || "com.dreamrushes.app").trim();
  if (!issuerId || !keyId || !privateKey || !bundleId) return null;
  return { issuerId, keyId, privateKey, bundleId };
}

const b64url = (buf) => Buffer.from(buf).toString("base64url");

/** Das Token für die App-Store-Server-API (ES256-JWT). Exportiert für den
 *  Test, der es gegen den öffentlichen Schlüssel prüft. */
export function apiToken(config, now = Math.floor(Date.now() / 1000)) {
  const header = { alg: "ES256", kid: config.keyId, typ: "JWT" };
  const payload = { iss: config.issuerId, iat: now, exp: now + TOKEN_TTL, aud: "appstoreconnect-v1", bid: config.bundleId };
  const input = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`;
  /* ⚠ ieee-p1363: JWS will die rohe 64-Byte-Signatur r||s. Node nimmt sonst
     DER, und Apple antwortet 401 — liest sich wie ein falscher Schlüssel. */
  const sig = sign("sha256", Buffer.from(input), { key: createPrivateKey(config.privateKey), dsaEncoding: "ieee-p1363" });
  return `${input}.${b64url(sig)}`;
}

/** Der Mittelteil einer JWS. Nicht geprüft — und das ist hier richtig: Er
 *  kam über TLS als direkte Antwort auf eine Anfrage, die nur wir signieren
 *  können. Für etwas, das die APP schickt, wäre das falsch. */
export function decodeSignedPayload(jws) {
  try {
    const body = JSON.parse(Buffer.from(String(jws).split(".")[1] || "", "base64url").toString("utf8"));
    return body && typeof body === "object" ? body : null;
  } catch {
    return null;
  }
}

/**
 * Was eine Transaktion diesem Konto bringt — oder warum nichts.
 * @returns {{ ok: true, kind: "pack"|"subscription", amount: number, ref: string, plan: string, environment: string }
 *         | { ok: false, reason: string }}
 */
export function evaluateTransaction(tx, userId, bundleId, now = Date.now()) {
  if (!tx || typeof tx !== "object") return { ok: false, reason: "invalid" };
  if (!bundleId || tx.bundleId !== bundleId) return { ok: false, reason: "wrong_app" };
  const planId = PLAN_FOR_PRODUCT[tx.productId];
  if (!planId) return { ok: false, reason: "unknown_product" };
  const token = typeof tx.appAccountToken === "string" ? tx.appAccountToken.toLowerCase() : "";
  if (!UUID.test(token) || token !== String(userId || "").toLowerCase()) return { ok: false, reason: "wrong_account" };
  if (tx.revocationDate) return { ok: false, reason: "revoked" };
  if (typeof tx.transactionId !== "string" || !TRANSACTION_ID.test(tx.transactionId)) return { ok: false, reason: "invalid" };
  const ref = `apple-${tx.transactionId}`;

  const pack = PACKS.find((p) => p.id === planId);
  if (pack) {
    const qty = Number.isInteger(tx.quantity) && tx.quantity > 0 ? tx.quantity : 1;
    return { ok: true, kind: "pack", amount: pack.credits * qty, ref, plan: planId, environment: tx.environment };
  }
  const sub = SUBSCRIPTIONS.find((p) => p.id === planId);
  if (!sub) return { ok: false, reason: "unknown_product" };
  if (!Number.isFinite(tx.expiresDate) || tx.expiresDate <= now) return { ok: false, reason: "expired" };
  return { ok: true, kind: "subscription", amount: allowanceGrant(sub, 0).amount, ref, plan: planId, environment: tx.environment };
}

/**
 * Der Abfrager. lookup() wirft nie; es gibt { tx } oder { reason, retry }
 * zurück. `retry: true` heißt: nicht der Beleg ist schlecht, sondern wir
 * oder Apple gerade — die App soll es später noch einmal versuchen und die
 * Transaktion bis dahin NICHT abschließen.
 */
export function createReceiptChecker({ config, allowSandbox = false, fetchImpl = fetch, timeoutMs = 10_000 } = {}) {
  const ask = async (environment, transactionId) => {
    const res = await fetchImpl(`${APPLE_API[environment]}/inApps/v1/transactions/${transactionId}`, {
      headers: { authorization: `Bearer ${apiToken(config)}` },
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (res.status === 404) return { notFound: true };
    if (!res.ok) return { status: res.status };
    const body = await res.json().catch(() => null);
    const tx = decodeSignedPayload(body?.signedTransactionInfo);
    /* Die Sandbox-Antwort nennt sich Sandbox, die echte Production. Passt
       das nicht, stimmt etwas Grundsätzliches nicht — dann lieber nichts. */
    return tx && tx.environment === environment ? { tx } : { status: "mismatch" };
  };

  return {
    ready: !!config,
    async lookup(transactionId) {
      if (typeof transactionId !== "string" || !TRANSACTION_ID.test(transactionId)) return { reason: "invalid" };
      if (!config) return { reason: "not_configured", retry: true };
      try {
        const real = await ask("Production", transactionId);
        if (real.tx) return { tx: real.tx };
        if (!real.notFound) return { reason: "apple_unavailable", retry: true, status: real.status };
        if (!allowSandbox) return { reason: "not_found" };
        const test = await ask("Sandbox", transactionId);
        if (test.tx) return { tx: test.tx };
        if (test.notFound) return { reason: "not_found" };
        return { reason: "apple_unavailable", retry: true, status: test.status };
      } catch {
        return { reason: "apple_unavailable", retry: true };   // Netz, Zeitüberschreitung
      }
    },
  };
}
