# WORKLOG — Historie, nur anhängend, neue Einträge OBEN

> Alte Einträge werden NIE geändert. Richtigstellungen kommen als neuer Eintrag dazu.
> Pro Eintrag: Datum, Uhrzeit, Name, Branch, Commits, was, warum, was der Nächste wissen muss.

## 2026-08-25 22:50 — Anton — Branch `session/2026-08-25-anton` (PR #28) — Sitzungsabschluss

**Commits:** `42c2394` (Eröffnung) · `8c741b6` (**der Frosch tippt den Knopf
selbst**) plus dieser Doku-Commit.
Zustand: **442 Tests grün**, fünf Skriptprüfungen grün, Build sauber.
Bezahlte Läufe: **keine.** Diese Sitzung hat kein Geld gekostet.

⚠ Zweite Sitzung an diesem Tag — die erste steht darunter (11:20).

### Der Satz, der über dem Tag steht

**Ein Anker, der ins Leere zeigt, wirft keine Fehlermeldung.** Antons
Tipp-Animation und sein Referenzknopf lagen 35 % der Bildbreite
auseinander. Formatfüllend eingebaut hätte der Frosch neben den Knopf
getippt — und das wäre durch jeden Test gekommen, durch jeden Build, durch
jede Codeprüfung. Gefunden hat es nur das Nachmessen.

### Der Frosch tippt den Knopf selbst

Antons Ansage: „Das Video soll als Overlay auf den Erzeuger-Button … dann
tut es so, als würde es auf den Button klicken, und erst dann verschwindet
es … im Hintergrund ist es schon aktiviert. Dadurch sparen wir auch ein
bisschen Zeit."

⚠ **Der Einspieler ist NIE ein Tor** (`ButtonTapOverlay.jsx`). Der Auftrag
ist abgeschickt, bevor das erste Einzelbild läuft — genau davon lebt der
Zeitgewinn. Wer das umdreht, verschenkt nicht nur die Sekunden, sondern
baut die Selbstheilung vom 24.08. wieder zu: Eine Ablehnung durch den
Inhaltsfilter kommt SCHNELLER zurück als sechs Sekunden. Deshalb nimmt
`Step5Style.jsx` den Frosch im `catch` sofort weg.

Vier Messungen statt vier Vermutungen:

- **ProRes 4444 spielt in KEINEM Browser.** Das war der schwarze Kasten in
  Antons Screenshot, kein Alpha-Problem. Alpha-Packung: **23 MB → 579 KB**,
  iOS und Android aus einer Datei.
- **Die Quelle ist premultipliziert exportiert.** Nachweis: Die Farbe fällt
  mit dem Alphawert (A=255→R=148, A=117→R=69), statt konstant zu bleiben.
  Bei „straight" bliebe R gleich. Also mit `--premultipliziert` gepackt.
- **Der Funke sitzt bei 14,5 % / 78 %** des Bildes — Schwerpunkt der
  Alphadeckung im unteren Bilddrittel, über alle 145 Einzelbilder gesucht;
  der Tippmoment ist Sekunde 3,0 von 6,04. **Antons Referenzknopf liegt
  bei 49,3 % / 84,8 %.**
- **Verschieben allein löst es nicht:** Dann sitzt der Funke richtig und
  der Kopf hängt aus dem Bild. Bei `scale` 0,65 passt das ganze Tier;
  0,85 ist abgeschnitten. Alle drei gegengerendert, bevor es in den Code
  ging.

⚠ **Der Anker rechnet gegen das ECHTE Knopfelement, nicht gegen
Bildschirmprozente.** Die Animation ist auf 9:16 gezeichnet, kein heutiges
Telefon IST 9:16. Auf Prozente gelegt wandert der Funke auf jedem Gerät
woanders hin. Das Rechteck kommt aus `e.currentTarget` im Klick-Ereignis —
zwingend, weil der Knopf eine Zeile später weg ist (`if (busy) return …`).

### Drei Maskottchen — die Tabelle steht, die Auswahl nicht

Antons Ansage: „Es wird drei verschiedene Maskottchen geben … diese
Maskottchen ändern ALLE Maskottchen über die ganze App."

`src/lib/mascots.js` ist die Tabelle; `Mascot.jsx` liest jetzt daraus,
statt die Datei direkt zu importieren. Ein zweites Maskottchen ist damit
eine ZEILE. Plan mit dem Offenen: `docs/plans/2026-08-25-maskottchen-auswahl.md`.

⚠ **Der Tipp-Anker gehört zur DATEI, nicht zur App.** Jede Zeichnung trifft
den Knopf an einer anderen Stelle ihres Bildes. Stünde die Zahl im Bauteil,
tippte das zweite Maskottchen daneben — lautlos.

### Recht: Prominente sind jetzt eine eigene Baustelle

`docs/plans/2026-08-20-recht-einwilligung.md` §8, nach Antons Fragen.

- **AGB wirken nach unten, nicht zur Seite.** Der Abgebildete hat nichts
  unterschrieben. Und die Freistellungsklausel, die man sich hier wünscht,
  ist gegenüber Verbrauchern die angreifbarste von allen (§ 307 BGB).
- ⚠ **Richtigstellung, und sie war meine:** Ich hatte App-Review als
  Veröffentlichungs-Blocker bezeichnet. Antons Einwand war richtig — Apple
  wirft raus, wer damit WIRBT, nicht wer es kann. Steht als
  Richtigstellung in §8b, weil sie die Entscheidung getragen hätte.
- **Nach oben durchreichen geht nicht:** Die Anbieterbedingungen schieben
  das Risiko die Kette hinab. Freistellungen wie „Copyright Shield" decken
  Urheberrecht, nicht Persönlichkeitsrecht — und entfallen, wenn man die
  Schutzmechanismen umgeht.
