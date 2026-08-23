# Günstiger anbieten — wo überall Geld liegt

**Stand:** 2026-08-23 · Recherche und Rechnung, **nichts umgesetzt**
**Anlass:** Antons Auftrag: *„Wie wir halt noch mehr Geld sparen können
überall, wo es nur geht, um ein günstigeres Produkt anzubieten"* — plus
seine Frage, ob der Monatsrabatt im Verhältnis zum Jahresrabatt zu groß
ist, und die stehende Frage nach WAN.

Ergänzt `2026-08-22-preislinie-durchreichen.md`; die Rechnung dort ist auf
Seedream nachgezogen (`scripts/preis-durchreichen.mjs`).

⚠ **Alle Fremdpreise unten stammen aus Anbieterseiten und Vergleichs-
blogs, nicht aus eigenen Messungen.** Die Hausregel gilt unverändert: nie
auf geratene Zahlen bezahlt rendern. Abschnitt 6 sagt, was zu messen ist.

---

## 1. Was sich seit gestern geändert hat

Der Wechsel auf **Seedream 5 Lite** ($0,035 statt $0,042) hat die
Preisrechnung von gestern überholt — und den Befund **verschärft**:

| Produkt | Einkauf/Credit | ggü. Bild |
|---|---|---|
| Bild (Seedream 5 Lite) | $0,0350 | — |
| Lebendig (H3) | $0,0600 | +71 % |
| Regie (Seedance 2.0 fast) | $0,0605 | +73 % |
| Kino (Seedance 2.5) | $0,0788 | **+125 %** |

Ein Kino-Credit kostet uns jetzt **mehr als das Doppelte** eines
Bild-Credits (gestern: +88 %). Bei einheitlichem Aufschlag würde das Bild
**−51 %** billiger, Kino **+10 %** teurer.

⚠ Und eine Lehre, die im Skript jetzt festgenagelt ist: Der Bildpreis
stand dort als Konstante und war **nach einem Tag falsch**. Genau davor
warnte der Dateikopf. Jetzt wird er aus `imageModel.js` importiert — er
kann nicht mehr driften.

## 2. Antons Rabattfrage: ja, er hat recht

Gemessen am Preis je Credit über die volle Laufzeit:

| Plan | $/Credit | ggü. Woche | Schritt zur Stufe davor |
|---|---|---|---|
| Woche $4,99 / 12 | $0,4158 | — | — |
| Monat $9,99 / 45 | $0,2220 | 47 % | **47 %** |
| Jahr $79,99 / 45 p.M. | $0,1481 | 64 % | 33 % |

**Vom gesamten Rabatt liegen 72 % schon im Monat.** Das Jahr verlangt
zwölf Monate Bindung und Vorkasse — und bietet dafür nur den Rest. Wer
rechnen kann, bleibt beim Monat. Der Verdacht stimmt also.

**Aber die naheliegende Reparatur ist die falsche.** Den Monat zu
verteuern (auf $11,11 für einen 40-%-Schritt, oder 45 → 40 Credits) macht
das Produkt teurer — das Gegenteil deines Auftrags. Die andere Richtung
kostet niemanden etwas: **das Jahr großzügiger machen.**

| Cr/Monat im Jahr | $/Credit | Schritt Monat→Jahr | ggü. Woche | Einkauf/Monat* |
|---|---|---|---|---|
| 45 (heute) | $0,1481 | 33 % | 64 % | $3,55 |
| 50 | $0,1333 | 40 % | 68 % | $3,94 |
| **55** | $0,1212 | **45 %** | 71 % | $4,34 |
| 60 | $0,1111 | 50 % | 73 % | $4,73 |

\* schlimmster Fall: jeder Credit geht in Kino-Sekunden.

**Die Decke:** Netto bleiben je Monat $4,76 (15 % Store) bzw. **$3,92
(30 %)**. Bei 30 % ist damit schon **50 Credits die Grenze** — 55 wäre im
schlimmsten Fall ein Minusgeschäft. Nicht der Kunde kostet den Spielraum,
sondern der Erfolg: Wer über 1 Mio. $ kommt, verliert das Small Business
Program.

