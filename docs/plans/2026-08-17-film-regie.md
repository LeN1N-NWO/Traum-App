# Film-Regie: mehrere Modelle, echte Referenzen, ein Regisseur im Server

> Geplant 17.08.2026, nach Antons Ansage: Träume, die schon Bilder und Text
> haben, sollen ein „rundes Video" bekommen — 15 oder 30 Sekunden, wählbares
> Modell, teurere Modelle kosten mehr Credits. Der Prompt dafür entsteht mit
> der CINEDANCE-Methodik (Seedance-Skill) über das Flash-Modell.
> **In dieser Sitzung wurde nichts generiert und kein Credit ausgegeben** —
> alle Marktzahlen stammen von den fal.ai-Modellseiten (abgerufen 17.08.),
> alle Systembefunde aus dem Code.

## 1 · Was heute wirklich passiert (drei Befunde)

Der Filmpfad läuft über den Wizard (`Step5Style.jsx`), auch aus dem Journal —
„Kurzfilm machen" springt mit `resume` dorthin und bringt Text, eigene Bilder
(als Keyframe-Kandidaten) und die Analyse mit. Das ist die richtige
Architektur; sie bleibt. Aber:

**Befund 1 — Der Film bekommt einen Standbild-Prompt.** `Step5Style.jsx:105`
schickt wörtlich `buildImagePrompt(...)` mit: *„A cinematic, photoreal film
still: …"* — an ein **Video**modell. Keine Kamera, kein Timing, keine
Bewegung, kein Blocking. Was minimax daraus macht, ist Zufall. Das ist die
Lücke, die die Regie füllt.

**Befund 2 — Die Modellwahl erreicht den Server nicht.** `video.js` kennt
`standard` und `premium`, Step 5 zeigt beide an und **rechnet den Preis nach
Wahl ab** — aber `w.videoModel` steht nicht im Request
(`Step5Style.jsx:100`), und der Server liest kein `body.model`. Jede
Bestellung rendert `FAL_MODEL_VIDEO` (minimax). Wer Premium 30 s wählt,
zahlt 6 Credits/s und bekommt minimax, von `falSubmitVideo` zusätzlich hart
auf 15 s geklemmt (`server.js:912`). **Das ist heute ein echter Fehler**,
kein fehlendes Feature — er wird als Erstes behoben, unabhängig vom Rest.

**Befund 3 — Referenzen enden am Keyframe.** `startVideo` benutzt die
mitgeschickten Referenzen nur, um das Startbild zu rendern. Das Videomodell
selbst sieht genau ein Bild. Gesichter bleiben nur so ähnlich, wie das eine
Standbild sie zeigt.

## 2 · Der Markt (fal.ai, abgerufen 17.08.2026)

| Modell | kann | Dauer | $/s | Credits/s* |
|---|---|---|---|---|
| `minimax/h3/image-to-video` 768P | 1 Bild animieren, Ton | 5–15 s | 0,08 | **1** |
| `bytedance/seedance-2.0/mini/reference-to-video` 720p | **bis 9 Referenzen**, Ton | 4–15 s | 0,0928 | **2** |
| `bytedance/seedance-2.0/fast/reference-to-video` 720p | **bis 9 Referenzen**, Ton | 4–15 s | 0,2419 | **4** |
| `bytedance/seedance-2.0/reference-to-video` 720p | bis 9 Referenzen, Ton, 1080p möglich | 4–15 s | 0,3024 | 4 |
| `bytedance/seedance-2.5/image-to-video` 720p | 1 Startbild (+ optional Endbild), Ton | **4–30 s** | 0,473 | **6** |

\* 1 Credit = $0,08 (Kostenparität zum Bild, `pricing.js`), **aufgerundet,
nie ab** — dieselbe Regel, mit der `premium` schon auf 6 kam.

**Die zwei Fakten, die das Produkt formen:**

