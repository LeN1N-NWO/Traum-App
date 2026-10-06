für: Anton, LeN1N-NWO

# Übergabe an Anton — Hängende Filme: Statusabfrage gibt nach einer Frist auf (06.10.2026, Hanni + Claude)

Offener **Punkt 5** aus `2026-10-05-anton-s7-abbuchung.md`: Scheiterte die
Statusabfrage bei fal, las `jobStatusFetch` das immer als „läuft noch"
(`if (!s.ok) return { status: "pending" }`). Ein Auftrag, nach dem fal
dauerhaft keine Auskunft mehr gibt (404 unbekannt, falsche Adresse wie der
405 vom 09.08., Schlüssel weg), hing so für immer: nie `failed`, nie
erstattet. Ein Netzfehler warf sogar — die App bekam 500.

## Was sich geändert hat — nur `jobStatusFetch` in `server.js`

- Netzfehler/Zeitüberschreitung und kaputtes JSON zählen wie eine
  Fehlantwort (`.catch(() => null)`), statt zu werfen.
- Zwei Fristen ab Auftragsanlage (Hannis Entscheidung):

  | fal antwortet auf die Statusfrage | danach `failed` |
  |---|---|
  | `FAILED` (Film gescheitert) | sofort — unverändert |
  | 404, 401, 403, 405 (gibt es nicht / Schlüssel / Adresse) | **10 min** (`STATUS_GONE_MS`) |
  | 5xx, 429, keine Verbindung (Störung) | **1 h** (`STATUS_GIVEUP_MS`) |

  Innerhalb der Frist weiter `pending` — ein Aussetzer ist kein Fehler.
  Die 10 min sind Puffer, falls fal einen frischen Auftrag kurz noch nicht
  kennt (nicht gemessen).
- Danach `failed` mit Grund `{ kind: "unknown", msg: "status unavailable" }`,
  Log-Zeile mit HTTP-Code und Frist → `jobSettled` erstattet (S7).
- Alles danach (FAILED holen, COMPLETED, Poster) unverändert.

Regie, Prompt-Bau, Anfragekörper: 0 Diff-Zeilen.

## Belegt

Nachgebauter fal-Server lokal, kein bezahlter Lauf, 10/10 Fälle richtig:
404/403/405 nach 11 min → `failed`, 404 nach 5 min → `pending`; 500/429/
ohne Verbindung nach 11 min → `pending`, nach 61 min → `failed`.
Gegenprobe mit `main`: alter Auftrag + 404 bleibt `pending`, ohne
Verbindung 500. 945 Tests grün.

## Abwägung

Fällt fal länger als 1 h aus, während ein fertiger Film auf Abholung
wartet, wird er als gescheitert erstattet und nicht mehr abgeholt — der
Kunde verliert nichts, wir die Renderkosten.

## Zielbild (Hannis Entscheidung 06.10.) — vor dem Store, nach TestFlight

Heute fragt der Server bei fal **selbst** (Abholer, alle 20 s) und
zusätzlich **im Auftrag der App** (jede `/api/job`-Anfrage löst eine
fal-Abfrage aus, bis zu 8 Brücken alle 3 s). Doppelt **abgeholt** wird
nichts (Auftragsdatei + `jobInFlight`), aber doppelt **gefragt**. Das
Fragen im Auftrag der App ist seit deinem Abholer (ADR-0010) überflüssig.
Abgelöst wird es mit APNs:

```
App → Server: „Mach mir einen Film"
Server → fal: bestellen, nachfragen, abholen   (nur der Server spricht mit fal)
Server → App: Push „fertig"
App → Server: Film holen (beim Antippen oder beim nächsten Öffnen)
```

- Ohne Push-Erlaubnis kommt der Film trotzdem — beim nächsten Öffnen fragt
  die App **unseren** Server, der nur in die Auftragsdatei schaut.
- Vorher schließen: der Abholer fasst Aufträge > 3 Tage nicht an, und
  `SERVER_COLLECT=off` schaltet ihn ab — für beides ist der App-Anstoß
  heute das einzige Netz.
- Eine Drossel in `/api/job` (fal höchstens alle 15 s je Auftrag) wurde
  besprochen und bewusst auf nach dem 16.10. verschoben.
