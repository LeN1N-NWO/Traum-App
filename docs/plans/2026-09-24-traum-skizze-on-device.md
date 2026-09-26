# Traum-Skizze: Gratis-Generierung auf dem iPhone (Recherche 24.09.2026)

> **Stand 25.09.2026: GEBAUT (v1)** — Antons „können wir das jetzt bauen".
> Ende zu Ende im Simulator belegt (Download 889 MB → 4 Szenen gemalt →
> 11,7-s-Film 576×1024 → Journal, spielt ab); auf Antons iPhone 17 Pro
> installiert, dort noch ungetestet. Aufbau unten unter „Umsetzung v1".

**Antons Vision:** Eine Stufe ohne Credits — Traum reinsprechen, das iPhone
rendert mit eigener Rechenleistung etwas daraus. Darf niedrig aufgelöst,
„richtig schlecht", aber kostenlos sein. Unterhaltung wie im Film. KEINE
Templates — der Traum wird wirklich generiert.

## Befund 1: Echtes Text-zu-Video auf dem iPhone ist Forschung, kein Produkt

| Projekt | Stand | Zahl, die zählt |
|---|---|---|
| **On-device Sora** (eai-lab, MIT, Swift/Xcode-Projekt auf GitHub) | läuft wirklich, iPhone 15 Pro+ | **638 s (10½ min)** für 256×256, 68 Frames; Modelle ~6 GB nach Quantisierung |
| **MOVD** (eai-lab, WACV 2026) | Nachfolger, dieselbe Idee | ähnliche Größenordnung |
| **SnapGen-V** (Snap Research) | 5-s-Video in ~4 s auf iPhone 16 Pro Max | **keine offenen Gewichte/Code gefunden** — nur Paper |
| **Wan 2.2 TI2V 5B** (Apache 2.0) | läuft in Draw Things auf iPhones | Minuten je Clip, braucht viel RAM; keine belastbaren iPhone-Zeiten |

→ Heute nicht produktreif: 10 Minuten Wartezeit, heißes Telefon, leerer
Akku, 256 Pixel. SnapGen-V zeigt, dass es kommt — beobachten.

## Befund 2: Bilder auf dem iPhone sind gelöst

- **Stable Diffusion 1.5 über Core ML** (Apples `ml-stable-diffusion`,
  fertiges Swift-Paket): **unter 5 s je 512×512-Bild** auf aktuellen
  iPhones. Lizenz CreativeML OpenRAIL-M: kommerziell erlaubt, ohne
  Umsatzgrenze, mit Nutzungsbeschränkungen (Lizenztext an Nutzer
  weitergeben). SDXL auf iPhone 17 Pro möglich, aber langsamer/heißer.
- **SnapGen** (379M, 1024 px in 1,4 s) — ebenfalls keine offenen Gewichte
  gefunden.
- ⚠ **Apples Image Playground fällt als Basis weg:** Die programmatische
  `ImageCreator`-API ist ab **iOS 27 abgeschaltet**; die neuen Modelle
  laufen in Apples Private Cloud mit **Nutzungslimits**, und es bleibt
  nur Apples eigene System-Oberfläche. Apple empfiehlt Entwicklern
  ausdrücklich einen eigenen Dienst.

## Befund 3: Der „Game-Engine"-Teil — Bewegung aus einem Standbild

- **Depth Anything V2 small**, von Apple fertig nach Core ML konvertiert
  (Hugging Face `apple/coreml-depth-anything-v2-small`): **~34 ms** je
  Bild auf iPhone 15 Pro Max → Tiefenkarte.
- Mit Tiefenkarte rendert Metal/RealityKit eine **2.5D-Kamerafahrt IN das
  Bild** (Parallaxe, Vordergrund wandert gegen Hintergrund) — in Echtzeit,
  bei jeder Auflösung, gratis. Die Engine liefert die Bewegung, die KI
  den Inhalt → keine Templates.

## Empfehlung: „Traum-Skizze" als hybride Gratis-Stufe

1. Traum → Szenen (unsere Analyse; ggf. on-device mit Apples Foundation
   Models, damit auch dieser Schritt 0 € kostet — zu prüfen)
2. 3–5 Keyframes, je Szene eins, **auf dem iPhone** mit Core ML SD 1.5
   (512 px, ~5 s je Bild → ~20–30 s gesamt)
