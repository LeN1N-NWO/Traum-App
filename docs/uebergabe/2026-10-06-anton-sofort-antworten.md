für: Anton, LeN1N-NWO

# Übergabe an Anton — `/api/generate` antwortet beim Film sofort (06.10.2026, Hanni + Claude)

Dein Teil aus `2026-10-05-hanni-server-holt-ab-push.md`, Punkt 1 — gebaut auf
`session/2026-10-06-hanni`. Gegen die verwaisten Filme (TestFlight-Blocker).

## Was sich in deinem Bestellweg ändert — nur der Zeitpunkt der Antwort

**Film-Zweig in `/api/generate`:**
1. Synchron wie bisher: Prüfungen, Keyframe-Besitz, Preis → 409,
   Abbuchung → 402/503.
2. **Neu, sofort:** `genJobId()` → Auftragsdatei `{ status: "preparing",
   createdAt }` → `claimJob` (S2) → Abbuchungsvermerk (S7) → Antwort
   `{ ok: true, jobId }` (lokal gemessen: 36 ms statt 58–72 s).
3. **Im Hintergrund, unverändert:** `directFilm(...)` (Aufruf wortgleich) →
   `startVideo(...)`. `falSubmitVideo` schreibt seine fal-Werte jetzt in
   **dieselbe** Datei (`status: "pending"`), statt eine neue Nummer zu ziehen.
4. Scheitert die Vorbereitung: Auftrag `failed` mit `e.reason` (wie früher die
   502) → `jobSettled` erstattet über S7.

**Durchreich-Parameter**, sonst nichts an deinen Funktionen:
- `startVideo` / `falSubmitVideo`: `jobId` (vorhandene Nummer) und
  `stillWanted` (gibt es den Auftrag noch als „preparing"?). Geprüft vor dem
  bezahlten Standbild und direkt vor dem Submit an fal. Ist er weg
  (Konto gelöscht, B8) oder abgeschrieben (Frist), wird **nichts bestellt**
  (`ORDER_CANCELLED`, nur Log).
- Anfragekörper, Slugs, Prompt-Bau, Regie: **0 Diff-Zeilen** (per Skript
  belegt, alle 91 geänderten Zeilen in `server.js` kategorisiert).

**`jobStatusFetch`:** `preparing` → `pending`, ohne fal zu fragen. Älter als
10 min (`PREPARING_MAX_MS` — DeepSeek 240 s + Standbild 180 s + Submit 30 s
passen rein) → `failed`, Grund `"preparation interrupted"`.

**`collectOpenJobs`:** sieht `preparing` trotz fehlendem `model` an, damit die
10-Minuten-Frist auch ohne App greift.

**`genJobId`:** jetzt `crypto.randomUUID()` ohne Bindestriche (32 Hex,
passt zu `JOB_ID`). Gilt auch für Bilder.

## Belegt (lokal, ohne Schlüssel — kein bezahlter Lauf)

- Film bestellt → 200 in 36 ms, Datei `preparing` → ohne FAL-Schlüssel
  `failed`, `/api/job` meldet `failed`.
- Preis zu niedrig angezeigt → weiter sofort 409, **keine** Auftragsdatei.
- Frisches `preparing` → `/api/job` `pending`; 11 min altes → `failed` mit Grund.
- Abholer (Platzhalter-Schlüssel, `preparing` fragt nie bei fal): altes
  `preparing` nach 5 s `failed`, frisches bleibt.
- 940 Tests grün.

## Nicht belegt / offen

- **Echter Lauf mit fal + Abbruch im Flugmodus** — erst nach Deploy am
  iPhone (Hanni). Das ist der eigentliche Beweis.
- `ORDER_CANCELLED` (Konto gelöscht mitten in der Vorbereitung) nur im Code,
  nicht live — das Zeitfenster ist ohne echte Regie nicht erreichbar.
- Restfall: Konto wird **während** der ~1 s des Submits gelöscht → die
  Datei entsteht neu; der zweite B8-Durchgang nach 10 min (`sweepJobs`)
  fängt sie.
- **Geräte-Guthaben:** Scheitert die Vorbereitung (z. B. Standbild abgelehnt),
  gab es früher eine 502 und das Gerät buchte nichts ab. Jetzt kommt erst die
  Nummer (Gerät bucht ab, `journal-bridge.jsx` Schritt 5), dann `failed`. Der
  Server erstattet das **Konto**, der Gerätezähler bleibt unten — wie schon
  heute bei jedem Film, der bei fal scheitert (`src/lib/collector.js:109`
  erstattet Filme nicht). Erledigt sich mit S7 Phase 2 (App zeigt das
  Konto-Guthaben); bis dahin für TestFlight intern unkritisch.
- App: Der Wartebildschirm steht jetzt länger in „pending" statt im Absenden
  — bitte beim nächsten Film darauf achten, ob das gut aussieht.
