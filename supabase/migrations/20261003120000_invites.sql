-- Freunde einladen — die Server-Seite (03.10.2026, Hanni).
--
-- Vertrag: docs/uebergabe/2026-09-14-hanni-codes-einladungen.md (Nachtrag
-- 03.10.); gemeinsame Regeln (Code-Format, Prämie) in src/lib/invites.js.
-- Die App ruft GET /api/invite und POST /api/invite/connect; server.js
-- spricht mit dieser Datenbank nur über die drei Funktionen unten.
--
-- Was hier NICHT passiert: Prämien. Ein Freund wird erst „bought", wenn ein
-- echter App-Store-Kauf geprüft ist (B1, noch nicht gebaut), und „rewarded"
-- 14 Tage danach ohne Erstattung. Die Spalten dafür stehen schon da, damit
-- das später keine Tabellenänderung braucht.
--
-- ⚠ Warum security definer: Ein Einladungscode gehört immer einem ANDEREN
-- Konto. Die Server-Rolle sieht dank RLS nur die Zeilen des Nutzers, für den
-- sie gerade handelt (withUser in src/lib/db.js) — einen fremden Code
-- auflösen kann sie so nicht. Die Funktionen tun genau das, und nicht mehr:
-- jede liest den handelnden Nutzer aus auth.uid() und verweigert ohne ihn.
-- Auf die Tabellen selbst darf niemand direkt — RLS ist an, Regeln gibt es
-- keine.

begin;

create type public.invite_status as enum ('joined', 'bought', 'rewarded', 'rejected');

-- Ein Code je Konto. Das Alphabet ist CODE_ALPHABET aus src/lib/invites.js
-- (ohne 0/O, 1/I/L); erzeugt wird er in server.js, hier nur geprüft.
create table public.invite_codes (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  code        text not null unique
              check (code ~ '^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{7}$'),
  created_at  timestamptz not null default now(),
  disabled_at timestamptz
);

-- Wer wen eingeladen hat. invitee_id ist unique: Jedes Konto kann genau
-- einmal eingeladen worden sein. Löscht einer sein Konto, verschwindet die
-- Zeile mit (Löschrecht).
create table public.invite_redemptions (
  id            uuid primary key default gen_random_uuid(),
  referrer_id   uuid not null references auth.users (id) on delete cascade,
  invitee_id    uuid not null unique references auth.users (id) on delete cascade,
  status        public.invite_status not null default 'joined',
  reject_reason text,
  -- Ab B1 (Kaufprüfung): plan.id aus src/lib/plans.js, Apple-Transaktion.
  product       text,
  purchase_tx   text unique,
  purchased_at  timestamptz,
  rewarded_at   timestamptz,
  created_at    timestamptz not null default now(),
  check (referrer_id <> invitee_id)
);
create index invite_redemptions_referrer on public.invite_redemptions (referrer_id, created_at desc);

alter table public.invite_codes       enable row level security;
alter table public.invite_redemptions enable row level security;
revoke all on public.invite_codes, public.invite_redemptions from public, anon, authenticated;

-- ─────────────────────────────────────────────────────────────────────────
-- Der eigene Code. Hat das Konto schon einen, kommt der zurück. Sonst wird
-- p_candidate (von server.js zufällig erzeugt) eingetragen. Ist der zufällig
-- schon vergeben, kommt null zurück — server.js versucht es mit einem neuen.
create or replace function public.server_invite_code(p_candidate text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_code text;
begin
  if v_user is null then
    raise exception 'no acting user — set request.jwt.claims first'
      using errcode = 'insufficient_privilege';
  end if;
  select code into v_code from public.invite_codes where user_id = v_user;
  if v_code is not null then
    return v_code;
  end if;
  insert into public.invite_codes (user_id, code) values (v_user, p_candidate)
    on conflict do nothing;   -- user_id (gleichzeitiger Aufruf) oder code (Zufall)
  select code into v_code from public.invite_codes where user_id = v_user;
  return v_code;              -- null nur bei Code-Kollision
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- Den handelnden Nutzer mit dem Konto hinter p_code verbinden.
-- Antwort: 'ok' | 'unknown' | 'own' | 'already'. Der Code schaltet beim
-- Eingeladenen nichts frei (Apple 3.1.1) — es entsteht nur diese Zeile.
create or replace function public.server_invite_connect(p_code text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user     uuid := auth.uid();
  v_referrer uuid;
  v_id       uuid;
begin
  if v_user is null then
    raise exception 'no acting user — set request.jwt.claims first'
      using errcode = 'insufficient_privilege';
  end if;
  select user_id into v_referrer from public.invite_codes
    where code = p_code and disabled_at is null;
  if v_referrer is null then
    return 'unknown';
  end if;
  if v_referrer = v_user then
    return 'own';
  end if;
  insert into public.invite_redemptions (referrer_id, invitee_id)
    values (v_referrer, v_user)
    on conflict (invitee_id) do nothing
    returning id into v_id;
  if v_id is null then
    return 'already';
  end if;
  return 'ok';
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- Was die Einladungs-Seite zeigt: ist dieses Konto selbst eingeladen worden,
-- wie viele Prämien gab es diesen Monat, und wer wurde eingeladen — mit dem
-- Anzeigenamen des Freundes (sonst nichts von ihm). Die Prämie in Träumen
-- und das Auszahldatum rechnet server.js mit src/lib/invites.js.
create or replace function public.server_invite_overview()
returns jsonb
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
  return jsonb_build_object(
    'connected', exists (select 1 from public.invite_redemptions where invitee_id = v_user),
    'rewardsThisMonth', (
      select count(*) from public.invite_redemptions
       where referrer_id = v_user and status = 'rewarded'
         and rewarded_at >= date_trunc('month', now())),
    'referrals', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', r.id,
               'name', p.display_name,
               'status', r.status,
               'product', r.product,
               'purchasedAt', r.purchased_at)
             order by r.created_at desc)
        from public.invite_redemptions r
        left join public.profiles p on p.id = r.invitee_id
       where r.referrer_id = v_user), '[]'::jsonb));
end;
$$;

revoke all on function public.server_invite_code(text)    from public, anon, authenticated;
revoke all on function public.server_invite_connect(text) from public, anon, authenticated;
revoke all on function public.server_invite_overview()    from public, anon, authenticated;
grant execute on function public.server_invite_code(text)    to dreamrushes_server;
grant execute on function public.server_invite_connect(text) to dreamrushes_server;
grant execute on function public.server_invite_overview()    to dreamrushes_server;

commit;
