# Traumziele als Funktion — und die Frage nach dem 1-€-Einstieg

**Stand:** 2026-08-23 · Recherche und Empfehlung, **nichts gebaut**
**Anlass:** Antons Richtigstellung und zwei Fragen: Wie funktioniert das
Anpeilen eines konkreten Trauminhalts („jemanden treffen") wirklich, und
sollen wir einen Einstiegstarif für ~1 € anbieten, der nichts mit Credits
zu tun hat?

---

## 0. Zwei Fehler von mir, richtiggestellt

**1. Ich habe „talk to your crush" als Bildgenerierung gelesen.** Es ist
ein **Trauminhalt-Ziel**: Man wählt aus, wovon man träumen will, und die
App liefert die Übungen dazu. Kein Foto, kein Upload, kein Video. Damit
fällt mein Datenschutz-Einwand aus `2026-08-23-lucid-inhalte-dreamwithin.md`
§4 vollständig weg — er beantwortete eine Frage, die niemand gestellt hat.

**2. Ich habe mit einer Zusage argumentiert, die noch niemanden bindet.**
„Dreams cost credits. Sleep never will" steht in einer App, die nicht
veröffentlicht ist. Vor dem Start ist jede Formulierung frei.

Beides ändert die Bewertung: Das Thema ist **kein Minenfeld, sondern der
eigentliche Kern einer Klartraum-App** — und es ist gut erforscht.

## 1. Was die Forschung zum Anpeilen von Trauminhalten sagt

### Der Mechanismus: prospektives Gedächtnis

MILD (LaBerge) funktioniert über das **prospektive Gedächtnis** — die
Fähigkeit, sich vorzunehmen, später an etwas zu denken. Man ruft einen
Traum ab, erkennt darin ein Traumzeichen, stellt sich vor, darin luzide zu
werden, und wiederholt beim Einschlafen die Absicht.

Genau dieser Mechanismus trägt auch das **Anpeilen eines Inhalts**: Wer
sich vornimmt „heute Nacht sehe ich X", nutzt dieselbe Maschinerie. Die
Absicht ist nicht Beiwerk der Technik — sie IST die Technik.

Zahlen zur Einordnung (Aspy 2020, n=355, eine Woche): MILD wirkt an
**16,5 %** der Nächte. Im Labor mit WBTB kommen Studien auf bis zu **54 %**
der Teilnehmer. Wer innerhalb von fünf Minuten nach der Übung wieder
einschlief, hatte in **~46 %** der Versuche Erfolg — das
Wiedereinschlaftempo ist der stärkste Hebel, stärker als die Technikwahl.

### Der stärkere Fund: Targeted Dream Incubation (MIT Media Lab)

Das MIT Media Lab hat mit **Dormio** ein Verfahren gebaut, das
Trauminhalte gezielt setzt: Während der **Hypnagogie** — der fließenden
ersten Schlafphase, in der man Töne noch hört und verarbeitet — werden
Audio-Stichworte wiederholt eingespielt.

**92 %** der Teilnehmer bauten das vorgegebene Thema in mindestens einen
Traum ein; **40,6 %** der Weckungen enthielten es direkt.

Das ist eine ganz andere Größenordnung als alles, was die
Klartraum-Techniken schaffen — und es ist **genau das, was „Dream Cues"
sein könnte**, wenn man es richtig macht.

⚠ **Der Haken, und er ist wichtig:** Dormio ist ein Gerät am Handgelenk.
Es misst Herzschlag, Hautleitwert und Fingerbeugung, um den Moment der
Hypnagogie zu ERKENNEN, und spielt den Ton genau dann. **Ein Telefon auf
dem Nachttisch kann das nicht.** Wer die 92 % zitiert und ein
Timer-Feature baut, verkauft eine Zahl, die er nicht liefert.

**Was ein Telefon kann**, und das ist nicht wenig:
- Die Absicht **vor** dem Einschlafen sprechen lassen (das ist MILD, und
  das braucht keine Sensorik).
- Den Ton nach einer eingestellten Verzögerung spielen — eine grobe
  Schätzung der Hypnagogie statt einer Messung. Schwächer, aber ehrlich
  benennbar.
- Die Absicht **in der eigenen Stimme des Menschen** aufnehmen. Das ist
  näher an Dormio als jeder gekaufte Audiotrack, und wir haben die
  Aufnahmefunktion schon (Sprachrekorder für Träume).

### Verstorbene: ein erforschtes Feld, kein Tabu

Auch hier lag ich daneben. **Träume von Verstorbenen sind gut untersucht
und überwiegend hilfreich.** Die Mehrheit der Trauernden berichtet solche
Träume; die Forschung ordnet sie der **Continuing-Bonds-Theorie** zu — eine
fortbestehende Verbindung gilt heute als normaler Teil der Trauer, nicht
als deren Störung. Belegte Funktionen: Verarbeitung, Aufrechterhalten der
Bindung, Emotionsregulation.

⚠ **Eine Unterscheidung, die in der Literatur ausdrücklich vorkommt und
die in unsere Umsetzung gehört:** Es gibt **tröstliche und belastende**
Träume von Verstorbenen, und welche Sorte kommt, hängt mit Trauerverlauf
und Trauma zusammen. Ein Angebot dazu darf also kein „Triff X wieder"-Knopf
sein, sondern muss einen Ausstieg mitliefern — und darf niemandem
versprechen, wie sich das anfühlen wird.

## 2. Wie das bei uns hineinpasst — ohne neuen Unterbau

Der Fragebogen **fragt schon in die richtige Richtung**
(`OnboardingSurvey.jsx` sammelt `lucid` als Erfahrungsstufe, `goal`,
`themes`). Was fehlt, ist die eine Frage: **Wovon willst du träumen?**

Daraus folgt eine Kette, die ausschließlich aus vorhandenen Teilen besteht:

| Schritt | Was schon da ist |
|---|---|
| Ziel wählen | Fragebogen, `state.profile.goal` |
| Absichtssatz formulieren | DeepSeek (dieselbe Klasse wie Reflection) |
| Absicht abends sprechen | Gemini-TTS + gewählte Stimme |
| Absicht als Cue in der Nacht | Klangmischer + Einschlaf-Timer |
| Morgens: hat es geklappt? | Morgen-Check-in + Tagebuch |
| Muster über Wochen | Traumatlas, `recurrenceFor` |

**Das ist keine neue Funktion, das ist eine Verkettung.** Und sie hat
etwas, das DreamWithin strukturell nicht hat: Deren Ziele sind vier feste
Kacheln mit fertigen Audios. Unsere Absicht wäre **aus dem eigenen
Tagebuch geschrieben** — mit den eigenen Traumzeichen, den eigenen
wiederkehrenden Figuren, in der eigenen Stimme.

## 3. Die Preisfrage: 1 € pro Woche — oder gratis?

Antons Frage: ein erster Tarif ohne Credits, nur für den Klartraum-Teil.

### Die Rechnung

1 €/Woche = 52 €/Jahr. Nach 19 % MwSt. (÷1,19) bleiben 43,70 €, nach
15 % Apple **37,15 € je Abonnent und Jahr** — bei 30 % Store-Anteil nur
30,60 €. Zum Vergleich: Das Monatsabo bringt netto ~$85,70 im Jahr.
**Ein 1-€-Abonnent ist also gut ein Drittel eines Monatsabonnenten wert.**

Marktseitig ist ein billiger Einstieg gängig — mehrstufige Modelle mit
drei bis vier Ebenen sind 2026 Standard, und Freemium wandelt typisch bei
2–5 % um, dafür bei deutlich höherem Zulauf.

### Warum ich trotzdem dagegen bin — drei Gründe

**1. Der billige Anker steht neben dem echten Produkt.** Wer 1 €/Woche
sieht, liest die 4,99 €/Woche daneben als „fünfmal so teuer". Das ist
keine Verkaufsförderung, das ist eine Preisverankerung gegen uns selbst.
Kannibalisierung lässt sich vor dem Start nicht messen — aber die
Asymmetrie ist klar: **Ein billiger Tarif ist jederzeit nachrüstbar, aber
kaum je zurücknehmbar, ohne Leute zu verärgern.**

**2. Zwei Währungen brauchen eine Erklärung.** Heute ist die Geschichte
ein Satz: *Verstehen ist gratis, bezahlt wird das Sehen.* Mit einem
zweiten Abo, das Inhalte statt Credits gibt, braucht das Kaufblatt eine
Tabelle, um verständlich zu sein — und ein Kaufblatt, das man erklären
muss, verkauft schlechter.

**3. Das Verschenken IST die Waffe.** DreamWithins ganzes Geschäft ist
dieser Inhalt. Wenn wir ihn kostenlos geben, nehmen wir ihnen die
Existenzberechtigung — und verdienen an etwas, das sie technisch gar nicht
anbieten können. Das ist Antons eigene Linie: *anders sein, nicht besser.*
Ein Konkurrent kann einen Preis unterbieten; er kann nicht unterbieten,
was gratis ist.

### Der Vorschlag: gratis, aber nicht ertraglos

Der Klartraum-Teil bleibt **vollständig kostenlos** — er ist Trichter und
Unterscheidungsmerkmal in einem. Bezahlt wird weiter nur, **was uns
tatsächlich Geld kostet**, und zwar in der EINEN vorhandenen Währung:

- **Gratis:** Leitfaden, Techniken, Reality-Check-Erinnerungen, Zielwahl,
  Absichtssätze als Text, Checkliste, Klanglabor, Cues aus vorhandenen
  Klängen.
- **Credits:** die persönliche Absicht **als gesprochenes Audio** in der
  gewählten Stimme (TTS kostet), die **Schlafgeschichte aus dem eigenen
  Tagebuch** (DeepSeek + TTS), und wie bisher Bilder und Filme.

Das hält genau die Regel, die Anton für die Modellpreise aufgestellt hat:
**Bezahlt wird der Einkauf, nicht die Verknappung.** Ein Absichts-Audio
kostet uns Cent-Beträge — dann kostet es auch den Kunden Cent-Beträge, und
der Text dazu ist gratis, weil er uns nichts kostet.

⚠ Diese Empfehlung ist eine **Sequenz-Entscheidung, keine Glaubensfrage**:
Starten wir gratis und die Zahlen sagen später, dass ein 1-€-Tarif fehlt,
können wir ihn jederzeit nachlegen. Umgekehrt geht es nicht.

## 4. Was zuerst zu tun wäre

1. **Eine Frage in den Fragebogen:** „Wovon willst du träumen?" mit
   Freitext plus ein paar Vorschlägen. Rein lokal, kein Netz. Die
   Antworten sind ab Tag eins die Grundlage für alles Weitere.
2. **Absichtssatz aus dem Ziel** (DeepSeek, gratis, Textklasse) — mit den
   eigenen Traumzeichen aus dem Atlas darin.
3. **Cue-Wiedergabe** auf dem vorhandenen Klangmischer, mit ehrlicher
   Beschriftung: Verzögerung ist eine Schätzung, keine Messung.
4. **Reality-Check-Erinnerungen** nach der Xcode-Portierung.
5. **Verstorbene** als eigener, vorsichtiger Schritt — mit dem Wissen aus
   §1, einem Ausstieg und ohne Versprechen, wie es sich anfühlen wird.

Die Punkte 1–3 kosten keine laufenden Kosten, brauchen keinen neuen
Anbieter und keine neue Einwilligung.
