# Bildmodelle — was ein Bild kostet, und was es kosten müsste

**Stand:** 2026-08-19 · Anlass: Antons Preisfrage in der Session vom 19.08.
**Status: RECHERCHE + RECHNUNG. Nichts umgesetzt — der Wechsel hängt an einer
Messung, die nur vom Rechner aus geht (§4).**

## 1. Die Preisliste, recherchiert 19.08.2026

| Modell | Preis je Bild @1K | Auflösungen | Referenzen |
|---|---|---|---|
| **nano-banana-2** (heute) | **$0,08** | 0,5K/1K/2K/4K | ja, über `.../edit` |
| **nano-banana-2-lite** | **$0,0336** | **nur 1K** | ja lt. Google (bis 10) — **auf fal ungeprüft** |
| nano-banana-pro | $0,15 | bis 4K | ja |

Googles Auflösungsstaffel für nano-banana-2: 0,5K = 0,75×, 1K = 1×,
2K = 1,5×, 4K = 2×. Lite kennt diese Staffel nicht — es gibt nur 1K.

Googles Batch-Tarif halbiert Lite noch einmal auf $0,0168, ist aber
asynchron (bis 24 h). Für uns unbrauchbar: Der Mensch wartet vor dem
Bildschirm. Nur notiert, damit niemand die Zahl aus einem Blogartikel
für die unsere hält.

## 2. Was das für die App bedeutet

**Einkauf einer Bildstrecke:**

| Bilder | heute (NB2) | mit Lite | Ersparnis |
|---|---|---|---|
| 3 | $0,24 | $0,1008 | 58 % |
| 5 | $0,40 | $0,168 | 58 % |
| 10 | $0,80 | $0,336 | 58 % |

**Marge je Credit** (Monatsabo $9,99 / 45 Credits = $0,222 Verkaufspreis):
heute 64 %, mit Lite 85 %. Bei *gleicher* Marge könnte dasselbe Abo statt
45 Credits **107** enthalten.

⚠ **Die Rechenregel „1 Credit = 1 Bild = $0,08" wäre damit gebrochen.**
`video.js` nennt sie „a happy accident worth keeping: the rare pricing
rule a person can hold in their head" — und sie trägt zugleich den
Filmpreis (minimax = exakt 1 Credit/Sekunde). Wer den Bildpreis ändert,
muss entscheiden, ob das Credit neu definiert wird (dann rechnet auch der
Film neu) oder ob nur die MARGE steigt und der Preis für den Kunden
bleibt. Das ist eine Produktentscheidung, keine technische.

## 3. Die Schnellvorschau — der eigentliche Fund

Die Sparlogik (ein 16:9-Bild, clientseitig in drei Panels geschnitten)
kostet 1 Credit statt 3. Was dabei ankommt, hat aber niemand nachgemessen:

| Grid-Auflösung | Einkauf | Panel-Maße | Urteil |
|---|---|---|---|
| 16:9 @1K (heute) | $0,08 | **448×768** | auf dem Display sichtbar weich |
| 16:9 @2K | $0,12 | **896×1536** | praktisch Vollqualität |
| 16:9 @1K mit Lite | $0,0336 | 448×768 | so billig, dass es fast gratis ist |

Zum Vergleich: ein echtes 9:16-Einzelbild @1K misst 768×1344; ein
iPhone-15-Display ist ~1179 px breit.

**Damit ist die Vorschau heute schlechter als nötig UND teurer als nötig
zugleich** — 448 px waren nie eine Entscheidung, sie sind ein Nebenprodukt
davon, dass 1K die Vorgabe ist. Zwei Auswege, die sich nicht ausschließen:
auf 2K gehen (halbe Auflösungsstufe teurer, viermal so viele Pixel je
Panel) oder auf Lite wechseln (gleiche Größe, ein Drittel des Preises).

## 4. Der Vorbehalt, an dem alles hängt

**fal listet Lite als „(Text to Image)".** Google dokumentiert für das
Modell Bild-Eingabe und bis zu 10 Referenzbilder, andere Anbieter führen
einen eigenen `…-lite/edit`-Endpoint — ob **fal** einen hat, ist
unbestätigt. Ohne Referenz-Pfad taugt Lite bei uns nur für Bilder ohne
Besetzung, und das ist der seltenere Fall.

