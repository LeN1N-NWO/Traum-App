# Charakterbogen-Pflicht — hochgeladene Fotos werden erst normalisiert

**Stand:** 2026-08-20 · Anlass: der Lena-Test vom 19.08.
**Status: ENTSCHEIDUNGSVORLAGE. Nichts umgesetzt.**

## 1. Der Befund, der die Regel erzwingt

Beim Lena-Test (echte Pipeline, 3 Bilder, $0,24) hielt die Ähnlichkeit —
aber in Bild 3 stand Lena auf dem **Segelboot aus ihrem Referenzfoto**
statt in der Riesenrad-Gondel aus dem Traum. Ein Foto mit Umgebung blutet
seine Umgebung in die Szenen. Genau dagegen ist der Charakterbogen gebaut
(neutraler grauer Hintergrund, `buildCharacterPrompt` in
`promptBuilder.js`) — nur nimmt die App ihn heute ausgerechnet dann NICHT,
wenn jemand ein Foto hochlädt. Der Bogen existiert nur als 2-Credit-Knopf
für Figuren OHNE Foto (AvatarDialog → `/api/character`).

**Antons Regel:** Wer ein Foto hochlädt, bekommt daraus zuerst einen
Bogen — grauer Hintergrund, geteiltes Bild: links Ganzkörper, rechts
Gesicht — und ERST DER Bogen geht als Referenz in Bilder und Filme.

## 2. Was der Bogen kostet — und was er einbringt

- Ein Bogen ist EIN `edit`-Aufruf mit dem Foto als Referenz:
  **~$0,042 auf Lite**, $0,08 auf nano-banana-2. Einmalig je Figur.
- Er verbessert JEDEN späteren bezahlten Render: Bilder (kein
  Umgebungs-Bleed), Filme (H3-R2V nimmt bis 5 Referenzen gratis —
  saubere Referenzen zahlen doppelt ein).
- Nebeneffekt: Lenas Foto ist ein 1-MB-Daten-URI, der bei jedem
  Generate-Aufruf mitfährt und im localStorage liegt (Origin-Quota
  ~5 MB!). Ein komprimierter 1K-Bogen ist deutlich kleiner — die Regel
  entlastet auch Payload und Speicher.

## 3. Die vier Entscheidungen, geprüft

### a) Automatisch? → JA, aber TRÄGE (beim ersten bezahlten Render, nicht beim Speichern)

Zwei Zeitpunkte standen zur Wahl:

| | beim Speichern (eifrig) | beim ersten bezahlten Render (träge) |
|---|---|---|
| Figur wird nie benutzt | kostet trotzdem $0,042 | kostet $0 |
| Missbrauch (viele Figuren anlegen) | gratis Bildgenerierung farmbar | unmöglich — Kosten hängen IMMER an einem bezahlten Render |
| Wartezeit | keine | einmalig ~10–20 s vor der ersten Strecke |

Das Träge gewinnt auf jeder Achse außer der einmaligen Wartezeit — und
es beantwortet Antons Sorge „wenn jemand viele Charaktere hat" komplett:
50 angelegte, nie benutzte Figuren kosten $0. Der Bogen wird danach für
immer wiederverwendet (im Cast-Eintrag gespeichert, Feld `sheet`).

### b) Preis: 1 Credit? Halber Credit? → NULL. Wir schlucken die Kosten.

- Antons Instinkt „halber Credit, keine Marge" trifft die Lite-Kosten
  fast exakt ($0,042 ≈ ½ × $0,08). Aber halbe Credits brechen die
  Kopfrechenregel „1 Credit = 1 Bild" (pricing.js nennt sie „the rare
  pricing rule a person can hold in one's head") und die ganzzahlige
  Buchführung in credits.js.
- $0,042 einmalig je Figur gegen $0,66 Verkaufserlös schon der ersten
  3-Bilder-Strecke mit dieser Figur: Das ist eine Herstellungskosten-
  Position wie die gratis DeepSeek-Analyse ($0,00026), kein Produkt.
