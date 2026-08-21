# Storyboard vor dem Film — die Beats werden sichtbar und antippbar

**Stand:** 2026-08-19 · Anlass: Antons Ansage aus der Session vom 19.08.
**Status: VORSCHLAG — nicht umgesetzt, wartet auf Antons Zuschnitt-Entscheidung (§5).**

## 1. Die Idee, in Antons Worten

Wenn man auf Video-Generierung drückt, soll das Menü nicht nur Sekunden und
Modellstufe zeigen, sondern die Szenen selbst: die Beats in ihrer Abfolge,
jeder mit seinem schon erzeugten Bild. Einen Beat antippen → das Bild groß
sehen und den Text dieses Abschnitts lesen. Vielleicht auch: einen Beat per
Häkchen rausnehmen. Antons eigener Vorbehalt dazu, wörtlich sinngemäß:
„Vielleicht ist das zu viel Kontrolle."

## 2. Warum das kein neues Feature ist, sondern ein Fenster in eines, das es schon gibt

Seit dem 19.08. schneidet `beatsForSeconds()` den Fünf-Szenen-Bogen auf die
gewählte Filmlänge zu: 5 s → 2 Szenen, 9 s → 3, ab 15 s alle fünf. **Diese
Auswahl passiert heute unsichtbar im Server.** Der Nutzer stellt 5 Sekunden
ein und erfährt nie, dass sein Film nur aus Anfang und Auflösung bestehen
wird — dabei steht die Antwort längst im Code und ist ohne Modellaufruf
berechenbar.

Das Storyboard ist also zuerst **Ehrlichkeit, nicht Kontrolle**: Es zeigt,
was die App ohnehin entscheidet. Das passt zum zweimal bestätigten Muster
aus STAND.md (Kaufblatt, Besetzung): *Die App speichert mehr, als sie
zeigt — welche gespeicherte Information fehlt hier noch?* Hier: der
Journal-Eintrag trägt `analysis.beats`, `imageCount` und `media.urls`;
die Verbindung zwischen ihnen zeigt niemand.

## 3. Die Beat↔Bild-Zuordnung — rekonstruierbar, mit zwei Fallen

Die Bilder entstehen aus `beatsForCount(beats, imageCount)`, die Zuordnung
ist deterministisch:

| imageCount | Bild i gehört zu |
|---|---|
| 5 | Beat i (1:1) |
| 10 | Beat ⌈i/2⌉ (zwei Momente je Beat) |
| 3 | Beats 1, 3, 5 |

**Falle 1 — der Poster-Offset:** Mit Titelkarte ist `media.urls[0]` das
Plakat, die Beat-Bilder beginnen bei `[1]`. Wer die Zuordnung baut, muss
wissen, ob ein Poster dabei war — sonst zeigt jeder Beat das Bild seines
Nachfolgers. Ob „Poster war dabei" heute am Eintrag ablesbar ist, ist beim
Bau ZUERST zu klären; notfalls muss es beim Speichern dazu.

**Falle 2 — Film ohne Bilder:** Ein Film-first-Traum hat
`media.urls: []` (Step6Result legt die leere Form bewusst an). Das
Storyboard zeigt dann Text-Beats ohne Thumbnail — das ist in Ordnung und
ehrlich, darf aber nicht als leerer Zustand crashen oder verschwinden.

Die Zuordnung gehört als reine Funktion nach `src/lib/beats.js`
(`imageIndexForBeat(beatIndex, imageCount, hasPoster)`), getestet gegen
alle drei Zählungen und beide Poster-Fälle — nicht als Inline-Rechnung
in einer Komponente.

## 4. Vorschlag: zwei Stufen, die zweite nur auf Antons Go

### Stufe A — das Storyboard zeigt, was passiert (nur lesen)

Im Film-Abschnitt von `Step5Style.jsx`, direkt bei Sekunden-Slider und
Modellwahl: eine horizontale Leiste der fünf Beats, jeder als kleines
Thumbnail (oder Text-Kachel, Falle 2) in Erzählreihenfolge.

- **Der Sekunden-Slider steuert die Leiste live:** Beats, die bei der
  gewählten Länge in den Film kommen (`beatsForSeconds` — DIESELBE
  Funktion, importiert, nie nachgebaut), sind voll sichtbar; die anderen
  ausgegraut. Wer von 15 auf 5 Sekunden zieht, SIEHT drei Szenen
  verblassen. Das erklärt die Preis-Länge-Abwägung besser als jeder Text.
- **Antippen → Blatt mit Bild groß + Beat-Text.** Der Beat-Text ist
  englisch (Rendering-Anweisung); das Blatt zeigt ihn trotzdem — es ist
  dieselbe Ehrlichkeit wie beim Trockenlauf-Werkzeug. Kein neues
  Modal-System: die App hat bereits Blätter (Kaufblatt, AvatarDialog).
- Kein neuer Zustand, keine Serveränderung, kein neuer Preis. Reines
  Sichtbarmachen.

### Stufe B — Beats abwählen (erst nach A bewerten)

Häkchen je Beat; abgewählte fliegen VOR dem Zuschnitt aus der Liste, die
der Client ohnehin schon als `beats` an den Server schickt (seit 19.08.).
Serverseitig ändert sich fast nichts — sanitisiert wird die Liste bereits.

