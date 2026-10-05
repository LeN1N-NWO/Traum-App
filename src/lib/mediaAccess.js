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
 *      auftraege/<konto>/<jobId> dasselbe rückwärts — für B8
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
 *
 * 3. KONTO LÖSCHEN (B8, 05.10.2026) — forgetAccount():
 *    Jede Datei und jeder Auftrag des Kontos verliert zuerst den Vermerk
 *    (ab da liefert der Server sie diesem Konto nicht mehr aus — auch eine
 *    noch gültige signierte Adresse greift ins Leere). Danach wird die
 *    Datei gelöscht, aber nur, wenn kein anderes Konto sie noch besitzt:
 *    Namen sind Inhalts-Hashes, dieselben Bytes können zwei Leuten gehören,
 *    und die Datei des anderen darf nicht mitverschwinden. Aufträge
 *    (media/jobs/<id>.json) tragen den Prompt, also Traumtext — sie gehen
 *    mit, und mit ihnen die Dateien, die in ihnen stehen und niemandem
 *    gehören.
 *    ⚠ Warum das Letzte: Während das Poster entsteht (finishPoster, bis
 *    ~5 Minuten), steht der Auftrag auf „posting" — der Film liegt schon
 *    hier, ist aber noch NICHT vermerkt (/api/job hat „pending" gesagt).
 *    Und finishPoster schreibt die Auftragsdatei danach neu. Deshalb gibt
 *    forgetAccount die Auftragsnummern zurück, und sweepJobs() kehrt sie
 *    später ein zweites Mal (server.js, Lösch-Route, nach 10 Minuten).
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import { mkdir, writeFile, access, readdir, rm, readFile } from "node:fs/promises";
import { join } from "node:path";

/** 20 Minuten: die App erneuert alle 10, jede Adresse lebt also noch
 *  mindestens 10 Minuten — genug, damit ein laufender Film nicht abreißt. */
export const MEDIA_KEY_TTL_SEC = 20 * 60;

// Supabase-Konten sind UUIDs. Alles andere wird nie Teil eines Pfads.
const ACCOUNT = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const NAME = /^[a-z0-9]{1,20}\.(?:png|jpg|webp|mp4|m4a)$/;
const JOB = /^[a-z0-9]{6,32}$/;
const SIG = /^[A-Za-z0-9_-]{43}$/;
const MEDIA_PATH = /^\/media\/([a-z0-9]{1,20}\.(?:png|jpg|webp|mp4|m4a))$/;

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
  // Owns anyone this (file or job) any more? Only account-shaped entries count.
  const ownerless = async (dir) => (await readdir(dir).catch(() => [])).filter(isAccountId).length === 0;

  /* Ein Auftrag, der niemandem mehr gehört: erst lesen, welche Dateien in
     ihm stehen (Film, Bilder, Poster), die herrenlosen davon löschen, dann
     die Auftragsdatei selbst. Gibt zurück, wie viele Dateien weg sind. */
  const dropJob = async (jobId, mediaDir, jobsDir) => {
    const file = join(jobsDir, `${jobId}.json`);
    const job = await readFile(file, "utf8").then((t) => JSON.parse(t), () => null);
    let files = 0;
    const paths = [...(Array.isArray(job?.urls) ? job.urls : []), job?.posterUrl];
    for (const p of paths) {
      const hit = typeof p === "string" ? MEDIA_PATH.exec(p) : null;
      if (!hit || !(await ownerless(join(root, "datei", hit[1])))) continue;
      if (await exists(join(mediaDir, hit[1]))) files++;
      await rm(join(mediaDir, hit[1]), { force: true });
      await rm(join(root, "datei", hit[1]), { recursive: true, force: true });
    }
    await rm(file, { force: true });
    await rm(join(root, "auftrag", jobId), { recursive: true, force: true });
    return files;
  };
  const api = {
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
      await mark(join(root, "auftraege", uid), jobId);
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
    /** Every job id noted for one account (for B8). */
    async jobsOf(uid) {
      if (!isAccountId(uid)) return [];
      return readdir(join(root, "auftraege", uid)).then((xs) => xs.filter((x) => JOB.test(x)), () => []);
    },
    /** B8: take everything of one account off this server. `mediaDir` holds
     *  the files, `jobsDir` the job records. Never throws for a single file
     *  — the account is already gone when this runs, so the caller can only
     *  log; the report says how far it got. */
    async forgetAccount(uid, { mediaDir, jobsDir }) {
      if (!isAccountId(uid) || !mediaDir || !jobsDir) return null;
      const report = { files: 0, shared: 0, jobs: 0, errors: 0, jobIds: [] };
      for (const name of await api.filesOf(uid)) {
        try {
          await rm(join(root, "datei", name, uid), { force: true });   // ab hier kein Zugriff mehr
          if (await ownerless(join(root, "datei", name))) {
            await rm(join(mediaDir, name), { force: true });
            await rm(join(root, "datei", name), { recursive: true, force: true });
            report.files++;
          } else {
            report.shared++;
          }
        } catch {
          report.errors++;
        }
      }
      for (const jobId of await api.jobsOf(uid)) {
        try {
          await rm(join(root, "auftrag", jobId, uid), { force: true });
          if (await ownerless(join(root, "auftrag", jobId))) {
            report.files += await dropJob(jobId, mediaDir, jobsDir);
            report.jobs++;
            report.jobIds.push(jobId);
          }
        } catch {
          report.errors++;
        }
      }
      // Die Rückwärts-Listen zuletzt: Bricht oben etwas ab, bleibt die Liste
      // stehen, und nichts ist vergessen, was noch zu löschen wäre.
      if (!report.errors) {
        await rm(join(root, "konto", uid), { recursive: true, force: true });
        await rm(join(root, "auftraege", uid), { recursive: true, force: true });
      }
      return report;
    },
    /** B8, zweiter Durchgang: Aufträge, die forgetAccount schon gelöscht hat,
     *  noch einmal ansehen — finishPoster kann die Datei inzwischen neu
     *  geschrieben und ein Poster abgelegt haben. Nur Aufträge, die
     *  niemandem gehören. Gibt die Zahl der gelöschten Dateien zurück. */
    async sweepJobs(jobIds, { mediaDir, jobsDir }) {
      if (!Array.isArray(jobIds) || !mediaDir || !jobsDir) return 0;
      let files = 0;
      for (const jobId of jobIds) {
        if (!JOB.test(jobId || "") || !(await ownerless(join(root, "auftrag", jobId)))) continue;
        if (await exists(join(jobsDir, `${jobId}.json`))) files += await dropJob(jobId, mediaDir, jobsDir);
      }
      return files;
    },
  };
  return api;
}
