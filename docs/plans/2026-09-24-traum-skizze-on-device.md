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
5. Nächste Ausbaustufe: Tiefenkarte (Depth Anything V2) für echte
   2.5D-Parallaxe statt reiner Fahrt.
