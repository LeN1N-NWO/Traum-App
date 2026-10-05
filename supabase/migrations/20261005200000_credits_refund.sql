-- Dream Rushes — refunds that give back exactly what was taken (S7)
--
-- Run once, after 20260911150000_server_role.sql. Then run
-- supabase/tests/credits_refund.sql to check it (rolls itself back).
--
-- ── Why not credits_grant(…, 'refund') ──────────────────────────────────
-- credits_grant always books into `purchased`. A spend takes the expiring
-- `allowance` first, so refunding through credits_grant would turn expiring
-- credits into permanent ones. This function instead looks up the spend's
-- own ledger rows (same ref) and books each bucket back by exactly what it
-- lost there.
--
-- ── Idempotent by the existing unique index ─────────────────────────────
-- credits_ledger_no_double_booking is (user_id, reason, ref, bucket) where
-- ref is not null. A second refund for the same ref hits it per bucket and
-- books nothing (ON CONFLICT DO NOTHING) — a retried failure report cannot
-- pay out twice.
--
-- ⚠ ASCII only in strings below: the clipboard on Hanni's Mac mangles
--   non-ASCII on the way into the SQL editor (LC_CTYPE=C).

begin;

create or replace function public.credits_refund(
  p_user uuid,
  p_ref  text
) returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  r          record;
  v_refunded integer := 0;
begin
  if p_ref is null or p_ref = '' then
    raise exception 'refund needs the ref of the spend';
  end if;

  -- Same lock as credits_spend: a refund and a spend for the same person
  -- queue instead of interleaving.
  perform 1 from public.credits_balance where user_id = p_user for update;
  if not found then
    raise exception 'no balance row for %', p_user using errcode = 'no_data_found';
  end if;

  for r in
    select bucket, -sum(delta)::integer as amount
      from public.credits_ledger
     where user_id = p_user and ref = p_ref and reason = 'spend'
     group by bucket
  loop
    continue when r.amount <= 0;

    insert into public.credits_ledger (user_id, bucket, delta, reason, ref, note)
    values (p_user, r.bucket, r.amount, 'refund', p_ref, null)
    on conflict (user_id, reason, ref, bucket) where ref is not null do nothing;

    -- FOUND is false when the index said "already refunded": book nothing.
    if found then
      update public.credits_balance
         set allowance  = allowance + case when r.bucket = 'allowance' then r.amount else 0 end,
             purchased  = purchased + case when r.bucket = 'purchased' then r.amount else 0 end,
             updated_at = now()
       where user_id = p_user;
      v_refunded := v_refunded + r.amount;
    end if;
  end loop;

  -- How much came back now: 0 = nothing was spent under this ref, or it was
  -- refunded before.
  return v_refunded;
end;
$$;

-- Same narrowing as server_spend: no person as argument, only the one
-- server.js declared for this transaction (withUser in src/lib/db.js).
create or replace function public.server_refund(
  p_ref text
) returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'no acting user - set request.jwt.claims first'
      using errcode = 'insufficient_privilege';
  end if;
  return public.credits_refund(v_user, p_ref);
end;
$$;

-- ⚠⚠ Who may call the money functions — ALL of them, old ones included.
--   Supabase grants EXECUTE on new functions in `public` directly to anon
--   and authenticated (default privileges). `revoke ... from public` does
--   NOT take those away. The migrations of 11.09. revoked only from public;
--   if those default grants exist, a signed-in person holding the project's
--   anon key could call server_grant(.., 'purchase') through the Supabase
--   API and mint credits for themselves. The later migrations (23.09.,
--   03.10.) already revoke from anon and authenticated; this one closes the
--   older functions too. Harmless if the grants were never there.
--   Nobody legitimate calls these as anon/authenticated: the app talks only
--   to server.js, and server.js uses the role dreamrushes_server.
revoke all on function public.credits_spend(uuid, integer, text, text)                    from public, anon, authenticated;
revoke all on function public.credits_grant(uuid, integer, public.credit_reason, text, text) from public, anon, authenticated;
revoke all on function public.credits_set_allowance(uuid, integer, text)                   from public, anon, authenticated;
revoke all on function public.credits_refund(uuid, text)                                    from public, anon, authenticated;
revoke all on function public.server_spend(integer, text, text)                            from public, anon, authenticated;
revoke all on function public.server_grant(integer, public.credit_reason, text)            from public, anon, authenticated;
revoke all on function public.server_set_allowance(integer, text)                          from public, anon, authenticated;
revoke all on function public.server_refund(text)                                           from public, anon, authenticated;

grant execute on function public.server_refund(text) to dreamrushes_server;
-- credits_refund takes a person as argument: NOT for the server role (the
-- same rule as credits_spend, which it may not call either). Like the
-- other credits_* functions it stays callable by service_role only.
grant execute on function public.credits_refund(uuid, text) to service_role;

commit;
