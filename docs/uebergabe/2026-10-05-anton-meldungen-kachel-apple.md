# Übergabe an Anton — doppelte Film-Meldungen, Warte-Kachel, Apple-Hinweis

**Von:** Hanni (mit Claude), 05.10.2026 abends, `session/2026-10-05-hanni-4`
**Warum in deinem Bereich:** TestFlight-Woche, wie abgesprochen. Deine Logik
(Abholer `collector.js`, Auftrag, Prompt-Kette, Server) ist unverändert —
nur Zusätze.

## 1. „Dein Film ist fertig" kam 8× für einen Film

Im Release-Bau kam die Mitteilung für EINEN Film achtmal; die Daten im
Journal waren richtig. Ursache: Jeder Bildschirm mit `useJournal()` hat eine
eigene Brücke (eigener Webview, eigener Abholer). Die Pacht `holdLease` soll
nur eine fragen lassen, hält sie aber offenbar nicht zuverlässig auseinander —
dann holen mehrere denselben Auftrag ab und melden ihn alle. Weil alle
dasselbe Ergebnis speichern, sieht man es nur an den Meldungen.

**Geändert:**
- `mobile/src/legacy/journal-bridge.jsx` `collectOnce`: Jede Meldung bekommt
  einen Schlüssel aus Art + Zusatz + den Aufträgen, deren Zustand sich in
  dieser Runde geändert hat (`jobMarks`/`finishedJobs`: Film-Nummer, jedes
  Bild mit Adresse/Fehler/Schnitt, jede Szene). Ohne Änderung kein Schlüssel.
  Gleichlautende Meldungen derselben Runde (zwei Filme zugleich fertig)
  kommen einmal.
- `mobile/src/components/journal-data.tsx`: Die native Seite (für alle
  Brücken EINE) zeigt jeden Schlüssel nur einmal in zehn Minuten — Toast,
  Mitteilung und Haptik.

**Nicht geändert:** die Pacht selbst. Warum sie nicht hält, ist offen
(Vermutung: localStorage gleicht sich zwischen WKWebview-Prozessen nicht
sofort ab). Folge, falls das stimmt: Bei offenem Auftrag fragt jede Brücke
alle 3 s den Server — viele Aufrufe von `/api/job` je Gerät.

## 2. Warte-Kachel

`mobile/src/components/dream-tile.tsx`: Solange der Film eines Traums
entsteht (`pending` oder `rendering`), läuft dein Leuchtrand (`OrbitGlow`,
Radius 16) um die Kachel. Der kleine Punkt oben rechts bleibt. Gefällt dir
die Form nicht: eine Zeile.

## 3. Hinweis vor Apples Blatt beim Konto löschen

`mobile/src/app/profile/settings.tsx` `askDelete`: Bevor Apples Blatt für
den Token-Widerruf aufgeht, erklärt ein Dialog, warum Apple noch einmal
fragt (Abbrechen = nichts gelöscht). Nur Apple-Konten sehen ihn. Texte
`deleteAccountApple*` in `en.js`/`de.js`.
