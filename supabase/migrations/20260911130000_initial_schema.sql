-- Dream Rushes — initial schema (ADR-0005)
--
-- Run once against a fresh project. Region: eu-central-1 (Frankfurt).
--
-- ── The one idea this file is built around ───────────────────────────────
-- A credit balance is bookkeeping, and bookkeeping has two parts that must
-- never disagree: a LEDGER that says what happened, and a BALANCE that says
-- where we stand. Keeping only the ledger makes every check a SUM over the
-- whole history and, worse, impossible to lock — you cannot take a row lock
-- on an aggregate, so two requests can both read "enough" and both spend.
-- Keeping only the balance loses the answer to "where did that credit go".
--
-- So: both, written in one transaction, with CHECK (>= 0) on the balance.
-- That makes an overdraft IMPOSSIBLE rather than merely checked — the
-- database refuses the write, whatever the application believes.
--
-- ⚠ src/lib/credits.js is the source of truth for the RULES modelled here,
--   and it explains why there are two buckets (Antons Frage, 16.08.2026):
--
--     allowance — comes from a subscription, is SET at the start of each
--                 period, never added. Does not roll over.
--     purchased — comes from packs and the welcome grant. Stays, even when
--                 a subscription ends.
--
--   Spending always takes from allowance FIRST: it is the one that expires
--   anyway, and the other order would quietly consume exactly the credits
--   someone paid extra for. `credits_spend()` below implements that, and it
--   is the only place that may.
--
-- ⚠ Nothing here touches the prompt chain or image generation. Prices are
--   NOT stored in the database — they live in src/lib/plans.js and reach
--   this schema only as the `cost` argument of a spend.

begin;

-- ─────────────────────────────────────────────────────────────────────────
-- 1. Profiles — everything about a person that is not a credential
-- ─────────────────────────────────────────────────────────────────────────
-- Supabase owns `auth.users`. We never write there; this table hangs off it
-- and dies with it (`on delete cascade` — that cascade IS the deletion right
-- from docs/plans/2026-08-20-recht-einwilligung.md, so it must stay).

create table public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  display_name  text,
  -- Chosen once before anything else happens (LanguagePicker.jsx).
  language      text,
  -- The assistant's voice — a Gemini voice id, not a secret.
  voice         text,
  onboarded     boolean     not null default false,
  survey_done   boolean     not null default false,
  -- The whole survey result as OnboardingSurvey delivers it. jsonb because
  -- new fields must not mean a migration — the shape is the client's.
  -- ⚠ reminders in here is a WISH, never a permission (lib/reminders.js).
  survey        jsonb,
  streak        integer     not null default 0 check (streak >= 0),
  -- A DATE, not a dream text. The field name in the client (`lastDream`)
  -- suggests otherwise and has misled once already.
  last_dream_on date,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.profiles is
  'Per-person settings. Credentials stay in auth.users; reference photos never land here.';

-- ─────────────────────────────────────────────────────────────────────────
-- 2. Dreams — the journal
-- ─────────────────────────────────────────────────────────────────────────
-- Fields follow the positive list in src/lib/journalBackup.js. That list is
-- deliberate: "Kommt morgen ein Feld dazu, das ein Foto enthält, wandert es
-- sonst still mit." The same rule applies here — no column takes an image.

create table public.dreams (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid        not null references auth.users (id) on delete cascade,
  -- The id the client generated (e.g. "e_mtvpt7c4qiu4mq"). Kept so that
  -- migrating a local journal is idempotent and re-runnable.
  client_id     text        not null,
  kind          text        not null default 'dream',
  title         text        not null default '',
  tagline       text        not null default '',
  text          text        not null default '',
  original_text text        not null default '',
  analysis      jsonb,
  reflection    jsonb,
  style         text,
  format        text,
  mode          text,
  image_count   integer     check (image_count >= 0),
  creature_id   text,
  -- Only the @tags and their category — never the pictures behind them.
  "references"  jsonb       not null default '[]'::jsonb,
  -- Paths, not data. The files live in storage; a later migration moves
  -- them behind signed URLs (findings S2/S3 in docs/ARCHITEKTUR.md).
  media         jsonb       not null default '{}'::jsonb,
  created_at    timestamptz not null default now(),
  edited_at     timestamptz,
  unique (user_id, client_id)
);

create index dreams_user_created_idx
  on public.dreams (user_id, created_at desc);

comment on table public.dreams is
  'The journal. Append-and-edit; deleting a row is the person''s own right.';

-- ─────────────────────────────────────────────────────────────────────────
-- 3. Credits — balance and ledger
-- ─────────────────────────────────────────────────────────────────────────

create type public.credit_reason as enum (
  'welcome_grant',        -- one-time, flagged so it never repeats
  'purchase',             -- a credit pack, validated against the store
  'subscription_refill',  -- period start: allowance is SET, not added
  'subscription_expire',  -- period end or cancellation: allowance to zero
  'spend',                -- a render was paid for
  'refund',               -- a render failed after the money was taken
  'adjustment'            -- by hand, with a reason in `note`
);