**Empfehlung:** 50 Credits im Jahresplan (40-%-Schritt, trägt in beiden
Welten). 55 erst, wenn Abschnitt 3 den Einkauf tatsächlich gesenkt hat —
dann trägt es auch bei 30 %.

## 3. Die Sparhebel, nach Größe sortiert

Alles je EINEM Film bzw. je Traum, Einkaufsseite:

| Hebel | heute | möglich | Ersparnis |
|---|---|---|---|
| **Kino woanders einkaufen** (Seedance 2.5, 15 s) | $7,10 | $2,01 | **−$5,09 (72 %)** |
| **Regie auf Wan 2.7 R2V** (10 s) | $2,42 | $1,00 | **−$1,42 (59 %)** |
| **Bilder als Raster** (5 Szenen) | $0,175 | ~$0,07 | −$0,105 (60 %) |
| Mengenrabatt bei fal aushandeln | — | 15–30 % auf alles | je nach Volumen |
| Lebendig (H3, 6 s) | $0,36 | — | H3 ist hier schon der billigste |

### 3.1 Der größte Brocken: Kino kostet bei fal ein Vielfaches

`bytedance/seedance-2.5` kostet bei fal **$0,473/s**. Dieselbe Familie
wird anderswo deutlich billiger gelistet — Atlas Cloud nennt **$0,134/s
pauschal** für alle drei Varianten (Text·Bild·Referenz), ohne Mindest-
umsatz und ohne Vertrag, mit Ton und bis 1080p. Wäre das belastbar, kostet
ein 15-Sekünder statt $7,10 nur noch **$2,01**.

Das ist der Unterschied zwischen „Kino ist unser Verlustbringer" und
„Kino trägt sich". Es macht auch den 30-%-Fall aus Abschnitt 2 entspannt.

⚠ Diese Zahl stammt von der Verkaufsseite des Anbieters. Sie kann eine
andere Auflösung, ein anderes Referenzbudget oder eine Einführungsaktion
meinen. **Sie ist ein Messauftrag, keine Entscheidung.**

### 3.2 Wan 2.7 macht die Regie-Stufe halb so teuer

Siehe Abschnitt 4.

### 3.3 Das Raster ist zurück — und diesmal ohne Haken

Am 19.08. wurde die Sparlogik „ein großes Bild, in Panels geschnitten"
verworfen: Bei Nano Banana kostete mehr Auflösung mehr Geld, und aus 1K
wurden 448×768-Panels — sichtbar weich.

**Seedream rechnet anders: $0,035 je BILD, unabhängig von der Auflösung
bis 3K.** Aspect Ratio, Größe, Prompt-Optimierung ändern den Preis nicht.
Damit dreht sich die Rechnung um: Ein Raster in voller Auflösung kostet
genau so viel wie ein einzelnes Bild — vier Szenen für den Preis von
einer, **$0,00875 statt $0,035 je Szene**, und jede Kachel hätte immer
noch mehr Pixel als das, was wir vor drei Tagen ausgeliefert haben.

⚠ Zwei Vorbehalte, die das Raster kosten könnte:
- **Aufmerksamkeit.** Vier Szenen in einer Generierung teilen sich das
  Modell. Ob eine Kachel so gut wird wie ein Einzelbild, ist eine
  Bildfrage, keine Preisfrage — und nur am echten Bild zu beantworten.
- **Die Bildkette.** `imageChain.js` ankert jede Szene am vorigen Bild.
  Ein Raster erzeugt alle auf einmal: Die Welt ist dann automatisch
  einheitlich (ein Vorteil), aber die schrittweise Kontrolle ist weg
  (ein Nachteil). Beides gleichzeitig geht nicht.

Der ehrliche Zuschnitt wäre deshalb: **Raster für die Vorschau, Kette für
das Endergebnis** — die Vorschau ist genau der Ort, an dem vier Bilder auf
einmal richtig sind.

### 3.4 Mengenrabatt: fragen kostet nichts

fal verhandelt. Übliche Größenordnung bei Zusagen über Volumen: **15–30 %
auf die Listenpreise**. Sinnvoll erst mit zwölf Monaten Nutzungsdaten im
Rücken — also nach dem Launch, aber es gehört auf die Liste, weil es der
einzige Hebel ist, der ALLE Modelle gleichzeitig billiger macht.

## 4. WAN: die Antwort auf die stehende Frage

