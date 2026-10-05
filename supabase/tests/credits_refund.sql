-- Refund checks (S7) — run AFTER 20261005200000_credits_refund.sql.
--
-- Paste into the SQL editor and run. Every check prints a NOTICE when it
-- holds and raises an EXCEPTION the moment one does not. The last line must
-- be "all 10 refund checks hold" (or, if the editor may not switch roles,
-- "checks 1-6 and 10 hold, 7-9 SKIPPED").
--
-- ⚠ Leaves nothing behind: one transaction, ends in ROLLBACK.
-- ⚠ A refusal only counts with its REAL error code (42501 =
--   insufficient_privilege). Any other error is a failed test, not a pass —
--   otherwise a typo here would look like a lock that holds.

begin;

do $$
declare
  u     uuid := gen_random_uuid();
  a     integer;
  p     integer;
  n     integer;
  state text;
  as_role boolean := true;
begin
  insert into auth.users (id, email, aud, role)
  values (u, 'refund-test-' || u || '@example.invalid', 'authenticated', 'authenticated');

  -- 5 purchased + an allowance of 3, then spend 4 under one job ref:
  -- 3 from the expiring allowance, 1 from purchased.
  perform public.credits_grant(u, 5, 'purchase', 'txn-refund-test');
  perform public.credits_set_allowance(u, 3, 'sub-refund-test');
  perform public.credits_spend(u, 4, 'job-R1');
  select allowance, purchased into a, p from public.credits_balance where user_id = u;
  if a <> 0 or p <> 4 then
    raise exception 'FAIL 1: setup expected allowance 0, purchased 4, got %, %', a, p;
  end if;
  raise notice 'ok 1 - setup: spend took allowance first';

  -- The refund gives each bucket back what it lost there.
  n := public.credits_refund(u, 'job-R1');
  select allowance, purchased into a, p from public.credits_balance where user_id = u;
  if n <> 4 or a <> 3 or p <> 5 then
    raise exception 'FAIL 2: expected 4 back as allowance 3 / purchased 5, got % back, %, %', n, a, p;
  end if;
  raise notice 'ok 2 - refund restores each bucket exactly (no expiring credits turned permanent)';

  -- Twice is once.
  n := public.credits_refund(u, 'job-R1');
  select allowance, purchased into a, p from public.credits_balance where user_id = u;
  if n <> 0 or a <> 3 or p <> 5 then
    raise exception 'FAIL 3: second refund changed something: % back, %, %', n, a, p;
  end if;
  raise notice 'ok 3 - a second refund of the same job books nothing';

  -- A ref that was never spent gives nothing.
  n := public.credits_refund(u, 'job-never-spent');
  if n <> 0 then
    raise exception 'FAIL 4: refund of an unknown ref returned %', n;
  end if;
  raise notice 'ok 4 - unknown job: nothing to refund';

  -- Empty ref is refused outright (would otherwise match nothing silently).
  begin
    perform public.credits_refund(u, '');
    raise exception 'FAIL 5: empty ref was accepted';
  exception when raise_exception then
    if sqlerrm like 'FAIL 5%' then raise; end if;
  end;
  raise notice 'ok 5 - empty ref refused';

  -- Ledger and balance still agree after all of it.
  if exists (
    select 1
      from public.credits_balance b
      join (select user_id,
                   coalesce(sum(delta) filter (where bucket = 'purchased'), 0) as purchased,
                   coalesce(sum(delta) filter (where bucket = 'allowance'), 0) as allowance
              from public.credits_ledger group by user_id) l on l.user_id = b.user_id
     where b.user_id = u and (b.purchased <> l.purchased or b.allowance <> l.allowance)
  ) then
    raise exception 'FAIL 6: ledger and balance disagree';
  end if;
  raise notice 'ok 6 - ledger and balance agree';

  -- ── As the server role, the way server.js does it (withUser) ──────────
  -- In Supabase the SQL editor's `postgres` is not a superuser; since
  -- Postgres 16 it may not SET ROLE into a role it created unless granted.
  -- Then 7-9 are reported as SKIPPED (never as passed) — check 10 still
  -- proves the grants from the catalog, and the live path is exercised by
  -- server.js itself.
  begin
    execute 'set local role dreamrushes_server';
  exception when insufficient_privilege then
    as_role := false;
    raise notice 'SKIP 7-9 - this editor may not switch to dreamrushes_server (%); grants are checked in 10', sqlerrm;
  end;

  if as_role then
  perform set_config('request.jwt.claims', json_build_object('sub', u)::text, true);

  perform public.server_spend(2, 'job-R2', null);
  n := public.server_refund('job-R2');
  if n <> 2 then
    raise exception 'FAIL 7: server_refund returned % instead of 2', n;
  end if;
  raise notice 'ok 7 - server role: server_spend then server_refund gives the 2 back';

  -- The role must NOT reach credits_refund directly (takes any person).
  begin
    perform public.credits_refund(u, 'job-R2');
    raise exception 'FAIL 8: server role could call credits_refund';
  exception
    when insufficient_privilege then null;   -- 42501: the lock holds
    when others then
      get stacked diagnostics state = returned_sqlstate;
      raise exception 'FAIL 8: expected 42501, got % (%)', state, sqlerrm;
  end;
  raise notice 'ok 8 - server role is refused credits_refund with 42501';

  -- Without a declared person, server_refund refuses (fail closed).
  perform set_config('request.jwt.claims', '', true);
  begin
    perform public.server_refund('job-R2');
    raise exception 'FAIL 9: server_refund ran without a declared person';
  exception
    when insufficient_privilege then null;
    when others then
      get stacked diagnostics state = returned_sqlstate;
      raise exception 'FAIL 9: expected 42501, got % (%)', state, sqlerrm;
  end;
  raise notice 'ok 9 - server_refund without a person: 42501';

  execute 'reset role';
  end if;

  -- ── Who may call what (the catalog, not a guess) ─────────────────────
  -- anon and authenticated: no money function at all. dreamrushes_server:
  -- exactly the four server_* wrappers, none of the credits_* functions.
  select string_agg(r.rolname || ' -> ' || p.proname, ', ' order by r.rolname, p.proname)
    into state
    from pg_proc p
    cross join pg_roles r
   where p.pronamespace = 'public'::regnamespace
     and (p.proname like 'credits\_%' or p.proname in ('server_spend', 'server_grant', 'server_set_allowance', 'server_refund'))
     and has_function_privilege(r.oid, p.oid, 'EXECUTE')
     and (r.rolname in ('anon', 'authenticated')
          or (r.rolname = 'dreamrushes_server' and p.proname like 'credits\_%')
          or (r.rolname = 'dreamrushes_server' and p.proname not like 'server\_%'));
  if state is not null then
    raise exception 'FAIL 10: these may call a money function and must not: %', state;
  end if;
  if not has_function_privilege('dreamrushes_server', 'public.server_spend(integer, text, text)', 'EXECUTE')
     or not has_function_privilege('dreamrushes_server', 'public.server_refund(text)', 'EXECUTE') then
    raise exception 'FAIL 10: dreamrushes_server lost server_spend or server_refund';
  end if;
  raise notice 'ok 10 - anon/authenticated reach no money function, the server role only its wrappers';

  if as_role then
    raise notice '==== all 10 refund checks hold ====';
  else
    raise notice '==== checks 1-6 and 10 hold, 7-9 SKIPPED (see above) ====';
  end if;
end;
$$;

rollback;
