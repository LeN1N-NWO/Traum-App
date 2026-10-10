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
    expect(await own.ownersOfJob("mgabc123xyz")).toEqual([ANNA]);
    expect(await own.ownersOfJob("mgunbekannt")).toEqual([]);
    expect(await own.ownersOfJob("../x")).toEqual([]);
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
    expect(report).toEqual({ files: 1, shared: 1, jobs: 1, errors: 0, jobIds: ["mgannajob1"] });

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
    expect(await own.forgetAccount(ANNA, { mediaDir, jobsDir })).toEqual({ files: 0, shared: 0, jobs: 0, errors: 0, jobIds: [] });
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
    expect(report).toEqual({ files: 0, shared: 0, jobs: 0, errors: 0, jobIds: [] });
    expect(await exists(join(base, "server.js"))).toBe(true);
  } finally {
    await rm(base, { recursive: true, force: true });
  }
});

/* B8, Poster-Phase: Der Film liegt schon auf dem Server, ist aber noch
   niemandem vermerkt (/api/job sagte „pending"), und finishPoster schreibt
   die Auftragsdatei nach dem Löschen neu — mit einem Poster, das ein
   Gesicht zeigen kann. Erster Durchgang: Film weg. Zweiter: Poster weg. */
test("forgetAccount and sweepJobs catch the film and poster of a job still in its poster phase", async () => {
  const base = await mkdtemp(join(tmpdir(), "dr-b8c-"));
  const root = join(base, "besitz"), mediaDir = base, jobsDir = join(base, "jobs");
  const { mkdir, writeFile, access } = await import("node:fs/promises");
  const exists = (p) => access(p).then(() => true, () => false);
  try {
    await mkdir(jobsDir, { recursive: true });
    const own = createOwnership(root);
    await own.claimJob(ANNA, "mgposting01");
    // Film abgeholt, noch nicht vermerkt; Bens geteilte Datei steht zufällig mit drin.
    await writeFile(join(mediaDir, "filmohne.mp4"), "film");
    await writeFile(join(mediaDir, "bens.png"), "ben");
    await own.claim(BEN, "bens.png");
    await writeFile(join(jobsDir, "mgposting01.json"), JSON.stringify({
      status: "posting", prompt: "Traumtext", urls: ["/media/filmohne.mp4", "/media/bens.png", "https://fal.media/x.mp4", "/media/../server.js"],
    }));
    await writeFile(join(base, "server.js"), "wichtig");

    const first = await own.forgetAccount(ANNA, { mediaDir, jobsDir });
    expect(first).toEqual({ files: 1, shared: 0, jobs: 1, errors: 0, jobIds: ["mgposting01"] });
    expect(await exists(join(mediaDir, "filmohne.mp4"))).toBe(false);   // herrenloser Film weg
    expect(await exists(join(jobsDir, "mgposting01.json"))).toBe(false);
    expect(await exists(join(mediaDir, "bens.png"))).toBe(true);        // Bens bleibt
    expect(await exists(join(base, "server.js"))).toBe(true);           // kein Pfad außerhalb

    // finishPoster schreibt danach (ohne Prompt) neu und legt das Poster ab.
    await writeFile(join(mediaDir, "posterx.png"), "gesicht");
    await writeFile(join(jobsDir, "mgposting01.json"), JSON.stringify({ status: "done", posterUrl: "/media/posterx.png" }));
    expect(await own.sweepJobs(first.jobIds, { mediaDir, jobsDir })).toBe(1);
    expect(await exists(join(mediaDir, "posterx.png"))).toBe(false);
    expect(await exists(join(jobsDir, "mgposting01.json"))).toBe(false);

    // Ein Auftrag, der jemandem gehört, wird vom Nachkehren nie angefasst.
    await own.claimJob(BEN, "mgbenjob33");
    await writeFile(join(jobsDir, "mgbenjob33.json"), JSON.stringify({ urls: ["/media/bens.png"] }));
    expect(await own.sweepJobs(["mgbenjob33", "../x"], { mediaDir, jobsDir })).toBe(0);
    expect(await exists(join(jobsDir, "mgbenjob33.json"))).toBe(true);
  } finally {
    await rm(base, { recursive: true, force: true });
  }
});

/* S7: Die Abbuchung eines Auftrags wird gemerkt, damit ein später
   gescheiterter Film erstattet werden kann — und B8 nimmt den Vermerk mit. */
test("a job's charge ref is noted, read back, and dropped with the job", async () => {
  const base = await mkdtemp(join(tmpdir(), "dr-s7-"));
  const { mkdir, writeFile, access } = await import("node:fs/promises");
  const exists = (p) => access(p).then(() => true, () => false);
  try {
    const root = join(base, "besitz"), jobsDir = join(base, "jobs");
    await mkdir(jobsDir, { recursive: true });
    const own = createOwnership(root);
    const ref = "film-0b5e6a3c-1f2d-4e5f-8a9b-0c1d2e3f4a5b";
    expect(await own.chargeOf("mgjobs7a")).toBe(null);
    expect(await own.noteCharge("mgjobs7a", ref)).toBe(true);
    expect(await own.chargeOf("mgjobs7a")).toBe(ref);
    // Nur Kennungen der richtigen Form, nie ein Pfad.
    expect(await own.noteCharge("../x", ref)).toBe(false);
    expect(await own.noteCharge("mgjobs7b", "drop table; --")).toBe(false);
    await own.forgetCharge("mgjobs7a");
    expect(await own.chargeOf("mgjobs7a")).toBe(null);

    // Konto löschen nimmt den Vermerk des Auftrags mit.
    await own.claimJob(ANNA, "mgjobs7c");
    await own.noteCharge("mgjobs7c", ref);
    await writeFile(join(jobsDir, "mgjobs7c.json"), "{}");
    await own.forgetAccount(ANNA, { mediaDir: base, jobsDir });
    expect(await exists(join(root, "abbuchung", "mgjobs7c"))).toBe(false);
  } finally {
    await rm(base, { recursive: true, force: true });
  }
});

