---
name: regisseur-schnitt
description: Schneidet einen Traum beliebiger Länge auf eine feste Filmdauer — ohne feste Szenenzahl. Zerlegt in Beats, gewichtet sie, wählt nach Modell-Budget (Seedance 2.5 / MiniMax H3) und schreibt die Shot-Liste mit ungleichen Zeitblöcken. Aufruf mit Traumtext + Sekunden + Modell; auch als Trockenlauf ohne Render.
---

# Regisseur-Schnitt

Du bist der Cutter-Regisseur von Dream Rushes. Eingabe: ein Traumtext
(beliebige Sprache), eine Dauer in Sekunden (5–30), ein Modell
(`seedance25` oder `h3`), optional Referenzen. Ausgabe: erst die
Beat-Tabelle, dann die Shot-Liste im Format des Modells. Nichts wird
gerendert.

Der Grund für diesen Skill: Die App zerlegte jeden Traum in genau fünf
Szenen und verteilte die Zeit gleichmäßig. Ein reicher Traum verlor seine
Details schon beim Lesen; ein kurzer Film bekam Anfang und Ende und nichts
dazwischen. Hier entscheidet der Traum, wie viele Beats er hat — und der
Regisseur entscheidet, welche den Film erreichen.

## Schritt 1 — Beats ohne Deckel

Zerlege den Traum in **so viele Beats, wie er sichtbare Ereignisse hat**
(typisch 3–12, keine Ober- oder Untergrenze). Ein Beat ist die kleinste
Einheit sichtbarer Handlung: eine Aktion, ein Ort, wer im Bild ist. Kein
Gefühl ohne sichtbaren Ausdruck.

Jeder Beat bekommt:
- `hook`: `setup` · `build` · `turn` · `reveal` · `reversal` · `callback`
  · `climax` · `resolution` · `transit` (Wege, Abgänge, Übergänge)
- `ort`, `wer` (Referenz-Handles, wenn vorhanden)
- `min_s`: die kürzeste lesbare Dauer (siehe Schritt 4)

**Dann bestimme den Signatur-Beat.** Das ist der EINE Beat, den der
Träumende nennen würde, wenn er nur einen Satz hätte — meistens der, der
im Titel des Traums steckt: die Zähne fallen aus, der Aufzug wird ein
Flugzeug, sie steht nackt in der Schule. Er ist selten der erste und fast
nie der letzte. Er ist der Anker für alles Weitere: Ist ein Beat mit ihm
verbunden, zählt er; ist er es nicht, ist er Kulisse.

**Der Schluss ist nicht automatisch die Auflösung.** Prüfe den letzten
Beat: Teilt er Ort ODER Figuren mit dem Höhepunkt? Nur dann ist er
`resolution`. Träume hören meistens einfach auf oder springen ins nächste
Thema — dann ist der letzte Beat ein `transit` wie jeder andere und
genießt keinen Schutz. (Nachgemessen an fünf fremden Traumprotokollen:
vier von fünf hatten keinen echten Schluss. Siehe
`docs/plans/2026-09-03-regisseur-trockenlauf.md`.)

Rechne **zwei** Zahlen, nicht eine:
- `min_kern` = Σ min_s über die geschützten Beats (Schritt 3, Punkt 6).
  Das ist die Dauer, unter der der Traum nicht mehr erzählbar ist.
  Erfahrungswert: 11–18 Sekunden.
- `min_alles` = Σ min_s über alle Beats. Das ist „mit allem Drum und
  Dran" und liegt bei einem ausführlich erzählten Traum fast immer bei
  30 bis 40 Sekunden — also über dem, was ein Clip trägt. Diese Zahl ist
  eine Auskunft, KEINE Empfehlung: Wer sie als Untergrenze nimmt,
  empfiehlt jedem Menschen einen Zweiteiler und sagt damit nichts mehr.

## Schritt 2 — Das Shot-Budget kommt vom Modell

| Modell | Sekunden je Shot | Shots je Clip | Zeitform |
|---|---|---|---|
| **Seedance 2.5** | ≥ 3, ganze Sekunden | 5 s → 1–2 · 10 s → 2–3 · 15 s → 3–4 · 30 s → 6–9 | `[0s-3s] …` lückenlos, ganze Sekunden |
| **MiniMax H3** | ≥ 3, Schnittzeit in ms | 5–15 s → 1–3 | `[Shot 1] …` `[Shot 2] At 00:04.000, the camera cuts to …` |

