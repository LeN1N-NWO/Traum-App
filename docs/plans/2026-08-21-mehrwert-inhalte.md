# Mehrwert-Inhalte — was andere Traum-Apps können, und was davon zu uns soll

**Stand:** 2026-08-21 · Anlass: Antons Auftrag („es gibt genug andere
Traum-Apps, die Traumdeutung machen und bla bla — ich brauche einen Plan
für Sachen, die Mehrwert bringen; was andere machen, will ich auch haben")
**Status (22.08.2026): P1 und P2a/P2b sind gebaut, der Rest ist Plan.**

| Punkt | Stand | Wo |
|---|---|---|
| P1a Reflection | gebaut | Traum-Detail, `reflect` in api.js |
| P1b Traumatlas | gebaut (ohne Monats-Collage) | `screens/Journal/Atlas.jsx` |
| P2a Morgen-Check-in | gebaut | `MorningCheckin.jsx` + Schlaf-Kachel im Atlas · ⚠ nur EINE Frage, siehe unten |
| P2b Wiederkehr | gebaut | `components/Recurrence.jsx` im Traum-Detail |
| P2c Luzid-Werkzeuge | offen | Traumzeichen-Karten kosten 1 Credit — Antons Wort fehlt |
| P3a Albtraum umschreiben | offen | Wortlaut erst mit dem Rechtsplan abstimmen |
| P3b Einschlaf-Timer | gebaut (Presets offen) | Schlaf → Klänge, `soundMixer.js` |

## 1. Das Marktbild (recherchiert 21.08.)

Die erfolgreichen Traum-/Schlaf-Apps 2026 bauen alle auf denselben sechs
Säulen:

| Säule | Wer es gut macht | Haben wir? |
|---|---|---|
| Traumtagebuch (Diktat, Suche) | alle | ✅ stark (Diktat, Stimm-Interview) |
| **KI-Traumdeutung** | DreamApp, Dreamly, DreamStream | ❌ **die größte Lücke** |
| **Muster/Statistiken** (Symbole, Personen, Stimmungen über Zeit) | Oniri, Dreamly | ⚠ halb (castStats zählt nur Personen) |
| Luzides Träumen (Reality-Checks, Traumzeichen) | Oniri, Awoken | ⚠ Leitfaden ja, Werkzeuge nein |
| Einschlafen (Sounds, Stories, Routinen) | BetterSleep (300+ Sounds, $60/Jahr!), Calm | ✅ Mixer + Checkliste, gratis |
| Schlaf-Tracking/Schnarchen | Sleep Cycle, BetterSleep | ❌ bewusst nicht (§5) |

**Unser Unterschied, den KEINER hat:** Bei uns wird der Traum SICHTBAR
(Bilder, Filme, echte Gesichter). Jede neue Funktion unten ist so
geschnitten, dass sie in diesen Kreislauf einzahlt — Deutung führt zum
Bild, Rückblick zur Collage, Albtraum-Arbeit zum neuen Ende als Film.
Features, die diesen Kreislauf nicht füttern, sind Ballast (§5).

## 2. Die Prioritätenliste

### P1a · „Was will mir das sagen?" — die KI-Deutung je Traum

Der Kern jeder Konkurrenz-App, und für uns fast gratis: Analyse, Beats,
Stimmung, Symbole liegen SCHON am Eintrag; ein DeepSeek-Aufruf kostet
$0,00026. Ein Abschnitt im Traum-Detail (unter der Kino-Strecke):
**„Reflection"** — drei kurze Absätze: was auffällt (Symbole/Emotionen),
eine mögliche Lesart, eine Frage an den Träumer zurück.

Die Haltung unterscheidet uns vom „Lexikon-Deuter" der Konkurrenz
(deren größte Schwäche laut Markt: generische Wörterbuch-Deutungen):
- **Spiegel, nicht Orakel.** Formulierungen als Angebot („könnte", „viele
  erleben"), nie als Wahrheit. Der Regelblock verbietet: medizinische/
  psychologische Diagnosen, Zukunftsdeutung, Universalsymbolik.
- **Kontext aus dem eigenen Journal**, nicht aus dem Lexikon: „Der Zug
  taucht zum dritten Mal diesen Monat auf" schlägt jede
  Wörterbuch-Definition. (Lokal berechnet, ADR-0001-konform.)
- Preis: gratis (wie alle Textarbeit). Aufwand: 1 Endpunkt-Modus +
  Detail-Abschnitt + 7 Sprachen.

### P1b · Der Traumatlas — Muster und Statistiken

Die App speichert längst mehr, als sie zeigt (das dreimal bestätigte
Muster): `analysis.symbols`, `mood`, `people`, `style`, Datum, Serie.
Ein eigener Bereich (Journal → „Atlas" neben der Besetzung):
- **Wiederkehrende Symbole** (Top-Liste mit Häufigkeit, antippbar → die
  Träume dazu), **Stimmungs-Verlauf** über die Wochen, **Traumhäufigkeit**
  (Kalender-Hitzekarte existiert als DreamCalendar schon).
- **Der Monatsrückblick:** eine generierte Karte „Dein Traum-Monat"
  (Top-Symbol, Stimmung, Besetzung des Monats) — teilbar, und der
  bezahlte Anschluss liegt nahe: „Mach aus deinem Monat eine Collage"
  (1 Credit, unser Bildpfad). Rein lokale Rechnung, null API-Kosten.

### P2a · Morgen-Check-in (zwei Taps)

Beim Öffnen nach einer Nacht: „Wie hast du geschlafen?" (3 Gesichter) +
„Stimmung des Traums?" — zwei Taps, keine Pflicht. Füttert den Atlas
(Stimmung × Schlafqualität ist die interessanteste Korrelation) und gibt
der Serie einen zweiten Grund. Lokal, gratis, klein.

> **Gebaut am 22.08. — mit einer Abweichung:** Es ist EIN Tap, nicht zwei.
> Die zweite Frage („Stimmung des Traums?") entfällt, weil die Analyse
> `analysis.mood` ohnehin für jeden Traum liefert und die Frage morgens ins
> Leere geht, solange noch kein Traum eingetragen ist (Antons Entscheidung
> 21.08.). Die Korrelation entsteht trotzdem — `sleepByMood()` holt die
> Stimmung aus der Analyse. Zu sehen: Startseite morgens (Karte) und
> Traumatlas (Kachel „Schlaf": Schnitt, Anzahl der Nächte, Stimmung je
> Schlafstufe).

### P2b · „Du träumst wieder von …" — Wiederkehr-Erkennung

Beim Speichern eines neuen Traums vergleicht die App Symbole/Personen
mit dem Bestand (lokaler Index über die vorhandenen Analysen — KEIN
externes Gedächtnis, ADR-0001 bleibt): „Der Aufzug taucht zum vierten
Mal auf — hier sind die anderen drei." Das ist Oniris stärkstes Feature,
und wir haben die Daten schon strukturiert.

> **Gebaut am 22.08.** — als ruhiger Block im Traum-Detail (zwischen
> Besetzung und Reflection), nicht als Meldung beim Speichern: Der
> Augenblick nach dem Aufschreiben gehört dem Traum, nicht der Statistik.
> Marken antippen öffnet die anderen Träume.
>
> ⚠ Der Wortlaut heißt „weitere Träume", nicht „frühere": `recurrenceFor()`
> zählt alle anderen Träume, und wer einen alten Eintrag aufschlägt, bekommt
> auch neuere mitgezählt.

### P2c · Luzid-Werkzeuge (der Ausbau des Leitfadens)

- **Traumzeichen aus dem EIGENEN Journal:** die Top-Symbole aus dem Atlas
  SIND die persönlichen Reality-Check-Trigger — kein Konkurrent kann
  das mit generierten Bildern der eigenen Traumzeichen unterlegen. Wir
  schon (1 Credit je Zeichen-Karte, optional).
- Reality-Check-Erinnerungen und Wake-Back-to-Bed-Wecker: brauchen
  Push/Capacitor → hängt am Capacitor-Schritt, nicht vorziehen.

### P3a · Albtraum-Arbeit: „Schreib das Ende um"

Angelehnt an Imagery Rehearsal (Standardtechnik der Albtraum-Therapie,
bewusst OHNE Therapie-Anspruch formuliert): Bei einem als belastend
markierten Traum bietet die App an, mit der KI **ein neues Ende zu
schreiben** — und dann unser Alleinstellungsmerkmal: **das neue Ende als
Bild/Film zu rendern.** Kein Wettbewerber kann den umgeschriebenen
Albtraum SICHTBAR machen. Text gratis, Rendern zum normalen Preis.
Sorgfalt: Formulierungen mit dem Rechtsplan abstimmen (keine
Heilversprechen); bei Gewalt-/Trauma-Inhalten zurückhaltend bleiben.

### P3b · Einschlafen schärfen (klein halten)

Der Mixer ist gut und GRATIS — gegen BetterSleeps $60/Jahr ist das
selbst ein Verkaufsargument („bei uns kostet das Einschlafen nichts,
Credits kosten nur Bilder"). Klein nachlegen: Einschlaf-Timer (Ausblenden
nach n Minuten), 2–3 Presets („Regennacht", „Zugfahrt") — mehr nicht;
keine 300-Sounds-Bibliothek, keine eingekauften Sleep Stories.

> **Timer gebaut am 22.08.** — „Ausblenden nach": Aus · 15 · 30 · 60 Min,
> Ausblenden über eine Minute. Still wird nur der Klang, die gespeicherte
> Mischung bleibt. Gezählt wird ab der letzten Berührung.
>
> **Presets offen** — und dafür fehlt eine Zutat: „Regennacht" und
> „Zugfahrt" sind KEINE Rauschfarben. Der Mixer erzeugt drei Rauschen
> synthetisch (`noise.js`), Regen und Zug wären Audiodateien, die jemand
> lizenzieren und ausliefern muss (Größe, Rechte, App-Store-Gewicht).
> Solange das nicht entschieden ist, wären „Presets" nur drei
> Regler-Voreinstellungen mit hübschen Namen — das verspricht mehr, als
> es hält. Antons Wort nötig.

## 3. Reihenfolge und Aufwand

| # | Feature | API-Kosten | Aufwand | hängt an |
|---|---|---|---|---|
| 1 | Deutung „Reflection" | ~$0 (DeepSeek) | mittel | nichts |
| 2 | Traumatlas + Monatsrückblick | 0 (lokal) | mittel | nichts |
| 3 | Morgen-Check-in | 0 | klein | nichts |
| 4 | Wiederkehr-Erkennung | 0 | klein | Atlas-Index |
| 5 | Traumzeichen-Karten (Luzid) | 1 Cr je Karte, optional | klein | Atlas |
| 6 | Albtraum-Umschreiben + Rendern | ~$0 Text / Credits fürs Bild | mittel | Rechtsplan-Wortlaut |
| 7 | Einschlaf-Timer + Presets | 0 | klein | nichts |
| — | Reality-Check-Push, WBTB | 0 | mittel | Capacitor/Push |

1–4 sind der eigentliche Sprung: Sie machen aus dem Journal ein
Gedächtnis mit Meinung, komplett lokal + DeepSeek, ohne einen Cent
laufende Kosten — und jede davon endet mit einem natürlichen Anschluss
an den bezahlten Bildpfad.

## 4. Preislinie

Alles Obige ist GRATIS (wie Sleep heute): Textarbeit kostet uns nichts,
und der Gratis-Teil ist unser Conversion-Motor — bezahlt wird bei uns
das SEHEN (Bilder, Filme, Collagen, Zeichen-Karten), nie das Verstehen.
Das ist zugleich die ehrliche Antwort auf BetterSleep/Calm, deren
Bezahlschranke vor den Grundfunktionen die häufigste Nutzerklage ist.

## 5. Was wir bewusst NICHT bauen

- **Schlaf-Tracking, Schnarch-Aufnahme, Smart-Alarm** — Sensorik-Land,
  batterie- und datenschutzlastig, überbesetzter Markt (Sleep Cycle),
  und es füttert unseren Kreislauf nicht. Ein Mikro, das nachts
  aufnimmt, wäre zudem ein neues Datenschutz-Kapitel.
- **Therapeuten-Vermittlung** (DreamApp) — Regulatorik ohne Ende.
- **Horoskop-Ausbau** — zodiac.js bleibt die Nettigkeit, die es ist;
  mehr Esoterik verwässert die Marke „deine Träume, sichtbar gemacht".
- **Eingekaufte Inhalte-Bibliotheken** (Sleep Stories, 300 Sounds) —
  Content-Lizenzkosten ohne Bezug zum Kreislauf.

## 6. Quellen (21.08.2026)

- dreamstream.art/blog/best-dream-apps-2026 · dreamly-app.com/best-dream-
  interpretation-apps-2026 · dreamz-journal.com (2 Artikel) ·
  individuate.me/articles/dream-journal-app-with-ai-interpretation ·
  noctalia.app/en/dream-journal-apps (Markt Traum-Apps)
- bettersleep.com (Vergleiche vs. Calm/Sleep Cycle, Preise) ·
  sleepfoundation.org/best-sleep-apps (Markt Schlaf-Apps)