3. Tiefenkarte je Bild (Depth Anything V2, Millisekunden)
4. Metal rendert 10–15 s „Traum-Skizze": Kamerafahrt durch jedes Bild,
   traumhafte Überblendung/Verwandlung zwischen den Szenen (passt zu
   „One-Take" und zur Traumlogik), exportierbar als Video

Kosten je Skizze für uns: **0 €**. Voraussetzungen: iPhone 15 Pro oder neuer
(8 GB RAM), einmaliger Modell-Download ~1–2 GB (nicht im App-Bündel —
Nachladen per Background Assets), Sicherheitsfilter (SD bringt einen
Safety-Checker mit; App Review 1.2 gilt auch für On-Device-Inhalte).

**Produktlogik:** Die Skizze ist der Köder, der Film das Produkt —
„Gefällt dir deine Skizze? Mach einen echten Film daraus" (Upsell).

## Günstige Cloud-Rückfalloption (falls on-device nicht reicht)

- Schon im Einsatz und am günstigsten: **H3 Max Turbo 480p, $0,025/s**
  → 5-s-Clip ~12 Cent. Eine Gratis-Kurzskizze je Tag wäre damit
  Marketingbudget, kein Produktverlust.
- LTX-2 Fast auf fal: $0,04/s (1080p).
- Später selbst gehostet: Wan 2.2 TI2V 5B (Apache 2.0) auf gemietetem GPU.

## Offen / nächster Schritt

- Machbarkeits-Probe (Spike, eigener Branch): Core ML SD 1.5 + Depth +
  Parallaxe in einem Test-Bildschirm. ⚠ Nur am **echten iPhone**
  aussagekräftig — der Simulator hat keine Neural Engine.
- Stil-Frage: SD 1.5 roh sieht „2022" aus; ein traumhafter Fein-Stil
  (LoRA, eigene Lizenz prüfen) kann den Look tragen.

## Quellen
On-device Sora: github.com/eai-lab/On-device-Sora, arxiv.org/abs/2502.04363 ·
MOVD: github.com/eai-lab/MOVD · SnapGen-V: snap-research.github.io/snapgen-v ·
SnapGen: snap-research.github.io/snapgen · ImageCreator-Aus:
developer.apple.com/news/?id=dz9wvq0r · Core ML SD: github.com/apple/ml-stable-diffusion ·
Depth Anything V2: huggingface.co/apple/coreml-depth-anything-v2-small ·
Wan 2.2 Lizenz: huggingface.co/Wan-AI/Wan2.2-TI2V-5B · LTX-2 Preise:
fal.ai/models/fal-ai/ltx-2.3/image-to-video/fast

## Umsetzung v1 (25.09.2026)

- **Natives Modul** `mobile/modules/dream-sketch` (lokales Expo-Modul,
  autolinked, nur `pod install` — kein Hand-Edit in `mobile/ios`):
  Apples `ml-stable-diffusion` (MIT, 26 Dateien ohne SD3/T5, Herkunft in
  `ios/StableDiffusion/UPSTREAM.txt`), `SketchModel.swift` (Download der
  4 nötigen Teile, 889 MB statt 1,5 GB, dateiweise Wiederaufnahme, aus
  dem iCloud-Backup ausgenommen), `SketchRenderer.swift` (Kamerafahrt
  durchs Quadrat als 9:16-Fenster, Überblendungen, Bloom + Vignette,
  AVAssetWriter), `DreamSketchModule.swift` (JS-Schnittstelle).
- **App:** dritte Karte „Skizze · GRATIS" in `dream/length.tsx` (nur wo
  das Gerät ≥ 8 GB RAM hat), Bildschirm `dream/sketch.tsx` (Download →
  Malen mit Live-Vorschau → Film → Journal), Brücken-Befehl `sketch`
  (`runSketch`), Adressen als `sketch:<datei>` — aufgelöst EINMAL in
  `journal-data.tsx` (`resolveSketchesDeep`), weil der Container-Pfad
  bei jedem Update wechselt.
- **Gemessen (Simulator, Mac-CPU statt Neural Engine):** ~50 s je Bild,
  4 Szenen + Film ≈ 5 min. Auf dem iPhone deutlich schneller zu erwarten
  — beim ersten Mal kommt einmalig die Neural-Engine-Kompilierung dazu.

## Vor der Einreichung offen

