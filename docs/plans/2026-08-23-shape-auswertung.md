# Shape ausgewertet — fünfzehn Screenshots, was davon taugt

**Stand:** 2026-08-23 · Analyse, **nichts gebaut**
**Anlass:** Antons Screenshots der App „Shape" (Klartraum, Jahresabo
79,99 €). Auftrag: auswerten und ableiten, was wir übernehmen können.

Ergänzt `2026-08-23-lucid-inhalte-dreamwithin.md` (DreamWithin). Wo beide
Apps dasselbe tun, ist es Branchenstandard und keine Erfindung.

---

## 1. Der größte Fund ist technisch, nicht gestalterisch

**Shape fragt die Benachrichtigungs-Erlaubnis ZWEIMAL — erst in der App,
dann im System.**

Zwei aufeinanderfolgende Bildschirme: *„Would you like to receive
Am-I-Dreaming reminders?"* (Ja/Nein), danach *„How many per day?"*
(1/2/3/4). Erst danach kommt der iOS-Dialog.

**Warum das der wichtigste Screenshot im ganzen Stapel ist:** iOS gibt
für die Benachrichtigungs-Erlaubnis **genau einen Versuch**. Wer den
Systemdialog kalt zeigt, verliert alle, die im falschen Moment „Nicht
erlauben" tippen — und darf **nie wieder fragen**. Die Erlaubnis ist dann
nur noch über die Systemeinstellungen zu holen, wohin niemand geht.

Die App-eigene Frage davor kostet nichts und ändert alles: Der
Systemdialog erscheint nur noch für Leute, die schon Ja gesagt haben.

⚠ **Das betrifft uns unmittelbar**, weil die Xcode-Portierung ansteht und
wir dort dieselbe eine Chance haben — für Traumtagebuch-Erinnerungen, für
die Serie, für die Reality-Checks. **Wer das erst nach dem Start merkt,
kann es nicht mehr reparieren.** Das gehört in den Capacitor-Plan, bevor
die erste Benachrichtigung gebaut wird.