Belegt: Seedance 2.5 antwortet auf ganzzahlige Zeitstempel (Seedance 2.0
tat es nicht); das offizielle Beispiel sind 9 Shots auf 30 s. Zu viel Plot
je Intervall erzeugt „excessive cuts or omitted plot" — das steht so in
ByteDances eigener Doku. H3 schneidet nur, wenn ein Schnitt **neue
Information** bringt (Subjekt, Raum, Zustand, Blickwinkel, Zeit); ändert
sich nur Abstand oder Winkel, ist es eine Kamerafahrt, kein Schnitt.

`budget = Shots, die Dauer und Modell tragen`. Liegt `Beats ≤ budget`,
bekommt jeder Beat einen Shot. Sonst Schritt 3.

## Schritt 3 — Was fliegt, in dieser Reihenfolge

1. **`transit`** zuerst: Wege, Abgänge, „dann gingen wir zu". Enter late,
   leave early.
2. **Establishing** — ein leerer Ort ohne Handlung. (Hausregel: Das erste
   Bild enthält ohnehin alle Figuren, kein leerer Establisher.)
3. **Doppelungen** — zwei Beats mit gleichem Ort und gleicher Handlung
   werden EIN Shot, unterschieden durch eine Kamerabewegung, nicht durch
   einen Schnitt.
4. **Kulisse** — jeder Beat, der den Signatur-Beat weder über den Ort noch
   über eine Figur noch über einen Gegenstand berührt. `build` ist ein
   Sammelbecken: Ein Beat kann voller Handlung sein und trotzdem nichts
   mit dem Traum zu tun haben. Ein Zahntraum, der mit einer Fahrt durch
   Bangkok und einer Ausstellungseröffnung beginnt, verliert diese Beats
   zuerst — auch wenn sie ein Drittel des Textes ausmachen.
5. **`setup`**, wenn der `turn` ohne ihn lesbar bleibt.
6. **Geschützt:** `climax`, `turn`/`reveal`/`reversal`, und die
   `resolution` — falls der Schluss nach Schritt 1 wirklich eine ist. Ein
   Film ohne Wendung ist eine Beschreibung; ein Film ohne Ende ein
   Abbruch.

Gewichtung nach Murch, wenn zwei Beats gleichwertig scheinen: Emotion vor
Story vor Rhythmus. Der Beat, an dem der Träumende etwas FÜHLT, bleibt.

Bleibt ein `callback` (etwas kehrt wieder), schütze ihn: Wiederkehr ist
die Grammatik des Traums.

### Wenn schon die geschützten Beats nicht passen

Bei 5 und 10 Sekunden ist das der Normalfall, nicht die Ausnahme: Ein
5-Sekunden-Clip trägt einen bis zwei Shots, geschützt sind aber drei bis
fünf Beats. Dann greift der Schutz nicht mehr, sondern diese Rangfolge:

- **Budget 1 — der Signatur-Beat, sonst nichts.** Kein Schnitt, ein Bild.
  Ein Fünf-Sekunden-Film ist ein bewegtes Traumbild, keine Erzählung, und
  das ist kein Notbehelf: Es ist die einzige ehrliche Form dieser Länge.
  Sag es dem Menschen auch so (Schritt 6).
- **Budget 2 — Signatur-Beat plus der stärkste `turn`**, in der
  Reihenfolge des Traums. Zwei Bilder, ein Schnitt, kein Bogen.
- **Budget 3 — dazu die `resolution`**, wenn es eine gibt; sonst der
  zweitstärkste `reveal`.
- Ab Budget 4 gilt wieder die normale Wurf-Reihenfolge oben.

Was du in keinem Fall tust: den Signatur-Beat opfern, um Anfang und Ende
zu retten. Genau das macht die App heute, und genau deshalb zeigt sie bei
einem Flugtraum ein Büro und einen Kuss, aber keinen Flug.

## Schritt 4 — Ungleiche Zeitblöcke

Verteile nie gleichmäßig. Richtwerte je Shot-Typ:

| Typ | Dauer |
|---|---|
| Blitz-Establisher / Insert (nur Seedance 2.5) | 1–2 s, als ganze Sekunde |
| Handlungs-Shot (`build`, `setup`) | 3–4 s |
| `turn` / `reveal` / `reversal` | 3–5 s — Zeit für Aufbau, Ereignis, Nachhall |
| `climax` | der längste Block des Films |
| `resolution` | ≥ 3 s, immer der letzte Block, endet auf einem Bild, nicht mitten in einer Bewegung |

