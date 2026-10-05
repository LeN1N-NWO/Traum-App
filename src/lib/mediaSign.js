/* Signierte Medienadressen — die Seite der App (S2, 05.10.2026).
 *
 * Der Server gibt dem angemeldeten Gerät einen Medienschlüssel (GET
 * /api/media-key: Konto, Ablauf, Schlüssel). Daraus rechnet die App für
 * JEDE Datei ihre eigene Signatur, synchron und ohne Anfrage — denn
 * mediaUrl() und localMedia() müssen eine Adresse sofort liefern, und die
 * Webviews können beim Laden eines <img> keinen Header mitschicken.
 *
 *   /media/<name>?u=<konto>&e=<ablauf>&s=<HMAC-SHA256(schlüssel, name)>
 *
 * Der Server rechnet dieselbe Kette nach (src/lib/mediaAccess.js) und
 * prüft zusätzlich, dass die Datei diesem Konto gehört. Eine verlorene
 * Adresse öffnet also genau eine Datei, bis zum Ablauf.
 *
 * Warum SHA-256 in reinem JavaScript: Web Crypto ist asynchron (und in
 * Hermes nicht verlässlich da), mediaUrl() aber synchron. Die Rechnung ist
 * gegen die RFC-4231-Testwerte und gegen node:crypto festgenagelt
 * (mediaSign.test.js). SHA-256 statt SHA-512: gleiche Sicherheit für
 * diesen Zweck, halb so lange Adressen, keine 64-Bit-Rechnung von Hand
 * (Entscheidung Hanni 05.10.). */

const K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);

/** SHA-256 of a byte array. */
export function sha256(bytes) {
  const len = bytes.length;
  const padded = new Uint8Array(((len + 9 + 63) >> 6) << 6);
  padded.set(bytes);
  padded[len] = 0x80;
  const bits = len * 8;
  const view = new DataView(padded.buffer);
  view.setUint32(padded.length - 8, Math.floor(bits / 0x100000000));
  view.setUint32(padded.length - 4, bits >>> 0);

  const h = new Uint32Array([
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ]);
  const w = new Uint32Array(64);
  for (let off = 0; off < padded.length; off += 64) {
    for (let i = 0; i < 16; i++) w[i] = view.getUint32(off + i * 4);
    for (let i = 16; i < 64; i++) {
      const a = w[i - 15], b = w[i - 2];
      const s0 = ((a >>> 7) | (a << 25)) ^ ((a >>> 18) | (a << 14)) ^ (a >>> 3);
      const s1 = ((b >>> 17) | (b << 15)) ^ ((b >>> 19) | (b << 13)) ^ (b >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }
    let [a, b, c, d, e, f, g, hh] = h;
    for (let i = 0; i < 64; i++) {
      const S1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
      const ch = (e & f) ^ (~e & g);
      const t1 = (hh + S1 + ch + K[i] + w[i]) >>> 0;
      const S0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (S0 + maj) >>> 0;
      hh = g; g = f; f = e; e = (d + t1) >>> 0;
      d = c; c = b; b = a; a = (t1 + t2) >>> 0;
    }
    h[0] = (h[0] + a) >>> 0; h[1] = (h[1] + b) >>> 0; h[2] = (h[2] + c) >>> 0; h[3] = (h[3] + d) >>> 0;
    h[4] = (h[4] + e) >>> 0; h[5] = (h[5] + f) >>> 0; h[6] = (h[6] + g) >>> 0; h[7] = (h[7] + hh) >>> 0;
  }
  const out = new Uint8Array(32);
  const ov = new DataView(out.buffer);
  for (let i = 0; i < 8; i++) ov.setUint32(i * 4, h[i]);
  return out;
}

/** HMAC-SHA256 (RFC 2104) over byte arrays. */
export function hmacSha256(key, message) {
  let k = key.length > 64 ? sha256(key) : key;
  const block = new Uint8Array(64);
  block.set(k);
  const inner = new Uint8Array(64 + message.length);
  const outer = new Uint8Array(64 + 32);
  for (let i = 0; i < 64; i++) {
    inner[i] = block[i] ^ 0x36;
    outer[i] = block[i] ^ 0x5c;
  }
  inner.set(message, 64);
  outer.set(sha256(inner), 64);
  return sha256(outer);
}

// Names and ids are ASCII by construction; TextEncoder keeps it honest anyway.
const utf8 = (s) => new TextEncoder().encode(s);

export function hexToBytes(hex) {
  if (typeof hex !== "string" || !/^(?:[0-9a-f]{2})+$/.test(hex)) return null;
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
/** base64url without padding — the form that sits in a query string as is. */
export function base64url(bytes) {
  let s = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const n = (bytes[i] << 16) | ((bytes[i + 1] ?? 0) << 8) | (bytes[i + 2] ?? 0);
    s += B64[(n >> 18) & 63] + B64[(n >> 12) & 63];
    if (i + 1 < bytes.length) s += B64[(n >> 6) & 63];
    if (i + 2 < bytes.length) s += B64[n & 63];
  }
  return s;
}

/** The signature of one file name under one media key (hex, from the server). */
export function mediaSignature(keyHex, name) {
  const key = hexToBytes(keyHex);
  if (!key) return null;
  return base64url(hmacSha256(key, utf8(name)));
}

const MEDIA_PATH = /^\/media\/([a-z0-9]{1,20}\.(?:png|jpg|webp|mp4|m4a))$/;

/** "/media/<name>" → "/media/<name>?u=…&e=…&s=…" under the given key.
 *  Anything else — no key, not a media path — comes back unchanged:
 *  locally the server serves without a signature (no REQUIRE_AUTH), and an
 *  unsigned URL fails closed on the VPS.
 *
 *  ⚠ Bewusst KEINE Ablaufprüfung hier: Ob ein Schlüssel abgelaufen ist,
 *  entscheidet allein die Uhr des Servers. Ginge die Uhr des iPhones mehr
 *  als 20 Minuten vor, hielte eine Prüfung hier jeden frischen Schlüssel für
 *  abgelaufen, und keine einzige Datei käme mehr an. Ein wirklich
 *  abgelaufener Schlüssel scheitert am Server genauso wie gar keiner. */
export function signMediaPath(path, mediaKey) {
  if (!mediaKey || typeof path !== "string") return path;
  const hit = MEDIA_PATH.exec(path);
  if (!hit || !Number.isSafeInteger(mediaKey.exp) || typeof mediaKey.uid !== "string") return path;
  const s = mediaSignature(mediaKey.key, hit[1]);
  if (!s) return path;
  return `${path}?u=${encodeURIComponent(mediaKey.uid)}&e=${mediaKey.exp}&s=${s}`;
}
