# Drei Maskottchen zur Auswahl — Vormerkung

**Stand:** 2026-08-25 · Anlass: Antons Ansage beim Einbau des
Tipp-Einspielers — „Es wird drei verschiedene Maskottchen geben, und der
User kann die auswählen … diese Maskottchen ändern ALLE Maskottchen über
die ganze App."
**Status: VORGEMERKT. Die Tabelle steht, die Auswahl nicht.**

## Was heute schon dafür gebaut ist

`src/lib/mascots.js` ist die Tabelle. Ein Maskottchen ist eine Zeile mit
Ruhe-Video, Poster und Tipp-Animation. Niemand importiert eine
Maskottchen-Datei mehr direkt: `Mascot.jsx` und `ButtonTapOverlay.jsx`
fragen beide `mascot(state)`.

Damit ist der Wechsel auf drei kein Umbau, sondern zwei Zeilen mehr in der
Tabelle plus die Auswahl.

## ⚠ Was der Nächste wissen muss

**Der Tipp-Anker gehört zur Datei, nicht zur App.** Jede Animation trifft
den Knopf an einer anderen Stelle IHRES Bildes. Beim Frosch bei 14,5 %
Breite und 78 % Höhe, über alle 145 Einzelbilder gemessen. Stünde diese
Zahl im Bauteil statt in der Tabelle, tippte das zweite Maskottchen
daneben — **und zwar lautlos.** Ein Maskottchen, das ins Leere greift,
wirft keine Fehlermeldung und bricht keinen Test.

So wird er gemessen, ohne zu raten: Alphamaske über alle Einzelbilder,
den Moment mit der größten Deckung im unteren Bilddrittel suchen (das ist
der Funke), dessen Schwerpunkt nehmen. Beim Frosch: Sekunde 3,0 von 6,04.

**`scale` ist Geometrie, kein Geschmack.** Der Anker sitzt links unten im
Bild, der Knopf in der Bildschirmmitte — formatfüllend gelegt schiebt das
Verankern den Kopf aus dem Bild. 0,65 ist der gegengerenderte Wert für den
Frosch; 0,85 ist abgeschnitten. Jede neue Zeichnung braucht ihren eigenen
Wert. Die Werkbank (StartMenu → „Mascot test bench") hat dafür einen
Regler.

**Zwei Wege zur Transparenz, beide richtig.** Das Ruhe-Video ist weiße
Kreide auf gemessenem Reinschwarz und wird per `mix-blend-mode: screen`
freigestellt — null Bytes extra, geht aber NUR auf dunklem Grund. Der
Tipp-Einspieler liegt über einem hellen Knopf und braucht deshalb echtes
Alpha (`alpha-packen.mjs`, 23 MB → 579 KB). Wer ein neues Maskottchen
bringt, entscheidet das pro Clip, nicht pro Maskottchen.

## Was noch fehlt

1. **`state.mascot`** — heute liest `mascot()` das Feld schon, es schreibt
   nur niemand. Gehört in den Zustand wie `state.language`, nicht in einen
   eigenen Speicher.
2. **Die Auswahl** — wohin? Profil ist der naheliegende Ort. Im Onboarding
   wäre sie eine Entscheidung zu früh, bevor jemand weiß, was ein
   Maskottchen hier überhaupt tut.
3. **Zwei weitere Zeichnungen**, jeweils als Paar: Ruhe-Clip und
   Tipp-Clip. Ohne Tipp-Clip fällt das Maskottchen am Erzeugen-Knopf aus,
   und dann ist die Auswahl an genau der Stelle folgenlos, an der sie am
   meisten auffällt.
4. **Vorschau in der Auswahl** — ein Standbild reicht nicht, das Ruhige
   ist die halbe Persönlichkeit. Der Ruhe-Clip ist klein genug.

## Was NICHT gebraucht wird

Keine Auswahl mit einem Eintrag. Solange die Tabelle einzeilig ist, zeigt
die Werkbank sie gar nicht erst an — eine Auswahl, die nichts zu wählen
hat, ist eine Attrappe.
