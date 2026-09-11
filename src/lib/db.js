/* The database connection for server.js (ADR-0005).
 *
 * The rule this file is built around is least privilege, and it is enforced
 * here as well as in the database — belt and braces, because the cheapest
 * way to lose the whole design is to paste the wrong connection string.
 *
 *   The server connects as `dreamrushes_server`, a role with no write rights
 *   on the credit tables and no way around Row Level Security
 *   (supabase/migrations/20260911150000_server_role.sql). Supabase's default
 *   string logs in as `postgres` instead, which bypasses RLS — and with it,
 *   every per-person boundary the schema draws. So before this module hands
 *   out a connection, it asks the database who it is, and refuses a role
 *   that is too strong. A refused connection is not an error the app dies
 *   of: the server runs on without a database, exactly as it did before
 *   there was one, and says why at startup.
 *
 * ⚠ The database is OPTIONAL. Without DATABASE_URL nothing here connects
 *   and nothing breaks. Anton's machine, cloud sessions and every fresh
 *   checkout have no such variable, and a server that refused to start
 *   without it would be switched off by everyone the same day — a safety
 *   that everybody disables secures nothing (gatekeeper.js, same reasoning).
 *
 * Pure parts (roleVerdict, claimsFor, withUser against an injected client)
 * are separated from I/O so they can be tested without a database.
 */

import { SQL } from "bun";

/** Roles that must never be what server.js runs as. `postgres` is listed
 *  by name on top of the flag check: even where Supabase has stripped its
 *  superuser bit, it is the admin role, and a running service has no
 *  business holding admin credentials. */
const ADMIN_ROLES = new Set(["postgres", "supabase_admin", "service_role"]);

/**
 * Is this role weak enough to be trusted with server.js?
 * @param {{ user: string, superuser: boolean, bypassrls: boolean }} role
 * @returns {{ ok: true } | { ok: false, reason: string }}
 */
export function roleVerdict(role) {
  const user = String(role?.user || "");
  if (!user) return { ok: false, reason: "the database did not say which role this is" };
  if (role.superuser) return { ok: false, reason: `role "${user}" is a superuser` };
  if (role.bypassrls) return { ok: false, reason: `role "${user}" bypasses Row Level Security` };
  if (ADMIN_ROLES.has(user)) return { ok: false, reason: `role "${user}" is an admin role` };
  return { ok: true };
}

/* A person id is a UUID from a verified session. Checking the shape here is
   not about SQL injection — the value travels as a bound parameter either
   way — but about bugs: an `undefined` that turned into {"sub":"undefined"}
   would make auth.uid() fail in a way nobody would think to look for. */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The JSON that auth.uid() reads (it looks at request.jwt.claims ->> 'sub',
 *  read back from Supabase on 11.09.2026). Throws on anything that is not a
 *  UUID — acting for "nobody in particular" is exactly what must not happen. */
export function claimsFor(userId) {
  if (typeof userId !== "string" || !UUID.test(userId)) {
    throw new Error("withUser needs a person id (UUID) from a verified session");
  }
  return JSON.stringify({ sub: userId.toLowerCase() });
}

/**
 * Run `fn` on behalf of one person, inside one transaction.
 *
 * The first statement declares who that person is; Row Level Security then
 * scopes every query in `fn` to their rows, and the server_* credit
 * functions act for them and for nobody else. The setting is LOCAL to the
 * transaction (the `true`): the next request on the same pooled connection
 * starts with nobody — measured 11.09.2026, auth.uid() is null again
 * afterwards. That is what makes forgetting withUser harmless rather than
 * dangerous: outside it, the server sees no rows and moves no money.
 *
 * ⚠ `userId` must come from a verified session token, never from the
 *   request body. Otherwise everything above only moves the hole.
 *
 * @template T
 * @param {{ begin: (cb: (tx: any) => Promise<T>) => Promise<T> }} db
 * @param {string} userId
 * @param {(tx: any) => Promise<T>} fn
 * @returns {Promise<T>}
 */
export async function withUser(db, userId, fn) {
  if (!db) throw new Error("no database connection");
  const claims = claimsFor(userId); // throws before a transaction is opened
  return db.begin(async (tx) => {
    await tx`select set_config('request.jwt.claims', ${claims}, true)`;
    return fn(tx);
  });
}

/**
 * Connect, then check the role before trusting it.
 * @param {string|undefined} url  DATABASE_URL
 * @returns {Promise<{ db: any|null, status: string }>}
 *   `db` is null whenever the connection is missing, unreachable or refused;
 *   `status` is one line for the startup log. Neither ever contains the URL.
 */
export async function openDatabase(url, { SQLImpl = SQL } = {}) {
  if (!url) return { db: null, status: "Datenbank: nicht konfiguriert (DATABASE_URL fehlt) — läuft ohne" };

  let db;
  try {
    db = new SQLImpl(url, { max: 10, idleTimeout: 30, connectionTimeout: 10 });
    const [role] = await db`
      select current_user as "user", rolsuper as superuser, rolbypassrls as bypassrls
        from pg_roles where rolname = current_user`;
    const verdict = roleVerdict(role);
    if (!verdict.ok) {
      await db.close().catch(() => {});
      return {
        db: null,
        status: `Datenbank: VERWEIGERT — ${verdict.reason}. server.js verbindet sich `
          + `nur als dreamrushes_server (siehe supabase/migrations/20260911150000_server_role.sql). Läuft ohne.`,
      };
    }
    return { db, status: `Datenbank: verbunden als ${role.user} ✓ (keine Schreibrechte aufs Guthaben, RLS aktiv)` };
  } catch (e) {
    await db?.close?.().catch(() => {});
    /* Drivers like to quote the connection string back in their errors.
       The password must not reach a log, so the message is cut to its code
       and a cleaned first line. */
    const msg = String(e?.message || e).replace(/postgres(ql)?:\/\/\S+/gi, "***").split("\n")[0];
    return { db: null, status: `Datenbank: nicht erreichbar (${e?.code || "Fehler"}: ${msg}) — läuft ohne` };
  }
}
