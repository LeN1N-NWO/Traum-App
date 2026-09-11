-- Dream Rushes — a least-privilege role for server.js
--
-- Run once, after 20260911130000_initial_schema.sql.
--
-- ── Why this exists ──────────────────────────────────────────────────────
-- The connection string Supabase hands out logs in as `postgres`, which
-- bypasses Row Level Security entirely (measured 11.09.2026: "superuser
-- nein, umgeht RLS JA"). With that role, a bug in server.js could write
-- straight into credits_balance and leave ledger and balance disagreeing —
-- the exact state the schema exists to prevent. Hanni's rule: always least
-- privilege. So server.js gets its own role that can do exactly what it
-- needs and nothing more.
--
-- Two independent locks, and it matters which does what:
--
--   GRANTS decide WHAT the role may touch at all. It has no INSERT, UPDATE
--   or DELETE on either credit table — so it cannot move money directly,
--   whatever its code does. That is the lock that protects the ledger.
--
--   RLS decides WHICH ROWS it sees. The role does NOT bypass RLS, so it only
--   sees the rows of the person server.js is currently acting for — and
--   nothing at all until it says who that is (see "How server.js talks to
--   the database" below). A bug that forgets a WHERE clause finds nobody
--   else's dreams; the database filters them out first.
--
-- ⚠ No password in this file. It is committed; a password here would be in
--   git history forever. The role is created with LOGIN but can't log in
--   until a password is set by hand — see the steps at the end.

begin;

create role dreamrushes_server
  login
  nosuperuser nocreatedb nocreaterole
  nobypassrls
  noreplication;

comment on role dreamrushes_server is
  'server.js only. No direct writes to credit tables, does not bypass RLS. Password set by hand, never in git.';

grant usage on schema public to dreamrushes_server;

-- The journal and the profile: server.js writes these on the person's
-- behalf. RLS scopes every statement to that person.
grant select, insert, update, delete on public.dreams   to dreamrushes_server;
grant select, update                 on public.profiles to dreamrushes_server;
-- (No INSERT on profiles: the trigger on auth.users creates the row.)

-- ⚠⚠ The credit tables: READ ONLY. This line is the lock on the money.
grant select on public.credits_balance to dreamrushes_server;
grant select on public.credits_ledger  to dreamrushes_server;

-- ─────────────────────────────────────────────────────────────────────────
-- Money, for the server: through these wrappers and nowhere else
-- ─────────────────────────────────────────────────────────────────────────
-- The three credit functions take the person as an ARGUMENT and trust it.
-- Handing them to this role would mean: a bug that passes the wrong id
-- spends someone else's credits. So the role does not get them. It gets
-- wrappers that take NO person at all — they act for whoever server.js
-- declared at the start of the transaction, and refuse if nobody was.
--
-- The tested functions stay exactly as they are. These only narrow them.

create or replace function public.server_spend(
  p_cost integer,
  p_ref  text default null,
  p_note text default null
) returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
begin
  -- Fail closed: no declared person, no money moves.
  if v_user is null then
    raise exception 'no acting user — set request.jwt.claims first'
      using errcode = 'insufficient_privilege';
  end if;
  return public.credits_spend(v_user, p_cost, p_ref, p_note);
end;
$$;

-- Only what the server legitimately does: the one-time welcome grant and a
-- store purchase. NOT 'adjustment' (a hand correction belongs in the SQL
-- editor, with a person behind it) and NOT 'refund' — credits_grant would
-- book a refund into the permanent bucket even when the spend came from the
-- expiring one. A correct refund needs credits_refund(), not yet written.
create or replace function public.server_grant(
  p_amount integer,
  p_reason public.credit_reason,
  p_ref    text default null
) returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'no acting user — set request.jwt.claims first'
      using errcode = 'insufficient_privilege';
  end if;
  if p_reason not in ('welcome_grant', 'purchase') then
    raise exception 'server may not grant for reason %', p_reason
      using errcode = 'insufficient_privilege';
  end if;
  return public.credits_grant(v_user, p_amount, p_reason, p_ref, null);
end;
$$;

create or replace function public.server_set_allowance(
  p_amount integer,
  p_ref    text default null
) returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'no acting user — set request.jwt.claims first'
      using errcode = 'insufficient_privilege';
  end if;
  return public.credits_set_allowance(v_user, p_amount, p_ref);
end;
$$;

-- Functions are executable by PUBLIC unless told otherwise. Tell them.
revoke all on function public.server_spend(integer, text, text)                     from public;
revoke all on function public.server_grant(integer, public.credit_reason, text)     from public;
revoke all on function public.server_set_allowance(integer, text)                   from public;
grant execute on function public.server_spend(integer, text, text)                  to dreamrushes_server;
grant execute on function public.server_grant(integer, public.credit_reason, text)  to dreamrushes_server;
grant execute on function public.server_set_allowance(integer, text)                to dreamrushes_server;

commit;

-- ─────────────────────────────────────────────────────────────────────────
-- How server.js talks to the database
-- ─────────────────────────────────────────────────────────────────────────
-- Every statement on someone's behalf runs inside a transaction that first
-- declares who that is:
--
--   begin;
--   select set_config('request.jwt.claims', '{"sub":"<user-uuid>"}', true);
--   ... queries, server_spend(...), ...
--   commit;
--
-- The `true` makes the setting local to this transaction — the next
-- request on the same pooled connection starts clean and sees nothing. That
-- is what makes forgetting it harmless instead of dangerous: forget it, and
-- you get no rows and no money, not somebody else's.
--
-- The user id must come from a VERIFIED session token, never from the
-- request body. Otherwise all of the above only moves the hole.

-- ─────────────────────────────────────────────────────────────────────────
-- After running: set the password BY HAND
-- ─────────────────────────────────────────────────────────────────────────
-- In the SQL editor, in a NEW query that you do not save:
--
--   alter role dreamrushes_server with password '<a long generated password>';
--
-- ⚠ Supabase keeps SQL editor history. Do not save this query as a snippet,
--   and delete it from the history afterwards. Then put the connection
--   string into the SERVER's .env as DATABASE_URL:
--
--   postgresql://dreamrushes_server:<password>@db.<ref>.supabase.co:5432/postgres
--
-- And take the `postgres` string OUT of that .env. A running service has
-- no business holding admin credentials; migrations run in the SQL editor.
