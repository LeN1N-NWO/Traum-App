für: Anton, LeN1N-NWO

# Übergabe an Anton — Verwaiste Filme: `/api/generate` soll sofort antworten (05.10.2026, Hanni)

**Hannis Entscheidung:** den sauberen Weg — der Server gibt beim Filmauftrag
**sofort** eine Auftragsnummer zurück und erledigt Regie und Bestellung im
Hintergrund (die „Warteschlange" aus STAND/ARCHITEKTUR). Ein Zwischenweg
(Bestellnummer vom Gerät, Nachfragen nach Abbruch) wurde bewusst **nicht**
gebaut. Es ist dein Bestellweg — deshalb die Bitte an dich.

**Warum jetzt:** Seit heute läuft der Server öffentlich
(`https://api.dreamrushes.app`, PR #85/#86), und im Mobilfunknetz ist das
Problem beim ersten echten Test sofort aufgetreten. Für TestFlight am 16.10.
ist es ein Blocker: Tester verlieren bezahlte Filme, ohne es zu merken.

## Befund (VPS-Protokoll 05.10., iPhone im Mobilfunknetz)

| | Film 1 (kam an) | Film 2 (verwaist) |
|---|---|---|
| Abbuchung geloggt (Start) | 16:26:46 | 16:49:15 |
| `film director wrote …` | 16:27:26 (+40 s) | 16:49:44 (+29 s) |
| `video submit → minimax/h3-max-turbo` | 16:27:58 (+72 s) | 16:50:13 (+58 s) |

Bei Film 2 zeigte die App „Der Dienst hat nicht geantwortet … Es wurde
nichts abgebucht" — der Server hat trotzdem bestellt (Auftrag
`muvhjwz9zaoabc` liegt in `media/jobs`, bei fal bezahlt). Die App kennt die
Nummer nie, fragt nie nach: verwaist. Warum die App einmal 72 s durchhielt
und einmal nach ~60 s aufgab, ist nicht geklärt (`TIMEOUTS.film` in
`src/lib/api.js` ist 300 s; Mobilfunk oder eine iOS-Grenze sind möglich) —
egal, solange die Antwort erst nach Regie + Bestellung kommt, bleibt es
Glückssache.

**Wo die Zeit hingeht** (Film-Zweig in `server.js`, `if (body.mode === "film")`):
1. Validierung, `quoteFor` → 409 bei Preisänderung, `settleCharge` — schnell.
2. `directFilm(…)` (DeepSeek denkt) — **~30–40 s**.
3. `startVideo(…)` — ohne eigenen Keyframe erst `generateImages` (Standbild,
   synchron bei fal) — **~30 s** —, dann `falSubmitVideo`.
4. `claimJob` (S2) und erst dann `return json({ ok: true, jobId })`.

## Vorschlag (Weg B)

1. **Synchron bleibt nur, was schnell ist und eine Antwort braucht:**
   Prüfungen, Keyframe-Besitz (`mayUseMedia`, S2), Preis → 409,
   `settleCharge`. Der Kunde soll den Preis-Fehler weiter sofort sehen.
2. **Dann sofort:** eigene Auftragsnummer erzeugen (gleich kryptografisch —
   `crypto.randomUUID()` o. ä.; `genJobId()` ist heute Zeit + `Math.random`,
   siehe ARCHITEKTUR), Auftragsdatei mit `status: "preparing"` schreiben,
   `claimJob(person, id)` (S2), **antworten** `{ ok: true, jobId }`.
3. **Im Hintergrund:** `directFilm` → `startVideo`/`falSubmitVideo` wie
   heute; die fal-Werte (`requestId`, `statusUrl`, `responseUrl`, Prompt,
   Sekunden, Poster) in **dieselbe** Auftragsdatei, `status: "pending"`.
   Scheitert etwas: `status: "failed"` mit `reason` (deine
   `failureReason`/`imageFailure`), damit die App wie heute „renderFailed"
   zeigt. `falSubmitVideo`/`falSubmitImage` erzeugen ihre Nummer heute
   selbst — sie bräuchten eine Variante, die die vorhandene Nummer nimmt
   (oder sie geben nur die fal-Werte zurück und der Aufrufer schreibt).
4. **`jobStatus`:** `preparing` → `{ status: "pending" }`, ohne fal zu
   fragen. Ein `preparing`, das älter als z. B. 10 Minuten ist (Server
   mitten in der Vorbereitung neu gestartet — die Arbeit im Speicher ist
   dann weg), → `failed` mit eigenem Grund, damit die App Bescheid sagt.
5. **Prompt-Kette unverändert:** Regie, Prompt-Bau, Modelle, Anfragekörper
   bleiben, wie sie sind — nur *wann* geantwortet wird, ändert sich. Wir
   haben bei S2 jede geänderte Zeile in `server.js` einer Kategorie
   zugeordnet und deine Funktionen per Skript mit `main` verglichen; dasselbe
   Vorgehen wäre hier gut.

## Was S2 und B8 dabei verlangen (heute gebaut, PR #85)

- **Besitz:** `claimJob(person, id)` muss vor der Antwort stehen (sonst
  sagt `/api/job` dem Besteller 403 `foreign`). `person` ist in `route()`
  gesetzt.
- **Konto löschen während der Vorbereitung (B8):** `forgetAccount` löscht
  die Auftragsdatei; schreibt der Hintergrund danach seine fal-Werte, ist
  sie mit Prompt (Traumtext!) wieder da. Bitte vor dem Schreiben prüfen, ob
  der Auftrag noch jemandem gehört (`owners.ownsJob(uid, id)`), sonst nichts
  schreiben und nichts bestellen. Der zweite Durchgang nach 10 Minuten
  (`sweepJobs`) fängt das zwar meist, aber nicht, wenn die Vorbereitung
  länger dauert.
- **Fremder Auftrag → 403, nicht „unknown":** Der Abholer vergisst bei
  „unknown" die Nummer (`src/lib/collector.js`). `preparing` darf also
  nie „unknown" heißen.

## Client

Grundsätzlich nichts nötig: `generate()` bekommt die Nummer jetzt sofort,
`awaitJob`/der Abholer fragen wie bisher, „pending" deckt die Regiezeit
mit ab. Prüfen: Wartebildschirm im Bestellablauf (er wartet dann länger in
„pending" statt im Absenden), und dass die Erstattung bei „failed" für
Filme greift.

## Prüfen, bevor es raus geht

- Antwort von `/api/generate` (Film) in unter 1 s.
- **Abbruch-Test:** Verbindung nach dem Absenden kappen (Flugmodus) — der
  Film muss trotzdem im Journal ankommen, sobald die App wieder fragt.
- Neustart des Dienstes während `preparing` → `failed` mit Grund, App
  meldet es.
- Preisänderung → weiterhin sofort 409, nichts bestellt.
- Konto löschen während `preparing` → nichts bestellt, keine Auftragsdatei.
- Kein Mehrfach-Bestellen bei „noch mal versuchen".

## Daneben gefunden (nicht dein Thema, nur zur Info)

- Acht gleichzeitige Meldungen „Dein Film ist fertig" für einen Film im
  Release-Bau — vermutlich holen mehrere versteckte Brücken ab, weil die
  Pacht über localStorage zwischen den Webviews nicht greift
  (`collectOnce`/`holdLease` in `journal-bridge.jsx`). Daten sind korrekt,
  nur die Meldungen sind vervielfacht. Als eigene Aufgabe angelegt.
- `GEMINI_KEY` ist ungültig (401 „Expected OAuth 2 access token", lokal und
  auf dem Server) — Abschrift/Sprachinterview/Stimmen fallen aus. **Liegt
  bei dir:** neuen Schlüssel in Google AI Studio anlegen (beginnt mit
  `AIza`), lokal eintragen; für den Server tauscht Hanni die eine Zeile in
  `/etc/dreamrushes/dreamrushes.env` (Ablauf in `deploy/README.md`, „.env
  des Servers"), danach `deploy.sh`. Der Ersatzweg über fal (Wizper) ist am
  05.10. ebenfalls gescheitert — erst nach dem neuen Schlüssel ansehen,
  weil sich beides gegenseitig verdeckt.
