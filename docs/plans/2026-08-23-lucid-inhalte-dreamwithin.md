# Was wir von DreamWithin lernen — und was wir bewusst nicht kopieren

**Stand:** 2026-08-23 · Analyse, **nichts gebaut**
**Anlass:** Antons Screenshots einer Wettbewerber-App (DreamWithin) mit
Klartraum-Kursen, Reality-Check-Erinnerungen, Dream Cues, Sleep Stories.
Seine Beobachtung: *„Dafür wollen die schon Geld haben, obwohl die gar
keine APIs oder Ausgaben haben."* Und sein Interesse an den
Reality-Check-Erinnerungen alle zwei Stunden.

---

## 1. Die wichtigste Erkenntnis ist die kaufmännische

Anton hat den Kern getroffen: **Deren Ware kostet im Betrieb nichts.**
Ein Kurs, eine Hypnose, ein Audio-Cue — einmal produziert, unendlich oft
verkauft. Unsere Ware kostet bei jedem Verkauf echtes Geld (fal, DeepSeek).

Das ist genau der Hebel gegen unser Margenproblem aus
`2026-08-22-preislinie-durchreichen.md`: **Ein Angebot mit Grenzkosten
null verbessert die Mischung, ohne dass irgendwo ein Preis steigt.** Wer
30 % seines Umsatzes mit Inhalten macht, kann die Bilder und Filme näher
am Einkauf verkaufen — was Antons erklärte Linie ist.

⚠ **Aber es kollidiert mit einer Zusage, die wir schon gegeben haben.**
Im Sleep-Reiter steht wörtlich: *„Dreams cost credits. Sleep never
will."* Und der Mehrwert-Plan hat die Linie festgelegt: **Verstehen ist
gratis, bezahlt wird das Sehen.** Klartraum-Inhalte hinter eine Bezahlwand
zu schieben, würde beides brechen — bei Menschen, die schon da sind.

**Der Ausweg, der beides hält:** Das heute Gratis-Versprochene bleibt
gratis (Checkliste, Klanglabor, Klartraum-Leitfaden, Symbole). Was NEU
dazukommt und echte Produktionsarbeit kostet — geführte Audios,
personalisierte Schlafgeschichten —, darf bezahlt sein. Ein Versprechen
gilt für das, was zum Zeitpunkt des Versprechens da war; es verbietet
nicht, später mehr zu bauen. Nur umetikettieren darf man das Alte nicht.

## 2. Reality-Check-Erinnerungen: Antons Wunsch trifft unsere eigene Evidenz

Anton findet die Erinnerungen alle zwei Stunden interessant. **Das ist die
eine Stelle, an der ich widersprechen muss** — und zwar mit unserem
eigenen Bildschirm.

`src/screens/Profile/LucidGuide.jsx` steht seit dem 10.08. auf der
International Lucid Dream Induction Study (Aspy 2020, n=355). Der Text,
den wir dort ausliefern, sagt:

> *Die ehrliche Erkenntnis: Gruppen, die Reality Checks zu MILD
> hinzunahmen, schnitten SCHLECHTER ab als MILD allein (10,8 % und 13,4 %
> gegen 16,5 %).*

Also: **Die Erinnerungen sind das meistverkaufte Merkmal der Konkurrenz —
und in der einzigen großen Vergleichsstudie haben sie das Ergebnis
verschlechtert.** Der Dateikopf von LucidGuide.jsx nennt das ausdrücklich
die unbequeme Entscheidung: *„ein Leitfaden, der sagt, was tatsächlich
gescheitert ist, ist der einzige, der um drei Uhr nachts etwas wert ist."*

**Was das NICHT heißt:** dass wir es nicht bauen dürfen. Unser eigener
Text sagt im selben Atemzug, die Checks *„bauen vielleicht trotzdem die
Gewohnheit auf, das Gesehene zu hinterfragen"*. Eine Erinnerung, die einen
Menschen sechsmal am Tag kurz innehalten lässt, ist für sich genommen
harmlos und für die Bindung an die App wertvoll.