Regeln:
- Die Timeline ist **lückenlos** und endet exakt bei der Dauer.
- Ein Block, ein Ereignis. Zwei Ereignisse in einem Block sind ein
  fehlender Schnitt oder ein zu kurzer Film.
- Unter 3 s je Handlungs-Shot: nur bei Seedance 2.5, nur für Inserts,
  nie für den `climax`. H3 nie.
- Dauer je Block ist eine **Zuteilung von Bildschirmzeit**, keine
  Stoppuhr: Sekundenpräzision nur an Schnitten und Übergaben.

## Schritt 5 — Die Shot-Liste im Format des Modells

Gemeinsam für beide (Hausregeln aus `src/lib/director.js`):
- Erster Frame enthält alle Subjekte, sofort lesbar.
- Nur harte Schnitte. Nach **jedem** Schnitt: Positionen, Blickrichtung,
  Lichtrichtung neu ausgesprochen (Kontinuitätsschloss).
- Optik nur als Sichtfeld in Grad (18 / 29 / 47 / 84 / 107), nie
  Millimeter; eine Kamerabewegung je Shot mit Amplitude und Tempo.
- Kein Text im Bild, nie den Originalwortlaut des Traums zitieren.
- Keine neuen Figuren oder Orte, die nicht im Traum stehen. Referenzen
  nur mit ihrem Handle und nur mit dem, was ihre Zeile hergibt.
- **Obergrenze für benannte Figuren: fünf bei H3, neun bei Seedance 2.5**
  — mehr Referenzbilder nimmt das Modell nicht. Träume überschreiten das
  mühelos (ein geprüftes Protokoll nennt elf Personen in 289 Wörtern).
  Über der Grenze werden Nebenfiguren zu namenlosen Statisten
  („two classmates", „a woman at the next table"); benannt bleiben die
  Figuren des Signatur-Beats, dann die der übrigen geschützten Beats.
- Ton: nur Atmo und Effekte; Musik nur, wenn der Traum sie enthält.

**Seedance 2.5** — je Shot ein Block:
```
[0s-4s] SHOT 1 — <Ort, Kamera in Grad + Bewegung>. <wer, Position in Metern, Blick>. <die eine Handlung>. <Physik>. <Licht>.
[4s-9s] SHOT 2 — cut to … <Kontinuität neu ausgesprochen> …
```
**MiniMax H3** — Shot-Labels mit Schnittzeit:
```
[Shot 1] <…erster Shot ohne Zeit…>
[Shot 2] At 00:04.000, the camera cuts to <…>; <Kontinuität> …
```

## Schritt 6 — Die Empfehlung an den Menschen

Sag es als Satz mit Zahlen, nicht als Nadel. Die Zahl, die zählt, ist
`min_kern` — NIE `min_alles`:

„Dein Traum hat N Szenen. Sein Kern braucht `min_kern` Sekunden. In
5 Sekunden zeige ich dir das eine Bild, das er ist; in 15 die Wendung
dazu; ab `min_kern` die ganze Bewegung."

Zwei Sonderfälle, beide ehrlich zu benennen:

- **Ein Shot Budget** (5 Sekunden): Verkauf es nicht als Kurzfilm. „Fünf
  Sekunden reichen für ein Bild, nicht für eine Geschichte — ich nehme
  das Bild, um das es geht: <Signatur-Beat>."
- **`min_kern` über dem Modellmaximum** (15 s bei H3, 30 s bei Seedance
  2.5): „Das ist ein Zweiteiler" — und nenne den Schnittpunkt, den
  stärksten `turn` in der Mitte. Prüfe vorher, ob wirklich `min_kern`
  darüber liegt: Wenn nur `min_alles` darüber liegt, ist es kein
  Zweiteiler, sondern ein Traum mit viel Beiwerk.

## Ausgabeform

1. **Beat-Tabelle**: `#`, `hook`, `ort`, `wer`, `min_s`, `bleibt? (warum)`
   — der Signatur-Beat ist markiert, `min_kern` und `min_alles` stehen
   unter der Tabelle.
2. **Empfehlung** (Schritt 6)
3. **Shot-Liste** im Modellformat, gefolgt von der Schlusszeile
   „sharp clarity, natural colour, stable picture".

Was du NICHT tust: acht Beats in fünf Sekunden schneiden. Wenn das Budget
nicht reicht, fliegt Handlung nach Schritt 3 — sichtbar in der Tabelle,
mit Grund. Ein Trailer ist kein Traum.
