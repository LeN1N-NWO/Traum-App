import { test, expect, describe, afterAll } from "bun:test";
import { mkdtemp, rm, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  keyOf, localMediaStore, s3MediaStore, mediaStoreConfig, createMediaStore, MediaStoreError, MAX_BLOB,
} from "./media-store.js";

const A = "1f2e5869-f1c1-42e2-8a97-0b3d11c8a5d8";
const B = "3ecbfe28-21c1-4475-b931-1082d2b56ba7";
const bytes = (s) => new TextEncoder().encode(s);
const text = (u8) => (u8 ? new TextDecoder().decode(u8) : null);

/* ── keyOf: the one wall between two accounts ──────────────────────────── */

test("a key is owner/name, built only from a user id and a plain file name", () => {
  expect(keyOf(A, "7ml9suy2vfo.mp4.enc")).toBe(`${A}/7ml9suy2vfo.mp4.enc`);
});

/* ⚠⚠ With S3 the server holds ONE bucket key — no per-user rule like RLS.
   If any of these got through, one account could read or delete another's
   backup. */
test("nothing that could reach another owner's folder becomes a key", () => {
  const badNames = ["", "../x", `../${B}/x`, "a/b", "a\\b", "..", "a..b", ".hidden", "x".repeat(129), "a b", "ä.mp4", null, 7];
  for (const n of badNames) expect(() => keyOf(A, n)).toThrow(MediaStoreError);
  const badOwners = ["", "admin", `${A}/..`, A.toUpperCase(), `${A}x`, "../" + A, null];
  for (const o of badOwners) expect(() => keyOf(o, "x.enc")).toThrow(MediaStoreError);
});

/* ── In-memory S3, paging like Bun's client ─────────────────────────────
   Pages are small (2) on purpose, so listing must actually page. */
function fakeS3({ pageSize = 2 } = {}) {
  const objects = new Map();
  const calls = { list: 0 };
  return {
    objects, calls,
    file(key) {
      return {
        async write(data) { objects.set(key, new Uint8Array(data)); },
        async exists() { return objects.has(key); },
        async arrayBuffer() { const v = objects.get(key); if (!v) throw new Error("NoSuchKey"); return v.slice().buffer; },
        async delete() { objects.delete(key); },
      };
    },
    async list({ prefix = "", maxKeys = 1000, startAfter } = {}) {
      calls.list++;
      const keys = [...objects.keys()].filter((k) => k.startsWith(prefix)).sort().filter((k) => !startAfter || k > startAfter);
      const page = keys.slice(0, Math.min(maxKeys, pageSize));
      return { contents: page.map((key) => ({ key })), isTruncated: keys.length > page.length };
    },
  };
}

/* ── One contract, every backend ────────────────────────────────────────── */

const dirs = [];
afterAll(async () => { for (const d of dirs) await rm(d, { recursive: true, force: true }); });

const backends = {
  local: async () => { const d = await mkdtemp(join(tmpdir(), "media-store-")); dirs.push(d); return { store: localMediaStore(d), dir: d }; },
  s3: async () => { const fake = fakeS3(); return { store: s3MediaStore(fake), fake }; },
};

for (const [kind, make] of Object.entries(backends)) {
  describe(`contract: ${kind}`, () => {
    test("put, get, list round-trip — and nothing for an unknown name", async () => {
      const { store } = await make();
      await store.put(A, "one.enc", bytes("eins"));
      await store.put(A, "two.enc", bytes("zwei"));
      expect(text(await store.get(A, "one.enc"))).toBe("eins");
      expect(await store.get(A, "nope.enc")).toBe(null);
      expect(await store.list(A)).toEqual(["one.enc", "two.enc"]);
    });

    test("put replaces a blob of the same name", async () => {
      const { store } = await make();
      await store.put(A, "one.enc", bytes("alt"));
      await store.put(A, "one.enc", bytes("neu"));
      expect(text(await store.get(A, "one.enc"))).toBe("neu");
      expect(await store.list(A)).toEqual(["one.enc"]);
    });

    test("owners are separate: same name, different blobs, separate lists", async () => {
      const { store } = await make();
      await store.put(A, "same.enc", bytes("von A"));
      await store.put(B, "same.enc", bytes("von B"));
      expect(text(await store.get(A, "same.enc"))).toBe("von A");
      expect(text(await store.get(B, "same.enc"))).toBe("von B");
      expect(await store.list(B)).toEqual(["same.enc"]);
    });

    test("remove says whether something was there", async () => {
      const { store } = await make();
      await store.put(A, "one.enc", bytes("x"));
      expect(await store.remove(A, "one.enc")).toBe(true);
      expect(await store.remove(A, "one.enc")).toBe(false);
      expect(await store.get(A, "one.enc")).toBe(null);
    });

    /* Account deletion: everything of A is gone, B is untouched. */
    test("removeAll empties exactly one owner", async () => {
      const { store } = await make();
      for (const n of ["a.enc", "b.enc", "c.enc", "d.enc", "e.enc"]) await store.put(A, n, bytes(n));
      await store.put(B, "b.enc", bytes("bleibt"));
      expect(await store.removeAll(A)).toBe(5);
      expect(await store.list(A)).toEqual([]);
      expect(text(await store.get(B, "b.enc"))).toBe("bleibt");
      expect(await store.removeAll(A)).toBe(0);
    });

    test("an owner with nothing lists nothing", async () => {
      const { store } = await make();
      expect(await store.list(A)).toEqual([]);
    });

    test("empty, oversized and non-byte blobs are refused before anything is written", async () => {
      const { store } = await make();
      await expect(store.put(A, "x.enc", new Uint8Array(0))).rejects.toMatchObject({ code: "EMPTY" });
      await expect(store.put(A, "x.enc", "text")).rejects.toMatchObject({ code: "BAD_BYTES" });
      // Only the length is checked — a 64 MB zero-filled view is enough.
      await expect(store.put(A, "x.enc", new Uint8Array(MAX_BLOB + 1))).rejects.toMatchObject({ code: "TOO_LARGE" });
      expect(await store.list(A)).toEqual([]);
    });

    test("every verb refuses a path-shaped name", async () => {
      const { store } = await make();
      await store.put(B, "secret.enc", bytes("B"));
      const evil = `../${B}/secret.enc`;
      await expect(store.put(A, evil, bytes("x"))).rejects.toMatchObject({ code: "BAD_NAME" });
      await expect(store.get(A, evil)).rejects.toMatchObject({ code: "BAD_NAME" });
      await expect(store.remove(A, evil)).rejects.toMatchObject({ code: "BAD_NAME" });
      expect(text(await store.get(B, "secret.enc"))).toBe("B");
    });
  });
}