Die zweite Frage („wie viele pro Tag?") verdient eine eigene Zeile: Sie
gibt dem Menschen die Dosierung in die Hand, statt sie ihm zuzuteilen.
Das ist der Unterschied zwischen einer Erinnerung und einer Belästigung —
und es ist der Grund, warum jemand sie nicht nach drei Tagen abschaltet.

## 2. Der Tagespreis — Antons Beobachtung, ausgerechnet

`7 DAYS FREE / 0,22 €/DAY (BILLED 79,99 €/YR)`

Warum das funktioniert, ist kein Trick: Ein Abo ist eine **laufende**
Ausgabe, und laufende Ausgaben vergleicht der Mensch mit laufenden
Ausgaben — einem Kaffee. 79,99 klingt nach Anschaffung, 0,22 nach dem,
was es ist.

Bei uns steht die Zahl schon da, sie wird nur nirgends gezeigt
(`scripts/preis-durchreichen.mjs`, Abschnitt 8):

| Plan | Preis | pro Tag |
|---|---|---|
| Woche | $4,99 | $0,713 |
| Monat | $9,99 | $0,328 |
| **Jahr** | **$79,99** | **$0,219** |

⚠ **Nur für Abos.** Ein Paket hat keinen Zeitraum; „6 Credits für $2,99"
auf Tage zu rechnen hieße, sich einen Nenner auszudenken. Das wäre
Schönrechnen, nicht Verständlichmachen — und es fiele auf.

⚠ **Und ein zweiter Vorbehalt, den Shape nicht hat und wir schon:** Der
Tagespreis passt zu einem Abo, das täglich etwas liefert (ein Kurs, eine
Erinnerung). Unsere Abos liefern **Credits, die man in Schüben ausgibt** —
45 im Monat sind eher zwei Abende als dreißig Tage. Der Tagespreis ist
für uns trotzdem richtig, aber als **zweite** Zeile unter dem echten
Preis, nicht als Hauptzahl. Sonst verspricht die Zahl eine tägliche
Nutzung, die das Produkt gar nicht will.

## 3. Der PROGRESS-Reiter — wir rechnen das längst, wir zeigen es verstreut

Shape sammelt an EINEM Ort: aktuelle **und beste** Serie, ein Punkteraster
der letzten 14 Nächte mit „TODAY"-Plus, eine Erfolgs-Checkliste,
Gesamtzahlen (Träume, Klarträume, Guide-Fortschritt in %), und einen
Monatsbericht.

Bei uns existiert fast alles — nur verteilt: `streak.js` (Serie,
Meilensteine), `monthReview()` (Monat in vier Zahlen, im Atlas),
`checkin.js` (`sleepAverage`, `sleepByMood`), das Tagebuch selbst.

**Die Idee ist nicht die Statistik, sondern der eine Ort.** Ein Mensch,
der wissen will „komme ich voran?", soll nicht durch drei Reiter suchen.

⚠ Zwei Dinge würde ich anders machen:
- **Kein „Guide-Fortschritt in %".** Unser Klartraum-Leitfaden ist
  ausdrücklich **keine Checkliste** (so steht es im Dateikopf von
  `LucidGuide.jsx`) — ein Prozentbalken würde einen Lernpfad behaupten,
  den die Evidenz nicht hergibt.
- **Beste Serie ja, aber vorsichtig.** Eine „beste Serie: 12" neben
  „aktuell: 0" ist für manche Ansporn und für andere die Nachricht, dass
  sie versagt haben. Die Schlummernacht (`streak.js`) ist genau die
  Gegenmaßnahme, die wir schon gebaut haben.

## 4. Der Leerzustand — hier lernt man am meisten aus dem Fehler

Auf Shapes Fortschrittsseite steht in einer frischen Installation:
0 Träume, 0 Klarträume, 0 %, 0 Nächte, alle Erfolge leer. Darüber ein
Hinweiskasten, der erklärt, dass sich das „automatisch aktualisiert".

**Ein Bildschirm voller Nullen ist kein Fortschritt, er ist ein Vorwurf.**
Und der Erklärkasten ist das Eingeständnis: Wenn eine Seite erklärt
werden muss, warum sie leer ist, war sie zu früh sichtbar.

Für uns: Der Fortschrittsort darf **erst erscheinen, wenn es etwas zu
zeigen gibt** — dieselbe Regel, die im Journal schon gilt (der Traumatlas
taucht ab dem zweiten echten Traum auf). Diese Regel steht bei uns bereits
im Code; sie muss nur auch hier gelten.

## 5. Die Benennung: „Am-I-Dreaming reminders" statt „Reality checks"

Ein kleiner, guter Fund. „Reality check" ist Fachsprache; „Bin ich gerade
am Träumen?" ist die Frage selbst. Der Name **beschreibt die Handlung**,
nicht die Kategorie.

Das passt zu einer Regel, die wir ohnehin verfolgen (Texte in der Sprache
des Menschen, nicht der des Systems) — und es kostet nichts.

## 6. Tap-Onboarding — genau das, was uns fehlt

Shapes Einführung ist eine Kette: ein Fakt („Did you know?"), eine Frage,
ein Fakt, eine Frage — je ein Bildschirm, oben ein Fortschrittsbalken,
unten ein Knopf.

⚠ **Bei uns ist die Einführungsumfrage ausschließlich gesprochen**
(`OnboardingSurvey.jsx`, Gemini Live). Das ist schöner als jede
Klickstrecke — aber es hat eine harte Kante: **Ohne `GEMINI_KEY`, ohne
Mikrofon-Erlaubnis oder ohne stabile Verbindung gibt es GAR KEIN Profil.**
Keine Traumzeichen, kein Ziel, keine Themen. Alles, was später darauf
aufbaut, fällt mit aus.

**Der Fund ist also nicht „macht es wie Shape", sondern: uns fehlt der
Rückfallweg.** Eine getippte Kurzfassung derselben Fragen — vier, fünf
Bildschirme — kostet einen Nachmittag und schließt ein Loch, durch das
sonst jeder Nutzer ohne Mikrofon fällt.

Die „Did you know?"-Karten dazwischen sind der billigste Teil davon: Sie
geben der Strecke Rhythmus und bringen dem Menschen etwas bei, während er
antwortet. **Aber nur mit nachgerechneten Zahlen und Quelle.** Shapes
„33 % des Lebens, 6 volle Jahre im Traum" ist haltbar; „Expert lucid
dreamers manifest desires" ist es nicht.

## 7. Der „persönliche Traum-Coach" — und wie wir ihn ehrlich hätten

Shape fragt: *„Would you like a personal dream coach? — one-on-one,
text-based access to an experienced lucid dreamer."*

Das ist eine Absichtsfrage vor einem Zusatzangebot. Ob dahinter ein
Mensch steht oder ein Sprachmodell, sagen die Screenshots nicht — und
genau das ist der Punkt: **„ein erfahrener Klarträumer" klingt nach
Mensch.** Ist es keiner, ist der Satz eine Täuschung; ist es einer,
skaliert er nicht.

**Wir haben die ehrliche Fassung fast fertig.** Die Reflection liest schon
das eigene Tagebuch und antwortet in Angebots-Sprache (Spiegel, nicht
Orakel). Aus einer Antwort ein Gespräch zu machen, ist ein kleiner
Schritt — und es kostet ~$0,0003 je Runde.

Nur muss dranstehen, was es ist. Ein KI-Begleiter, der die eigenen Träume
kennt, ist ein besseres Angebot als ein anonymer „erfahrener Klarträumer" —
er muss sich bloß nicht als Mensch ausgeben. Und der AI-Act verlangt die
Kennzeichnung ohnehin (Art. 50, gilt seit 02.08.2026).

## 8. Was ich nicht übernehmen würde

- **„I had a lucid dream the night I downloaded this app."** Als
  Bewertungszitat auf dem Kaufblatt. Selbst wenn es echt ist, wirbt es mit
  dem unwahrscheinlichsten Verlauf als Normalfall.
- **„this habit carries into the dreamworld and leads to lucidity."**
  Steht bei Shape unter der Reality-Check-Frage. Unsere eigenen
  ausgelieferten Zahlen widersprechen dem (Aspy 2020: mit Reality Checks
  10,8 % / 13,4 % gegen 16,5 % ohne).
- **„Expert lucid dreamers manifest desires."** „Manifest" ist das Wort,
  an dem eine Evidenz-App stirbt.
- **Der Bewertungs-Aufruf direkt neben lauter Nullen.** Um eine Bewertung
  bittet man nach einem Erfolg, nicht davor. (Der Aufruf selbst ist
  richtig — nur der Zeitpunkt ist es nicht.)

## 9. Nachtrag: der zweite Stapel — Shapes ganze Fragestrecke

Fünf weitere Fragen, je ein Bildschirm, Fortschrittsbalken oben:

| Frage | Antworten |
|---|---|
| Wie oft erinnerst du Träume? | jede Nacht · wöchentlich · monatlich · paarmal im Jahr · selten/nie |
| Wie beschreibst du die Qualität deiner Träume? | normal · unangenehm · fesselnd · bizarr · glücklich |
| Wie viele Stunden schläfst du? | <6 · 6–7 · 7–8 · 8–9 · 9+ |
| Wie viel Zeit kannst du täglich aufwenden? | 5 · 10 · 20 · 30 Min · 1 Std+ |
| Aus welcher Tradition willst du lernen? | moderne Wissenschaft · tibetisches Yoga · Traumpsychologie · Schamanismus |

### 9a. Zwei davon sind bei uns Gold — weil sie den Plan erst persönlich machen

**Schlafdauer** und **Zeitbudget** sind keine Neugier, das sind die
**Parameter**, aus denen ein Plan überhaupt erst gerechnet werden kann:

- **Schlafdauer ist inhaltlich relevant, nicht nur statistisch.** REM
  ballt sich im letzten Drittel der Nacht. Wer unter sechs Stunden
  schläft, hat strukturell weniger und kürzere REM-Phasen — also weniger
  Traum, weniger Erinnerung, weniger Gelegenheit für Luzidität. Das ist
  eine wahre, nützliche und für den Menschen wahrscheinlich neue Auskunft.
  **Bei jemandem mit fünf Stunden Schlaf ist die wirksamste
  Klartraum-Maßnahme: länger schlafen.** Das kann man ihm sagen, und es
  ist ehrlicher als jede Technik.
- **Zeitbudget entscheidet, welche Technik überhaupt vorgeschlagen werden
  darf.** WBTB verlangt ein nächtliches Aufwachen; MILD braucht Minuten
  vor dem Einschlafen. Wer „5 Minuten oder weniger" sagt, dem WBTB zu
  empfehlen, ist ein Plan, der von vornherein scheitert.

Unser Fragebogen sammelt heute `recall`, `lucid`, `themes`, `goal` — beide
fehlen. Sie sind der billigste Zuwachs an Personalisierung im ganzen
Stapel.

### 9b. Traumqualität — die Frage, die den Einstieg umleiten sollte

Shape fragt nach der Qualität und tut damit nichts Erkennbares. **Bei uns
wäre eine Antwort davon ein Weichenschalter:** Wer „unangenehm" wählt,
sollte nicht als Erstes „Flieg zum Mars" angeboten bekommen, sondern das
Albtraum-Umschreiben (Mehrwert-Plan P3a, noch offen).

Der Rest ist ohnehin schon da: `analysis.mood` liefert die Stimmung je
Traum, der Atlas zählt sie. Die Frage im Fragebogen wäre der **Startwert**
vor dem ersten Traum — und damit auch die Zeile, an der man später sieht,
ob sich etwas verändert hat.

### 9c. Die Traditionsfrage — die interessanteste, und die heikelste

*„Aus welcher Tradition willst du lernen?"* Vier gleichrangige Kacheln:
moderne Wissenschaft, tibetisches Traumyoga, Traumpsychologie,
Schamanismus.

Das ist geschickt: Dieselbe Sache in dem Register erzählt, dem der Mensch
vertraut. Und es ist billig — ein Textbaustein, kein neuer Inhalt.

⚠ **Für uns ist es genau deshalb gefährlich.** Unser Unterscheidungs-
merkmal ist, dass `LucidGuide.jsx` auf einer Studie steht und sogar
berichtet, was NICHT funktioniert hat. Schamanismus gleichrangig neben
„moderne Wissenschaft" zu stellen, sagt: alles vier ist gleich wahr. Das
zerlegt genau die Haltung, die uns von Shape unterscheidet.

**Die brauchbare Fassung ist enger und ehrlicher:** Nicht *„was ist
wahr?"*, sondern *„wie sollen wir mit dir reden?"*. Die **Fakten bleiben
identisch**, nur die Sprache ändert sich — und ausschließlich dort, wo es
ohnehin um Deutung geht (die Reflection, die Symbolseite), nie im
Leitfaden mit den Zahlen.

Konkret: Jemand, der Jungs Sprache mag, bekommt „Schatten" und
„Anima" statt „wiederkehrendes Motiv" — dieselbe Beobachtung, anderes
Vokabular. Das ist zulässig, weil unsere Deutung ohnehin ausdrücklich als
**Angebot** formuliert ist („Spiegel, nicht Orakel") und nie behauptet,
die Wahrheit über den Menschen zu kennen.

Was NICHT geht: eine Kachel „Schamanismus", hinter der dann steht, was
Träume „bedeuten". Das wäre das Lexikon der Konkurrenz mit Federschmuck.

### 9d. Die Länge der Strecke ist selbst eine Entscheidung

Zusammengezählt sind es **zwölf und mehr Bildschirme** vor dem Kaufblatt.
Das ist bewusst: Wer zehn Fragen beantwortet hat, hat investiert und
kauft eher — ein bekanntes Muster, das nachweislich funktioniert und
gleichzeitig Leute unterwegs verliert.

**Unsere gesprochene Umfrage ist hier im Vorteil**, und das ist kein
Zufall: Ein Gespräch sammelt dieselben Angaben in einem Zug, ohne dass
sich jemand durch zwölf Bildschirme tippt. Der Rückfallweg aus Abschnitt 6
sollte deshalb **nicht** Shapes zwölf Bildschirme nachbauen, sondern die
vier oder fünf Angaben einsammeln, ohne die der Rest nicht funktioniert:
Erinnerungshäufigkeit, Schlafdauer, Zeitbudget, Ziel — und, falls „Träume
sind unangenehm", die Weiche aus 9b.

## 10. Vorschlag für die Reihenfolge

1. **Vorab-Frage zur Benachrichtigung** — in den Capacitor-Plan
   schreiben, BEVOR die erste Benachrichtigung gebaut wird. Kostet nichts,
   ist später nicht nachholbar.
2. **Tagespreis als zweite Zeile** auf dem Kaufblatt, nur bei Abos.
3. **Zwei Fragen ergänzen: Schlafdauer und Zeitbudget** (§9a). Billigster
   Zuwachs an Personalisierung im ganzen Stapel — und die Schlafdauer
   erlaubt eine ehrliche Auskunft, die sonst niemand gibt.
4. **Getippter Rückfallweg für die Einführungsumfrage** — schließt ein
   echtes Loch, nicht nur eine Bequemlichkeitslücke. Vier, fünf Fragen,
   nicht Shapes zwölf (§9d).
5. **Traumqualität als Weiche** (§9b) — wer „unangenehm" sagt, bekommt
   das Albtraum-Umschreiben angeboten, nicht „Flieg zum Mars".
6. **Ein Fortschrittsort**, der erst erscheint, wenn es etwas zu zeigen
   gibt.
7. **Umbenennung** „Reality check" → die Frage selbst.
8. **Reflection zum Gespräch ausbauen**, ausdrücklich als KI gekennzeichnet.
   Die Registerwahl aus §9c gehört hierhin — und NUR hierhin.

Punkte 1–7 kosten keine laufenden Kosten. Punkt 8 kostet Cent-Beträge.
