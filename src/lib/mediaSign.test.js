import { test, expect } from "bun:test";
import { createHash, createHmac, randomBytes } from "node:crypto";
import { sha256, hmacSha256, base64url, hexToBytes, mediaSignature, signMediaPath } from "./mediaSign.js";

const hex = (b) => Buffer.from(b).toString("hex");
const bytes = (s) => new TextEncoder().encode(s);

test("SHA-256 matches the FIPS 180-2 examples", () => {
  expect(hex(sha256(bytes("")))).toBe("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
  expect(hex(sha256(bytes("abc")))).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  expect(hex(sha256(bytes("abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq"))))
    .toBe("248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1");
});

/* RFC 4231 — Fall 1, 2 und 6 (Schlüssel länger als ein Block). */
test("HMAC-SHA256 matches the RFC 4231 test vectors", () => {
  expect(hex(hmacSha256(new Uint8Array(20).fill(0x0b), bytes("Hi There"))))
    .toBe("b0344c61d8db38535ca8afceaf0bf12b881dc200c9833da726e9376c2e32cff7");
  expect(hex(hmacSha256(bytes("Jefe"), bytes("what do ya want for nothing?"))))
    .toBe("5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843");
  expect(hex(hmacSha256(new Uint8Array(131).fill(0xaa), bytes("Test Using Larger Than Block-Size Key - Hash Key First"))))
    .toBe("60e431591ee0b67f0d8a26aacbf5b77f8e0bc6213728c5140546040f0ee37f54");
});

/* Jede Länge um die Blockgrenzen herum (55/56/64 Byte sind die Stellen, an
   denen eine Auffüllung danebengeht) — gegen node:crypto, den der Server nimmt. */
test("pure-JS hashing agrees with node:crypto at every padding boundary", () => {
  for (let n = 0; n <= 200; n++) {
    const msg = randomBytes(n);
    const key = randomBytes(n % 97);
    expect(hex(sha256(msg))).toBe(createHash("sha256").update(msg).digest("hex"));
    expect(hex(hmacSha256(key, msg))).toBe(createHmac("sha256", key).update(msg).digest("hex"));
  }
});

test("base64url is node's base64url, without padding", () => {
  for (let n = 0; n <= 40; n++) {
    const b = randomBytes(n);
    expect(base64url(b)).toBe(b.toString("base64url"));
  }
});

test("hexToBytes refuses anything that is not lowercase hex pairs", () => {
  expect(hexToBytes("0aff")).toEqual(new Uint8Array([10, 255]));
  expect(hexToBytes("abc")).toBe(null);
  expect(hexToBytes("zz")).toBe(null);
  expect(hexToBytes(null)).toBe(null);
});

const KEY = { uid: "0b5e6a3c-1f2d-4e5f-8a9b-0c1d2e3f4a5b", exp: 2_000_000_000, key: "11".repeat(32) };

test("a media path gets u, e and the per-file signature", () => {
  const s = signMediaPath("/media/abc123.mp4", KEY);
  expect(s).toBe(`/media/abc123.mp4?u=${KEY.uid}&e=${KEY.exp}&s=${mediaSignature(KEY.key, "abc123.mp4")}`);
  // Zwei Dateien, zwei Signaturen — eine Adresse öffnet genau eine Datei.
  expect(mediaSignature(KEY.key, "a.png")).not.toBe(mediaSignature(KEY.key, "b.png"));
});

test("without a usable key, or for anything else, the path stays as it was", () => {
  expect(signMediaPath("/media/abc.mp4", null)).toBe("/media/abc.mp4");
  expect(signMediaPath("/media/abc.mp4", { ...KEY, exp: "2000000000" })).toBe("/media/abc.mp4"); // kaputter Schlüssel
  expect(signMediaPath("/clips/style-a.mp4", KEY)).toBe("/clips/style-a.mp4");
  expect(signMediaPath("https://fal.media/x.png", KEY)).toBe("https://fal.media/x.png");
  expect(signMediaPath("/media/../etc/passwd", KEY)).toBe("/media/../etc/passwd");
  expect(signMediaPath("/media/abc.mp4?u=x", KEY)).toBe("/media/abc.mp4?u=x");      // nie doppelt
});

/* Die Uhr des Geräts entscheidet nichts: Ein Schlüssel, der nach der
   Geräteuhr schon „abgelaufen" ist, wird trotzdem benutzt — ob er gilt,
   sagt allein der Server. Sonst legte ein iPhone mit vorgehender Uhr jede
   Datei lahm. */
test("signing ignores the device clock", () => {
  const past = { ...KEY, exp: 1 };
  expect(signMediaPath("/media/abc.mp4", past)).toBe(`/media/abc.mp4?u=${KEY.uid}&e=1&s=${mediaSignature(KEY.key, "abc.mp4")}`);
});