create table public.credits_balance (
  user_id   uuid        primary key references auth.users (id) on delete cascade,
  -- Two buckets, two floors. The CHECKs are what make an overdraft
  -- impossible rather than merely unlikely.
  purchased integer     not null default 0 check (purchased >= 0),
  allowance integer     not null default 0 check (allowance >= 0),
  updated_at timestamptz not null default now()
);

comment on table public.credits_balance is
  'Where we stand. One lockable row per person — the ledger says how we got here.';

create table public.credits_ledger (
  id         bigint      generated always as identity primary key,
  user_id    uuid        not null references auth.users (id) on delete cascade,
  bucket     text        not null check (bucket in ('purchased', 'allowance')),
  -- Signed. Never zero: a booking that changes nothing is a bug, not a row.
  delta      integer     not null check (delta <> 0),
  reason     public.credit_reason not null,
  -- What this booking belongs to: a job id, a store transaction id.
  ref        text,
  note       text,
  created_at timestamptz not null default now()
);

create index credits_ledger_user_idx
  on public.credits_ledger (user_id, created_at desc);

-- ⚠⚠ The line that stops a double credit. A store webhook may arrive twice
--    — retries are normal, not exceptional — and without this the same
--    purchase pays out twice. Partial, because only bookings that carry an
--    external reference can be duplicates.
--
-- ⚠ `bucket` MUST be part of the key (found while writing the tests,
--   11.09.2026). One spend that draws from both buckets writes TWO rows
--   with the same reason and ref — 3 from allowance, 1 from purchased.
--   Keyed on (user_id, reason, ref) alone, the second row looked like a
--   duplicate and every mixed spend failed: the first subscriber who also
--   bought a pack could never render anything. A purchase always lands in
--   one bucket, so it is still caught; and a retried spend of the same job
--   into the same bucket is caught too, which keeps a retry from charging
--   twice.
create unique index credits_ledger_no_double_booking
  on public.credits_ledger (user_id, reason, ref, bucket)
  where ref is not null;

comment on table public.credits_ledger is
  'Append-only. How we got here. Never updated, never deleted — not even by us.';

-- ─────────────────────────────────────────────────────────────────────────
-- 4. The only ways credits may move
-- ─────────────────────────────────────────────────────────────────────────
-- security definer: these run with the owner's rights, so the RLS policies
-- below can forbid every direct write to the credit tables. Even a leaked
-- anon key cannot mint a credit — it can only ask these functions, and they
-- decide. `set search_path = ''` keeps a caller from shadowing our names.

create or replace function public.credits_spend(
  p_user   uuid,
  p_cost   integer,
  p_ref    text default null,
  p_note   text default null
) returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_allowance integer;
  v_purchased integer;
  v_from_allowance integer;
  v_from_purchased integer;
begin
  if p_cost is null or p_cost <= 0 then
    raise exception 'cost must be positive, got %', p_cost;
  end if;

  -- FOR UPDATE takes the row lock. Two requests for the same person now
  -- queue instead of both reading "enough" and both spending it.
  select allowance, purchased into v_allowance, v_purchased
    from public.credits_balance
   where user_id = p_user
     for update;

  if not found then
    raise exception 'no balance row for %', p_user using errcode = 'no_data_found';
  end if;

  if v_allowance + v_purchased < p_cost then
    raise exception 'insufficient credits: have %, need %',
      v_allowance + v_purchased, p_cost using errcode = 'check_violation';
  end if;

  -- The expiring bucket first — see the header, and credits.js.
  v_from_allowance := least(v_allowance, p_cost);
  v_from_purchased := p_cost - v_from_allowance;

  update public.credits_balance
     set allowance = allowance - v_from_allowance,
         purchased = purchased - v_from_purchased,
         updated_at = now()
   where user_id = p_user;

  -- One row per bucket touched, so the ledger can always be re-summed.
  if v_from_allowance > 0 then
    insert into public.credits_ledger (user_id, bucket, delta, reason, ref, note)
    values (p_user, 'allowance', -v_from_allowance, 'spend', p_ref, p_note);
  end if;
  if v_from_purchased > 0 then
    insert into public.credits_ledger (user_id, bucket, delta, reason, ref, note)
    values (p_user, 'purchased', -v_from_purchased, 'spend', p_ref, p_note);
  end if;

  return v_allowance + v_purchased - p_cost;
end;
$$;

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
  if p_reason not in ('welcome_grant', 'purchase', 'refund', 'adjustment') then
    raise exception 'reason % does not add to the purchased bucket', p_reason;
  end if;

  -- The unique index does the real work here: a webhook that arrives twice
  -- hits it and this whole call rolls back, having paid out once.
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

