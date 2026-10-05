für: Hanni, LeN1N-NWO

# Übergabe an Hanni — Der Server holt selbst ab, sofort antworten, Push (05.10.2026, Anton + Claude)

**Antons Entscheidung (05.10.):** Der **Server** ist fürs Abholen
verantwortlich, nicht die App. Begründung und Folgen:
`docs/decisions/ADR-0010-server-holt-ab.md`. Kurz:

> Bisher musste die App den Server erst anpingen (`/api/job`), damit der
> überhaupt bei fal nachfragt. War die App Tage zu, lag der bezahlte Film so
> lange nur bei fal — ohne Haltbarkeitszusage —, und der Server erfuhr nie
> von selbst, dass etwas fertig ist, konnte also auch niemanden
> benachrichtigen. Anton: „Warum kann der Server die Abholung nicht
> triggern? Sonst warten wir zu lange, ein paar Tage." Und: Wenn die App zu
> ist, soll der Server eine Push-Mitteilung schicken.

Dein Vorschlag „sofort antworten" (Übergabe vom 05.10.,
`2026-10-05-anton-warteschlange-verwaiste-filme.md`) gehört dazu — Anton
findet ihn gut. Weil er genau die Zeilen betrifft, die du in PR #89 (S7,
Abbuchen/Erstatten) gerade umbaust, liegt er jetzt **bei dir**: nacheinander
statt parallel.

## Schon gebaut (`session/2026-10-05b-anton`)

1. **Abholer im Server** — `collectOpenJobs` in `server.js`: 5 s nach dem
   Start und dann alle 20 s; für jeden Auftrag in `media/jobs`, der nicht
   `done`/`failed` ist, ein `model` hat und jünger als drei Tage ist, ruft er
   `jobStatus(id)` — dieselbe Runde wie `/api/job`. Aus mit
   `SERVER_COLLECT=off`.
2. **Sperre je Auftrag** — `jobStatus` ist jetzt eine dünne Hülle um
   `jobStatusFetch` mit `jobInFlight` (Map id → Promise): Fragen App und
   Abholer gleichzeitig, läuft nur EIN Abholen, beide bekommen dieselbe
   Antwort (kein doppelter Download, kein doppeltes Poster).
3. **Andockstelle „fertig"** — `writeJob` merkt den Übergang offen →
   `done`/`failed` und ruft genau einmal `jobSettled(id, job)`. Die liest die
   Besitzer aus `media/besitz/auftrag/<id>/` (dein S2) und protokolliert
   heute nur: `Auftrag <id> → done (Besitzer: n) — Push folgt`. **Hier
   gehört der Push-Versand hin.** Jeder Weg läuft durch: Abholer,
   App-Nachfrage, Poster fertig, Poster-Zeitüberschreitung — und später dein
   `preparing → failed`.
4. **App-Seite Push** — `mobile/src/lib/push.ts` + `usePushRegistration()`
   im Wurzel-Layout: nach Anmeldung und bei jedem Vordergrund, wenn
   Mitteilungen erlaubt sind, `getDevicePushTokenAsync()` →
   `POST /api/push-token` `{ token, platform: "ios" }` (mit Sitzung). **Aus**,
   bis der Bau `EXPO_PUBLIC_PUSH=1` hat.

**Geprüft (lokal, 05.10.):** Probe-Auftrag in `media/jobs` auf einen schon
fertigen fal-Film, Status `pending`, App aus → Server auf eigenem Port
gestartet: nach 5 s `Server hat abgeholt … → done`, Film im Speicher,
`/api/job` danach sofort `done`; `jobSettled` meldete genau einmal, obwohl
die App danach zweimal fragte. Probe-Aufträge wieder gelöscht. 924 Tests
grün. Wirkt auf dem VPS erst nach Merge + `deploy.sh`.

## Für dich

### 1. Sofort antworten (nach oder mit S7, PR #89)

Dein Plan aus der Übergabe gilt unverändert (Prüfungen + Preis + Abbuchung
synchron, dann Auftragsnummer, `status: "preparing"`, `claimJob`, antworten;
Regie und Bestellung im Hintergrund in dieselbe Datei). Was der Abholer
dabei schon mitbringt bzw. beachten muss:

- `collectOpenJobs` überspringt Aufträge **ohne `model`** — ein
  `preparing` ohne fal-Werte wird also nicht bei fal erfragt. Gut so.
- Dein „`preparing` älter als 10 min → `failed` mit Grund" (Neustart mitten
  in der Vorbereitung) kann der Abholer gleich mit erledigen: in der
  Schleife vor dem `model`-Check. Über `writeJob` löst das automatisch
  `jobSettled` aus (Push „konnte nicht entstehen", Erstattung beim nächsten
  `/api/job` über deinen S7-Weg).
- Erstattung bei `failed` hängt bei dir an `/api/job` (die App fragt).
  Der Abholer schreibt nur den Zustand; die Erstattung ist je Abbuchung
  einmalig, doppelt kann also nichts passieren. Willst du auch erstatten,
  wenn die App nie wieder fragt, ginge das in `jobSettled` (Konto steht in
  den Besitz-Vermerken).

### 2. Push „Dein Film ist fertig" (geht nur mit deinem Apple-Konto)

1. **APNs-Schlüssel** (.p8) im Developer-Konto anlegen; auf den Server:
   `APNS_KEY_ID`, `APNS_TEAM_ID`, `APNS_KEY` (Inhalt), `APNS_TOPIC`
   (= Bundle-ID `com.dreamrushes.app`), `APNS_ENV` (`sandbox` für
   Entwicklungsbauten, `production` für TestFlight/App Store).
2. **Route `POST /api/push-token`** (nur mit Konto): Token je Konto merken
   (z. B. wie S2 als Vermerk unter `media/besitz/push/<konto>/<token>` oder
   als Tabelle), bei Abmeldung und in `forgetAccount` (B8) löschen. Ein
   Token, das APNs mit 410 ablehnt, wegwerfen.
3. **Senden in `jobSettled`**: APNs über HTTP/2 mit JWT (ES256, 50 min
   gültig, wiederverwenden). Text in der Sprache des Kontos
   (`profiles.language`), Texte in `en.js`/`de.js`: fertig („Dein Traum ist
   fertig — schau ihn dir an") und gescheitert („… konnte nicht entstehen —
   deine Credits sind zurück"). Antippen soll den Traum öffnen
   (`data.url` wie bei den lokalen Erinnerungen).
4. **App-Bau**: `aps-environment` über `mobile/app.json`
   (Plugin `expo-notifications`), nicht von Hand in `mobile/ios`; Bau mit
   `EXPO_PUBLIC_PUSH=1` und deiner Signatur.
5. **Doppelt vermeiden**: Die lokale Mitteilung in
   `mobile/src/components/journal-data.tsx` (App im Hintergrund) nur noch,
   wenn kein Push-Token angemeldet ist — die Datei liegt in deinem PR #88,
   deshalb nicht von mir angefasst.
6. **Datenschutz**: Der Abschnitt „Mitteilungen" sagt heute „Wir speichern
   keine Push-Adresse für dein Gerät" — neu fassen (Token je Konto, Apple
   als Zusteller, Löschung), `CONSENT_VERSION` erhöhen.

### 3. Gemini-Schlüssel auf dem Server

Antons **lokaler** Schlüssel funktioniert (05.10. geprüft: Testsatz auf
Deutsch, Gemini in 1,4 s wortgenau). Auch **Wizper** ging lokal (8,5 s,
wortgenau, mit `language: "de"`). Der Server hat deinen Schlüssel aus deiner
`.env` bekommen — der ist ungültig. Anton gibt dir seinen auf sicherem Weg
(nicht per Chat, nicht ins Repo), oder du legst einen neuen an; dann die
eine Zeile in `/etc/dreamrushes/dreamrushes.env` tauschen und Dienst neu
starten. Danach am Server noch einmal diktieren — wenn Wizper dort weiter
scheitert, liegt es nicht am Schlüssel.

## Reihenfolge

S7 (#89) mergen → sofort antworten → Deploy (bringt auch den Abholer) →
Gemini-Schlüssel → Push (Schlüssel, Route, Senden, Bau, Datenschutz).
