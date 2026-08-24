# Das Raster als Hauptweg — Bauanleitung

**Stand:** 2026-08-24 · **nicht gebaut**, bewusst offengelassen
**Anlass:** Antons Ansage: *„Jetzt werden wir ein Bild machen, sondern
haben wir jetzt vier Bilder. Wir müssen nur das letzte Bild eventuell
verwenden. Falls jemand acht Bilder auswählt, dann müssen wir den Bezug zu
den vorherigen machen und das mit dem Referenzbild von dem letzten
vorherigen mit einbeziehen."*

Alles andere der Umstellung ist gebaut (Commits `b8603cf`, `4794453`,
`5ea9494`). Dies ist der letzte Schritt, und er wird auf Antons Rechner
gebaut — von hier aus lässt er sich nicht bezahlt prüfen.

---

## 1. Die Entscheidung, und warum sie die Sache VEREINFACHT

Bis heute rendert die App eine **Kette**: Szene 1 geht raus, ihr fertiges
Bild wird zum Weltanker von Szene 2, und so weiter. Dafür gibt es einen
Läufer in `AppState.jsx`, ein `chain`-Feld am Eintrag und `imageChain.js`.

**Mit dem Raster fällt das für den Normalfall weg.** Vier Szenen entstehen
in EINEM Bild, im selben Licht, mit derselben Palette, in einem einzigen
Modelldurchlauf — sie sind einander automatisch ähnlich. Es gibt nichts zu
verketten, weil es nur einen Aufruf gibt.

**Die Kette überlebt genau an einer Stelle: zwischen zwei Rastern.** Wer
acht Bilder wählt, bekommt zwei Aufrufe, und der zweite muss wissen, wie
der erste aussah. Dafür reicht **ein** Anker: die **letzte Kachel des
ersten Rasters** (unten rechts), als letztes Referenzbild angehängt —
genau so, wie `buildImagePrompt` es heute für die Einzelkette tut.

    4 Szenen → 1 Raster,  kein Anker
    8 Szenen → 2 Raster,  Raster 2 ankert auf Kachel 4 von Raster 1

## 2. Was das konkret heißt

### 2a. Beim Abschicken (`Step5Style.jsx`)

Statt `jobs.length` Einzelaufträge: `gridRuns(count).runs` Rasteraufträge.
Der Prompt kommt aus `buildGridPrompt({ beats: viererBlock, styleId,
clauses, cols: 2, rows: 2 })` — die Funktion kann das seit dem 23.08.

Der Auftrag braucht **`grid: true`** (server.js setzt dann das Pixelmaß aus
`appGrid()`) und **`aspectRatio: "9:16"`** — der Behälter hat dasselbe
Format wie die Kachel, das ist der Grund, warum 2×2 überhaupt geht.

⚠ Der Preis bleibt **1 Credit je Szene** (`PRICES.images`), nicht je
Auftrag. Vier Credits für ein Rasterbild ist richtig: Der Mensch bekommt
vier Bilder. Was sich ändert, ist nur unser Einkauf.

### 2b. Der zweite Block

Erst abschicken, wenn das erste Raster fertig UND geschnitten ist — sonst
gibt es keine Kachel zum Ankern. Das ist derselbe Ablauf wie beim heutigen
Ketten-Läufer, nur mit `next: 4` statt `next: 1`, und `sequenceRef` ist die
**letzte** URL aus `media.urls`.

### 2c. Das Schneiden — die eigentliche Arbeit

`splitIntoTiles(url, 2, 2)` gibt es seit dem 24.08. (`splitGrid.js`), und
`appGrid().boxes` sagt, wo die Kacheln sitzen. Was fehlt, ist der ORT, an
dem es passiert:

Der Collector (`collector.js`) ist bewusst **DOM-frei** und getestet — dort
gehört Canvas-Arbeit nicht hin. Der saubere Weg:

1. Der Auftrag wird als Raster markiert: `imageJobs: [{ id, tiles: 4 }]`.
2. Der Collector füllt wie bisher `url` — **eine** URL für vier Szenen.
3. `media` bekommt eine Marke, etwa `media.unsplit: 4`.
4. Ein **eigener Effekt in `AppState.jsx`** (neben dem Ketten-Läufer)
   sucht Einträge mit `unsplit`, schneidet, lädt die Kacheln hoch
   (`uploadPanel`, gibt es schon) und ersetzt `media.urls`.

⚠ **Der Schnitt muss abbruchsicher sein.** Wer die App zwischen „Bild da"
und „geschnitten" schließt, darf kein Rasterbild als Traumbild sehen —
die Marke `unsplit` ist genau dafür da: Beim nächsten Start wird
weitergeschnitten, statt das Bild als fertig zu behaupten. Dieselbe Lehre
wie bei `clearStalePending()`.

## 3. Was dabei WEGFALLEN darf — und was nicht

| Teil | bleibt? |
|---|---|
| `imageChain.js`, Ketten-Läufer | **ja**, aber nur noch zwischen Rastern |
| `buildImagePrompt` (Einzelbild) | **ja** — Storyboard-Nachschuss („leere Kachel füllen") ist weiter ein Einzelbild |
| `PREVIEW_COUNT = 3` / Dreier-Streifen | ⚠ prüfen: Die Schnellvorschau ist ein 16:9-Streifen aus der Seedream-Zeit. Mit 2×2 als Hauptweg ist sie doppelt gemoppelt — entweder auf das Raster umstellen oder ersatzlos streichen. **Antons Entscheidung.** |
| `splitIntoPanels` (senkrechte Streifen) | nur solange der Dreier-Streifen lebt |

## 4. Woran man merkt, dass es funktioniert

Der Preis. Vor der Umstellung kostete ein Vier-Bilder-Traum vier Aufrufe;
danach einen. In der fal-Abrechnung muss auftauchen:

- **ein** Auftrag je vier Szenen, nicht vier
- Zeile `3840x2160`, Stufe `medium` → **$0,113**
- Kacheln **1080×1920** nach dem Schnitt (nicht 288×512 — das wäre das
  Zeichen, dass das Pixelmaß nicht ankam)

⚠ Der erste Lauf gehört mit EINEM Traum gemacht, nicht mit fünf. $0,113
sind verschmerzbar, $0,57 für einen Fehler in der Verdrahtung nicht.

## 5. Was schon steht (damit niemand doppelt baut)

- `appGrid(modelId)` (`gridLayout.js`) — Behältermaß, Kachelmaß,
  Schnittkästen. EINE Quelle für Server und Browser.
- `gridRuns(count)` — wie viele Aufrufe, wie viele Plätze leer.
- `buildGridPrompt({cols, rows})` — der 2×2-Zweig, mit Lesereihenfolge und
  Auftrag für leere Plätze.
- `splitIntoTiles(url, cols, rows)` — der zweidimensionale Schnitt.
- `falSubmitImage({ grid: true })` und `falGenerateImage({ grid: true })` —
  senden Stufe und Pixelmaß.
- Der Foto-Anker folgt dem Stil (`photorealFor`), `ultrareal` ist Vorgabe.
