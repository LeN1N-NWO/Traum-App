# WORKLOG — Historie, nur anhängend, neue Einträge OBEN

> Alte Einträge werden NIE geändert. Richtigstellungen kommen als neuer Eintrag dazu.
> Pro Eintrag: Datum, Uhrzeit, Name, Branch, Commits, was, warum, was der Nächste wissen muss.

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
