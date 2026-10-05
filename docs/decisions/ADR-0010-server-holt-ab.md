# ADR-0010: Der Server holt fertige Aufträge selbst ab und meldet sie

**Status:** angenommen · **Datum:** 2026-10-05 · **Format:** MADR
**Entschieden von:** Anton (05.10.2026). Umsetzung Teil 1 in
`session/2026-10-05b-anton`; Teil 2 und 3 als Übergabe an Hanni
(`docs/uebergabe/2026-10-05-hanni-server-holt-ab-push.md`).

## Kontext

Ein Film entsteht bei fal.ai in einer Warteschlange. Bis zum 05.10. lief das
Abholen so:

1. Die App bestellt (`POST /api/generate`), der Server bestellt bei fal und
   schreibt eine Auftragsdatei (`media/jobs/<id>.json`).
2. Die App merkt sich die Auftragsnummer am Traum — nur auf dem Gerät.
3. **Nur wenn die App nachfragt** (`GET /api/job`, der „Abholer" in
   `src/lib/collector.js`, solange sie offen ist), fragt der Server bei fal
   nach und legt den fertigen Film in seinen eigenen Speicher.

Der Server war damit rein reaktiv: Ohne Anstoß vom Handy geschah nichts.
Antons Frage dazu (05.10.): „Warum kann der Server die Abholung nicht
selbst anstoßen? Sonst warten wir zu lange, ein paar Tage oder so."

Was das konkret hieß:

- **Ist die App Tage zu, liegt der Film so lange nur bei fal.** fal gibt für
  seine Adressen keine Haltbarkeitszusage (`server.js`, „local media
  copies"); je länger, desto größer das Risiko, dass ein bezahlter Film nie
  bei uns ankommt.
- **Der Server erfährt nie von selbst, dass ein Film fertig ist.** Damit
  kann er auch niemanden benachrichtigen: „Dein Film ist fertig" gab es nur
  als lokale Mitteilung, solange die App im Hintergrund noch lief.
- **Alles hängt am Handy:** App gelöscht, Gerät gewechselt, Funkloch über
  Tage — dann holt niemand ab.

## Entscheidung

**Der Server ist für das Abholen verantwortlich, nicht der Client.**

1. **Selbst abholen** (gebaut 05.10.): Der Server fragt alle 20 s und kurz
   nach jedem Start für jeden offenen Auftrag (jünger als drei Tage) selbst
   bei fal nach — dieselbe `jobStatus()`-Runde, die bisher nur die App
   auslöste (`collectOpenJobs` in `server.js`). Fertiges liegt sofort bei
   uns, `done`/`failed` steht in der Auftragsdatei. Eine Sperre je Auftrag
   (`jobInFlight`) verhindert doppeltes Abholen, wenn App und Server
   gleichzeitig fragen. Ein Neustart verliert nichts: die Aufträge liegen
   als Dateien auf der Platte.
2. **Melden, wenn es fertig ist** (Andockstelle gebaut, Senden bei Hanni):
   Jeder Übergang eines Auftrags auf `done`/`failed` läuft durch
   `writeJob` und ruft genau einmal `jobSettled()` — dort schickt der
   Server einen **Push** an die Geräte des Besitzers, auch wenn die App zu
   ist. Die App meldet dafür ihr Geräte-Token an (`mobile/src/lib/push.ts`,
   gebaut, aus bis zum Einschalten).
3. **Sofort antworten** (Übergabe an Hanni): `/api/generate` gibt die
   Auftragsnummer zurück, bevor Regie und Bestellung laufen (heute 60–70 s
   synchron). Erst damit kennt die App die Nummer garantiert — vorher
   konnte ein Verbindungsabbruch in diesem Fenster einen bezahlten Film
   verwaisen lassen (Befund Hanni 05.10. im Mobilfunknetz).

Die App bleibt **Rückfall**: Sie fragt weiter selbst nach (`/api/job`),
öffnet man sie, bekommt sie sofort „fertig". Ein fal-Webhook ist nicht
nötig — er spart nur die 20 s Verzögerung des Abholers.

## Folgen

- Fertige Filme liegen innerhalb von ~20 s nach Renderende bei uns, egal ob
  die App offen ist.
- Der Server macht laufend kleine Anfragen an fal, solange Aufträge offen
  sind (eine je Auftrag alle 20 s; Statusabfragen kosten nichts).
- Erstattungen (S7, Hanni, PR #89) laufen weiter über `/api/job`, wenn die
  App fragt — der Abholer schreibt nur den Zustand; die Erstattung ist je
  Abbuchung einmalig.
- Push braucht Hannis Apple-Konto (APNs-Schlüssel, Signatur mit
  Push-Berechtigung). Antons Personal Team kann das nicht signieren, darum
  ist die App-Seite bis dahin aus.
- Die Datenschutzerklärung sagt heute „Wir speichern keine Push-Adresse für
  dein Gerät" — das ändert sich mit dem Einschalten (neue Fassung, erneute
  Einwilligung).
