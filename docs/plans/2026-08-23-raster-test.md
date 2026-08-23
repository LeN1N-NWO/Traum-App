# Raster-Test: fünf Szenen in EINEM Bild — und was Atlas Cloud ist

**Stand:** 2026-08-23 · Rechnung und Prompt fertig, **Messung offen**
**Anlass:** Antons Auftrag: fünf Bilder als 9:16-Kacheln in EIN Bild
generieren und zerschneiden — „dadurch könnten wir mit der Generierung Zeit
sparen und der Look wäre automatisch einheitlich". Dazu die Frage, was
Atlas Cloud eigentlich ist.

**Entschieden nebenbei:** Wan 2.7 wird NICHT angefangen. Wir warten auf
Wan 3.0 über fal oder einen anderen Weg (Antons Wort, 23.08.).

---

## 1. Welches Format fünf 9:16-Kacheln trägt

Die Regel ist eine Zeile Bruchrechnung: Ein Behälter im Verhältnis
**(Spalten × 9) : (Zeilen × 16)** zerfällt in lauter exakte 9:16-Kacheln.

| Raster | Plätze | Behälter | als Zahl |
|---|---|---|---|
| 2×2 | 4 | **9:16** | 0,563 |
| 3×2 | 6 | **27:32** | 0,844 |
| 2×3 | 6 | 3:8 | 0,375 |
| 5 nebeneinander | 5 | 45:16 | 2,813 |

**2×2 ergibt wieder 9:16** — dasselbe Format wie die App. Das ist der
einzige Fall, der ohne Sonderformat auskommt, und deshalb der einzige, den
auch ein Modell ohne freie Pixelmaße rendern kann.

**Für fünf Szenen ist 3×2 die Antwort** (27:32, sechs Plätze, einer frei).
Kein Streifen: Fünf nebeneinander wären 45:16, und weil die lange Seite bei
jedem Modell gedeckelt ist, würde jede Kachel darin schmal.

⚠ **Der freie Platz ist keine Lücke, sondern eine Aufgabe.** Der Prompt
weist ihn ausdrücklich einem ruhigen Establishing Shot zu. Ohne Ansage
füllt das Modell ihn mit Schwarz, einem Muster — oder einer sechsten
erfundenen Szene, die später jemand für einen Beat hält.

## 2. Was es kostet und was es kostet

| Weg | Aufrufe | Kosten | Kachel | ggü. heute |
|---|---|---|---|---|
| **heute:** Lite einzeln, 5× | 5 | $0,175 | 1440×2560 | — |
| Lite, 3×2 (1 Platz frei) | **1** | **$0,035** | 864×1536 | **−80 %** |
| Lite, 2×2 + 1 einzeln | 2 | $0,070 | 864×1536 | −60 % |
| Nano Banana 2, 2×2 + 1 | 2 | $0,160 | 576×1024 | −9 % |

**Der Preis ist sicher, die Bildfrage ist offen.** Und sie ist ein echter
Handel, keine Formsache:

⚠ **Die Kachel ist immer die geteilte Behälterseite.** Um die heutigen
1440×2560 je Szene im Raster zu halten, bräuchte der Behälter 2880×5120 =
14,7 MP — mehr, als eines der Modelle ausgibt. **Das Raster kauft den Preis
mit Auflösung.** 864×1536 ist unter dem, was wir heute liefern, aber über
dem, was wir vor drei Tagen geliefert haben (Nano Banana Lite: 768×1376).
Ein iPhone ist ~1179 px breit.

Das ist genau der Vorbehalt, an dem der Dreier-Streifen am 19.08. hing:
**Gesichter und Hände zerfallen zuerst.** Der Preis beantwortet das nicht.

## 3. Zu den Pro-Modellen — hier muss ich widersprechen

Anton will den Test mit **Seedream 5 Pro** und **Nano Banana Pro in 4K**
fahren. Die Rechnung sagt: Als **Spartest** taugt das nicht.

| | $/Bild | im 2×2 je Szene | Kachel |
|---|---|---|---|
| Seedream 5 Lite | $0,035 | $0,0088 | 864×1536 |
| Seedream 5 Pro | $0,135 | $0,0338 | 768×1365 |
| Nano Banana Pro 2K | $0,15 | $0,0375 | 576×1024 |
| Nano Banana Pro 4K | $0,30 | $0,075 | 1080×1920 |

**Seedream 5 Pro ist im Raster teurer UND kleiner als Lite** — es rechnet
nach FLÄCHE ($0,0675 bis 1536², $0,135 bis 2048²), nicht flach. Die
Flächengrenze deckelt genau das, was das Raster braucht. Für diesen Zweck
ist Pro schlechter als Lite, in beiden Richtungen.

**Nano Banana Pro 4K ist die einzige Ausnahme mit Sinn:** $0,075 je Szene
bei 1080×1920 — halb so teuer wie ein einzelnes Pro-2K-Bild ($0,15) bei
fast gleicher Auflösung. Gegenüber unserem heutigen Lite-Einzelbild ist es
aber **doppelt so teuer bei weniger Pixeln**.

**Der ehrliche Zuschnitt des Tests ist deshalb zweigeteilt:**
- **Spartest:** Lite 3×2 gegen Lite einzeln. Hier geht es um die 80 %.
- **Qualitätstest:** Nano Banana Pro 4K 2×2 gegen Lite einzeln. Hier geht
  es darum, ob das stärkere Modell im Raster besser ist als das schwächere
  einzeln — dann wäre der Aufpreis eine Entscheidung, kein Versehen.

