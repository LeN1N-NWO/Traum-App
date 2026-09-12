für: Anton, LeN1N-NWO

Hallo Anton, das Backend für die Anmeldung steht seit dem 12.09.2026. Was
fehlt, ist die Oberfläche dazu — und die liegt bei dir, weil sie in den
nativen Fluss gehört, den du gebaut hast (Onboarding, Tabs, Consent-Tor).

STAND 12.09.2026 (Hanni + Claude) — das Backend ist fertig und geprüft
  · Anmelden, Sitzung erneuern, abmelden, Konto lesen und ändern, Träume
    speichern/lesen/löschen — alles über server.js, wie gewohnt: der Client
    spricht nur mit uns, nie direkt mit Supabase (ADR-0005).
  · Der Testuser existiert in Supabase Auth. Zugangsdaten hat Hanni; sie
    stehen nirgends im Repo.
  · Die Prüfung der Sitzung ist anbieter-neutral gebaut: Sign in with Apple
    oder ein Unternehmens-Zugang später brauchen EINEN neuen Endpunkt, und
    nichts dahinter ändert sich.

DIE ENDPUNKTE (alle geben JSON zurück)

  POST /api/auth/login      {email, password}
      → 200 {ok, access_token, refresh_token, expires_in, expires_at,
             token_type, user:{id,email}}
      → 401 bei falschen Zugangsdaten (bewusst dieselbe Meldung, egal ob
            Adresse oder Passwort falsch war — alles andere verrät, welche
            Adressen ein Konto haben)
      → 429 ab dem 11. Versuch je Minute, 503 wenn nicht konfiguriert

  POST /api/auth/refresh    {refresh_token}      → wie login
  POST /api/auth/logout     Header: Authorization → {ok:true}, scheitert nie

  Alles Weitere braucht den Kopf `Authorization: Bearer <access_token>`:

  GET    /api/account       → {user, profile, credits:{purchased,allowance,total}}
  PATCH  /api/account       {display_name?, language?, voice?, onboarded?,
                             survey_done?, survey?}  → geändertes Profil
  GET    /api/dreams        → {dreams:[…]} in GENAU der Feldform, die
                              backupEntry() (src/lib/journalBackup.js) schon
                              heute erzeugt — id, createdAt, title, text,
                              analysis, references, medien …
  POST   /api/dreams/sync   {dreams:[…]} → speichert und aktualisiert in
                              einem Aufruf. Wiederholbar: derselbe Traum
                              zweimal geschickt wird aktualisiert, nicht
                              verdoppelt (Schlüssel ist die lokale `id`).
  DELETE /api/dreams?client_id=e_…  → löscht einen Traum

DIE AUFGABE
  1. Ein Anmelde-Bildschirm in `mobile/src/app/`: E-Mail, Passwort,
     „Anmelden", Fehlermeldung bei 401. Mehr nicht — kein Registrieren
     (es gibt keinen Signup-Endpunkt, absichtlich), kein Passwort-Vergessen.
  2. ⚠ Die Token gehören in den sicheren Speicher des Geräts
     (`expo-secure-store`), NICHT in AsyncStorage oder den Zustand. Das sind
     echte Zugangsdaten: wer das refresh_token hat, ist der Nutzer, bis es
     widerrufen wird.
  3. Access Token laufen ab (eine Stunde). Vor einem Aufruf, der 401 gibt:
     einmal /api/auth/refresh, dann den Aufruf wiederholen. Scheitert auch
     das, zurück zum Anmelde-Bildschirm.
  4. Abmelden ruft /api/auth/logout UND wirft die Token lokal weg. Beides,
     nicht eins von beidem: das eine macht das refresh_token bei Supabase
     ungültig, das andere räumt das Gerät auf.

WAS DU WISSEN MUSST
  · ⚠⚠ Der Server spricht noch http://, nicht https:// (Befund S6 in
    docs/ARCHITEKTUR.md). Solange das so ist, reisen Passwort und Token im
    Klartext durchs Netz. Gegen localhost und Simulator ist das gleichgültig
    — auf einem echten Gerät über WLAN nicht, und hinter eine öffentliche
    Adresse gehört die Anmeldung erst, wenn TLS davor steht.
  · Die 100 Test-Credits im Entwicklungsbau (`devTopUp` in
    journal-bridge.jsx) bleiben, wie sie sind. Der Server bucht weiterhin
    NICHT ab — /api/account zeigt das Guthaben aus der Datenbank nur an.
    Das Abbuchen ist deine andere Übergabe
    (2026-09-11-anton-credits-abbuchung.md), Punkt 2–6; sie ist jetzt nicht
    mehr durch die Anmeldung blockiert.
  · Die Träume liegen weiterhin lokal und sind dort die Wahrheit.
    /api/dreams/sync ist der Weg in die Datenbank, aber WANN die App
    synchronisiert, entscheidest du — das Backend ist darauf eingerichtet,
    dass derselbe Traum beliebig oft geschickt wird.
  · Sign in with Apple bleibt das Ziel für den Store (ADR-0005). Bau den
    Bildschirm also nicht so, dass er der einzige Weg sein kann — ein
    zweiter Knopf daneben muss später passen.

WENN DU FERTIG BIST
  Diese Datei löschen — dann hört der Hinweis auf.
