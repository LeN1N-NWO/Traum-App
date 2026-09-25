/* The media backup store — Step C of docs/plans/2026-09-24-medienablage.md.
 *
 * Dreams live on the device (films, images, recordings). The server only
 * keeps an ENCRYPTED backup: the app seals each file with the backup key
 * (mobile/src/lib/backup-key.ts) before uploading, so whatever sits here is
 * unreadable to us and to the storage provider.
 *
 * This file is the ONLY place that knows where those blobs live. server.js
 * will talk to it through five verbs and never learn whether the bytes sit on
 * a local disk or in Hetzner Object Storage:
 *
 *   put(owner, name, bytes)   store (replaces an existing blob of that name)
 *   get(owner, name)          bytes, or null
 *   list(owner)               names this owner has
 *   remove(owner, name)       true if something was removed
 *   removeAll(owner)          number removed — for account deletion
 *
 * ── The rule every implementation keeps ──────────────────────────────────
 * The object key is ALWAYS `<owner>/<name>`, built here from two values that
 * are checked first: `owner` must be a UUID (the verified Supabase user id,
 * never something from a request body) and `name` a plain file name. No
 * slash, no `..`, nothing that could reach into another owner's folder.
 * With S3 there is no per-user access rule like RLS — the server holds ONE
 * bucket key — so this check is the whole wall between two accounts. It is
 * deliberately done once, in `keyOf()`, for every backend alike.
 *
 * Not wired into server.js yet: that waits for Anton's PR #62, which touches
 * the same routes.
 */

import { mkdir, readdir, rename, rm, unlink } from "node:fs/promises";
import { resolve, sep } from "node:path";

/* A Supabase auth user id. Lowercase, as auth.users stores it. */
const OWNER = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
/* A plain file name: starts with a letter or digit, then letters, digits,
   dot, dash, underscore. No slash — so never a path — and `..` is refused
   on top, because "a..b" would pass the character class. */
const NAME = /^[a-z0-9][a-z0-9._-]{0,127}$/i;
/* A sealed film is 5–10 MB today; 64 MB leaves room without letting one
   request fill the bucket. */
export const MAX_BLOB = 64 * 1024 * 1024;

export class MediaStoreError extends Error {
  constructor(code, message) { super(message); this.code = code; }
}

/** `<owner>/<name>` — or an error. The one gate every backend goes through. */
export function keyOf(owner, name) {
  if (typeof owner !== "string" || !OWNER.test(owner)) throw new MediaStoreError("BAD_OWNER", "owner must be a user id");
  if (typeof name !== "string" || !NAME.test(name) || name.includes("..")) throw new MediaStoreError("BAD_NAME", "name must be a plain file name");
  return `${owner}/${name}`;
}

function checkBytes(bytes) {
  if (!(bytes instanceof Uint8Array)) throw new MediaStoreError("BAD_BYTES", "bytes must be a Uint8Array");
  if (!bytes.length) throw new MediaStoreError("EMPTY", "nothing to store");
  if (bytes.length > MAX_BLOB) throw new MediaStoreError("TOO_LARGE", `blob larger than ${MAX_BLOB} bytes`);
}

/* ── Local disk (development, and the default when no S3 is configured) ─── */

/** @param {string} root  folder that holds one sub-folder per owner */
export function localMediaStore(root) {
  const base = resolve(root);
  const pathOf = (owner, name) => {
    const p = resolve(base, keyOf(owner, name));
    // Belt and braces: keyOf already forbids escaping, this proves it.
    if (!p.startsWith(base + sep)) throw new MediaStoreError("BAD_NAME", "path escapes the store");
    return p;
  };
  const dirOf = (owner) => resolve(base, keyOf(owner, "x").split("/")[0]);

  return {
    kind: "local",
    async put(owner, name, bytes) {
      checkBytes(bytes);
      const p = pathOf(owner, name);
      await mkdir(dirOf(owner), { recursive: true });
      /* Write to a temporary name, then rename: a crash mid-write never
         leaves half a blob under the real name. */
      const tmp = `${p}.part-${process.pid}-${Date.now()}`;
      await Bun.write(tmp, bytes);
      await rename(tmp, p);
    },
    async get(owner, name) {
      const f = Bun.file(pathOf(owner, name));
      return (await f.exists()) ? new Uint8Array(await f.arrayBuffer()) : null;
    },
    async list(owner) {
      try {
        return (await readdir(dirOf(owner))).filter((n) => NAME.test(n) && !n.includes(".part-")).sort();
      } catch (e) {
        if (e?.code === "ENOENT") return [];
        throw e;
      }
    },
    async remove(owner, name) {
      try { await unlink(pathOf(owner, name)); return true; } catch (e) {
        if (e?.code === "ENOENT") return false;
        throw e;
      }
    },
    async removeAll(owner) {
      const names = await this.list(owner);
      await rm(dirOf(owner), { recursive: true, force: true });
      return names.length;
    },
  };
}

/* ── S3 (Hetzner Object Storage) ─────────────────────────────────────────── */

