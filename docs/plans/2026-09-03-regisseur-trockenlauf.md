# Trockenlauf: fünf fremde Träume durch den Regisseur-Schnitt

**Stand:** 2026-09-03 · Anlass: Antons Auftrag „finde mal typische Träume im
Internet und probiere damit aus, mindestens fünf Träume, und mach dann einen
Entschluss, ob der User damit zufrieden wäre."
**Ergebnis: Der Skill ist besser als der heutige Weg, aber er hat fünf Fehler,
die erst an fremdem Material sichtbar wurden. Vier davon sind behoben (`SKILL.md`),
einer bleibt offen und gehört Anton.**

## 1. Das Material

Fünf echte, unredigierte Traumprotokolle aus **DreamBank.net** (Adam Schneider
und G. William Domhoff, UC Santa Cruz) — kein erfundenes Testmaterial, kein
geglätteter Text. Ausgewählt nach den fünf häufigsten Traumtypen
(Verfolgung 92 %, Fallen 87 %, Zuspätkommen 81 %, Prüfung 79 %, Zähne 49 %).

| # | Typ | Quelle | Wörter |
|---|---|---|---|
| T1 | Verfolgung | `dreambank.net/show.cgi?series=b&d=b:0808` (Barb Sanders, 1985) | 291 |
| T2 | Zähne | `dreambank.net/show.cgi?series=van&d=van:101` (Van, 2009) | 339 |
| T3 | Fliegen | `dreambank.net/show.cgi?series=samantha&d=samantha:56` (Samantha, 1998) | 319 |
| T4 | Prüfung / zu spät | `dreambank.net/show.cgi?series=izzy&d=izzy:1732` (Izzy, 16 J., 2007) | 289 |
| T5 | Nackt | `dreambank.net/show.cgi?series=bea1&d=bea1:219` (Bea, 16 J., 2005) | 187 |

⚠ **Lizenz: CC BY-NC-SA 4.0 — nicht-kommerziell.** Die Volltexte stehen
deshalb bewusst NICHT in diesem Repository, nur die Adressen und meine
eigenen Analysen. Diese fünf Träume dürfen nicht in Marketing, App-Beispiele
oder öffentliche Demos wandern. Für Testzwecke unbedenklich.

## 2. Was die App heute daraus macht

Der Weg ist belegt, nicht geschätzt:
`server.js:1135` weist das Sprachmodell an, den Traum in **„exactly 5, always
… split it evenly"** zu zerlegen — gleichmäßig nach Textlänge, ausdrücklich
nicht nach Wichtigkeit. Danach nimmt `beatCountForSeconds` (`beats.js`)
`floor(Sekunden / 3)`, gedeckelt auf 2 bis 5, und `evenIndices` wählt daraus
**nach Position**. Bei 5 Sekunden heißt das: erstes Fünftel und letztes
Fünftel, je 2,5 Sekunden.

Was bei 5 Sekunden auf der Leinwand landet:

| # | Der Film heute | Urteil |
|---|---|---|
| T1 | Flucht mit dem Kind aus dem Haus → Umarmung nach der Todesnachricht | **brauchbar** — der Panther fehlt, aber Anfang und emotionaler Kern sitzen |
| T2 | Fahrt im Golfwagen durch Bangkok → Zähne in der Hand | **daneben** — der Zahnverlust selbst fehlt |
| T3 | Überfülltes Büro → Kuss mit dem Ex-Freund | **daneben** — ein Flugtraum, in dem nicht geflogen wird |
| T4 | Haare glätten → der Vater erklärt im Prüfungsraum, was eine Säure ist | **halb** — der Kern (12:10, Prüfung lief um 12 an) fehlt, der Schlussbeat ist ein Glückstreffer |
| T5 | Bootsjagd vor Italien → Mittagessen in der Schule | **daneben** — die Nacktheit fehlt, im Nacktheitstraum |

**Drei von fünf verlieren genau das Ereignis, das den Traum ausmacht.** Der
Grund ist immer derselbe: Der Titel-Beat steht in der Mitte, und die Mitte
fällt zuerst.

Bei 15 Sekunden verschwindet der Beat nicht mehr, aber die Zeit ist
gleichmäßig verteilt. Bei T2 sind das **9 von 15 Sekunden für Kulisse**
(Golfwagen, Bilderrahmen, Parkplatzsuche) und 6 Sekunden für den
Zahnverlust. Der Traum heißt „meine Zähne fielen aus". Er sagt es im ersten
Satz.

## 3. Was der Skill daraus macht

Beat-Zerlegung nach `SKILL.md`, Schritt 1. Ergebnis für alle fünf:

