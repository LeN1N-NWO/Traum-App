# WORKLOG — Historie, nur anhängend, neue Einträge OBEN

> Alte Einträge werden NIE geändert. Richtigstellungen kommen als neuer Eintrag dazu.
> Pro Eintrag: Datum, Uhrzeit, Name, Branch, Commits, was, warum, was der Nächste wissen muss.

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
