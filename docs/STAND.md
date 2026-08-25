# STAND — aktueller Projektzustand

> Diese Datei wird bei jedem Sitzungsende KOMPLETT überschrieben.
> Sie zeigt immer nur die Gegenwart. Historie gehört ins WORKLOG.

**Stand:** 2026-08-25 (22:50) — `session/2026-08-25-anton` (PR #28),
aufgesetzt auf `802a8d8`. **442 Tests grün**, fünf Skriptprüfungen grün,
Build sauber. Bezahlte Läufe in dieser Sitzung: **keine.**
⚠ Ohne eigenen Worktree im Hauptrepo — Begründung unten unter „Fallen".

## Wo wir stehen

**Die Bildkette ist fertig umgestellt und bezahlt bewiesen.** Alle vier
Schalter liegen: GPT Image 2 auf `medium` · Foto-Anker an · Stil
`ultrareal` · **Raster statt Einzelbildern**. Ein Vier-Bilder-Traum:
**ein Auftrag, 2160×3840, Kacheln ~1075×1918, $0,113, vier Credits.**

**Die Preise stehen, die Entscheidung nicht.** Woche 25 · Monat und Jahr
100 · Pakete 13/36/70; Film 3/9/17 Credits je Sekunde. Ein Credit kostet
uns überall $0,020–0,028. Nachrechnen: `node scripts/preis-durchreichen.mjs`.

**Ein abgelehnter Traum repariert sich selbst:** Der Grund kommt vom Server
durch bis zum übersetzten Text, und der Knopf „Den Namen von der KI
ersetzen lassen" (gratis) tauscht die geschützte Figur gegen eine
Beschreibung.

**Neu in dieser Sitzung: Das Maskottchen tippt den Erzeugen-Knopf selbst.**
Sechs Sekunden Einspieler über dem Bildschirm, während der Auftrag schon
läuft — geschenkte Wartezeit, keine zusätzliche. Dazu die
Maskottchen-Tabelle für die angekündigten drei, und eine Werkbank zum
Ausprobieren (StartMenu → „Mascot test bench").

**Ebenfalls neu: Prominente sind eine eigene Rechtsbaustelle** mit einer
getroffenen Entscheidung statt einer offenen Frage
(`docs/plans/2026-08-20-recht-einwilligung.md` §8).

## Nächste Schritte

1. **Antons Zahl vom Größenregler.** `scale` steht auf **0,65** in
   `src/lib/mascots.js` — gerechnet und gegengerendert, aber nicht
   geschaut. Was der Regler findet, gehört in die Tabelle; im Regler ist
   es ein Prüfstandwert und kein Zustand.
2. **⚠ Den Policy-Weg im Echtbetrieb prüfen.** Gebaut und einzeln geprüft,
   aber VIER bezahlte Läufe mit geschützten Namen gingen alle durch — der
   Umschreiber war nie im Einsatz. Neu dazu: Er muss ENTIDENTIFIZIEREN,
   nicht tarnen (Recht §8d) — das ist jetzt das Prüfkriterium, nicht mehr
   „geht der Auftrag durch".
3. **Preisentscheidung** — weiter der einzige echte Blocker für die
   Veröffentlichung. Die Grundlage ist aktuell und nachrechenbar.
4. **Die zwei anderen Maskottchen**, jeweils als PAAR: Ruhe-Clip und
   Tipp-Clip. Ohne Tipp-Clip fällt das Maskottchen genau an der Stelle
   aus, an der es am meisten auffällt. Offene Punkte im Plan.
5. **Was wird aus dem Dreier-Streifen?** (`PREVIEW_COUNT = 3`,
   `pricing.js:105`, `splitIntoPanels`) — eine 16:9-Schnellvorschau aus
   der Seedream-Zeit. Mit 2×2 als Hauptweg doppelt gemoppelt. Umstellen
   oder streichen: Antons Entscheidung.
6. **Klang-Presets:** 28 CC0-Kandidaten unter `media/klang-kandidaten/`.

## Bekannte Baustellen

- **⚠ Der Policy-Weg ist ungetestet im Echtbetrieb.** Am 24.08. wurde
  „Freddy Krüger" abgelehnt; am 25.08. ging derselbe Name zweimal durch,
  ebenso „Brad Pitt / George Clooney". Inhaltsfilter sind NICHT
  deterministisch (Seedream 23.08.: 4× durch, 8× abgelehnt, bei wörtlich
  identischen Aufträgen). Ein Traum, der wirklich abgelehnt wird, lässt
  sich nicht bestellen.
- **⚠ Der Umschreiber sitzt auf der Kippe.** „Freddy Krüger" → „ein Mann
  mit verbranntem Gesicht, braunem Hut und Klingenhandschuh" ist noch
  erkennbar die Figur. Entidentifizieren ist richtig, tarnen kostet die
  Deckung (Recht §8d).
- **⚠ Der gemalte Frosch wurde nie gesehen.** Geprüft ist alles Messbare:
  Geometrie live, Funke im Browser dekodiert, Aufräumen nach 7,3 s. Das
  Bild selbst konnte die Vorschau nicht zeichnen (siehe Fallen).
- **Antons Gesicht ist in den Bildern nicht überprüfbar.** Der Bogen wird
  benutzt (Endpunkt `/edit`), aber die Szenentexte des Clooney-Traums
  zeigen ihn nur von hinten und aus der Distanz. Ein Traum mit frontaler
  Szene fehlt als Beleg.
- **Nano Banana 2 verfehlte das Raster** in einem von zwei frühen Läufen
  (bezahlt, unbrauchbar). Nach der Einstellungsebene 5 von 5 richtig; der
  Zusammenhang ist plausibel, nicht bewiesen.
- **GPT erfindet dazu, und geht zu dunkel.** Mit Foto-Anker deutlich
  besser, in Nachtszenen weiter spürbar.
- **Das Gesicht verjüngt sich über die Kette.** Foto → Bogen → Szene sind
  zwei Übersetzungen. Der Bogen aus ZWEI Fotos hat das gemildert.
- **`data/traeume/` UND `media/besetzung/` müssen vor Veröffentlichung
  raus** — Ordner, vier Endpunkte in `server.js`, beide Ladepfade in
  `AppState.jsx`. Alles an `import.meta.env.DEV`.
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
  `imageCount: 5` · Rasterplätze statt echter Szenen gezählt · `img2`
  erreichte den Bogen nie · der Bogen fand keinen Ablageort. Kein
  einziger roter Test.
- **⚠⚠ Ein ANKER, der ins Leere zeigt, meldet sich genauso wenig.**
  Antons Tipp-Animation und sein Referenzknopf lagen 35 % der Bildbreite
  auseinander. Formatfüllend eingebaut hätte der Frosch danebengetippt —
  durch jeden Test, jeden Build. Gefunden nur durchs Nachmessen: Funke bei
  14,5 % / 78 %, Knopf bei 49,3 % / 84,8 %.
- **⚠ Der Tipp-Anker gehört zur DATEI, nicht zur App** (`mascots.js`).
  Jede Zeichnung trifft den Knopf woanders in IHREM Bild. Als globale Zahl
  im Bauteil tippt das zweite Maskottchen lautlos daneben. Messanleitung
  im Maskottchen-Plan.
- **⚠ Der Einspieler ist NIE ein Tor** (`ButtonTapOverlay.jsx`). Der
  Auftrag geht vor dem ersten Einzelbild raus — davon lebt der Zeitgewinn.
  Wer das umdreht, baut die Selbstheilung wieder zu: Eine Ablehnung kommt
  schneller zurück als sechs Sekunden.
- **⚠ ProRes spielt in KEINEM Browser.** Ein `.mov` aus After Effects
  direkt einzubauen gibt einen schwarzen Kasten — das ist kein
  Alpha-Problem, das ist der Codec. Immer durch `alpha-packen.mjs`.
- **⚠ Premultipliziert erkennt man am Zahlenverlauf:** Fällt die Farbe mit
  dem Alphawert (A=255→R=148, A=117→R=69), ist sie schon multipliziert.
  Bliebe R konstant, wäre es „straight". Falsch geraten kostet einen
  dunklen Saum an jeder weichen Kante — ohne Fehlermeldung.
- **⚠ Der erste bezahlte Lauf gehört mit EINEM Traum gemacht.**
- **⚠ Ein Rückfall in einer Preisfunktion kann einen LEBENDEN Fehler
  zudecken.** `priceForImages(5)` fällt auf die kleinste angebotene Zahl
  zurück; `pricing.test.js` bewacht das jetzt.
- **⚠ Vorgaben ABLEITEN, nie hinschreiben.** `imageCount` liest aus
  `IMAGE_COUNTS`, `CREDIT_COST_USD` wird gerechnet.
- **⚠ `slots` ≠ `tiles`.** Plätze im Raster (immer 4) gegen echte Szenen
  darin (1–4). Verschnitt geht zu UNSEREN Lasten.
- **⚠ Ein Schnitt, der beim ERSTEN Fehlschlag aufgibt,** macht aus einem
  Aussetzer einen Dauerschaden. Drei Anläufe, Zähler AM AUFTRAG — und der
  Zähler gehört in den Fingerabdruck des Effekts.
- **⚠ Der BOGEN ist das Nadelöhr der Ähnlichkeit** (`sheets.js`). Jede
  Szene referenziert ihn, nie das Foto.
- **⚠ Zwei Fotos je Person, Reihenfolge ist Vertrag:** 1 = Gesicht,
  2 = Ganzkörper.
- **⚠ Der Bogen wird über den TAG festgeschrieben, nie über `avatar.id`.**
- **⚠ `mix-blend-mode: screen` braucht KEIN `isolation: isolate`.**
- **⚠ Es gibt kein Alpha-Videoformat für iOS UND Android.** HEVC+Alpha nur
  iOS, VP9+Alpha nur Android. Die Alpha-Packung ist der Weg; Quelle
  höchstens 1080×1920.
- **⚠ After Effects: „Farbe: Straight (Unmatted)".** Sonst dunkler Saum;
  `--premultipliziert` rechnet es zurück.
- **⚠ React setzt `muted` als Property, nicht als Attribut** — bekannter
  Fallstrick, war hier aber NICHT die Ursache. Es fehlte `autoPlay`.
- **⚠ Unsere eigenen Stiltexte bestellen den Malerei-Look.** `surreal`
  (`styles.js:95`) sagt wörtlich „like a Magritte painting".
- **⚠ Ein echtes NUL-Byte im Quelltext macht die Datei für Git BINÄR.**
- **`FAL_MODEL_IMAGE` ist ein NAME, kein fal-Slug.**
- **Ein falscher Feldname wirft bei fal keinen Fehler** — er liefert still
  das Falsche. Die Stufe geht an BEIDE Felder, die Tabelle entscheidet.
- **fal-Vorgabe bei GPT ist „high"** — bei 4K das Siebzehnfache von „low".
- **2×2 ist die Rastereinheit, nicht 3×3.**
- **Der Weltanker der Bildkette steht als LETZTES Bild.**
- **Eine leere Nacht ist KEIN TRAUM** (`blankNight.js:27`).
- `update()` (`AppState.jsx`) nimmt auch Funktionen: `(prev) => patch`.
- `PORT` gehört der Oberfläche, `API_PORT` der API.
- Erzeugte Medien NIE im Worktree (`mediaRoot.js`, AGENTS.md).
- **Die Renderskripte kosten echtes Geld** und brauchen `--ja`.
- fal.ai und api.deepseek.com sind aus der Cloud gesperrt (403).

### Was die Werkzeuge auf diesem Rechner NICHT können

- **⚠ `node` gibt es hier nicht, nur `bun`.** `npm test` läuft deshalb
  nicht durch. Stattdessen: `bun test`, danach die fünf `.mjs`-Prüfungen
  einzeln mit `bun` aufrufen (`test-static`, `test-prompt-sanitize`,
  `test-contrast`, `check-i18n-shape`, `test-rtl`).
- **⚠ Die Browser-Vorschau kann WebGL nicht prüfen.** Sie meldet
  `visibilityState: "hidden"`; in einem verborgenen Tab läuft
  `requestAnimationFrame` nicht, also zeichnet keine WebGL-Fläche je ein
  Bild. Auch `setInterval` wird auf ~1/s gedrosselt. Alles rund um
  `AlphaVideo.jsx` muss in einem echten Browserfenster geprüft werden.
- **Warum die Sitzungen trotz AGENTS.md ohne Worktree laufen:** Die
  Browser-Vorschau startet den Dev-Server immer aus dem HAUPT-Checkout
  (`.claude/launch.json` liegt dort). Im Worktree würde `main` geprüft,
  nicht der Sitzungsstand.
- **⚠ Zwei Browser, zwei localStorage.** Wer im App-Fenster rendert, sieht
  es im eigenen Chrome NICHT — der Abgleich über `data/traeume` ergänzt
  Bilder auch zu bekannten Träumen, aber nur, wenn lokal gar keine stehen.

## Werkzeuge

- `bun scripts/raster-rechnung.mjs [n]` — jeder Weg, jeder Preis.
- `bun scripts/gpt-preise.mjs [n]` — die GPT-Matrix, Stufe mal Auflösung.
- `bun scripts/bogen-vergleich.mjs <gesicht> [koerper] [--nur=…] --ja`
- `bun scripts/raster-rendern.mjs <traum.json> <bogen> <modell> … --ja`
- `bun scripts/alpha-packen.mjs <quelle> [ziel.mp4] [--premultipliziert]`
- `node scripts/preis-durchreichen.mjs` — Einkauf, Marge, Rabattleiter.
- **StartMenu → „Mascot test bench"** — Tipp-Einspieler ausprobieren,
  Größenregler. Dev-Werkzeug, stirbt mit dem StartMenu.

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
Bildzahlen: **4 oder 8**. Willkommensgeschenk: **4 Credits**.
Einkauf: **$0,0283 je Bild** · $0,113 je Vier-Bilder-Traum.
Film: 3/9/17 Credits je Sekunde, aus demselben Einkaufspreis hergeleitet.
