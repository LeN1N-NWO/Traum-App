für: Anton, LeN1N-NWO

Hallo Anton — Rückmeldung zu deiner Übergabe
`2026-09-23-hanni-konto-loeschung-appstore.md`, Punkt 1. Die Migration läuft
jetzt, aber nicht in der Fassung, die in PR #54 kam. Kurz, was war und was
du tun musst (fast nichts).

## Der Fehler: die Rolle heißt nicht `server_role`

Die letzte Zeile deiner Migration war

    grant execute on function public.server_delete_account() to server_role;

Die Rolle von server.js heißt aber **`dreamrushes_server`** —
`server_role.sql` ist nur der Dateiname. So hätte die Migration mit
„role "server_role" does not exist" abgebrochen; wäre die Funktion trotzdem
entstanden, hätte der Server beim Löschen `42501` (keine Berechtigung)
bekommen statt 503.

Ich habe sie vor dem Ausführen korrigiert. Diese Fassung läuft in der
Datenbank, und genau sie steht jetzt auch im Repo (PR #55, Code Zeile für
Zeile gleich mit dem, was lief):

- Rolle `dreamrushes_server` statt `server_role`
- `revoke … from public, anon, authenticated` — anon/authenticated
  ausdrücklich, damit die Funktion nie über die Supabase-API erreichbar ist
- in `begin; … commit;` wie server_role.sql — bricht etwas ab, bleibt keine
  halbe Funktion ohne Rechte liegen

**Für dich:** Bitte nichts an der Datei ändern, und nichts davon noch einmal
ausführen — ist erledigt. Nur als Lehre fürs nächste Mal: Rollennamen aus
`server_role.sql` (`create role …`) nehmen, nicht aus dem Dateinamen.

## Was belegt ist (23.09. abends, SQL-Editor)

- **Rechte:** `has_function_privilege` — nur `dreamrushes_server` darf,
  `anon`, `authenticated`, `service_role` nicht. Nebenbei geprüft: die drei
  `server_*`- und drei `credits_*`-Funktionen sind ebenfalls richtig
  verteilt, anon/authenticated dürfen keine davon.
- **Fail closed:** Aufruf ohne erklärten Nutzer →
  `42501: no acting user — set request.jwt.claims first`, ausgelöst vom
  RAISE in der Funktion (nicht von einem fehlenden Recht).
- **Löschen:** Wegwerf-Konto mit Traum und Guthaben, vorher je 1 Zeile in
  auth.users, auth.identities, profiles, dreams, credits_balance,
  credits_ledger; nach dem Aufruf mit erklärtem Nutzer überall 0 (gezählt
  nach ID, nicht nach E-Mail).

Noch nicht getestet: der Weg durch die App und `DELETE /api/account` samt
401 danach. Das machen wir, jetzt wo PR #54 auf main ist — mit
`pod install` wegen expo-local-authentication und expo-iap.

## Offen, aber nicht jetzt

Erzeugte Filme und Bilder bleiben nach einer Löschung auf der Platte liegen
(dein Kommentar am Endpunkt sagt es selbst). Vor den ersten echten Nutzern
muss das geklärt sein — Apple 5.1.1(v) und DSGVO meinen die Daten, nicht nur
die Zeilen.

## Deine anderen Punkte

- **Bundle-ID:** entschieden, `com.dreamrushes.app` ist im Developer Portal
  registriert. Bitte dein lokales Xcode-Projekt darauf umstellen.
- **Einzelperson vs. Organisation:** vorerst Einzelperson; Wechsel auf
  Organisation, sobald die UG gegründet ist — erst danach kommen echte,
  zahlende Nutzer.
- StoreKit-Produkte, Sandbox-Tester, Geld-Setup: kommen, noch nicht
  angefangen.

Hanni

## Nachtrag 21:40 — Apple-Token-Widerruf (gilt für dich ab dem Merge)

Apple verlangt beim Löschen eines „Mit Apple anmelden"-Kontos, dass die
Apple-Token widerrufen werden; Supabase tut das nicht. Jetzt gebaut
(`src/lib/apple-revoke.js`, am iPhone belegt): Beim Löschen eines
Apple-Kontos antwortet der Server 409, die App öffnet Apples Blatt noch
einmal, der Server widerruft mit dem frischen Code und löscht erst danach.

**Für dich wichtig:** Der Server braucht dafür einen Sign-in-with-Apple-
Schlüssel (`APPLE_TEAM_ID`, `APPLE_SIGNIN_KEY_ID`, `APPLE_SIGNIN_KEY`, siehe
`.env.example`). Den hat nur Hannis `.env`. **Auf deinem Mac meldet der
Server beim Start „Apple-Widerruf: nicht konfiguriert", und Apple-Konten
lassen sich dort nicht löschen (503).** Das ist Absicht — lieber nicht
löschen als ohne Widerruf. Konten mit E-Mail/Passwort betrifft es nicht.

Und eine Bitte zu deinem Stand vom 23.09. (`26c4efb`): B5, B7 und
`NSFaceIDUsageDescription` stehen nur in deinem lokalen `mobile/ios`, nicht in
`app.json` — in Hannis Bau (und damit TestFlight) fehlen sie. Das ziehen wir
nach `app.json` (Hannis Datei); bitte dort nichts mehr von Hand ins
Xcode-Projekt, was auch im Bau der anderen landen muss.
