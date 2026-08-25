# STAND — aktueller Projektzustand

> Diese Datei wird bei jedem Sitzungsende KOMPLETT überschrieben.
> Sie zeigt immer nur die Gegenwart. Historie gehört ins WORKLOG.

**Stand:** 2026-08-25 (11:20) — `session/2026-08-24-anton` (PR #27),
aufgesetzt auf `595b04c`. **442 Tests grün**, fünf Skriptprüfungen grün,
Build sauber. Bezahlte Läufe an diesem Tag: **$0,47**.
⚠ Ohne eigenen Worktree im Hauptrepo — Begründung unten unter „Fallen".

## Wo wir stehen

**Die Bildkette ist fertig umgestellt und bezahlt bewiesen.** Alle vier
Schalter liegen:

| Schalter | Stand |
|---|---|
| Bildmodell **GPT Image 2, `medium`** | ✅ |
| **Foto-Anker** an (folgt dem Stil) | ✅ |
| Stil **`ultrareal`** als Vorgabe | ✅ |
| **Raster statt Einzelbildern** | ✅ **bezahlt geprüft** |

Ein Vier-Bilder-Traum: **ein Auftrag, 2160×3840, Kacheln ~1075×1918,
$0,113, vier Credits.** Keine Kette mehr — vier Szenen entstehen in einem
Zug.

**Die Credits sind gestiegen** (Antons Entscheidung): Woche 12→**25**,
Monat und Jahr 45→**100**, Pakete → **13/36/70**. Preise unverändert.
Damit die Rechnung aufgeht, mussten die Filmpreise mit (1/4/6 → **3/9/17**
Credits je Sekunde): Ein Credit kostet uns jetzt überall $0,020–0,028
statt $0,028–0,079. Jahresabo steht in JEDER Verwendung auf 1,7×.

**Ein abgelehnter Traum repariert sich selbst:** Der Grund kommt vom
Server durch bis zum übersetzten Text, und der Knopf „Den Namen von der KI
ersetzen lassen" (gratis) tauscht die geschützte Figur gegen eine
Beschreibung.

**Neu und live:** Antons Frosch als Maskottchen · Alpha-Video-Werkzeug für
iOS und Android · Besetzung überlebt jeden geleerten Speicher.

## Nächste Schritte

1. **⚠ Den Policy-Weg im Echtbetrieb prüfen.** Er ist gebaut und einzeln
   geprüft, aber VIER bezahlte Läufe mit geschützten Namen gingen alle
   durch — der Umschreiber war nie im Einsatz. Ein Traum, der wirklich
   abgelehnt wird, fehlt noch. Siehe Baustellen.
2. **Preisentscheidung** — die Grundlage ist jetzt aktuell und nachrechenbar
   (`node scripts/preis-durchreichen.mjs`). Weiter der einzige echte
   Blocker für die Veröffentlichung.
3. **Was wird aus dem Dreier-Streifen?** (`PREVIEW_COUNT = 3`,
   `pricing.js:105`, `splitIntoPanels`) — eine 16:9-Schnellvorschau aus der
   Seedream-Zeit. Mit 2×2 als Hauptweg ist sie doppelt gemoppelt.
   Umstellen oder streichen: Antons Entscheidung.
4. **Klang-Presets:** 28 CC0-Kandidaten unter `media/klang-kandidaten/`.
5. **Recht, und es ist konkreter geworden:** Der Clooney-Lauf hat einen
   **erkennbaren George Clooney** erzeugt. Das Modell macht echte Personen,
   wenn man sie benennt. Persönlichkeitsrecht gehört auf die Liste in
   Plan §4, mit einer Produktentscheidung davor.

## Bekannte Baustellen

- **⚠ Der Policy-Weg ist ungetestet im Echtbetrieb.** Am 24.08. wurde
  „Freddy Krüger" abgelehnt; am 25.08. ging derselbe Name zweimal durch,
  ebenso „Brad Pitt / George Clooney". Inhaltsfilter sind NICHT
  deterministisch (Seedream 23.08.: 4× durch, 8× abgelehnt, bei wörtlich
  identischen Aufträgen). Wer den Weg prüfen will, braucht einen Traum,
  der wirklich abgelehnt wird — er lässt sich nicht bestellen.
- **Antons Gesicht ist in den Bildern nicht überprüfbar.** Der Bogen wird
  benutzt (Endpunkt `/edit`), aber die Szenentexte des Clooney-Traums
  zeigen ihn nur von hinten und aus der Distanz. Ein Traum mit einer
  frontalen Szene fehlt als Beleg.
- **Nano Banana 2 verfehlte das Raster** in einem von zwei frühen Läufen
  (bezahlt, unbrauchbar). Nach der Einstellungsebene 5 von 5 richtig; der
  Zusammenhang ist plausibel, nicht bewiesen.
- **GPT erfindet dazu, und geht zu dunkel.** Mit Foto-Anker deutlich
  besser, in Nachtszenen weiter spürbar.
- **Das Gesicht verjüngt sich über die Kette.** Foto → Bogen → Szene sind
  zwei Übersetzungen. Der Bogen aus ZWEI Fotos hat das gemildert — und lief
  bis zum 25.08. gar nicht (siehe Fallen).
- **`data/traeume/` UND `media/besetzung/` müssen vor Veröffentlichung
  raus** — Ordner, die vier Endpunkte in `server.js` und die beiden
  Ladepfade in `AppState.jsx`. Alles an `import.meta.env.DEV`.
- **Synthetische Testträume schreiben sich zurück.** Sie stehen in Antons
  localStorage; wirklich weg erst, wenn er sie in der App löscht.
- **Preislinie nicht entschieden.** Jahresabo × Kino bleibt der enge Fall
  (1,7× bei 15 % Store, 1,4× bei 30 %).
- **Kein Zahlungsanbieter.** Dummy-Film im Kaufblatt (`Paywall.jsx`).
- **Antons Berechtigungsliste** (`.claude/settings.local.json`) hat acht
  Einträge; fast jeder Befehl fragt nach. ⚠ Nicht selbst erweitern.

## Fallen, die man nur einmal sieht

- **⚠⚠ Ein Fehler, der Geld kostet, meldet sich NIE von selbst.** Vier
  bezahlte Läufe am 25.08. haben vier davon gefunden, alle stumm:
  `imageCount: 5` (eine Zahl, die es im Angebot nicht mehr gibt) ·
  Rasterplätze statt echter Szenen gezählt · `img2` erreichte den Bogen
  nie · der Bogen fand keinen Ablageort. Kein einziger roter Test.
- **⚠ Der erste bezahlte Lauf gehört mit EINEM Traum gemacht.** Genau so
  wurden alle vier gefunden — bei fünf Träumen hätte es das Fünffache
  gekostet.
- **⚠ Ein Rückfall in einer Preisfunktion kann einen LEBENDEN Fehler
  zudecken.** `priceForImages(5)` fällt auf die kleinste angebotene Zahl
  zurück. Als Netz für ALTE Journaleinträge gedacht — es hat die falsche
  Wizard-Vorgabe versteckt, und der Knopf log „4 Credits", während 5
  abgebucht wurden. Der Rückfall bleibt, aber `pricing.test.js` bewacht
  ihn jetzt.
- **⚠ Vorgaben ABLEITEN, nie hinschreiben.** `imageCount` liest aus
  `IMAGE_COUNTS`, `CREDIT_COST_USD` wird aus dem laufenden Modell
  gerechnet. Beide standen vorher als Konstante da und waren nach einem
  Modellwechsel still falsch.
- **⚠ `slots` ≠ `tiles`.** `slots` sind die Plätze im Raster (immer 4),
  `tiles` die echten Szenen darin (1–4). Der Verschnitt eines angefangenen
  Rasters geht zu UNSEREN Lasten, nie zu seinen.
- **⚠ Ein Schnitt, der beim ERSTEN Fehlschlag aufgibt, macht aus einem
  Aussetzer einen Dauerschaden.** Das Bild war nur noch nicht fertig
  geschrieben. Jetzt drei Anläufe, Zähler AM AUFTRAG — und der Zähler
  gehört in den Fingerabdruck des Effekts, sonst läuft er nie wieder an.
- **⚠ Der BOGEN ist das Nadelöhr der Ähnlichkeit** (`sheets.js`). Jede
  Szene referenziert ihn, nie das Foto.
- **⚠ Zwei Fotos je Person, Reihenfolge ist Vertrag:** 1 = Gesicht,
  2 = Ganzkörper. Der Wizard hat `img2` bis zum 25.08. NICHT
  weitergereicht — die Funktion war tot, seit es sie gibt, und der
  Fingerabdruck lief dadurch auseinander (Bogen galt immer als veraltet
  und wurde bei jedem Render neu bezahlt).
- **⚠ Der Bogen wird über den TAG festgeschrieben, nie über `avatar.id`.**
  Über die id verlor ihn jede Figur, deren id nicht zu `state.cast` passte.
- **⚠ `mix-blend-mode: screen` braucht KEIN `isolation: isolate`.** Das
  erzeugt einen neuen Stapelkontext, und dann ist der schwarze Kasten
  zurück. Das Blenden SOLL bis auf den Seitenhintergrund durchgreifen.
- **⚠ Es gibt kein Alpha-Videoformat für iOS UND Android.** HEVC+Alpha nur
  iOS, VP9+Alpha nur Android. Die Alpha-Packung (`alpha-packen.mjs`) ist
  der Weg; Quelle höchstens 1080×1920, sonst steigen Telefon-Dekoder aus.
- **⚠ After Effects: „Farbe: Straight (Unmatted)".** Steht dort
  „Premultiplied", bekommt jede weiche Kante einen dunklen Saum — ohne
  Fehlermeldung. `--premultipliziert` rechnet es zurück.
- **⚠ React setzt `muted` als Property, nicht als Attribut** — das ist ein
  bekannter Fallstrick, war hier aber NICHT die Ursache. Ein Video ohne
  `autoPlay` startet einfach nicht, und das Poster sieht aus wie Absicht.
- **⚠ Unsere eigenen Stiltexte bestellen den Malerei-Look.** `surreal`
  (`styles.js:95`) sagt wörtlich „like a Magritte painting".
- **⚠ Ein echtes NUL-Byte im Quelltext macht die Datei für Git BINÄR.**
- **`FAL_MODEL_IMAGE` ist ein NAME, kein fal-Slug.** `seedream-5-lite` ist
  stillgelegt und wird mit eigener Meldung abgelehnt.
- **Ein falscher Feldname wirft bei fal keinen Fehler** — er liefert still
  das Falsche. Die Stufe geht an BEIDE Felder (`quality` UND `resolution`),
  die Tabelle entscheidet.
- **fal-Vorgabe bei GPT ist „high"** — bei 4K das Siebzehnfache von „low".
- **2×2 ist die Rastereinheit, nicht 3×3.**
- **Der Weltanker der Bildkette steht als LETZTES Bild.**
- **Eine leere Nacht ist KEIN TRAUM** (`blankNight.js:27`).
- `update()` (`AppState.jsx`) nimmt auch Funktionen: `(prev) => patch`.
- `PORT` gehört der Oberfläche, `API_PORT` der API.
- Erzeugte Medien NIE im Worktree (`mediaRoot.js`, AGENTS.md).
- **Die Renderskripte kosten echtes Geld** und brauchen `--ja`.
- fal.ai und api.deepseek.com sind aus der Cloud gesperrt (403).
- **Warum die Sitzungen trotz AGENTS.md ohne Worktree laufen:** Die
  Browser-Vorschau startet den Dev-Server immer aus dem HAUPT-Checkout
  (`.claude/launch.json` liegt dort).
- **⚠ Zwei Browser, zwei localStorage.** Wer im App-Fenster rendert, sieht
  es in seinem eigenen Chrome NICHT — der Abgleich über `data/traeume`
  ergänzt Bilder inzwischen auch zu bekannten Träumen, aber nur, wenn
  lokal gar keine stehen.

## Werkzeuge

- `bun scripts/raster-rechnung.mjs [n]` — jeder Weg, jeder Preis.
- `bun scripts/gpt-preise.mjs [n]` — die GPT-Matrix, Stufe mal Auflösung.
- `bun scripts/bogen-vergleich.mjs <gesicht> [koerper] [--nur=…] --ja`
- `bun scripts/raster-rendern.mjs <traum.json> <bogen> <modell> … --ja`
- `bun scripts/alpha-packen.mjs <quelle> [ziel.mp4] [--premultipliziert]`
- `node scripts/preis-durchreichen.mjs` — Einkauf, Marge, Rabattleiter.

## Was die App ist

React-SPA: Traum aufschreiben oder sprechen → KI macht Bildstrecke,
optional Film, Reflection und Muster. Vier Tabs (Home · Journal · ⊕ ·
Sleep · Profil), Wizard über der Tab-Leiste.
**Stack:** Bun + Vite + React 18 (HashRouter); `server.js` als
schlüsselhaltender Proxy (fal.ai, DeepSeek, Gemini). Zustand in
`localStorage` (`dreamrushes_v1`). Sieben Sprachen, gepflegt **en+de**.

## Geld

Preisliste (`plans.js`): Woche $4,99/**25** · Monat ★ $9,99/**100** ·
Jahr $79,99/**100** p.M. · Pakete $2,99/**13** · $7,99/**36** ·
$14,99/**70**.
Bildzahlen: **4 oder 8**. Willkommensgeschenk: **4 Credits** (genau ein
kleinster Traum — bewusst nicht mitgestiegen).
Einkauf: **$0,0283 je Bild** · $0,113 je Vier-Bilder-Traum.
Film: 3/9/17 Credits je Sekunde, hergeleitet aus demselben Einkaufspreis.