/**
 * @param {{ list(opts): Promise<any>, file(key): any }} client  a Bun.S3Client
 *        — injected, so tests can hand in a fake without a network.
 */
export function s3MediaStore(client) {
  return {
    kind: "s3",
    async put(owner, name, bytes) {
      checkBytes(bytes);
      await client.file(keyOf(owner, name)).write(bytes, { type: "application/octet-stream" });
    },
    async get(owner, name) {
      const f = client.file(keyOf(owner, name));
      if (!(await f.exists())) return null;
      return new Uint8Array(await f.arrayBuffer());
    },
    async list(owner) {
      const prefix = `${keyOf(owner, "x").split("/")[0]}/`;
      const names = new Set();     // a page repeating a key must not double it
      let after;
      /* S3 pages at up to 1000 keys. Paging by `startAfter` = the last key
         seen, as Bun's docs show it. The cap of 100 pages (100 000 blobs per
         person) stops a misbehaving listing from looping forever, and a page
         that does not move forward ends the loop too. */
      for (let page = 0; page < 100; page++) {
        const res = await client.list({ prefix, maxKeys: 1000, ...(after ? { startAfter: after } : {}) });
        const contents = res?.contents || [];
        for (const o of contents) {
          const n = String(o.key || "").slice(prefix.length);
          if (NAME.test(n)) names.add(n);
        }
        const last = contents.length ? String(contents[contents.length - 1].key || "") : "";
        if (!res?.isTruncated || !last || last === after) break;
        after = last;
      }
      return [...names].sort();
    },
    async remove(owner, name) {
      const f = client.file(keyOf(owner, name));
      if (!(await f.exists())) return false;
      await f.delete();
      return true;
    },
    async removeAll(owner) {
      const names = await this.list(owner);
      for (const n of names) await client.file(keyOf(owner, n)).delete();
      return names.length;
    },
  };
}

/* ── Choosing the backend from the environment ──────────────────────────── */

const S3_VARS = ["MEDIA_S3_ENDPOINT", "MEDIA_S3_BUCKET", "MEDIA_S3_ACCESS_KEY_ID", "MEDIA_S3_SECRET_ACCESS_KEY"];

/**
 * Which store, from the environment. Pure.
 *
 * - `MEDIA_STORE` unset or `local` → local disk under `localRoot`.
 *   ⚠ `localRoot` has NO default on purpose: a relative folder would land
 *   inside a worktree, and `git worktree remove` deletes it with everything
 *   in it (AGENTS.md, 21.08.2026). The caller derives it the way server.js
 *   derives its media folder — `mediaRootFrom()` (src/lib/mediaRoot.js), e.g.
 *   `resolve(MEDIA_DIR, "..", "media-backup")` like BACKUP_DIR.
 * - `MEDIA_STORE=s3` → all four `MEDIA_S3_*` values are required.
 *   ⚠ Missing ones are an ERROR, not a quiet fall-back to local: on the
 *   production server a typo would otherwise keep backups on a disk nobody
 *   backs up, while the app believes they are safe.
 *
 * @returns {{ kind: "local", root: string } | { kind: "s3", endpoint: string, bucket: string, region: string, accessKeyId: string, secretAccessKey: string } | { kind: "error", missing: string[] }}
 */
export function mediaStoreConfig(env = process.env, localRoot) {
  const want = String(env.MEDIA_STORE || "local").trim().toLowerCase();
  if (want === "local") {
    if (typeof localRoot !== "string" || !localRoot.startsWith("/")) return { kind: "error", missing: ["localRoot (absolute path via mediaRootFrom)"] };
    return { kind: "local", root: localRoot };
  }
  if (want !== "s3") return { kind: "error", missing: ["MEDIA_STORE (local|s3)"] };
  const missing = S3_VARS.filter((k) => !String(env[k] || "").trim());
  if (missing.length) return { kind: "error", missing };
  const endpoint = String(env.MEDIA_S3_ENDPOINT).trim().replace(/\/+$/, "");
  return {
    kind: "s3",
    endpoint: /^https?:\/\//.test(endpoint) ? endpoint : `https://${endpoint}`,
    bucket: String(env.MEDIA_S3_BUCKET).trim(),
    // Hetzner's region is the location code in the endpoint (fsn1, nbg1, hel1).
    region: String(env.MEDIA_S3_REGION || endpoint.replace(/^https?:\/\//, "").split(".")[0] || "").trim(),
    accessKeyId: String(env.MEDIA_S3_ACCESS_KEY_ID).trim(),
    secretAccessKey: String(env.MEDIA_S3_SECRET_ACCESS_KEY).trim(),
  };
}

/** The store for a config from mediaStoreConfig(). Throws on `kind: "error"`. */
export function createMediaStore(config) {
  if (config.kind === "local") return localMediaStore(config.root);
  if (config.kind === "s3") {
    return s3MediaStore(new Bun.S3Client({
      endpoint: config.endpoint, bucket: config.bucket, region: config.region,
      accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey,
    }));
  }
  throw new MediaStoreError("NOT_CONFIGURED", `media store not configured: ${(config.missing || []).join(", ")}`);
}

