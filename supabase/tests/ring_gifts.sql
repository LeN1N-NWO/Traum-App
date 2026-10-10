-- Ring-gift checks — run AFTER 20261010180000_ring_gifts.sql.
--
-- Paste into the SQL editor and run. A failing check stops with
-- "FAIL n: ...". If all hold, the script stops ON PURPOSE with an error
-- "RESULT OK - ..." (code DR000) — the editor shows no NOTICEs, but it
-- always shows an error. "Success. No rows returned" would mean the script
-- did NOT run to its end.
--
-- ⚠ Leaves nothing behind: one transaction, ends in ROLLBACK.
-- ⚠ A refusal only counts with its REAL error code (42501 =
--   insufficient_privilege, 23505 = unique_violation). Any other error is a
--   failed test, not a pass.

begin;

do $$
declare
  u       uuid := gen_random_uuid();
  p       integer;
  n       integer;
  state   text;
  as_role boolean := true;
begin
  insert into auth.users (id, email, aud, role)
  values (u, 'gift-test-' || u || '@example.invalid', 'authenticated', 'authenticated');

  -- 1. A gift lands in the permanent bucket, as reason 'gift'.
  perform public.credits_grant(u, 16, 'gift', 'ring-gift-24');
  select purchased into p from public.credits_balance where user_id = u;
  select count(*) into n from public.credits_ledger
   where user_id = u and reason = 'gift' and ref = 'ring-gift-24' and bucket = 'purchased' and delta = 16;
  if p < 16 or n <> 1 then
    raise exception 'FAIL 1: expected one gift row of 16 in purchased, got % rows, purchased %', n, p;
  end if;
  raise notice 'ok 1 - a gift is booked into purchased as reason gift';

  -- 2. The same gift twice is refused by the unique index — and pays nothing.
  begin
    perform public.credits_grant(u, 16, 'gift', 'ring-gift-24');
    raise exception 'FAIL 2: the same ring gift was booked twice';
  exception
    when unique_violation then null;   -- 23505: the index holds
    when others then
      get stacked diagnostics state = returned_sqlstate;
      raise exception 'FAIL 2: expected 23505, got % (%)', state, sqlerrm;
  end;
  select purchased into n from public.credits_balance where user_id = u;
  if n <> p then
    raise exception 'FAIL 2: balance moved on a refused double booking (% -> %)', p, n;
  end if;
  raise notice 'ok 2 - the same ring gift twice: 23505, balance unchanged';

  -- 3-4 as the server role, like server.js. If this editor may not switch
  -- roles, they are reported as SKIPPED (never as passed); 5 still proves
  -- the grants from the catalog.
  begin
    execute 'set local role dreamrushes_server';
  exception when insufficient_privilege then
    as_role := false;
    raise notice 'SKIP 3-4 - this editor may not switch to dreamrushes_server (%); grants are checked in 5', sqlerrm;
  end;

  if as_role then
  perform set_config('request.jwt.claims', json_build_object('sub', u)::text, true);

  perform public.server_grant(32, 'gift', 'ring-gift-36');
  select count(*) into n from public.credits_ledger where user_id = u and ref = 'ring-gift-36' and reason = 'gift';
  if n <> 1 then
    raise exception 'FAIL 3: server_grant gift wrote % rows instead of 1', n;
  end if;
  raise notice 'ok 3 - server role: server_grant(gift) books the gift';

  -- The list stays short: the server still may not book an adjustment.
  begin
    perform public.server_grant(1000, 'adjustment', 'gift-test-adj');
    raise exception 'FAIL 4: server role could grant an adjustment';
  exception
    when insufficient_privilege then null;   -- 42501
    when others then
      get stacked diagnostics state = returned_sqlstate;
      raise exception 'FAIL 4: expected 42501, got % (%)', state, sqlerrm;
  end;
  raise notice 'ok 4 - server_grant(adjustment) still refused with 42501';

  execute 'reset role';
  end if;

  -- 5. Who may call what (the catalog, not a guess) — same rule as in
  --    credits_refund.sql: anon/authenticated reach no money function, the
  --    server role only the server_* wrappers.
  select string_agg(r.rolname || ' -> ' || p2.proname, ', ' order by r.rolname, p2.proname)
    into state
    from pg_proc p2
    cross join pg_roles r
   where p2.pronamespace = 'public'::regnamespace
     and (p2.proname like 'credits\_%' or p2.proname in ('server_spend', 'server_grant', 'server_set_allowance', 'server_refund'))
     and has_function_privilege(r.oid, p2.oid, 'EXECUTE')
     and (r.rolname in ('anon', 'authenticated')
          or (r.rolname = 'dreamrushes_server' and p2.proname like 'credits\_%')
          or (r.rolname = 'dreamrushes_server' and p2.proname not like 'server\_%'));
  if state is not null then
    raise exception 'FAIL 5: these may call a money function and must not: %', state;
  end if;
  if not has_function_privilege('dreamrushes_server', 'public.server_grant(integer, public.credit_reason, text)', 'EXECUTE') then
    raise exception 'FAIL 5: dreamrushes_server lost server_grant';
  end if;
  raise notice 'ok 5 - anon/authenticated reach no money function, the server role only its wrappers';

  if as_role then
    raise exception 'RESULT OK - all 5 ring-gift checks hold (intentional stop, test data removed)'
      using errcode = 'DR000';
  else
    raise exception 'RESULT OK - checks 1-2 and 5 hold, 3-4 SKIPPED: editor may not switch to dreamrushes_server (intentional stop, test data removed)'
      using errcode = 'DR000';
  end if;
end;
$$;

rollback;