Drei Dinge sind dabei nicht verhandelbar:

1. **Der Preis ändert sich NICHT.** Sekunden bestimmen den Preis, nicht
   Szenen. Abwählen ändert die Erzählung (mehr Zeit je verbliebener
   Szene), nicht die Rechnung — das muss die UI sagen, sonst erwartet
   jemand einen Rabatt fürs Streichen.
2. **Mindestens zwei Beats bleiben** (Anfang und Auflösung sind das
   Minimum einer Geschichte — dieselbe Untergrenze wie in
   `beatsForSeconds`). Das Häkchen des vorletzten verbliebenen Beats ist
   deaktiviert, mit Begründung am Element.
3. **Wer den letzten Beat abwählt, macht den neuen letzten zur
   Auflösung.** Der Regisseur-Brief verlangt, dass der letzte Beat
   aufgelöst wird — das gilt dann für den neuen letzten. Kein Sonderfall
   nötig, aber ein Test dafür.

**Empfehlung: A bauen, B liegen lassen,** bis A in echter Benutzung war.
Antons „vielleicht zu viel Kontrolle"-Instinkt ist berechtigt: Die App
verkauft einen Traum, der sich selbst verfilmt — je mehr Häkchen, desto
mehr Arbeitsblatt. Stufe A beantwortet die Frage „verstehe ich, was ich
gleich bezahle?" ohne ein einziges Bedienelement. Falls Nutzer danach
trotzdem Szenen tauschen wollen, weiß man es aus echter Beobachtung.

## 5. Was Anton entscheiden muss

1. **Stufe A bauen — ja/nein?** (Aufwand: `Step5Style.jsx` + eine neue
   kleine Komponente + `imageIndexForBeat()` in `beats.js` + Texte in
   ALLEN sieben Sprachdateien, Arität beachtet, + Tests. Keine
   Serveränderung, keine neuen Kosten.)
2. **Stufe B sofort mit — oder erst nach Beobachtung?** (Empfehlung: erst
   nach Beobachtung.)
3. Soll das Storyboard auch im **Journal-Detail** erscheinen (Film eines
   bestehenden Traums), oder nur im Wizard? Journal-first wäre sogar der
   häufigere Fall: dort EXISTIEREN die Bilder immer schon.

## 6. Was ausdrücklich NICHT Teil dieses Plans ist

- Beats umformulieren oder neu ordnen (das wäre ein Editor — andere Liga,
  anderes Risiko: Nutzertext flösse in den Regisseur-Brief).
- Ein Bild je Beat neu würfeln (kostet Credits, braucht die
  Preis-Maschinerie — eigener Plan, falls je gewünscht).
- Sekundenzahl JE BEAT einstellen (der Regisseur verteilt die Zeit
  absichtlich selbst; feste Marken je Szene würden mit „stretch or
  compress where the action needs it" kollidieren).

## 6. Nachtrag 21.08.2026 — Stufe B gebaut, und die größere Frage dahinter

Stufe B ist umgesetzt (Commit 88792ee): Kacheln tragen ihren Szenentext,
im Film-Schritt sind Szenen an-/abwählbar, die Auswahl ersetzt den
Automatik-Schnitt. Server unverändert (beatsForSeconds reicht passende
Listen als Identität durch).

Antons Anschlussfrage aus derselben Session: Braucht es nach dem
Einsprechen einen Prüf-/Approve-Schritt — und passt man dort den GANZEN
Traum an oder einzelne Beats? Einschätzung (Empfehlung ausgesprochen,
Entscheidung offen):

- **Kein Pflicht-Gate.** Der Wizard ist für den 3-Uhr-nachts-Nutzer
  gebaut; ein Approve-Schritt vor jedem Traum ist eine Mautstelle.
  Kontrolle als Kür, nie Pflicht — dasselbe Muster wie Regisseur und
  Bogen-Pflicht.
- **Der Traumtext bleibt die einzige Quelle.** Wer etwas falsch findet,
  ändert den TEXT (geht heute schon: Schritt 1 ist editierbar) — die
  Re-Analyse kostet ~$0,0003 und Sekunden, DeepSeek-Durchläufe sind
  KEIN Sparggrund. Dann bleiben Journal, Atlas, Reflection und Film
  automatisch deckungsgleich.
- **Kür-Vorschlag für die Sichtbarkeit:** in Schritt 2 eine eingeklappte
  Zeile „5 Szenen erkannt — ansehen" → Storyboard + Weg zurück zu
  Schritt 1 („Traum anpassen"). Wer prüfen will, kann; wer schlafen
  will, wischt weiter. Noch nicht gebaut.
- **Beat-Text editieren (Stufe C) erst nach Antons Regel-Entscheidung:**
  Ein geänderter Beat weicht vom Journal-Traum ab. Empfehlung, falls C
  kommt: die Änderung ist eine reine FILM-Fassung (Regieanweisung für
  diesen einen Render), der Traum im Journal bleibt unberührt.
- Merken: Beats treiben auch die BILDER (beatsForCount) — das Storyboard
  könnte im Bild-Modus genauso stehen wie im Film-Modus.