1. **Referenz-Video (`reference-to-video`) nimmt bis zu 9 Bilder** über
   `image_urls` und adressiert sie im Prompt als `@Image1`…`@Image9` — das
   ist wörtlich unser Referenzsystem (`buildReferences()` nummeriert schon
   heute „Reference image N shows @tag"), nur eine Modellgeneration weiter.
2. **9 Referenzen und 30 Sekunden gibt es nicht im selben Modell.** 2.0-R2V
   endet bei 15 s; 2.5 kann 30 s, nimmt aber nur ein Startbild. Wer beides
   will, muss zwei Versprechen trennen (siehe Zielbild) oder verketten
   (siehe Testplan T5 — R2V akzeptiert Videos als Eingabe, mit 40 % Rabatt
   auf $/s; ungeprüft).

Nebenbefund: `minimax/hailuo-02/standard` (768p) listet $0,045/s — fast die
Hälfte unseres heutigen Standards. Gleiche Familie, neuere Karte. Ob die
Qualität hält → Testplan T6.

## 3 · Das Zielbild: drei Angebote statt zwei Modelle

Dem Nutzer werden keine Modellnamen erklärt, sondern drei Versprechen —
Antons Vorgabe: „ein günstiges Modell kostet weniger Credits, dafür weniger
Sekunden" als Ton der Beschriftung.

| | dahinter | Credits/s | Dauer | das Versprechen (Beschriftungs-Ton) |
|---|---|---|---|---|
| **Lebendig** | minimax/h3 (heute „standard") | 1 | 5–15 s | „Dein Bild beginnt sich zu bewegen." |
| **Regie** ★ neu | seedance-2.0 **reference-to-video** (Fast- oder Normal-Tier → T2) | 4 | 5–15 s | „Mit den echten Gesichtern und Orten aus deinem Traum — und mit Ton." |
| **Kino** | seedance-2.5 (heute „premium") | 6 | 5–30 s | „Die lange Einstellung: bis zu 30 Sekunden in einem Zug." |

- **Regie ist das eigentlich Neue** — der erste Modus, in dem die Menschen
  aus der Besetzung *im Film* sie selbst sind, nicht nur im Keyframe.
  Und er füttert genau das, was die App schon sammelt: Referenzfotos,
  Charakterbögen, Orte.
- Beispielrechnung fürs Gefühl: 10 s Lebendig = 10 Cr + 1 Keyframe · 10 s
  Regie = 40 Cr · 30 s Kino = 180 Cr + 1 Keyframe. Das Monatsabo (45 Cr)
  reicht für Lebendig-Filme und einen Regie-Kurzfilm; Kino 30 s ist
  Paket-L-Territorium. Das ist gewollt — Anton: teurere Modelle kosten
  spürbar mehr.
- `dreamsFor()` (Paywall) rechnet weiter mit dem Standard-Preis — dort geht
  es um „was ist drin", nicht um die teuerste Option.

## 4 · Der Regisseur im Server (CINEDANCE, destilliert)

Der Seedance-Skill ist ein Regie-Regelwerk: aktueller Shot only, jede aktive
Referenz als @Tag, erste sichtbare Frame-Belegung, messbares Blocking
(„within 1 meter", nicht „nearby"), Blick- und Körperrichtung getrennt,
Optik als Bildwinkel in Grad statt Millimeter, Physik mit Ursache und
Wirkung, Licht als Vorrang-Regel, Zeitblöcke (0:00–0:03 …), Englisch,
keine Negativ-Listen als Ersatz für positive Anweisungen.

**Das wird NICHT als 600-Zeilen-Systemprompt verschifft.** Es wird zu einem
`DIRECTOR`-Block in `server.js` destilliert (Vorbild: der `PERSONA`-Block),
~40 Zeilen mit den tragenden Regeln. Zwei Lehren aus der Persona-Arbeit
gelten wörtlich weiter: *keine Beispielsätze in den Prompt* (sie verbiegen
die Sprache) und *Verbote allein erzeugen Neutralität*.

**Neue Serverfunktion `directFilm()`** — DeepSeek Flash
(`deepseek-v4-flash`, $0,00026 je Aufruf, also gratis im Sinne von
`PRICES.improve`):

```
Eingabe   traumtext (Originalsprache) · beats aus der Analyse (falls da)
          · nummerierte Referenzliste [{n, tag, kind, desc}] · sekunden
          · modellfähigkeiten (maxRefs, kannTon, kannMultiShot) · stil-anker
Ausgabe   EIN englischer Videoprompt nach CINEDANCE-Bauplan:
          SCENE CONTEXT → ACTIVE REFERENCES (@ImageN, exakt unsere Reihenfolge)
          → FIRST FRAME & BLOCKING → OPTICS (Grad) → CAMERA →
          ACTION TIMING (Zeitblöcke über die GANZE Dauer) → PHYSICS →
          LIGHTING → AUDIO
```

**Die harte Regel, und warum sie nicht verhandelbar ist:** Der Prompt darf
`@ImageN` nur für existierende Indizes benutzen, in exakt der Reihenfolge
des `image_urls`-Arrays. Das ist dieselbe Invariante, die `promptBuilder.js`
im Kopfkommentar als „riskiest code in the app" führt — *get this wrong and
people get each other's faces*. Deshalb prüft der Server die Antwort
mechanisch nach (Regex über `@Image\d+`, jeder Index ≤ Anzahl Referenzen;
Verstoß → Rückfall), zusätzlich läuft sie durch `sanitizePromptText` wie
jeder andere Text, der eine bezahlte API erreicht.

**Rückfallkette, weil der Regisseur nie einen Render blockieren darf:**
DeepSeek fehlt oder scheitert → der heutige Zustand (`prompt || dream`).
Schlechter Film schlägt keinen Film.

**Je Modell ein anderes Drehbuch:**
- *Lebendig* (1 Bild): reiner Bewegungs-Prompt — Kamera, Physik, Timing.
  Keine @Tags (es gibt nur das Startbild), kein Blocking neuer Figuren.
- *Regie* (bis 9 Referenzen): das volle Programm inkl. Multi-Shot, wenn die
  Beats es hergeben — CINEDANCE erlaubt kontrollierte Schnitte MIT
  definierter Kontinuität je Schnitt.
- *Kino* (1 Startbild, 30 s): Single continuous take als Vorgabe (Stärke
  des Modells), Zeitblöcke über 30 s, optional Endbild (`end_image_url`)
  → könnte später das Poster als Schlussbild nehmen; nicht in v1.

## 5 · Referenzen → `image_urls`: die Verdrahtung

Reihenfolge und Deckelung sind Produktentscheidungen, keine Zufälle:

1. **Index 1 ist immer der Keyframe** (das gewählte eigene Traumbild) — er
   trägt Look und Farbwelt, der Prompt nennt ihn als Stil- und Szenenanker.
2. Danach die Besetzung in `buildReferences`-Reihenfolge: **Personen, dann
   Tiere, dann Orte** — bei mehr als 8 fliegen Orte zuerst, dann Tiere.
   Gesichter sind das, was Identität ausmacht; ein Ort ist im Keyframe
   ohnehin schon zu sehen.
3. Der Client schickt weiter `cast` wie heute (die Leitung existiert schon —
   `startVideo` bekommt `namedRefs` bereits); neu ist nur, dass sie bis ins
   Modell durchgereicht wird statt am Keyframe zu enden.
4. **Übertragungsform ist ein Testpunkt:** minimax akzeptiert data-URIs
   (gemessen 09.08.). Ob Seedance-R2V das auch tut → T1. Falls nein: fal
   bietet einen Upload-Speicher; das wäre ein kleiner Zusatzschritt im
   Server, kein Umbau.

## 6 · Was der Server ändern muss

1. **`body.model` gegen Allowlist** (`standard` | `director` | `premium`),
   serverseitige Slug-Tabelle. Der Client schickt IDs, nie Slugs — dieselbe
   Regel wie bei `voice`, `lang`, `aspectRatio`.
2. **Dauer je Modell klemmen** — die heutige harte 5–15 in `falSubmitVideo`
   ist minimax-Wissen am falschen Ort; sie wandert in die Modelltabelle
   (Spiegel von `clampSeconds`, serverseitig, weil der Client lügen kann).
3. **Ein Submit je Modellfamilie:** minimax `{image_url, prompt, duration,
   resolution:"768P"}` · R2V `{image_urls[], prompt, duration,
   resolution:"720p", aspect_ratio, generate_audio:true}` · 2.5
   `{image_url, prompt, duration, resolution:"720p", generate_audio}`.
4. **`status_url`/`response_url` wörtlich speichern** — gilt unverändert
   und wird mit Seedance wichtiger: neue Familie, neues Routing; die
   Verbatim-Regel von 09.08. deckt das ab.
5. `directFilm()` vor dem Submit (Abschnitt 4).
6. **Gatekeeper: nichts zu tun** — alles läuft über `/api/generate`
   (Klasse `generate`), und selbst ein späterer eigener Endpunkt wäre durch
   die strenge Voreinstellung automatisch begrenzt.
7. Client: `videoModel` mitschicken (Befund 2), Step 5 bekommt den dritten
   Eintrag + ehrliche Beschriftungen in allen sieben Sprachen
   (`filmModels`-Struktur existiert, Arität beachten).

## 7 · Testplan — der bezahlte Teil

**Antons Vorgabe (17.08., nach dem ersten Entwurf): alle Tests auf
Minimaldauer.** Seedance erlaubt 4 Sekunden, minimax 5 — die 5 aus seiner
Ansage wird bei Seedance also sogar zur 4. Länge beweist hier nichts:
@Tag-Zuordnung, data-URIs, Tonspur und Qualitätsabstand sind in 4 Sekunden
genauso sichtbar wie in 15. Nur T4 (das Produkterlebnis) bekommt 5 Sekunden,
damit die Zeitblöcke des Regisseurs überhaupt zu sehen sind.

Reihenfolge nach Erkenntnis je Dollar. Gesamtbudget T0–T4: **unter $4.**

| # | Was | Kostet | Beweist |
|---|---|---|---|
| T0 | ✅ 17.08. — Regie-Prompts halten Bauplan + @Tag-Disziplin; drei Abdriften gefunden und als Regeln eingebaut | $0,004 | erledigt |
| T1 | ✅ 17.08. — data-URIs werden angenommen, @Image-Zuordnung stimmt, AAC-Ton kommt an | $0,17 | erledigt |
| T2 | ✅ 18.08. — Fast und Normal je 4 s, 720p: beide halten das Drehbuch, 720p klar über Mini, kein entscheidender Abstand → **Regie bleibt Fast** (gleiche Credits, bessere Marge) | $2,18 | erledigt |
| T3 | Outro-Anhang an einen Seedance-Film | 0 (ffmpeg lokal) | Tonspur übersteht das Zusammenfügen (AAC vorhanden?) |
| T4 | ✅ 17.08. — ganze Kette (Bogen → Regisseur → Mini 15 s): Identität hält über zwei Ortswechsel | $0,73 | erledigt |
| T5 | *(optional, später)* 2× R2V verkettet über Video-Eingabe, minimal | ~$1,60 | ob „30 s MIT Referenzen" als Kette geht |
| T6 | *(optional)* hailuo-02 statt h3 für „Lebendig", **5 s** | ~$0,23 | ob der Standard-Preis halbierbar ist |
| — | Kino 30 s voll | ~$14 | **bewusst NICHT im ersten Testlauf** — teuerster Einzeltest, erst wenn Regie sitzt |

## 8 · Offene Fragen an Anton

1. **Regie-Tier:** Fast und Normal kosten nach Aufrundung dieselben
   4 Credits/s — die Wahl ist reine Qualitätsfrage und fällt in T2.
   Einverstanden, dass der Test entscheidet?
2. **30 Sekunden:** Kino (ein Startbild, keine Besetzung im Film) ist das
   ehrliche 30-s-Angebot von heute. „30 s mit echten Gesichtern" gibt es
   erst, wenn T5 die Verkettung beweist. Okay, das so getrennt zu verkaufen?
3. **Ton:** Seedance liefert nativen Ton (Musik/Atmo). Vorschlag: an, und
   der Abspann (film-outro) bleibt stumm wie bisher. 
4. **Namen der drei Stufen:** „Lebendig / Regie / Kino" ist Vorschlag —
   deine Copy-Entscheidung.

## 9 · Reihenfolge der Umsetzung

1. Befund-2-Fix (Modell mitschicken + je Modell klemmen) — **das ist ein
   Bugfix und geht vor allem anderen.**
2. Modelltabelle + Submit je Familie (ohne Regie) → Premium funktioniert
   damit zum ersten Mal wirklich.
3. `DIRECTOR`-Block + `directFilm()` + mechanische @Tag-Prüfung + Rückfall.
4. R2V-Verdrahtung (Referenzen bis ins Modell), UI-Dreier, i18n×7.
5. Testplan T0–T4, dann Preise/Beschriftungen fixieren.

## §10 — Nachtrag 19.08.: Der Stufen-Zuschnitt ist eine Endpoint-Wahl, kein Modelllimit

Antons Einspruch („keine künstliche Verknappung — Modellpreise weitergeben,
wie sie sind") hat sich bei der Recherche voll bestätigt:

- **minimax/h3/reference-to-video** existiert auf fal — bis 9 Bilder plus
  Motion-/Audio-Referenzen, 2K. Laut fal-Learn: $0,05/s @480p, **$0,06/s
  @768p**, erste 5 Referenzbilder gratis, danach $0,08/Bild. Das ist bei
  768p BILLIGER als unser jetziger H3-image-to-video ($0,08/s) — mit
  Referenzen. Die „Lebendig"-Stufe verkauft also heute weniger fürs
  gleiche Geld, als das Modell hergibt.
- **bytedance/seedance-2.5/reference-to-video** existiert auf fal — bis 30
  Bilder (50 Dateien inkl. Video/Audio), @Image1…-Adressierung. „Kino ist
  ehrlich ein Ein-Bild-Angebot" (§ oben) stimmt seit diesem Endpoint nicht
  mehr als Modellaussage. Preis token-basiert, Quellen streuen
  (~$0,22–0,28/s @720p) — messen, nicht glauben.
- **WAN 3.0**: seit 06.08. öffentliche Beta, aber nur Alibaba Cloud Model
  Studio / Qwen Cloud mit Antrag. Auf fal nur Wan 2.x. Beobachten, nicht
  verbauen.

**Messauftrag (nur vom Rechner mit fal-Zugang möglich — die Sandbox ist
für fal.ai gesperrt):** Für `minimax/h3/reference-to-video` und
`bytedance/seedance-2.5/reference-to-video` am Validator bestätigen:
exakte Slugs, Feldnamen (`image_urls`? `resolution`-Werte? `duration`?),
Referenz-Adressierung im Prompt, und die echten Preise je Auflösung —
dieselbe Methode wie am 08.08. (Validation-Responses). Der
nano-banana-Vorfall bleibt die Hausregel: nie auf geratene Feldnamen
bezahlt rendern.

**Danach der Neuzuschnitt (Vorschlag, auf Antons Go):**
- „Lebendig" → H3-R2V @768p: gleicher Verkaufspreis 1 Cr/s, aber mit bis
  zu 5 Referenzfotos inklusive (kosten fal-seitig nichts). Ab dem 6. Foto
  je 1 Credit ($0,08 durchgereicht).
- „Regie" (Seedance 2.0 fast, 4 Cr/s) muss sich dann neu rechtfertigen —
  T2-artiger Qualitätsvergleich H3-R2V vs. Seedance-R2V nötig, sonst ist
  die Stufe nur noch teurer, nicht besser.
- „Kino" → wahlweise 2.5-R2V (Referenzen UND 30 s) statt image-to-video;
  Preis erst nach Messung festlegen.
- Die UI-Infotexte sind seit 19.08. bereits so formuliert, dass sie den
  App-Zustand beschreiben („diese Stufe"), nie das Modell — sie bleiben
  beim Neuzuschnitt wahr.

### §10a — Präzisierung 19.08.: Wie H3-R2V Referenzen adressiert

Offizielle MiniMax-Doku (HuggingFace `MiniMaxAI/MiniMax-H3`,
`VIDEO_PROMPT_WRITING_GUIDE_ref_en.md`): H3-R2V nimmt Charaktere, Orte,
Produkte und Stil als EINZELNE Referenzen wahr — kein Startbild-Zwang.
Der Prompt trägt einen `subject_definitions`-Block, Referenzen heißen
`<Picture N>` / `<Subject N>` / `<Video N>` / `<Audio N>`, nummeriert in
EINGABEREIHENFOLGE (dieselbe Invariante wie bei uns: Reihenfolge =
Nummer), und die Rolle jeder Referenz wird ausdrücklich benannt
(„Picture 1 locks identity, Picture 2 is the environment").

Folge für den Umbau: Der Regisseur braucht JE MODELLFAMILIE das richtige
Adressformat — Seedance sagt `@Image1`, H3 sagt `<Picture 1>` plus
Definitionsblock. Das gehört in die Modelltabelle (z. B. `refStyle:
"seedance" | "h3"`) und in zwei Varianten der DIRECTOR_FULL-Anweisung,
NICHT in eine Weiche im Servercode. checkDirectedPrompt() muss dann beide
Formate mechanisch prüfen können.

Preislogik fal-seitig (Learn-Artikel, am Validator zu bestätigen):
berechnet wird je Sekunde AUSGABE ($0,06/s @768p) PLUS je Referenz-Input —
Bilder 1–5 kostenlos, ab dem 6. je $0,08; Video-Referenzen $0,26/s
Eingabematerial; Audio-Referenzen kostenlos.

### §10b — GEMESSEN 19.08. abends (fal-OpenAPI-Schemata, dieser Rechner)

Der Messauftrag aus §10 ist erledigt — nicht am Validator, sondern eine
Stufe verlässlicher: fal veröffentlicht je Endpoint ein OpenAPI-Schema
(`fal.ai/api/openapi/queue/openapi.json?endpoint_id=…`). Das sind die
Feldnamen, gegen die der Validator selbst prüft.

**`minimax/h3/reference-to-video` (Schema gelesen):**
- `reference_image_urls` — **nicht** `image_urls`! — max **9**; dazu
  `reference_video_urls` (max 3) und `reference_audio_urls` (max 3),
  zusammen höchstens 12 Dateien.
- `duration` 5–15 (Ganzzahl, Vorgabe 5) · `resolution` `"480P" | "768P" |
  "2K" | "4K"` — **Vorgabe ist „2K"**, wir müssen 768P ausdrücklich
  setzen, sonst zahlen wir $0,13/s statt $0,06/s.
- `aspect_ratio` `"adaptive"` (Vorgabe) … `"9:16"` ✓.
- ⚠ `enable_prompt_expansion` steht **standardmäßig AN** — fremde
  Umformulierung unserer Regie-Prompts. Beim Umbau ausdrücklich `false`.
- **Adressierung: schlicht „Image 1", „Image 2"** — §10a lag falsch:
  kein `<Picture N>`, kein `subject_definitions`-Block auf fal. (Die
  HuggingFace-Doku beschreibt die MiniMax-eigene API, nicht fals Fassung.)

**`bytedance/seedance-2.5/reference-to-video` (Modellseite + Schema):**
- Existiert: `image_urls`, **4–30 s**, bis 50 Referenz-Dateien,
  `generate_audio` (Vorgabe true), 9:16 ✓.
- Preis: **$0,473/s @720p — identisch zum Ein-Bild-2.5.** Referenzen
  kosten dort nichts extra. ceil → dieselben 6 Credits/s.
- Adressierung laut Schema: **`[Image1]` in eckigen Klammern.**
- **Folge: T5 (Verkettung) ist tot.** „30 s MIT echten Gesichtern" ist
  ein Endpoint, kein Experiment.

**Drei Syntaxfamilien, endgültig:** Seedance 2.0 `@Image1` · Seedance 2.5
`[Image1]` · H3 „Image 1". Der `refStyle` aus §10a bleibt richtig, nur
mit diesen drei Werten; checkDirectedPrompt() muss alle drei lesen.

**Was WEITER ungemessen ist (kostet Geld, auf Antons Go):**
- Qualität H3-R2V @768P gegen Seedance-2.0-Fast — ohne den Vergleich ist
  „Regie" nur teurer, nicht sicher besser. (~$0,30 + $0,97 für je 5 s.)
- Ob 2.5-R2V die `[Image1]`-Zuordnung so sauber hält wie 2.0 das
  `@Image1` (T1-artiger 4-s-Test @480p, ~$0,88).

### §10c — Die bezahlten Tests vom 19.08. abends ($1,31, Antons Go „step by step")

Alle drei bestanden, Artefakte in `media/tests/` (t-h3r2v-5s.mp4,
t-25r2v-4s.mp4):

- **H3-R2V** (5 s, 768P, $0,30): der wörtliche T1-Auftrag in
  „Image 1"-Syntax. Zuordnung stimmt, beide Zeitblöcke getroffen,
  AAC-Ton, 768×1344. `enable_prompt_expansion: false` gesetzt.
  **Renderzeit 2:14 — ein Drittel von Seedance.** Qualität auf Augenhöhe
  mit Seedance-2.0-Fast (t2-fast-4s.mp4 als Vergleich, gleicher Auftrag).
- **Seedance-2.5-R2V** (4 s, 480p, $0,88): `[Image1]`-Klammern tragen,
  Aktion und Ton da. Der 30-s-Volltest bleibt bewusst offen (Antons
  Sparregel) — aber Syntax, Felder und Zuordnung sind bewiesen.
- **data-URIs** funktionieren in BEIDEN neuen Endpoints.

**Damit ist der Neuzuschnitt aus §10 vollständig entriegelt:** Lebendig →
H3-R2V (1 Cr/s, bis 5 Referenzen inklusive, 25 % bessere Marge) · Regie →
muss sich neu rechtfertigen oder wird zur Seedance-Qualitätsstufe ·
Kino → 2.5-R2V (6 Cr/s, 30 s MIT Referenzen). Nur noch Antons Produkt-Go
fehlt.

### §10d — Antons Produkt-Go, 20.08.

**Regie bleibt.** Antons Bedingung dazu: JEDE Stufe ist ein EIGENES
Modell — keine zwei Stufen auf demselben Endpoint. Der Zuschnitt erfüllt
das: Lebendig = MiniMax H3-R2V · Regie = Seedance-2.0-Fast-R2V · Kino =
Seedance-2.5-R2V. Drei Modelle, drei Looks, drei Preise; „Regie" muss
sich nicht mehr gegen Lebendig rechtfertigen, sondern IST die
Seedance-Qualitätsstufe mit Director-Brief.

Die Lite-Entscheidung hat Anton an die Charakterbogen-Verrechnung
geknüpft — Prüfstein und Rechnung stehen in
2026-08-20-charakterbogen-pflicht.md §7/§8.
