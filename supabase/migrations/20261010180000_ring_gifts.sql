-- Ring-Geschenke ins Konto (Hanni 10.10.2026, Antons Übergabe
-- docs/uebergabe/2026-10-10-hanni-server-aufnahmen-geschenke.md, Teil 2).
--
-- Ein neuer Buchungsgrund 'gift': POST /api/gifts/claim bucht bei 24, 36
-- und 48 Träumen 16, 32 und 50 Credits — nur für Menschen, die schon gekauft
-- haben (src/lib/ringGifts.js). Topf: `purchased`, weil `allowance` beim
-- Abo-Monatswechsel GESETZT wird und ein Geschenk dort verschwände.
-- Doppelt gebucht wird nie: Ledger-Kennung 'ring-gift-<platz>', der
-- Unique-Index credits_ledger_no_double_booking fängt jede Wiederholung.
--
-- Geändert werden NUR die beiden Erlaubnislisten — der Rest beider
-- Funktionen ist Wort für Wort der Stand aus 20260911130000_initial_schema
-- und 20260911150000_server_role. `create or replace` behält Besitzer und
-- Rechte; die revoke/grant-Zeilen unten sagen es trotzdem noch einmal,
-- damit niemand in der Datei suchen muss (20261005200000_credits_refund
-- hat anon/authenticated die Rechte entzogen — das bleibt so).
--
-- ⚠ `alter type … add value` steht VOR dem begin: Ein neuer Enum-Wert darf
--   in derselben Transaktion nicht benutzt werden, in der er entsteht.

alter type public.credit_reason add value if not exists 'gift';

begin;

create or replace function public.credits_grant(
  p_user   uuid,
  p_amount integer,
  p_reason public.credit_reason,
  p_ref    text default null,
  p_note   text default null
) returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_total integer;
begin
  if p_amount is null or p_amount <= 0 then
    raise exception 'amount must be positive, got %', p_amount;
  end if;
  -- ⚠⚠ Do NOT use this for refunds of a spend — see credits_refund().
  if p_reason not in ('welcome_grant', 'purchase', 'refund', 'adjustment', 'gift') then
    raise exception 'reason % does not add to the purchased bucket', p_reason;
  end if;

  insert into public.credits_ledger (user_id, bucket, delta, reason, ref, note)
  values (p_user, 'purchased', p_amount, p_reason, p_ref, p_note);

  update public.credits_balance
     set purchased = purchased + p_amount,
         updated_at = now()
   where user_id = p_user
  returning purchased + allowance into v_total;

  if not found then
    raise exception 'no balance row for %', p_user using errcode = 'no_data_found';
  end if;

  return v_total;
end;
$$;

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
  if p_reason not in ('welcome_grant', 'purchase', 'gift') then
    raise exception 'server may not grant for reason %', p_reason
      using errcode = 'insufficient_privilege';
  end if;
  return public.credits_grant(v_user, p_amount, p_reason, p_ref, null);
end;
$$;

revoke all on function public.credits_grant(uuid, integer, public.credit_reason, text, text) from public, anon, authenticated;
grant execute on function public.credits_grant(uuid, integer, public.credit_reason, text, text) to service_role;
revoke all on function public.server_grant(integer, public.credit_reason, text) from public, anon, authenticated;
grant execute on function public.server_grant(integer, public.credit_reason, text) to dreamrushes_server;

commit;

-- ── Prüfen nach dem Einspielen (im SQL-Editor, einzeln) ─────────────────
-- 1. Der Wert ist da:
--      select 'gift'::public.credit_reason;                         → gift
-- 2. Nur der Server darf schenken, niemand sonst — erwartet: nur
--    dreamrushes_server (und der Besitzer postgres) mit EXECUTE:
--      select grantee, privilege_type from information_schema.routine_privileges
--       where routine_name = 'server_grant';
-- 3. anon/authenticated dürfen credits_grant nicht rufen — erwartet: false, false:
--      select has_function_privilege('anon', 'public.credits_grant(uuid, integer, public.credit_reason, text, text)', 'execute'),
--             has_function_privilege('authenticated', 'public.credits_grant(uuid, integer, public.credit_reason, text, text)', 'execute');
