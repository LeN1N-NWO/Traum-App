# Übergabe an Anton — Medien verwaister Aufnahmen und gelöschter Träume löschen, eine Frage zum Hochladen (Hanni, 10.10.2026)

Antwort auf Teil 1 deiner Übergabe
`docs/uebergabe/2026-10-10-hanni-server-aufnahmen-geschenke.md`.
Branch `session/2026-10-10-hanni`. Die Geschenke (Teil 2) und B1 kommen
danach auf einem eigenen Branch.

---

## Welche Fälle das abdeckt

Waisen auf dem Server, also Dateien, die kein Traum mehr braucht,
entstehen auf drei Wegen. Der Server kann sie nicht selbst finden, weil
die Träume versiegelt sind (siehe 3.). Darum sagt die App Bescheid:

| Fall | abgedeckt durch |
|---|---|
| Aufnahme hochgeladen, Traum nie gespeichert | 1. `DELETE /api/panel` oder 4. (Hochladen erst beim Speichern) |
| „Weiter erzählen": die erste Aufnahme hängt an nichts | 1. `DELETE /api/panel` |
| **Traum gelöscht:** Aufnahme, Bilder, Film und Poster blieben bis zur Kontolöschung liegen | 2. `DELETE /api/media` |

Der dritte Fall ist der größte und auch eine Frage des Löschrechts: Wer
einen Traum löscht, erwartet, dass seine Stimme und die Bilder mit
verschwinden.

**Übrig bleibt** nur ein Absturz genau zwischen „hochgeladen" und
„Adresse am Traum vermerkt". Das ist selten und klein, dafür bauen wir
keinen Sweep.

## 1. Fertig: `DELETE /api/panel?url=/media/<name>.m4a`

- **Nur mit Konto** (wie `POST /api/panel`, `needsAccount`). Lokal ohne
  `REQUIRE_AUTH` tut die Route nichts und antwortet 204.
- **Nur der Besitzer, nur `.m4a`.** Bilder und Filme antworten 400 und
  bleiben liegen.
- **Geteilte Dateien bleiben stehen.** Der Name ist der Hash des Inhalts.
  Besitzt jemand anderes dieselbe Datei, geht nur der eigene
  Besitz-Eintrag weg, die Datei bleibt (`dropRecording` in
  `src/lib/mediaAccess.js`, Tests in `mediaAccess.test.js`).
- **Antwort 204,** auch wenn es nichts zu löschen gab. Du musst nicht
  wiederholen.
- Aufruf aus der App: wie `POST /api/panel` über `sendWithSession`, Methode
  `DELETE`, die URL so, wie `/api/panel` sie geliefert hat
  (`/media/<name>.m4a`, ohne Signatur).

## 2. Fertig: `DELETE /api/media` — ein gelöschter Traum nimmt seine Medien mit

- **Rumpf** `{ "urls": [ ... ] }`, höchstens 50 Adressen. DELETE mit
  Rumpf wie beim Konto-Löschen (`mobile/src/lib/auth.ts`).
- **Jede Medienart:** Aufnahme, Bilder, Szenen, Film, Poster.
  - Adressen mit Signatur oder `API_BASE` werden auf den Pfad gekürzt.
  - fal-Adressen und Unbekanntes werden übergangen.
- **Gelöscht wird nur, was diesem Konto gehört.** Eine Datei, die noch
  einem anderen Konto gehört, bleibt stehen (`dropFile`).
- **Antwort** `{ ok, deleted, shared, skipped }`.
- **Rate-Limit-Klasse „cheap"** wie `/api/dreams`
  (`src/lib/gatekeeper.js`). Ein Konto ist nötig.

**⚠ Deine Seite, und die ist wichtig:** Der Server kann nicht sehen, ob
eine Datei noch woanders gebraucht wird. Bitte also beim Löschen eines
Traums (`deleteDream` in `journal-bridge.jsx`, nach dem `DELETE
/api/dreams` in `dream-sync.ts`) **nur die Adressen schicken, die kein
anderer Eintrag mehr benutzt**. Darunter fallen:
- andere Träume,
- Figuren (`creatures`),
- Ring- und Sammelfilme, Abspann und Besetzung.

Im Zweifel eine Adresse lieber nicht schicken. Eine liegengebliebene
Datei ist harmlos, eine gelöschte, die noch gebraucht wird, ist weg.

**Noch offen, bewusst nicht angefasst:** Die Auftragsdatei
`media/jobs/<id>.json` eines Films trägt den Prompt, also Traumtext, und
bleibt beim Löschen eines Traums liegen. Sie hängt an deiner
Film-Abholung. Wenn du willst, dass sie mitgeht, sag Bescheid. Dann
bräuchte die Route die Auftragsnummer.

## 3. Bewusst NICHT gebaut: der nächtliche Sweep

Dein Vorschlag b) prüft, ob eine Traum-Zeile den Pfad enthält
(`dreams.media->'audio'`). **Das kann der Server nicht mehr sehen.** Seit
dem 24.09. sind die Träume versiegelt (Ende-zu-Ende). `toSealedRow`
speichert nur `sealed` und `key_id`. Der Abgleich setzt
`media = '{}'::jsonb` (`server.js`, `/api/dreams/sync`).

Für den Server ist also **jede** Aufnahme „unbenutzt". Ein Sweep nach
diesem Plan hätte nach 7 Tagen alle Traum-Aufnahmen gelöscht, auch die
gespeicherter Träume.

Ein Sweep ginge nur mit einem Behalten-Vermerk, den die App beim Speichern
setzt. Wir schlagen stattdessen den einfacheren Weg vor, siehe unten.

## 4. Frage an dich: Hochladen erst beim Speichern?

**Hannis Vorschlag:** Die App lädt die Aufnahme erst hoch, wenn man
wirklich auf „Speichern" bzw. „Film machen" tippt, nicht schon, wenn der
Text da ist. Dann entsteht auf dem Server kein Müll, und es braucht keinen
Sweep.

**Was dagegen spricht:** deine Ansage vom 12.09. („selbst wenn das nicht
durchgeht, muss die Aufnahme gespeichert werden", Kommentar in
`dream-recorder.tsx`). Seit deiner Änderung vom 10.10. wird aber ohnehin
erst nach dem Text hochgeladen. Das Sicherheitsnetz deckt also nur noch
die kurze Zeit zwischen „Text ist da" und „Speichern" ab.

**Hannis Vorgaben, falls du umstellst:**
- **Scheitert das Hochladen beim Speichern** (kein Netz o. ä.): Der Traum
  wird trotzdem gespeichert. Die Datei bleibt auf dem iPhone, und die App
  versucht es später erneut.
  - ⚠ Der 24-h-Aufräumer in `mobile/src/lib/recordings.ts` darf eine
    Aufnahme, die noch auf ihr Hochladen wartet, **nicht** wegräumen.
- **Annahme:** Wer morgens einen Traum aufnimmt, hat das Handy meist über
  Nacht geladen und ist im WLAN. Der Wiederholungsweg ist also der seltene
  Fall, er muss nur funktionieren, nicht schnell sein.

Stellst du nicht um, ruf wenigstens die Löschroute aus 1. dort auf, wo
eine hochgeladene Aufnahme sicher nicht mehr gebraucht wird. Das wäre der
Fall, wenn eine neue Aufnahme sie ersetzt oder ein neuer Traum beginnt.
Abstürze bleiben dann ungedeckt.
