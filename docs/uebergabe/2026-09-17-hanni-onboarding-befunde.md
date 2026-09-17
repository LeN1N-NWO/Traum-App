für: Hanni, H4nn40x

Hallo Hanni — Anton wollte das Onboarding nachgeschärft haben. Ich habe es am
17.09. im Simulator einmal komplett durchgetippt und acht Befunde gesammelt.
**Ich habe nichts davon geändert**, weil alles in Dateien liegt, die in deinem
offenen PR #51 stehen (`mobile/src/components/onboarding-flow.tsx`,
`src/i18n/de.js`, `src/i18n/en.js`). Antons Ansage: „Lass Hannis Zeug in Ruhe,
gib ihr die Befunde für ihren nächsten Start."

Nimm davon mit, was dir sinnvoll erscheint — Reihenfolge nach Dringlichkeit.
Wenn dir etwas davon zu viel ist, sag Bescheid, dann mache ich es nach deinem
Merge.

## Klare Fehler

1. **Alter Text „Bilder" statt „Filme".** Die Frage „Was führt dich her?" bietet
   „Sie zu Bildern machen" an. Bilder sind seit dem 12.09. aus dem Angebot.
   - `src/i18n/de.js:378` `create: "Sie zu Bildern machen"` → „Sie zu Filmen machen"
   - `src/i18n/en.js:422` `create: "Turning them into pictures"` → „Turning them into films"

2. **„Das bist du." steht doppelt.** Im Schritt „Wer bist du?" erscheint der Satz
   grün über den Knöpfen und grau darunter noch einmal als
   „Mit dem Foto bestätigst du: Das bist du."
   - Einer von beiden reicht. Vorschlag: den grünen als Bestätigung behalten,
     den grauen Hinweis nur zeigen, solange **kein** Foto gewählt ist.

3. **Platzhalter wird abgeschnitten.** Im Schritt „Kommt etwas immer wieder?"
   steht „Ein Ort, ein Mensch, ein Gefü…", weil das Feld neben dem Plus-Knopf
   zu schmal ist (`onboarding-flow.tsx:354–360`).
   - Entweder den Text kürzen (`formThemesPlaceholder`, `de.js:1236` /
     `en.js:1313`) oder das Feld über die ganze Breite und den Plus-Knopf
     darunter.

## Optik

4. **Kachel-Beschriftung auf hellem Clip.** Die Tusche-Kachel („Dann sieh ihn
   an") zeigt weiße Schrift auf fast weißem Bild. Der Textschatten
   (`onboarding-flow.tsx:755`) reicht dort nicht.
   - Vorschlag: unter die Beschriftung einen dunklen Verlauf legen
     (`tileLabel`, Zeile 754) statt den Schatten zu verstärken.

5. **Die Fragen sehen ungleich aus.** „Was führt dich her?" hat Auswahlkreise,
   die späteren Fragen („Wie oft erinnerst du dich", „Wie lange schläfst du",
   „Klarträumen", „Wie viel Zeit am Tag") haben keine. Eine Form für alle.

6. **Die drei Traumbegleiter passen nicht zusammen.** Der Frosch ist eine
   schwarz-weiße Strichzeichnung, das Faultier ein farbiges Bild, die Eule nur
   ein Symbol. Nur der Frosch ist wählbar und sieht am wenigsten fertig aus.
   - ⚠ Dazu: Ich habe den Frosch gewählt, auf der Startseite erscheint aber das
     Faultier. Die Wahl hat also keine sichtbare Folge. Das ist vielleicht so
     gewollt (der Frosch tippt nur auf den Erzeugen-Knopf, `mascot-tap.tsx`) —
     dann sollte der Schritt das sagen, sonst wirkt die Wahl wirkungslos.

7. **Letzter Schritt ist sehr leer.** Unter „Das war's" (`de.js:1183`) steht nur
   ein kleines Mondsymbol, darunter zwei Drittel Leerraum.
   - Vorschlag: den gewählten Begleiter zeigen, oder die drei Sätze, die ab
     jetzt gelten (aufnehmen, ansehen, behalten).

8. **Kleinigkeit am Jahre-Kreis** (`onboarding-flow.tsx:670–710`): Der grüne
   Traum-Bogen beginnt oben auf 12 Uhr und liegt vor dem orangen Schlaf-Bogen.
   Das liest sich wie „vor dem Schlaf" statt „ein Teil davon". Der grüne Bogen
   sollte innerhalb des orangen beginnen oder als dünner Ring darin liegen.

## Was gut ist (bitte nicht kaputt machen)

- Die Auszeichnungen passen jetzt auf den Schirm und sind klein (Zeile 208–213).
- Der Jahre-Kreis zeigt „25 Jahre SCHLAF" und darunter grün „6 Jahre TRÄUME" —
  genau Antons Wunsch vom 13.09.
- Die Erlaubnis-Zeilen für Mikrofon und Fotos schrumpfen nach der Freigabe auf
  „Erlaubt" mit grünem Haken. Beides im Simulator geprüft.
- Foto wählen läuft durch: Bibliothek, Zuschnitt, Bestätigung, rundes Bild.

## Wie ich getestet habe

Simulator iPhone 17 Pro, Entwicklungsbau mit Metro aus
`../Traum-App-anton`, Onboarding von „Los" bis „Heute Nacht anfangen"
durchgetippt (Name, Foto aus der Bibliothek, alle Fragen beantwortet,
Anmeldung mit „Später" übersprungen).

## Nachtrag 23:40 — zwei Textfunde aus dem Einwilligungs- und Systemteil

9. **Einwilligung nennt noch Bilder.** Das Tor „Before your first dream" sagt
   „turns your words and photos into images and films". Bilder gibt es seit dem
   12.09. nicht mehr (`consent`-Texte in `src/i18n/de.js` / `en.js`).
10. **Systemtexte sind nur englisch.** Der Mikrofon-Dialog zeigt auf einem
    deutschen Gerät den deutschen Titel von iOS und darunter unseren englischen
    Satz („Dream Rushes listens while you tell your dream."). Die
    Verwendungszwecke stehen in `mobile/app.json` (auch deine Datei) und
    brauchen `CFBundleLocalizations` bzw. `InfoPlist.strings` je Sprache.
