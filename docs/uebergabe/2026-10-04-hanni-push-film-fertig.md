# Übergabe an Hanni: Push-Mitteilung „Dein Traum ist fertig“

Stand 04.10.2026, Anton + Claude. **Nichts am Server gebaut** — das ist
dein Teil. Anton baut danach die kleine App-Seite (Token anmelden).

## Warum

Antons Befund 04.10.: „Man bekommt leider keine Benachrichtigung, dass ein
neuer Traum erschienen ist. Er muss es selber herausfinden.“ Der
Warte-Bildschirm verspricht es sogar („Wir sagen dir Bescheid, sobald er
da ist“).

## Was es heute gibt (PR #77)

- Der Abholer der App (`collectOnce`, `mobile/src/legacy/journal-bridge.jsx`)
  fragt alle 3 s bei `/api/job` nach. Ist der Film da, gibt er `notify`
  mit, und `mobile/src/components/journal-data.tsx` macht daraus eine
  **lokale** Mitteilung, wenn die App nicht vorn ist. Ein Tipp öffnet das
  Journal (Schlüssel `data.glimpse`, Empfänger in
  `mobile/src/components/glimpse-layer.tsx:76`).
- ⚠ **Grenze:** Das klappt nur, solange die App im Hintergrund noch läuft
  (z. B. Einschlafklänge, Hintergrundmodus `audio`). Schläft sie, fragt
  niemand nach — die Mitteilung kommt erst beim nächsten Öffnen.
- Erlaubnis: nach dem ersten Auftrag fragt die App einmal
  (`mobile/src/app/dream/order.tsx`).

## Was es braucht (Vorschlag)

1. **Der Server merkt selbst, wann ein Film fertig ist.** Heute erfährt er
   es nur, wenn die App fragt. fal kann beim Abgeben eine Webhook-Adresse
   bekommen (`fal_webhook=` an der Queue-URL) und ruft sie beim Fertig-
   werden auf. Damit lösen sich zwei Dinge auf einmal:
   - Push auslösen, ohne dass die App läuft.
   - Die Lücke aus ADR-0008 / deiner Notiz vom 03.10.: Filme, die nie
     abgeholt werden („verwaist“), landen trotzdem bei uns (`storeAll`
     im Webhook statt erst bei `/api/job`). Dabei gleich S2: Datei →
     Nutzer zuordnen.
   - Webhook-Aufrufe prüfen (fal signiert sie), sonst kann jeder „fertig“
     melden.
2. **Gerät anmelden:** `POST /api/push-token { token, platform: "ios" }`
   mit Konto (Bearer). Tabelle z. B. `push_tokens(user_id, token unique,
   created_at, last_seen)`, RLS wie bei den Einladungen; abgemeldete oder
   von Apple abgelehnte Tokens löschen (APNs antwortet `410 Unregistered`).
3. **Senden:** direkt über APNs (HTTP/2, `.p8`-Schlüssel aus dem
   Apple-Konto — ⚠ nicht ins Repo, nur `.env` auf dem VPS) oder über
   Expos Push-Dienst (braucht EAS-Projekt-ID). Inhalt:
   `{ title: "Dein Traum ist fertig", body: "<Traumtitel>",
   data: { glimpse: "/journal/<entryId>" } }` — Sprache aus dem Konto
   (`profiles.language`), Texte in `en.js`/`de.js`.
   Auch bei Fehlern („Dein Traum konnte nicht entstehen — Credits sind
   zurück“).
4. **App-Konfiguration:** Push-Capability im Apple-Konto und
   `aps-environment` in den Entitlements — gehört nach `mobile/app.json`
   (Plugin `expo-notifications`), nicht von Hand nach `mobile/ios`. Das
   braucht einen Bau mit Prebuild bei dir.

## Danach (Anton)

- Token holen (`Notifications.getDevicePushTokenAsync()`) und nach dem
  Anmelden an `/api/push-token` schicken; bei Abmeldung löschen.
- Die lokale Mitteilung aus `journal-data.tsx` bleibt als Rückfall, darf
  aber nicht doppelt kommen (z. B. nur noch, wenn kein Token angemeldet
  ist).

## Reihenfolge

Webhook (1) zuerst — er hilft auch ohne Push (verwaiste Filme, S2). Dann
Token-Tabelle und Senden (2, 3), dann der Bau mit Push-Capability (4).

## Nachtrag 05.10. abends (Anton + Claude): der Server holt jetzt selbst ab

Anstelle des fal-Webhooks (Punkt 1) gibt es seit `session/2026-10-05b-anton`
einen **Abholer im Server** (`collectOpenJobs` in `server.js`): alle 20 s
und 5 s nach jedem Start fragt er für jeden offenen Auftrag in `media/jobs`
(jünger als drei Tage) dieselbe `jobStatus()`-Runde wie die App. Fertige
Filme liegen danach bei uns, `done`/`failed` steht in der Auftragsdatei;
eine Sperre (`jobInFlight`) verhindert doppeltes Abholen, wenn App und
Server gleichzeitig fragen. Getestet am 05.10. lokal: Probe-Auftrag auf
einen fertigen fal-Film, ohne App → nach 5 s `done`, Film im Speicher;
`/api/job` danach sofort `done`.

**Für den Push heißt das:** Er dockt genau dort an. Wenn
`collectOpenJobs` (oder `jobStatus`) einen Auftrag von offen auf
`done`/`failed` schreibt, an die Geräte des Besitzers schicken
(`owners`-Vermerk aus S2 kennt ihn). Ein Webhook ist damit nicht mehr
nötig — er würde nur die 20 s Verzögerung sparen.

**Antons Wunsch (05.10.):** Push „Dein Film ist fertig“, auch wenn die App
zu ist. Was dafür nur bei dir geht: APNs-Schlüssel (.p8) im Apple-Konto
anlegen, `aps-environment` über `app.json`, ein Bau mit deiner Signatur —
Antons Personal Team kann keine Push-Capability signieren.
