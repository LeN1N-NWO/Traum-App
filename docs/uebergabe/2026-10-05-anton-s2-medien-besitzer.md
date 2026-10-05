für: Anton, LeN1N-NWO

# Übergabe an Anton — S2 gebaut: Medien nur an den Besitzer (05.10.2026, Hanni)

Du hattest diese Woche keine Zeit, deshalb haben wir S2 gebaut (Antwort auf
Frage 1 aus `2026-10-03-anton-medien-sicherung.md`). **Deine Logik ist
unverändert.** Hier steht, was wir in deinem Bereich angefasst haben und
warum.

## Was unverändert ist (belegt)

Diese 18 Funktionen in `server.js` sind auf dem Branch Zeichen für Zeichen
gleich wie auf `main` (per Skript verglichen, mit Gegenprobe an
`serveMedia`): `jobStatus`, `finishPoster`, `storeAll`, `storeMedia`,
`storeBytes`, `sniffMediaType`, `appendOutro`, `falSubmitVideo`,
`falSubmitImage`, `genJobId`, `startVideo`, `generateImages`,
`falGenerateImage`, `sketchGrid`, `sketchSound`, `settleCharge`,
`resolveMedia`, `readJob`. Keine Prompts, keine Modelle, keine
Anfragekörper, keine Dateien in `src/lib/` deiner Kette.

Alle 103 geänderten Zeilen in `server.js` sind einer Kategorie zugeordnet
(Kommentare, Hilfsfunktionen, `serveMedia`, Vermerke, Prüfungen, neue Route);
die Summe ergibt die Gesamtzahl aus `git diff --numstat`.

## Was in deinen Routen dazukam — und warum

Nur Zusätze vor oder nach deinem Code, keine deiner Zeilen umgeschrieben
(außer zweimal `return json({ url: await … })` → erst in eine Variable,
damit die Datei vermerkt werden kann; die Antwort ist dieselbe):

1. **`/api/generate` und `/api/character`:** Direkt vor den vier
   `return json({ ok: true, jobId })` steht `await claimJob(person, jobId)` —
   der Auftrag gehört dem Besteller. **Warum:** Damit beantwortet `/api/job`
   fremde Nummern mit `unknown`; die erratbare `genJobId()` schadet nicht
   mehr.
2. **`/api/generate`, Film:** Direkt nach `const keyframe = …` — ein
   fremdes Bild als Keyframe wirft `GENERATION_FAILED`, also genau das, was
   `startVideo` bei einer fehlenden Datei tut. Steht **vor** Preis und
   Abbuchung. **Warum:** Sonst könnte jemand mit einem fremden `/media/`-Pfad
   ein fremdes Gesicht in seinen Film ziehen.
3. **`/api/generate`, Bild:** Vor deinem `sequenceRef`-Block wird ein
   fremder Anker auf `null` gesetzt — die Szene rendert ohne ihn weiter, wie
   es dein Block bei einer fehlenden Datei schon vorsieht. Gleicher Grund.
4. **`/api/film-outro`:** Film und Karte müssen dem Fragenden gehören
   (gleiche Fehlermeldungen wie bisher), das Ergebnis wird vermerkt.
5. **`/api/job`:** Fremder Auftrag → `{ status: "unknown" }`. Fertig →
   Film, Bilder und Poster gehören ab jetzt dem Besteller. `jobStatus` selbst
   ist unberührt.

Alles davon wirkt **nur mit `REQUIRE_AUTH=1`** (VPS). Lokal ohne Konto
läuft alles wie vorher, `/media` bleibt offen.

## Was du in der App merkst

- Medienadressen tragen auf dem VPS `?u=…&e=…&s=…`. Die App holt alle 10
  Minuten einen Schlüssel (`mobile/src/lib/media-key.ts`) und signiert jede
  Datei selbst (`src/lib/mediaSign.js`). **Ins Tagebuch gehört weiter nur
  der nackte `/media/…`-Pfad** — signiert wird erst beim Anzeigen
  (`mediaUrl()`, `localMedia()`), sonst wären gespeicherte Adressen nach 20
  Minuten tot.
- Die vier Web-Ansichten bekommen den Schlüssel als Prop `mediaKey`, wie
  `getToken`. Wer eine neue Einbaustelle von `JournalBridge`, `LegacyPage`,
  `LegacyOrder` oder `LegacyApp` anlegt: `mediaKey={useMediaKey()}` mitgeben.
- Nativer Code, der eine Server-Datei selbst lädt (wie der Glimpse-Ton in
  `DreamSketch.addSound`), signiert direkt davor mit `signedMedia(url)` aus
  `mobile/src/lib/media-cache.ts`.

## Was das für deine nächsten Schritte heißt

- **Webhook / verwaiste Filme** (Übergabe vom 04.10.): Ein Film, den nie
  jemand über `/api/job` abholt, bekommt heute keinen Besitzer — er ist
  dann sicher, aber unsichtbar. Wenn du den fal-Webhook baust: Der Besitzer
  des Auftrags steht in `media/besitz/auftrag/<jobId>/<konto>`; im Webhook
  nach `storeAll` die Dateien diesem Konto vermerken (`owners.claim`).
- **Neue Route, die eine Datei erzeugt:** vor dem `return` die Datei mit
  `claimMedia(person, url)` vermerken, sonst kann der Besteller sie auf dem
  VPS nicht laden.
- **Neue Route, die einen `/media/`-Pfad vom Client annimmt:** vorher
  `mayUseMedia(person, pfad)` prüfen.

Fragen gern an mich — und wenn dir eine der fünf Stellen oben nicht passt,
sag es; wir ändern es nach deinen Vorgaben.