/* ── Backend specifics ─────────────────────────────────────────────────── */

test("local: a write lands atomically — no leftover temp files", async () => {
  const { store, dir } = await backends.local();
  await store.put(A, "one.enc", bytes("x"));
  expect(await readdir(join(dir, A))).toEqual(["one.enc"]);
});

test("s3: listing pages through more keys than fit on one page", async () => {
  const fake = fakeS3({ pageSize: 2 });
  const store = s3MediaStore(fake);
  for (let i = 0; i < 7; i++) await store.put(A, `f${i}.enc`, bytes(String(i)));
  expect(await store.list(A)).toEqual(["f0.enc", "f1.enc", "f2.enc", "f3.enc", "f4.enc", "f5.enc", "f6.enc"]);
  expect(fake.calls.list).toBe(4);
});

test("s3: a listing that stops moving forward does not loop", async () => {
  const stuck = { ...fakeS3(), async list() { return { contents: [{ key: `${A}/x.enc` }], isTruncated: true }; } };
  const store = s3MediaStore(stuck);
  expect(await store.list(A)).toEqual(["x.enc"]);
});

test("s3: objects are stored under owner/name and nothing else", async () => {
  const fake = fakeS3();
  await s3MediaStore(fake).put(A, "one.enc", bytes("x"));
  expect([...fake.objects.keys()]).toEqual([`${A}/one.enc`]);
});

/* ── Configuration ──────────────────────────────────────────────────────── */

const S3_ENV = {
  MEDIA_STORE: "s3", MEDIA_S3_ENDPOINT: "fsn1.your-objectstorage.com", MEDIA_S3_BUCKET: "dreamrushes-backup",
  MEDIA_S3_ACCESS_KEY_ID: "id", MEDIA_S3_SECRET_ACCESS_KEY: "secret",
};

test("no configuration means the local store — at the folder the caller names", () => {
  expect(mediaStoreConfig({}, "/tmp/x")).toEqual({ kind: "local", root: "/tmp/x" });
  expect(mediaStoreConfig({ MEDIA_STORE: "LOCAL" }, "/tmp/x").kind).toBe("local");
});

/* ⚠ A relative default would land inside a worktree, and removing the
   worktree deletes it (AGENTS.md, 21.08.2026: paid images lost that way). */
test("the local store has no default folder — a relative or missing one is an error", () => {
  for (const root of [undefined, "", "media-backup", "./media-backup"]) {
    expect(mediaStoreConfig({}, root).kind).toBe("error");
  }
});

test("s3 config: endpoint gets https, region comes from the location code", () => {
  const c = mediaStoreConfig(S3_ENV);
  expect(c).toMatchObject({ kind: "s3", endpoint: "https://fsn1.your-objectstorage.com", region: "fsn1", bucket: "dreamrushes-backup" });
  expect(mediaStoreConfig({ ...S3_ENV, MEDIA_S3_REGION: "nbg1" }).region).toBe("nbg1");
});

/* ⚠ A typo on the production server must not quietly fall back to a disk
   nobody backs up while the app believes the backup is safe. */
test("s3 asked for but incomplete is an error, never a silent local fall-back", () => {
  for (const k of ["MEDIA_S3_ENDPOINT", "MEDIA_S3_BUCKET", "MEDIA_S3_ACCESS_KEY_ID", "MEDIA_S3_SECRET_ACCESS_KEY"]) {
    const c = mediaStoreConfig({ ...S3_ENV, [k]: "" });
    expect(c).toEqual({ kind: "error", missing: [k] });
    expect(() => createMediaStore(c)).toThrow(MediaStoreError);
  }
  expect(mediaStoreConfig({ MEDIA_STORE: "ftp" }).kind).toBe("error");
});

test("createMediaStore builds the matching backend", () => {
  expect(createMediaStore({ kind: "local", root: tmpdir() }).kind).toBe("local");
  expect(createMediaStore(mediaStoreConfig(S3_ENV)).kind).toBe("s3");
});

/* ── Against the real bucket — only when credentials are set ────────────
   Run with the server's .env:  bun --env-file=../Traum-App/.env test src/lib/media-store.test.js
   Uses a random test owner and removes everything it wrote. */
const live = mediaStoreConfig(process.env);
test.skipIf(live.kind !== "s3")("live s3: round-trip, list, removeAll against the real bucket", async () => {
  const store = createMediaStore(live);
  const owner = crypto.randomUUID();
  try {
    await store.put(owner, "probe.enc", bytes("probe"));
    expect(text(await store.get(owner, "probe.enc"))).toBe("probe");
    expect(await store.list(owner)).toEqual(["probe.enc"]);
  } finally {
    expect(await store.removeAll(owner)).toBe(1);
    expect(await store.list(owner)).toEqual([]);
  }
}, 30_000);