-- ⚠ SETS the allowance, never adds to it. plans.js: "does not roll over" —
--   the yearly billing depends on that, and purchased credits stay untouched
--   because they do not belong to the subscription.
create or replace function public.credits_set_allowance(
  p_user   uuid,
  p_amount integer,
  p_ref    text default null
) returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_old   integer;
  v_delta integer;
  v_total integer;
begin
  if p_amount is null or p_amount < 0 then
    raise exception 'allowance must not be negative, got %', p_amount;
  end if;

  select allowance into v_old
    from public.credits_balance
   where user_id = p_user
     for update;

  if not found then
    raise exception 'no balance row for %', p_user using errcode = 'no_data_found';
  end if;

  v_delta := p_amount - v_old;

  update public.credits_balance
     set allowance = p_amount,
         updated_at = now()
   where user_id = p_user
  returning purchased + allowance into v_total;

  -- A refill that changes nothing writes nothing: delta <> 0 is a CHECK.
  if v_delta <> 0 then
    insert into public.credits_ledger (user_id, bucket, delta, reason, ref)
    values (
      p_user, 'allowance', v_delta,
      (case when v_delta > 0 then 'subscription_refill'
            else 'subscription_expire' end)::public.credit_reason,
      p_ref
    );
  end if;

  return v_total;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- 5. A new person arrives
-- ─────────────────────────────────────────────────────────────────────────
-- Profile and balance row are created by the database, not by the app. If
-- the app had to remember, one forgotten path would leave someone without a
-- balance row — and every spend would fail with "no balance row" much later,
-- somewhere else entirely.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id);
  insert into public.credits_balance (user_id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- The welcome grant is NOT given here. It is earned by finishing the survey
-- (credits.js: "that is what earns the grant"), so the server books it when
-- that happens — via credits_grant(..., 'welcome_grant'), where the unique
-- index guarantees it can never repeat.

-- ─────────────────────────────────────────────────────────────────────────
-- 6. Row Level Security
-- ─────────────────────────────────────────────────────────────────────────
-- On for every table, without exception. A table without RLS is an open
-- record (ADR-0005).

alter table public.profiles        enable row level security;
alter table public.dreams          enable row level security;
alter table public.credits_balance enable row level security;
alter table public.credits_ledger  enable row level security;

create policy "own profile: read"   on public.profiles
  for select using ((select auth.uid()) = id);
create policy "own profile: update" on public.profiles
  for update using ((select auth.uid()) = id)
          with check ((select auth.uid()) = id);

create policy "own dreams: read"   on public.dreams
  for select using ((select auth.uid()) = user_id);
create policy "own dreams: write"  on public.dreams
  for insert with check ((select auth.uid()) = user_id);
create policy "own dreams: edit"   on public.dreams
  for update using ((select auth.uid()) = user_id)
          with check ((select auth.uid()) = user_id);
create policy "own dreams: delete" on public.dreams
  for delete using ((select auth.uid()) = user_id);

-- ⚠⚠ Credits are READ-ONLY for everyone who is not the server. There is no
--    insert, update or delete policy on either table, and that is the point:
--    without a policy, RLS denies. Money moves only through the functions
--    above, which run as their owner and therefore past these policies.
create policy "own balance: read" on public.credits_balance
  for select using ((select auth.uid()) = user_id);
create policy "own ledger: read"  on public.credits_ledger
  for select using ((select auth.uid()) = user_id);

-- The functions are callable by a signed-in person; what they may do is
-- decided inside them, not by who calls.
revoke all on function public.credits_spend(uuid, integer, text, text) from public;
revoke all on function public.credits_grant(uuid, integer, public.credit_reason, text, text) from public;
revoke all on function public.credits_set_allowance(uuid, integer, text) from public;
grant execute on function public.credits_spend(uuid, integer, text, text) to service_role;
grant execute on function public.credits_grant(uuid, integer, public.credit_reason, text, text) to service_role;
grant execute on function public.credits_set_allowance(uuid, integer, text) to service_role;

commit;

-- ─────────────────────────────────────────────────────────────────────────
-- Afterwards: the one query that proves the books balance
-- ─────────────────────────────────────────────────────────────────────────
-- Ledger and balance are written together, so they must never disagree.
-- Run this after any migration or manual fix; it should return no rows.
--
--   select b.user_id, b.purchased, b.allowance,
--          coalesce(l.purchased, 0) as ledger_purchased,
--          coalesce(l.allowance, 0) as ledger_allowance
--     from public.credits_balance b
--     left join (
--       select user_id,
--              sum(delta) filter (where bucket = 'purchased') as purchased,
--              sum(delta) filter (where bucket = 'allowance') as allowance
--         from public.credits_ledger group by user_id
--     ) l on l.user_id = b.user_id
--    where b.purchased <> coalesce(l.purchased, 0)
--       or b.allowance <> coalesce(l.allowance, 0);
