import { test, expect, beforeEach } from "bun:test";
import { guard, checkLimit, classOf, tokenMatches, resetLimits, LIMITS } from "./gatekeeper.js";

beforeEach(resetLimits);

test("the expensive endpoint is the one that gets the tightest limit", () => {
  expect(classOf("/api/generate")).toBe("generate");
  expect(LIMITS.generate.max).toBeLessThan(LIMITS.text.max);
  expect(LIMITS.text.max).toBeLessThan(LIMITS.cheap.max);
});

test("paths outside the API are not rate limited at all", () => {
  // Sonst würde das Ausliefern der Oberfläche mitgezählt und ein normaler
  // Seitenaufruf mit zwanzig Dateien käme sofort an die Grenze.
  expect(classOf("/index.html")).toBe(null);
  expect(classOf("/media/abc.png")).toBe(null);
  expect(classOf("/api/job")).toBe(null);       // Abholen ist Warten, kein Ausgeben
});

test("a burst up to the limit passes, the next one is refused", () => {
  const { max } = LIMITS.generate;
  for (let i = 0; i < max; i++) {
    expect(checkLimit("1.2.3.4", "generate").ok).toBe(true);
  }
  const over = checkLimit("1.2.3.4", "generate");
  expect(over.ok).toBe(false);
  expect(over.status).toBe(429);
  expect(over.retryAfter).toBeGreaterThan(0);
});

test("senders are counted separately — one loop must not lock everyone out", () => {
  for (let i = 0; i < LIMITS.generate.max; i++) checkLimit("1.2.3.4", "generate");
  expect(checkLimit("1.2.3.4", "generate").ok).toBe(false);
  expect(checkLimit("5.6.7.8", "generate").ok).toBe(true);
});

test("the window reopens once it has passed", () => {
  const t0 = 1_000_000;
  for (let i = 0; i < LIMITS.generate.max; i++) checkLimit("1.2.3.4", "generate", t0);
  expect(checkLimit("1.2.3.4", "generate", t0).ok).toBe(false);
  expect(checkLimit("1.2.3.4", "generate", t0 + LIMITS.generate.windowMs + 1).ok).toBe(true);
});

test("classes do not share a budget", () => {
  for (let i = 0; i < LIMITS.generate.max; i++) checkLimit("1.2.3.4", "generate");
  expect(checkLimit("1.2.3.4", "generate").ok).toBe(false);
  expect(checkLimit("1.2.3.4", "text").ok).toBe(true);
});

/* Das Verhalten OHNE gesetztes Geheimnis ist die wichtigste Einzelheit hier:
   Wäre der Token Pflicht, wäre jede Entwicklungsumgebung mit dem Einbau
   dieser Datei kaputtgegangen — und eine Sicherung, die alle als Erstes
   abschalten, sichert nichts. */
test("without a configured secret everything stays open", () => {
  expect(tokenMatches("", "irgendwas")).toBe(true);
  expect(tokenMatches(undefined, null)).toBe(true);
  expect(guard("/api/generate", "1.2.3.4", null, undefined).ok).toBe(true);
});

test("with a secret set, a wrong or missing token is refused", () => {
  expect(guard("/api/generate", "1.2.3.4", "falsch", "geheim").status).toBe(401);
  expect(guard("/api/generate", "1.2.3.4", null, "geheim").status).toBe(401);
  expect(guard("/api/generate", "1.2.3.4", "geheim", "geheim").ok).toBe(true);
});

test("a wrong token of the right length is still refused", () => {
  // Deckt den Vergleich in konstanter Zeit ab: gleiche Länge, andere Zeichen.
  expect(tokenMatches("abcdef", "abcdeg")).toBe(false);
  expect(tokenMatches("abcdef", "abcde")).toBe(false);
  expect(tokenMatches("abcdef", "abcdef")).toBe(true);
});

test("a refused token costs no rate-limit budget", () => {
  // Sonst könnte jemand ohne gültigen Token die Grenze für den echten
  // Nutzer leerlaufen lassen — eine Dienstblockade durch bloßes Klopfen.
  for (let i = 0; i < 100; i++) guard("/api/generate", "1.2.3.4", "falsch", "geheim");
  expect(guard("/api/generate", "1.2.3.4", "geheim", "geheim").ok).toBe(true);
});
