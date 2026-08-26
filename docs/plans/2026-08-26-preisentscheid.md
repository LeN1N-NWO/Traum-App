# Preisentscheid — die Vorlage zur Entscheidung

**Stand:** 2026-08-26 · Anlass: Antons „Preisentscheid machen" plus seine
Frage zum Verfall („Ich bin eher ein Fan, wenn man sagt: die Credits
werden weitergetragen, die verfallen nicht — wieso sollten die
verfallen?").
**Status: ENTSCHEIDUNGSVORLAGE. Nichts umgesetzt.**
Grundlage: `bun scripts/preis-durchreichen.mjs`, Stand 26.08.

## 1. Was NICHT geändert werden muss — und warum das ein Ergebnis ist

Die Preisleiter ist gesund. Nachgerechnet, nicht gefühlt:

| Plan | Preis | Credits | $/Credit | Schritt |
|---|---|---|---|---|
| Woche | $4,99 | 25 | 0,1996 | — |
| Monat | $9,99 | 100 | 0,0999 | −50 % |
| Jahr | $79,99 | 100 p. M. | 0,0667 | −33 % |

−50 % und −33 % sind marktübliche Stufen. Und die Marge trägt in JEDER
Kombination, auch im ungünstigsten Fall (Jahresabo, Kino-Film, 30 %
Store-Anteil): **1,4×**. Kein Feld der Tabelle steht unter 1.

**Entscheidung: Preise und Credit-Zahlen bleiben, wie sie sind.**
Der Blocker war nie eine falsche Zahl — er war eine offene Frage.

## 2. Die einzige echte Lücke: Ein Kino-Film ist nicht kaufbar

| Stufe | längster Film | Credits | größter Einzelkauf |
|---|---|---|---|
| standard | 15 s | 46 | 100 ✓ |
| director | 15 s | 136 | 100 ⚠ |
| premium | 30 s | 511 | 100 ⚠ |

Wer einen Kino-Film will, kann ihn in EINEM Kauf nicht bezahlen — egal
wie er stückelt. Ein Monatsabonnent bräuchte 1,4 Monate Ansparen für
einen 15-Sekunden-Director-Film. **Das ist die Lücke, die den Entscheid
wirklich blockiert hat, nicht die Leiter.**

⚠ Umstückeln hilft nicht: Es verschiebt die Zahl auf dem Knopf, nicht den
Einkauf dahinter. Ein premium-15-s-Film KOSTET uns $7,12; um ihn mit
unserem Aufschlag einzeln zu verkaufen, müsste er $26–32 kosten. Über
jedem Paketpreis, den irgendwer spontan drückt.

## 3. Der Verfall — Antons Frage, durchgerechnet

Heute: `allowance` (Abo) verfällt zum Periodenende, `credits` (Pakete,
Willkommensgeschenk) bleiben. Zwei Töpfe, `credits.js`.

**Antons Instinkt ist rechnerisch richtig, und zwar deutlicher als
gedacht.** Verfall bringt uns fast nichts:

- **Die Marge hängt nicht am Zeitpunkt.** Jeder Credit trägt seinen
  Aufschlag in sich. Ob jemand ihn heute oder in acht Monaten einlöst,
  ändert daran nichts — nur, wann wir den Einkauf zahlen.
- **Der Extremfall trägt trotzdem.** Zwölf Monate Abo, nichts ausgegeben,
  dann alle 1200 Credits auf einmal in Kino-Film: Einkauf ~$33 gegen
  ~$70 netto Erlös. Immer noch **2,1×**.
- **Ein Monat kaufen, kündigen, langsam verbrauchen:** 100 Credits kosten
  uns höchstens $2,78, wir haben ~$5,90 netto. **2,1×.**
- **Rechtlich ist Nicht-Verfallen die sicherere Seite.** Verfallende
  Prepaid-Guthaben sind in der EU an Gutschein-Regeln angelehnt und
  angreifbar. Kein Verfall = eine Angriffsfläche weniger, ohne Gegenwert.

⚠ **Der EINE Haken, und er ist strukturell:** Heute rechtfertigt sich das
Paket über „verfallen nie — dafür teurer". Verfällt nichts mehr, ist
diese Begründung weg, und das Paket wäre strikt schlechter als das Abo.

Das ist lösbar, weil es eine ehrlichere Begründung gibt: **„ohne Abo".**
Einmal zahlen, nichts läuft weiter, nichts kündigt sich. Dafür zahlen
viele Menschen freiwillig einen Aufschlag — das ist kein Trostpflaster,
sondern der eigentliche Grund, warum Pakete existieren.

**Und der Verfall ist genau das, was Kino-Filme unverkäuflich macht.**
Ansparen ist der einzige Weg zu 136 oder 256 Credits. Wer jeden Monat
zurücksetzt, macht Ansparen unmöglich — und damit die teuerste Ware der
App unerreichbar für alle außer Jahresabonnenten. **Punkt 2 und Punkt 3
sind dieselbe Frage.**

## 4. Empfehlung

1. **Preise und Credit-Zahlen unverändert.** (§1)
2. **Credits verfallen nicht mehr.** `refillAllowance` addiert, statt zu
   setzen — eine Zeile in `credits.js`. Die Zwei-Topf-Buchhaltung bleibt,
   damit die Entscheidung umkehrbar ist.
3. **Das Paket heißt künftig „ohne Abo", nicht „verfällt nie".** (`packNote`
   in `de.js`/`en.js`; dazu die Zeile in den Rechtstexten, `en.js:811`.)
4. **Ein viertes Paket, $29,99 / 150 Credits.** Damit ist ein
   Director-Film in 15 Sekunden in EINEM Kauf erreichbar (136 Cr).
   Premium bleibt bewusst ein Ansparprodukt — ein Paket, das 256 Credits
   trägt, müsste über $60 kosten, und das drückt niemand spontan.
5. **Willkommensgeschenk bleibt 4.** Größter Einzelkostenposten der App;
   „dein erster Traum geht auf uns" heißt EIN Traum.

### Was das kostet, wenn es schiefgeht

Nichts, das nicht umkehrbar wäre. Es gibt keinen Zahlungsanbieter und
keine Store-Eintragung — heute ist der billigste Tag, das zu entscheiden.
Der teuerste wäre der Tag nach dem ersten verkauften Abo: Ein einmal
gegebenes „verfällt nicht" nimmt man niemandem mehr weg.

## 5. Was diese Vorlage NICHT entscheidet

- Ob Kino-Film überhaupt ein Einzelkaufprodukt sein soll (§2) — Punkt 4
  ist ein Vorschlag, keine Zwangsläufigkeit.
- Store-Anteil 15 % oder 30 %: Beide sind durchgerechnet, beide tragen.
  Apple Small Business (15 %) gilt bis $1 Mio. Jahresumsatz.
