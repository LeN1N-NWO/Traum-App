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

Alle 141 geänderten Zeilen in `server.js` sind einer Kategorie zugeordnet
(davon 30 in `DELETE /api/account` für B8 — Hannis Route, nicht deine)
(Kommentare, Hilfsfunktionen, `serveMedia`, Vermerke, Prüfungen, neue Route);
die Summe ergibt die Gesamtzahl aus `git diff --numstat`. `readJob` wird an
einer Stelle zusätzlich **aufgerufen** (nur lesend, siehe Punkt 5).

## Was in deinen Routen dazukam — und warum

Nur Zusätze vor oder nach deinem Code, keine deiner Zeilen umgeschrieben
(außer zweimal `return json({ url: await … })` → erst in eine Variable,
damit die Datei vermerkt werden kann; die Antwort ist dieselbe):

1. **`/api/generate` und `/api/character`:** Direkt vor den vier
   `return json({ ok: true, jobId })` steht `await claimJob(person, jobId)` —
   der Auftrag gehört dem Besteller. **Warum:** Damit holt nur der Besteller
   ab; die erratbare `genJobId()` schadet nicht mehr.
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
5. **`/api/job`:** Fremder Auftrag → **403** mit `reason: "foreign"`, ein
   Auftrag, den es nicht gibt (`readJob` → null), weiter `unknown`. **Warum
   nicht einfach `unknown`:** Dein Abholer (`src/lib/collector.js`) vergisst
   bei `unknown` die Nummer endgültig. Nach einem Kontowechsel mitten im
   Rendern wäre der Film dann auch beim Zurückwechseln weg. Eine
   Fehlerantwort liest er über `ask(...).catch(() => null)` als Aussetzer und
   fragt später wieder — am Collector selbst ist nichts geändert. Fertig →
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
- ⚠ **React Compiler:** `mediaUrl()` liest den Schlüssel aus einer
  Modulvariable — der Compiler sieht das nicht und merkt sich
  `<img src={mediaUrl(x)}>` nur nach `x`. Deshalb laden `LegacyTab` und
  `LegacyPage` bei Kontowechsel/erstem Schlüssel neu (`key={uid}`).
  `LegacyOrder` bewusst nicht (würde die Bestellung verwerfen).
  **Bekannte Grenze:** Steht eine alte Web-Ansicht länger als 20 Minuten
  offen, sind ihre schon berechneten Adressen abgelaufen — schon geladene
  Bilder bleiben sichtbar, ein *neues* Laden derselben Datei (Video erneut
  abspielen, Bild erst dann ins Bild gescrollt) scheitert, bis man die
  Ansicht neu öffnet. Fällt mit dem Umzug auf nativ weg (ADR-0006); die
  nativen Ansichten signieren bei jedem Zeichnen neu.
- Nativer Code, der eine Server-Datei selbst lädt (wie der Glimpse-Ton in
  `DreamSketch.addSound`), signiert direkt davor mit `signedMedia(url)` aus
  `mobile/src/lib/media-cache.ts`.

## B8: Konto löschen löscht die Medien

Nach `server_delete_account()` ruft die Lösch-Route `owners.forgetAccount()`
auf: Jede Datei und jeder Auftrag des Kontos verliert den Vermerk (der
Zugriff endet sofort), die Datei selbst wird gelöscht, wenn niemand sonst sie
besitzt, und `media/jobs/<id>.json` (trägt den Prompt, also Traumtext) geht
mit — samt den Dateien, die in der Auftragsdatei stehen und niemandem
gehören. Dafür merkt sich `claimJob` jetzt auch die Rückrichtung
(`besitz/auftraege/<konto>/<jobId>`). In deiner Pipeline ändert sich nichts.

⚠ **Berührt deinen `finishPoster`, ohne ihn zu ändern:** Während der
Poster-Phase („posting") liegt der Film schon hier, ist aber noch nicht
vermerkt, und `finishPoster` schreibt die Auftragsdatei danach neu (mit dem
Poster). Darum kehrt die Lösch-Route nach 10 Minuten ein zweites Mal nach
(`sweepJobs`). Wenn du die Poster-Phase änderst (Webhook!), denk daran:
Alles, was nach einem Auftrag auf dem Server landet, muss entweder vermerkt
werden oder in der Auftragsdatei stehen — sonst findet B8 es nicht.
Die Texte bei „Delete account" und in der Datenschutzerklärung (en/de) sagen
jetzt, dass Bilder und Filme mitgehen — der Satz „ist in Arbeit" ist raus.

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