⚠ **Beide Pro-Modelle sind noch NICHT in `imageModel.js`.** Ich habe sie
bewusst nicht eingetragen: Ich habe keine bestätigten fal-Slugs für sie,
und ein geratener Slug ist genau der Fehler vom 07.08. (ein still
ignoriertes Feld, tagelang bezahlte Renders ohne Gesichter). Die Slugs
gehören von der fal-Seite abgeschrieben, dann trage ich sie ein.

## 4. Was gebaut ist

- **`src/lib/gridLayout.js`** (neu): `layoutFor` · `containerRatio` ·
  `containerSize` · `tileSize` · `tileBoxes` · `slotName`. Reine Rechnung,
  kein DOM. 10 Tests, rot-geprüft (Verhältnis vertauscht, Grenzen
  aufaddiert, Streifen statt kompakt — alle drei schlagen an).
- **`buildGridPrompt`** kann jetzt `cols`/`rows`. **Der bewährte
  Dreier-Streifen bleibt wörtlich, wie er war** — er ist an echten Renders
  belegt und `splitIntoPanels()` schneidet genau seine Formulierung. Das
  Raster ist ein eigener Zweig, keine umformulierte Kopie. 6 neue Tests.
- **`scripts/raster-prompt.mjs`**: schreibt den fertigen Prompt, die
  fal-Parameter, die Kosten und die Schnittkoordinaten. Ruft nichts auf.

      node scripts/raster-prompt.mjs 5                  # Seedream, 3×2
      node scripts/raster-prompt.mjs 4 nano-banana-2    # 2×2

⚠ Das Skript verweigert die Ausgabe, wenn das Seitenverhältnis nicht zum
Modell passt. Die erste Fassung warnte und druckte den Auftrag trotzdem
(`aspect_ratio: "27:32"` an Nano Banana) — fal lehnt so etwas nicht ab,
sondern rundet still, und der Schnitt sucht die Kacheln danach an der
falschen Stelle.

**Noch NICHT gebaut:** der zweidimensionale Schnitt in `splitGrid.js`. Das
dortige `splitIntoPanels()` kann nur senkrechte Streifen. Die Rechnung dafür
steht fertig in `tileBoxes()`; verdrahtet wird sie erst, wenn der Test sagt,
dass das Raster taugt. Für den Test selbst genügt Zuschneiden von Hand.

## 5. Atlas Cloud — was das ist und warum es billiger sein kann

Antons Frage: „Ist es ein Reseller oder was? Warum kostet es günstiger?"

**Was sie sind:** Ein GPU-Cloud- und Inferenz-Anbieter aus New York mit
eigener Hardware (bis ~5000 GPUs, Partner Dell/HPE/Supermicro), aufgebaut
auf der offenen SGLang-Engine. Bemerkenswert: **komplett bootstrapped**, kein
Wagniskapital, nach eigenen Angaben $50 Mio. Umsatz in vier Monaten. Sie
werben mit 99,99 % Verfügbarkeit und ohne Mindestabnahme.

**Warum es billiger sein KANN:** Wer eigene GPUs auslastet und die
Inferenz-Engine optimiert, verkauft Rechenzeit näher an den Selbstkosten
als eine Plattform, die Bequemlichkeit mitverkauft. Das ist ein echtes
Geschäftsmodell, kein Trick.

⚠ **Aber genau hier ist der Haken, und er ist wichtig:** Das Argument
„eigene GPUs" trägt nur für **offene Modelle** (DeepSeek, Llama, Wan). **
Seedance ist ein geschlossenes ByteDance-Modell** — das kann niemand auf
eigener Hardware laufen lassen. Wer es anbietet, reicht die BytePlus-API
weiter. Der Preis von $0,134/s ist damit **eine Handelsspanne, keine
Technologie** — und Handelsspannen können Einführungspreise sein, sich
ändern oder an Bedingungen hängen, die auf der Verkaufsseite nicht stehen.

Deshalb bleibt es bei einem Messauftrag, und der prüft nicht nur den Preis:

1. **Was steht auf der Abrechnung?** Nicht auf der Produktseite.
2. **Welche Auflösung und wie viele Referenzbilder** sind im Pauschalpreis?
3. **Ist es dasselbe Modell?** Seedance 2.5 R2V, nicht eine kleinere Variante.
4. **Wie lange gilt der Preis?** Nach Einführungsangebot fragen.
5. **Wo stehen die Rechner?** ⚠ Das ist keine Nebenfrage: Unser
   Einwilligungstor nennt fal.ai, Google und DeepSeek **namentlich**. Ein
   vierter Anbieter bedeutet neuen Text und **`CONSENT_VERSION` +1** — das
   Tor kommt für alle noch einmal. Das gehört zur Rechnung dazu, bevor man
   den Wechsel als reine Ersparnis verbucht.

**Wenn es hält, ist es die größte Einzelersparnis im Projekt** — $5,09 je
15-Sekünder, und Kino würde von einem Verlustbringer zu einer tragenden
Stufe. Genug, um sie an den Kunden weiterzugeben, wie Anton es will.

## 6. Nächste Schritte

Nur von Antons Rechner (die Cloud erreicht fal nicht):

1. **Raster-Spartest:** `node scripts/raster-prompt.mjs 5`, Prompt kopieren,
   EIN Bild rendern ($0,035), von Hand in sechs Kacheln schneiden. Frage:
   Halten Gesichter und Hände bei 864×1536?
2. **Fal-Slugs für Seedream 5 Pro und Nano Banana Pro** abschreiben, dann
   trage ich sie in `imageModel.js` ein — nicht vorher.
3. **Atlas Cloud:** Konto anlegen, EINEN 5-Sekünder rendern (~$0,67), die
   fünf Fragen aus Abschnitt 5 beantworten.
4. **Wan 3.0:** warten. Kein Einstieg bei 2.7.
