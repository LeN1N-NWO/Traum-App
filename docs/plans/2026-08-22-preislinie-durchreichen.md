# Preislinie: Modellpreise durchreichen — was das rechnerisch heißt

**Stand:** 2026-08-22 · offen, wartet auf Antons Entscheidung
**Anlass:** Antons Ansage (21.08.): *„Ich will nie künstlich eine Verknappung
erstellen und künstlich die Produkte einschränken. Es geht mir wirklich
darum, diese Modellpreise an den Endkunden weiterzugeben, wie sie sind."*

Dieser Plan rechnet nach, was „durchreichen" bei den heutigen Zahlen
konkret bedeutet. Alle Zahlen stammen aus `src/lib/video.js` und
`src/lib/plans.js`, Stand `9c9bd5d`. **Nichts davon ist umgesetzt** — das
ist eine Entscheidungsvorlage, kein Umbau.

---

## 1. Der Befund in einem Satz

**Nicht die Filme sind zu teuer, sondern die Bilder.** Wer die
Modellpreise wirklich durchreicht, macht das Bild um 41 % billiger und
den Kino-Film um 9 % teurer. Das ist das Gegenteil dessen, was man
erwartet, und es hat einen einfachen Grund: Der Credit ist auf einen
Bildpreis geeicht, den es nicht mehr gibt — $0,08 war `nano-banana-2` in
voller Auflösung, gerendert wird seit dem 19.08. mit `-lite` zu $0,042.

## 2. Warum der Anker verrutscht ist

`plans.js` definiert: **1 Credit = 1 Bild = $0,08 Einkauf.** Das stimmte,
solange die App `nano-banana-2` in voller Auflösung nutzte. Seit dem
19.08. laufen alle Bildpfade über **`nano-banana-2-lite` zu $0,042** —
die Hälfte. Der Anker wurde nie nachgezogen, und daran hängt die ganze
Preisliste.

Was ein Credit uns tatsächlich kostet, hängt seitdem davon ab, wofür er
ausgegeben wird:

| Produkt | Einkauf | Credits | $/Credit | Anteil am Anker $0,08 |
|---|---|---|---|---|
| Bild (`nano-banana-2-lite`) | $0,042 | 1 | **$0,0420** | 53 % |
| Lebendig (H3 768P) | $0,060/s | 1/s | $0,0600 | 75 % |
| Regie (Seedance 2.0 fast) | $0,2419/s | 4/s | $0,0605 | 76 % |
| Kino (Seedance 2.5) | $0,473/s | 6/s | **$0,0788** | 99 % |

Ein Kino-Credit kostet uns **88 % mehr** als ein Bild-Credit — und beide
verkaufen wir zum selben Preis. Das ist die Quersubvention, die niemand
beschlossen hat: **Die Bildmarge zahlt die Filme.**

## 3. Was hinten übrig bleibt

Deckungsbeitrag je Credit, nach 19 % MwSt. und Store-Anteil. Gelesen als
`Beitrag / Aufschlag`; `plans.js` setzt als Untergrenze **1,5×**.

**Small Business Program (15 %):**

| Plan | netto/Credit | Bild | Lebendig | Regie | Kino |
|---|---|---|---|---|---|
| Woche $4,99 / 12 | $0,297 | +0,255 / 7,1× | +0,237 / 5,0× | +0,237 / 4,9× | +0,218 / 3,8× |
| Monat $9,99 / 45 | $0,159 | +0,117 / 3,8× | +0,099 / 2,6× | +0,098 / 2,6× | +0,080 / 2,0× |
| **Jahr $79,99 / 45 p.M.** | $0,106 | +0,064 / 2,5× | +0,046 / 1,8× | +0,045 / 1,7× | **+0,027 / 1,3×** |
| Paket S $2,99 / 6 | $0,356 | +0,314 / 8,5× | +0,296 / 5,9× | +0,295 / 5,9× | +0,277 / 4,5× |
| Paket M $7,99 / 18 | $0,317 | +0,275 / 7,5× | +0,257 / 5,3× | +0,257 / 5,2× | +0,238 / 4,0× |
| Paket L $14,99 / 32 | $0,335 | +0,293 / 8,0× | +0,275 / 5,6× | +0,274 / 5,5× | +0,256 / 4,2× |

**Ohne Small Business Program (30 %)** kippt eine Zelle ganz:

| Plan | Bild | Lebendig | Regie | Kino |
|---|---|---|---|---|
| Monat | 3,1× | 2,2× | 2,2× | 1,7× |
| **Jahr** | 2,1× | 1,5× | 1,4× | **1,1×** |

⚠ **Jahresabo × Kino ist bei 30 % Store-Anteil praktisch Nullsummenspiel**
(+$0,008 je Credit). Ein Jahresabonnent, der seine 45 Credits monatlich in
Kino-Sekunden steckt, bringt uns nichts ein — er kostet nur keine Zuzahlung.
Das ist keine Randbedingung: Es ist die Kombination aus dem Plan, den wir
als günstigsten bewerben, und der Stufe, die wir als beste bewerben.

## 4. Was „durchreichen" konkret bedeutet

Der Gesamtaufschlag über alle vier Produkte liegt heute bei **2,21×**.
Legt man genau diesen Aufschlag einheitlich auf jedes Produkt — das ist
Durchreichen im Wortsinn: jeder zahlt, was sein Modell kostet, plus
denselben Anteil —, verschieben sich die Preise so:

| Produkt | heute | einheitlich 2,21× | Änderung |
|---|---|---|---|
| 1 Bild | $0,22 | $0,13 | **−41 %** |
| Lebendig 6 s (+Keyframe) | $1,55 | $1,24 | −20 % |
| Regie 10 s (+Keyframe) | $9,10 | $7,62 | −16 % |
| Kino 15 s (+Keyframe) | $20,20 | $22,09 | **+9 %** |

