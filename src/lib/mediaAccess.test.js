import { test, expect } from "bun:test";
import { mkdtemp, rm, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { issueMediaKey, verifyMediaSignature, mediaKeyFor, createOwnership, MEDIA_KEY_TTL_SEC } from "./mediaAccess.js";
import { signMediaPath } from "./mediaSign.js";

const SECRET = "test-secret-not-for-production";
const ANNA = "0b5e6a3c-1f2d-4e5f-8a9b-0c1d2e3f4a5b";
const BEN = "9f8e7d6c-5b4a-4321-8fed-cba987654321";
const NOW = 1_800_000_000;

// Was die App schickt: die Adresse, die signMediaPath baut, auseinandergenommen.
const paramsOf = (signed) => new URL(signed, "http://x").searchParams;

test("a URL the app signed with the issued key passes, for that file only", () => {
  const key = issueMediaKey(SECRET, ANNA, NOW);
  expect(key.exp).toBe(NOW + MEDIA_KEY_TTL_SEC);
  const p = paramsOf(signMediaPath("/media/film1.mp4", key, NOW));
  expect(verifyMediaSignature(SECRET, "film1.mp4", p, NOW)).toBe(ANNA);
  // Dieselbe Signatur an einer anderen Datei: nichts.
  expect(verifyMediaSignature(SECRET, "film2.mp4", p, NOW)).toBe(null);
});

test("expired, tampered or foreign signatures are refused", () => {
  const key = issueMediaKey(SECRET, ANNA, NOW);
  const p = paramsOf(signMediaPath("/media/film1.mp4", key, NOW));
  expect(verifyMediaSignature(SECRET, "film1.mp4", p, key.exp)).toBe(null);           // abgelaufen
  expect(verifyMediaSignature("other-secret", "film1.mp4", p, NOW)).toBe(null);        // anderer Server

  const swap = new URLSearchParams(p); swap.set("u", BEN);                             // fremdes Konto eingesetzt
  expect(verifyMediaSignature(SECRET, "film1.mp4", swap, NOW)).toBe(null);
  const later = new URLSearchParams(p); later.set("e", String(key.exp + 60));          // Ablauf verlängert
  expect(verifyMediaSignature(SECRET, "film1.mp4", later, NOW)).toBe(null);
  const flip = new URLSearchParams(p);
  const s = flip.get("s"); flip.set("s", (s[0] === "A" ? "B" : "A") + s.slice(1));
  expect(verifyMediaSignature(SECRET, "film1.mp4", flip, NOW)).toBe(null);
  expect(verifyMediaSignature(SECRET, "film1.mp4", new URLSearchParams(), NOW)).toBe(null);
});

test("a key made up for the far future is refused even with a valid MAC", () => {
  // Nur wer MEDIA_SECRET hat, kann so einen Schlüssel bauen — trotzdem
  // nimmt der Server nichts an, was er selbst nie ausstellen würde.
  const exp = NOW + 86_400;
  const key = { uid: ANNA, exp, key: mediaKeyFor(SECRET, ANNA, exp) };
  const p = paramsOf(signMediaPath("/media/film1.mp4", key, NOW));
  expect(verifyMediaSignature(SECRET, "film1.mp4", p, NOW)).toBe(null);
});

test("no secret, no key and no access", () => {
  expect(issueMediaKey("", ANNA, NOW)).toBe(null);
  expect(issueMediaKey(undefined, ANNA, NOW)).toBe(null);
  expect(issueMediaKey(SECRET, "not-a-uuid", NOW)).toBe(null);
});

test("ownership markers: per file and per account, nothing outside the root", async () => {
  const root = await mkdtemp(join(tmpdir(), "dr-besitz-"));
  try {
    const own = createOwnership(root);
    expect(await own.owns(ANNA, "film1.mp4")).toBe(false);
    expect(await own.claim(ANNA, "film1.mp4")).toBe(true);
    expect(await own.owns(ANNA, "film1.mp4")).toBe(true);
    expect(await own.owns(BEN, "film1.mp4")).toBe(false);

    // Dieselbe Datei (gleicher Inhalt) kann zwei Konten gehören.
    await own.claim(BEN, "film1.mp4");
    expect(await own.owns(BEN, "film1.mp4")).toBe(true);
    expect(await own.filesOf(ANNA)).toEqual(["film1.mp4"]);

    // Nichts, was kein Name dieses Servers ist, wird je ein Pfad.
    expect(await own.claim(ANNA, "../../etc/passwd")).toBe(false);
    expect(await own.claim("../x", "film1.mp4")).toBe(false);
    expect(await own.owns(ANNA, "../konto")).toBe(false);
    expect((await readdir(root)).sort()).toEqual(["datei", "konto"]);

    expect(await own.ownsJob(ANNA, "mgabc123xyz")).toBe(false);
    await own.claimJob(ANNA, "mgabc123xyz");
    expect(await own.ownsJob(ANNA, "mgabc123xyz")).toBe(true);
    expect(await own.ownsJob(BEN, "mgabc123xyz")).toBe(false);
    expect(await own.claimJob(ANNA, "../../x")).toBe(false);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