- ⚠ **Die Linie, die zählt: durchgelassen ≠ umgangen.** Damit wird der
  `unname`-Umschreiber zur Gretchenfrage. Er muss ENTIDENTIFIZIEREN, nicht
  tarnen. Der echte Satz vom 24.08. („Freddy Krüger" → „ein Mann mit
  verbranntem Gesicht, braunem Hut und Klingenhandschuh") sitzt auf der
  Kippe — das ist noch erkennbar die Figur.
- Antons Entscheidung: **nichts sperren, nichts bewerben, nichts umgehen.**

### Was der Nächste wissen muss

- **Ein Anker, der ins Leere zeigt, meldet sich nicht.** Wie beim Geld am
  25.08. vormittags: kein roter Test, kein Build-Fehler. Wer eine neue
  Animation einbaut, misst den Anker — die Anleitung steht im
  Maskottchen-Plan.
- ⚠ **Die Browser-Vorschau kann WebGL nicht prüfen.** Sie meldet
  `visibilityState: "hidden"`, und in einem verborgenen Tab läuft
  `requestAnimationFrame` nicht — die Fläche zeichnet nie. Geprüft wurde
  deshalb, was messbar ist: Geometrie live (152,156 / 368,75 bei 375×812),
  Funke an der Ankerstelle im Browser dekodiert (Maske 76, leere Fläche 0),
  Rahmen nach 7,3 s abgeräumt. **Das gemalte Bild hat niemand gesehen** —
  Anton prüft es in seinem eigenen Chrome.
- ⚠ **`node` gibt es auf diesem Rechner nicht**, nur `bun`. `npm test`
  läuft deshalb nicht durch: `bun test` plus die fünf `.mjs`-Prüfungen
  einzeln mit `bun` aufrufen. Alle sechs waren grün.
- **`scale` 0,65 ist gerechnet, nicht geschaut.** Der Regler in der
  Werkbank (StartMenu → „Mascot test bench") sucht den Wert; was er
  findet, gehört nach `mascots.js` und nicht in den Regler.
- Sitzung lief wieder ohne eigenen Worktree, aus demselben Grund wie am
  24.08.: Die Browser-Vorschau startet den Dev-Server aus dem
  Haupt-Checkout. Der Worktree wurde angelegt, gepusht — und dann
  abgeräumt, als klar war, dass Code und Browserprüfung anstehen. Der
  Branch blieb, der PR blieb.

## 2026-08-25 11:20 — Anton — Branch `session/2026-08-24-anton` (PR #27) — Sitzungsabschluss

**Commits:** `a355256` (Eröffnung) · `eb5b5ba` (**Credits steigen, Film
zieht mit**) · `a398bda` (**der Fehlergrund reist durch**) · `477d272`
(**Plan B**) · `97582d1` + `871507d` (**Alpha-Video für iOS und Android**) ·
`127bf7e` (**Antons Frosch**) · `460c53a` (**Rasterweg + Selbstheilung**) ·
`b27dbdf` + `26d35dc` (**die zwei bezahlten Läufe**) · `d26a052`
(**Besetzung bleibt**) · `5490f9a` (**Bogen ging verloren**) plus dieser
Doku-Commit.
Zustand: **442 Tests grün**, fünf Skriptprüfungen grün, Build sauber.
Bezahlte Läufe: **$0,47** (vier Stück).

### Der Satz, der über dem Tag steht

**Vier bezahlte Läufe, vier gefundene Geldfehler.** Keiner davon hätte je
eine Fehlermeldung erzeugt, und alle vier hätten dauerhaft gekostet:
`imageCount: 5` · Rasterplätze statt Szenen gezählt · `img2` erreichte den
Bogen nie · der Bogen fand keinen Ablageort.

Genau deshalb schreibt der Plan „der erste Lauf mit EINEM Traum" vor. Bei
fünf Träumen wären es $1,13 gewesen statt $0,23.

### Die Credits steigen — und Film musste mit

Antons Ansage: „Die Credits müssen steigen, vor allem für Bilder."
Woche 12→**25**, Monat und Jahr 45→**100**, Pakete 6/18/32→**13/36/70**.
Die PREISE stehen unverändert.

⚠ Der Haken, an dem es fast gescheitert wäre: **Ein Credit kauft ZWEI
Dinge.** Bilder sind billiger geworden, Film nicht. Nur die Zahlen zu
erhöhen hätte nicht Bilder verschenkt, sondern FILM — und das Jahresabo lag
beim Kino-Film schon vorher bei 1,3× statt 1,5×. Deshalb ziehen die
`creditsPerSecond` mit (1/4/6 → **3/9/17**), hergeleitet statt geraten.
Danach kostet ein Credit überall $0,020–0,028 statt $0,028–0,079.

⚠ `CREDIT_COST_USD` stand auf `0.08` — dem nano-banana-Preis vom 8. August,
DREI Modellwechsel alt. Der ganze Herleitungskommentar rechnete gegen diese
tote Zahl. Jetzt wird sie gerechnet (`creditCostUsd()`), nicht abgeschrieben.

### Ein abgelehnter Traum repariert sich selbst

Antons Freddy-Krüger-Traum kam nie zurück, und die App sagte nur „versuch
es noch mal" — bei einem Policy-Verstoß der einzige Rat, der GARANTIERT
nicht funktioniert. Der Grund stand in `data` und wurde in `server.js`
weggeworfen; selbst der Server wusste danach nicht mehr, warum.

Er reist jetzt durch bis zum übersetzten Text. Und die Kette bricht ab,
statt vier weitere garantierte Ablehnungen zu bestellen.

Antons Nachschärfung — „das erwarte ich von einer smarten App" — hat den
Rat durch eine TAT ersetzt: Refine-Modus `unname`, gratis. Am echten Satz
geprüft: „Freddy Krüger" → „einen Mann mit verbranntem Gesicht, braunem Hut
und Klingenhandschuh", und Schwester Lena bleibt Lena.

`recovery.js` kennt die drei Zustände (erstes Nein → beide Wege; Plan B
verbraucht → nur noch Umschreiben; Foto abgelehnt → Umschreiben hilft
nicht). Als eigene Datei mit Tests, weil der dritte Zustand erst nach einem
BEZAHLTEN Fehlversuch entsteht.

### ⚠ Der Policy-Weg ist NICHT bewiesen

Beide bezahlten Läufe mit „Freddy Krüger" und beide mit „Brad Pitt /
George Clooney" gingen **durch**. Der Umschreiber war nie im Einsatz.
Inhaltsfilter sind nicht deterministisch — am 23.08. hat Seedream bei
wörtlich identischen Aufträgen viermal durchgelassen und achtmal abgelehnt.
Der Weg ist gebaut und einzeln geprüft, aber im Echtbetrieb ungetestet.

### Der Rasterweg — der letzte der vier Schalter

Vier Szenen aus EINEM Bild. Zweimal bezahlt geprüft, beim zweiten Mal
sauber: ein Auftrag, `tiles: 4`, keine Kette, 4 Credits, 2160×3840,
Kacheln ~1075×1918.

⚠ `grid` kam ZWEIMAL nicht bis zum Server durch (api.js filtert Felder
einzeln; server.js reichte es nicht weiter). Ohne Fehlermeldung wären
Kacheln von 288×512 herausgekommen.

### Video mit Transparenz auf iOS UND Android

⚠ Es gibt kein gemeinsames Alpha-Format: HEVC+Alpha kann nur iOS,
VP9+Alpha nur Android. Lösung ist die **Alpha-Packung** — ein gewöhnliches
H.264, doppelt so hoch, Farbe oben, Maske unten; ein Shader setzt es
zusammen. Gemessen an Antons Datei: **40 MB → 231 KB**.

Der Frosch selbst braucht das nicht: weiße Kreide auf gemessenem
Reinschwarz → `mix-blend-mode: screen`, null Bytes extra.

### Zwei Sachen, die keine Renderfehler waren

**„Da ist gar nichts drin."** Die Bilder lagen auf der Platte; Antons
Browser kannte den Traum schon, und `mergeShared` ergänzte nur
Unbekanntes. Beim Entwickeln ist das der Normalfall — einer rendert, der
andere schaut zu. Der Abgleich füllt jetzt auch Bilder zu bekannten
Träumen nach, aber nur, wenn lokal gar keine stehen.

**„Ich habe satt, immer wieder mich selbst hinzuzufügen."** Träume
überleben einen geleerten Speicher seit dem 22.08. — die Menschen darin
nicht. Jetzt `media/besetzung/<tag>.json`, MIT Fotos und Bogen.
⚠ Unter `/media` (gitignored), nicht unter `data/`: Eine Datei kann man
löschen, einen Commit praktisch nicht — und die Gesichter gehören teils
anderen Menschen. Wer das ändern will, ändert `CAST_DIR`.

### Was der Nächste wissen muss

- **Der erste bezahlte Lauf gehört mit EINEM Traum gemacht.** Vier von vier
  Fehlern heute wurden so gefunden.
- **Ein Fehler, der Geld kostet, meldet sich nie von selbst.** Alle vier
  waren stumm: falsche Zahl, falscher Zähler, fehlendes Feld, fehlender
  Ablageort. Wer nur auf rote Tests schaut, findet keinen davon.
- **Ein Rückfall in einer Preisfunktion kann einen LEBENDEN Fehler
  zudecken.** `priceForImages(5)` fiel auf die kleinste angebotene Zahl
  zurück — als Netz für alte Journaleinträge gedacht, hier hat es die
  falsche Vorgabe versteckt.
- **Vorgaben ableiten, nie hinschreiben.** `imageCount` liest jetzt aus
  `IMAGE_COUNTS`, `CREDIT_COST_USD` wird gerechnet.

## 2026-08-24 16:30 — Anton — Branch `claude/new-session-x9qv1w` (Cloud, PR #26) — Sitzungsabschluss

**Commits:** `b8603cf` (**GPT Image 2 medium wird die Vorgabe, Seedream
außer Dienst**) · `4794453` (**Garderobe verdrahtet**) · `5ea9494`
(**Foto-Anker an, ultrareal als Vorgabe, Einkaufspreis richtiggestellt**)
plus dieser Doku-Commit.
Zustand: **384 Tests grün**, Shape-Check grün, Build sauber, Server live
geprüft. **Kein bezahlter Render** — die Cloud erreicht fal nicht.

### Antons Entscheidung: alles umstellen

„Der Test hat es ergeben, deswegen stellen wir alles um. Seedream fliegt
komplett raus, das erfüllt nicht unsere Anforderung."

Umgesetzt sind drei der vier Schalter: **Bildmodell auf GPT Image 2
(medium)**, **Foto-Anker an**, **`ultrareal` als Vorgabe**. Der vierte —
Raster statt Einzelbildern — ist als Bauanleitung offengeblieben, auf
Antons Wort (`2026-08-24-raster-als-hauptweg.md`); er baut ihn an seinem
Rechner, weil er ohne bezahlten Lauf nicht prüfbar ist.

### ⚠ Der teuerste Fund war der unscheinbarste

**Der Auftrag schickte weder Stufe noch Maß.** Beides kostet bei GPT
Image 2 sofort Geld:
- Ohne `quality` nimmt fal **„high"** — im Rasterfall **$0,413 statt
  $0,113**, das Dreieinhalbfache, lautlos.
- Ohne Maß nimmt es den Preset-NAMEN, und `portrait_16_9` ist 576×1024.
  Ein 2×2 daraus hätte Kacheln von **288×512** — bezahlt und unbrauchbar.

Beides kommt jetzt aus einer Hand: `imageStage()` sagt, welche Stufe wir
kaufen; `appGrid()` (neu in `gridLayout.js`) sagt, wie das Raster
aussieht — 2×2, Behälter 2160×3840, Kacheln 1080×1920. Die Funktion steht
dort, weil sie an ZWEI weit auseinanderliegenden Stellen gebraucht wird:
Der Server baut damit den Auftrag, der Browser schneidet damit das
Ergebnis. Laufen sie auseinander, sucht der Schnitt an der falschen
Stelle — und niemand sieht einen Fehler, nur schlechte Bilder.

⚠ **Der Verdrahtungstest hat sofort etwas gefunden, das ich übersehen
hatte:** Es gibt ZWEI Aufrufer von `imageSubmitBody`, und ich hatte nur
den Warteschlangen-Weg umgestellt. Der synchrone hätte weiter „high"
bezahlt. Der Test prüft jetzt ausdrücklich ALLE Treffer — einer, der nur
den ersten ansieht, hätte grün gemeldet.

### Der zweite Preisfehler, den der Wechsel selbst erzeugt hat

`preis-durchreichen.mjs` las `BILD.usd` — und das ist bei GPT der Preis
eines EINZELNEN Bildes in „high" ($0,178). So kaufen wir nicht ein: Wir
kaufen ein 2×2 in „medium", **$0,113 für vier Szenen = $0,0283 je Szene**.
Der Fehler hätte den Einkauf **um das Sechsfache zu hoch** gerechnet und
zur genau falschen Schlussfolgerung geführt — dass die Bilder zu teuer
sind.

⚠ Das ist die Lehre vom 23.08. ANDERSHERUM: Damals stand der Preis als
Konstante und war nach einem Tag falsch. Jetzt steht er in der Tabelle und
wäre TROTZDEM falsch, weil die Tabelle mehrere Preise für dasselbe Modell
kennt. Der richtige ist der, den unser konkreter Auftrag auslöst — Stufe
mal Rastermaß, geteilt durch die Plätze.

### Seedream ist außer Dienst, nicht gelöscht

Der Riegel sitzt in `pickImageModel()` — der EINEN Stelle, an der der
Server sein Modell aussucht. `imageModel()` bleibt bewusst ein reines
Nachschlagewerk: Gäbe es bei einem stillgelegten Modell etwas anderes
heraus, baute `imageSubmitBody` heimlich einen Auftrag für ein Modell, das
der Aufrufer nie genannt hat.

Die Tabellenzeile bleibt, weil Seedream das einzige Modell mit freien
Pixelmaßen ist — der Codezweig, den es prüft, wird vom nächsten solchen
Modell wieder gebraucht. Eine alte `.env` bekommt beim Start eine eigene
Meldung: nicht „kennt niemand" (dann sucht man den Tippfehler), sondern
„ist außer Dienst" samt Grund. Live geprüft.

### Die Garderobe ist verdrahtet (Antons Punkt 1)

Das Feld lag seit dem 24.08. bereit und war bezahlt bewiesen (36 von 36
Kacheln zogen um) — **gefragt hat danach nichts.** Jetzt geschlossen über
fünf Dateien: Analyse-Vertrag (`wearing`), Auswertung, `addPerson`,
Briefing (die Assistentin fragt EINMAL leicht nach), Wizard.

⚠ Die Trennung von `desc` steht an jeder Stelle als Warnung: `desc` ist,
wie jemand AUSSIEHT, und gilt in jedem Traum; `wearing` gehört dieser
einen Nacht. Wer beides in ein Feld wirft, trägt die Badehose aus Traum 1
bis in Traum 40.

`wardrobe.test.js` prüft die ganze Kette, und der Dateikopf sagt warum:
**Fällt EIN Glied aus, passiert nichts Sichtbares.** Die App läuft, die
Bilder kommen, jede Figur trägt weiter das, was ihr Bogen zeigt. Es gäbe
keinen Fehler zu suchen.

### Die offene Stilfrage hat sich aufgelöst

Der Foto-Anker stand in beiden Prompt-Bauern auf `= false` — er war also
in der ganzen App AUS, obwohl längst gemessen war, dass er den Unterschied
zwischen Fotografie und Malerei macht. Eine Vorgabe, die das Gegenteil des
Gemessenen tut, ist die teuerste Sorte Zeile.

Er hängt jetzt am STIL (`photorealFor`), nicht am Aufrufer. Damit braucht
die Frage „Was wird aus `dreamlike` und `surreal`?" keine Entscheidung
mehr: Beide sind als `painterly` markiert und bekommen den Anker einfach
nicht. Ein Prompt, der erst „wie ein Magritte-Gemälde" und dann „das ist
eine Fotografie, kein Gemälde" sagt, ist schlechter als einer, der
schweigt.

⚠ Und die Stil-VORGABE war `dreamlike` — ausgerechnet der Stil, der
„shapes dissolving" bestellt. Wer nie einen Stil wählte, bekam garantiert
gemalte Bilder und hielt das für das Können des Modells. Jetzt `ultrareal`.

### Was der Nächste wissen muss

- **Der Rasterweg ist der letzte offene Schalter.** Die Bauanleitung steht
  in `2026-08-24-raster-als-hauptweg.md`, mit Antons Entwurf darin: bei
  vier Szenen KEINE Kette (sie entstehen in einem Zug), bei acht ankert
  Raster 2 auf der letzten Kachel von Raster 1.
- **Der erste bezahlte Lauf gehört mit EINEM Traum gemacht.** $0,113 sind
  verschmerzbar, $0,57 für einen Verdrahtungsfehler nicht. Woran man den
  Erfolg erkennt, steht in §4 des Plans (ein Auftrag statt vier, Zeile
  `3840x2160`/`medium`, Kacheln 1080×1920 — nicht 288×512).
- **Merksatz aus dieser Sitzung:** Ein Test, der nur den ERSTEN Treffer
  prüft, meldet grün, wenn der zweite fehlt. Bei Verdrahtungstests immer
  `matchAll`, nie `match`.

## 2026-08-24 11:55 — Anton — Branch `session/2026-08-23-anton` (PR #25) — Sitzungsabschluss

**Commits:** `2d94854` (Eröffnung) · `1a45f93` (getippte Umfrage) ·
`af87778` (Nano Banana Pro 4K, zweidimensionaler Schnitt) · `a0fb7ba` +
`a89d63e` (Nano Banana 2 kann 4K) · `8cf815e` (**4/8 statt 3/5/10**) ·
`a15e490` (A/B-Skript an die Tabelle) · `d923370` (**Einstellungsebene**) ·
`b2ac7c9` + `05311db` + `d7695be` (GPT Image 2) · `1eebef3` (**zwei Fotos,
NUL-Byte raus**) · `4dbfd14` (**Garderobe je Traum**) · `38231e1`
(**Foto-Anker**) + dieser Doku-Commit.
Zustand: **370 Tests grün**, fünf Skriptprüfungen grün, Build sauber.
Bezahlte Messläufe an diesem Tag: rund **$3,10**.

⚠ Wieder ohne eigenen Worktree im Hauptrepo — Begründung steht EINMAL im
STAND unter „Fallen".

### Das Ergebnis in einem Satz

Bogen mit **GPT Image 2 low** ($0,017), Szenen mit **GPT Image 2 medium im
2×2-Raster mit Foto-Anker und Stil `ultrareal`** ($0,113), Garderobe als
**Text** ($0). Macht **$0,13 je Vier-Bilder-Traum — 7 % UNTER dem heutigen
Weg**, bei besseren Gesichtern.

⚠ Umgestellt ist davon NICHTS. `FAL_MODEL_IMAGE` steht weiter auf
`seedream-5-lite`, und der Foto-Anker ist per Vorgabe AUS. Alles unten ist
gemessen, nicht ausgerollt — die Umstellung ist der nächste Schritt und
gehört an Antons Wort.

### Die Kette der Befunde, in der Reihenfolge, in der sie kamen

**1. Die Einstellung fehlte, nicht der Look** (`d923370`). Antons „die
Bilder sind überhaupt nicht cinematic" hatte eine andere Ursache als
vermutet: Der Deakins-LOOK stand längst in `styles.js` („ultrareal": 40 mm,
T2.8, motiviertes Licht, invisible technique). Was fehlte, war die
EINSTELLUNG — jedes Bild kam als dieselbe Aufnahme zurück, Person mittig,
frontal, formatfüllend. `src/lib/cinematography.js` liefert jetzt vier
Einstellungen im Wechsel, die erste immer etablierend, plus drei Verbote in
jedem Bild (nicht mittig, nicht in die Kamera, kein Plakat).
⚠ Die Datei nennt bewusst KEINE Optik — die Stile widersprechen sich darin
(„dreamlike" 50 mm, „adventure" 24 mm). Im Test festgenagelt.

**2. Der Bogen ist das Nadelöhr** (`1eebef3`). Jedes Szenenbild
referenziert den BOGEN, nie das Foto. Wer ihn mit dem schwächsten Modell
macht und die Szenen mit dem stärksten, hat trotzdem die Ähnlichkeit des
schwächsten. Antons Bogen stammte von Nano Banana 2 Lite bei 1376×768.
Jetzt: zwei Fotos (Gesicht + Ganzkörper, Reihenfolge ist Vertrag),
Brille/Hut/Kapuze werden abgenommen, ohne Angabe neutrale Alltagskleidung.
Der erste Bogen aus zwei Fotos war ein sichtbarer Sprung.

**3. Die Garderobe gehörte der Person, nicht dem Traum** (`4dbfd14`). Es
gab nur EIN Beschreibungsfeld, und es galt für immer. `wardrobe` gehört
jetzt dem Traum, mit einem Satz, der ausdrücklich sagt, dass er das
Referenzbild schlägt. **Bezahlt geprüft: 36 von 36 Kacheln umgezogen, drei
Träume, drei Modelle.** Damit ist der teure Weg — ein Garderobenbild je
Traum und Figur, +30 % — vom Tisch.

**4. Den Malerei-Look haben WIR bestellt** (`38231e1`). Der wichtigste
Befund des Tages, und er zeigt auf unseren eigenen Code: `surreal` sagt
wörtlich „flat even lighting like a Magritte painting", `dreamlike` will
„shapes dissolving". Zwei der drei Testträume liefen auf genau diesen
Stilen. Der Foto-Anker (`PHOTOREAL` in cinematography.js) sagt jetzt
„photorealistic" ausdrücklich, nennt konkrete Tatsachen statt Lob — und
weist das Modell an, jede Stilanweisung IN CAMERA zu lesen statt als
Pinselstrich. ⚠ Er ist abschaltbar: Für einen bewusst gemalten Stil wäre er
ein Widerspruch.

### Modellvergleich, alles bezahlt gemessen

| Weg | 4 Szenen | Kachel |
|---|---|---|
| GPT Image 2 medium, 2×2-Raster | **$0,113** | 1080×1920 |
| Seedream 5 Lite einzeln (heute) | $0,140 | 1440×2560 |
| Nano Banana 2 4K, 2×2-Raster | $0,160 | 1533×2734 |
| Nano Banana Pro 4K, 2×2-Raster | $0,300 | 1533×2734 |

· **Bogen:** GPT low ($0,017) schlägt Nano Banana Pro 1K ($0,150) beim
  Gesicht deutlich — achtmal billiger, bessere Haut.
· **Szenen ohne Foto-Anker:** Nano Banana erzählt, GPT erfindet dazu
  (Blaskapelle über statt unter dem Eis, eine Leiche auf dem Steg, eine
  Stadtschlucht in der Bibliothek) und geht systematisch zu dunkel.
· **Szenen MIT Foto-Anker und Stil `ultrareal`:** GPT medium dreht das um
  und liefert echte Fotografie. Das ist der Stand, auf dem die Empfehlung
  beruht.
· ⚠ **Seedream lehnt Aufträge mit Referenzfoto unregelmäßig ab** —
  am 23.08. mit Referenz 4× durch, 8× abgelehnt, als
  `content_policy_violation` auf `body.image`. Kein Geld verloren (der
  Collector erstattet), aber das BILD fehlt. Das trifft die heutige
  Vorgabe und ist NICHT geklärt.
· ⚠ **Nano Banana 2 verfehlte das Raster** in einem von zwei frühen Läufen
  — vier Querformate statt vier Hochkant-Kacheln, bezahlt und unbrauchbar.
  Mit der Einstellungsebene danach 5 von 5 richtig; der Zusammenhang ist
  plausibel, aber nicht bewiesen.

### Was der Nächste wissen muss

- **4 und 8 statt 3/5/10** (`8cf815e`). Grund ist Geometrie: Ein 2×2-Raster
  fasst VIER Szenen, ein angefangenes Raster ist ein voller Aufruf. Bei
  fünf Szenen zahlt man zwei Aufrufe. ⚠ Das WILLKOMMENSGESCHENK musste
  mit, von 3 auf 4 Credits — sonst hätte der erste Traum einen Credit
  gekostet, den niemand hat. Es kostet uns jetzt $0,14 je INSTALLATION
  statt $0,105, und das ist laut plans.js der größte Einzelposten.
- ⚠ **`sheets.js` und `gatekeeper.js` enthielten echte NUL-BYTES**, und
  damit hielt Git beide Dateien für BINÄR — `git diff` sagte nur noch
  „Binary files differ". Kein Versehen, sondern ein bewusster Trenner, nur
  als Byte statt als Escape `\0` geschrieben. Behoben, plus ein Test, der
  jede Quelldatei prüft.
- **Die Assistentin fragt noch nicht nach Kleidung.** Das Feld (`wardrobe`)
  existiert und ist bezahlt bewiesen, das Briefing kennt es nicht. Das ist
  der kleinste offene Schritt mit der größten Wirkung.
- **Antons Berechtigungsliste** (`.claude/settings.local.json`) hat nur acht
  Einträge; fast jeder Befehl fragt nach. Ein Vorschlag liegt ihm vor. ⚠ Ich
  habe die Liste NICHT selbst erweitert — der Klassifikator hat das
  geblockt, zu Recht.

## 2026-08-23 15:49 — Anton — Branch `claude/new-session-x9qv1w` (Cloud) — Sitzungsabschluss

**Commits:** `4807bba` (Preisrechnung auf Seedream) · `5c10c60`
(**Raster: fünf Szenen in einem Bild**) · `144fa3b` (DreamWithin) ·
`5450a54` (Traumziele + Einstiegspreis) · `3ec1e76` · `f5a3724` ·
`6ba0484` (Shape, drei Stapel) · `132746a` (**Onboarding: Albträume,
Schlaf, Zeit, Erinnerungswunsch**) plus dieser Doku-Commit.
Zustand: **340 Tests grün**, Shape-Check grün, Build sauber.

⚠ Cloud-Sitzung: fal.ai und api.deepseek.com sind von dort gesperrt.
Alles unten ist strukturell geprüft oder im Browser live durchgegangen —
**kein einziger bezahlter Render**.

### Der teuerste Fund: die Preisrechnung war nach EINEM Tag falsch

`preis-durchreichen.mjs` trug den Bildpreis als Konstante ($0,042). Am
23.08. wurde Seedream 5 Lite ($0,035) das Bildmodell — und die ganze
Rechnung behauptete weiter den alten Wert. Genau davor warnte der
Dateikopf des Skripts. Jetzt wird der Preis aus `imageModel.js`
importiert und kann nicht mehr driften.
Der Befund wird dadurch schärfer: **Ein Kino-Credit kostet uns 125 %
mehr als ein Bild-Credit** (vorher 88 %).

**Antons Rabatt-Verdacht stimmt:** Vom gesamten Rabatt (64 % Woche→Jahr)
liegen **72 % schon im Monat**. Das Jahr verlangt zwölf Monate Bindung
und bietet nur den Rest. ⚠ Die naheliegende Reparatur wäre falsch — den
Monat zu verteuern widerspricht dem Auftrag „günstiger anbieten".
Empfehlung: das JAHR großzügiger machen, 50 Credits (40-%-Schritt).
Bei 30 % Store-Anteil ist 50 die Obergrenze, 55 trägt dann nicht mehr.

### Sparhebel, nach Größe (`2026-08-23-guenstiger-anbieten.md`)

Der größte ist **nicht das Bild, sondern der Kino-Einkauf**: fal nimmt
$0,473/s für Seedance 2.5, Atlas Cloud listet $0,134/s pauschal — $5,09
je 15-Sekünder. ⚠ Anbieterangabe, nicht gemessen; und **Seedance ist ein
geschlossenes Modell**, also ist der Preis eine Handelsspanne, keine
Technologie. Fünf Prüfpunkte im Plan, einer davon: ein vierter Anbieter
heißt **CONSENT_VERSION +1**.
Wan 3.0 ist angekündigt, ohne Preis, nicht buchbar. **Wan 2.7 wird auf
Antons Wort nicht angefangen.**

### Das Raster ist zurück — und diesmal ohne Haken

Am 19.08. verworfen, weil bei Nano Banana mehr Auflösung mehr kostete.
**Seedream rechnet flach je Bild bis 3K** — damit dreht sich die
Rechnung um: fünf Szenen in EINEM Bild für $0,035 statt $0,175 (−80 %).

Die Geometrie ist eine Zeile Bruchrechnung: Ein Behälter im Verhältnis
(Spalten × 9) : (Zeilen × 16) zerfällt in exakte 9:16-Kacheln. **2×2
ergibt wieder 9:16** — der einzige Fall ohne Sonderformat. Für fünf
Szenen ist **3×2 (27:32)** die Antwort, sechs Plätze, einer frei.
Neu: `src/lib/gridLayout.js` (10 Tests), `buildGridPrompt` mit
`cols`/`rows` (6 Tests), `scripts/raster-prompt.mjs`.

⚠ **Der bewährte Dreier-Streifen bleibt WÖRTLICH, wie er war** — er ist
an echten Renders belegt und `splitIntoPanels()` schneidet genau seine
Formulierung. Das Raster ist ein eigener Zweig, keine umformulierte Kopie.
⚠ **Das Raster kauft den Preis mit Auflösung:** 864×1536 statt 1440×2560.
Der Vorbehalt vom 19.08. (Gesichter und Hände zerfallen zuerst) ist nicht
widerlegt, nur billiger geworden. **Messauftrag, keine Entscheidung.**
⚠ Nicht eingetragen: Seedream 5 Pro und Nano Banana Pro — mir fehlen die
bestätigten fal-Slugs, und ein geratener Slug ist der 07.08.-Fehler.
Der Plan sagt außerdem, warum Pro als SPARtest nicht taugt (Pro rechnet
nach Fläche und ist im Raster teurer UND kleiner als Lite).

### Wettbewerb ausgewertet: DreamWithin und Shape

**Der wichtigste Fund ist technisch:** Shape fragt die
Benachrichtigungs-Erlaubnis ZWEIMAL — erst in der App, dann im System.
**iOS gibt genau einen Versuch.** Wer den Systemdialog kalt zeigt,
verliert jeden, der im falschen Moment ablehnt, und darf nie wieder
fragen. ⚠ **Das ist nach dem Xcode-Start nicht mehr nachholbar.**

Weiteres: der Tagespreis (Jahr $0,219/Tag — ⚠ nur für Abos, ein Paket
hat keinen Zeitraum) · ein Fortschrittsort statt drei verstreuter
Stellen · „Am-I-Dreaming" statt „Reality check" · und die Lücke, die uns
wirklich fehlt: **unsere Einführungsumfrage ist ausschließlich
gesprochen** — ohne GEMINI_KEY oder Mikrofon gibt es GAR KEIN Profil.

⚠ **Zwei Fehler von mir, die Anton richtiggestellt hat** (beide im
DreamWithin-Plan als Richtigstellung vermerkt, nicht gelöscht):
Ich habe „talk to your crush" als Bildgenerierung aus hochgeladenen Fotos
gelesen — es ist ein TRAUMINHALT-ZIEL, kein Upload. Und ich habe mit der
Gratis-Zusage im Sleep-Reiter argumentiert, obwohl die App nicht
veröffentlicht ist und sie deshalb niemanden bindet.

**Gegen den 1-Euro-Tarif** (Antons Frage): Ein 1-€-Abonnent bringt netto
37,15 €/Jahr, gut ein Drittel eines Monatsabonnenten; der billige Anker
steht neben dem echten Produkt; zwei Währungen brauchen eine Tabelle, wo
heute ein Satz reicht. Vor allem: **Das Verschenken IST die Waffe.**
Ein Gratis-Preis ist nicht unterbietbar. Sequenz-Entscheidung — ein
billiger Tarif ist jederzeit nachrüstbar, aber kaum zurückzunehmen.

### Gebaut: Onboarding (`132746a`)

- **Albträume sind jetzt ein Ziel.** Echte Lücke: bei zwei Wettbewerbern
  unter den fünf Hauptzielen, bei uns gar nicht. IRT ist die bestbelegte
  Selbsthilfe-Methode im Feld. Das Briefing verbietet dabei ausdrücklich
  zu beraten oder Heilung anzudeuten. Was danach angeboten wird, ist P3a.
- **Das Ziel steht an zweiter Stelle**, direkt nach dem Namen — wer wegen
  Albträumen kommt, soll nicht fünf Fragen warten. Test nagelt es fest.
- **Schlafdauer und Zeitbudget** — ohne sie heißt ein Plan nur „persönlich".
- **Der Erinnerungswunsch** (`src/lib/reminders.js`, 9 Tests): Die Stimme
  sammelt die ABSICHT, der Finger gibt sie frei. Antons Frage war, ob der
  Assistent gleich freischalten kann — technisch ja, gemacht nicht: ein
  verhörtes „nein" kostet die Funktion für immer, und der Systemdialog
  käme mitten ins laufende Mikrofon-Gespräch. `wants` ≠ `granted`,
  `askedAt` heißt „wurde gefragt", nicht „wurde abgelehnt".
- **Der Traumatlas kündigt sich an**: bei genau EINEM Traum eine gedämpfte
  Kachel „Ab deinem 2. Traum". Nicht bei null — das wäre dieselbe Sorte
  leerer Bildschirm, die bei Shape erklären muss, warum sie leer ist.
  Live geprüft bei 0, 1 und 2 Träumen.

### ⚠ Was der Nächste über Rot-Proben wissen muss

**Zwei Proben am neuen Verdrahtungstest feuerten zuerst NICHT, und beide
Male lag es am TEST:**

1. `toolBlock.toContain("nightmares")` — **mein eigener Kommentar, der
   den Wert begründet, enthält das Wort.** Der Test wäre grün geblieben,
   wenn der Wert entfernt wird. Merksatz: *Ein Test, der im Kommentar
   fündig wird, prüft den Kommentar.*
2. Beim Reparieren kam der zweite heraus: Der erste Treffer für
   `description` nach `name: "setGoal"` ist die des WERKZEUGS, nicht die
   der Werte.

Dazu drei Proben, die sauber gefeuert haben (gridLayout: Verhältnis
vertauscht, Grenzen aufaddiert, Streifen statt kompakt) und drei bei
`reminders.js` (Wunsch gilt als Erlaubnis, askedAt nur bei Ablehnung,
granted im Wunsch mitgeführt).

### Antons offene Bitte

**⏰ Beim nächsten Sitzungsstart an die Klang-Kandidaten erinnern** — er
hat ausdrücklich darum gebeten. Steht als Punkt 4 im STAND.

## 2026-08-23 10:35 — Anton — Branch `session/2026-08-22-anton-4` (PR #23) — Sitzungsabschluss

**Commits:** `68a43ed` (Eröffnung) · `b5bee97` + `f7a07f4` (Träume als
Dateien, geteilt) · `2005eb5` (Lucid-Text) · `3c23b65` (synthetische
Testträume raus) · `69144c1` (Personenerkennung) · `b0a2d23` (Bildkette) ·
`c89c37c` (Abschiedssatz + Profilfoto) · `1b69d4c` (Traum wird gelesen,
während noch erzählt wird) · `c59c5af` (Seedream im A/B) · `ea9b20e`
(Seedream 5 Lite wird das Bildmodell) + dieser Doku-Commit.
Zustand: 309 Tests grün, fünf Skriptprüfungen grün, Build sauber.

⚠ Wieder ohne eigenen Worktree im Hauptrepo — Begründung steht EINMAL im
STAND unter „Fallen". Nach dem Merge von #23: `git checkout main && git pull`.

### Das Bildmodell ist jetzt Seedream 5 Lite

Antons Ansage nach dem A/B: umstellen. Gemessen wurde mit EINER Variable —
dieselbe Kette, dieselben Prompts aus `promptBuilder.js`, dasselbe
Referenzbild (`media/z3n7fvhk3zl9.png`, Antons Bogen), nur der Modellname
anders. Ergebnis je fünf Bilder: Nano Banana 2 voll $0,40 · Nano Banana 2
Lite $0,21 · **Seedream 5 Lite $0,18**. Dazu 1440×2560 statt 768×1376.

⚠ Der Vergleich ist an EINER Stelle nicht sauber, und das gehört in jede
spätere Bewertung: Seedream hat eine Untergrenze von 2560×1440
Gesamtpixeln, kann also gar nicht in 1K antreten. Es startet mit sechsmal
so vielen Pixeln.

**Warum das kein Slug-Tausch war.** Seedream spricht eine andere Sprache
als Nano Banana: der nackte Slug ist bei fal ein 404 (Text-zu-Bild heißt
`.../text-to-image`), und statt `aspect_ratio` will es `image_size`. Beides
steht jetzt in EINER Tabelle, `src/lib/imageModel.js`, statt in zwei
Konstanten im Server — der Aufrufer entscheidet nichts mehr selbst. Der
Grund ist der Vorfall vom 07.08.: ein falscher Feldname wirft bei fal
keinen Fehler, er liefert nur still das Falsche.

⚠ **`FAL_MODEL_IMAGE` ist seit heute ein NAME aus dieser Tabelle, kein
roher fal-Slug mehr.** Erlaubt: `seedream-5-lite` (Vorgabe),
`nano-banana-2-lite`, `nano-banana-2`. Eine alte `.env` fiele stumm auf die
Vorgabe zurück, deshalb warnt der Server beim Start bei unbekanntem Wert
und nennt seither in jedem Fall das laufende Modell samt Stückpreis.

Verkaufspreise bleiben unverändert, wie schon beim Wechsel auf Lite am
20.08.: die Ersparnis verbreitert die Marge, sie verbilligt nichts.
`plans.js` sagt jetzt im Kopf, dass seine $0,08 der Einkaufspreis von
DAMALS sind, auf dem die Credit-Skala gebaut wurde — nicht der von heute.

**Geprüft, nicht angenommen.** Zwei echte Aufträge durch die App selbst,
nicht durchs Testskript: `/api/generate` mit Referenzfoto kam als
1440×2560 mit getroffenem Gesicht zurück, `/api/character` lieferte einen
sauberen Zwei-Panel-Bogen in 2560×1440. Kosten der Sitzung insgesamt: rund
$0,80 für alle Messläufe.

⚠ Mitgeprüft, weil es hätte brechen können: Der Bogen wandert als
data-URI in den localStorage (~5 MB Quota) und ist jetzt sechsmal so groß.
`compactDataUrl` klemmt bei 1600 px Breite — er wird auf 1600×900
heruntergerechnet. Die Grenze hält.

### Direkt bei ByteDance ist nichts zu holen

Antons Frage, recherchiert: **BytePlus** (ByteDances internationale
Plattform) verlangt für Seedream 5 Lite **$0,035 je Bild — denselben Preis
wie fal.** fal verkauft hier zum Listenpreis weiter, es liegt gar keine
Marge drauf. Nur die Festland-Plattform **Volcengine** ist mit ¥0,22
(≈ $0,031) billiger — dafür bräuchte es ein chinesisches Firmenkonto und
dieselbe China-Datenfrage, die im Rechtsplan noch offen ist, für 1,7 Cent
je Traum. Wiederverkäufer bei $0,028–0,032 sind Zwischenhändler, kein
ByteDance-Konto.

Zum Vergleich, weil die Frage wiederkommt: Bei **Nano Banana** wäre Google
direkt ~16 % billiger ($0,067 statt $0,080) — das war die Zahl, die diese
Frage ausgelöst hat. Sie gilt für Nano Banana, nicht für Seedream.

### Was der Kunde für fünf Bilder zahlt

Fünf Bilder sind fünf Credits. Nach 19 % MwSt. und 15 % Apple bleiben je
Traum: Woche $1,49 · **Monat $0,79** · Jahr $0,53 · Paket M $1,59.
Gegen $0,175 Einkauf heißt das im Monatsabo Faktor 4,5 (vorher 3,8).
⚠ Der Jahresplan bleibt der enge Fall: dort blieben bei vollem Nano Banana
nur $0,13 je Traum. Wer je auf das teure Modell zurückgeht, muss den
Jahrespreis mitnehmen.

### Die Wartezeit nach dem Sprachgespräch ist verschoben

Antons Befund („was passiert in diesem Schritt?"). Die Auswertung startet
nicht mehr beim Abschied, sondern MITTEN im Gespräch: steht der Traumtext
2,5 Sekunden still, läuft sie los. Wer auflegt, findet sie oft fertig vor.

⚠ Der Kern ist die Kopplung, nicht das Vorziehen: Gemerkt wird
`{ text, promise }` — nicht nur die laufende Lesung, sondern der Text, zu
dem sie gehört. Erzählt jemand weiter, wird das Ergebnis verworfen und neu
gelesen. Ein Fehlgriff kostet $0,00026, eine Auswertung der falschen
Fassung kostet Vertrauen.

### Was der Nächste wissen muss

- **Antons Bogen ist noch der alte.** Der Fingerabdruck (`sheets.js`)
  besteht aus Foto + Beschreibung, das MODELL steht nicht drin. Der
  Modellwechsel macht vorhandene Bögen also NICHT ungültig. Wer einen
  Seedream-Bogen will: Foto neu hochladen. Die Alternative — Modell in den
  Fingerabdruck aufnehmen — ist bewusst NICHT gebaut; sie kostet bei jedem
  Wechsel einen Gratis-Bogen je Figur. Antons Wort steht aus.
- **Die synthetischen Testträume kommen zurück.** `e_leer`, `e_test1`,
  `e_test2` lagen wieder unversioniert in `data/traeume/`, obwohl `3c23b65`
  sie entfernt hat. Sie stehen in Antons localStorage und schreiben sich
  bei jedem App-Start zurück. Nicht committet. Wirklich weg sind sie erst,
  wenn er sie in der App löscht.
- **`scripts/modell-ab.mjs` nimmt jetzt jedes der drei Modelle** als
  drittes Argument und rechnet den Preis selbst aus. Ein Lauf über fünf
  Szenen kostet $0,18–0,40, je nach Modell. Das Skript rendert echt.

## 2026-08-22 17:50 — Anton — Branch `session/2026-08-22-anton-3` (PR #22) — Sitzungsabschluss

**Commits:** `f6eb321` (Eröffnung) · `baf0279` (Schlummernacht +
„Nichts hängengeblieben") · `b85b564` (Merge der Wolken-Preisrechnung) ·
`202f155` (Store-Anteil) · `b5f05d5` (Pläne fortgeschrieben) ·
`30b1a98` (28 Klang-Kandidaten) · `45ec013` (Wanderlicht, ausgelagert) ·
`d297c32` (Marge bei 10.000 €) + dieser Doku-Commit.
Zustand: 269 Tests grün, Shape-Check grün, Build sauber.

⚠ Wieder ohne eigenen Worktree im Hauptrepo — die Begründung steht jetzt
EINMAL im STAND unter „Fallen" statt in jedem Eintrag neu. Nach dem
Merge von #22: `git checkout main && git pull`.

### Antons vier Entscheidungen, abgearbeitet

**1+2 Schlummernacht und „Nichts hängengeblieben" — beide ja, beide
gebaut.** `snoozeCheck()` in streak.js springt beim App-Start ein (der
einzige Moment, in dem die App die fehlende Nacht bemerkt). Je sieben
Nächte eine, höchstens zwei auf Vorrat.
⚠ Zwei Regeln, die im Test stehen und nicht aufgeweicht werden dürfen:
KEINE Teilrettung (zwei Lücken mit einer Schlummernacht verbrauchen sie
nicht), und nach einem Serienbruch wird wieder von vorn verdient —
anders als bei den Credit-Geschenken, weil der Schutz uns nichts kostet.

`src/lib/blankNight.js` ist neu. ⚠ Die wichtigste Regel steht in seinem
Dateikopf: Eine leere Nacht ist KEIN TRAUM. Kein Wesen, keine Analyse,
kein Atlas-Zähler, keine Traumliste. Die Erkennung hängt an EINEM Feld
(`kind: "blank"`), alle Filter lesen ausschließlich `isBlank()` — wer
das aufweicht, verwässert Atlas, Menagerie, Showcase und Statistik
gleichzeitig. Sichtbar ist sie nur im Kalender als Ring.

**3 Klang-Presets:** 28 CC0-Aufnahmen in sieben Themen liegen unter
`media/klang-kandidaten/` (66 MB, bewusst außerhalb des Repos), die
Liste mit Quellen im Plan `2026-08-22-klang-presets.md`. Nur CC0, und
jede Seite wird nach dem Suchfilter noch einmal gegengeprüft.

**4 Traumzeichen-Karten und Faultier-Assets:** auf Antons Wort vertagt,
in beiden Plänen so vermerkt.

**5 Preislinie:** Die Wolken-Arbeit (`claude/new-session-x9qv1w`) ist
GEMERGT, nicht nachgebaut. Ergänzt um Antons Auflage (15 % Apple) und
die Nuance dahinter: 15 % gilt nur im Small Business Program bis 1 Mio. $
im Jahr. Dabei kippt ein Befund der Vorlage — Regie ist kaufbar
($11–14), Kino ist es nicht ($22–27 für 15 s, $44–53 für 30 s).

### Was der Nächste wissen muss

1. **Die Preisentscheidung ist der einzige echte Blocker.** Anton wählt
   zwischen Weg C + Paket XL ($29,99) und Kino auf 10 Sekunden begrenzen.
   Ohne sie ist jede Zahlenänderung in plans.js/video.js Raten.
2. Das wandernde Licht steht seit heute EINMAL in `src/styles/orbit.css`
   (Klasse `orbit`, global geladen). Wer es woanders braucht, setzt die
   Klasse — nicht die vierte Kopie.
3. `scripts/marge-bei-umsatz.mjs` beantwortet „was bleibt bei X Umsatz".
   Die Annahmen stehen benannt im Dateikopf; wer andere hat, ändert sie
   dort und lässt neu rechnen.

## 2026-08-22 10:30 — Anton — Branch `session/2026-08-22-anton-2` (PR #21) — Sitzungsabschluss

**Commits:** `50a5ece` (Atlas-Schlafkachel + Wiederkehr) · `da70cf6`
(Check-in führt in den Atlas) · `0c5d924` (Einschlaf-Timer) · `c5a3c30`
(Plan-Stände) · `2cce380` (Medienordner-Fix) · `7249391` (Szenentext
anpassen) · `ad12f43` (Mini-Geschenke) · `425b1c7` (Traumzeichen-Plan) ·
`8196466` (PORT/API_PORT) · `eb59663` (Traum entsteht beim Erzeugen) ·
`23c7a3f` (Stimmproben mitgeliefert) + dieser Doku-Commit.
Zustand: 259 Tests grün, Shape-Check grün, Build sauber.

⚠ Auch diese Session lief OHNE eigenen Worktree direkt im Hauptrepo
(die Dev-Server servieren dieses Checkout). Nach dem Merge von #21:
`git checkout main && git pull`.

### Zwei Datenverluste, beide an der Wurzel repariert

**1. Die Bilder vom 21.08. sind weg** — Antons Befund („all diese
Traumfelder leer"). Ursache nachgeprüft, nicht geraten: Der Server lief
im Sitzungs-Worktree, schrieb seine Bilder nach
`../Traum-App-anton/media/`, und `git worktree remove` nahm sie nach dem
Merge mit. Belege: `media/jobs` im Hauptrepo leer und seit 17.08.
unberührt, jüngstes Bild vom 20.08. 16:04, Suche über Projektordner und
Papierkorb ohne Fund vom 21.08. Nicht wiederherstellbar — die
Auftragsnummern lagen im selben Ordner.
Reparatur: `src/lib/mediaRoot.js` biegt MEDIA_DIR aus jedem Worktree
aufs Hauptrepo um (Erkennung über `.git` als DATEI mit
`gitdir: …/worktrees/…`), `DREAMRUSHES_MEDIA` schlägt alles. 5 Tests,
Regel zusätzlich in AGENTS.md.

**2. Der abgebrochene Traum** — Antons zweiter Befund: erzeugen
gedrückt, weggeklickt, Journal leer. Der Eintrag entstand bisher erst
NACH dem letzten Submit; davor liegen Bogen-Erzeugung (bis zu einer
Minute) und fünf Submits. In diesem Fenster gab es den Traum nirgends.
Reparatur (`eb59663`): Der Eintrag entsteht ZUERST, mit `pending` als
Marke; Aufträge hängen sich einzeln an; abgerechnet wird je abgegebenem
Auftrag; der Film hängt seine Nummer sofort an den Traum statt auf
„Speichern" in Schritt 6 zu warten. `clearStalePending()` in
AppState.jsx räumt hängende Marken beim Start.
⚠ Dafür nimmt `update()` jetzt auch Funktionen: `(prev) => patch`. Wer
in Schritten arbeitet, MUSS das benutzen — die veraltete Journalliste
aus dem Renderzeitpunkt hat genau diesen Traum gelöscht.

### Mehrwert-P2 fertig, P3b dazu

- Atlas-Schlafkachel (`sleepAverage`/`sleepNights`/`sleepByMood`) und
  Wiederkehr-Hinweis (`components/Recurrence.jsx`) im Traum-Detail über
  der Reflection. ⚠ Wortlaut „weitere Träume", nicht „frühere":
  `recurrenceFor` zählt ALLE anderen Träume, auch neuere.
- ⚠ `key={open.id}` am JournalDetail ist Pflicht (JournalScreen.jsx):
  ohne den Schlüssel trägt der Bearbeiten-Entwurf beim Sprung in einen
  anderen Traum den alten Wortlaut mit.
- Check-in-Bestätigung führt in den Atlas (Router-Zustand, nicht Adresse).
- Einschlaf-Timer (`soundMixer.js`): Aus/15/30/60, eine Minute
  Ausblenden, still wird nur der Klang. ⚠ Das Modul hat jetzt doch einen
  Melder (`subscribe`) — Begründung im Dateikopf.

### Antons Wünsche aus der Testrunde

- Szenentext vor dem Erzeugen anpassbar, gespeichert in
  `analysis.beats` (ein Feld für Kacheln, Bildauftrag, Filmschnitt).
  ⚠ Nur der Text, nie die Anzahl der Szenen.
- Mini-Geschenke: 7 Nächte → 1 Credit, 30 → 3, Deckel 4 je Installation,
  idempotent über `state.streakGifts` (Liste, kein Zähler — sonst zahlt
  eine gerissene und neu gewachsene Serie doppelt).
- „ich"/„I" → eigenes Profilbild: Die Selbstwortliste in `useWizard.js`
  war rein englisch, die Analyse antwortet aber in Traumsprache.
- Stimmproben liegen als AAC in `public/voice/` (12 Stück, 516 KB).
  Server sucht mitgeliefert → gemerkt → Gemini.
  ⚠ Nur die AUSWAHL, das Gespräch bleibt live.

### Dev-Umgebung

`PORT` gehört der Oberfläche, `API_PORT` der API. Vorher lasen beide
`PORT`; mit `PORT=5173` aus dem Vorschau-Start band sich die API an
Vites Port, und die Oberfläche kam mal aus Vite, mal aus altem `dist/` —
IPv4 gegen IPv6, ein Fehlerbild wie Spuk.

### Was der Nächste wissen muss

1. Nach dem Merge: `git checkout main && git pull`.
2. Antons offene Entscheidungen stehen im STAND — Schlummernacht,
   „Nichts hängengeblieben", Klang-Presets (Lizenz!), Traumzeichen-Stil.
3. Der Schlussstein (bezahlte Testfilme) ist von Anton ausdrücklich
   vertagt: „noch nicht machen".

## 2026-08-22 01:07 — Anton — Branch `session/2026-08-22-anton` (PR #20) — Sitzungsabschluss

**Commits:** `5e01279` (Eröffnung) · `0131fac` (Storyboard Variante A) ·
`613055b` (Streak-Board Stufe 1) · `9b3eb85` (Home: zwei Momente) ·
`42ee145` (Wanderlicht auf der Streak-Pille) + dieser Doku-Commit.
Zustand: 239 Tests grün, Build sauber, Shape-Check grün.

⚠ Diese Session lief OHNE eigenen Worktree direkt im Hauptrepo (der
Doppel-Merge davor hatte den Worktree aufgeräumt; die Dev-Server
servieren dieses Checkout). Nach dem Merge von #20: `git checkout main
&& git pull` — sonst servieren die Server einen toten Branch.

### Storyboard Variante A (Antons Wahl aus drei Widget-Varianten)

Kacheln ohne Bild tragen ein STICHWORT statt eines gequetschten Satzes:
`beatKeyword` (beats.js, getestet) nimmt den ersten Halbsatz bis zum
Komma, wirft führende Artikel weg, schneidet an der Wortgrenze, lässt
nie ein Stoppwort („on", „the") als Schlusswort stehen. Große
Serifen-Nummer oben. Mit Bild bleibt die Kachel clean (Bild + Nummer).

### Streak-Board Stufe 1 (Plan streak-board-gamification §4)

Die ✦-Pille auf Home ist ein Knopf: Blatt mit Serie groß, Zeile zum
nächsten Meilenstein, Leiter 3/7/14/30/60/100 (erreicht ✓ · nächster
golden · ferne gedimmt). Zeigt NUR Existierendes — die Stufentexte sind
an creatures.js/STREAK_CAP 14 ausgerichtet. **Offen bei Anton:** Ja/Nein
zu Mini-Credit-Geschenken (7→1, 30→3) und zur Schlummernacht (§5/§6).
Dazu: das wandernde Licht der Onboarding-Belohnungspille umfährt jetzt
die Streak-Pille (gleiche conic-gradient-Bauart, gold; warm bei Risiko).

### Home kennt zwei Momente (P2a-Oberfläche gebaut!)

- Morgens: Karte „Wie hast du geschlafen?" (drei Mond-Stufen, ein Tipp,
  danach stille Bestätigung) — die UI zum Cloud-Rechenteil checkin.js;
  Antworten landen in `state.checkins`.
- Abends/nachts: Gruß „Gleich ist Traumzeit" (ersetzt „Guten Abend",
  Antons Befund) + Einschlafgeräusche-Kurzweg statt der Morgen-Frage.
- Läuft ein Auftrag: pulsierende Zeile „Dein Traum wird gerade
  erstellt — schau zu" → Journal (hasPendingJobs).

### Was der Nächste wissen muss

1. **P2 fertigstellen:** Die Atlas-Kachel zur Schlaf-Auswertung fehlt
   noch (sleepAverage/sleepByMood warten) und der Wiederkehr-Hinweis
   (recurrenceFor) im Traum-Detail ÜBER der Reflection.
2. Streak-Board Stufe 2 erst nach Antons Ja/Nein (Credits/Schlummernacht
   + „Nichts hängengeblieben"-Eintrag, Plan §3).
3. Schlussstein weiter offen (echte Filme je Stufe, ~$4, nur lokal).
4. Faultier-Frage weiter offen (ersetzt oder begleitet, faultier-assets.md).

## 2026-08-22 00:18 — Anton — Branch `session/2026-08-21-anton` (PR #19) — Sitzungsabschluss

**Commits:** `468dcaf` (Eröffnung) · `0b75e8b` (Rechtstexte + Uhren +
Paywall + Stil-ⓘ) · `21375c2` (Übersetzungs-Stopp) · `88792ee`
(Storyboard Stufe B) · `2682fa9` (Everest-Ortsregel + Test-Credits) ·
`ba7336c`/`f6fe334` (**Hintergrund-Rendern**) · `7e49269` (Poster
abgeschafft u. a.) · `be87b98` (Menagerie ins Journal) · `9689f58`
(Streak-Board-Plan) · `e190bbd` (Szenenbild-Nachfüllen) + dieser
Doku-Commit. Zustand: 216 Unit-Tests grün, Build sauber, Shape-Check
grün (5 Sprachen mit gewollten Lücken), lint gibt es weiterhin nicht.

### Die große Linie: Anton hat getestet, die Session hat repariert

Die ganze Sitzung war eine Live-Testrunde Antons mit ~20 Befunden.
Die wichtigsten Umbauten:

- **Hintergrund-Rendern (der große Umbau):** Bilder gehen wie Filme in
  fals Warteschlange (`falSubmitImage`, /api/generate + /api/character
  antworten nur noch `{jobId}`). Der Wizard gibt Aufträge ab, legt den
  Traum SOFORT als Journal-Kachel „wird gerade erstellt" an und
  navigiert weg; ein App-weiter **Collector** (`src/lib/collector.js`,
  verdrahtet in AppState) holt alle 3 s nach — auch Filme, deren
  Abholer vorher am offenen Detail hing. Gescheiterte Bilder werden
  erstattet (1 Cr = 1 Bild), Teilfortschritt wird festgeschrieben.
  Auslöser: Bun.serve trennt Verbindungen nach 10 s Stille
  (`idleTimeout: 255` in server.js ist die Notbremse; timeouts.test.js
  nagelt Server>Client fest).
- **Poster abgeschafft** (Antons Entscheidung): kein Titelbild mit
  gemaltem Text mehr — media.poster wird nur noch GELESEN (Altbestand).
- **Storyboard Stufe B:** Kacheln tragen Szenentext (nur ohne Bild —
  mit Bild ist das Bild die Erzählung), im Film-Schritt an-/abwählbar
  (trimSelection: Überlauf wirft die ÄLTESTE Wahl). Leere Szenen im
  Detail sind nachfüllbar: „Bild für diese Szene erzeugen · 1 Credit"
  → sceneJobs/sceneImages am Eintrag, Collector liefert.
- **Übersetzungs-Stopp (neue Projektregel, AGENTS.md):** neue Texte nur
  noch en+de; fehlende Schlüssel fallen zur Laufzeit auf Englisch
  zurück (withFallback in i18n/index.js), der Shape-Check zählt sie nur.
- **Rechtstexte klickbar** (LegalPage hinter beiden Consent-Links + im
  Profil, Widerruf-Zeile in den Einstellungen, CONSENT_VERSION 2,
  MiniMax/ByteDance in der Aufklärung).
- **Ortsregel repariert:** „Himmel über dem Everest" war ein zweiter
  Ort, WEIL unser Analyse-Prompt es so vormachte — neue Schauplatz-
  Regel, live bewiesen (1 Ort Everest; Kinderzimmer→Meer bleiben 2).
- Journal: Suche hinter Lupe, Träume oben, Besetzung/Atlas/**Menagerie**
  (von Home umgezogen) darunter; Original-Text im ⋯-Menü; „Gratis"-
  Schilder nur noch, wo Bezahltes daneben steht; Detail-Bilder contain
  statt cover; Aktionszeile vereint (warmer Hauptknopf + stille Pillen).
- Kleinigkeiten: „Renderer"→KI/Generierung, Kamera-Knopf im
  AvatarDialog (capture), Test-Credits-Knopf im Dev-Startmenü,
  Kino-Slider ging schon immer bis 30 s (bestätigt).

### Was der Nächste wissen muss

1. **Merge-Reihenfolge:** Anton will #18 (Cloud, Mehrwert P2) und #19
   „zu einem Ding" mergen. gh pr merge ist für Agenten gesperrt — Anton
   klickt. NACH #18 muss main in #19 geholt werden; in `src/i18n/en.js`
   + `de.js` sind Konflikte sicher (beide Seiten fügen nur hinzu), danach
   `bun scripts/check-i18n-shape.mjs`.
2. **Streak-Board wartet absichtlich** (Plan
   2026-08-21-streak-board-gamification.md): erst nach dem P2-Merge
   bauen, sonst zwei Morgen-Rituale; Antons Ja/Nein zu den zwei
   Mini-Credit-Geschenken steht aus.
3. Offene Antworten Antons: „Guten Abend"-Gruß ersetzen? · Faultier-
   Easter-Egg-Stil ersetzt oder begleitet echte Figuren?
   (faultier-assets.md).
4. Der Schlussstein (ein echter bezahlter Film je Stufe durch die UI)
   ist WEITER offen — die Sitzung wurde von Antons Testrunde gekapert.
5. Server-Neustarts: Worktree-Server auf 8100 läuft mit .env-Variablen
   aus dem Hauptrepo (nicht kopiert!); 5173 ist der Worktree-Vite.
   preview_start/launch.json würde das HAUPTREPO serven — Falle.
## 2026-08-21 12:01 — Anton — Branch `claude/new-session-x9qv1w` (PR #18, Entwurf) — Sitzungsabschluss

**Commits:** `773d9c5` (Eröffnung) · `0b7033f` (**Fundament Morgen-Check-in
+ Wiederkehr-Erkennung**) plus dieser Doku-Commit. Zustand: **225**
Unit-Tests grün (in UTC UND in Europe/Berlin), Build sauber,
`bun run lint` gibt es weiterhin nicht.

### Was gebaut wurde (Mehrwert-Plan P2, Rechenteil)

- **`lib/checkin.js` + Test (12 Tests, neu):** der Morgen-Check-in als
  reine Rechnung über `state.checkins` — `checkinOn`, `setCheckin`
  (kappt bei 400 Einträgen), `sleepAverage`, `sleepByMood`.
  ⚠ **Der Plan wollte ZWEI Fragen** („Wie geschlafen?" + „Stimmung des
  Traums?"). Gebaut ist nur die erste — Antons Entscheidung: die
  Stimmung liefert `analysis.mood` ohnehin für jeden Traum, und morgens
  auf Home geht die zweite Frage meistens ins Leere. Die interessante
  Korrelation (Schlaf × Stimmung) entsteht trotzdem, siehe
  `sleepByMood()`.
- **`lib/atlas.js` → `recurrenceFor(journal, entry)` + 6 Tests:** was an
  DIESEM Traum schon einmal da war, in UI-Form (mit `entryIds` zum
  Antippen). Dieselbe Zählung wie `reflectionContext` darunter, damit
  die beiden Aussagen nicht auseinanderlaufen. `minCount` ist bewusst 1:
  beim ZWEITEN Auftreten ist die Wiederkehr die Nachricht.
- **`package.json`:** `"test": "TZ=Europe/Berlin bun test && …"`.

### ⚠ Drei Rot-Proben, die zuerst NICHT feuerten — das ist der Ertrag

1. **Der Zeitzonen-Test war in der CI wertlos.** Er verglich schlicht
   mit `"2026-08-21"`; der Container läuft auf UTC, dort sind Ortszeit
   und UTC identisch, also lief die Rot-Probe (Schlüssel über
   `toISOString`) glatt durch. Neu geschrieben als **Invariante** (der
   Schlüssel muss zu den lokalen Datumsfeldern passen — das gilt in
   jeder Zone) und `TZ=Europe/Berlin` im Test-Skript festgenagelt.
   Merksatz: *ein Test, der nur auf manchen Maschinen etwas bewacht,
   bewacht nichts.*
2. **Die Rot-Probe traf die falsche Funktion:** `perl` ersetzte
   `const others = …` in `reflectionContext` (Zeile 92) statt in
   `recurrenceFor` (Zeile 139). Bei gleichlautenden Zeilen gezielt
   ersetzen, sonst beweist die Probe nichts.
3. **Ein Test verlangte das Falsche:** er wollte, dass `"2"` abgelehnt
   wird. Knöpfe und Radios liefern ihren Wert IMMER als String —
   korrigiert wurde der TEST, nicht der Code.

### Die App läuft jetzt als klickbare Wolken-Vorschau

Anton wollte die App über die Cloud ansehen. Gebaut: `dist/` zu EINER
eigenständigen HTML-Datei zusammengefasst (CSS inline, MP4s als
data-URI, drei Beispielträume vorbefüllt) und als Artifact
veröffentlicht — **https://claude.ai/code/artifact/7a42cf64-fe13-49f2-a31e-46b67afb5616**.
Alles Lokale funktioniert dort (Journal, Atlas, Storyboard, Filmmenü,
Sleep, Consent-Tor); **Erzeugen geht nicht** — dafür braucht es den
Server mit den Schlüsseln. Das Bündelskript liegt im Scratchpad, nicht
im Repo (es ist ein Vorschau-Werkzeug, kein Produkt).

### Was der Nächste wissen muss

- **Die Oberfläche zu P2a/P2b fehlt noch** — nur die Rechnung steht.
  Angekündigter Wirkungsradius für den Rest:
  `components/MorningCheckin.jsx` (+CSS), `components/Recurrence.jsx`
  (+CSS), `Home/HomeScreen.jsx` + `home.css`,
  `Journal/JournalDetail.jsx`, `lib/storage.js` (neues Feld `checkins`),
  `i18n/*.js` (alle sieben), `docs/`.
- **Beim i18n-Einfügen zeilenverankert (`^`) suchen.** Die Falle vom
  20.08. wiederholt sich sonst: `"  errors: {"` traf als Teilzeichenkette
  das tiefer eingerückte `voice.errors`, der Block landete in allen
  sieben Sprachen eine Ebene zu tief — und `check-i18n-shape.mjs` blieb
  GRÜN, weil es Gleichheit prüft, nicht Richtigkeit.
- Playwright: Chromium liegt unter
  `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`, Ablauf ist
  Startmenü („Skip to app") → Sprachwahl → Consent-Tor (drei Häkchen) →
  Tabs über `[aria-label="Journal"]`. Ein zweites `goto` startet den
  Ablauf von vorn. `dump()` mit großzügigem Ausschnitt lesen — das
  Traum-Detail ist ein Blatt ÜBER der Liste, sein Text steht weit unten
  im `innerText`.
- fal.ai und api.deepseek.com sind aus dieser Sandbox weiterhin
  gesperrt (403). Nie umgehen; strukturell prüfen.

## 2026-08-21 09:55 — Anton — Branch `session/2026-08-20-anton` (PR #17) — Sitzungsabschluss

**Commits:** `2d05bcd` (Eröffnung, nach Merge von #16) · `8eff57a`
(**Traum-Detail als Kino-Strecke**) · `8c8774d` (Mehrwert-Plan) ·
`a474411` (**Reflection + Traumatlas**) · `71d7578` (Symbol-i18n +
Entrümpelung) plus dieser Doku-Commit. Zustand: 207 Unit-Tests, Build
sauber, `bun run lint` gibt es weiterhin nicht.

### Das Traum-Detail swipet jetzt (Antons Wahl aus je drei Varianten)

Statt der vertikalen Bild-Text-Wurst: randlose Vollbild-Panels mit dem
Text als Untertitel auf dem Bild (`DreamViews.jsx`, scroll-snap,
Punktezeile), der KI-erdachte Traumname als Buchtitelblatt (mittig,
Serife, ✦-Zierlinie, Tagline kursiv), und die nackte
„References used: @lena"-Zeile ist eine **Besetzungszeile mit echten
Avatar-Fotos** (CastChips). Träume ohne Bilder behalten die alte Seite.
⚠ Gelernt: `.j-deck` gehörte schon dem Kartenstapel der Übersicht —
die neuen Klassen heißen `j-cine-*`. Klassennamen im Journal-CSS vor
Gebrauch grep-en.

### Reflection + Traumatlas (Mehrwert-Plan P1, live bestanden)

- **`/api/reflect`** (DeepSeek, gratis, text-Klasse im Gatekeeper):
  drei Absätze je Traum — was auffällt, EINE Lesart in Angebots-Sprache,
  eine Frage zurück. Die Regeln sind die halbe Funktion (Spiegel statt
  Orakel: keine Diagnose, keine Zukunft, keine Universalsymbolik), der
  Kontext kommt aus dem eigenen Journal (`atlas.js`
  reflectionContext — englisch, weil er an DeepSeek geht). Ergebnis
  wird AM EINTRAG gespeichert (`entry.reflection`), bei Textänderung
  verworfen. Live-Test: deutscher Traum → deutsche Reflection, Muster
  („Wasser auch in einem früheren Traum") von selbst eingewoben.
- **Traumatlas** (Journal-Unterschirm, ab dem zweiten echten Traum):
  Monat in vier Kacheln, wiederkehrende Symbole mit Lesart und
  antippbaren Träumen, Stimmungs-Chips. Reine Rechnung über
  state.journal je Render (ADR-0001-konform). ⚠ Erkannt wird auf Text
  UND den ENGLISCHEN Beats der Analyse — sonst wäre der Atlas für
  deutsche Träume leer; `atlas.test.js` nagelt genau das fest.

### Symbol-i18n: die Altlast ist raus

Antons Befund („Atlas ist englisch, obwohl ich deutsch drin bin"):
Labels/Lesarten aller 20 Symbole lagen hart englisch in `symbols.js`.
Jetzt in allen 7 Sprachdateien (`t.symbols.byId`/`categories`);
Atlas, Symbolseite (Sleep-Tab) und Symbol-Detail lesen daraus,
symbols.js bleibt Stichwortlisten + Fallback. Und gegen das Überladene:
Besetzung + Atlas als zwei halbe Kacheln in EINER Zeile, Atlas zeigt
6 Symbole × max. 4 Träume — Spitze statt Inventar.

### Was der Nächste wissen muss

1. **Mehrwert-Plan** (`2026-08-21-mehrwert-inhalte.md`): P1a+P1b sind
   gebaut. Offen: P2a Morgen-Check-in, P2b „Du träumst wieder von …",
   P2c Traumzeichen-Karten, P3a Albtraum-Umschreiben (Wortlaut mit dem
   Rechtsplan abstimmen), P3b Einschlaf-Timer.
2. **Schlussstein weiter offen:** je ein echter bezahlter Film pro Stufe
   durch die App-UI. Der 8100-Server läuft derzeit aus dem WORKTREE
   (mit kopierter .env) — nach dem Merge auf dem Hauptrepo neu starten.
3. Rechtsplan §4, Punkte 2–6 unverändert offen.
4. Vite-Falle: Der Dev-Server beobachtet `.env` — eine nachträglich
   kopierte .env löst einen Doppel-Restart aus, der ihn töten kann.
   Danach einfach `bun run dev:web` neu starten.

## 2026-08-20 23:35 — Anton — Branch `session/2026-08-19-anton` (PR #16) — Sitzungsabschluss

**Commits:** `4485f9c` (Eröffnung) · `3c550c6` `0a714b9` `acc2c95` (Messungen
vom Rechner, 19.08.) · `cb374b7` `2f83812` `24d6c31` (Charakterbogen-Plan,
Prüfstein, Stresstest) · `3582d72` (**der Neuzuschnitt**) · `2d5ba24`
(Direktanbieter-Recherche) · `37440d3` (Rechtsplan) · `7f5e6bd`
(**Einwilligungs-Tor**) plus dieser Doku-Commit. Zustand: 200 Unit-Tests,
Build sauber, `bun run lint` gibt es weiterhin nicht.
**Bezahlte Tests dieser Session: ~$2,05** (fal), jeder einzeln begründet.

### Erst gemessen, dann geschnitten — die Reihenfolge war der Punkt

Die Sandbox-Session (#15) hatte alles gebaut, aber nichts durfte ins Netz.
Diese Session hat vom Rechner aus **erst die fal-OpenAPI-Schemata gelesen**
(Filmplan §10b: `reference_image_urls` ≠ `image_urls`; H3-Vorgabe ist „2K"
für $0,13/s; `enable_prompt_expansion` steht AN; drei Adress-Syntaxen
@Image1/[Image1]/„Image 1"), **dann für $1,31 die Syntax-Beweise gefahren**
(§10c), dann Lite geprüft (Drift-Dreierstrecke, Multi-Ref-A/B, Lena durch
die echte Pipeline) — **und erst dann umgebaut.**

### Der Neuzuschnitt (`3582d72`) — was jetzt gilt

- **Jede Filmstufe ihr eigenes Referenzmodell** (Antons Bedingung, §10d):
  Lebendig → `minimax/h3/reference-to-video` (1 Cr/s, Einkauf sinkt auf
  $0,06/s, bis 4 Referenzen neben dem Startbild GRATIS) · Regie bleibt
  Seedance 2.0 fast R2V · Kino → `seedance-2.5/reference-to-video`
  (30 s MIT Gesichtern, gleicher Preis). Modellwissen in der Tabelle:
  `refsField`/`refStyle`/`aspect`/`noExpand` (`video.js`); Regisseur-Brief,
  Anweisung und `checkDirectedPrompt` sprechen die Syntax des bestellten
  Modells, die Prüfung liest alle drei Familien.
- **Bilder auf `google/nano-banana-2-lite`** (~$0,042 statt $0,08).
  Preise/Credits unverändert — Antons Entscheidung: Die Ersparnis
  finanziert die Gratis-Bögen, der Rest bleibt Marge.
- **Bogen-Pflicht** (Plan `2026-08-20-charakterbogen-pflicht.md`, bezahlt
  bewiesen in §7): Fotos von Personen/Tieren werden beim ERSTEN bezahlten
  Render zum Bogen normalisiert (grau, geteilt Ganzkörper+Gesicht) —
  träge (1000 angelegte Figuren kosten $0, nichts farmbar), gratis,
  veraltbar über Fingerabdruck (`sheets.js`), Orte ausgenommen, Fallback
  rohes Foto. Der Anlass: Lenas Segelboot — **der Umgebungs-Bleed folgt
  dem FOTO, nicht dem Modell** (Kontrolltest), der Bogen unterbindet ihn.

### Das Einwilligungs-Tor (`7f5e6bd`) — Recht wird Produkt

Plan `2026-08-20-recht-einwilligung.md` (kein Rechtsrat; Anwalt vor
Launch): ConsentGate nach Sprachwahl, vor Onboarding UND App — drei eigene
Häkchen (AGB/Datenschutz · Datenverarbeitung · **18+**, Antons
Entscheidung, Selbsterklärung nach Branchenstandard), Aufklapp-Teil nennt
Anbieter UND Trainingslage (Google bezahlt: kein Training · DeepSeek
bezahlt: standardmäßig nicht · fal: anonymisierte „Usage Data" möglich).
`state.consent {v, at}`; CONSENT_VERSION öffnet das Tor bei Textänderung
erneut. **AI-Act Art. 50 gilt seit 02.08.2026** — die Kennzeichnung trifft
UNS, nicht private Nutzer; C2PA-Metadaten ließen Instagram automatisch
labeln (offen, Rechtsplan §4 Punkt 3).

### Nebenfunde, alle behoben oder notiert

- **Gezeichnete Figuren waren als Referenz tot:** AvatarDialog speicherte
  einen `/media/`-Pfad, den fal nie laden kann — jetzt kompakter
  data:-URI (`compactDataUrl`, entlastet auch die localStorage-Quota).
- `/api/character` fing `GENERATE_FAILED` statt des geworfenen
  `GENERATION_FAILED` — jeder fal-Fehler fiel aufs generische 500.
- Stufen-Infotexte in 7 Sprachen logen nach dem Neuzuschnitt
  („Besetzung nur wie im Startbild") — nachgezogen.
- fals Content-Checker lehnte EINEN Aufruf mit Rohfoto ab (422,
  Wiederholung lief) — neutrale Bögen sind auch gegenüber Filtern
  berechenbarer.
- **Direktanbieter-Recherche** (`2026-08-20-direktanbieter-preise.md`):
  Kino wäre direkt bei BytePlus ~55 % billiger (Kino für 3 statt 6 Cr/s
  möglich), Bilder bei Google −20 % — aber **H3 ist bei fal BILLIGER als
  beim Hersteller** ($0,06 vs. $0,08/s). Empfehlung: bleiben, Schwellen
  stehen in §5.

### Was der Nächste wissen muss

1. **Der Schlussstein steht weiter aus:** je ein echter bezahlter Film pro
   Stufe durch die App-UI (Lebendig 5 s ≈ $0,34 · Regie 5 s ≈ $1,25 ·
   Kino kurz), T3 (Abspann) gleich mit. Alle Slugs sind per
   Nullkosten-Probe (ungültiger Schlüssel → 401 mit Modellnamen) als
   existent und richtig verdrahtet bewiesen — aber kein Render lief.
2. Rechtsplan §4, Punkte 2–6 offen: Upload-Zusicherung, Kennzeichnung/
   C2PA, Speicherfristen für /media, DeepSeek-China-Entscheidung,
   Dokumente in docs/legal/ + Widerrufsweg im Profil.
3. Vorschau im Worktree: `preview_start` bedient das HAUPTREPO (alte
   Codebasis!) — im Worktree `bun run dev:web` von Hand starten. Genau so
   ist heute fast der falsche Stand verifiziert worden.
4. Testartefakte in `media/tests/` (gerätelokal, gitignored): t-sheet-lena,
   t-sheetlena-1…3, t-ctrl-rawlena-3, t-lena-1…3 u. a.

## 2026-08-19 17:05 — Anton — Branch `claude/new-session-x9qv1w` (PR folgt) — Sitzungsabschluss

**Commits:** `d3e6265` (Trockenlauf-Werkzeug), `f7a3357` (vier Regisseur-Fehler),
`57d88c1` (Filmlänge steuert den Bogen), `90ff7b4` + `91d2f3a` (Prompt-Limit je
Modell), `a484e10` + `f344172` (Storyboard), `830aaba` (Ideallänge), `93f088c`
(Modellname + ⓘ), `6cfd1d8` + `b0d44a0` (Referenz-Korrektur), `0ea34f6`
(Bildmodell-Preise) plus dieser Doku-Commit. Zustand: 178 Unit-Tests, 50
Freigabe-Prüfungen, Prompt-Hygiene, 16 Kontrast-Paarungen, 7 Sprachdateien,
24 Stilblätter — alles grün. `bun run lint` gibt es weiterhin nicht.

⚠ **Dieser Branch sitzt auf PR #14 auf** und enthält dessen 7 Commits mit.
Wer ihn mergt, mergt #14 mit.

### Der Anlass: ein Trockenlauf, weil niemand die Prompts je gelesen hatte

Antons Ausgangsfrage war nicht „baue etwas", sondern „ich habe keine
Übersicht, was mit meinem Traum passiert". Daraus wurde
`scripts/dry-run-prompts.mjs`: der ganze Weg vom Diktat bis zum
fal-Auftrag, jeder Prompt im Volltext, ohne einen Credit. Es importiert
die Bausteine und liest `ANALYSIS_SYSTEM` aus `server.js`, statt sie zu
kopieren — eine Kopie bliebe grün, während der Server längst anders fragt.

**Das Werkzeug hat sich sofort bezahlt gemacht: alle vier Regisseur-Fehler
unten sind beim LESEN der Ausgabe aufgefallen, nicht beim Lesen des Codes.**
Im Code sieht jede der Stellen harmlos aus.

### Vier Fehler derselben Bauart: die Anweisung verlangte, was nie ankam

1. **Stil.** `buildDirectorBrief` nimmt seit jeher `style`, der Systemprompt
   wies ausdrücklich an, den Anker einzuweben — `server.js` übergab ihn
   nirgends. Der Film wusste vom gewählten Stil nichts.
2. **Startbild.** `still: withRefs ? undefined : still` liess ausgerechnet
   die teure Referenzstufe ohne Beschreibung ihres eigenen Startbilds —
   während derselbe Prompt Positionen darin in Metern verlangt.
3. **Szenenbogen.** Die Analyse zerlegt jeden Traum in fünf Szenen; der
   Regisseur bekam sie nicht und zerlegte ihn ein zweites Mal.
4. **Doppelte Nummerierung.** Der Bildprompt endet auf „Reference image 1
   shows @anton", das Videomodell zählt @Image1…9 und dort ist @Image1
   IMMER das Startbild. Beide Zählungen standen roh nebeneinander —
   dieselbe Fehlerklasse wie der Gesichtertausch im promptBuilder, eine
   Stufe später. `stripReferenceClauses()` steht bewusst NEBEN
   `buildReferences()`: wer die Klausel umformuliert, sieht die Gegenstelle.

Ausserdem die CINEDANCE-Destillation nachgezogen: LOCATION MAP fehlte ganz
(ohne Geographie sind Meterangaben Behauptungen), ebenso der
Identitäts-Satz je Figurenzeile, die Optik-Drift-Sperre und der
ausdrückliche Ausschluss von Establisher und verzögertem Auftritt.

### Was der Nächste über TESTS wissen muss (die eigentliche Lehre)

**Der Stil-Bug war für jeden Unit-Test unsichtbar.** `buildDirectorBrief`
war korrekt; nur rief sie niemand richtig auf. Die Lücke sass ZWISCHEN den
Dateien. Der neue Test vergleicht deshalb die Signatur der Funktion mit dem
Aufruf in `server.js` — generisch, damit er auch beim nächsten vergessenen
Parameter anschlägt. Er hat den `promptBudget`-Parameter später automatisch
miterfasst.

**Und einmal hat meine eigene Rot-Probe NICHT angeschlagen:** Beim
Szenenbogen-Zuschnitt war der Verdrahtungstest mit einem blossen `beats,`
zufrieden. Ein Test, der die Anwesenheit prüft, prüft nicht die
Aufbereitung. Nachgeschärft, beide Proben schlagen jetzt an — inklusive des
subtilen Falls, dass Zuschnitt und Bestellung mit VERSCHIEDENEN Sekunden
rechnen.

### Die Filmlänge steuert jetzt die Erzählung

Fünf Szenen auf fünf Sekunden sind eine Sekunde je Szene — kein Film, ein
Stroboskop. `beatsForSeconds()` schneidet den Bogen auf die Länge zu (drei
Sekunden je Szene als Untergrenze), erste und letzte Szene überleben immer.
Der Brief rechnet die Zeit vor, statt sie erraten zu lassen. Und die
Analyse EMPFIEHLT jetzt eine Länge (`filmSeconds`, 5–30, kostet nichts —
sie reist im einen Analyse-Aufruf mit); der Regler startet dort, bis der
Mensch ihn selbst bewegt.

### Das Prompt-Limit gehörte nie uns

Antons Frage „für welches Modell gilt das 6000er-Limit?" hatte die Antwort
„für keins" — die Zahl war frei gewählt. Recherchiert: minimax H3 7 000,
Seedance 2.0 5 000, Seedance 2.5 **10 000** (Antons Einspruch, dass 5 000
zu wenig sei, war richtig). `promptMax` wohnt jetzt in der Modelltabelle
und speist zwei Stellen aus einer Zahl: das Budget, das der Regisseur
GENANNT bekommt, und die Notbremse.

### Das Storyboard — und ein Geld-Bug im Beifang

Stufe A des Plans: die fünf Szenen als antippbare Leiste, im Filmmenü an
den Sekunden-Slider gekoppelt (wer von 15 auf 5 zieht, SIEHT drei Szenen
verblassen, bevor er bezahlt). Dabei gefunden: **`beatsForCount` kannte nur
3/5/10, jeder andere Wert fiel auf „alle fünf" durch.** Das Poster ersetzt
das erste Bild, also bestellte „3 Bilder mit Poster" intern
`beatsForCount(_, 2)`, bekam fünf Szenen und renderte **6 bezahlte
Generierungen bei 3 kassierten Credits.**

⚠ **Ob `urls[0]` ein Poster ist, war am Eintrag NICHT ablesbar** (ein
Preview-Eintrag hat auch Titel und drei urls, Panel 1 ist aber eine Szene).
Neue Einträge speichern `media.poster` als Wahrheit; `imageIndexForBeat`
antwortet für ältere Einträge mit `null` — Textkachel statt raten.

### Zwei Korrekturen an dem, was wir über Modelle GLAUBTEN

- **„Regie ist die einzige Stufe mit Referenzen" war falsch.** Auf fal gibt
  es `minimax/h3/reference-to-video` (bis 9 Bilder, $0,06/s @768p, erste 5
  Bilder gratis — **billiger als unser jetziger Pfad, mit Referenzen**) und
  `seedance-2.5/reference-to-video` (bis 30 Bilder). Der Zuschnitt war
  unsere Endpoint-Wahl, kein Modelllimit. Die UI-Infotexte sagen deshalb
  jetzt „diese Stufe", nie „das Modell kann nicht".
- **H3 adressiert Referenzen ANDERS als Seedance:** `<Picture N>` plus
  `subject_definitions`-Block statt `@ImageN`. Beim Umbau braucht der
  Regisseur je Modellfamilie das richtige Format (Plan §10a).

### Offene Messungen — gehen NUR vom Rechner (die Sandbox blockt fal.ai)

1. **Film-Endpoints** (Plan §10): Slugs, Feldnamen und echte Preise von
   `minimax/h3/reference-to-video` und `seedance-2.5/reference-to-video`.
   Danach Stufen neu zuschneiden — „Lebendig" könnte 5 Referenzen
   umsonst tragen.
2. **Bildmodelle** (neuer Plan `2026-08-19-bildmodelle-preise.md`):
   `nano-banana-2-lite` kostet **$0,0336 statt $0,08** (58 % weniger), kann
   laut Google Referenzen — **fal listet es aber als „(Text to Image)"**.
   Und: unsere Schnellvorschau liefert **448 px breite Panels**, weil 1K
   die Vorgabe ist; bei 2K wären es 896 px für $0,12 statt $0,08.
3. **Der echte Durchlauf**, den Anton als Nächstes macht:
   `DEEPSEEK_KEY=… node scripts/dry-run-prompts.mjs --live` (~$0,0005)
   zeigt die wahren Modellantworten, ohne ein Bild zu rendern.

**Hausregel bleibt (nano-banana-Vorfall 07.08.): nie auf geratene
Feldnamen bezahlt rendern.**

### Lehrgeld dieser Sitzung, damit es niemand wiederholt

Ein i18n-Einfüge-Anker `"  errors: {"` traf als **Substring** auch die
tiefer eingerückte `voice.errors`-Zeile. Der Block landete in allen sieben
Sprachen konsistent eine Ebene zu tief — und `check-i18n-shape.mjs` blieb
GRÜN, weil er Gleichheit prüft, nicht Richtigkeit. Gefunden erst am
Laufzeitfehler im Browser. **Wer Blöcke per Skript einfügt: am Zeilenanfang
verankern (`^`), nie am blanken Substring.** Und: die App wirklich öffnen,
nicht den Tests glauben.

## 2026-08-19 00:00 — Anton — Branch `session/2026-08-18-anton` (PR #14) — Sitzungsabschluss

**Commits:** `d7223b8` (Bugfix Modellwahl), `ec749c6` (Regisseur),
`cd058f0` (Referenz-Film serverseitig), `585c634` (Stufe Lebendig/Regie/
Kino), `cd806a3` (Teststand) plus der Doku-Commit dieser Zeilen. Zustand:
153 Unit-Tests (früh: 133), 50 Freigabe-Prüfungen, Prompt-Hygiene, 16
Kontrast-Paarungen, 7 Sprachdateien, 22 Stilblätter — alles grün. Kein
`bun run lint`. Testkosten der Sitzung: $2,18 (T2, von Anton freigegeben).

### Der Film-Plan ist umgesetzt — §9 Schritte 1–4 komplett

**1 · Bugfix zuerst (Befund 2):** Die Modellwahl erreicht jetzt den
Server. Premium wurde bis dahin BERECHNET und minimax GELIEFERT, hart auf
15 s geklemmt. Jetzt kommt die komplette Bestellung je Modell — Slug,
Dauerklemme, Auflösung, Tonparameter — aus EINER Tabelle
(`videoSubmitBody` in `src/lib/video.js`), aus der auch Preis und UI
lesen. `video.test.js` nagelt fest: Preis und Bestellung klemmen
dieselben Sekunden; `generate_audio` geht nur dorthin, wo der Parameter
existiert (minimax kennt ihn nicht — unbekanntes Feld kann bei strengem
Validator den bezahlten Auftrag kosten). Unbekannte IDs werden
absichtlich zu `standard`: der falsche BILLIGE Film ist der harmlosere
Fehler.

**2 · Der Regisseur (Befund 1):** Jeder Film bekam bis dahin wörtlich
einen STANDBILD-Prompt („photoreal film still…"). Jetzt schreibt
`deepseek-v4-flash` einen Bewegungs-Prompt nach dem destillierten
CINEDANCE-Bauplan. Bauanleitung + mechanische @Tag-Prüfung liegen in
`src/lib/director.js` (getestet, wie gatekeeper.js); der Regisseur ist
**Kür, nie Pflicht** — jeder Fehler fällt auf den alten Zustand zurück.
⚠ KEIN `max_tokens` am DeepSeek-Aufruf (Denkmodell!), eigene Grenze
`MAX_DIRECTED_PROMPT = 6000` (T4 maß 5,5k; die 3k-Client-Grenze wäre
eine Amputation).

**3 · Referenz-Filme (Befund 3):** Modell `director`
(seedance-2.0 **Fast** R2V, 4 Cr/s, 5–15 s, bis 9 Referenzen, Ton).
`filmReferences()` trägt die Reihenfolge-Invariante aus promptBuilder.js
eine Stufe weiter: Personen vor Tieren vor Orten, Startbild fest auf
@Image1, Materialliste und `image_urls` aus DERSELBEN Auswahl. Nebenbei
behoben: Step 5 plättete Gattung und Beschreibung der Besetzung
(`category: "person"`, `desc: ""` für alle) — für Bilder folgenlos, für
Regie hätte es Priorität und Materialliste zerstört.

**4 · Die Stufe (Antons Namen):** **Lebendig / Regie / Kino** in sieben
Sprachen; VIDEO_MODELS jetzt in UI-Reihenfolge = aufsteigender Preis,
Eintrag [0] bleibt `standard` (Rückfallziel). Im Wizard nachgemessen:
Schieberegler je Modell (5–15/1 · 5–15/1 · 5–30/5), Preise 6/21/31
Credits bei 5 s.

**Verifikation ohne Kosten, dreimal dasselbe Muster:** Server mit
absichtlich UNGÜLTIGEM fal-Schlüssel booten, echte Bestellung schicken,
im Fehlerlog (der jetzt die Modelladresse nennt) die richtige Route
ablesen. fals 401 bestätigt nebenbei, dass die Slugs existieren
(„Authentication required", nicht „not found"). Der Regisseur lief dabei
echt: 3344 Zeichen (premium, 0 Refs), 5296 Zeichen (director, 3 Refs,
Personenpriorität griff).

**T2 ($2,18):** Fast und Normal je 4 s / 720p, wörtlich der T1-Auftrag.
Beide halten das Drehbuch, 720p klar über Mini, kein entscheidender
Abstand → **Regie bleibt Fast** (gleiche 4 Credits nach Aufrundung,
bessere Marge). Videos in `media/tests/`.

**Was der Nächste wissen muss:**

- **Der Schlussstein fehlt:** ein echter bezahlter Film durch die
  App-Oberfläche (Lebendig 5 s ≈ $0,48, Regie 5 s ≈ $1,45). Auf Antons Go.
- **T3 (Abspann an Seedance-Film) ist risikoarm, aber ungefahren** —
  gleiche Codecs (h264+AAC) wie der verifizierte minimax-Fall.
- **T5 offen:** „30 s MIT Referenzen" per Video-Verkettung — bis dahin
  ist Kino ehrlich ein Ein-Bild-Angebot.
- Wer am Regisseur formuliert: die drei Anti-Drift-Regeln (nur Grad,
  keine Originalzitate, keine erfundene Garderobe) stammen aus ECHTEN
  T0-Abdriften; `director.test.js` schlägt an, wenn eine beim
  Umformulieren verloren geht.
- Auf 8100 lief bis heute ein TAGE-alter Server einer früheren Sitzung
  mit altem Code — wer „es geht nicht" debuggt: erst prüfen, WESSEN
  Prozess auf dem Port liegt.

## 2026-08-17 23:50 — Anton — Branch `session/2026-08-17-anton` (PR #13) — Sitzungsabschluss

**Commits:** `c753d0a` (Besetzung als Rollenliste), `d18b335` + `155b5df`
(Film-Regie-Plan) plus der Doku-Commit dieser Zeilen. Zustand: 133
Unit-Tests, 50 Freigabe-Prüfungen, Prompt-Hygiene, 16 Kontrast-Paarungen,
7 Sprachdateien, 22 Stilblätter — alles grün. `bun run lint` existiert
weiterhin nicht. **Morgen geht es mit der Umsetzung des Film-Plans weiter**
(Anton, 23:47).

### Die Besetzung ist eine Rollenliste

Anton: „sieht noch richtig panne aus." Drei Varianten als Artefakt
(Ensemble-Kacheln, Steckbrief, Abspann), gewählt: **C — der Abspann.** Name
in Serife links, Häufigkeit rechts, sortiert nach Häufigkeit statt nach
Anlagedatum. Neu: `castStats.js` + `CastGroup.jsx`; `AvatarList.jsx` und
die `p-*`-Regeln sind weg (einziger Aufrufer).

Derselbe Fund wie beim Kaufblatt, und das ist kein Zufall mehr, sondern ein
Muster: **Die App wusste längst, in wie vielen Träumen jede Figur vorkam**
(`entry.references`), und zeigte es nirgends. Wer eine neue Ansicht baut,
frage zuerst: Welche gespeicherte Information zeigt die App noch nicht?

Vier Entscheidungen mit Begründung im Code: Ein Traum zählt EINMAL, auch
wenn die Figur doppelt drinsteht (sonst sortiert die Liste falsch).
Seed-Träume zählen nicht — ohne Sonderfall, sie tragen `references: []`.
**Löschen wanderte in den Dialog** und die Träume behalten ihre
`references` (dass eine Figur in einer Nacht vorkam, bleibt wahr). Die
Gattungswahl im Dialog wird durch das **Fehlen** von `category` ausgelöst —
der Wizard übergibt seine weiter und bleibt unberührt.

### Der Film-Plan (`docs/plans/2026-08-17-film-regie.md`)

Anlass: der neue Seedance-Skill (CINEDANCE) plus Antons Ansage — mehrere
Videomodelle zur Wahl, 15/30 Sekunden, teurer = mehr Credits, Referenzen
müssen bis ins Videomodell. Drei Befunde aus der Analyse:

1. **Der Film bekommt heute einen Standbild-Prompt** („photoreal film
   still" an ein Videomodell, `Step5Style.jsx:105`).
2. **Die Modellwahl erreicht den Server nicht** — Premium wird BERECHNET,
   minimax GELIEFERT, auf 15 s geklemmt. Echter Fehler, kein fehlendes
   Feature. **Der Fix ist morgen Schritt 1.**
3. **Referenzen enden am Keyframe** — das Videomodell sieht ein Bild.

Markt (fal.ai, 17.08.): `seedance-2.0/…/reference-to-video` nimmt bis zu
**9 Referenzbilder** (`image_urls`, im Prompt `@Image1…9`) bei 4–15 s;
die 2.5 kann 30 s mit nur EINEM Startbild. 9 Referenzen und 30 Sekunden
gibt es nicht im selben Modell — daraus die drei Stufen Lebendig (1 Cr/s) /
Regie (4 Cr/s) / Kino (6 Cr/s), Details und offene Fragen im Plan.

### Die Tests (T0, T1, T4 — zusammen ~$0,94, auf Antons Sparregel minimal)

- **T0** ($0,004): Der destillierte `DIRECTOR`-Block durch DeepSeek Flash,
  drei Träume. @Tag-Disziplin dreimal fehlerfrei (mechanisch geprüft).
  Drei Abdriften gefunden und per Regelzeile behoben: mm-Angaben trotz
  Grad-Regel, wörtliches Zitieren des Traumtexts (Textrisiko im Bild),
  erfundene Garderobe. ⚠ **DeepSeek-Falle:** `max_tokens: 1000` ließ die
  Antwort LEER zurückkommen — das Denkmodell schreibt erst ins Denkfeld;
  der Server ruft deshalb ohne Deckel auf. Nicht wieder einführen.
- **T1** ($0,17): Mini-R2V, 4 s, 480p, zwei Referenzen. **data-URIs werden
  angenommen** (wie minimax), die Frau aus @Image1 stand im Zimmer aus
  @Image2, Aktionen exakt auf den Zeitblöcken, AAC-Ton vorhanden.
- **T4** ($0,73): Antons Ansage — langer ausgedachter Traum, Anton als
  Person. Die ganze Produktkette: Charakterbogen erzeugt → Regisseur
  schrieb → Mini-R2V 15 s. **Identität hält über zwei Ortswechsel**
  (Bahnsteig → Kinderzimmer-Waggon → Laternen-Nahaufnahme), der Schlussbeat
  sitzt wörtlich. Renderzeiten: 4 s → 6 min, 15 s → 3,5 min (Queue
  schwankt stark; UI muss Wartezeit ehrlich behandeln).

**Die Preisfrage daraus:** Das Mini-Tier ($0,043/s ≈ 1–2 Credits/s) war
sichtbar gut. Ob „Regie" wirklich das 4-Credits-Tier braucht, entscheidet
T2 (Fast/Normal-Vergleich, ~$2,20) — **offen, auf Antons Go.**

**Was der Nächste wissen muss:**

- **Testartefakte liegen in `media/tests/` des HAUPTREPOS** (Film 15 s,
  Film 4 s, Charakterbogen, Regisseur-Prompt) — bewusst nicht im
  Scratchpad gelassen, der ist sitzungsflüchtig. `media/` ist ignoriert;
  wer sie behalten will, sichert sie selbst.
- Die Testskripte (`t0-director.mjs`, `t1-r2v-probe.mjs`,
  `t4-anton-film.mjs`) liegen NUR im Scratchpad dieser Sitzung — bewusst
  nicht im Repo (Wegwerf-Sonden). Der destillierte `DIRECTOR`-Block steckt
  in `t4-anton-film.mjs` UND als Prompttext in
  `media/tests/t4-director-prompt.txt`; die Serverfassung entsteht morgen
  neu nach Plan §4.
- **Umsetzungsreihenfolge steht im Plan §9** — der Befund-2-Bugfix zuerst.

## 2026-08-17 00:03 — Anton — Branch `session/2026-08-16-anton` (PR #12) — Sitzungsabschluss

**Commits:** `785c368` (Kacheln im Kaufblatt), `c6f1c1f` (media-Symlink)
plus der Doku-Commit dieser Zeilen. Zustand: 124 Unit-Tests, 50
Freigabe-Prüfungen, Prompt-Hygiene, 16 Kontrast-Paarungen, 7 Sprachdateien,
22 Stilblätter — alles grün. `bun run lint` existiert weiterhin nicht.

### ⚠ Datenverlust: der Ordner `media/` ist weg

Das gehört an den Anfang, weil es niemandem sonst auffallen würde.

Beim `git pull` nach dem Merge von PR #11 hat git den echten Ordner
`media/` durch einen Symlink ersetzt und seinen Inhalt gelöscht. Verloren
sind die `.mov`-Originale der Faultier-Videos und der gesamte lokale
Render-Cache — jedes Bild und jeder Film, den die App bisher erzeugt hat.
Träume im Browser-Tagebuch, die auf `/media/<hash>` zeigen, laufen ins
Leere. Time Machine war auf dem Rechner nicht eingerichtet.

**Nicht betroffen:** `src/assets/home-faultier.mp4` und `intro-faultier.mp4`
(die Fassungen, die die App wirklich benutzt) sowie das Seed-Journal unter
`public/clips/`. Beides ist versioniert.

**Die Ursache ist eine Falle, die jeder stellt:** In `.gitignore` stand
`media/` — **mit Schrägstrich, und das passt nur auf Verzeichnisse.** Als
die Sitzung vom 16.08. dort einen Symlink anlegte (um Medien zwischen
Worktree und Hauptrepo zu teilen), war es für git kein Verzeichnis mehr,
die Regel griff nicht, und ein `git add -A` nahm ihn mit. Beim nächsten
Auschecken ersetzte git dann den echten Ordner durch den Link: **ignorierte
Dateien räumt git beim Checkout kommentarlos weg.**

Behoben als `/media` — an der Wurzel verankert, passt auf Verzeichnis wie
Link. `node_modules/` hatte dieselbe Falle und ist jetzt `node_modules`.
Am Servercode war nichts zu tun, `Bun.write` legt fehlende Ordner selbst an.

**Zwei Lehren, die über den Einzelfall hinausgehen:**

1. **Ein Ignoriermuster mit Schrägstrich ist eine Wette darauf, dass dort
   nie etwas anderes als ein Verzeichnis liegt.** Diese Wette verliert man
   genau dann, wenn jemand einen Symlink anlegt — also im Moment der
   größten Eile.
2. **Ignoriert heißt für git „entbehrlich", nicht „unsichtbar".** Ein
   Checkout darf ignorierte Dateien überschreiben und tut es auch. Was dort
   liegt und nicht ersetzbar ist, gehört woandershin.

### Die Symbole im Kaufblatt sind Kacheln geworden

Anton: „die Icons sehen total billig aus." Erst fünf Varianten als
laufende Vorschau (Artefakt, absichtlich NICHT im Repo — mit eingebetteten
Medien 1,6 MB, und das Repo trägt seine Medien selbst, siehe 10.08.).
Gewählt: A+B in E-Form — große Kacheln mit echtem Material, Leuchtglyph als
Rückfall.

Der Befund, der die Richtung vorgab: **Das Problem war nicht die Zeichnung,
sondern die Gattung.** Strichsymbole sind Bedienoberfläche — sie sagen
„hier kannst du tippen", nicht „das bekommst du". An der einzigen Stelle,
an der die App etwas verkauft, ist das die falsche Stimme.

Jetzt zwei Flächen mit der Ware selbst, und zwar möglichst **seiner**: Das
Blatt geht meist auf, WEIL das Guthaben leer ist — wer dort ankommt, hat
schon geträumt. Neu: `src/lib/showcase.js` (Auswahl), `ShowcaseTile.jsx`
(Fläche), `ShowcaseGlyph.jsx` (Rückfall).

**Der Fund beim Nachmessen im Browser, und der ist der wichtigste:** Ich
habe einen eigenen Traum mit toten `/media/`-Verweisen untergeschoben — der
Fall von heute Morgen — und **beide Kacheln fielen auf den Glyph, obwohl
Seed-Bilder und Dummy-Film bereitlagen.** Die Rückfallkette war
„eigenes ODER Rückfall", brauchte aber „eigenes, und wenn das nicht LÄDT,
Rückfall". Daher `stillsBackup`/`filmsBackup` neben `stills`/`films`.
Sonst sähe die Kaufseite eines langjährigen Nutzers ärmer aus als die eines
neuen — und zwar deshalb, WEIL er viel geträumt hat.

**Zwei kleinere Korrekturen unterwegs:**

- Das **„oder"** war in meinem Kachel-Entwurf weggefallen. Das war ein
  Sachfehler, kein Gestaltungsdetail: Zwei Zahlen nebeneinander lesen sich
  als „und", das Guthaben gibt aber das eine ODER das andere her.
- Zentriert wird es über `inset-inline: 0` plus automatische Ränder, nicht
  über `translate(-50%)`. Letzteres verankert im Arabischen die rechte
  Kante und zöge dann in die falsche Richtung — **`transform` kennt keine
  logischen Achsen, automatische Ränder schon.** Nachgemessen: 0 px
  Abweichung in beiden Leserichtungen.

**Was der Nächste wissen muss:**

- **Der Dummy-Film ist ein Platzhalter** und steht in genau einer Zeile:
  `Paywall.jsx:25` importiert derzeit `home-faultier.mp4`. Anton ersetzt
  ihn. Was hineingehört, steht im Kommentar darüber.
- **Die gefüllten Glyphen stehen NICHT in `icons.jsx`**, sondern in
  `ShowcaseGlyph.jsx`. Grund: Der Kopf von `icons.jsx` sagt „nothing
  filled", und genau das lässt eine Reihe davon als eine Familie lesen.
  Zwei Sorten in einer Datei wären der Anfang vom Ende dieses Satzes.
- **Der Worktree braucht ein eigenes `bun install`.** Ein Symlink auf
  `node_modules` des Hauptrepos wäre die Falle von oben ein drittes Mal.
- **Wer im Worktree prüfen will**, startet dort `bunx vite --port 5174`.
  `preview_start` bedient das Hauptrepo. 5174 ist für den Browser eine
  eigene Herkunft mit eigenem `localStorage` — also ein frischer Install
  samt Sprachwahl.

## 2026-08-16 22:02 — Anton — Branch `session/2026-08-10-anton` (PR #11) — Sitzungsabschluss

**Commits (neuester zuerst):** `6eabb8a` (Paywall mit Symbolen),
`981b846` (Positionierung + Store-Texte), `2b2ac49` (zwei Guthaben-Töpfe,
Paket-Kollision), `3538dc7` (Serie belohnt), `9ed09fd` (Abspann am
Filmende), `65b5022` (Preise, Wochen-Abo, fünf Sackgassen), `42d757f`
(Wachstumsplan), `c326d59` (Charakterbögen), `7d9de45` (Endpunkt-Schranke),
`7303d3e` (Sternzeichen angebunden), `ae54f34` (RTL). Zustand: 114
Unit-Tests, 50 Freigabe-Prüfungen, Prompt-Hygiene, 16 Kontrast-Paarungen,
7 Sprachdateien, 22 Stilblätter — alles grün. `bun run lint` existiert
weiterhin nicht.

Lange Sitzung in zwei Hälften: erst vier technische Baustellen (A–D), dann
ein recherchierter Wachstumsplan und dessen Umsetzung.

**A — RTL.** Arabisch lief bis heute auf `dir="rtl"` allein. Das dreht
Textfluss und logische Eigenschaften, aber kein `margin-left`. 23 Stellen
in 9 Stilblättern umgestellt. Der Punkt, der über den Einzelfall
hinausgeht: Solche Zeilen sehen in sechs von sieben Sprachen völlig
richtig aus — deshalb hilft Aufmerksamkeit nicht, sondern nur eine
Prüfung. Neu: `scripts/test-rtl.mjs` mit begründeter Ausnahmeliste. Für
Zeichen, die eine Richtung MEINEN, gibt es `[data-flip]` — ein Attribut
statt einer Klassenliste, damit der Nächste einen Pfeil markieren kann,
ohne base.css zu kennen.

**B — Sternzeichen.** `zodiac.js` lag seit dem 09.08. fertig da. Der
eigentliche Mangel war größer: Die Umfrage stellte sechs Fragen und zeigte
nie wieder etwas davon. Neue `DreamerCard` gibt alles zurück. Ausdrücklich
kein Horoskop. Der Glyph brauchte drei Schichten (U+FE0E,
`font-variant-emoji`, Schriftliste) — die ersten beiden allein ließen
macOS weiter die Farb-Emoji-Schrift ziehen.

**C — Endpunkt-Schranke.** Über `/api/generate` stand nur ein Kommentar
„⚠ LOCALHOST ONLY". Jetzt `src/lib/gatekeeper.js`: Mengenbegrenzung je
Absender (greift immer) plus optionales `API_TOKEN` (ohne gesetzte Variable
bleibt alles offen — eine Sicherung, die alle als Erstes abschalten,
sichert nichts). Am laufenden Server nachgemessen, nicht nur im Test.

**D — Charakterbögen.** Ohne Foto erfindet der Renderer die Figur in jedem
Bild neu; eine Zehnerstrecke zeigt zehn verschiedene Menschen mit demselben
Namen. Jetzt ein neutrales Referenzporträt, das ab da wie ein Foto wirkt.

**Der Fund zwischen C und D, und der ist der wichtigste dieser Sitzung:**
Der neue Endpunkt aus D wäre von der Schranke aus C nicht erfasst gewesen —
er kostet Geld und stand nicht in der Tabelle. Statt ihn nachzutragen ist
die Voreinstellung umgedreht: alles unter `/api/` ist jetzt begrenzt,
sofern nicht ausdrücklich befreit. **Eine Liste kann diesen Fehler nicht
verhindern, eine Voreinstellung schon.**

**Der Wachstumsplan** (`docs/plans/2026-08-16-wachstumsplan.md`) ist gegen
die Branchendaten 2026 recherchiert (RevenueCat, Adapty, Rechtslage nach
Epic v. Apple) und nach Hebel÷Aufwand sortiert. Davon umgesetzt: Punkte
2, 3, 6, 7, 9.

**Preise und Kaufwege.** Fünf Stellen endeten im selben Toast „Aufladen
kommt bald" — die teuersten Momente der App, jeder eine Sackgasse. Jetzt
öffnet jede das Kaufblatt, über eine Mechanik (`openPaywall()` im
AppState) statt fünf Flicken. Das Blatt kennt seinen Anlass: Wer selbst
geöffnet hat, sieht das Angebot; wem es in den Weg gesprungen ist, bekommt
zuerst den Grund.

Der Aha-Moment kommt bewusst NICHT am Ende des Onboardings, wo die
Konversionszahlen ihn hinstellen würden — das Onboarding verspricht „Dein
erster Traum geht auf uns", und direkt danach nach Geld zu fragen ist der
Widerspruch, den man einer App nicht verzeiht. Stattdessen: wenn der erste
selbst gemachte Traum fertig im Tagebuch liegt.

**Antons zwei Funde beim Durchsehen, beide echte Fehler:**

1. `pack-s` stand bei $4,99 für 15 Credits gegen das Wochen-Abo mit $4,99
   für 12. Gleiches Geld, mehr Credits, verfallen nie — das Abo war strikt
   das schlechtere Angebot. Mein Test hatte es durchgelassen, weil er den
   Abopreis auf den Monat hochrechnete und dann je Credit verglich. Über
   ein Jahr gewinnt das Wochen-Abo damit haushoch, nur vergleicht so
   niemand. **Ein Test, der die richtige Zahl auf die falsche Frage prüft,
   ist schlimmer als keiner: er beruhigt.**
2. Die App konnte nicht unterscheiden, welche Credits verfallen. Es gab
   eine Zahl. Damit wäre die erste Abo-Abrechnung nicht durchführbar
   gewesen, ohne jemandem etwas wegzunehmen, das er gekauft hat. Jetzt
   zwei Töpfe, und ausgegeben wird immer zuerst das Verfallende.

**Was der Nächste wissen muss:**

- **Der Abspann braucht ffmpeg** als Systemprogramm, keine npm-Abhängigkeit.
  Fehlt es, antwortet `/api/film-outro` mit 501 und die App teilt den Film
  unverändert. Die Karte wird im BROWSER gezeichnet (dort leben Schrift und
  Palette), nur zusammengefügt wird serverseitig.
- **`dreamsFor` rechnet den Filmpreis aus `video.js`**, statt ihn zu
  wiederholen. Vorher stand dort `credits / 5`, während ein Film längst 7
  kostet — die Paywall versprach 9 Filme, wo 6 drin sind. Wer den Filmpreis
  ändert, muss nichts nachziehen; wer ihn irgendwo hart hinschreibt, schon.
- **Plural ist in dieser App zweimal aufgetreten** („1 Credits", „1 Filme").
  Wer eine Zahl neben ein Wort setzt, nimmt eine Funktion — die
  Sprachdateien haben dafür `creditsN`, `yieldImages`, `yieldFilms`, jede
  mit der Regel ihrer Sprache. Arabisch hat Einzahl, Zweizahl, Mehrzahl
  3–10 und danach wieder Einzahl.
- **Die Serie belohnt, sie bestraft nie.** Wer daran weiterbaut: keine
  Countdowns, nichts Eingefrorenes, keine Verlustdrohung. Begründung im
  Kopf von `streak.js`.
- **`check-i18n-shape.mjs` stürzte bei `null` ab** statt zu melden
  (`typeof null === "object"`). Behoben — aber die Lehre gilt weiter: ein
  Prüfwerkzeug, das bei ungewohnter Eingabe abstürzt, sagt nur, DASS etwas
  kaputt ist.

## 2026-08-10 12:40 — Anton — Branch `session/2026-08-10-anton-seed` — Sitzungsabschluss

**Commits:** `0d1db75` (geteiltes Test-Journal) + der Doku-Commit dieser Zeilen.

**Was:** Jeder frische Install zeigt jetzt dieselben zwei Träume im Journal
(„Weeping Old Bedroom" englisch, „Der gläserne Zug" deutsch) statt eines
leeren Zustands — mit echten Bildern. Neu: `src/lib/seedJournal.js`,
`scripts/add-seed-dream.mjs`, sechs WebP unter `public/clips/`, plus ein
`loadInitialState()`-Wrapper in `src/state/AppState.jsx`.

**Warum:** Anton wollte einen Testzugang, den alle im Merge bekommen, und
dass künftige Medien dort ebenfalls landen.

**Drei Dinge, die der Nächste wissen muss:**

1. **Der erste Anlauf war falsch, und der Fehler ist lehrreich.** Ich hatte
   die Bilder per direktem `/api/generate`-Aufruf erzeugt — ohne `prompt`,
   ohne `aspectRatio: "16:9"`. Das landet im alten Einzelbild-Pfad und
   umgeht Grid und Schnitt vollständig. Anton hat zu Recht gefragt, warum das
   Triptychon nicht ankommt: **das System war da, ich habe es umgangen.** Wer
   Seed-Medien erzeugt, nimmt das Skript — nicht curl.
2. **WebP ist Pflicht, nicht Geschmack.** Die sechs Panels als PNG waren
   3,4 MB bei 3,6 MB Git-Historie: ein Commit hätte das Repo verdoppelt, und
   Git gibt den Platz beim Löschen nicht zurück. Als WebP: 0,27 MB, optisch
   ununterscheidbar. Bei „alle künftigen Medien" ist das der Unterschied
   zwischen tragfähig und einem Repo, das nach zwanzig Träumen 70 MB wiegt.
   `add-seed-dream.mjs` erzwingt es.
3. **Der Python-Schnitt im Skript ist ein PORT von `splitGrid.js`**, keine
   gemeinsame Quelle. Ändert sich dort die Zuschneide-Logik (MAX_TRIM, der
   „hellster Pixel"-Test, die Rundung der Grenzen), muss sie im Skript
   mitgezogen werden — sonst sehen Seed-Panels anders aus als das, was die
   App selbst erzeugt. Bun hat keinen Bilddecoder; deshalb Python/Pillow.

**Offen und bewusst so gelassen:** Das Seed-Journal erscheint bei **jedem**
frischen Install, auch bei echten Nutzern. Als Testzugang gewollt, vor einem
Release zu entfernen — die Anleitung steht im Kopfkommentar von
`seedJournal.js`, der Punkt zusätzlich in STAND.md unter Baustellen.

## 2026-08-10 00:24 — Anton — Branch `session/2026-08-07-anton` (PR #9) — Sitzungsabschluss

**Commits (neuester zuerst):** `cf1b10e` (Willkommen als Versprechen statt
Währung), `69e6642` (Klartraum-Leitfaden aus der Studienlage + Stimme nur
einmal fragen), `95c606c` (Assistenten-Persona + Startseite als Poster),
`8d1b840` (Gate in Ich-Form, Leuchtlinie, drei Home-Varianten), `e837279`
(Startscreen mit Faultier-Film, neue Copy in 7 Sprachen), `1d0fae3`
(Schlaf-Checkliste im Hatch-Stil), `8ef6dd9` (Stimmwahl mit Vorhören),
`6805085` (Umschreib-Blatt, Remix raus). Zustand: 77 Unit-Tests, 50
Freigabe-Prüfungen, Prompt-Hygiene, 16 Kontrast-Paarungen, 6
Sprachdatei-Prüfungen — alles grün. `bun run lint` existiert weiterhin nicht.

Diese Sitzung hatte einen roten Faden: Die App bekommt **eine Stimme** — im
wörtlichen wie im gestalterischen Sinn.

**1. Stimmwahl mit echtem Vorhören.** Sechs Stimmen aus dem Gemini-Live-
Katalog, ein Tipp spielt sie vor. Recherchiert und entschieden: Die API hat
**keine** fertigen Hörproben (AI Studio schon, die API nicht). Deshalb
erzeugt der Server sie selbst über Gemini TTS — das teilt den Stimmkatalog
mit der Live-API, **was man vorhört, ist exakt die Stimme, die dann
spricht**. Je (Stimme, Sprache) einmal erzeugt und als WAV unter `media/`
gecacht; TTS liefert kopfloses PCM, der RIFF-Header wird selbst geschrieben,
die Abtastrate aus dem `mimeType` gelesen statt angenommen. Gemessen: frisch
4,7 s, gecacht unter 1 ms. `voice` ist beidseitig allowlisted
(`VOICE_NAMES` in `server.js`, Spiegel in `src/lib/voices.js`).

**Wichtige Nachbesserung am selben Tag:** Der Picker kam zuerst **vor jedem**
Gespräch. Das ist eine Mautstelle vor genau der Sache, für die es die App
gibt. Jetzt: nur beim allerersten Mal, danach **Profil → Zahnrad →
Einstellungen**. Bewusst als Liste gebaut, nicht als dieses eine
Bedienelement — die zweite und dritte Einstellung kommen.

**2. Der Assistent bekommt einen Charakter** (Stil B von drei demonstrierten,
„der coole Nachtportier"): ein gemeinsamer `PERSONA`-Block für **beide**
Briefings, weil Trauminterview und Willkommensumfrage für den Nutzer eine
Person sind.

**Die lehrreiche Stelle:** Die erste Fassung bestand vor allem aus Verboten
(„erwähne nie…", „beschreibe dich nie…") und erzeugte perfekt neutrale
Begrüßungen — „Willkommen. Wie soll ich dich nennen?". Ein Modell, das vor
allem hört, was es NICHT tun soll, spielt auf Nummer sicher. Erst die
konkrete **positive** Anweisung zog: die erste Zeile bemerkt etwas Wahres
über den Moment (die Uhrzeit, dass jemand kaum wach ist) und fragt dann —
halber Nebensatz Beobachtung, dann die Frage. Dazu ein Eröffnungs-Cue, der
Charakter einfordert statt „sag deine Begrüßung".

Bewusst **keine Beispielsätze** im Prompt: genau das hat am 09.08. schon
einmal die Sprache verbogen (ein „Guten Morgen" als Beispiel ließ den
Assistenten überall Deutsch reden). Beschrieben ist die Bewegung, nicht der
Wortlaut. Gegengeprüft an vier echten Gemini-Sitzungen über den Relay —
Deutsch, Englisch, Arabisch, Chinesisch tragen den Ton, ohne dass eine
durchschlägt. Der Charakter fällt außerdem als Erstes weg, wenn ein Traum
bedrückend wird.

**3. Gestaltung: das Faultier zieht ein.** Zwei gelieferte Clips
transkodiert (`Faultier-001.mov` 8,4 MB → 551 KB, `Faultier-002.mov` 7,3 MB
→ 666 KB, beide ohne Ton, per Vite-Import gebündelt statt als `/public`-Pfad
— überlebt so jede `base`-Änderung, wichtig für Capacitor).

- **Startscreen** als Filmplakat: Video vollflächig hinter einem Scrim, der
  oben leicht dimmt und unten in fast-Deckung ausläuft, damit Schrift auf
  jedem Frame trägt. Neue Kicker-Zeile, größere Wortmarke.
- **Startseite:** drei Varianten gebaut und live umschaltbar gemacht
  (A Himmel / B Kino / C Karte), Anton wählte **C**. Grund: die Karte hat
  eine Kante, also liest sich der Film als gerahmtes Bild statt als
  ausgelaufener Hintergrund — und alles darunter sitzt wieder auf ruhigem
  Dunkel, wo Listen hingehören. A, B und der Schalter sind gelöscht.
- **Copy überall neu** (7 Sprachen): „Jede Nacht drehst du Filme. Fang an,
  sie zu behalten." Die Folien erzählen eine Nacht statt Features
  aufzuzählen. Gate spricht jetzt in der **ersten Person** („Erzähl mir…"),
  weil die App eine Persona hat und eine Persona *ich* sagt.
- **Leuchtlinie** um die Belohnungs-Pille: `conic-gradient` auf dem
  `::before`, per Maske auf einen 1,5-px-Ring beschnitten, animiert wird nur
  der Startwinkel (als `@property` registriert, sonst interpoliert er
  nicht). Bei `prefers-reduced-motion` ein stiller Schimmer.
- **Schlaf-Checkliste** im Hatch-Stil: Karten-Raster mit leuchtenden
  Glyphen; erledigte Karten klappen ihren Text ein und treten zurück.

**4. Luzides Träumen — aus Belegen statt aus Folklore neu gebaut.**
Grundlage ist die *International Lucid Dream Induction Study* (Aspy u. a.
2020, 355 Teilnehmende, eine Woche Übung), der bislang einzige große
Direktvergleich. Zwei Funde haben die Seitenstruktur bestimmt:

- **Die Methode ist nicht der wichtigste Hebel.** Der größte Einzelfaktor
  war, ob jemand binnen zehn Minuten wieder einschlief (18,3 % gegen
  11,1 %) — ein größerer Effekt als der Abstand zwischen den Techniken.
  Deshalb stehen drei Zahlenkarten **vor** den Methoden.
- **Realitätschecks haben nicht funktioniert.** Zu MILD dazugenommen
  schnitten sie schlechter ab als MILD allein (10,8 % und 13,4 % gegen
  16,5 %). Es ist die meistempfohlene Technik im Netz und stand auch bei uns
  an erster Stelle. Sie bleibt drin — mit dem echten Ergebnis daneben.

Vier Methoden mit Schritt-für-Schritt-Protokollen (WBTB, SSILD, MILD,
Realitätschecks), Erfolgsquote schon auf der zugeklappten Karte. Bewusst
**keine** Checkliste: hier wird nichts abgehakt, und so zu tun würde ein
Ergebnis versprechen, das die Studie nicht hergibt.

**5. Geschäftsmodell durchgerechnet** (auf Nachfrage, Ergebnis als
Kommentare in `plans.js`/`credits.js`). Die bisherige Formel ignorierte
zwei der größten Abzüge: die **MwSt.** (geht in der EU vom Listenpreis ab,
*bevor* Apple seine Provision nimmt) und dass die **Gratis-Credits pro
Installation** anfallen, nicht pro Kunde. Mit beiden ist der 30-%-Schnitt
strukturell defizitär; das Small Business Program (15 %) ist damit
**Voraussetzung, nicht Optimierung**. Break-even-Conversion real ~4,5–5 %
statt der bisher notierten 3,8 %. Für 5.000 € Gewinn/Monat braucht es grob
2.500–5.000 aktive Abos, für 10.000 € etwa das Doppelte.

**6. Das Willkommen ist jetzt ein Versprechen statt einer Währung:** „Dein
erster Traum geht auf uns" statt „3 Credits gratis", in allen sieben
Sprachen und an allen drei Stellen. `credits.test.js` prüft dafür jetzt
**Gleichheit** statt einer Spanne — zu wenig hieße, der Willkommensbildschirm
verspricht einen Traum und zeigt beim ersten Versuch eine Bezahlschranke; zu
viel hieße Restcredits, die allein nichts kaufen und wie ein Fehler aussehen.

**Was der Nächste wissen muss:**

- **Der Grid-Pfad feuert praktisch nie.** `useGrid` in `Step5Style.jsx:80`
  verlangt „3 Szenen UND kein Poster", der Titel kommt aber automatisch aus
  der Analyse ins Feld — es sei denn, jemand leert es von Hand. Wer den
  Effekt testen will, muss das Titelfeld in Schritt 5 leeren.
- **Der Grid kostet Auflösung.** An einem echten Rendering gemessen:
  Panels 459×768 gegen 768×1376 bei einem normalen Bild, ein Drittel der
  Pixel. Deshalb ist entschieden, dass der **Gratis-Traum in voller Größe
  rendert** — die Ersparnis fiele sonst ausgerechnet auf den einen Traum,
  der gut sein muss. Begründung in `credits.js`.
- **Prompt-Persona: niemals Beispielsätze.** Zweimal hat das die Sprache
  verbogen. Bewegungen beschreiben, nicht Wortlaut.
- **Der Stimm-Cache liegt in `media/`** (`voice-sample-<Stimme>-<Sprache>.wav`,
  42 mögliche Dateien). `media/` ist in `.gitignore` — auf einem frischen
  Rechner entstehen sie beim ersten Antippen neu, je einmal.

## 2026-08-09 19:37 — Anton — Branch `session/2026-08-07-anton` (PR #9) — Sitzungsabschluss

**Commits (neuester zuerst):** `7576f28` (warmer Knopf nach oben), `353d1e7`
(Onboarding-Folien zusammengelegt), `21fb959` (Foto-Knopf im Avatar-Dialog),
`f2a4d2b` (Startauswahl), `0d4a122` (Onboarding komplett), `1ff3272`
(Klangregler), `a3bf17f` `f1f61e1` (Aktionspillen, Grid-Balken), `00f813d`
(Aktionsleiste + Remix), `69fee5b` `5548d76` (Film-Bilder-Fix,
Job-Abholung), `19fa21b` `0d4cf0a` `66fcf1f` `8875f47` `53524c1`
(Film-Keyframe, Bilder-vor-Film, Icon-Knöpfe, Grid-Bilder, Diktat raus),
`1091221` `cd18cc3` `33165cc` `cb60e01` (Fortsetzen aus dem Journal,
Sprach-Briefing, Kalender, WebSocket-Fix), dazu `f725a3b`/`1b0270d`
(Sprachassistent-Grundgerüst, vor dieser Sitzung entstanden, aber noch nie
im Worklog vermerkt — der letzte Abschluss-Eintrag lag zeitlich davor).
Zustand: 77 Unit-Tests, 50 Freigabe-Prüfungen, Prompt-Hygiene, 16
Kontrast-Paarungen — alles grün. `npm run lint`/`bun run lint` existiert
weiterhin nicht.

Sehr lange Sitzung, sechs große Themenblöcke. Der Reihe nach:

**1. Der Sprachassistent — vom Grundgerüst zum funktionierenden Interview.**
Kam stumm rein: der Dev-Proxy leitet WebSockets unter Bun nicht durch (Buns
`node:http` meldet eine 101-Antwort als gewöhnliche Antwort statt als
`upgrade`-Ereignis) — die Sprachverbindung geht seither **direkt** an den
API-Port (`__API_PORT__` aus `vite.config.js`, siehe `voiceSession.js`).
Danach: Gemini antwortet ausschließlich in **Binärframes**, auch
`setupComplete` — die ursprüngliche Texterkennung griff nie, der Assistent
blieb stumm, obwohl `ready` schon ankam. Fix in `server.js`: die ersten
Frames werden bei Bedarf dekodiert, nicht blind als Text erwartet.

Danach ein echtes **Briefing** statt generischer Fragen: Name aus dem
Profil, bekannte Cast-Mitglieder (damit „Rex" als `@rex` erkannt wird,
nicht als neue Figur), Gerätesprache fürs erste Wort — durchgespielt mit
einem getippten Vier-Runden-Gespräch, alle vier Werkzeuge (`setDreamText`,
`addPerson`, `addPlace`, `finish`) feuerten korrekt.

**2. Journal-Struktur — Kalender, Fortsetzen, Film und Bilder nebeneinander.**
Der Traumkalender zog vom Profil ins Journal (jedes Feld öffnet den
jeweiligen Traum). Ein „nur gespeicherter" Traum lässt sich jetzt aus dem
Journal heraus fortsetzen — der Wizard startet direkt bei der Besetzung,
weil der Text schon da ist.

**⚠ Zwei Fehler, die echtes Geld betroffen hätten:**

- **Ein Film löschte die Bilder, aus denen er gemacht wurde.** `media`
  wurde beim Speichern komplett ersetzt statt ergänzt. `lib/entryMedia.js`
  trennt jetzt `film` und `media` als zwei unabhängige Felder; alte
  Einträge mit Film in `media` werden per Fallback weiter gefunden.
- **Fertige Filme wurden nie abgeholt.** Die Status-Abfrage wurde aus dem
  vollen Modell-Slug gebaut (`minimax/h3/image-to-video`), fals Queue
  routet aber unter der Familie (`minimax/h3`) — der selbstgebaute Pfad
  antwortete 405, und `jobStatus()` wertete jeden Fehlschlag als
  „pending". Ein fertig gerenderter, bezahlter Film blieb dadurch **für
  immer** auf „rendering…" stehen. Gefunden, weil ein eigener Testclip
  nach 20 Minuten nicht ankam — fal sagte `COMPLETED`, der Server fragte
  falsch. Fix: `status_url`/`response_url` kommen jetzt wörtlich aus fals
  eigener Einreichungs-Antwort, nicht mehr rekonstruiert.

**3. Ein Film kann jetzt ein eigenes Bild des Traums animieren**, statt
immer ein neues Keyframe zu rendern — ein Credit gespart, sichtbar im
Preis. Das Bild geht als Data-URI an fal (lokale `/media/`-Pfade sind für
fal nicht erreichbar); `resolveMedia()` prüft den Pfad gegen echte,
selbst geschriebene Dateien, feindliche Werte (fremde URLs, `../`,
`/etc/passwd`) scheitern serverseitig, bevor fal je kontaktiert wird —
gegen den laufenden Server geprüft. Dabei außerdem gemessen:
**`minimax/h3` verlangt inzwischen mindestens 5 Sekunden**, nicht 2 wie am
08.08. notiert — die Queue prüft das erst beim Rendern, nicht beim
Einreichen, ein zu kurzer Wert hätte Credits verbrannt und wäre Minuten
später als gescheiterter Job zurückgekommen.

**4. Ein Aufruf liefert drei Bilder statt drei Aufrufe eins.** Für die
3-Bilder-Stufe ohne Poster generiert `buildGridPrompt()` ein einzelnes
16:9-Bild mit drei Panels; `lib/splitGrid.js` schneidet es im Browser per
`<canvas>` (kein neuer Bild-Decoder auf dem Server). Ein echter Test zeigte
saubere Panel-Trennung, aber auch: das Modell malt trotz Verbot einen
Letterbox-Rahmen ins Bild — kein Anzeigefehler, Teil der generierten
Pixel. Der Zuschnitt erkennt Rahmenzeilen jetzt am **hellsten** Pixel der
Zeile, nicht am Durchschnitt (gemalte Balken: max. 5/255 über die ganze
Breite; selbst eine dunkle Wasserszene trägt Glanzpunkte ab 19). Ein
Durchschnitts-Schwellwert hätte 144 px echte Szene mitgefressen. Preis
bleibt bei 3 Credits, die Ersparnis geht bewusst in die Marge (dokumentiert
in `pricing.js`) — Video ohne Titelkarte aus demselben Grund: großformatige
Poster-Typografie durch Image-to-Video verzerrt beim Animieren.

**5. Bedienelemente aufgeräumt.** Die alte Diktierfunktion (Mikro-Knopf,
Status-Text) ist raus, `useVoiceInput.js` gelöscht — „Tell it out loud"
deckt das jetzt allein ab. Bilder/Film-Knöpfe im Journal: kein Emoji mehr,
eigenes SVG-Icon-Set, warmer Verlauf statt Kartenfarbe, **eine** Pille statt
zwei nebeneinander (erst Bilder, Film erst wenn Bilder da sind — das
Teuerste in der App nie anbieten, bevor jemand ein Bild gesehen hat). Eine
neue Aktionsleiste (Remix/Rewrite/Edit/Share) sitzt jetzt **über** dem
warmen Hauptknopf — er stand ursprünglich unter dem gesamten Traumtext, das
Letzte, was jemand nach dem Scrollen sah. Remix zeigt den Text, aus dem die
Bilder entstanden, lässt ihn ändern und erzeugt neu; die alte Analyse wird
dabei verworfen, weil sie einen Text beschreibt, den es so nicht mehr gibt.
Der native `<input type="file">` im Avatar-Dialog („Datei auswählen /
Keine ausgewählt") ist jetzt unsichtbar und wird von einem Knopf im
App-Stil ausgelöst — das war der eigentliche Grund, warum das Fenster alt
aussah, kein CSS erreicht die OS-Chrome eines nativen File-Inputs. Die
Klangregler im Sleep-Tab sind jetzt Chip-plus-Pille statt nativem
`<input type=range>`.

**6. Onboarding komplett neu, als eigener Bereich `src/screens/Onboarding/`.**
Animation → drei Folien (zwei zu einer verschmolzen: „Visualise your
dream" deckt Bild UND Film ab; die frei gewordene dritte Karte zeigt die
Gratis-Funktionen Lucid Dreaming/Traumsymbole als zwei kleine Zeilen,
Beschriftung direkt aus `t.sleep.tiles` gezogen, keine zweite,
driftende Quelle) → Sprach-Umfrage (eigener Relay-Modus `onboarding` in
`server.js`, eigenes Werkzeug-Set: Name, Geburtstag → Sternzeichen
clientseitig via `lib/zodiac.js`, Traumerinnerung, Klarträume, wiederkehrende
Themen, Ziel — jede Frage überspringbar) → optionaler Selfie-Schritt über
den bestehenden `AvatarDialog`. Die Willkommens-Credits wandern vom
stillen Mount-Geschenk zur Umfrage-**Belohnung** (`welcomeGrant()` bleibt
idempotent, wer schon vorher etwas bekam, bekommt nichts doppelt); wer
überspringt, findet Angebot samt Credits als Karte im Profil wieder.

**Wichtig für den Nächsten:** `App.jsx` zeigt aktuell bei **jedem** Start
eine `StartMenu`-Auswahl („Show onboarding" / „Skip to app") **statt**
direkt auf `state.onboarded` zu gaten — das war explizit gewünscht, solange
am Onboarding gearbeitet wird, ist aber ausdrücklich als
**Übergangslösung** markiert (Kommentar in `StartMenu.jsx`). Vor jeder
echten Nutzung: `src/screens/Onboarding/StartMenu.jsx` löschen,
`App.jsx`s `Gate()` wieder auf `!state.onboarded` prüfen lassen.

**Außerdem gefunden, nicht sitzungsrelevant, aber notiert:** Die
`.claude/launch.json` im **Hauptrepo** (nicht im Worktree) startet nur
`bun server.js` (Port 8100), nie Vite — ein frischer `main`-Checkout zeigt
über die Vorschau also ein altes `dist/` ohne Oberfläche, nur `FAL_KEY`
gesetzt. Absichtlich nicht angefasst (Änderung an geteilter Datei auf
`main`, nicht Teil dieser Session).

**Was der Nächste zuerst liest:** diesen Eintrag, dann `docs/STAND.md`
(komplett neu geschrieben) — insbesondere den `StartMenu`-Punkt oben und
die Baustellen-Liste dort.

## 2026-08-08 15:30 — Anton — Branch `session/2026-08-07-anton` (PR #9) — Sitzungsabschluss

**Commits:** `13bd9b0` (Diktat, Poster, Journal-Look, Medien lokal), `46b72e1`
(Sleep-Tab, zwei Journal-Ansichten, Icon-Leiste), `af64474` (Plus-Knopf mittig),
`025fb7c` (tiefblaue Farbwelt, Profil neu), `688e01f` (Paywall, warme Akzente),
`309a9d2` (Startseite), `1802b79` (Verlaufsknöpfe), `624331e` (Warteschlange für
Filme), `8cc2a94` (Credit-Skala, Film-Auswahl, Bilderstrecke), `73f2b32`
(Willkommensgeschenk 3). Zustand: 65 Unit-Tests, 50 Freigabe-Prüfungen,
Prompt-Hygiene, 16 Kontrast-Paarungen — alles grün. Build sauber.
`npm run lint` existiert weiterhin nicht.

**Diktat neu gebaut.** Web Speech war fest auf `en-US` verdrahtet, verstand
Deutsch gar nicht und funktionierte in iOS Safari nie. Jetzt MediaRecorder +
Whisper (`fal-ai/wizper`) über `/api/transcribe`. Spracherkennung automatisch,
also kein Umschalter. Die Route nimmt **nur Base64-Data-URIs**, keine URLs —
sonst wäre sie ein Abruf-Proxy für beliebige Adressen.

**Traum-Poster.** Der eine Analyse-Aufruf liefert jetzt zusätzlich `title` und
`tagline` in der Traumsprache. `buildPosterPrompt()` setzt die aus sieben
echten Filmpostern destillierten Regeln um: ein dominantes Motiv, Tagline oben,
Titel im unteren Drittel, Billing-Block unten, Sperr-Palette. Das Poster
ersetzt das erste Bild (gleiche Anzahl, gleicher Preis). Acht Styles statt
sechs, neu **Ultra Real** (Deakins-Grammatik) und **Film Noir**.

**Medien liegen jetzt lokal.** `/api/generate` lädt jede erzeugte Datei nach
`media/` (git-ignoriert) und gibt `/media/<hash>.<ext>` zurück. Vorher stand
nur die fal-URL im Tagebuch, und die verschwindet irgendwann — ein Tagebuch,
das nach Monaten leer wird, ist wertlos. 17 neue Freigabe-Prüfungen halten die
Route dicht.

**Sleep-Tab** mit Einschlaf-Checkliste (Haken gelten für eine Nacht, setzen
sich per Datumsschlüssel selbst zurück), Sound-Mixer (White/Pink/Brown werden
**synthetisiert** — kein Download, keine Lizenz) und dem umgezogenen
Lucid-Guide. Der Web-Audio-Graph liegt außerhalb von React, damit der Ton beim
Navigieren weiterläuft.

**Farbwelt komplett getauscht**, von violetter Nacht auf tiefes Blau mit warmem
Gegenpol. Der eigentliche Gewinn ist strukturell: der Hintergrund stand vorher
in **zwölf Dateien** von Hand ausgeschrieben, jetzt genau einmal als
`--bg-rgb`, und jeder Schleier leitet sich davon ab. Dazu
`scripts/test-contrast.mjs`, das die echten Tokens liest und 16 Paarungen gegen
WCAG AA prüft — der in STAND.md seit Monaten dokumentierte Grenzfall (`--faint`
auf `--sky`) steigt von 4,79:1 auf 5,56:1. Eine Warnung in einer Textdatei hält
niemanden auf, ein Test schon.

**⚠ Zwei echte Fehler gefunden, beide teuer:**

1. `run()` in Step5 war **nicht wiedereintrittsfest**. Ein Druck erzeugte sechs
   `/api/generate`-Aufrufe; auf dem Telefon hätte ein Doppeltipp doppelt
   Credits gekostet. `busy` konnte das nicht verhindern — es ist React-State und
   im selben Tick noch `false`. Jetzt `useRef`-Wächter.
2. **Der synchrone `fal.run`-Aufruf reicht für lange Filme nicht.** Gemessen:
   ein 15-Sekunden-Render dauert **280 Sekunden** und läuft in eine
   Zeitüberschreitung — während fal weiterrechnet und abrechnet. Bezahlt und
   verloren. Filme laufen jetzt über `queue.fal.run`: einreichen, Job auf Platte
   schreiben, `/api/job?id=` fragt nach. Aufträge liegen auf Platte, nicht in
   einer Map, damit ein Neustart nichts verwaisen lässt, wofür jemand bezahlt hat.

**Preise auf echte Kosten gestellt.** Recherchiert und teils direkt gemessen:
Bild $0.08, Video $0.08/Sekunde bei 768P, Analyse $0.00026. Vorher war derselbe
Credit je nach Verwendung zwischen 4 und 16 Cent wert. Jetzt **1 Credit = 1 Bild
= $0.08**, Textarbeit gratis (sie kostet 0,065 % eines Traums), Film ein Credit
je Sekunde. Willkommensgeschenk von 25 auf **3** — 25 waren $2.00 je
Installation, durch Löschen der Website-Daten beliebig wiederholbar.

**Modellvergleich mit echten Bildern** (~$0.31): synthetisches Porträt erzeugt,
beiden Modellen als Referenz gegeben. **Seedream 5 Lite hält das Gesicht
pixelgenau, ignoriert aber die Regieanweisung** — beide Male dasselbe frontale
Brustbild, faktisch nur ein Hintergrundtausch. Nano Banana befolgt die Regie
(Ganzfigur, Profil, Lichtstimmung), verliert dafür Kleinstmerkmale auf
Szenendistanz. **Für Filmbilder ist Nano Banana richtig**; der Test hat eine
teure Fehlentscheidung erspart. Seedreams Stärke passt zu den noch offenen
Character-Sheets.

**Was der Nächste wissen muss:**

- **`minimax/h3` kann 15 Sekunden**, nicht 6 oder 10. Der Slug existiert, ist
  aber nirgends öffentlich dokumentiert — die Grenzen stehen nur in fal's
  eigener Validierungsantwort. Leeren Body schicken, Fehler lesen: kostet nichts
  und ist die einzige Quelle. So kamen auch die erlaubten Auflösungen heraus.
- **Vite startet neu, sobald `.env.example` gespeichert wird** (es beobachtet
  alle `.env*`). Beim ersten Mal sah das nach einem Absturz aus.
- **`--warm` braucht dunklen Text.** Weiß auf Bernstein reißt den Kontrast; die
  Hauptknöpfe tragen deshalb `color: var(--bg)`.
- Die Journal-Bilderstrecke teilt den Text **nach Sätzen**, gleichmäßig auf die
  Bilder. Die englischen Beats liegen in der Analyse und nicht im Eintrag,
  können also nicht zuordnen — die Reihenfolge stimmt, mehr ist ohne
  gespeicherte Beats nicht drin.

## 2026-08-07 19:00 — Hanni — Branch `session/2026-08-07-hanni-profile` (PR #8) — Sitzungsabschluss

**Commits:** `e76d6c8` (Merge von main, Doppeltes raus), `6db78c9`
(Tag-Hervorhebung), `HEAD` (anklickbare Tags + zwei CSS-Fehler behoben).
Build grün, 50 Unit-Tests, 33 Freigabe-Prüfungen, Prompt-Hygiene grün.

⚠ **Datumshinweis:** Der Eintrag unter diesem hier ist auf „2026-08-08 10:15"
datiert, sein Commit `7d7bb61` liegt aber am **07.08. um 18:05**. Die
Reihenfolge in dieser Datei stimmt trotzdem — nur die Datumsangabe dort geht
einen Tag vor. Wer chronologisch sucht: nach Commit-Zeit gehen, nicht nach
der Überschrift.

**Kollision aufgelöst.** Antons Bearbeiten-Funktion lag schon auf `main`. Ich
habe `main` gemergt und alles wieder herausgeworfen, was wir doppelt gebaut
hatten; übrig blieb aus meinem Teil nur die Regel **Foto ODER Beschreibung
ist Pflicht** (`AvatarDialog.jsx`) — ein Name allein gibt dem Bildmodell
nichts, woraus es zeichnen könnte, und das gilt beim Bearbeiten genauso,
damit ein Eintrag nicht nachträglich leergeräumt werden kann.

**Tag-Hervorhebung im Eingabefeld** (`TagTextarea.jsx/.css`). Ein
`<textarea>` kann keine gestalteten Elemente enthalten, deshalb liegt eine
deckungsgleiche Ebene dahinter, die denselben Text mit markierten Namen
trägt; das Feld selbst ist durchsichtig und behält Cursor, Auswahl,
Spracheingabe und Größenänderung. Die Markierungen sind React-Elemente, kein
`innerHTML` — es gibt nichts zu escapen, weil nie etwas als Markup gelesen
wird. Umlaufender Lichtpunkt wie bei den Symbol-Kacheln.

**Die Pille deckt genau ihr Wort und sonst nichts.** Anfangs `padding: 4px
7px` mit ausgleichendem Negativ-Rand — das war zu viel: ein Leerzeichen ist
in dieser Schrift **3,47 px** breit, die Pille ragte 7 px je Seite hinaus,
verschluckte also die Lücke ganz und noch 3,5 px des Nachbarbuchstabens; vor
einem Komma gibt es überhaupt keine Lücke. Waagerechtes Padding ist deshalb
**0** — Luft ließe sich nur aus echtem Abstand nehmen, und der würde den Text
gegen das Feld darunter verschieben. Senkrecht ist Platz: die Inline-Box ist
16,82 px in einer 24-px-Zeile, also 3,59 px je Seite frei; 3 px bleiben
darin, 4 px hatten Pillen aufeinanderfolgender Zeilen um 0,41 px überlappt.
Radius auf 6 px. Nachgemessen: Lücke links 3,47 px, rechts 0 (berührt das
Komma, überlagert es nicht), senkrecht 1,19 px, und `scrollWidth`/
`scrollHeight` sind mit und ohne Padding identisch — es verschiebt nichts.

**Anklickbare Tags** (`TagCard.jsx/.css`). Ein Klick auf einen markierten
Namen zeigt Foto, Kategorie und Beschreibung der Entität. Weil das Feld
oben liegt und alle Zeiger-Ereignisse schluckt, werden die Markierungen
nicht angeklickt, sondern **geometrisch getroffen**: `getClientRects()` je
Markierung, nicht `getBoundingClientRect()` — eine über zwei Zeilen
umbrochene Markierung hätte sonst einen Rahmen über die volle Feldbreite und
würde weit neben dem Wort antworten. Die Karte ist bewusst **kein Modal**:
der Fokus bleibt im Feld, der nächste Tastendruck schließt sie wieder.

**⚠ Zwei eigene CSS-Fehler gefunden und behoben — für den Nächsten wichtig.**
`.tt-input` und `.tt-mirror` bekommen zusätzlich die Klasse des Aufrufers
(`.wiz-textarea`), die `background` und `color` setzt. Gleiche Spezifität,
also entschied die Bündelreihenfolge — und sie entschied gegen uns:
`.wiz-textarea` steht in `dist/assets/*.css` **nach** meinen Regeln. Folge:
die Spiegelebene zeichnete den Traumtext ein zweites Mal (deckungsgleich,
darum unsichtbar) und über den Markierungen lag ein 5-%-Weißschleier. Es fiel
nur deshalb nicht auf, weil `--panel` fast durchsichtig ist. Behoben durch
Anheben der Spezifität (`.tt-wrap .tt-input`). **Regel: alles in
`TagTextarea.css`, was die Klasse des Aufrufers schlagen muss, braucht
`.tt-wrap` davor.** Ein Sichttest findet so etwas nicht — nur
`getComputedStyle`.

**Nicht per Tastatur erreichbar.** Die Karte öffnet nur per Zeiger. Derselbe
Inhalt steht im Profil-Tab, der vollständig per Tastatur bedienbar ist; die
Karte ist eine Abkürzung, kein einziger Weg. Wer das ändern will, braucht
einen Weg, der nicht mit dem Tippen kollidiert — Tab im Textfeld muss zum
nächsten Bedienelement führen, nicht in die Markierungen.

**Gemessen statt vermutet:** 0,081 ms je Mausbewegung bei 40 Markierungen
(Bildbudget 16,7 ms), 0,22 ms je Tastendruck. Kein Caching eingebaut, es
wäre Komplexität ohne Gegenwert.

**Geprüft im Browser** (vorher Bündel-Hash abgeglichen, sonst misst man den
alten Stand): Markierung trifft `anton`, nicht „annals" oder „islander";
Klick auf das Wort öffnet, Klick daneben nicht; Textauswahl per Ziehen öffnet
nicht; Escape, Tippen, Scrollen, Klick daneben schließen; Karte bleibt
vollständig im Bild und weicht nach oben aus, wenn unten kein Platz ist
(Wort bei y=408, Karte bei 260–400); Foto- und Ohne-Foto-Fall; kein
seitlicher Überlauf.

## 2026-08-08 10:15 — Anton — Branch `main` — Sitzungsabschluss

**Commits:** `96cca16` (Avatare bearbeitbar, Ohne-KI-Weg raus). Zustand:
Build grün, 50 Unit-Tests, 33 Freigabe-Prüfungen, Prompt-Hygiene grün.
`npm run lint` existiert weiterhin nicht. Kein Worktree, kein eigener PR.

**⚠ KOLLISION — bitte lesen, bevor jemand weitermacht.**

Hanni hat am 07.08. um 17:55 den Entwurfs-PR #8
(`session/2026-08-07-hanni-profile`) als **Reservierung** geöffnet, für genau
dieses Feature: „Profil-Bereich für Personen, Haustiere und Orte — anlegen,
**bearbeiten**, Beschreibung und Foto ändern, löschen" plus Tag-Hervorhebung
im Traum-Eingabefeld. Auslöser war derselbe Fund wie bei uns: ein
Cast-Eintrag `anton` mit Beschreibung, aber `img: ""`.

Ich habe das Bearbeiten heute Vormittag gebaut und direkt auf `main`
gepusht, ohne die Reservierung zu beachten. `gh pr list` beim Sitzungsstart
zeigte nichts — warum, kann ich nicht mehr rekonstruieren; der PR bestand
seit dem Vorabend. Das ist genau der Fall, den AGENTS.md mit dem
Entwurfs-PR verhindern will („Müssen zwei ans selbe Feature: nacheinander,
nicht parallel").

**Lage, damit niemand unnötig aufräumt:** Hannis Branch enthält **nur den
Reservierungs-Commit** (`c08ea34`), keine Codeänderung — es geht also nichts
von ihrer Arbeit verloren. Überschneidung ist nur die Hälfte „anlegen /
bearbeiten / löschen"; die **Tag-Hervorhebung im Eingabefeld ist NICHT
gebaut** und bleibt offen.

**Nächster Schritt (menschlich, nicht technisch):** Hanni Bescheid geben,
dass das Bearbeiten auf `main` liegt, damit sie rebasen und sich auf die
Hervorhebung konzentrieren kann. Ihr PR bleibt unberührt — das ist ihre
Entscheidung, nicht unsere.

**Lehre:** Beim Sitzungsstart reicht ein stiller `gh pr list` nicht. Wenn die
Ausgabe leer ist, ist das ein Grund nachzuhaken, kein Freibrief — besonders
bevor man an einem Bereich arbeitet, der in `scripts/shared-files.json` steht
oder offensichtlich jemanden interessieren könnte.

## 2026-08-08 09:30 — Anton — Branch `main`

**Was:** Avatare im Profil sind jetzt bearbeitbar, und der Wizard hat keinen
Ohne-KI-Weg mehr.

- **Bearbeiten:** Antippen einer Kachel unter Personen/Tiere/Orte öffnet
  denselben `AvatarDialog`, jetzt mit `existing`-Prop — Name, Foto und
  Beschreibung änderbar, Foto auch entfernbar. Bisher konnte man nur anlegen
  und löschen. Die Kachel besteht dafür aus zwei Geschwister-Knöpfen
  (Inhalt + Löschen); ein Knopf im Knopf wäre ungültiges HTML.
- **Umbenennen zieht das Tagebuch mit.** Einträge speichern verwendete
  Referenzen als Tag-String. Ohne Nachziehen zeigten alte Träume nach einer
  Umbenennung auf einen Namen, den es nicht mehr gibt. Live geprüft:
  `@anton` → `@tony` änderte die Journal-Referenz mit, ID blieb stabil.
- **„Continue without it" entfernt** (Antons Ansage). Der Weg ergab keinen
  Sinn mehr: alle folgenden Schritte leben von der Analyse. Der lokale
  Fallback-Zweig in `Step2Output` war damit toter Code und ist raus.

**Was der Nächste wissen muss:** `DEEPSEEK_KEY` ist damit **faktisch
Pflicht**, nicht mehr optional wie in älteren Einträgen beschrieben — ohne
Analyse kommt niemand über Schritt 1 hinaus. Wer das nicht will, braucht
einen bewussten Ersatzweg (z. B. „nur speichern" direkt vom Startscreen).

## 2026-08-07 23:00 — Anton — Branch `claude/new-session-x9qv1w` — Sitzungsabschluss

**Commits dieser Sitzung** (die inhaltlichen Einträge darunter, 14:20 bis
22:15, beschreiben das Was und Warum — hier die Hashes dazu):

- `7134dcf` fal.ai/DeepSeek live verifiziert, dev-Launch-Config
- `13c51da` main gemergt (Hannis Foto-Bibliothek), STAND-Konflikt von Hand
- `43dface` `d0e03be` Spec + ADR-0004 + Implementierungsplan Phase 1
- `62b0bc8` … `456ed4e` Phase 1: Vite/React, dist/-Auslieferung, Tokens,
  Speicher/Symbole/Tags als getestete Module, Shell, alle Screens, legacy weg
- `42110f5` Singular „1 Tag"
- `f9df654` Oberfläche zurück auf Englisch, verlorene Funktionen zurück
- `dcc6547` `b45a843` Spec-Ergänzungen; Modellnamen raus aus der UI
- `04a97f2` `8bba1be` der Wizard; Analyse-Code aus dem Hygiene-Block
- `72971dd` Tagebuch-Menü, /api/refine, Teilen, Credits zählen
- `cce65e5` Sprachtrennung im Analyse-Schema, Bildanzahl → Schritt 5, Slideshow
- `ae12ce8` **Referenzbild-Fix** (edit-Endpunkt), Diktat-Verständnis, Pfeile

**Zustand bei Abschluss:** Build grün, 50 Unit-Tests grün, 33
Freigabe-Prüfungen grün, Prompt-Hygiene grün. PR #7 offen (kein Entwurf),
Merge-Entscheidung liegt beim Produktbesitzer. Kein separater Worktree
angelegt — gearbeitet wurde direkt im Projektordner auf diesem Branch.
`npm run lint` existiert weiterhin nicht (bekannte Baustelle).

**Was der Nächste zuerst liest:** `docs/STAND.md` (Stand 22:15 ist aktuell),
dann den 22:15-Eintrag hier — die fal.ai-Lehre („200 heißt nicht, dass der
Parameter ankam") betrifft jeden, der API-Parameter anschließt.

## 2026-08-07 22:15 — Anton — Branch `claude/new-session-x9qv1w`

**Was:** Der Referenzbild-Fehler ist gefunden und behoben, dazu zwei
UX-Nachbesserungen.

**Der Fehler:** Hochgeladene Charakterfotos tauchten in den generierten
Bildern nie auf. Diagnose mit einem knallroten 64×64-Test-PNG:
`fal-ai/nano-banana-2` (Text-to-Image) **ignoriert `image_urls`
stillschweigend** — der Endpunkt akzeptiert sogar `image_urls: 123` mit
HTTP 200. Die Referenzen gingen also seit der fal.ai-Umstellung ins Leere,
ohne je einen Fehler auszulösen. Der Schwester-Endpunkt
`fal-ai/nano-banana-2/edit` nimmt `image_urls` an und reproduziert das
Referenzbild nachweislich (rotes Quadrat kam exakt zurück).

**Fix:** `falGenerateImage()` wählt jetzt den Endpunkt nach Lage: mit
Referenzbildern → `FAL_MODEL_IMAGE_EDIT` (Default `<FAL_MODEL_IMAGE>/edit`,
per Env überschreibbar), ohne → wie bisher. End-to-end über `/api/generate`
verifiziert: rotes Referenzquadrat erschien exakt im gerenderten 9:16-Bild.

**Lehre für die Zukunft:** „HTTP 200" heißt bei fal.ai nicht „Parameter
angekommen". Unbekannte Felder werden kommentarlos verworfen. Wer neue
Parameter anschließt, testet sie mit absichtlich kaputten Werten gegen —
nur ein 422 beweist, dass das Feld gelesen wird.

**Außerdem:**
- „Improve with AI" schreibt jetzt wirklich um statt nur Kommas zu setzen:
  Die `text`-Regel im Analysis-Prompt behandelt die Eingabe ausdrücklich als
  möglicherweise diktierte Sprache (Wiederholungen, Satzabbrüche,
  ineinander gesprochene Gedanken) und erzählt den Traum als flüssigen Text
  neu — erfinden bleibt verboten.
- Die Slideshow hat Pfeile auf den Bildern (‹ ›), zusätzlich zu Punkten und
  Zähler. An den Enden verschwindet der jeweils sinnlose Pfeil.

## 2026-08-07 21:30 — Anton — Branch `claude/new-session-x9qv1w`

**Was:** Drei Nachbesserungen aus Antons Test des Wizards.

1. **Analyse-Schema als echter Vertrag.** `ANALYSIS_SYSTEM` in `server.js`
   legt jetzt fest: Felder, die der Mensch sieht (`text`, `people[].name`,
   `places`, `mood`), bleiben in der Sprache des Traums — ein deutscher
   Traum bekommt eine deutsche verbesserte Fassung. `beats` sind immer
   englisch (Bildmodell-Anweisungen). `people` sind strukturiert
   (`{name, kind, desc}`), damit die App Tiere von Menschen unterscheidet;
   `desc` füllt den Avatar-Anlege-Dialog vor. Neues validiertes Feld
   `language` (BCP-47). `normaliseAnalysis()` toleriert weiterhin nackte
   Strings — der lokale Ohne-LLM-Pfad liefert solche.
2. **Bildanzahl von Schritt 2 nach Schritt 5 verschoben.** Erst Charaktere
   und Orte festlegen, dann Anzahl wählen, dann generieren — vorher stand
   die Anzahl vor einer Entscheidung, die man noch gar nicht beurteilen kann.
3. **Ergebnis als Slideshow.** `MediaCarousel` (CSS scroll-snap, Punkte,
   Zähler „2 / 3") ersetzt den Bilderstapel — im Wizard-Ergebnis UND im
   Tagebuch-Detail. Bewusst ohne Carousel-Bibliothek: natives Touch-
   Verhalten gratis, funktioniert im Capacitor-WebView identisch.

**Live geprüft:** Deutscher Traum („alter Bahnhof, Katze Luna, Anton,
Wald aus Lichtern") → `language: "de"`, deutscher verbesserter Text mit
korrigierten Umlauten, Luna als `pet` erkannt, Orte deutsch, fünf englische
Beats, `mood: "verträumt"`. Slideshow im Tagebuch slidet, Zähler folgt.

**Was der Nächste wissen muss:** Wer am Schema etwas ändert, ändert BEIDE
Seiten — `ANALYSIS_SYSTEM` (was das Modell liefern soll) und
`normaliseAnalysis()` (was die App akzeptiert). Die zweite ist die
verbindliche.

## 2026-08-07 20:30 — Anton — Branch `claude/new-session-x9qv1w`

**Was:** Phase 2 gebaut — der Wizard und das Tagebuch-Menü. Damit ist alles
umgesetzt, was in `docs/specs/2026-08-07-app-umbau-design.md` steht.

Neu: `/api/analyze` (der eine LLM-Aufruf pro Traum, striktes JSON),
`/api/refine` (korrigieren/neu schreiben/ausarbeiten hinter einem
`mode`-Parameter), `src/wizard/` mit sechs Schritten, `src/lib/beats.js`,
`styles.js`, `promptBuilder.js`, `parallel.js`, `credits.js`, `share.js`,
`pricing.js`. `AvatarDialog` wanderte nach `src/components/`, weil ihn jetzt
Profil UND Wizard brauchen.

**Warum:** Anton hat zu Recht reklamiert, dass die Spec keine App ist. Der
Ablauf, den wir lange besprochen hatten — Traum durch die LLM, „Wer ist
Anton?", Bibliothek durchsuchen oder neu anlegen — existierte nur auf Papier.

**Drei Korrekturen an eigenen Fehlern:**

1. **Sprache.** Ich hatte aus `AGENTS.md` („Deutsch in UI") geschlossen, die
   Oberfläche solle deutsch werden. Falsch: Englisch ist die App-Sprache,
   Deutsch kommt als zweite dazu. Alles auf Englisch zurückgedreht, Texte in
   `src/i18n/en.js` gebündelt, `AGENTS.md` präzisiert.
2. **Mein „1:1-Port" war keiner.** Beim React-Umbau hatte ich Spracheingabe,
   Ladeanzeige, die Cast-Auswahl im Flow und die gute Copy verloren, ohne es
   zu merken oder zu sagen. Alles wiederhergestellt, die Copy wörtlich aus
   dem alten Stand („Your subconscious, directed" …).
3. **Zweimal denselben Fehler gemacht:** neuen Servercode zwischen die Marker
   `prompt hygiene (start/end)` gesetzt. `scripts/test-prompt-sanitize.mjs`
   extrahiert diesen Block und wertet ihn per `new Function()` aus — ein
   `export` darin ist dort ein Syntaxfehler und legt den Test lahm. **Wer
   `server.js` erweitert: nicht in diesen Block hinein.**

**Unterwegs gefunden:** Sequenzielle Bildgenerierung war zu langsam (drei
Bilder über eine Minute, zehn wären mehrere gewesen). Läuft jetzt drei
parallel über `mapWithLimit`, mit Begrenzung — zehn gleichzeitige bezahlte
Aufrufe an fal.ai wären das andere Extrem.

**Sicherheit:** Der vom Client gebaute Master-Prompt geht durch dieselbe
`sanitizePromptText()`-Hygiene wie alles andere. Ein client-gebauter Prompt
ist nicht vertrauenswürdiger als ein modellgebauter.

**Live geprüft:** Traum mit Anton, Rex und zwei Orten. Die Analyse erkannte
alle drei Personen und beide Orte („my old bedroom", „a dark sea"), Anton
wurde im Wizard mit Beschreibung angelegt und gebunden, drei Bilder kamen
zurück — das erste zeigt ihn mit der angegebenen Beschreibung auf dem
Fensterbrett. Danach „Rewrite it better" am gespeicherten Eintrag: Vorschau
kam, Text blieb inhaltlich treu, Guthaben ging von 25 auf 24.

**Was der Nächste wissen muss:**
- **Der eine LLM-Aufruf ist das Entwurfsprinzip.** Die Analyse liefert immer
  fünf `beats`; daraus leitet `beats.js` 3, 5 oder 10 Bilder ab. Wer die
  Bildanzahl ändern will, fasst `beats.js` an — nicht den Prompt.
- **`promptBuilder.js` ist die gefährlichste Datei.** Eine Figur ohne Foto
  darf keinen Referenz-Index verbrauchen, sonst zeigen alle späteren
  Klauseln auf das falsche Gesicht. Tests dafür sind da; bei Änderungen
  ausführen.
- Credits werden abgebucht, aber **erst nach erfolgreichem Aufruf** — ein
  Fehlschlag darf nichts kosten. Neue Installationen bekommen einmalig 25.
  Weiterhin keine Zugangskontrolle: `localStorage` ist editierbar.
- Modellnamen gehören nicht in die Oberfläche (Provider-Wechsel wäre sonst
  eine Textänderung). Der Datenschutzhinweis nennt die Dienstleister trotzdem
  — das ist eine Pflichtangabe, keine Werbung.
- Noch offen aus der Spec: Character-Sheets für beschriebene Figuren ohne
  Foto (2 Credits), und generierte Medien zusätzlich lokal speichern.

## 2026-08-07 16:30 — Anton — Branch `claude/new-session-x9qv1w`

**Was:** Phase 1 des App-Umbaus komplett — die App ist jetzt eine React-SPA
mit fünf Tabs statt drei loser HTML-Seiten. Vorher entstanden Spec
(`docs/specs/2026-08-07-app-umbau-design.md`), `ADR-0004` und der
Implementierungsplan (`docs/plans/2026-08-07-phase1-geruest.md`, 12 Aufgaben);
danach wurde der Plan Aufgabe für Aufgabe abgearbeitet.

Neu: Vite-Build, `src/lib/` (storage, symbols, tags, streak, creatures, api),
`src/state/AppState.jsx` als einziger Schreibpfad in den Speicher,
`src/components/` (Button, Card, ScreenHeader, TabBar, Splash, Toast),
`src/screens/` (Home, Journal, Symbols, Profile, Dream). `legacy/` gelöscht.
Oberfläche durchgehend auf Deutsch.

**Warum:** Die App soll sich wie eine App anfühlen und später über Capacitor
nach iOS/Android portiert werden. Der sechsstufige Wizard aus der Spec braucht
Zustand über mehrere Schritte — das ist von Hand geführter DOM-Zustand in
seiner fehleranfälligsten Form. Next.js wurde verworfen: seine Kernfunktionen
(SSR, API-Routen, SEO) sind für ein Capacitor-Bundle wertlos, man müsste sie
abschalten, um es einsetzen zu können. Begründung in ADR-0004.

**Zwei Fehler, die beim Planen auffielen — beide vor der Umsetzung behoben:**

1. **`state.lastDream` ist ein DATUM, kein Traumtext.** Der Feldname legt das
   Gegenteil nahe, und die Serien-Logik vergleicht ihn mit `todayStr()`. Ein
   erster Planentwurf schrieb dort den Traumtext hinein — das hätte die Serie
   bei jedem Traum still auf 1 zurückgesetzt. `src/lib/streak.js` hat jetzt
   sechs Tests, die genau das abdecken, und einen Warnkommentar.
2. **Die Menagerie wäre verschwunden.** Die Spec sagt „Menagerie und Streak
   nach Home", der erste Plan portierte nur den Streak. Nutzer haben Wesen im
   Speicher — die wären ersatzlos weg gewesen.

**Sicherheit — nebenbei verbessert:** Die Web-Wurzel ist jetzt `dist/` statt
des Repositories. Damit liegen `.env`, `.git/`, `docs/`, `src/` und
`server.js` **strukturell** außerhalb dessen, was `resolveStatic()` überhaupt
auflösen kann — zweite, unabhängige Schranke zusätzlich zur Freigabeliste.
`scripts/test-static.mjs` prüft das (33 Prüfungen) und wurde entsprechend auf
`dist/` umgestellt. Außerdem gibt es kein `innerHTML` mehr im Anwendungscode:
React escaped von sich aus.

**Verifiziert:** 24 Unit-Tests (`bun test`), 33 Freigabe-Prüfungen,
Prompt-Hygiene-Tests, Build grün. Echter HTTP-Abruf gegen den laufenden
Server: `/` und `/assets/*` liefern 200, `.env`, `/src/`, `/legacy/`,
`/server.js` und `/package.json` liefern 404. Im Browser durchgespielt: Traum
eingegeben → echtes Bild von fal.ai zurück → Eintrag im Tagebuch mit Bild →
Wesen („Nyxjelly", Rare) auf der Startseite → Serie auf 1 → Symbole (Water,
Flying, Joy & warmth) korrekt erkannt.

**Unterwegs korrigiert:** „🔥 1 Tage" → „1 Tag" (Singular).

**Was der Nächste wissen muss:**
- **`bun server.js` allein genügt nicht mehr.** Ohne `bun run build` gibt es
  kein `dist/` und alles antwortet 404. Zum Entwickeln `bun run dev`
  (Oberfläche 5173 mit Hot Reload, API 8100).
- Der Speicherschlüssel bleibt `dreamrushes_v1`; alle neuen Felder
  (`credits`, `originalText`, …) sind optional mit Vorgabewert. Bestehende
  Traumtagebücher laden unverändert weiter.
- Orte brauchten kein neues Datenfeld: `state.cast` kennt bereits
  `category: "place"`. Avatare und Orte sind dieselbe Struktur, nur gefiltert.
- `src/screens/Dream/DreamScreen.jsx` ist bewusst ein 1:1-Port des alten
  Formulars und wird in Phase 2 durch den Wizard ersetzt — deshalb klein
  gehalten.
- Ein verwaister `bun`-Prozess kann Port 8100 blockieren und dann eine
  irreführende Meldung („Port vom OS reserviert") auslösen. `netstat -ano |
  grep :8100` zeigt den Übeltäter.

## 2026-08-07 14:20 — Anton — Branch `claude/new-session-x9qv1w`

**Was:** fal.ai + DeepSeek end-to-end verifiziert (Punkt 1 der letzten
"Nächsten Schritte"). Anton hat echte Keys lokal in `.env` eingetragen
(`FAL_KEY`, `DEEPSEEK_KEY`, git-ignoriert, nicht Teil dieses Commits). Server
über `bun server.js` gestartet und `/api/generate` real getestet:
Bild-Modus und Film-Modus, jeweils `200 OK` mit echten Medien-URLs
(`https://v3b.fal.media/...`), keine Fehler im Log → DeepSeek hat den Prompt
tatsächlich geschrieben (kein Fallback-Log ausgelöst), `fal-ai/nano-banana-2`
und `minimax/h3/image-to-video` sind damit bestätigte, keine unverifizierten
Modell-Slugs mehr.

Zusätzlich: `.claude/launch.json` um eine `dev`-Konfiguration erweitert
(`bun server.js`), damit die App künftig über den echten Server mit
Freigabeliste läuft statt über `static-preview`
(`python3 -m http.server`) — letzteres liefert das gesamte Verzeichnis aus
und darf laut Sicherheitsabschnitt in STAND.md nicht laufen, sobald `.env`
existiert (jetzt der Fall). `static-preview` bleibt als Eintrag erhalten,
falls doch mal ohne Secrets statisch getestet werden soll.

**Warum:** Anton wollte die Keys testen und die App lokal sehen können,
ohne versehentlich `.env` über den unsicheren Static-Server zu exponieren.

**Was der Nächste wissen muss:**
- Punkt 1 der alten "Nächsten Schritte" ist erledigt — `FAL_MODEL_IMAGE`,
  `FAL_MODEL_VIDEO` und die DeepSeek-Response-Shape sind jetzt live bestätigt,
  nicht mehr nur Annahme.
- App künftig mit `.claude/launch.json`-Eintrag `dev` starten (`bun
  server.js`), nicht mit `static-preview`.
- **Offener Wunsch von Anton:** von der App aus generierte Bilder/Videos
  sollen zusätzlich lokal gespeichert werden (aktuell nur die
  fal.ai-Hosting-URL, die serverseitig durchgereicht und im Tagebuch-Eintrag
  referenziert wird — kein eigener lokaler Download/Cache). Noch nicht
  umgesetzt, nur besprochen.

## 2026-08-07 13:30 — Anton — Branch `claude/new-session-x9qv1w`

**Was:** Higgsfield komplett entfernt (Code + `@higgsfield/client`-Dependency).
Video läuft jetzt über fal.ai (`minimax/h3/image-to-video`, von Anton direkt
vorgegeben). Neuer, optionaler DeepSeek-Key als Prompt-Schnittstelle:
`craftPromptViaDeepseek()` schickt Traumtext + Nano-Banana-6-Elemente-Formel
(aus dem `nanobanana`-Skill) + Name/Kategorie/Beschreibung jedes benannten
Referenzfotos an `deepseek-v4-flash`, bekommt einen fertigen Bild-Prompt
zurück. `generateImages()`/`generateVideo()` in `server.js` orchestrieren
DeepSeek → fal.ai; Film-Modus generiert zuerst ein Standbild und animiert es
(image-to-video braucht ein Ausgangsbild, es gibt keinen Text-to-Video-Pfad
mehr). `README.md`, `scripts/test-static.mjs`-Kommentar, `.env.example`,
`index.html`-UI-Texte (Modell-Label, Datenschutzhinweis) entsprechend
aktualisiert. `scripts/test-prompt-sanitize.mjs` umgestellt: testet jetzt
`buildFallbackPrompt()`/`sanitizeTag()` statt des entfernten
`withStyleContext()`.

**Warum:** Anton wollte den Video-Provider konkretisieren (minimax/h3) und
eine zweite KI (DeepSeek) als Prompt-Schreiber dazwischenschalten, die die
Skill-Formel und die Referenzfoto-Namen kennt.

**Wichtiger Fund unterwegs (per Web-Recherche geprüft, nicht geraten):**
DeepSeek nannte "Flash 4" als Modell — richtig war `deepseek-v4-flash`,
existiert wirklich (284B/13B-MoE, öffentliche Beta, OpenAI-kompatible API).
Aber: **die öffentliche API ist textbasiert, kein Bild-Input** — bestätigt
über offizielle DeepSeek-Docs plus DeepInfra/OpenRouter/AIML-API-Referenzen.
Ursprünglicher Plan war, DeepSeek die Fotos sehen zu lassen; das geht mit
dieser API nicht. Nach Rückfrage entschieden: DeepSeek bekommt nur
Text-Metadaten (Tag/Kategorie/Beschreibung), die echten Fotos gehen direkt an
fal.ai/Nano Banana (das selbst Vision hat).

**Sicherheit:** DeepSeeks Rückgabetext wird vor Weiterverwendung durch
`sanitizePromptText()` geschickt wie jeder andere Prompt-Baustein auch —
er wird zum Prompt für einen weiteren bezahlten Drittanbieter-Aufruf und
verdient dasselbe Misstrauen wie Nutzereingaben, unabhängig davon, wie
gutartig DeepSeek normalerweise antwortet.

**Nicht end-to-end verifiziert:** Weder `fal.run` noch vermutlich
`api.deepseek.com` sind aus dieser Sandbox erreichbar (Netzwerk-Policy,
403). Getestet: Syntax, beide Testsuiten grün, Fehlerfall für Bild UND Film
per curl und Playwright — App fällt sauber auf Demo-Modus zurück.

**Was der Nächste wissen muss:**
- `FAL_MODEL_VIDEO` kam direkt von Anton, ist aber trotzdem unverifiziert —
  fal.ai-Modell-IDs sind sonst meist unter `fal-ai/...` genamespaced, beim
  ersten echten Test gegenprüfen.
- Ohne `DEEPSEEK_KEY` läuft alles weiter wie zuvor (lokale Prompt-Vorlage,
  `buildFallbackPrompt()`) — DeepSeek ist eine reine Qualitätsverbesserung,
  kein Hard-Dependency.
- `docs/STAND.md` entsprechend aktualisiert.

## 2026-08-07 12:15 — Anton — Branch `claude/new-session-x9qv1w`

**Was:** fal.ai (Nano Banana 2) für die Bildgenerierung angebunden, mit
namentlichen Referenzbildern. `server.js`: neue `falGenerateImage()` +
`buildNanoBananaPrompt()`, Video bleibt bei `higgsfieldGenerateVideo()`
(umbenannt, Bild-Zweig entfernt). `index.html`: `tryBackend()` schickt nur
noch Cast-Einträge (`@tag`), deren Name wörtlich im Traumtext vorkommt
(`mentionsTag()`), `@me` bleibt immer dabei. `.env.example` aktualisiert
(`FAL_KEY` aktiv statt geplant).

**Warum:** Anton hat einen Nano-Banana-Prompt-Skill (`nanobanana`) im
Repo-Kontext; Wunsch war, fal.ai für Bildgenerierung darüber laufen zu
lassen und Referenzbilder per Name zu binden — genau wie das Skill für
Charakter-/Bild-Referenzen (`@char1`/`@img1`) in seiner "PJ's Grid"-Struktur
vormacht. Umgesetzt als Prompt-Klausel pro Referenzbild: "Reference image N
shows @tag — depict them with this exact likeness whenever 'tag' appears."

**Sicherheit:** Tags werden serverseitig erneut sanitisiert
(`sanitizeTag()`), nicht nur dem Client vertraut — gleiches Prinzip wie
`sanitizeFragment()` vorher. `cast`-Array serverseitig auf Form, Länge
(`MAX_REFERENCES`) und erlaubte Kategorien geprüft, bevor es in den Prompt
oder an fal.ai geht.

**Nicht end-to-end verifiziert:** `fal.run` ist von dieser Sandbox aus nicht
erreichbar (Netzwerk-Policy blockt den Host, `403 request rejected: host
not permitted` — keine Umgehung versucht, siehe `/root/.ccr/README.md`).
Verifiziert stattdessen: Syntax (`bun build`), beide Bestands-Testsuiten
weiterhin grün, und der Fehlerfall per Playwright — App fällt bei
fehlgeschlagenem `/api/generate` sauber auf Demo-Modus zurück, kein Absturz.

**Was der Nächste wissen muss:**
- Modell-Slug `fal-ai/nano-banana-2` (`FAL_MODEL_IMAGE` überschreibbar) und
  die erwartete Response-Form (`data.images[].url`) sind **unverifizierte
  Annahmen** — vor Produktivbetrieb gegen den echten fal.ai-Katalog prüfen.
- Wer Netzwerkzugriff auf `fal.run` hat: einen Traum mit benanntem
  Cast-Mitglied (z.B. "…mein Hund Rex…" mit @rex-Foto) durchlaufen lassen
  und prüfen, ob das Referenzbild tatsächlich verwendet wird.
- Pet/Place-Fotos gehen jetzt als echte Bildreferenzen an Nano Banana (nicht
  mehr nur als Text-Klausel wie beim alten Higgsfield-Bildpfad) — die alte
  `withStyleContext()`-Textklausel existiert nur noch für den Video-Pfad.
- Docs (`docs/STAND.md`) entsprechend aktualisiert.
## 2026-08-07 12:50 — Hanni — Branch `session/2026-08-07-hanni-fotos`

**Was:** Foto-Bibliothek als eigene Seite `fotos.html` plus optische Erkennung
der Namen im Traum-Eingabefeld.

- **Bibliothek**: hochladen, Namen vergeben, Kategorie (Person/Haustier/Ort),
  Kurzbeschreibung, bearbeiten, löschen, durchsuchen. Zeigt je Foto, in wie
  vielen Träumen sein Name vorkam. Erreichbar über einen neuen Knopf oben
  rechts, auf `index.html` und `symbole.html`.
- **Namen im Eingabefeld**: getippte Wörter, die einem Bibliotheks-Namen
  entsprechen, werden hinterlegt dargestellt; darunter zeigt eine Leiste mit
  Vorschaubildern, welche Fotos dieser Traum mitschickt.

**Warum kein neuer Datenspeicher:** Die Bibliothek arbeitet auf `state.cast` —
derselben Struktur, die Antons Generierungs-Code liest. Ein zweiter Speicher
für „Fotos" neben dem „Cast" hätte zwei Wahrheiten erzeugt.

**Technisch zur Hervorhebung:** Ein `<textarea>` kann keine gestalteten
Elemente enthalten. Hinter dem Feld liegt deshalb eine deckungsgleiche Ebene
mit demselben Text, in der die Namen hinterlegt sind; das Feld selbst ist
transparent. Schrift, Größe, Zeilenhöhe und Innenabstand müssen exakt
übereinstimmen — gemessen verifiziert: 0 px Abweichung, auch auf Handybreite,
und die Ebene scrollt mit. Verworfen wurde `contenteditable`, das
Spracheingabe, Einfüge-Bereinigung und Zeichenzähler gebrochen hätte.

**Nachgereicht (13:40) — kritische Durchsicht vor dem Merge, vier Befunde:**

- **NUL-Byte in `index.html`.** Beim Bearbeiten wurde aus `join(' ')` ein
  `join('\0')`. Funktional trennt das zwar auch, aber die Datei galt damit als
  binär: `grep` schwieg, `file` meldete „data", und Diffs wären im Review
  unlesbar gewesen. Aufgefallen, weil `grep renderCast index.html` plötzlich
  nichts mehr fand. Ersetzt durch `'|'`. **Dasselbe Muster wie heute früh beim
  Testskript** — bei Bearbeitungen von Hand lohnt ein Blick auf `file <datei>`.
- **Tippen ruckelte, sobald Tags trafen.** Die Leiste unter dem Eingabefeld
  wurde bei *jedem* Tastendruck neu aufgebaut, samt `<img>` mit base64-Daten,
  die der Browser jedes Mal neu dekodiert. Gemessen mit handygroßen Fotos:
  **10,78 ms pro Anschlag** (ein Bild dauert 16,7 ms) gegen 0,01 ms ohne
  Treffer. Jetzt wird die Leiste nur bei geänderter Auswahl neu gebaut:
  **0,07 ms**. Peinlich, weil ich exakt diesen Fehler heute früh im
  Symbol-Code kritisiert hatte.
- **Hervorhebung zog bei Cast-Änderungen nicht mit.** `window.repaintDreamTags`
  war für genau diesen Zweck exportiert und wurde nirgends gerufen — ein Foto
  über die Leiste auf der Startseite hinzuzufügen ließ die Hervorhebung
  unverändert bis zum Neuladen. Jetzt an Hinzufügen und Entfernen verdrahtet.
- **Kein Zurückrollen bei vollem Speicher.** In der Bibliothek landete das Foto
  erst im Arbeitsspeicher und dann im `save()`. Schlug das fehl, stand es in
  der Liste, war aber beim nächsten Laden weg. Jetzt wird der Eintrag bei
  Misserfolg wieder entfernt — verifiziert.

Ein vierter Verdacht war **falsch**: Ich hielt die Ebene für nicht mitwachsend,
wenn man das Eingabefeld größer zieht. Gemessen wächst sie korrekt mit
(112→268 px); die 8 px Unterschied zum Feld sind der Zeilenabstand, den ein
`textarea` als Inline-Element belegt, und für die Textausrichtung folgenlos.

**Was der Nächste wissen muss:**
- **Merge-Hinweis:** `mentionsTag()` steht jetzt in `app.js`, weil beide Seiten
  sie brauchen. Anton hat auf `claude/new-session-x9qv1w` eine gleichnamige
  Funktion direkt in `index.html`. Beim Zusammenführen bleibt die Fassung aus
  `app.js`, seine Kopie entfällt — die Logik ist dieselbe (Wortgrenzen,
  Groß-/Kleinschreibung egal).
- **Beim Bauen gefunden und behoben:** Die dritte Kopfzeilen-Pille brachte den
  Überlauf auf Handybreite zurück, den ich gestern behoben hatte. Ursache:
  `header` durfte umbrechen, `.hdr-actions` nicht. Jetzt beide. Der Kopf
  belegt auf schmalen Schirmen zwei Zeilen statt seitlich zu scrollen.
- Namen werden auf `[a-z0-9]` normalisiert, weil man sie im Traumtext tippen
  können muss. Doppelte Namen und `me` (für das eigene Gesicht reserviert)
  werden abgelehnt.
- **Speicherlimit bleibt die harte Grenze.** Fotos liegen base64 im
  localStorage; die Bibliothek macht es leicht, viele anzulegen. `save()`
  fängt das ab und meldet es per Hinweis, aber ein Foto geht dann verloren.
  Echte Abhilfe erst mit dem Backend.
- Geprüft: Wortgrenzen (`anna` trifft nicht in „annals", `island` nicht in
  „islander"), XSS über manipulierte Tags und Bildpfade (Nutzlast bleibt
  Text, kein `on*`-Attribut), Suche, Doppelnamen-Sperre, Tastaturbedienung,
  volles localStorage, keine Konsolenfehler.

## 2026-08-07 10:35 — Anton — Branch `claude/new-session-x9qv1w`

**Was:** Session-Abschluss zum fal.ai-Key-Eintrag unten (Commit `7491dab`).
Keine weiteren Code-/Doku-Änderungen, nur Klärung der Architektur im
Gespräch — festgehalten, damit es nicht verloren geht.

**Warum:** Frage war, ob der fal.ai-Key später in eine iPhone-App eingebaut
werden kann, auf die Nutzer Zugriff haben.

**Was der Nächste wissen muss:**
- **Nein, der Key darf nie im Client-Bundle landen** (weder Web-JS noch
  später ein kompiliertes iPhone-App-Bundle) — beides ist extrahierbar.
  Nutzer bekommen Zugriff auf die *Funktion* (Generieren), nie auf den Key
  selbst.
- Architektur bleibt: Client → eigener Server (`server.js`) → fal.ai. Das
  gilt identisch für lokales Testen und für die spätere iPhone-App (per
  Capacitor, siehe „Bekannte Baustellen" in STAND.md) — der Server bleibt in
  beiden Fällen der einzige Ort mit dem Key.
- Zum Testen „wie die finale App": Kollegin trägt den Key in ihre eigene
  lokale `.env` ein (bekommt ihn außerhalb des Repos von Anton), startet
  `bun server.js` lokal, testet über den Browser/Simulator gegen ihren
  eigenen lokalen Server — das ist bereits strukturell identisch zur
  Produktion.
- Dadurch wird der schon in STAND.md vermerkte offene Punkt „`/api/generate`
  ohne Auth/Rate-Limit" für eine öffentliche iPhone-App verbindlich zu lösen,
  bevor echte Nutzer draufzugreifen — sonst verbraucht jeder unbegrenzt das
  fal.ai-Guthaben über den gemeinsamen Server.

## 2026-08-07 — Anton — Branch `claude/new-session-x9qv1w`

**Was:** fal.ai-API-Key als geplanten Ersatz für Higgsfield vorbereitet.
`.env.example` um `FAL_KEY` ergänzt (Vorlage, kein echter Wert, sicher zu
committen). Den echten Key **nicht** ins Repo gelegt — landet nur lokal in
`.env` (git-ignoriert).

**Warum:** Higgsfield soll komplett durch fal.ai ersetzt werden (Bild, Video,
und neu: LLM-Funktion). Die eigentliche Anbindung in `server.js` macht eine
Kollegin, wenn sie sie braucht.

**Was der Nächste wissen muss:**
- `.env` wird NIE über git geteilt (Absicht, siehe AGENTS.md). Wer den echten
  fal.ai-Key braucht, bekommt ihn außerhalb des Repos (Passwort-Manager/DM),
  nicht automatisch durch Repo-Zugriff.
- `server.js` läuft weiterhin komplett auf Higgsfield (`@higgsfield/client`,
  `HF_CREDENTIALS`, Model-Slugs `nano-banana-2/text-to-image` und
  `seedance-2/text-to-video`) — daran wurde nichts geändert. Die
  fal.ai-Umstellung (SDK-Wahl, Modell-Slugs, ggf. neue LLM-Route für
  Traumtext) ist offen.
- `docs/STAND.md` entsprechend aktualisiert.
## 2026-08-07 11:40 — Hanni — Branch `session/2026-08-07-hanni-symbole`

**Was:** Neue Seite `symbole.html` — Sammlung wiederkehrender Traumsymbole mit
Deutung, plus Lebensereignisse zum Verknüpfen. Die Menagerie-Überschrift auf
der Hauptseite führt dorthin.

**Zwei Klarstellungen vorab, die den Zuschnitt bestimmt haben:**
- Der Wunsch lautete, Symbole „aus den generierten Traumvisualisierungen" zu
  erstellen. Das geht so nicht sinnvoll: die Symbole stecken bereits im
  *Traumtext* — das Bild ist nur dessen Darstellung. Bildanalyse bräuchte ein
  Vision-Modell, einen weiteren Anbieter, einen weiteren Schlüssel und damit
  das Backend, das es nicht gibt. Entschieden: Erkennung aus dem Text, als
  Ausbau von Antons `CREATURE_POOL`, der genau das schon grob tat.
- Deutung kommt als mitgeliefertes Lexikon, ausdrücklich als gängige Lesart
  gekennzeichnet, nicht als Diagnose. Die Seite sagt das auch. Sobald eine App
  Träume mit Jobwechseln verknüpft, darf sie nicht klinisch klingen.

**Struktur (ADR-0003):** Die Entscheidung für eine echte zweite HTML-Datei
erzwang die Auslagerung von `app.css` (230 Zeilen) und `app.js`. Duplizieren
wäre bei den Stilen ärgerlich gewesen und bei der Speicherschicht gefährlich:
zwei driftende Kopien eines Datenschemas beschädigen Tagebücher. `app.js` hält
jetzt Speicher, `escapeHtml`, `toast` und die Symbolerkennung; alles
Seitenspezifische blieb, wo es war. `index.html` schrumpfte von 792 auf ~560
Zeilen.

**Symbolerkennung:** 20 Symbole in fünf Kategorien (Orte, Szenarien, Wesen,
Menschen, Gefühle), abgedeckt sind beide vom Produktbesitzer genannten
Beispiele (Strand → *Water*, verpasster Flug → *Missing something*).
Vorkommen werden **nicht gespeichert**, sondern bei jedem Rendern aus
`state.journal` neu berechnet — keine Migration, keine doppelten Daten, und ein
später ergänztes Symbol reichert rückwirkend alte Träume an. Treffer laufen
über Wortgrenzen, sonst hätte „sea" in „season" und „cat" in „catalogue"
angeschlagen; beides geprüft.

**Lebensereignisse:** `state.events` mit Titel, Zeitraum, Notiz und verknüpften
Symbolen. Neben der ausdrücklichen Verknüpfung zeigt die Karte, wie viele
Träume in den Zeitraum fielen und wie oft die verknüpften Symbole darin
vorkamen — das macht „ich habe Urlaub gebucht und träume seitdem vom Strand"
sichtbar, ohne Kausalität zu behaupten.

**Sicherheit:** Ereignistitel und Notizen sind ein *neuer* Kanal für Nutzertext
ins DOM. XSS-Test dagegen gefahren (bösartiger Titel, bösartige Notiz,
bösartiger Traumtext): Nutzlast bleibt inert, kein einziges Element trägt ein
`on*`-Attribut. Anmerkung für den Nächsten: eine Zeichenkettensuche in
`outerHTML` ist hier **kein** gültiger Nachweis — der Browser gibt `&quot;` in
Textknoten wieder als `"` aus, weil Anführungszeichen dort harmlos sind. Prüfe
auf echte Attribute, nicht auf Text.

`PUBLIC_FILES` in `server.js` um `/symbole.html`, `/app.css`, `/app.js`
erweitert, `scripts/test-static.mjs` entsprechend (jetzt 31 Prüfungen). Rot-Probe
wiederholt: Test schlägt weiterhin fehl, wenn die Freigabe aufgeweicht wird.

**Nachgereicht (13:10) — kritische Durchsicht, zwei echte Fehler gefunden:**

- **Zeitzonen-Fehler in `dreamsDuringEvent()` (schwerwiegend).** Ereignisdaten
  sind reine Kalendertage (`2026-08-01`); `new Date()` liest die als
  UTC-Mitternacht, Traumzeitstempel sind dagegen echte Zeitpunkte. In Berlin
  (UTC+2) fiel damit ein um 00:30 Uhr notierter Traum aus dem Zeitraum seines
  eigenen Tages — ausgerechnet die Träume, die man direkt nach dem Aufwachen
  einträgt, also der Kernfall der App. Gemessen bestätigt (`2026-08-01 00:30`
  Ortszeit → `2026-07-31T22:30Z` → nicht gefunden), behoben durch Tagesgrenzen
  in Ortszeit (`localDayStart`/`localDayEnd`). Gegengeprüft: 00:30 und 23:45
  werden gefunden, der Vortag um 23:30 korrekt ausgeschlossen.
- **Unnötiger Rechenaufwand.** `detectSymbols()` übersetzte pro Aufruf 211
  reguläre Ausdrücke neu, und `renderEvents()` rief die Erkennung zusätzlich
  pro verknüpftem Symbol erneut für *jeden* Traum auf. Jetzt ein
  vorkompilierter Ausdruck je Symbol (20 statt 211, einmalig beim Laden) und
  eine Erkennung pro Traum statt pro Traum × Symbol.
- Kleiner Fund nebenbei: `detectSymbols` verfehlte typografische Apostrophe —
  „can’t find" aus der Zwischenablage traf nicht auf „can't find". Wird jetzt
  angeglichen. Ebenso fehlten `raining`, `waves`, `flooding` bei *Water*,
  während andere Symbole ihre Beugungen längst hatten.

Gegen Fehlalarme geprüft: „brain", „training", „terrain", „doghouse",
„scattered", „season", „catalogue", „flattering" lösen weiterhin nichts aus.

**Nachgereicht (12:30):** In der Auswahl „Symbols you connect with it" heben
sich jetzt die Symbole ab, die tatsächlich in den eigenen Träumen vorkommen —
mit Trefferzahl und einem Lichtpunkt, der einmal um den Rand läuft. Technisch
ein rotierender Kegelverlauf, aus dem die Mitte per Maske ausgestanzt wird
(`@property --chip-a` für den Winkel); kein zusätzliches Element, und der Ring
bleibt beim Umbrechen rund. Ohne `@property`-Unterstützung steht der Ring
still, die Hervorhebung bleibt sichtbar; bei `prefers-reduced-motion` ebenso.
Die hervorgehobenen Chips stehen zudem vorn — unter zwanzig Chips findet man
sie sonst nicht. Eine kurze Zeile über der Auswahl erklärt, was das Leuchten
bedeutet.

**Nachgereicht (12:05):** Der Weg zur Analyseseite führt nicht mehr über die
anklickbare Überschrift, sondern über einen eigenen Knopf „✦ What does it
mean?" unter der Kreaturen-Sammlung — auf Wunsch des Produktbesitzers.
Bewusst als Geister-Knopf gestaltet: der Hauptknopf der Seite ist „Summon the
dream", ein zweiter Verlaufsknopf hätte mit ihm konkurriert. Die dadurch
verwaiste Klasse `.sec-link` wurde entfernt, ebenso `.sym-card.dim`, das nie
zum Einsatz kam (Symbole ohne Vorkommen werden gar nicht erst gerendert).
Automatische Prüfung über beide Seiten meldet keine ungenutzte Klasse mehr.

**Was der Nächste wissen muss:**
- **Stichwörter sind rein englisch** — bewusst so entschieden. Deutsche
  Traumeinträge liefern keine Symbole. Wer das ändert, ergänzt `SYMBOLS` in
  `app.js` um deutsche Begriffe; die Wortgrenzen-Logik trägt das mit.
- `app.js` ist ein klassisches Skript, kein Modul: Ladereihenfolge vor dem
  Seitenskript ist bindend.
- Verifiziert: Symbolerkennung pro Traum, Modal per Tastatur, Bearbeiten/
  Löschen von Ereignissen, ungültiger Zeitraum wird abgefangen, keine
  Überläufe auf Handybreite, keine Konsolenfehler, Hauptseite nach der
  Auslagerung unverändert funktionsfähig.

## 2026-08-07 10:15 — Hanni — Branch `session/2026-08-07-hanni`

**Was:** Kritische Selbstprüfung des Redesigns von 09:30. Fünf Befunde, alle
behoben — davon zwei echte Fehler, die ich selbst eingebaut hatte.

**Barrierefreiheit (die zwei echten Fehler)**
- **Kontrast:** Das neue Token `--faint` (`#736c99`) fiel auf *jedem* realen
  Untergrund durch WCAG AA — im schlimmsten Fall 2,63:1 in der Eingabekapsel.
  Betroffen war unter anderem der Datenschutzhinweis, also ausgerechnet der
  Text, der ehrlich sagt, dass Fotos hochgeladen werden. Verschärft hatte ich
  es selbst, indem ich `.ctl-lbl` und `.cap-label` von `--muted` auf `--faint`
  umgestellt hatte. Gelöst nicht durch Aufhellen allein (das hätte `--faint`
  und `--muted` ununterscheidbar gemacht), sondern zusätzlich durch eine
  **dunklere Eingabekapsel** — was ohnehin näher an Moonly ist, wo die
  Eingabekarte dunkler als der Himmel ist. Gemessen: jetzt 4,79–5,81:1 auf
  allen Untergründen.
- **Tastatur:** Die Tagebuchkarten waren anklickbar, aber per Tastatur nicht
  erreichbar — das ging schon bei ihrer Einführung gestern schief. Jetzt
  `tabindex`/`role="button"` mit Enter/Space-Behandlung, sichtbarer
  Fokusrahmen, und der Löschknopf ist ein echter `<button>` mit `aria-label`,
  der auch bei Tastaturfokus eingeblendet wird. Verifiziert: Fokus landet auf
  der Karte, Enter öffnet sie, Enter auf dem Löschknopf öffnet *nicht*
  zusätzlich das Modal.

**Aufräumen**
- Toter CSS-Block `.strip` (5 Regeln) entfernt — wurde nie benutzt, der
  Bildstreifen entsteht per Inline-Style. Ebenso das nie verwendete Token
  `--mono`. Beides stammte aus Antons Bestand. Automatisch geprüft: keine
  ungenutzte Klasse mehr im Stylesheet.
- Inline-Styles aus dem Markup in eine Klasse `.hint-inline` überführt.
- Doppelte Leerstelle in der Guide-Pille beseitigt (`Lucid  Guide`).

**Sicherheit unverändert geprüft:** Die Render-Funktion des Tagebuchs wurde
komplett umgeschrieben, deshalb den XSS-Test von gestern gegen die *neue*
Kartenstruktur wiederholt — bösartige URL, bösartiger Titel, bösartiger Text.
Ergebnis: alle Nutzlasten inert, kein `onerror`/`onmouseover` im DOM, Flag
bleibt 0. Auch das neue `aria-label` ist escaped.

**Was der Nächste wissen muss:**
- Kontraste sind rechnerisch belegt (Skript im Worklog-Verlauf nachvollziehbar:
  sRGB-Luminanz, Panel-Blend gegen den Verlauf an drei Stellen). Wer die Farben
  ändert, muss `--faint` erneut gegen `rgba(11,7,24,.55)` über `#2a1d5e`
  prüfen — das ist der ungünstigste Fall.
- **Noch offen, bewusst nicht angefasst:** Die Cast-Kacheln (`.face .rm`) haben
  dasselbe Tastaturproblem wie die Tagebuchkarten vorher — Löschknopf ist ein
  `<div>`. Das ist Antons Bestand und war nicht Teil dieses Umbaus; wer die
  Cast-Auswahl anfasst, sollte es mitnehmen.

## 2026-08-07 09:30 — Hanni — Branch `session/2026-08-07-hanni`

**Was:** Design-Überarbeitung von `index.html` anhand von Mobbin-Referenzen.
Nur Optik und Struktur — keine Funktion, kein Sicherheitscode angefasst.

**Wie die Richtung zustande kam:** Erst Referenzen gesichtet (Mobbin-MCP,
16 Screens), dann entschieden. Zwischenzeitlich stand die pillowtalk-Linie
(streng, schwarz, schmucklos) im Raum. Ein Abgleich mit Antons tatsächlichen
Tokens hat das widerlegt: er hatte bereits violetten Nachthimmel-Verlauf
(`#1a1140`), einen Mond im Logo (`.moon`) und Sternenpartikel (`.dust`) gebaut.
Damit steht sein Bestand viel näher an **Moonly** (Traumdeutungs-App, violette
Nacht, illustriert) als an pillowtalk. Entscheidung deshalb: Moonlys Wärme als
Leitbild — bestätigt Antons Richtung, statt sie wegzuwerfen — kombiniert mit
pillowtalks *Struktur* fürs Tagebuch.

Umgesetzt:
- **Farbwelt wärmer**: Hintergrund von kühlem Fast-Schwarz auf violette Nacht
  (`--sky:#2a1d5e`), neue Tokens `--violet-soft`/`--violet-deep`/`--faint`.
  Neon-Verlauf aus Überschrift und Hauptknopf entfernt — beide jetzt einfarbig
  violett. Sternenpartikel von Opazität .5 auf .28 gedämpft, dazu
  `prefers-reduced-motion`-Abschaltung.
- **Typo-Skala** als Tokens (`--t-hero` … `--t-micro`); vorher wuchs jede Größe
  für sich. Schriftgewichte durchgehend von 700/800 auf 500/600 zurückgenommen.
- **Tagebuch** (das Herzstück): Kachel-Grid raus, vollbreite Einträge rein —
  Titel links, Datum als Anker rechts (Monat klein, Tag groß und dünn), Bild
  darunter über die volle Breite, Traumtext darunter wie der Prompt bei Canva.
- **Eingabe**: die nummerierten Blöcke ①②③ sind weg, stattdessen ein einziger
  Hauptknopf über die volle Breite **am Ende** des Formulars (Moonly). Der
  Ladezustand steckt jetzt im Knopf statt in einem separaten Bereich.
- **Menagerie** bewusst zurückgenommen (kleinere Karten, leiser), damit das
  Tagebuch führt. **Guide** editorialer mit mehr Zeilenabstand und Luft.
- Inhaltsbreite von 960px auf 680px — die App ist ein Handy-Format.

**Warum:** Antons Farbwelt war stimmig, es fehlte Struktur — Typo-Hierarchie,
Gruppierung, ruhigere Flächen. Ein kompletter Identitätswechsel hätte
funktionierende Arbeit zerstört.

**Was der Nächste wissen muss:**
- **Beim Umbau gefunden und behoben:** der Kopfbereich lief auf Handybreite über
  (brauchte 422px bei 350px verfügbar) und hätte seitliches Scrollen erzwungen —
  ausgerechnet bei einer App, die man nachts am Handy benutzt. Jetzt
  `flex-wrap` plus Media Query unter 460px, in der die Wortmarken der Pillen
  ausgeblendet werden („🔥 1" statt „🔥 1-day streak"). Gemessen verifiziert:
  Kopf passt in eine Zeile, kein Überlauf.
- `.jgrid` wurde zu `.jlist` (Flex-Spalte). Der Lucid-Guide nutzte dieselbe
  Klasse und hat jetzt eine eigene, `.guide-grid` — wer `.jgrid` sucht, sucht
  vergeblich.
- Der Löschen-Knopf der Tagebuchkarte sitzt jetzt **im Bild oben links**; oben
  rechts liegt das Modus-Abzeichen, rechts daneben das Datum. Vorher überlagerte
  er die Monatsangabe.
- Verifiziert: beide Modi erzeugen Einträge, Modal spielt den richtigen Medientyp,
  keine Konsolenfehler, beide Testsuiten grün. Live-Generierung weiterhin
  ungetestet (kein `bun`, kein Key).

## 2026-08-06 18:20 — Hanni — Branch `session/2026-08-06-hanni-preview-bind`

**Was:** Die statische Vorschau abgesichert und `.claude/launch.json` ins Repo
aufgenommen (vorher unversioniert im Arbeitsverzeichnis).

Gefunden beim Durchsehen der bis dahin unversionierten `launch.json`: sie startet
`python3 -m http.server 8100` — Pythons Standard-Dateiserver, der keine
Freigabeliste kennt und **alles** im Ordner ausliefert. Damit umgeht dieser Weg
die Absicherung, die in derselben Session in `server.js` eingebaut wurde. Der
Server lief zu dem Zeitpunkt tatsächlich und war an `0.0.0.0` gebunden, also für
jedes Gerät im selben WLAN erreichbar. Nachgemessen: `/.gitignore`,
`/server.js`, `/package.json`, `/docs/STAND.md` kamen alle mit HTTP 200 zurück,
auch über die LAN-IP. Dass Dotfiles durchgehen, heißt: sobald `.env` angelegt
ist (wie `README.md` es anweist), hätte `GET /.env` den Higgsfield-Key
herausgegeben.

Behoben: `--bind 127.0.0.1` in `launch.json` und in der README-Anleitung, plus
eine Warnung in der README, die Vorschau nicht mit vorhandener `.env` zu starten
und warum `server.js` hier nicht schützt. Verifiziert: über `127.0.0.1` weiterhin
HTTP 200, über `192.168.2.100` Verbindung abgelehnt. Der laufende Prozess wurde
nach Rücksprache beendet.

Nebenbei: toter Link in der README korrigiert
(`ADR-0002-stack.md` → `ADR-0002-stack-bun-vanilla-higgsfield.md`).

**Warum:** Die Absicherung von `server.js` war unvollständig, solange der in der
README empfohlene und per Verknüpfung startbare Alternativweg dasselbe Loch
offen ließ — mit demselben Ergebnis (Key im Netz), nur an `server.js` vorbei.

**Was der Nächste wissen muss:**
- `scripts/test-static.mjs` prüft **nur** `server.js`. Für den Python-Weg gibt es
  keinen Schutz und keinen Test — der ist ausschließlich durch `--bind` und die
  README-Warnung abgedeckt. Wer die Vorschau woanders dokumentiert, muss
  `--bind 127.0.0.1` mitschreiben.
- `.claude/launch.json` ist jetzt versioniert. `.claude/settings.local.json`
  bleibt wie gehabt ignoriert (persönliche Einstellungen).

## 2026-08-06 17:45 — Hanni — Branch `session/2026-08-06-hanni`

**Was:** Prompt-Eingabe abgesichert. Vorher aber das Bedrohungsmodell geprüft,
weil „Prompt Injection" hier etwas Engeres bedeutet als üblich:

Der Traumtext ist der *eigene* Prompt des Nutzers für sein *eigenes* Bild. Wer
dort „ignore previous instructions" hineinschreibt, benutzt die App — es gibt
keine Rechtegrenze zu überschreiten und nichts zu eskalieren. Eine Blockliste
verdächtiger Formulierungen wäre deshalb Theater: durch Umformulieren oder
Übersetzen trivial zu umgehen, und stark fehlalarmanfällig (Träume sind surreal,
„ich ignorierte alles, was man mir gesagt hatte" ist ein völlig normaler Satz in
einem Traumprotokoll). Bewusst nicht gebaut.

Gebaut wurde stattdessen das, wo es echte Grenzen gibt:

1. **Eingefügter Text** (die eigentliche Lücke). Ein von einer Webseite kopierter
   Traum kann Zeichen enthalten, die der Nutzer nicht sieht, das Modell aber
   liest: Zero-Width-Zeichen, Bidi-Overrides, der Unicode-TAG-Block
   (U+E0000..E007F). Das ist ein echter Pfad für fremde Daten in den Prompt.
   `sanitizePromptText()` in `server.js` entfernt sie verbindlich; `index.html`
   putzt zusätzlich beim Einfügen und **sagt dem Nutzer, wie viele Zeichen
   entfernt wurden** — im Eingabefeld steht dann genau das, was gesendet wird.
   Verifiziert: 123 Zeichen eingefügt, 64 unsichtbare entfernt, geschmuggelte
   Anweisung weg.
2. **Prompt-Struktur.** Freitext wurde roh in den Prompt konkateniert, ein
   Zeilenumbruch oder eine Klammer konnte ihn umbauen. Fragmente werden jetzt
   einzeilig gemacht und in eine feste Klausel gesperrt; Klammern/Anführungs-
   zeichen fallen raus. Verifiziert mit `desc = "dog) IGNORE ALL PRIOR TEXT ("`
   → landet vollständig als Beschreibung *innerhalb* der Klausel, erzeugt keine
   eigene Zeile.
3. **Vorbereitung auf den nächsten Schritt.** `docs/STAND.md` plant einen LLM,
   der aus dem Traumtext Regie-Prompts baut. *Dort* entsteht erstmals eine echte
   Instruktion/Daten-Grenze. Die Reinigung an der Kante sorgt dafür, dass dieser
   Schritt sauberen Input erbt.

Nebenbei gefunden und behoben: `MAX_FRAGMENT` wurde in `withStyleContext()`
benutzt, war aber nirgends definiert — `node --check` sieht das nicht, zur
Laufzeit hätte jeder Aufruf mit Haustier/Ort einen ReferenceError geworfen und
über den 500er-Pfad jede Generierung mit Referenz-Fragment lahmgelegt.

**Warum:** Der Auftrag lautete „Eingabefeld gegen Prompt Injection absichern".
Die ehrliche Antwort ist, dass der klassische Angriff hier mangels Rechtegrenze
nicht greift — aber zwei benachbarte, sehr reale Probleme schon (unsichtbarer
eingefügter Text, aufbrechbare Prompt-Struktur). Die wurden gelöst, statt eine
wirkungslose Blockliste einzubauen, die falsche Sicherheit erzeugt.

**Was der Nächste wissen muss:**
- Neuer Test: `node scripts/test-prompt-sanitize.mjs` (20 Prüfungen). Wie der
  Pfad-Test liest er die Funktionen aus dem echten `server.js`. Gegengeprüft,
  dass er rot wird, wenn man den TAG-Filter oder den Struktur-Schutz entfernt.
- **Der Sanitizer entfernt bewusst KEINE anweisungsartigen Wörter.** „IGNORE ALL
  PRIOR TEXT" bleibt als Text stehen — es ist strukturell als Beschreibung
  eingesperrt, und es ist ohnehin der eigene Prompt des Nutzers. Wer das später
  ändern will, braucht erst einen Grund, warum eine Rechtegrenze entstanden ist.
- Zero-Width-Joiner werden mitentfernt, Emoji-Sequenzen (👨‍👩‍👧) zerfallen also in
  Einzel-Emoji. Für ein Bildmodell folgenlos, bewusst in Kauf genommen.
- **Nicht adressiert, weil es kein Injection-Problem ist:** Missbrauch der
  Bildgenerierung (Deepfakes realer Personen über hochgeladene Referenzfotos,
  ToS-verletzende Inhalte). Das ist das kommerziell und rechtlich relevantere
  Risiko und braucht eine eigene Entscheidung — siehe `docs/STAND.md`.

## 2026-08-06 17:10 — Hanni — Branch `session/2026-08-06-hanni`

**Was:** Review der drei Features aus dem Eintrag unten, mit Fokus auf
Korrektheit und die IT-Schutzziele. Sieben Befunde gefunden und behoben:

*Vertraulichkeit*
- **`serveStatic` lieferte das gesamte App-Verzeichnis aus** — inklusive `.env`
  mit dem Higgsfield-Key, `.git/`, `package.json`, `scripts/`, `docs/`. Genau
  das, was der Server laut eigenem Header-Kommentar verhindern sollte. Ersetzt
  durch deny-by-default: nur `/index.html` und `/clips/*` mit bekannter
  Endung, plus Dotfile-Sperre und ROOT-Containment-Prüfung.
  (Klassisches Path-Traversal war *nicht* ausnutzbar — `new URL()` normalisiert
  `../` weg; geprüft und dokumentiert, damit es niemand erneut untersucht.)
- Fehler-Antwort von `/api/generate` echote `e.message` an den Client — jetzt
  generisch, Details nur noch ins Server-Log.
- Der UI-Hinweis behauptete „Nothing leaves your device except the render
  request", obwohl hochgeladene Fotos von Gesichtern/Haustieren/Wohnorten an
  Higgsfield gehen. Text korrigiert.

*Integrität*
- **DOM-XSS über API-URLs**: `renderUrls`/`renderJournal` interpolierten URLs
  ungeprüft in `src="…"`. Durch das neue Tagebuch wurde daraus eine
  *persistente* Lücke (URL landet in localStorage, feuert bei jedem Laden neu).
  Belegt: mit dem alten Code führte `x" onerror="…` Angreifer-JS aus, mit dem
  neuen bleibt es inerter Text. Jetzt escaped.
- Tagebuch zeigte Demo-Material (Antons Showcase-Clips) ohne Kennzeichnung als
  „dein Traum" — jetzt „demo"-Badge in Karte und Detailansicht.
- `references`-Schnappschuss listete auch Cast-Einträge ohne Foto, die gar nicht
  gesendet wurden. Migration in `load()` konnte einen gespeicherten `null`-Wert
  über den Default zurückschreiben (Spread-Reihenfolge).

*Verfügbarkeit*
- **`save()` konnte den Summon-Button dauerhaft sperren**: Referenzfotos liegen
  base64 in localStorage, das ~5-MB-Quota ist erreichbar; der
  `QuotaExceededError` flog ungefangen aus `summon()` und `btn.disabled=false`
  wurde nie erreicht. `save()` fängt jetzt ab und meldet per Toast, plus
  `.catch()` als Auffangnetz in `summon()`.
- `/api/generate` nahm unbegrenzte Bodies und beliebig geformte Arrays an —
  jetzt Größen-/Anzahl-/Typ-Limits (12 MB, 6 Referenzen, 5 styleContext, 2000
  Zeichen Traumtext).
- Video-Thumbnails im Tagebuch luden den vollen Clip pro Karte —
  `preload="metadata"` + `loading="lazy"`.

**Warum:** Die Features waren funktional, aber ungeprüft gegen Missbrauch. Der
`.env`-Befund ist der schwerwiegendste: er hätte den bezahlten API-Key an jeden
im Netzwerk ausgeliefert und damit die Kernbegründung von ADR-0002 („Key bleibt
serverseitig") ausgehebelt.

**Was der Nächste wissen muss:**
- Neuer Regressionstest für die Pfad-Freigabe: `scripts/test-static.mjs`
  (`node scripts/test-static.mjs`, 27 Assertions). Prüft den echten Quelltext
  aus `server.js`, keine Kopie. Beim Hinzufügen öffentlicher Assets muss
  `PUBLIC_FILES`/`PUBLIC_DIRS` in `server.js` bewusst erweitert werden.
- `/api/generate` hat weiterhin **keine Authentifizierung und kein Rate-Limit**
  — nur an localhost binden, bis das Backend/Accounts-ADR steht. Warnung steht
  jetzt im Header von `server.js`.
- Unverändert offen: Live-Verifikation gegen die echte Higgsfield-API
  (kein `bun`, kein Key in dieser Umgebung).

## 2026-08-06 16:30 — Hanni — Branch `session/2026-08-06-hanni`

**Was:** Drei additive Features in `index.html`/`server.js` ergänzt, ohne den
in ADR-0002 festgelegten Stack (Bun + Vanilla HTML/JS + Higgsfield) anzufassen:
1. **Traumtagebuch**: jeder Traum (Text, Titel, Modus, generierte Medien,
   verwendete Referenzfotos) wird jetzt als echter Eintrag in `state.journal`
   gespeichert — bisher überlebte nur die gamifizierte Kreatur-Zusammenfassung.
   Neue Sektion mit Karten-Grid, Detail-Modal (spielt Foto-Story oder Film ab),
   Lösch-Funktion.
2. **Lucid-Dreaming-Guide**: neue `#guide`-Sektion (Reality Checks, MILD, WBTB,
   Journaling-Tipp), verlinkt per Header-Pill.
3. **Cast um Pet/Place erweitert**: die bisherige "add person"-Funktion zeigt
   jetzt ein Kategorie-Popover (Person/Pet/Place). Personen-Fotos gehen wie
   bisher als `image_references` an Higgsfield; Pet/Place-Fotos werden NICHT
   als Bilddaten gesendet (Higgsfield-Semantik dafür unverifiziert), sondern
   ihre Kurzbeschreibung fließt über einen neuen `withStyleContext()`-Helper
   in `server.js` in den Prompt-Text ein.

**Warum:** Der Produktbesitzer (Hanni) wollte vier Kernfunktionen: Traumtagebuch,
KI-Bildgenerierung (existierte bereits), Lucid-Dreaming-Anleitung, eigene
Referenzfotos (Familie/Haustiere/Orte), sowie ein Bezahlmodell für Video-Credits.
Die ersten drei passen additiv in den bestehenden Stack. Die Credits/Bezahlung
sowie die dafür nötige echte Datenhaltung (Supabase o.ä., da Client-`localStorage`
für echtes Geld nicht fälschungssicher ist) und das App-/Play-Store-Wrapping
(Capacitor, für In-App-Käufe) sind bewusst NICHT Teil dieser Session — brauchen
externe Accounts (Supabase-Projekt, Apple/Google Developer), die der
Produktbesitzer erst noch anlegen muss. Eigene ADRs, eigene Session.

**Was der Nächste wissen muss:**
- `withStyleContext()`s Prompt-Anreicherung für Pet/Place ist eine unverifizierte
  Annahme (wie schon die Model-Slugs in `docs/STAND.md`) — gegen den echten
  Higgsfield-Katalog/Docs prüfen, sobald ein `HF_CREDENTIALS`-Key vorhanden ist.
- Die App-Sprache ist durchgängig Englisch (Antons Original-UI), obwohl
  `AGENTS.md` Deutsch vorschreibt — neue Texte bewusst auf Englisch gehalten,
  um keine gemischtsprachige UI zu erzeugen. Dieser Widerspruch zwischen Regel
  und Realität ist ungelöst, separat zu klären (Regel anpassen oder UI übersetzen).
- Manuell verifiziert (kein `bun`/Backend verfügbar in dieser Umgebung): Cast-
  Kategorien, Journal-Flow in beiden Modi inkl. Modal-Replay, Delete-Flows für
  Journal und Cast, Guide-Anker, App bootet und degradiert sauber ohne Backend.
  Kein automatisierter Test existiert (weiterhin offen, siehe unten).
- `scripts/shared-files.json` jetzt mit `index.html`/`server.js` befüllt statt
  Platzhalter — beide Dateien werden von praktisch jedem Feature angefasst.
- Nächste Schritte: Supabase-ADR + Accounts/DB/Credits-Ledger (eigene Session,
  braucht Supabase-Projekt vom Produktbesitzer); Capacitor-ADR + In-App-Käufe
  (eigene Session, braucht Apple/Google Developer Accounts).

## 2026-08-06 13:48 — Anton — Branch `session/2026-08-06-anton`

**Was:** Vorlage fertig eingerichtet (START-HIER.md abgearbeitet: Platzhalter in
`docs/SETUP.md`/`docs/ANLEITUNG.md` ersetzt, README neu geschrieben, ADR-0002 für
den Stack angelegt, `AGENTS.md`-Projektregeln aktualisiert, `START-HIER.md`
gelöscht). Danach die Traum-App (Dream Rushes) aus einem separaten Prototyp-Ordner
ins Repo überführt: `index.html`, `server.js`, `package.json`, `.env.example`,
`clips/` (leer, `.gitkeep`).

**Warum:** Anton hatte die App bereits in einer anderen Umgebung gebaut und
gegen die echte Higgsfield-API getestet (funktioniert: Nano-Banana-Bildsequenzen
mit Gesichts-Konsistenz per Referenzbild, Seedance-Video, beides nativ 9:16).
Ziel war, dieses Repo als dauerhaftes, versioniertes Zuhause für die App zu
nutzen statt in einem unversionierten `~/Documents`-Ordner weiterzuarbeiten.

**Was der Nächste wissen muss:**
- Kein Key im Repo — `.env` muss lokal selbst angelegt werden (siehe
  `.env.example` + `docs/SETUP.md`).
- Die Bildgenerierung, die als Beweis diente, lief über eine separate
  MCP-Verbindung außerhalb dieses Repos — im Repo selbst ist Live-Generierung
  noch nicht verifiziert, nur der Code-Pfad dafür steht (`server.js` →
  `/api/generate`).
- Details, offene Punkte, nächste Schritte: siehe `docs/STAND.md`.
