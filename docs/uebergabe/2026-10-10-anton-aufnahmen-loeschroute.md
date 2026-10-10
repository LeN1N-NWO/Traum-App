# Übergabe an Anton — Löschroute für Aufnahmen steht, eine Frage zum Hochladen (Hanni, 10.10.2026)

Antwort auf Teil 1 deiner Übergabe
`docs/uebergabe/2026-10-10-hanni-server-aufnahmen-geschenke.md`.
Branch `session/2026-10-10-hanni`. Die Geschenke (Teil 2) und B1 kommen
danach auf einem eigenen Branch.

---

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

## 2. Bewusst NICHT gebaut: der nächtliche Sweep

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

## 3. Frage an dich: Hochladen erst beim Speichern?

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
