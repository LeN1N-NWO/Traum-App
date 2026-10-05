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

/* B8: Konto löschen löscht seine Medien — aber nur, was niemand sonst
   besitzt, und nichts außerhalb seiner eigenen Vermerke. */
test("forgetAccount removes the account's files and jobs, keeps shared and foreign ones", async () => {
  const base = await mkdtemp(join(tmpdir(), "dr-b8-"));
  const root = join(base, "besitz"), mediaDir = base, jobsDir = join(base, "jobs");
  const { mkdir, writeFile, access } = await import("node:fs/promises");
  const exists = (p) => access(p).then(() => true, () => false);
  try {
    await mkdir(jobsDir, { recursive: true });
    for (const f of ["allein.png", "geteilt.mp4", "fremd.png"]) await writeFile(join(mediaDir, f), f);
    for (const j of ["mgannajob1", "mgbenjob22"]) await writeFile(join(jobsDir, `${j}.json`), "{\"prompt\":\"Traumtext\"}");
    const own = createOwnership(root);
    await own.claim(ANNA, "allein.png");
    await own.claim(ANNA, "geteilt.mp4");
    await own.claim(BEN, "geteilt.mp4");
    await own.claim(BEN, "fremd.png");
    await own.claimJob(ANNA, "mgannajob1");
    await own.claimJob(BEN, "mgbenjob22");
    expect(await own.jobsOf(ANNA)).toEqual(["mgannajob1"]);

    const report = await own.forgetAccount(ANNA, { mediaDir, jobsDir });
    expect(report).toEqual({ files: 1, shared: 1, jobs: 1, errors: 0 });

    // Annas eigene Datei und ihr Auftrag (mit Traumtext) sind weg …
    expect(await exists(join(mediaDir, "allein.png"))).toBe(false);
    expect(await exists(join(jobsDir, "mgannajob1.json"))).toBe(false);
    // … sie besitzt nichts mehr, auch nicht die geteilte Datei …
    expect(await own.owns(ANNA, "geteilt.mp4")).toBe(false);
    expect(await own.ownsJob(ANNA, "mgannajob1")).toBe(false);
    expect(await own.filesOf(ANNA)).toEqual([]);
    expect(await own.jobsOf(ANNA)).toEqual([]);
    // … und Bens Dateien und Auftrag bleiben, auch die mit Anna geteilte.
    expect(await exists(join(mediaDir, "geteilt.mp4"))).toBe(true);
    expect(await own.owns(BEN, "geteilt.mp4")).toBe(true);
    expect(await exists(join(mediaDir, "fremd.png"))).toBe(true);
    expect(await exists(join(jobsDir, "mgbenjob22.json"))).toBe(true);
    expect(await own.ownsJob(BEN, "mgbenjob22")).toBe(true);

    // Zweimal löschen schadet nicht; ungültige Konten tun gar nichts.
    expect(await own.forgetAccount(ANNA, { mediaDir, jobsDir })).toEqual({ files: 0, shared: 0, jobs: 0, errors: 0 });
    expect(await own.forgetAccount("../x", { mediaDir, jobsDir })).toBe(null);
    expect(await own.forgetAccount(BEN, { mediaDir })).toBe(null);   // ohne jobsDir: nichts anfassen
  } finally {
    await rm(base, { recursive: true, force: true });
  }
});

test("forgetAccount only deletes names it recognises, never paths", async () => {
  const base = await mkdtemp(join(tmpdir(), "dr-b8b-"));
  const { mkdir, writeFile, access } = await import("node:fs/promises");
  const exists = (p) => access(p).then(() => true, () => false);
  try {
    const root = join(base, "besitz");
    // Ein fremder Eintrag in der Rückwärts-Liste (von Hand, nicht über claim):
    // Er sieht nicht wie ein Medienname aus und darf nichts löschen.
    await mkdir(join(root, "konto", ANNA), { recursive: true });
    await writeFile(join(root, "konto", ANNA, "server.js"), "");
    await writeFile(join(base, "server.js"), "wichtig");
    const report = await createOwnership(root).forgetAccount(ANNA, { mediaDir: base, jobsDir: join(base, "jobs") });
    expect(report).toEqual({ files: 0, shared: 0, jobs: 0, errors: 0 });
    expect(await exists(join(base, "server.js"))).toBe(true);
  } finally {
    await rm(base, { recursive: true, force: true });
  }
});