Dieselbe Aussage in Credits, wenn der Credit beim Bild verankert bleibt
und alles andere im echten Kostenverhältnis dazu steht:

| Produkt | heute | ehrlich | |
|---|---|---|---|
| 1 Bild | 1 Cr | 1 Cr | ±0 |
| Lebendig 6 s | 7 Cr | 10 Cr | +37 % |
| Regie 10 s | 41 Cr | 59 Cr | +43 % |
| Kino 15 s | 91 Cr | 170 Cr | +87 % |

Beide Tabellen sagen dasselbe von zwei Seiten. Sie widersprechen sich
nicht: Die erste hält den Umsatz fest und verschiebt die Euro-Preise, die
zweite hält den Credit-Preis fest und verschiebt die Credit-Zahlen. Wer
die zweite Fassung wählt, MUSS den Euro-Preis je Credit senken — sonst ist
es keine Ehrlichkeit, sondern eine Preiserhöhung.

## 5. Drei Wege, und was jeder kostet

**A — So lassen.** Die Bildmarge trägt die Filme. Vorteil: die
teuerste Stufe wirkt günstig, was den Einstieg erleichtert. Nachteil: Es
ist genau die Sorte versteckte Umverteilung, die Anton bei anderen
ablehnt — wer nur Bilder macht, bezahlt die Filme der anderen mit. Und
Jahr × Kino bleibt bei 30 % Store-Anteil ein Nullgeschäft.

**B — Ehrlich rechnen, Euro-Preise anpassen.** Credit auf $0,042 eichen,
Filmpreise ins echte Verhältnis setzen, Credit-Preise entsprechend
senken. Ergebnis: Bilder deutlich billiger, Kino leicht teurer, gleicher
Umsatz. Das ist Antons Ansage, wörtlich genommen. Nachteil: Kino 15 s
kostete dann **170 Credits** — mit keinem Angebot der Preisliste in einem
Kauf erreichbar (Monat 45, Paket L 32). Die Stufe wäre nominell
verfügbar und faktisch unkaufbar. **Das ist der Punkt, an dem B ohne
einen vierten Kaufweg nicht funktioniert.**

**C — Ehrlich rechnen, aber die Marge je Stufe halten.** Credit auf
$0,042 eichen und die Filmstufen so setzen, dass jede denselben Aufschlag
trägt wie heute das Bild. Der Unterschied zu B ist nur, wie viel Marge
insgesamt drin ist — die Schieflage zwischen den Stufen verschwindet in
beiden Fällen.

## 6. Was zuerst entschieden werden muss

1. **Anton:** A, B oder C? Ohne diese Antwort ist jede Zahlenänderung
   Raten. (Meine Einschätzung: **C**, mit einem Großpaket oder einer
   Sekunden-Obergrenze für Kino — B ist die reine Lehre, scheitert aber
   an der Kaufbarkeit.)
2. **Unabhängig davon fällig — aber weniger schlimm als es aussieht:**
   Der Anker `CREDIT_COST_USD = 0.08` (`plans.js:60`) beschreibt seit dem
   19.08. kein Produkt mehr: Ein Bild kostet $0,042.
   ⚠ Nachgeprüft, bevor daraus ein Vorwurf wird: Die Konstante rechnet
   **nirgends an einem Preis mit**. Sie wird ausschließlich in
   `plans.test.js:92` benutzt, als Kostenschranke für die Abo-Margen —
   und dort ist $0,08 fast exakt der **teuerste** Credit, den es gibt
   (Kino: $0,0788). Als Testschranke ist die Zahl damit sogar richtig
   gewählt, nämlich als schlechtester Fall.
   Falsch ist nur der SATZ, den sie im Dateikopf trägt („1 Credit =
   1 Bild = $0,08 Einkauf"). Der gehört korrigiert: Der Einkauf eines
   Bildes ist $0,042; $0,08 ist die Obergrenze über alle Produkte. Zwei
   Zahlen, zwei Namen — heute tragen beide denselben.
3. **Zwei von drei Stufen sind in voller Länge unkaufbar** — und das
   schon heute, ohne jede Umstellung. Bester Einzelkauf: 45 Credits.

   | Stufe | längster Film | Credits | in einem Kauf? |
   |---|---|---|---|
   | Lebendig | 15 s | 16 | ja |
   | Regie | 15 s | **61** | nein |
   | Kino | 30 s | **181** | nein |

   Kino in der Voreinstellung (15 s) kostet 91 Credits — auch das ist mit
   keinem Angebot der Liste in einem Kauf erreichbar. Wer eine Stufe
   bewirbt, muss sie verkaufen können; das ist unabhängig von A/B/C zu
   lösen, entweder über ein Großpaket oder über eine ehrlich benannte
   Längenbegrenzung.

## 7. Nicht Teil dieses Plans

Store-Provision (15 % vs. 30 %), MwSt.-Sätze außerhalb Deutschlands,
Conversion-Rate und Willkommensgeschenk sind im Dateikopf von `plans.js`
bereits durchgerechnet und hier nur als Rechenparameter übernommen. Die
dortige Schlussfolgerung — Small Business Program ist Voraussetzung,
nicht Kür — wird durch diese Rechnung bestätigt und nicht ersetzt.

Nachgerechnet werden kann alles hier mit den Zahlen aus `video.js`
(`creditsPerSecond` plus die Einkaufspreise in den Kommentaren) und
`plans.js` (`SUBSCRIPTIONS`, `PACKS`); die Formel ist
`netto = brutto ÷ 1,19 × (1 − Store-Anteil)`.
