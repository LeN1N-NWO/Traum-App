import { test, expect } from "bun:test";
import { roleVerdict, claimsFor, withUser, openDatabase } from "./db.js";

const UID = "3f2b8c1e-9a4d-4e6f-b1c2-7d8e9f0a1b2c";

/* A stand-in for Bun.SQL: a tagged-template function with begin/close.
   Records every statement so the tests can see what reached the database. */
function fakeClient(rows = []) {
  const calls = [];
  const client = async (strings, ...values) => {
    calls.push({ text: strings.join("?"), values });
    return rows;
  };
  client.calls = calls;
  client.closed = false;
  client.close = async () => { client.closed = true; };
  client.begin = async (cb) => {
    calls.push({ text: "BEGIN", values: [] });
    const out = await cb(client);
    calls.push({ text: "COMMIT", values: [] });
    return out;
  };
  return client;
}

/* ── roleVerdict: the least-privilege gate ─────────────────────────────── */

test("the role server.js is meant to use is accepted", () => {
  expect(roleVerdict({ user: "dreamrushes_server", superuser: false, bypassrls: false }).ok).toBe(true);
});

/* ⚠ The case that started all this (11.09.2026): Supabase's default string
   logs in as postgres, which is no superuser there but bypasses RLS. */
test("postgres is refused even without the superuser bit", () => {
  const v = roleVerdict({ user: "postgres", superuser: false, bypassrls: true });
  expect(v.ok).toBe(false);
  expect(v.reason).toContain("bypasses Row Level Security");
});

test("admin roles are refused by name, not only by their flags", () => {
  // Flags can be changed; the name says what the role is for.
  expect(roleVerdict({ user: "postgres", superuser: false, bypassrls: false }).ok).toBe(false);
  expect(roleVerdict({ user: "service_role", superuser: false, bypassrls: false }).ok).toBe(false);
});

test("any role that bypasses RLS or is superuser is refused", () => {
  expect(roleVerdict({ user: "someone", superuser: true, bypassrls: false }).ok).toBe(false);
  expect(roleVerdict({ user: "someone", superuser: false, bypassrls: true }).ok).toBe(false);
});

test("an unknown role is not waved through", () => {
  expect(roleVerdict({}).ok).toBe(false);
  expect(roleVerdict(undefined).ok).toBe(false);
});

/* ── claimsFor: who the server is acting for ───────────────────────────── */

test("a person id becomes the claim auth.uid() reads", () => {
  expect(JSON.parse(claimsFor(UID))).toEqual({ sub: UID });
  expect(JSON.parse(claimsFor(UID.toUpperCase()))).toEqual({ sub: UID });
});

test("anything that is not a UUID is refused, not quietly passed on", () => {
  // `undefined` would otherwise become {"sub":"undefined"} and fail nowhere
  // anyone would think to look.
  for (const bad of [undefined, null, "", "undefined", "42", `${UID}'); drop table dreams;--`, {}]) {
    expect(() => claimsFor(bad)).toThrow();
  }
});

/* ── withUser: every statement scoped to one person ────────────────────── */

test("the first statement in the transaction declares the person", async () => {
  const db = fakeClient();
  await withUser(db, UID, async (tx) => { await tx`select 1`; });
  expect(db.calls[0].text).toBe("BEGIN");
  expect(db.calls[1].text).toContain("set_config('request.jwt.claims', ?, true)");
  // Bound as a value, never spliced into the SQL text.
  expect(db.calls[1].values).toEqual([JSON.stringify({ sub: UID })]);
  expect(db.calls[2].text).toContain("select 1");
  expect(db.calls.at(-1).text).toBe("COMMIT");
});

/* The `true` in set_config makes the claim local to the transaction. If it
   ever became `false`, the claim would outlive the request and the next
   request on the same connection would act as the wrong person. */
test("the claim is transaction-local, not session-wide", async () => {
  const db = fakeClient();
  await withUser(db, UID, async () => {});
  expect(db.calls[1].text).toMatch(/set_config\('request\.jwt\.claims', \?, true\)/);
});

test("the callback's result comes back", async () => {
  expect(await withUser(fakeClient(), UID, async () => "ok")).toBe("ok");
});

test("a bad person id throws BEFORE any transaction is opened", async () => {
  const db = fakeClient();
  await expect(withUser(db, "not-a-uuid", async () => {})).rejects.toThrow();
  expect(db.calls.length).toBe(0);
});

test("without a connection there is nothing to act on", async () => {
  await expect(withUser(null, UID, async () => {})).rejects.toThrow("no database connection");
});

/* ── openDatabase: optional, checked, never leaking the password ───────── */

function FakeSQLWith(role, onClose) {
  return function FakeSQL() {
    const c = fakeClient([role]);
    c.close = async () => { onClose?.(); };
    return c;
  };
}

test("without DATABASE_URL the server runs on without a database", async () => {
  const { db, status } = await openDatabase(undefined);
  expect(db).toBe(null);
  expect(status).toContain("nicht konfiguriert");
});

test("a too-strong role is refused and its connection closed", async () => {
  let closed = false;
  const { db, status } = await openDatabase("postgresql://x", {
    SQLImpl: FakeSQLWith({ user: "postgres", superuser: false, bypassrls: true }, () => { closed = true; }),
  });
  expect(db).toBe(null);
  expect(status).toContain("VERWEIGERT");
  expect(closed).toBe(true);
});

test("the server role is accepted and its connection handed out", async () => {
  const { db, status } = await openDatabase("postgresql://x", {
    SQLImpl: FakeSQLWith({ user: "dreamrushes_server", superuser: false, bypassrls: false }),
  });
  expect(db).not.toBe(null);
  expect(status).toContain("verbunden als dreamrushes_server");
});

/* ⚠⚠ Drivers quote the connection string back in their errors. A startup
   log is read by people and pasted into chats; the password must not be
   in it. */
test("a connection error never puts the password into the log", async () => {
  const secret = "s3cr3t-P4ssw0rd-xyz";
  const url = `postgresql://dreamrushes_server:${secret}@db.abc.supabase.co:5432/postgres`;
  function Exploding() {
    const c = async () => { throw Object.assign(new Error(`could not connect to ${url}\nmore detail`), { code: "ECONNREFUSED" }); };
    c.close = async () => {};
    return c;
  }
  const { db, status } = await openDatabase(url, { SQLImpl: Exploding });
  expect(db).toBe(null);
  expect(status).toContain("nicht erreichbar");
  expect(status).not.toContain(secret);
  expect(status).not.toContain("db.abc.supabase.co");
});