1. **Inhaltsprüfung (Preflight B8):** heute `disableSafety = true`, nur
   Negativ-Prompt. SafetyChecker (580 MB) oder eigene Prüfung einbauen.
2. **Lizenzhinweis SD 1.5** (CreativeML OpenRAIL-M verlangt, die
   Nutzungsbeschränkungen an Nutzer weiterzugeben) → Rechtstexte.
3. **Modell-Hosting:** lädt heute direkt von Hugging Face — für den
   Betrieb auf eigenen Speicher legen (Hannis Hosting-Plan).
4. Stil: SD 1.5 roh; ein Traum-LoRA/Fein-Stil würde den Look tragen.
5. ~~Tiefenkarte für echte 2.5D-Parallaxe~~ — **gebaut 25.09.** (s. u.)

## v2: Tiefe (25.09.2026, Antons Befund „nur eine Slideshow")

- `SketchDepth.swift`: Depth Anything V2 small (Apple, Core ML F16,
  ~50 MB, als .mlpackage geladen und auf dem Gerät EINMAL kompiliert).
  `SketchParallax.warp`: je Bild eine Verschiebung je Tiefe — seitlicher
  Schwenk (Richtung wechselt je Szene) + Dolly nach vorn, Fokus im
  Mittelgrund; rückwärts gerechnet (keine Löcher), Tiefe zweimal
  nachgeschlagen gegen verschmierte Ränder. Das Fenster über dem
  Quadrat gleitet mit Tiefe nur noch ruhig — die Bewegung trägt die Tiefe.
- Stärke am Leuchtturm-Test eingestellt: dx 0,065 / Dolly 0,15 (0,045 /
  0,10 war zu zaghaft; darüber reißt Turm-vor-Himmel auf).
