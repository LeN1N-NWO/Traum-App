# Regisseur-Schnitt — Beats ohne Deckel, Auswahl nach Gewicht

**Stand:** 2026-09-03 · Anlass: Antons Frage („wie können wir dynamisch,
je nachdem wie viele Sekunden der Kunde auswählt, alles reinpressen") und
seine Ansage: „Da wir weg sind von den Bildern, haben wir kein Limit mehr
mit diesen 5 Szenen. Das System muss entscheiden, wie viele es sind."
**Status: RECHERCHE + SKILL fertig, App-Umbau UMGESETZT (03.09.2026,
Antons Go) und mit einem bezahlten Lauf geprüft.** Was noch offen ist,
steht in §7.
Skill: `.claude/skills/regisseur-schnitt/SKILL.md` — als `/regisseur-schnitt`
mit Traumtext, Sekunden und Modell aufrufbar, rendert nichts.
Prüfbericht: `docs/plans/2026-09-03-regisseur-trockenlauf.md` — fünf echte
Traumprotokolle aus der DreamBank, fünf gefundene Fehler, vier davon im Skill
behoben. Wer den Umbau beginnt, liest ihn zuerst: Der Signatur-Beat und die
Schluss-Regel stehen dort, nicht hier.

## 1. Der Befund

Der Verlust passiert **beim Lesen, nicht am Regler**: Die Analyse liefert
immer genau fünf Beats (`server.js:1135` „exactly 5, always"), egal ob der
Traum drei oder zwölf Ereignisse hat. Danach verteilt der Regisseur die
Zeit **gleichmäßig** (`director.js:148`, `each = seconds / scenes`) und
wählt Beats **nach Position** (`evenIndices`), nicht nach Inhalt. Bei
5 Sekunden bleiben Anfang und Ende, die Mitte fällt.

Die fünf stammt aus der Bildstrecke (2×2-Raster, „fünf Quell-Beats, aus
denen vier Bilder werden"). Ohne Bildprodukt hat sie keinen Grund mehr.

## 2. Was die Recherche hergibt (Quellen im Agentenbericht, 03.09.)

- **Seedance 2.5** versteht **ganzzahlige Zeitstempel** (2.0 nicht) und
  will eine lückenlose Timeline. Offizielles Beispiel: 9 Shots auf 30 s.
  Warnung aus der Doku selbst: zu viel Plot je Intervall → „excessive
  cuts or omit parts of the plot". → **≥ 3 s je Shot**, 3–4 Shots je 15 s.
- **MiniMax H3**: `[Shot N] At 00:03.500, the camera cuts to …`, Schnitt
  **nur bei neuer Information**, sonst Kamerafahrt; 2–3 Shots je Clip.
- **Schnitt-Handwerk**: „Enter late, leave early", Establisher fliegen
  zuerst, Wendung und Auflösung nie; Murch: Emotion 51 %, Story 23 %.
- **Kein bekanntes Framework** gewichtet Beats nach Wichtigkeit und
  verteilt sie auf eine feste Dauer. Das ist Eigenbau — und der Skill.
- **Hausskills** (cinedance, shotlist-builder, acting-performance,
  fincher): kennen Shot-Typen mit eigener Dauer (0,3-s-Blitz bis 15-s-CU),
  Cut-Whitelists, 14-Punkte-Kontinuitätsschloss, „2–4 sichtbare
  Beat-Wechsel je Szene". Der App-Regisseur hat davon: eine Zeile.

## 3. Was der Skill festlegt (Kurzform)

1. Beats **ohne Deckel**, je Beat ein `hook`-Typ und eine Mindestdauer.
2. Shot-Budget **aus Modell und Dauer** (Tabelle im Skill).
3. Auswahl **nach Gewicht**: transit → Establisher → Doppelungen (werden
   Kamerafahrt) → setup; nie climax/turn/resolution.
4. **Ungleiche Zeitblöcke**: climax am längsten, resolution zuletzt,
   Inserts nur bei Seedance 2.5.
5. Ausgabe im **Format des Modells** + Hausregeln (erster Frame voll,
   harte Schnitte, Kontinuität nach jedem Cut, Grad statt mm).
6. **Empfehlung als Satz**: „N Beats — in 5 s passen k, in 15 m, ab X
   alle; über dem Modellmaximum: Zweiteiler."

## 4. Umbau in der App — Wirkungsradius

| Stelle | Heute | Neu |
|---|---|---|
| `server.js` ANALYSIS_SYSTEM (1111, 1135, 1219–1221) | exactly 5, Auffüllen durch Dopplung | so viele wie Ereignisse, je Beat `hook` + `min_s` |
| `src/lib/beats.js` SOURCE_BEATS=5, fiveOf/tenOf, SECONDS_PER_BEAT=3 | positionelle Auswahl | `selectBeats(beats, seconds, model)` nach Gewicht; Budget je Modell |
| `src/lib/beats.js` — neu | — | `signatureBeat(beats)`: der eine Beat für Budget 1. Ohne ihn bricht die Auswahl bei 5 s, siehe Trockenlauf §4 |
| `src/lib/video.js` maxRefs (5 / 9) | nur für den Upload geprüft | auch die Benennung im Brief deckeln: über der Grenze namenlose Statisten |
| `src/lib/director.js` Brief (148–153) | „about Y seconds each" | Shot-Liste mit Zeitblöcken je Beat, Modellformat |
| `src/lib/video.js` | — | `shotBudget(modelId, seconds)`, `timeFormat` (integers / ms) |
| `Step5Style.jsx` Empfehlung (101–106, Nadel) | Modellschätzung `filmSeconds` | Satz aus `min_gesamt` + Knöpfe; Zweiteiler-Hinweis |
| Storyboard Stufe B | wählt aus 5 | wählt aus N, zeigt Gewicht |
| Tests | beats.test.js an 5 gebunden | Auswahl-Invarianten: climax bleibt, Timeline lückenlos, ≥ 3 s |

⚠ `analysis.beats` ist an ALTEN Träumen gespeichert (immer 5). Der neue
Weg muss mit 5 genauso laufen wie mit 12 — kein Migrationszwang.

## 5. Reihenfolge

1. **Skill am echten Traum trocken laufen** (Anton: zwei, drei eigene
   Träume durch `/regisseur-schnitt`, 5 s / 15 s / 30 s, beide Modelle).
   Das kostet nichts und zeigt, ob die Gewichtung stimmt, BEVOR sie in
   den Server zieht.
2. Analyse öffnen (`hook`, `min_s`, kein Deckel) + `selectBeats` mit Tests.
3. Director-Brief auf Shot-Liste + Modellformat umstellen.
4. Empfehlung im Wizard als Satz. Erster bezahlter Lauf mit EINEM Traum.

## 6a. Was der erste echte Lauf gezeigt hat (03.09.2026)

Der Flugtraum aus der DreamBank (samantha:56), durch die ganze App:

- **Der Deckel ist weg.** Die Analyse lieferte 8 bis 11 Szenen statt fünf,
  je nach Lauf. Der Signatur-Beat war beide Male „the lift becomes an
  aeroplane" — genau der, den die alte Auswahl bei kurzen Filmen wegwarf.
- **Die Auswahl bei 15 s / H3 (3 Shots):** Verwandlung, Höhepunkt, eine
  Wendung. Büro und Kuss fliegen raus. Der alte Weg hätte Büro und Kuss
  genommen und sonst nichts.
- **Die Schluss-Regel greift.** Der Kuss mit einem Freund bekam beim
  zweiten Lauf `transit`, nicht `resolution` — obwohl er der gefühlvollste
  Moment ist. Genau so war es gemeint.

⚠ Drei Sachen, die erst am echten Lauf sichtbar wurden, sind behoben:
`list()` kappte Szenen bei 120 Zeichen und bei acht Stück · die Analyse
machte den themenfremden Schlussbeat zum Höhepunkt · der Empfehlungssatz
widersprach sich.

## 6b. Offen: die Uhren

**Die Analyse braucht bei langen Träumen zwei bis vier Minuten** — 96 % der
erzeugten Token sind Denk-Token. Gegengemessen: der ALTE Prompt brauchte am
selben Traum 121 s, der neue 184 s. Der lange Traum wäre also vorher
genauso am 60-Sekunden-Limit des Clients gescheitert; aufgefallen ist es
nur nie, weil bisher niemand einen langen Traum eingegeben hat. Die
Timeouts stehen jetzt auf 300 s (`api.js`), aber das ist ein Pflaster:
Solange es kein schnelleres Modell für diese Aufgabe gibt, sieht der Mensch
minutenlang den schlafenden Frosch.

**Der Filmauftrag hat dasselbe Problem — und es ist teurer.** /api/generate
antwortet im Film-Modus erst, wenn der Regisseur fertig ist. Bricht der
Client vorher ab, arbeitet der Server weiter, gibt den Film bei fal ab und
bekommt eine Auftragsnummer, die niemanden mehr erreicht. **Das ist
vermutlich die Ursache der beiden verwaisten Filme vom 31.08.** Der
Strukturfix: Der Server gibt sofort eine Auftragsnummer zurück und schreibt
die Regie im Hintergrund.

**Der Regie-Prompt läuft ins Limit.** Beim Lauf: 7000 Zeichen bei H3, also
exakt `promptMax` — die Notbremse hat gekappt, und sie kappt am Ende, also
bei Auflösung und Ton. Die Shot-Liste macht den Prompt länger als früher.
Entweder das Budget im Brief härter formulieren oder die Kontinuitäts-
Wiederholung je Shot kürzen.

## 6. Was bewusst nicht drin ist

- **Trailer-Tempo** (Shots unter 2 s als Stil): Die Modelle liefern dann
  Brei, und ein misslungener Film kostet 10–120 Credits. Kommt, wenn
  jemand es nach echten Filmen vermisst — als Schalter, nicht als Vorgabe.
- **Zweiteiler als Produkt**: hängt am Preisentscheid.
