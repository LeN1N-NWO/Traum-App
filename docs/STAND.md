# STAND — aktueller Projektzustand

> Diese Datei wird bei jedem Sitzungsende KOMPLETT überschrieben.
> Sie zeigt immer nur die Gegenwart. Historie gehört ins WORKLOG.

**Stand:** 2026-08-24 (16:30) — Ende der Cloud-Sitzung
`claude/new-session-x9qv1w` (PR #26), aufgesetzt auf `097fdba`.
384 Tests grün, Shape-Check grün, Build sauber.

## Wo wir stehen

**Die Umstellung ist gemacht — bis auf den Rasterweg.** Antons
Entscheidung nach dem Modellvergleich: „Der Test hat es ergeben, deswegen
stellen wir alles um. Seedream fliegt komplett raus."

| Schalter | Stand |
|---|---|
| Bildmodell **GPT Image 2, Stufe `medium`** | ✅ Vorgabe |
| **Foto-Anker** an (folgt jetzt dem Stil) | ✅ |
| Stil **`ultrareal`** als Vorgabe | ✅ |
| **Raster statt Einzelbildern** | ⬜ Bauanleitung, Antons Rechner |
| Garderobe je Traum (Antons Punkt 1) | ✅ verdrahtet |

**Einkauf: $0,113 für ein 2×2-Raster mit vier Szenen = $0,0283 je Szene.**
Nachrechenbar mit `node scripts/preis-durchreichen.mjs`.

⚠ **Seedream ist außer Dienst, nicht gelöscht.** Der Riegel sitzt in
`pickImageModel()`; eine alte `.env` mit `FAL_MODEL_IMAGE=seedream-5-lite`
bekommt beim Start eine eigene Meldung samt Grund und läuft auf GPT.

## Nächste Schritte

1. **Der Rasterweg** (`2026-08-24-raster-als-hauptweg.md`) — der letzte
   Schalter, auf Antons Rechner. Sein Entwurf steht im Plan: bei vier
   Szenen KEINE Kette (sie entstehen in einem Zug), bei acht ankert
   Raster 2 auf der letzten Kachel von Raster 1.
   ⚠ Der erste bezahlte Lauf mit EINEM Traum, nicht mit fünf.
2. **Erster echter Traum mit dem neuen Weg** — GPT medium, Foto-Anker,
   `ultrareal`. Bisher steht dahinter nur der Messtag vom 24.08., nichts
   durch die App.
3. **Preisentscheidung** — weiter offen, weiter der einzige echte Blocker
   für die Veröffentlichung. Die Grundlage ist jetzt aktuell.
4. **Klang-Presets:** 28 CC0-Kandidaten unter `media/klang-kandidaten/`
   warten auf Antons Auswahl.
5. **Was wird aus dem Dreier-Streifen?** (`PREVIEW_COUNT = 3`,
   `splitIntoPanels`) — eine 16:9-Schnellvorschau aus der Seedream-Zeit.
   Mit 2×2 als Hauptweg ist sie doppelt gemoppelt. Umstellen oder
   streichen: Antons Entscheidung.

## Bekannte Baustellen

- **Der Rasterweg fehlt noch.** Die App rendert weiter einzeln; alle
  Bausteine dafür stehen (`appGrid`, `gridRuns`, `buildGridPrompt` 2×2,
  `splitIntoTiles`, `grid: true` im Auftrag). Was fehlt, ist der ORT des
  Schneidens — der Collector ist bewusst DOM-frei, also gehört es in einen
  eigenen Effekt in `AppState.jsx`. Siehe Plan §2c.
- **Seedream-Ablehnungen: erledigt durch Stilllegung.** Der Befund vom
  23.08. (mit Referenz 4× durch, 8× abgelehnt) war der Grund für den
  Wechsel. Bleibt als Warnung in `imageModel.js` stehen.
- **Nano Banana 2 verfehlte das Raster** in einem von zwei frühen Läufen
  (vier Querformate statt vier Hochkant-Kacheln — bezahlt, unbrauchbar).
  Nach der Einstellungsebene 5 von 5 richtig; der Zusammenhang ist
  plausibel, aber nicht bewiesen.
- **Noch kein echter Traum durch den neuen Weg.** Hinter GPT medium +
  Foto-Anker + `ultrareal` steht der Messtag vom 24.08., nicht die App.
- **GPT erfindet dazu, und geht zu dunkel.** Ohne Foto-Anker: Blaskapelle
  über statt unter dem Eis, eine Leiche auf einem Steg, eine Stadtschlucht
  in einer Bibliothek. Mit Anker deutlich besser, in Nachtszenen weiter
  spürbar.
- **Das Gesicht verjüngt sich über die Kette.** Foto → Bogen → Szene sind
  zwei Übersetzungen, und in beiden wird er jünger und schmaler. Der Bogen
  aus zwei Fotos hat das gemildert, nicht behoben.
- **`data/traeume/` muss vor Veröffentlichung raus** — Ordner UND Ladepfad
  in `AppState.jsx`. Begründung steht in `.gitignore`.
- **Synthetische Testträume schreiben sich zurück** (`e_leer`, `e_test1`,
  `e_test2`, `e_raster_nbp`). Sie stehen in Antons localStorage. Nicht
  committet; wirklich weg erst, wenn er sie in der App löscht.
- **Preislinie nicht entschieden.** Jahresabo × Kino bleibt der enge Fall.
- **Recht** (Plan §4): Upload-Zusicherung · KI-Kennzeichnung ·
  Speicherfristen /media · DeepSeek-China · Klang-Lizenzen.
- **Kein Zahlungsanbieter.** Dummy-Film im Kaufblatt (`Paywall.jsx`).
- **Antons Berechtigungsliste** (`.claude/settings.local.json`) hat acht
  Einträge; fast jeder Befehl fragt nach. Ein Vorschlag liegt ihm vor.
  ⚠ Nicht selbst erweitern — der Klassifikator blockt das, zu Recht.

## Fallen, die man nur einmal sieht

- **⚠ Unsere eigenen Stiltexte bestellen den Malerei-Look.** `surreal`
  (`styles.js:95`) sagt wörtlich „flat even lighting like a Magritte
  painting", `dreamlike` will „shapes dissolving". Wer sich über gemalt
  aussehende Bilder wundert, liest zuerst dort — nicht beim Modell.
- **⚠ Ein echtes NUL-Byte im Quelltext macht die Datei für Git BINÄR.**
  `git diff` sagt dann nur noch „Binary files differ", und keine Änderung
  daran ist mehr prüfbar. Stand am 24.08. in `sheets.js` und
  `gatekeeper.js` — als bewusster Trenner, nur als Byte statt als Escape
  `\0`. Ein Test in `sheets.test.js` prüft das jetzt.
- **Der BOGEN ist das Nadelöhr der Ähnlichkeit** (`sheets.js`). Jede Szene
  referenziert ihn, nie das Foto. Ein schwaches Modell hier lässt sich
  durch kein starkes Modell danach reparieren.
- **Zwei Fotos je Person, Reihenfolge ist Vertrag:** 1 = Gesicht,
  2 = Ganzkörper (`photosOf` in sheets.js, benannt in
  `buildSheetFromPhotoPrompt`). Wer sie dreht, holt die Statur aus dem
  Gesichtsfoto.
- **`FAL_MODEL_IMAGE` ist ein NAME, kein fal-Slug.** Wählbar sind
  `gpt-image-2`, `nano-banana-pro`, `nano-banana-2`, `nano-banana-2-lite`.
  `seedream-5-lite` ist stillgelegt und wird abgelehnt — mit eigener
  Meldung, nicht als „kennt niemand".
- **Ein falscher Feldname wirft bei fal keinen Fehler** — er liefert still
  das Falsche. `imageModel.js` entscheidet über Endpunkt, Adressformat,
  Stufe und Preis, nie der Aufrufer.
- **GPTs Presets sind winzig:** `portrait_16_9` ist 576×1024. Ohne
  ausdrückliches Pixelmaß liefert ein Raster Kacheln von 288×512.
- **fal-Vorgabe bei GPT ist „high"** — die teuerste Stufe. Bei 4K das
  Siebzehnfache von „low". Deshalb sendet JEDER Auftrag `quality` aus
  `imageStage()`; ein Test prüft ALLE Aufrufer.
- **⚠ Ein Verdrahtungstest muss `matchAll` nehmen, nie `match`.** Am
  24.08. gab es ZWEI Aufrufer von `imageSubmitBody`, und nur einer war
  umgestellt — ein Test auf den ersten Treffer hätte grün gemeldet.
- **⚠ `BILD.usd` ist NICHT unser Einkaufspreis.** Bei GPT Image 2 ist das
  ein Einzelbild in „high" ($0,178). Wir kaufen ein 2×2 in „medium":
  $0,113 für vier Szenen. Die Tabelle kennt mehrere Preise für dasselbe
  Modell — richtig ist der, den unser Auftrag auslöst.
- **Der Foto-Anker folgt dem STIL** (`photorealFor`), nicht dem Aufrufer.
  `dreamlike` und `surreal` sind `painterly` und bekommen ihn nicht: Ein
  Prompt, der erst „wie ein Magritte-Gemälde" und dann „das ist eine
  Fotografie" sagt, ist schlechter als einer, der schweigt.
- **2×2 ist die Rastereinheit, nicht 3×3.** Ein 3×3 wäre je Szene billiger,
  fiele aber auf 1024×1834 und damit UNTER das, was wir heute liefern.
- **Der Weltanker der Bildkette steht als LETZTES Bild.**
- **Eine leere Nacht ist KEIN TRAUM** (`blankNight.js:27`).
- **Keine Teilrettung bei der Schlummernacht** (`streak.js:61`).
- `update()` (`AppState.jsx`) nimmt auch Funktionen: `(prev) => patch`.
- `key={open.id}` am JournalDetail ist Pflicht.
- `PORT` gehört der Oberfläche, `API_PORT` der API.
- Erzeugte Medien NIE im Worktree (`mediaRoot.js`, AGENTS.md).
- **Die Renderskripte kosten echtes Geld** und brauchen `--ja`.
- fal.ai und api.deepseek.com sind aus der Cloud gesperrt (403).
- **Warum die Sitzungen trotz AGENTS.md ohne Worktree laufen:** Die
  Browser-Vorschau startet den Dev-Server immer aus dem HAUPT-Checkout
  (`.claude/launch.json` liegt dort). Aus einem Worktree heraus würde sie
  fremden Code servieren, und die Live-Prüfung wäre blind.

## Werkzeuge

- `bun scripts/raster-rechnung.mjs [n]` — jeder Weg, jeder Preis, ohne
  Aufruf.
- `bun scripts/gpt-preise.mjs [n]` — die GPT-Matrix, Stufe mal Auflösung.
- `bun scripts/bogen-vergleich.mjs <gesicht> [koerper] [--nur=…] --ja`
- `bun scripts/raster-rendern.mjs <traum.json> <bogen> <modell>
  [--stufe=…] [--stil=…] [--foto] --ja`
- `bun scripts/modell-ab.mjs <traum.json> <bogen> [modell]`
- `node scripts/preis-durchreichen.mjs` — Einkauf, Marge, Rabattleiter.

## Was die App ist

React-SPA: Traum aufschreiben oder sprechen → KI macht Bildstrecke,
optional Film, Reflection und Muster. Vier Tabs (Home · Journal · ⊕ ·
Sleep · Profil), Wizard über der Tab-Leiste.
**Stack:** Bun + Vite + React 18 (HashRouter); `server.js` als
schlüsselhaltender Proxy (fal.ai, DeepSeek, Gemini). Zustand in
`localStorage` (`dreamrushes_v1`). Sieben Sprachen, gepflegt **en+de**.

## Geld

Preisliste (`plans.js`): Woche $4,99/12 · Monat ★ $9,99/45 · Jahr
$79,99/45 p.M. · Pakete $2,99/6 · $7,99/18 · $14,99/32.
Bildzahlen: **4 oder 8**. Willkommensgeschenk: **4 Credits**.
Einkauf heute: Bild $0,035 · gemessen möglich: $0,13 je Traum.