- Geräte mit Mal-Modell laden nur die ~50 MB nach (Knopf zeigt
  „Laden · 50 MB"; `isReady` prüft jetzt jede Datei, nicht nur die Marke).
- Belegt: Mac-Probe (gleiche Swift-Dateien) 1,5 s für den ganzen Film
  inkl. 4 Tiefenkarten, Tiefenkarte deckungsgleich; Simulator Ende zu Ende
  inkl. On-Device-Kompilierung; derselbe Frame mit/ohne Tiefe weicht im
  Mittel 20,9/255 ab (die Tiefe wirkt, kein stiller Rückfall).

## v3: „Das Bestmögliche" (25.09.2026, Antons Auftrag: alle Schritte)

Antons Befunde nach dem ersten Blick: eigene Fotos gehen nicht, der
Kontext ist komisch, mehr Tiefe, besseres Modell probieren, Übergänge
morphen statt überblenden. Umgesetzt:

1. **Kontext** — `src/lib/sketchPrompt.js` + `/api/sketch-prompts`. Die
   Analyse-Beats sind Regiesätze mit Namen; SD 1.5 liest 77 Tokens und
   kennt keine Namen (jede Szene malte eine andere Person). DeepSeek
   schreibt die gewählten Beats zu kurzen SD-Stichworten um, jede Figur
   bekommt EINE feste Beschreibung, die in jeder Szene wörtlich wiederkehrt;
   der Träumer wird „von hinten" gemalt (kein falsches Gesicht). Dazu wählt
   es die Teilchen-Art. Gratis für den Menschen (Klasse „text" im
   Gatekeeper), ~10 s, läuft schon während der Einrichtung. Ohne Server:
   `sketchFallback` (Namen raus, neutrale Worte rein). Belegt am
   U-Bahn/Wal-Traum: „a young man, grey hoodie, dark wet hair …" in allen
   vier Szenen gleich.
2. **Eigene Fotos** — die Besetzung (`resolveCast`, dieselbe wie beim
   Film-Auftrag) liefert die Fotos; das erste (Menschen vor Tieren vor
   Orten, das eigene zuerst) wird zur **Foto-Eröffnung**: das echte Foto mit
   Tiefe und Kamera, dann zwei Bild-zu-Bild-Stufen (Stärke 0,42 / 0,64) auf
   die erste Szene hin — „dein Foto beginnt zu träumen" — und es löst sich
   in die erste Szene auf. Dafür lädt der Maler den VAEEncoder nach (68 MB).
   Der Ausschnitt folgt dem Gesicht (Vision), EXIF-Drehung wird beachtet.
   Das Foto bleibt auf dem Gerät. Ehrliche Grenze: Gesichtstreue IN den
   gemalten Szenen gibt SD 1.5 ohne IP-Adapter nicht her — die Eröffnung ist
   der Weg, das echte Gesicht in den Film zu bringen.
3. **Morph** — `morphPrompt`/`morphWeight` in Apples Pipeline (einzige
   Änderung am Fremdcode, UPSTREAM.txt): gleiches Rauschen (ein Seed je
   Traum), Prompt-Einbettung zwischen Szene A und B gemischt → Zwischenbilder
   (2 je Übergang, Gewicht ⅓ / ⅔), dicht überblendet (0,45 s je Stufe).
   Anfang und Ende sind exakt die Szenen, dazwischen verwandelt sich A in B.
4. **Mehr Tiefe und Bewegung** — `SketchRenderer.swift` neu: EINE
   durchgehende, schwebende Kamera über den ganzen Film (dx 0,085 statt
   0,065, Dolly 0,04–0,20 atmend), das Nahe in der Tiefenkarte vorher
   geweitet (Kanten reißen weniger), eine **Vertigo-Szene** (Dolly-Zoom auf
   der Signatur-Szene des Traums), das Ferne **wogt** (Himmel/Wasser, im
   Warp), **Nebel** treibt im Fernen (Rauschen × Tiefenmaske), **Teilchen in
   der Tiefe** (`SketchParticles.swift`: Staub/Schnee/Glühwürmchen/Funken/
   Blasen, mit Parallaxe, Bokeh nah, verdeckt von Figuren davor).
5. **Zweiter Maler zum Vergleich** — DreamShaper 8 (Lykon, OpenRAIL-M;
   Civitai: Nennung nicht Pflicht), fertig umgewandelt von
   `darkmaniac7/TokForge-DreamShaper-8-CoreML-6bit`, **auf Commit 03c659e
   festgenagelt**, gleicher Aufbau wie Apples Modell (958 MB, mit Encoder).
   Wahl auf dem Skizzen-Bildschirm, das Gerät merkt sie sich. ⚠ Umwandlung
   eines Dritten mit 0 Downloads — vor dem Store selbst umwandeln oder
   spiegeln (Hosting-Punkt oben).

**Rechenzeit:** 4 Szenen + 6 Zwischenbilder + 2 Foto-Stufen = 12 Bilder
statt 4. Stellschrauben in `sketch.tsx`: `MORPHS`, `PHOTO_STRENGTHS`,
`STEPS`. Antons Stoppuhr vom iPhone entscheidet, ob 2 Zwischenbilder
bleiben.

**Noch nicht:** Erzählstimme + Untertitel, Klangteppich, LCM-Schnellmodus
(bräuchte eigenen Scheduler), „mit echter Bewegung aufwerten" (Turbo-Cloud,
kostet Credits).