**Was es heißt:** Wir dürfen es nicht als Klartraum-Hebel VERKAUFEN. Die
Konkurrenz verspricht mit dieser Funktion Luzidität. Wir hätten dieselbe
Funktion mit dem ehrlichen Satz daneben — und das ist kein Nachteil,
sondern der Unterschied. Wer die Studie kennt, erkennt sofort, welche der
beiden Apps ihn ernst nimmt.

**⚠ Technische Sperre, unabhängig davon:** Wiederkehrende Erinnerungen
brauchen **lokale Systembenachrichtigungen**. Die gibt es in einer
Web-App nicht verlässlich (iOS-Safari erst recht nicht). Das Feature hängt
damit vollständig am **Capacitor-Schritt**, der ohnehin auf dem Fahrplan
steht. Vorher ist es nicht baubar — nicht schlecht baubar, sondern gar
nicht.

## 3. Was aus den Screenshots wirklich lohnt — nach Wert sortiert

### A. Der persönliche Plan (Screenshots 3–4) — der stärkste Fund

*„Your personal lucid dreaming plan"*, *„Actions for fast results — you'll
integrate these as part of a new habit over the next weeks"*, dann eine
Liste anhakbarer Gewohnheiten und ein **Start Plan**-Knopf.

Das ist keine Funktion, das ist ein **Bindungsmotor**. Es verwandelt eine
Sammlung von Werkzeugen in einen Weg mit Anfang. Wir haben die Bausteine
alle: Onboarding-Umfrage, Serie, Meilenstein-Leiter, Morgen-Check-in,
Schlaf-Checkliste. Was fehlt, ist die Klammer, die daraus einen *Plan*
macht, den man startet.

⚠ Der Haken, den ihre Fassung hat und unsere nicht haben darf: Ihr Plan
ist für alle gleich und heißt trotzdem „persönlich". Unserer hätte echte
Daten dafür — die Umfrageantworten, den Schlaf-Check-in, die
Traumhäufigkeit. **Ein Plan, der wirklich aus den eigenen Antworten
gebaut ist, ist nicht kopiert, sondern besser.**

### B. Dream Cues in der Nacht — das billigste echte Feature

*„Get audio cues throughout the night to realize that you are dreaming."*

Wir haben dafür schon **alles**: den Klangmischer (`soundMixer.js`), den
Einschlaf-Timer, die Hintergrundwiedergabe. Ein Cue ist ein kurzer,
leiser Ton in Abständen — technisch der kleinste Zusatz auf einer
Infrastruktur, die steht. **Das ist der günstigste Weg von allen fünf.**

⚠ Zwei Auflagen: Der Cue darf nicht wecken (dieselbe Überlegung wie beim
Ausblenden über eine Minute), und die Evidenzlage ist dünner als die
Werbung — also wieder: bauen, aber nicht überversprechen.

### C. Schlafgeschichten aus dem EIGENEN Traumtagebuch — unser Alleinstellungsmerkmal

Ihre Sleep Stories sind eingekaufte Aufnahmen. Wir haben etwas, das sie
nicht haben können: **das Tagebuch des Menschen und eine Stimme, die
schon gewählt ist** (Gemini-TTS, Stimmproben liegen seit gestern bei uns
im Repo).

Eine Schlafgeschichte, die aus den eigenen Träumen der letzten Wochen
gewebt ist, vorgelesen von der Stimme, die der Mensch sich ausgesucht
hat — das kann keine App mit einer Audiothek nachbauen. Kosten: ein
DeepSeek-Aufruf und etwas TTS, also Cent-Beträge.

Das ist die Sorte Idee, die zu diesem Projekt passt: nicht mehr Inhalte,
sondern Inhalte aus dem, was ohnehin schon da ist — dasselbe Muster wie
Traumatlas und Reflection.

### D. Die Vergleichstabelle Basic/Plus (Screenshot 1)

Eine bewährte Kaufblatt-Form: Zeilen sind Funktionen, zwei Spalten,
Haken gegen Schloss. Übernehmenswert als **Layout**, sobald es einen
Zahlungsanbieter gibt. Kein Aufwand, kein Risiko.

### E. Der Aufhänger *„6 years… so viel deines Lebens verbringst du mit
Träumen"* (Screenshot 4)

