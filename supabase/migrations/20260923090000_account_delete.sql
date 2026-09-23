-- Konto-Löschung in der App (Apple-Regel 5.1.1(v), Antons Ansage 23.09.2026):
-- Wer ein Konto anlegen kann, muss es in der App auch löschen können —
-- nicht nur abmelden.
--
-- Der Weg folgt server_role.sql: Der Server bekommt KEINE Funktion, die
-- eine Nutzerkennung als Argument nimmt (ein Bug mit falscher id löschte
-- sonst ein fremdes Konto), sondern einen Wrapper ohne Person — er handelt
-- für den, den server.js am Transaktionsbeginn erklärt hat, und verweigert,
-- wenn niemand erklärt wurde.
--
-- Gelöscht wird NUR die Zeile in auth.users. Alles andere hängt mit
-- `on delete cascade` daran (initial_schema.sql: „that cascade IS the
-- deletion right") — profiles, dreams, credits_balance, credits_ledger
-- fallen mit. Der service_role-Schlüssel bleibt, wo er hingehört: nirgends
-- (.env.example) — deshalb security definer statt Admin-API.

create or replace function public.server_delete_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
begin
  -- Fail closed: niemand erklärt, niemand gelöscht.
  if v_user is null then
    raise exception 'no acting user — set request.jwt.claims first'
      using errcode = 'insufficient_privilege';
  end if;
  delete from auth.users where id = v_user;
end;
$$;

revoke all on function public.server_delete_account() from public;
grant execute on function public.server_delete_account() to server_role;