**Belegt (25.09.):**
- Simulator Ende zu Ende mit Foto: Server-Szenen kommen an (Figur „von
  hinten", in allen Szenen gleich), Foto → 0,42 → 0,64 → Szene verwandelt
  sich sichtbar, 6 Morph-Bilder, Film 20,2 s / 484 Bilder, ins Journal.
  Dauer im Simulator (Mac-CPU) 19 min für 12 Bilder.
- Neural Engine (Mac-Probe, dieselben Swift-Dateien): **12 s je Bild**,
  erstes Laden einmalig ~4 min (Übersetzung für die Neural Engine). Fürs
  iPhone 17 Pro ähnlich zu erwarten → 12 Bilder ≈ 2–3 min.
- Nebel-Fehler gefunden und behoben (Alpha im Zufallsgenerator, s. Commit
  677a3cf); Renderer-Probe rendert den ganzen Film in ~3,5 s.
- DreamShaper 8 läuft mit unserer Pipeline (Mac-Probe, gleicher Prompt und
  Seed wie SD 1.5): deutlich filmischer, Figur und Schnee im Glaswald
  getroffen, wo SD 1.5 beides verlor. Empfehlung: DreamShaper als Standard,
  sobald Lizenz/Hosting (eigene Umwandlung oder Spiegel) geklärt sind.

## v4-Test: Cloud-Raster + iPhone-Film (25.09.2026, Antons Idee)

Ein bezahlter Aufruf, 2×2-Raster 1024² mit dem Besetzungsfoto als Referenz
und dem Look-Preset im Prompt (`buildGridPrompt`, neu: `tile: "1:1"`) →
vier 512²-Kacheln → iPhone macht nur Tiefe/Kamera/Nebel/Teilchen.
Gemessen am Jonas-Test (Traum „schwimmender Leuchtturm", Stil Surreal):

| Modell | Dauer | Preis je Traum | Ergebnis |
|---|---|---|---|
| GPT Image 2 `low` (edit) | 18 s | $0,015 (Preistabelle) | Gesicht hält, vier klare Einstellungen, bester Look |
| FLUX.2 klein 9B (edit) | 4 s | ~$0,012–0,02 ($0,011/MP) | Gesicht hält etwas schwächer, sonst gut |
| FLUX Kontext dev | 16 s | ~$0,026 | unbrauchbar: kein Raster, nur das Foto zurück |

Befund zum Übermalen: SD-Bild-zu-Bild (Stärke 0,5) für Morph-Bilder
tauscht das Gesicht aus. Antons Punkt dazu: nicht übermalen — der Look
kommt schon über das Preset im Bildprompt. Folge: Mit Cloud-Kacheln
braucht das iPhone das 1-GB-Malmodell NICHT, nur die Tiefe (50 MB); der
Film rechnet in Sekunden (Mac-Probe 3–4 s).

Noch zu tun, falls es so kommt: Nebel und nahes Bokeh sind für
Porträt-Kacheln zu kräftig (legen sich vor Gesichter) — für echte Fotos
zurücknehmen.

## v5: Umgebaut auf Cloud-Raster (25.09.2026 abends, Antons „so umbauen")

- **Ablauf:** sketchPrep (Brücke: Besetzung → höchstens 3 Fotos in
  Klausel-Reihenfolge, `buildGridPrompt` 2×2 mit `tile: "1:1"` und dem
  gewählten Look-Preset, Teilchen aus den Beats, Kontingent) →
  `referenceData` (nativ: Foto → JPEG-data-URI ≤ 1024) → sketchGrid (Brücke →
  `/api/sketch-grid` → GPT Image 2 `low` 1024², edit mit Fotos / t2i ohne) →
  `importGrid` (nativ: 4 Kacheln, 2 % Rand weg) → optional echtes Foto als
  Eröffnung → `renderSketch` (keine Morph-Bilder, stattdessen
  **Tiefen-Überblendung**: die neue Szene taucht vom Nahen her auf, 1,4 s;
  Nebel 0,12; ruhigeres Bokeh).
- **Kosten:** `src/lib/sketchQuota.js` — 3 je Kalendermonat gratis, danach
  1 Credit; gezählt/abgebucht erst nach gelungenem Raster. Zähler liegt wie
  die Credits auf dem Gerät (scharf erst mit der Anmeldung); der Server loggt
  jeden Aufruf mit Preis (settleCharge + „≤ $0.015").
- **iPhone:** braucht nur noch die Tiefe (Maler „cloud" = 50 MB), jedes Gerät
  (`isSupported` = true; `canPaint` für den alten SD-Weg). Film in ~4 s
  (Mac-Probe). Der SD-Code bleibt vorerst im Modul, wird aber nicht mehr
  aufgerufen → Preflight B8 grün.
- **Test 25.09.** (neuer Traum „Dach mit Uhren, Katze Mila, Wolkentreppe,
  Lichtzug", eigenes Foto für „ich", Looks zufällig: surreal, actionfigure,
  romantic): drei Raster je ~20 s über den echten Server-Weg, Schnitt mit
  dem App-Code sauber (keine Trennlinien), drei Filme je 19,4 s in ~4 s.
  Gesicht hält über alle drei. Befunde: (1) **Action Figure kommt bei
  „low" kaum an** — sieht eher nach 3D-Film aus als nach Spielfigur;
  (2) der **Hintergrund des Referenzfotos sickert** in einzelne Kacheln
  (Fenster/Lampe aus dem Foto). Beides betrifft den Raster-Prompt allgemein.
- **Ton (Antons Frage):** Auf dem Gerät gibt es nichts Fertiges — Stable
  Audio Open Small (Stability, ~341 M Parameter, läuft auf Handys) bräuchte
  eine eigene Core-ML-Umwandlung und steht unter der Stability-Community-
  Lizenz (frei unter $1 Mio. Umsatz). Günstig und sofort: fal MMAudio v2
  (Video → passender Ton) für $0,001 je Sekunde, also ~2 Cent je Skizze.