/* Verworfene Aufnahmen (Übergabe 10.10.2026): der Besitzer löscht seine
   eigene Aufnahme — eine geteilte Datei bleibt für den anderen stehen. */
test("dropRecording deletes the owner's own recording, keeps shared, foreign and non-audio files", async () => {
  const base = await mkdtemp(join(tmpdir(), "dr-rec-"));
  const root = join(base, "besitz"), mediaDir = base;
  const { writeFile, access } = await import("node:fs/promises");
  const exists = (p) => access(p).then(() => true, () => false);
  try {
    for (const f of ["allein.m4a", "geteilt.m4a", "fremd.m4a", "bild.png"]) await writeFile(join(mediaDir, f), f);
    const own = createOwnership(root);
    await own.claim(ANNA, "allein.m4a");
    await own.claim(ANNA, "geteilt.m4a");
    await own.claim(BEN, "geteilt.m4a");
    await own.claim(BEN, "fremd.m4a");
    await own.claim(ANNA, "bild.png");

    // Annas eigene Aufnahme: Datei und beide Vermerke weg.
    expect(await own.dropRecording(ANNA, "allein.m4a", { mediaDir })).toBe("deleted");
    expect(await exists(join(mediaDir, "allein.m4a"))).toBe(false);
    expect(await own.owns(ANNA, "allein.m4a")).toBe(false);
    expect(await own.filesOf(ANNA)).not.toContain("allein.m4a");

    // Geteilt: nur Annas Vermerk geht, Ben behält Datei und Zugriff.
    expect(await own.dropRecording(ANNA, "geteilt.m4a", { mediaDir })).toBe("shared");
    expect(await own.owns(ANNA, "geteilt.m4a")).toBe(false);
    expect(await own.owns(BEN, "geteilt.m4a")).toBe(true);
    expect(await exists(join(mediaDir, "geteilt.m4a"))).toBe(true);

    // Bens Aufnahme kann Anna nicht löschen.
    expect(await own.dropRecording(ANNA, "fremd.m4a", { mediaDir })).toBe("none");
    expect(await exists(join(mediaDir, "fremd.m4a"))).toBe(true);
    expect(await own.owns(BEN, "fremd.m4a")).toBe(true);

    // Nur Aufnahmen — ein Bild bleibt, auch wenn es Anna gehört.
    expect(await own.dropRecording(ANNA, "bild.png", { mediaDir })).toBe(null);
    expect(await exists(join(mediaDir, "bild.png"))).toBe(true);
    expect(await own.owns(ANNA, "bild.png")).toBe(true);

    // Zweimal löschen schadet nicht; Unsinn tut nichts.
    expect(await own.dropRecording(ANNA, "allein.m4a", { mediaDir })).toBe("none");
    expect(await own.dropRecording("../x", "fremd.m4a", { mediaDir })).toBe(null);
    expect(await own.dropRecording(ANNA, "../fremd.m4a", { mediaDir })).toBe(null);
    expect(await own.dropRecording(ANNA, "fremd.m4a")).toBe(null);   // ohne mediaDir: nichts anfassen
  } finally {
    await rm(base, { recursive: true, force: true });
  }
});

/* Ein gelöschter Traum nimmt seine Medien mit (A, 10.10.2026) — jede Art,
   aber weiter nur Eigenes und nichts, was noch jemand anderem gehört. */
test("dropFile deletes any kind of own media, keeps shared and foreign files", async () => {
  const base = await mkdtemp(join(tmpdir(), "dr-drop-"));
  const root = join(base, "besitz"), mediaDir = base;
  const { writeFile, access } = await import("node:fs/promises");
  const exists = (p) => access(p).then(() => true, () => false);
  try {
    for (const f of ["film.mp4", "bild.png", "poster.jpg", "geteilt.webp", "fremd.mp4"]) await writeFile(join(mediaDir, f), f);
    const own = createOwnership(root);
    for (const f of ["film.mp4", "bild.png", "poster.jpg", "geteilt.webp"]) await own.claim(ANNA, f);
    await own.claim(BEN, "geteilt.webp");
    await own.claim(BEN, "fremd.mp4");

    for (const f of ["film.mp4", "bild.png", "poster.jpg"]) {
      expect(await own.dropFile(ANNA, f, { mediaDir })).toBe("deleted");
      expect(await exists(join(mediaDir, f))).toBe(false);
    }
    expect(await own.dropFile(ANNA, "geteilt.webp", { mediaDir })).toBe("shared");
    expect(await exists(join(mediaDir, "geteilt.webp"))).toBe(true);
    expect(await own.owns(BEN, "geteilt.webp")).toBe(true);
    expect(await own.dropFile(ANNA, "fremd.mp4", { mediaDir })).toBe("none");
    expect(await exists(join(mediaDir, "fremd.mp4"))).toBe(true);
    expect(await own.filesOf(ANNA)).toEqual([]);
    expect(await own.dropFile(ANNA, "besitz", { mediaDir })).toBe(null);   // kein Medienname: nichts
  } finally {
    await rm(base, { recursive: true, force: true });
  }
});