Rechnerisch haltbar (rund zwei Stunden REM je Nacht über ein Leben) und
ein guter Satz. Solche Zahlen gehören in unser Onboarding — aber
nachgerechnet und mit Quelle, nicht abgeschrieben.

## 4. Was ich ausdrücklich NICHT kopieren würde

> ⚠ **RICHTIGSTELLUNG (Anton, 23.08., noch am selben Tag).** Die beiden
> ersten Absätze dieses Abschnitts stehen auf einem Lesefehler: Ich habe
> „meet your crush" und „talk with someone who passed away" als
> **Bildgenerierung aus hochgeladenen Fotos** gelesen. Es sind
> **Trauminhalt-Ziele** — man wählt aus, wovon man träumen will, und
> bekommt die Übungen dazu. Kein Upload, kein Video, keine fremde Person
> im Datensatz.
>
> Damit ist die Begründung hinfällig. Beide Themen sind erforscht und
> gehören zum Kern einer Klartraum-App; Träume von Verstorbenen gelten
> in der Trauerforschung (Continuing Bonds) überwiegend als hilfreich.
> Was bleibt, ist eine Sorgfaltspflicht in der Umsetzung, keine
> Ablehnung — ausgeführt in
> `2026-08-23-traumziele-und-einstiegspreis.md`.
>
> Ebenfalls hinfällig: mein Einwand in Abschnitt 1, die Gratis-Zusage im
> Sleep-Reiter binde uns. Die App ist nicht veröffentlicht.
>
> Die beiden Absätze bleiben stehen, statt gelöscht zu werden — sonst
> läse der Nächste eine Bewertung, ohne zu wissen, dass sie einmal falsch
> war und warum.

**„Learn how to meet your crush in a dream" / „Have a date with my crush"**
Bei ihnen ist das eine Illustration. Bei uns wäre es eine Aufforderung,
**das Foto einer realen Person hochzuladen, die davon nichts weiß**, und
daraus ein Video zu erzeugen. Genau davor steht Punkt 2 des Rechtsplans,
der noch offen ist (Upload-Zusicherung im AvatarDialog). Das ist keine
Geschmacksfrage — das ist die Funktion, mit der man diese App
missbrauchen würde.

**„Talk with someone who passed away"**
Dasselbe eine Stufe ernster. Wir erzeugen bewegte Bilder aus Fotos. Eine
App, die Trauernden anbietet, Verstorbene im Traum zu treffen, und die
technisch aus einem Foto einen Film macht, steht mit einem Bein in einem
Bereich, für den es Anwälte und Fachleute braucht — nicht einen Screenshot
als Vorlage. **Wenn wir das je anfassen, dann als eigenen Plan mit
Beratung, nicht als Kachel in einer Auswahl.**

**Erfolgsgeschichten mit Porträtfotos („Alexandra")**
Erfundene oder eingekaufte Testimonials. Wir haben echte Nutzer, sobald
wir starten. Bis dahin: keine.

**Der Zeitdruck-Rahmen („Actions for FAST results")**
Klartraum ist nicht schnell. Die Studie, auf der unser Leitfaden steht,
misst nach einer Woche 16,5 % — das ist ehrlich und immer noch gut.
„Schnelle Ergebnisse" zu versprechen wäre der eine Satz, der unseren
ganzen Evidenz-Ansatz entwertet.

## 5. Vorschlag für die Reihenfolge

1. **Dream Cues** — billigste Umsetzung, Infrastruktur steht, sofort baubar.
2. **Der persönliche Plan** — größter Bindungseffekt, rein lokal, kein Netz.
3. **Schlafgeschichte aus dem eigenen Tagebuch** — unser Alleinstellungs-
   merkmal, braucht einen DeepSeek- und einen TTS-Weg.
4. **Reality-Check-Erinnerungen** — erst nach Capacitor, und nur mit dem
   ehrlichen Satz daneben.
5. **Vergleichstabelle** — erst mit Zahlungsanbieter.

Punkte 1–3 sind reine Produktarbeit ohne neue Anbieter, ohne neue
Einwilligung, ohne laufende Kosten. Das ist genau die Sorte Mehrwert, die
den Preisdruck von der Bild- und Filmseite nimmt.
