# STAND — aktueller Projektzustand

> Diese Datei wird bei jedem Sitzungsende KOMPLETT überschrieben.
> Sie zeigt immer nur die Gegenwart. Historie gehört ins WORKLOG.

**Stand:** 2026-08-24 (11:55) — `session/2026-08-23-anton` (PR #25),
aufgesetzt auf `0960bb4`. 370 Tests grün, fünf Skriptprüfungen grün,
Build sauber.
⚠ Ohne eigenen Worktree im Hauptrepo — Begründung unten unter „Fallen".

## Wo wir stehen

**Die Bildkette ist durchgemessen, aber noch nicht umgestellt.** Ein Tag
bezahlter Vergleiche (~$3,10) hat einen klaren Sieger ergeben:

| Schritt | Modell | Kosten |
|---|---|---|
| Bogen (einmal je Person, aus zwei Fotos) | GPT Image 2 **low** | $0,017 |
| Szenen (4 im 2×2-Raster, Foto-Anker, Stil `ultrareal`) | GPT Image 2 **medium** | $0,113 |
| Garderobe dieses Traums | Text | $0 |

**$0,13 je Vier-Bilder-Traum — 7 % unter dem heutigen Weg**, bei besseren
Gesichtern und echter Fotografie statt Malerei.

⚠⚠ **UMGESTELLT IST NICHTS.** `FAL_MODEL_IMAGE` steht weiter auf
`seedream-5-lite`, der Foto-Anker ist per Vorgabe AUS, und die App rendert
weiter einzeln statt im Raster. Alles oben ist gemessen, nicht ausgerollt.

Dazu neu und live: die **getippte Einführungsumfrage** (ohne Mikrofon gab
es vorher gar kein Profil), die **Einstellungsebene** für Bildprompts, und
**vier statt fünf Bilder** als kleinste Traumgröße.

## Nächste Schritte

1. **Die Assistentin nach der Kleidung fragen lassen.** Das Feld
   (`wardrobe`) existiert und ist bezahlt bewiesen — 36 von 36 Kacheln
   zogen um. Das Briefing in `server.js` (`VOICE_TOOLS`, `addPerson`) kennt
   es noch nicht. Kleinster Schritt, größte Wirkung.
2. **Antons Entscheidung zur Umstellung.** Vier Schalter hängen zusammen:
   Bildmodell auf GPT, Foto-Anker an, Raster statt Einzelbilder, Stil
   `ultrareal` als Vorgabe. Einzeln sinnlos, zusammen der ganze Gewinn.
3. **Was wird aus `dreamlike` und `surreal`?** Sie bestellen wörtlich den
   Malerei-Look (siehe „Fallen"). Entweder als bewusst gemalte Stile
   behalten — dann ohne Foto-Anker — oder fotografisch neu schreiben.
   Produktentscheidung, keine technische.
4. **Preisentscheidung** — weiter offen, weiter der einzige echte Blocker
   für die Veröffentlichung.
5. **Klang-Presets:** 28 CC0-Kandidaten warten unter
   `media/klang-kandidaten/` auf Antons Auswahl.

## Bekannte Baustellen

- **Seedream lehnt Aufträge mit Referenzfoto unregelmäßig ab.** Am 23.08.
  gemessen: mit Referenz 4× durch, 8× abgelehnt, als
  `content_policy_violation` auf `body.image` mit
  `reason: "partner_validation_failed"` — bei wörtlich identischen
  Aufträgen. Kein Geld verloren (`jobStatus` → „failed", der Collector
  erstattet), aber das BILD fehlt, und zwar bei genau den Träumen, in denen
  Menschen vorkommen. ⚠ Das trifft die HEUTIGE Vorgabe und ist nicht
  geklärt. Ein weiterer Grund, die Umstellung nicht liegenzulassen.
- **Nano Banana 2 verfehlte das Raster** in einem von zwei frühen Läufen
  (vier Querformate statt vier Hochkant-Kacheln — bezahlt, unbrauchbar).
  Nach der Einstellungsebene 5 von 5 richtig; der Zusammenhang ist
  plausibel, aber nicht bewiesen.
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
- **`FAL_MODEL_IMAGE` ist ein NAME, kein fal-Slug.** Erlaubt:
  `seedream-5-lite`, `gpt-image-2`, `nano-banana-pro`, `nano-banana-2`,
  `nano-banana-2-lite`. Der Server warnt beim Start bei Unbekanntem.
- **Ein falscher Feldname wirft bei fal keinen Fehler** — er liefert still
  das Falsche. `imageModel.js` entscheidet über Endpunkt, Adressformat,
  Stufe und Preis, nie der Aufrufer.
- **GPTs Presets sind winzig:** `portrait_16_9` ist 576×1024. Ohne
  ausdrückliches Pixelmaß liefert ein Raster Kacheln von 288×512.
- **fal-Vorgabe bei GPT ist „high"** — die teuerste Stufe. Bei 4K das
  Siebzehnfache von „low".
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
