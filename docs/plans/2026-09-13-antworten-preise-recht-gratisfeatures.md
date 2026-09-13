# Antons neun Punkte — Antworten, Rechnung, was gebaut ist

Stand 13.09.2026 abends · Antwort auf Antons Rückmeldung zu
`2026-09-13-warum-die-app-scheitern-kann.md`. Gebaut in Commit `8777b8b`
(Branch `session/2026-09-13-anton-d`, PR #49).

Die Recherchen dahinter liegen daneben, mit Quellen und Lesedatum:
`2026-09-13-recherche-anbieter-recht.md` (Preise, fal gegen Replicate,
Apple) und `2026-09-13-recherche-expo-erinnerungen-healthkit-widgets.md`.

## 1. Gewohnheit — was jetzt gebaut ist

| Was | Wo | Stand |
|---|---|---|
| **Rekorder zuerst** | Traum-Tab: Öffnen = Aufnahme läuft. Ein Tipp stoppt, dann anhören, dann „Aufschreiben", dann „Weiter erzählen" / „Neu schreiben" / tippen | im Simulator geprüft (Autostart, Stopp beim Tab-Wechsel, Anhören mit Dauer) |
| **Morgens direkt aufnehmen** | App zwischen 3 und 11 Uhr geöffnet, heute nichts eingetragen → Rekorder, einmal je Tag. Schalter unter Einstellungen → Erinnerungen, Vorgabe AN | Logik getestet; das Öffnen am Morgen ist ungeprüft (Uhrzeit) |
| **Erinnerung morgens** | „Was hast du geträumt?" → Tipp öffnet den Rekorder, der sofort aufnimmt | geplant und verdrahtet; ⚠ Zustellung ungeprüft — der Erlaubnis-Dialog braucht einen Finger |
| **Erinnerung abends** | „Zeit zum Runterkommen" → Schlaf-Tab | wie oben |
| **Realitätschecks** | 1–4× am Tag zwischen 10 und 20 Uhr, jeden Tag andere Zeiten; Schalter im Luzid-Guide und in den Einstellungen | wie oben |
| **Frage auf der Startseite** | „Soll ich dich morgens erinnern?" — ein Tipp schaltet 7:30 an | im Simulator gesehen |
| Serie, Check-in | gab es schon | — |

Nur **lokale** Benachrichtigungen (expo-notifications, Pods + Rebuild,
bewusst ohne `expo prebuild`: das Plugin trüge das Push-Entitlement ein,
das ohne bezahltes Apple-Konto nicht signierbar ist).

## 2. „Erstattungsregel" — gestrichen

Gemeint war ein Kulanz-Versprechen („Nicht dein Traum? Der nächste
Versuch ist frei"). Anton hat recht: Ist der Film gestartet, haben wir fal
bezahlt; ein Gratis-Versuch wäre Geld, das wir verschenken. **Die Regel ist
jetzt die einzige, die wirtschaftlich stimmt, und sie steht so in den
Nutzungsbedingungen:** Ein gestarteter Film verbraucht seine Credits; nur
wenn das Rendering technisch scheitert (fal berechnet dann auch nichts),
kommen sie zurück.

⚠ Widerspruch im Bestand: Der Web-Text `wizard.step6.renderFailed` sagt
„Deine Credits wurden für den Versuch verwendet". Das passt nicht zu den
Bedingungen. Klären, sobald der Server abbucht (Hannis Übergabe).

## 3. „Draufzahlen" — und die neue Preisliste

Anton hat recht: Ein Guthaben ist eine Obergrenze, mehr als die Credits
kann niemand verbrauchen. „Draufzahlen" war schief formuliert. Gemeint
war: **Bei manchen Plänen deckt der Credit nach MwSt. und Apple-Anteil
kaum noch den Einkauf** (Jahresabo bei 30 % Store: 1,4×), und die
Willkommens-Credits fallen je Installation an, nicht je Kunde.

Seit die Bilder weg sind, rechnet jemand in Filmen. Deshalb ist die
Messlatte jetzt **ein 15-s-H3-Film in Standardqualität (480P) = 31 Credits,
$0,78 Einkauf** (Preise am 13.09. auf fal nachgelesen, unverändert).

### Die Liste (im Code: `src/lib/plans.js`, Tests: `plans.test.js`)

| Plan | Preis | Credits | je Credit | Filme à 15 s | Marge¹ 15 % Store | 30 % Store |
|---|---|---|---|---|---|---|
| **Monat** | 9,99 | 160 | 0,062 | **5** | 1,58× | 1,30× |
| Jahr | 99,99 | 160/Monat | 0,052 (−17 %) | 61 | 1,32× (bei 75 % Verbrauch 1,76×) | 1,08× |
| ~~Woche~~ | gestrichen | | | | | |
| Paket S | 4,99 | 50 | 0,100 | 1 | 2,5× | 2,1× |
| Paket M | 12,99 | 150 | 0,087 | 4 | 2,2× | 1,8× |
| Paket L | 24,99 | 320 | 0,078 | 10 | 2,0× | 1,6× |
| Paket XL | 49,99 | 700 | 0,071 | 22 | 1,8× | 1,5× |

¹ Netto nach 19 % MwSt. und Store-Anteil geteilt durch den schlimmsten
Einkauf, wenn jeder Credit verbraucht wird. Schlimmster Einkauf je Credit
ist ein Bild ($0,0283, Charakterbögen); ist alles H3-Film, liegt der Monat
bei 1,79×. Die Zahlen gelten für €9,99 und $9,99 gleich — beide sind
dieselbe App-Store-Preisstufe, und der Euro ist mehr wert als der Dollar,
in dem wir einkaufen.

**Warum die Woche weg ist:** 25 Credits für $4,99 reichten nicht für
einen einzigen 15-s-Film. Das Abo versprach, was es nicht halten konnte.

**Warum XL:** Ein 30-s-Seedance-Film (241 / 511 Credits) war vorher mit
keinem Einzelkauf erreichbar.

**Was die Rechnung verlangt:**
- **Small Business Program (15 %) bleibt Pflicht.** Bei 30 % trägt das
  Jahresabo im schlimmsten Fall nur 1,08×.
- Pakete sind je Credit immer teurer als das Abo — die Staffel S→XL gibt
  Rabatt, aber nie unter den Abo-Preis.
- Wer die Standardqualität auf „Scharf" (768P, 46 Credits) stellt,
  bekommt mit dem Monat drei statt fünf Filme. Die Paywall sagt „Filme à
  15 s" und rechnet in Standard.
- `node scripts/preis-durchreichen.mjs` rechnet alles nach (§7 zeigt die
  neue Leiter).

**Nicht entschieden, nur vorbereitet:** Wird Seedance über einen günstigeren
Weg bezogen (siehe §5), halbiert sich dort der Einkauf. Nach Antons Regel
vom 20.08. verbreitert das die Marge; ob es den Kundenpreis senkt, ist
seine Entscheidung.

## 4. Die Bibliothek als Kern — gebaut

- **Im Profil ganz oben unter dem Gesicht:** „Deine Besetzung" mit vier
  Kacheln — Personen, Tiere, Orte, **Dinge** — mit Zahl und Gesichtern,
  ein Tipp öffnet die Liste. Die Liste zeigt alle vier Gattungen immer,
  eine leere mit „… hinzufügen".
- **Neue Gattung „Ding"** (Requisite: der Brief, das Auto, der
  Fernsehturm) durch die ganze Kette: Analyse liefert höchstens drei
  `objects`, Besetzungs-Schritt, Avatar-Dialog, Server-Prompts, Regie
  (Referenz-Rang Personen → Tiere → Dinge → Orte). Das ist Punkt D aus
  Regie v2. ⚠ Ein Ding mit Foto bekommt noch keinen neutralen Bogen wie
  eine Person; das Foto geht roh hinein.

## 5. Replicate oder fal — was rechtlich besser ist

**Bestand:** Alles läuft heute über **fal** — H3, Seedance 2.5,
Transkription (Wizper) und die Bilder für Charakterbögen. Replicate ist
**nicht** eingebaut; Antons Entscheidung vom 11.09. („Seedance über
Replicate") ist noch offen.

**Rechtlich ist fal heute der sicherere Weg** (kein Rechtsrat):
1. fal hat einen **öffentlichen Auftragsverarbeitungsvertrag**, automatisch
   Teil der Bedingungen, mit EU-Standardvertragsklauseln. Bei Replicate
   gibt es keinen öffentlichen — vermutlich nur per Enterprise-Vertrag.
   Ohne AVV fehlt uns eine Pflichtgrundlage nach Art. 28 DSGVO.
2. fal sagt vertraglich, dass Daten an den Modellhersteller gehen, und
   markiert H3 und Seedance als „Partner". Replicate nennt ByteDance nicht
   als Unterauftragsverarbeiter.
3. fal sagt schriftlich zu, nicht auf Kundendaten zu trainieren.

Replicates Stärke: API-Eingaben und -Ergebnisse sind nach einer Stunde
gelöscht (fal: 30 Tage, abschaltbar per Header `X-Fal-Store-IO: 0` —
**sollten wir setzen**).

⚠⚠ **Der wichtigste Fund:** ByteDance schreibt am 13.09., dass Seedance 2.5
**keine Referenzbilder mit echten menschlichen Gesichtern** annimmt, außer
über eine Verifizierung der abgebildeten Person. Ob fal oder Replicate
diesen Filter anders einstellen, ist ungeprüft. **Vor jedem Wechsel ein
Testauftrag mit einem echten Besetzungsfoto** — sonst sparen wir die
Hälfte an einem Modell, das unsere Besetzung ablehnt.

Replicate ist erst vertretbar, wenn vier Dinge stehen: unterschriebener
AVV, schriftlich, wohin Seedance-Daten fließen, eine Klausel zu
Endkunden-Apps geklärt (§2.7(c)(iii)), und der Gesichtstest besteht.

## 6. Einwilligung je Foto — gebaut

Anton: „Wir müssen dem User die Verantwortung geben … warum sollten wir
das anders behandeln als Higgsfield oder Runway?" Richtig — und genau so
machen es alle: Die Verantwortung steht in den Bedingungen. Wir gehen einen
Schritt weiter, weil es billig ist und uns schützt:

- **Avatar-Dialog:** Sobald ein Foto drin ist, steht ein Haken, ohne den
  nicht gespeichert wird. Person: „Ich darf dieses Foto verwenden: Die
  Person darauf hat zugestimmt." Selbst: „Das bin ich auf dem Foto."
  Darunter klein: keine Prominenten, keine Kinder ohne Erlaubnis der
  Eltern, niemand ohne Zustimmung, Verantwortung liegt beim Hochladenden.
- **Gespeichert** wird Zeitpunkt und ein Fingerabdruck der Fotos — ein
  neues Foto braucht einen neuen Haken. Ein aus der Beschreibung
  gezeichnetes Bild braucht keinen (es zeigt niemanden Echtes).
- **Onboarding** („Wer bist du?"): ein Satz unter den Knöpfen, die Wahl
  ist die Bestätigung.
- **Nutzungsbedingungen** geschärft (Bestätigung je Foto, Prominente,
  Minderjährige, Freistellung) → Einwilligungs-Version 3, das Tor kommt
  einmal neu.

Recherche-Befund: Bei keinem der sechs großen Anbieter war eine Pflicht-
Checkbox je Upload belegbar — sie haben es in den AGB. Unser Haken liegt
darüber. Apple verlangt zusätzlich (5.1.2(i)): vor dem ersten Senden
**namentlich** sagen, an wen Fotos gehen, und ausdrücklich zustimmen lassen.
Das Einwilligungs-Tor tut das; vor dem Store-Start mit dem Anwalt prüfen.
fal verlangt 18+ — das dritte Häkchen im Tor deckt es ab.

## 7. Wartezeit — die Belohnung, gebaut

Nach „Erzeugen" statt Faultier und wechselnden Sätzen: **Konfetti, ein
Stern, „Wow — dein erster Traumfilm!"** (ab dem zweiten „Traum Nr. N ist
unterwegs"), „Du musst nicht warten — im Journal siehst du, wann er fertig
ist." Mindestens 2,8 Sekunden sichtbar, dann ins Journal. Eigene
Reanimated-Animation, keine neue native Abhängigkeit.

## 8. Ein Mensch, eine Kette — Backup

Git ist gesichert, zwei Menschen kennen die App. Was heute noch an
**einem Mac** hängt, in der Reihenfolge des Risikos:

1. **Die Schlüssel** (`.env` mit FAL/DeepSeek/Supabase) liegen nur bei
   Anton. → Gemeinsamer 1Password-Tresor „Dream Rushes" für Anton und
   Hanni. Zehn Minuten.
2. **`media/`** (886 MB: bezahlte Filme, Aufnahmen, Aufträge) hat keine
   Kopie. → Nächtlich auf einen Speicher außerhalb des Macs
   (Cloudflare R2 oder Backblaze B2 per `rclone sync`, ein paar Cent im
   Monat), oder mindestens Time Machine. Später ersetzt Supabase Storage
   den Ordner.
3. **Der Server** läuft auf Antons Rechner. → Gehört ohnehin vor TestFlight
   auf einen Host in der EU (Hetzner, Fly.io Frankfurt) — mit TLS, das
   Hannis Befund S6 verlangt.
4. **Das Journal der Nutzer** liegt nur auf ihrem Gerät. → Hannis
   `POST /api/dreams/sync` existiert; sobald die Anmeldung live ist, hängt
   es daran.
5. **Ein Notfall-Blatt** (`docs/NOTFALL.md`): wo die Schlüssel sind, wie
   Server und App gebaut werden, wer welche Konten hat. STAND und WORKLOG
   decken das Tagesgeschäft schon ab.

## 9. Sprache

Vorgemerkt: Die Sammelübersetzung der fünf weiteren Sprachen kommt, wenn
alles sitzt (Regel in AGENTS.md). `scripts/check-i18n-shape.mjs` zählt
heute 177 fehlende Schlüssel je Sprache — das ist die Arbeitsliste.

## 10. Gratis-Features — wohin sie kommen

| Feature | Platz in der App | Stand | Aufwand |
|---|---|---|---|
| Erinnerungen, Realitätschecks, Morgens-Rekorder | Einstellungen → Erinnerungen; Karte auf Home; Luzid-Guide | **gebaut** | — |
| **Atmen (4-7-8)** | Schlaf-Tab, erster Raum: Kreis wächst, hält, sinkt; Haptik je Wechsel; vier Runden | **gebaut**, Oberfläche geprüft, Ablauf ungetippt | — |
| **Schlaf aus HealthKit** | Home: Check-in-Karte zeigt „7 h 20" vorbelegt; Mond-Streifen und Kalender färben Nächte ohne Traum; Atlas „Schlaf und Träume" | Plan | ~1 Tag + Rebuild. Bibliothek `@kingstinct/react-native-healthkit`; ⚠ Nitro-Module können mit dem vorkompilierten RN-Kern kollidieren; auf einem echten Gerät braucht es die HealthKit-Berechtigung am Apple-Konto |
| **Widget** (Home + Sperrbildschirm) | Mondphase der Nacht, Serie, Knopf „Traum aufnehmen" → öffnet den Rekorder, der sofort läuft — die Aufnahme ist dann EIN Tipp vom Sperrbildschirm | Plan | ~1 Tag. `expo-widgets` (seit SDK 56 stabil), braucht `prebuild` und eine App Group |
| **Teilen-Karte** | Traumseite, Menü „Als Karte teilen": Titel, Mond, Stil-Standbild, ein Satz, Absender | Plan | ½ Tag, braucht ein Bild-aus-Ansicht-Modul (Rebuild) |
| **Schnellaktion am App-Symbol** | lange drücken → „Traum aufnehmen" | Plan | 2 Stunden, `expo-quick-actions` |
| Atmen in der Checkliste | der Punkt „4-7-8" öffnet den Atem-Raum | Plan | 30 Minuten |

**Reihenfolge:** Widget zuerst — es ist die Erinnerung ohne Erlaubnis und
der kürzeste Weg zum Rekorder. Dann HealthKit, dann Teilen-Karte.

## 11. Die Besetzung im Text (Hannis Idee) — gebaut

Im Besetzungs-Schritt steht oben der Traumtext. Menschen leuchten blau,
Orte warm, Dinge cyan; noch nicht Zugeordnetes ist gepunktet unterstrichen,
Zugeordnetes trägt sein `@tag`. **Tipp auf ein Markiertes** → „Wer ist
das?": KI erfindet, ein Gesicht aus der Bibliothek, neu mit Foto, oder
„Nicht Teil der Besetzung". **Tipp auf ein anderes Wort** → „Zur Besetzung
hinzufügen" mit dem Wort vorbelegt, Gattung wählen. Mehrwortnamen („fremde
Frau") und gebeugte Formen („Arztes") werden gefunden; „ich" leuchtet nur
beim ersten Mal. Im Simulator mit einem Beispieltraum geprüft; die beiden
Blätter sind ungetippt.
