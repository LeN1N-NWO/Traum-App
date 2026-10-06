für: Anton, LeN1N-NWO

# Übergabe an Anton — Hängende Filme: Statusabfrage gibt nach 2 h auf (06.10.2026, Hanni + Claude)

Offener **Punkt 5** aus `2026-10-05-anton-s7-abbuchung.md`: Scheiterte die
Statusabfrage bei fal, las `jobStatusFetch` das immer als „läuft noch"
(`if (!s.ok) return { status: "pending" }`). Ein Auftrag, nach dem fal
dauerhaft keine Auskunft mehr gibt (404 unbekannt, falsche Adresse wie der
405 vom 09.08., Schlüssel weg), hing so für immer: nie `failed`, nie
erstattet. Ein Netzfehler warf sogar — die App bekam 500.

## Was sich geändert hat — nur `jobStatusFetch` in `server.js`

- Netzfehler/Zeitüberschreitung und kaputtes JSON zählen wie eine
  Fehlantwort (`.catch(() => null)`), statt zu werfen.
- Fehlantwort bei einem Auftrag **jünger als 2 h** (`STATUS_GIVEUP_MS`):
  weiter `pending` — ein Aussetzer ist kein Fehler, wie bisher.
- **Älter als 2 h:** `failed` mit Grund `{ kind: "unknown", msg: "status
  unavailable" }`, Log-Zeile mit dem HTTP-Code → `jobSettled` erstattet (S7).
- Alles danach (FAILED holen, COMPLETED, Poster) unverändert.

Diff in `server.js`: 22 Zeilen, alle zugeordnet (8 Kommentar, 1 Leerzeile,
5 Statusabfrage, 8 Aufgeben-Regel); Regie, Prompt-Bau, Anfragekörper 0.

## Belegt

Nachgebauter fal-Server lokal (404 / 500 / keine Verbindung), kein
bezahlter Lauf: alt + 404 → `failed`, alt + 500 → `failed`, alt ohne
Verbindung → `failed`, frisch + 404 → `pending`, frisch ohne Verbindung →
`pending` (vorher 500). Gegenprobe mit `main`: alt + 404 bleibt `pending`,
ohne Verbindung 500. 945 Tests grün.

## Abwägung

Fällt fal länger als 2 h aus, während ein fertiger Film auf Abholung
wartet, wird er als gescheitert erstattet und nicht mehr abgeholt — der
Kunde verliert nichts, wir die Renderkosten. Wer das anders will: die eine
Konstante.
