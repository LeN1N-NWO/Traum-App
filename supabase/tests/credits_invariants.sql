-- Credit invariants — run AFTER the initial schema migration.
--
-- Paste into the SQL editor and run. Every check prints a NOTICE when it
-- holds and raises an EXCEPTION the moment one does not.
--
-- ⚠ Leaves nothing behind. Everything happens inside one transaction that
--   ends in ROLLBACK — the test person, their balance and every booking
--   disappear again. Safe to run against the real project, as often as you
--   like.
--
-- If the very first INSERT fails, the problem is this test's setup (the
-- shape of auth.users differs between Supabase versions), NOT the schema.

begin;

do $$
declare
  u     uuid := gen_random_uuid();
  total integer;
  a     integer;
  p     integer;
  boom  boolean;
begin
  -- A throwaway person. The trigger must create profile and balance.
  insert into auth.users (id, email, aud, role)
  values (u, 'invariant-test-' || u || '@example.invalid', 'authenticated', 'authenticated');

  if not exists (select 1 from public.profiles where id = u) then
    raise exception 'FAIL 1: trigger did not create a profile';
  end if;
  if not exists (select 1 from public.credits_balance where user_id = u) then
    raise exception 'FAIL 1: trigger did not create a balance row';
  end if;
  raise notice 'ok 1 — a new person gets profile and balance automatically';

  -- 5 purchased + an allowance of 3.
  perform public.credits_grant(u, 5, 'purchase', 'txn-A');
  perform public.credits_set_allowance(u, 3, 'sub-period-1');

  -- Spend 4. The EXPIRING bucket must go first: all 3 of the allowance,
  -- then 1 purchased — never the other way round (credits.js).
  --
  -- ⚠ This is also the test for a bug found while writing it: a spend that
  --   touches BOTH buckets writes two ledger rows with the same reason and
  --   ref. With `bucket` missing from the unique index, the second row was
  --   rejected as a duplicate and this call failed. Do not simplify this
  --   test to a single-bucket spend — that is exactly the case it guards.
  total := public.credits_spend(u, 4, 'job-1');
  select allowance, purchased into a, p from public.credits_balance where user_id = u;
  if a <> 0 or p <> 4 then
    raise exception 'FAIL 2: expected allowance 0 / purchased 4, got % / %', a, p;
  end if;
  if total <> 4 then
    raise exception 'FAIL 2: spend returned %, expected 4', total;
  end if;
  raise notice 'ok 2 — allowance is spent before purchased credits';

  -- An overdraft must be refused, and must change nothing.
  boom := false;
  begin
    perform public.credits_spend(u, 100, 'job-too-big');
  exception when others then
    boom := true;
  end;
  if not boom then
    raise exception 'FAIL 3: an overdraft went through';
  end if;
  select purchased into p from public.credits_balance where user_id = u;
  if p <> 4 then
    raise exception 'FAIL 3: refused overdraft still moved credits (purchased now %)', p;
  end if;
  raise notice 'ok 3 — an overdraft is refused and changes nothing';

  -- The same store transaction twice must pay out ONCE.
  -- Webhooks retry; that is normal, not an attack.
  boom := false;
  begin
    perform public.credits_grant(u, 5, 'purchase', 'txn-A');
  exception when unique_violation then
    boom := true;
  end;
  if not boom then
    raise exception 'FAIL 4: the same purchase was credited twice';
  end if;
  select purchased into p from public.credits_balance where user_id = u;
  if p <> 4 then
    raise exception 'FAIL 4: duplicate purchase moved credits (purchased now %)', p;
  end if;
  raise notice 'ok 4 — a repeated purchase is credited only once';

  -- A refill SETS the allowance, it does not add (plans.js: no rollover).
  perform public.credits_set_allowance(u, 10, 'sub-period-2');
  perform public.credits_set_allowance(u, 10, 'sub-period-3');
  select allowance into a from public.credits_balance where user_id = u;
  if a <> 10 then
    raise exception 'FAIL 5: allowance should be SET to 10, is %', a;
  end if;
  raise notice 'ok 5 — a refill sets the allowance instead of adding to it';

  -- The books must balance: ledger sum = balance, per bucket.
  if exists (
    select 1
      from public.credits_balance b
      join (
        select user_id,
               coalesce(sum(delta) filter (where bucket = 'purchased'), 0) as purchased,
               coalesce(sum(delta) filter (where bucket = 'allowance'), 0) as allowance
          from public.credits_ledger group by user_id
      ) l on l.user_id = b.user_id
     where b.user_id = u
       and (b.purchased <> l.purchased or b.allowance <> l.allowance)
  ) then
    raise exception 'FAIL 6: ledger and balance disagree';
  end if;
  raise notice 'ok 6 — ledger and balance agree';

  raise notice '════ all 6 invariants hold ════';
end;
$$;

rollback;