**Wan 3.0 ist angekündigt, aber noch ohne Preis.** fal führt eine
Ankündigungsseite (bis 30 s am Stück, 1080p, nativer Ton, alle
Seitenverhältnisse, Referenz-Konditionierung) — buchbar ist es dort noch
nicht, ein Preis steht nirgends.

**Was es JETZT schon gibt, ist interessanter: Wan 2.7 Reference-to-Video.**

| | Wan 2.7 R2V | unsere Regie (Seedance 2.0 fast) |
|---|---|---|
| Preis | **$0,10/s** (720p) · $0,15/s (1080p) | $0,2419/s |
| Länge | 2–15 s | 5–15 s |
| Referenzen | bis 5 (Bild, Ton, Video) | bis 9 |
| Ton | nativ | ja |

Für die Regie-Stufe ist das **59 % billiger bei gleicher Länge und
gleicher Aufgabe**. Der Preis dafür sind vier Referenzplätze weniger — bei
neun Plätzen heute (Keyframe + acht) ist das eine echte Einschränkung für
Träume mit großer Besetzung, aber nicht für den Normalfall.

Für **Lebendig** lohnt Wan nicht: H3 kostet $0,06/s, Wan wäre teurer.

**Vorschlag:** Wan 2.7 R2V als vierte Zeile in `video.js` aufnehmen und im
A/B gegen Seedance 2.0 fast antreten lassen — dieselbe Methode, mit der
Seedream gewonnen hat. Wenn es hält, wird es die Regie-Stufe; wenn nicht,
kostet die Messung ein paar Dollar.

## 5. Was NICHT lohnt (damit niemand es noch einmal prüft)

- **DeepSeek-Nebenzeitrabatt.** Es gibt ihn (deutlich günstigere Tarife
  in bestimmten UTC-Fenstern), aber unsere Textkosten liegen bei ~$0,0003
  je Analyse. Selbst 75 % davon sind nichts. Der Aufwand, Aufträge in ein
  Zeitfenster zu schieben, wäre ein Vielfaches der Ersparnis.
- **Auflösung senken.** Seedream liegt bereits auf seiner Untergrenze
  (1440×2560), und billiger wird es dadurch ohnehin nicht — der Preis ist
  flach.
- **H3-Referenzen sparen.** Die ersten fünf sind gratis, `maxRefs: 5`
  deckelt genau dort. Nichts zu holen.
- **Nano Banana zurück.** Wäre teurer UND schlechter. Erledigt.

## 6. Messaufträge — nur von Antons Rechner (die Cloud erreicht fal nicht)

In dieser Reihenfolge, weil so der größte Betrag zuerst geklärt ist:

1. **Atlas Cloud, Seedance 2.5** ($0,134/s?): Konto anlegen, EINEN
   5-Sekünder mit zwei Referenzbildern rendern (~$0,67). Prüfen: echter
   Endpreis auf der Abrechnung, Auflösung, Referenzverhalten, Ton,
   Wartezeit. **Wenn das hält, ist es die größte Einzelersparnis im
   ganzen Projekt.**
2. **Wan 2.7 R2V gegen Seedance 2.0 fast**, gleicher Traum, gleiche
   Referenzen, 10 s (~$1,00 + $2,42). Prüfen: Identität über den
   Ortswechsel, Ton, wie Referenzen adressiert werden (`@Image1`,
   `[Image1]` oder „Image 1" — das entscheidet über den Regisseur-Brief).
3. **Raster gegen Kette**, vier Szenen (~$0,035 + $0,14). Nur die
   Bildfrage: Hält eine Kachel gegen ein Einzelbild?

Zusammen unter $5. ⚠ `scripts/modell-ab.mjs` rendert echt und nimmt den
Modellnamen als drittes Argument.

## 7. Was danach zu entscheiden ist

Erst nach den Messungen, nicht vorher:

1. Kino-Anbieter wechseln — ja/nein.
2. Regie-Modell wechseln — ja/nein.
3. Jahresplan auf 50 Credits (trägt heute) oder 55 (trägt erst mit
   gesenktem Einkauf).
4. Die offene Grundsatzentscheidung aus dem Vorgängerplan (A/B/C) —
   sie wird leichter, wenn der Einkauf um 60 % gefallen ist.