| # | Beats | davon geschützt (turn/reveal/climax/resolution) | Σ min_s | Signatur-Beat |
|---|---|---|---|---|
| T1 | 10 | 4 | 35 s | Der Panther hat die Krallen in ihrem Arm |
| T2 | 11 | 3 | 35 s | Der Blick in den Spiegel, der Eckzahn fehlt |
| T3 | 10 | 4 | 36 s | Der Aufzug ist ein Flugzeug und hebt ab |
| T4 | 10 | 5 | 33 s | 12:10 auf der Uhr, die Prüfung lief um 12 an |
| T5 | 10 | 4 | 34 s | Sie steht nackt in der Schule und schämt sich nicht |

Zwei Zahlen fallen sofort auf, und beide waren im Skill ein Fehler:

**Jeder erzählte Traum landet bei rund 35 Sekunden.** Das ist kein Zufall:
zehn Beats mal drei bis vier Sekunden. Damit lag `min_gesamt` bei **fünf von
fünf** Träumen über dem Maximum beider Modelle (30 s Seedance, 15 s H3), und
der Skill hätte fünf von fünf Mal „Das ist ein Zweiteiler" gesagt. Eine
Empfehlung, die immer dasselbe sagt, ist keine.

**Bei 5 Sekunden sprengen allein die geschützten Beats das Budget.** Ein
5-Sekunden-Clip trägt einen, höchstens zwei Shots. Geschützt sind drei bis
fünf. Die Regel „nie `climax`, nie `turn`, nie `resolution`" ist bei der
billigsten und meistgekauften Filmlänge in **fünf von fünf** Fällen nicht
einhaltbar — und der Skill hatte keinen Ausweg dafür.

## 4. Die fünf Fehler

**(1) `min_gesamt` war die falsche Zahl.** Summiert wurden alle Beats, also
auch die, die ohnehin fliegen. Richtig ist die Summe über die geschützten
Beats: das, was der Traum mindestens braucht. Neu gerechnet: T1 17 s, T2 11 s,
T3 18 s, T4 17 s, T5 16 s. Das sind Zahlen, die etwas aussagen — und sie
liegen genau im Bereich, den die App verkauft.

**(2) Es fehlte der Ausweg für kleine Budgets.** Neu: der **Signatur-Beat** —
der eine Beat, den der Träumende nennen würde, wenn er nur einen Satz hätte.
Trägt der Clip nur einen Shot, ist das kein Schnitt, sondern ein Bild. Ein
5-Sekunden-Film ist ein bewegtes Traumbild, keine Erzählung, und das darf man
dem Menschen auch so sagen. Bei allen fünf Träumen ist der Signatur-Beat
offensichtlich der richtige (Tabelle oben) — und in drei Fällen genau der,
den die App heute wegwirft.

**(3) `build` war ein Sammelbecken.** Die Wurf-Reihenfolge endete bei `setup`,
also blieben Kulissen-Beats stehen, die als `build` durchgingen. Bei T2 sind
das sechs Stück: Bangkok, Ruinen, Geländer, Bilderrahmen, Parkplatzsuche,
70er-Deko. Neu ist ein prüfbares Kriterium: **berührt der Beat den
Signatur-Beat** durch Ort, Figur oder Gegenstand? Wenn nicht, ist er Kulisse
und fliegt vor allen anderen `build`-Beats.

**(4) Die Schluss-Regel stand auf einer falschen Annahme.** `beats.js` sagt
es selbst: „der Anfang setzt den Ort, das Ende löst auf". Der Test widerlegt
das. Nur **T1** endet auf einer echten Auflösung (die Umarmung nach dem
Weinen). T3 endet mit einem Kuss an einem Ort, der nie vorkam. T4 endet auf
einer Broschüre mit Filmtiteln. T5 endet mit „dann sah ich Valerie und
Ashley". **Vier von fünf Träumen hören einfach auf.** Der Skill hätte den
schwächsten Beat geschützt, weil er zufällig der letzte war. Neu: Ein
Schlussbeat ist nur dann `resolution`, wenn er Ort oder Figuren mit dem
Höhepunkt teilt. Sonst endet der Film auf dem Höhepunkt.

**(5) Die Figuren-Obergrenze fehlte — offen.** T4 nennt elf Personen: Nana,
Tante Sally, Dad, Ezra, Mittens, Darren, Mom, Jeremiah, Eugene, Bradley,
Teresa. H3 nimmt fünf Referenzbilder, Seedance 2.5 neun. Der Skill sagte dazu
nichts. Jetzt sagt er: über der Grenze werden Nebenfiguren namenlose
Statisten, benannt bleiben nur die des Signatur-Beats. **Das ist die halbe
Lösung** — die andere Hälfte hängt an den Charakterbögen, die laut
`2026-08-31-nur-noch-film.md` Phase 3 ohnehin sichtbar werden sollen.