- Rechnung Marge: 3-Bilder-Traum auf Lite = $0,126 + $0,042 Bogen =
  $0,168 Einkauf gegen $0,66 Erlös → immer noch ~75 % Marge, nur beim
  ERSTEN Traum einer neuen Figur, danach wieder 81 %.
- Randfall Willkommensgeschenk: Der Gratis-Traum eines Neulings mit
  Foto-Figur kostet uns $0,28 statt $0,24. Vertretbar — es ist genau
  der Traum, der gut sein muss (credits.js: „Fewer, not worse").

### c) Verstecken? → JA — und es ist nur deshalb sauber, WEIL es nichts kostet.

Die Hausregel steht in pricing.js (Vorschau-Kommentar): heimlich
abrechnen „would have cost trust". **Versteckt UND berechnet geht
nicht zusammen.** Versteckt und gratis dagegen schon: Der Bogen ist
dann ein internes Qualitätswerkzeug wie die Prompt-Bausteine — niemand
erwartet, dafür gefragt zu werden.

Das eine Risiko des Versteckens: Ein missratener Bogen vergiftet still
alle künftigen Renders, und niemand kann es sehen oder beheben. Ventile:
1. Foto ersetzen invalidiert den Bogen (→ d) — der Nutzer-Reflex „das
   sieht ihr nicht ähnlich, ich nehme ein besseres Foto" repariert es.
2. Falls Support-Fälle kommen: den Bogen im Bearbeiten-Dialog klein
   anzeigen („reference the app draws from") mit Gratis-Neuzeichnen.
   Erst dann, nicht in v1 — jedes sichtbare Element will erklärt sein.

### d) Kleidung/Beschreibung angepasst? → Invalidierung, nicht Sonderlogik.

Der Cast-Eintrag merkt sich, WORAUS der Bogen entstand (Fingerabdruck
über `img` + `desc`). Ändert sich eines von beiden, ist der Bogen
veraltet und wird beim nächsten bezahlten Render neu erzeugt — wieder
gratis, wieder träge. Kleidungswünsche aus `desc` werden dabei in den
Bogen-Prompt übernommen („wearing …"), damit die Garderobe EINMAL
festgelegt wird statt in jedem Bild neu (dieselbe Anti-Drift-Linie wie
im Director: keine erfundene Garderobe je Szene).

## 4. Geltungsbereich

- **Personen und Tiere: ja.** Ganzkörper + Gesicht (Person), ganzes
  Tier + Kopf (Tier), geteiltes Bild, grauer Hintergrund.
- **Orte: NEIN.** Ein Ort IST seine Umgebung — ihn zu neutralisieren
  würde genau das löschen, was referenziert werden soll. Orte gehen
  weiter roh als Referenz.
- Der 2-Credit-Knopf „aus Beschreibung zeichnen" bleibt unverändert:
  Er ERZEUGT eine Identität sichtbar und auf Wunsch; der neue Pfad
  NORMALISIERT eine vorhandene unsichtbar. Dass eines 2 Credits kostet
  und das andere nichts, ist deshalb kein Widerspruch — bezahlt wird
  das Erschaffen, nicht das Aufbereiten. (Der Desc-Bogen sollte künftig
  dasselbe Split-Format bekommen, damit beide Pfade dieselbe
  Referenzform liefern.)

## 5. Technischer Zuschnitt (wenn Anton Go gibt)

1. `buildSheetFromPhotoPrompt({ desc, category })` in promptBuilder.js:
   Edit-Prompt „Reference sheet of the person in reference image 1:
   left panel full body standing, right panel head-and-shoulders
   portrait, plain mid-grey background …", 16:9, plus `desc`-Garderobe.
2. `/api/character` nimmt zusätzlich ein `photo` (Daten-URI) an und
   routet dann über den `edit`-Endpoint (Lite, sobald der Neuzuschnitt
   steht) statt Text-zu-Bild. MAX_BODY-Prüfung existiert schon.
3. Cast-Eintrag: `sheet` (URL/Daten-URI) + `sheetOf` (Fingerabdruck).
   Überall, wo `img` als Referenz verschickt wird (Step5Style →
   /api/generate, Filmpfad), gilt: `sheet || img` — Fallback bleibt
   das rohe Foto, ein fehlgeschlagener Bogen darf nie einen Render
   verhindern (dieselbe Linie wie „Director ist Kür, nie Pflicht").
4. Statuszeile beim ersten Render einer neuen Figur („Preparing
   @lena …"), damit die einmalige Wartezeit erklärt ist.
5. Bezahlter Prüfstein vor dem Rollout: Lena-Foto → Bogen → dieselbe
   Quallenlicht-Strecke noch einmal ($0,04 + $0,13) — verschwindet das
   Segelboot?

## 6. Offene Abhängigkeit

Der Bogen-Preis $0,042 setzt den Lite-Neuzuschnitt voraus
(2026-08-19-bildmodelle-preise.md §5) — der hängt weiter an Antons zwei
Entscheidungen (Regie behalten/streichen · Lite-Ersparnis behalten/
weitergeben). Bis dahin kostete ein Bogen $0,08 auf nano-banana-2, was
an keiner Empfehlung hier etwas ändert.

## 7. Der Prüfstein vom 20.08. ($0,25, Antons Go „mach erst mal den Test") — BESTANDEN

Aufbau: Lenas Foto (Segelboot-Umgebung) → Bogen nach §5.1 auf Lite →
dieselbe Quallenlicht-Strecke mit dem BOGEN als Referenz → dazu eine
Kontrolle: Szene 3 mit identischem Prompt, aber ROHEM Foto, auf demselben
Modell. Artefakte in `media/tests/` (t-sheet-lena, t-sheetlena-1…3,
t-ctrl-rawlena-3; die Rohfoto-Strecke vom 19.08. liegt als t-lena-1…3
daneben).

- **Der Bogen selbst:** ein Aufruf, ein Treffer — grauer Hintergrund,
  links Ganzkörper, rechts Porträt, Kleid/Hut/Gesicht eindeutig Lena.
  Der Prompt aus §5.1 funktioniert wörtlich.
- **Die Strecke über den Bogen:** kein Boot, kein Strand — Szene 1 setzt
  Lena in die Riesenrad-Gondel (samt zweiter Figur für „ich"), Szene 2
  hält die Lachen-Nahaufnahme, Szene 3 erfindet eine neutrale Traumkulisse
  unter dem Wal. Die Ähnlichkeit hält, obwohl der Bogen schon eine
  GENERATION vom Originalfoto entfernt ist — der Umweg kostet keine
  erkennbare Identität.
- **Die Kontrolle beweist die Ursache:** gleicher Prompt, rohes Foto →
  wieder eine Meer/Strand-Kulisse aus dem Referenzfoto (am 19.08. auf
  nano-banana-2 war es ein wörtliches Segelboot). Der Bleed folgt dem
  FOTO, nicht dem Modell — und der Bogen unterbindet ihn.
- **Fußnote:** Der Kontroll-Aufruf mit dem rohen Foto wurde von fals
  Content-Checker EINMAL abgelehnt (422, zweiter Versuch lief durch).
  Die Bogen-Aufrufe wurden nie beanstandet — neutrale Bögen sind auch
  gegenüber Filtern die berechenbarere Referenz.

## 8. Die Verrechnung, nach der Anton gefragt hat

Antons Bedingung für die Lite-Entscheidung: „hängt davon ab, ob wir das
gut mit diesen Charakter-Dingen verrechnen können." Die Rechnung ist
kurz: **Lite spart $0,038 je Bild ($0,08 → $0,042); ein Bogen kostet
einmalig $0,042 je Figur. Schon das ERSTE Bild einer Figur auf Lite
spart den Bogen fast vollständig wieder ein** — jedes weitere ist
Reingewinn. Vorschlag daraus: Preise und Credits bleiben für den Kunden
exakt wie heute (Marge behalten), und aus der Lite-Ersparnis werden die
Gratis-Bögen finanziert — mit deutlichem Rest, der als Sicherheitsmarge
bleibt. Die Kopfrechenregel „1 Credit = 1 Bild" bleibt unangetastet.