**Messauftrag (nur vom Rechner mit fal-Zugang — die Sandbox blockt fal.ai),
dieselbe Methode wie am 08.08. über Validation-Responses:**
1. Gibt es `google/nano-banana-2-lite/edit` (oder wie heißt der Slug)?
2. Nimmt er `image_urls` wie nano-banana-2/edit, und wie viele?
3. Hält die Identität über eine Zehnerstrecke — oder driftet das Gesicht?
   (Lite ist das kleinere Modell; genau hier wäre der Preis erkauft.)
4. Was kostet 16:9 @2K bei nano-banana-2 wirklich — bestätigt der
   Validator die 1,5×-Staffel?

Erst danach entscheiden. Der nano-banana-Vorfall vom 07.08. (`image_urls`
still ignoriert, tagelang Renders ohne Gesichter bezahlt) bleibt die
Hausregel: **nie auf geratene Feldnamen bezahlt rendern.**

## 5. Vorschlag, falls die Messung Lite bestätigt

- **Einzelbilder und Charakterbögen → Lite.** 58 % billiger, 1K reicht für
  9:16 auf einem Handy vollständig aus.
- **Schnellvorschau → Lite @1K.** Dann kostet sie uns $0,03 statt $0,08,
  und man könnte sie ehrlich verschenken statt sie mit 1 Credit zu
  bepreisen (Aha-Moment vor der ersten Kaufentscheidung).
- **nano-banana-2 bleibt** für alles, wo 2K zählt — Plakat, und jeden Fall,
  in dem die Messung Identitätsdrift bei Lite zeigt.
- **Preisfrage an Anton:** Marge behalten (85 %) oder weitergeben (mehr
  Credits fürs selbe Geld)? Antons Linie aus derselben Session war
  eindeutig — „Modellpreise an den Endkunden weitergeben, wie sie sind" —
  aber die Credit-Definition hängt mit dem Filmpreis zusammen und will
  bewusst entschieden werden, nicht nebenbei.

## 6. GEMESSEN 19.08. abends (fal-OpenAPI, dieser Rechner)

Die vier Fragen aus §4, beantwortet über fals eigene OpenAPI-Schemata
(`…?endpoint_id=google/nano-banana-2-lite/edit`):

1. **`google/nano-banana-2-lite/edit` EXISTIERT** — fals Modellliste
   („Text to Image") war unvollständig, nicht das Angebot.
2. **Er nimmt `image_urls`** (Array), dazu `aspect_ratio` inkl. 9:16 und
   16:9, `num_images` 1–4. Der Referenz-Pfad ist also da — der Vorbehalt
   aus §4 ist vom Tisch.
3. **Identitätsdrift bleibt die offene Frage** — das kann kein Schema
   beantworten. Bezahlter Test: eine Dreierstrecke mit Charakterbogen
   (~$0,17), Gesicht gegen nano-banana-2 halten.
4. **Preis auf fal: ~$0,042/Bild** (1120 Ausgabe-Tokens × $37,50/1M) —
   nicht die $0,0336 aus §1; das war Googles Direktpreis. Immer noch
   **47 % unter** unseren $0,08. Ausgabe fest 1K.
   Und nano-banana-2 bestätigt: 2K = 1,5× ($0,12), 4K = 2× ($0,16),
   0.5K = 0,75× ($0,06) — die Staffel aus §3 stimmt.

**Damit ist §5 nur noch von einem bezahlten Drift-Test (~$0,17) und
Antons Preisentscheidung abhängig.**

## 7. Der Drift-Test vom 19.08. abends ($0,13) — BESTANDEN

Dreierstrecke mit dem Anton-Charakterbogen als `image_urls`-Referenz
(Totale Bahnsteig → Fensterbank → Laternen-Nahaufnahme, `media/tests/
t-lite-1…3.png`): **dasselbe Gesicht in allen dreien**, Mantel und
Statur konsistent, Bildqualität auf 1K tadellos. Der Vorbehalt aus §4
ist damit komplett ausgeräumt — §5 hängt nur noch an Antons
Preisentscheidung (Marge behalten oder weitergeben).
