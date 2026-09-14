# Was das Abo außer Credits trägt — und ob das Jahr alles sofort bekommt

Stand 13.09.2026 spät · Antons Fragen: (1) Ein Feature neben den Credits,
damit das Abo mehr Gewicht hat — vielleicht Klarträume als KI-Video-Anleitung?
(2) Soll das Jahresabo alle Credits sofort freischalten? (3) Extras bei
größeren Einmalpaketen.

Das ist eine Empfehlung, keine Entscheidung. Zahlen aus `src/lib/plans.js`.

> **Entschieden 14.09.2026 (Anton), gebaut:** 480 Credits am Kauftag, danach
> **jeden Monat 131** — kein Monat ohne Credits („480 sofort und dann halt
> jeden Monat rechnerisch weniger", statt der ersten Fassung mit leeren
> Monaten 2 und 3). Jahressumme 1.921 (Aufrunden von 1.440 / 11), Übertrag
> im Abojahr, Jahresbeginn setzt neu. Größter Verlust bei Erstattung nach
> Vollverbrauch: Monat 1 $13,56, bis Monat 3 $20,96. Regel:
> `allowanceGrant()` in `src/lib/plans.js`.

## 1. Das Jahresabo: alles sofort?

**Der Wunsch ist richtig:** Wer gerade begeistert ist, will spielen, nicht
zwölf Monate auf seine Credits warten. Das ist der Moment, in dem jemand
Freunden Filme zeigt.

**Das Risiko ist die Erstattung.** Apple entscheidet über Erstattungen, nicht
wir. Wer alle 1.920 Credits in der ersten Woche verbraucht und dann bei Apple
sein Geld zurückholt, kostet uns den ganzen Einkauf:

| Sofort freigeschaltet | Größter Verlust bei Erstattung (alles H3) | wenn alles Bild |
|---|---|---|
| 1.920 (alles) | $48,00 | $54,24 |
| 960 (halbes Jahr) | $24,00 | $27,12 |
| **480 (drei Monate)** | **$12,00** | **$13,56** |

Und die Marge des Jahres rechnet heute mit 75 % Verbrauch. Wer alles sofort
hat, verbraucht eher alles:

| Store-Anteil | alles verbraucht (H3) | 75 % verbraucht |
|---|---|---|
| 15 % | 1,49× | 1,98× |
| 30 % | 1,23× | 1,63× |

**Empfehlung — „Startguthaben":**
- Beim Kauf sofort **480 Credits** (drei Monate, 15 Filme à 15 s).
- Ab Monat 4 jeden Monat 160.
- **Ungenutzte Credits bleiben im Abojahr erhalten** (heute verfallen sie
  monatlich). Wer langsam träumt, verliert nichts; wer schnell spielt, kann
  ein Paket nachkaufen.
- Erstattungen über die App-Store-Servermeldungen (`REFUND`) abfangen: noch
  nicht verbrauchte Credits werden gestrichen.

Das hält den größten Verlust bei $12 und fühlt sich trotzdem großzügig an.
Braucht die Server-Abbuchung (Hannis Übergabe) — vorher ist jede
Credit-Regel nur eine Anzeige.

## 2. Was das Abo zusätzlich tragen kann

Das Kriterium: **kostet uns je Abonnent fast nichts**, ist aber etwas, das
man nicht mit einem Einmalpaket bekommt. Alles, was je Nutzung Geld kostet
(schärfere Qualität, längere Filme), gehört in die Credits, nicht ins Abo.

### Die Klartraum-Akademie — ja, mit einer Grenze

Antons Idee trägt: Ein **Kurs aus KI-Videos**, eine Technik je Abend (MILD,
Wake-Back-to-Bed, Realitätschecks, Traumzeichen, Stabilisieren), sieben
Nächte, mit Aufgabe für den nächsten Morgen und Haken im Kalender.
- **Kosten:** einmal produziert (rund 20 Clips, grob 250–500 Higgsfield-
  Credits), danach für jeden Abonnenten gratis.
- **Grenze:** Der Schlaf-Tab verspricht heute „Träume kosten Credits. Schlaf
  nie." und die Paywall führt die Luzid-Anleitung als gratis. Das darf nicht
  kippen. Also: **Die Text-Anleitung und die Realitätscheck-Erinnerungen
  bleiben gratis, die Video-Akademie ist Plus.** Dann nimmt man niemandem
  etwas weg.

### Zwei Dinge, die fast nichts kosten und das Abo spürbar machen

1. **Der Monatsfilm.** Am Monatsende schneidet die App aus den Filmen des
   Monats einen Zusammenschnitt mit Titelkarte („September — 9 Nächte, 3
   Städte, 1 Hund"). Kein neues Rendering, nur Schnitt aus vorhandenen
   Clips — Serverkosten im Cent-Bereich. Teilbar, und er erinnert jeden
   Monat daran, warum man das Abo hat.
2. **Deine Traumwelt.** Muster über alle Träume: wiederkehrende Menschen,
   Orte, Dinge und Gefühle, dazu die persönliche Traumzeichen-Liste für die
   Akademie. Eine DeepSeek-Auswertung kostet Bruchteile eines Cents.

### Was ich nicht ins Abo legen würde
- **HD für alle:** kostet je Film einen Credit je Sekunde mehr — gehört in
  die Credits.
- **„Schneller rendern":** Die Warteschlange gehört fal, nicht uns; das
  Versprechen könnten wir nicht halten.
- **Werbefreiheit:** Es gibt keine Werbung.

**Reihenfolge:** Monatsfilm zuerst (billig, sofort sichtbar), dann
Traumwelt, dann die Akademie, sobald Anton die Clips produziert hat. Die
Paywall bekommt eine Zeile „In Plus enthalten" über den Credits.

## 3. Extras bei Einmalpaketen — gebaut

Bezug ist das kleinste Paket: $5 ergeben 50 Credits, also 10 je Dollar. Was
ein größeres Paket darüber hinaus trägt, steht jetzt golden in der Zeile, mit
einem Prozent-Badge:

| Paket | Preis | Basis | Extra | Badge |
|---|---|---|---|---|
| S | $4,99 | 50 | — | — |
| M | $12,99 | 130 | +20 | +15 % |
| L | $24,99 | 250 | +70 | +28 % |
| XL | $49,99 | 500 | +200 | +40 % |

Die Credit-Zahlen selbst sind unverändert — die Marge auch. Im Simulator
geprüft (Commit `04429aa`).