## 5. Zwei Shot-Listen als Beleg

**T2 (Zähne), Seedance 2.5, 15 s, Budget 3–4 Shots.** Geworfen: alle sechs
Kulissen-Beats nach Kriterium (3). Behalten: Sturz, Spiegel, Hand.

```
[0s-5s] SHOT 1 — Interior of a parked car at dusk, 47° field of view, slow push in on the
driver. A man in his late twenties sits behind the wheel, turned three-quarters toward the
mirror, mouth half open. A front tooth chips loose and drops onto his lower lip; he catches it
on his tongue. Small, wet, sudden. Low warm light from the left through the windscreen.
[5s-10s] SHOT 2 — cut to a tight mirror view, 29° field of view, static. Same man, same car,
same warm light from the left, now reflected. He pulls his upper lip back with two fingers. The
canine is gone; the gap is dark and clean. His eyes move, the hand stays. Breath fogs the glass.
[10s-15s] SHOT 3 — cut to an overhead close view of his open palm, 47° field of view, slow tilt
up to his face. Same car, same light from the left. Four teeth lie in his hand, wet with saliva.
His fingers begin to close, then stop halfway. He does not look up. The picture holds on the
open hand.
sharp clarity, natural colour, stable picture
```

**T5 (Nackt), MiniMax H3, 5 s, Budget 1 Shot.** Kein Schnitt — der
Signatur-Beat als ein Bild.

```
[Shot 1] A school corridor in the afternoon, 47° field of view, a slow steady dolly following a
teenage girl from behind at walking pace. She is bare, carrying folded pink corduroy trousers
and a white polo shirt against her chest, walking unhurried between rows of lockers. Other
students pass her on both sides without turning their heads. Her shoulders are relaxed, her
chin level — no hunching, no covering. Cool daylight from tall windows on the right lays long
stripes across the floor. Footsteps, distant voices, no music.
sharp clarity, natural colour, stable picture
```

Der zweite ist der eigentliche Beweis: **Fünf Sekunden reichen für diesen
Traum** — nicht als Erzählung, sondern als Bild. Die App zeigt heute
stattdessen eine Bootsjagd und ein Mittagessen.

## 6. Der Entschluss

**Wäre Anton damit zufrieden? Ab 15 Sekunden ja, darunter erst mit den
Korrekturen — und eine Frage bleibt offen, die kein Skill lösen kann.**

Im Einzelnen:

- **15 bis 30 Sekunden: klar besser als heute.** Der Gewinn ist nicht der
  Schnitt, sondern das Wegwerfen: T2 gewinnt 9 von 15 Sekunden zurück, weil
  Bangkok nicht mehr denselben Platz bekommt wie der Zahnverlust. Das ist
  sichtbar, und es kostet keinen Cent extra.
- **5 bis 10 Sekunden: vorher unbrauchbar, jetzt brauchbar** — aber nur durch
  den Signatur-Beat, also durch das Eingeständnis, dass ein kurzer Film keine
  Geschichte erzählt. Ein Nutzer, der bei 5 Sekunden eine Handlung erwartet,
  wird enttäuscht sein, egal wie gut geschnitten wird. Das ist Physik, nicht
  Regie.
- **Was kein Skill löst:** Ein erzählter Traum braucht rund 35 Sekunden,
  Seedance 2.5 kann 30, H3 kann 15. **Der ganze Markt liegt jenseits dessen,
  was ein Clip trägt.** Entweder der Zweiteiler wird ein Produkt (und dann
  hängt er am Preisentscheid), oder die App sagt dem Menschen ehrlich, dass
  sie einen Ausschnitt verfilmt und nicht den Traum. Das ist Antons
  Entscheidung, keine technische.

Ein Vorbehalt zur Aussagekraft: Ich habe die Beats selbst gesetzt, nicht das
Sprachmodell im Server. Der Test zeigt also, ob die **Regeln** taugen — nicht,
ob DeepSeek sie befolgt. Das zeigt erst der erste echte Lauf, und der gehört
an den Anfang von Phase 2 im Umbauplan.

## 7. Was daraus folgt

1. `SKILL.md` ist korrigiert (Signatur-Beat, zwei getrennte Zeitangaben,
   Kulissen-Kriterium, Schluss-Regel, Figuren-Obergrenze).
2. Der Umbauplan `2026-09-03-regisseur-schnitt.md` §4 braucht zwei Zeilen
   mehr: `signatureBeat()` und die Figuren-Obergrenze aus `video.js`.
3. Offen für Anton: Zweiteiler als Produkt — ja oder nein. Hängt am
   Preisentscheid `2026-08-26-preisentscheid.md`.
