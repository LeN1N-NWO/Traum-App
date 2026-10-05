/* Medien nur an den Besitzer — die Seite des Servers (S2, 05.10.2026).
 *
 * Seit ADR-0008 bleiben Filme, Bilder und Aufnahmen dauerhaft auf dem
 * Server. Darunter Gesichter realer Menschen (DSGVO Art. 9) — `/media/*`
 * darf deshalb nur noch an das Konto gehen, dem die Datei gehört.
 *
 * Zwei Teile:
 *
 * 1. WEM GEHÖRT WAS — Markerdateien unter <MEDIA_DIR>/besitz/:
 *      datei/<name>/<konto>     „diese Datei gehört diesem Konto"
 *      konto/<konto>/<name>     dieselbe Aussage rückwärts — für B8
 *                               (Konto löschen löscht seine Medien)
 *      auftrag/<jobId>/<konto>  „dieser Auftrag gehört diesem Konto"
 *    Leere Dateien statt einer JSON-Liste: Anlegen ist atomar, zwei
 *    gleichzeitige Vermerke können sich nicht gegenseitig überschreiben.
 *    Eine Datei kann mehreren Konten gehören (Namen sind Inhalts-Hashes —
 *    zwei Leute können dieselbe Datei hochladen).
 *
 * 2. WER FRAGT — signierte Adressen:
 *      Medienschlüssel = HMAC-SHA256(MEDIA_SECRET, "media-key|<konto>|<ablauf>")
 *      Signatur        = HMAC-SHA256(Medienschlüssel, <name>)   (base64url)
 *    Die App bekommt nur den Medienschlüssel (GET /api/media-key) und
 *    rechnet die Signatur je Datei selbst (src/lib/mediaSign.js). Konto und
 *    Ablauf stehen in der Adresse; wer sie ändert, ändert den Schlüssel und
 *    damit jede Signatur. Ohne MEDIA_SECRET gibt es keinen Schlüssel, und
 *    mit REQUIRE_AUTH=1 wird dann nichts ausgeliefert (fail closed).
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import { mkdir, writeFile, access, readdir } from "node:fs/promises";
import { join } from "node:path";

/** 20 Minuten: die App erneuert alle 10, jede Adresse lebt also noch
 *  mindestens 10 Minuten — genug, damit ein laufender Film nicht abreißt. */
export const MEDIA_KEY_TTL_SEC = 20 * 60;

// Supabase-Konten sind UUIDs. Alles andere wird nie Teil eines Pfads.
const ACCOUNT = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const NAME = /^[a-z0-9]{1,20}\.(?:png|jpg|webp|mp4|m4a)$/;
const JOB = /^[a-z0-9]{6,32}$/;
const SIG = /^[A-Za-z0-9_-]{43}$/;

export const isAccountId = (id) => typeof id === "string" && ACCOUNT.test(id);

/** The media key for one account until `exp` (unix seconds), hex. */
export function mediaKeyFor(secret, uid, exp) {
  if (!secret || !isAccountId(uid) || !Number.isSafeInteger(exp)) return null;
  return createHmac("sha256", secret).update(`media-key|${uid}|${exp}`).digest("hex");
}

/** What GET /api/media-key hands out: { uid, exp, key }. */
export function issueMediaKey(secret, uid, nowSec = Math.floor(Date.now() / 1000)) {
  const exp = nowSec + MEDIA_KEY_TTL_SEC;
  const key = mediaKeyFor(secret, uid, exp);
  return key ? { uid, exp, key } : null;
}

/** Check one request's u/e/s against the file name. Returns the account id
 *  the signature speaks for, or null. Says nothing about ownership — that
 *  is the second, separate question (owns()). */
export function verifyMediaSignature(secret, name, params, nowSec = Math.floor(Date.now() / 1000)) {
  if (!secret || !NAME.test(name || "")) return null;
  const uid = params.get("u");
  const expRaw = params.get("e");
  const sig = params.get("s");
  if (!isAccountId(uid) || !/^\d{1,12}$/.test(expRaw || "") || !SIG.test(sig || "")) return null;
  const exp = Number(expRaw);
  // Abgelaufen — oder weiter in der Zukunft, als der Server je ausstellt.
  if (exp <= nowSec || exp > nowSec + MEDIA_KEY_TTL_SEC + 60) return null;
  const key = Buffer.from(mediaKeyFor(secret, uid, exp), "hex");
  const want = createHmac("sha256", key).update(name).digest();
  const got = Buffer.from(sig, "base64url");
  if (got.length !== want.length || !timingSafeEqual(got, want)) return null;
  return uid;
}

/** The ownership markers under one directory (<MEDIA_DIR>/besitz). */
export function createOwnership(root) {
  const exists = (p) => access(p).then(() => true, () => false);
  const mark = async (dir, leaf) => {
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, leaf), "");
  };
  return {
    /** Note that `name` belongs to `uid`. Unknown shapes are ignored. */
    async claim(uid, name) {
      if (!isAccountId(uid) || !NAME.test(name || "")) return false;
      await mark(join(root, "datei", name), uid);
      await mark(join(root, "konto", uid), name);
      return true;
    },
    async owns(uid, name) {
      if (!isAccountId(uid) || !NAME.test(name || "")) return false;
      return exists(join(root, "datei", name, uid));
    },
    async claimJob(uid, jobId) {
      if (!isAccountId(uid) || !JOB.test(jobId || "")) return false;
      await mark(join(root, "auftrag", jobId), uid);
      return true;
    },
    async ownsJob(uid, jobId) {
      if (!isAccountId(uid) || !JOB.test(jobId || "")) return false;
      return exists(join(root, "auftrag", jobId, uid));
    },
    /** Every file name noted for one account (for B8). */
    async filesOf(uid) {
      if (!isAccountId(uid)) return [];
      return readdir(join(root, "konto", uid)).then((xs) => xs.filter((x) => NAME.test(x)), () => []);
    },
  };
}
