# STAND — aktueller Projektzustand

> Diese Datei wird bei jedem Sitzungsende KOMPLETT überschrieben.
> Sie zeigt immer nur die Gegenwart. Historie gehört ins WORKLOG.

**Stand:** 2026-09-08 — `claude/new-session-x9qv1w` (Cloud, PR #30),
aufgesetzt auf `3da34aa` (nach PR #29). **453 Tests grün**, fünf
Skriptprüfungen grün, Build sauber. Bezahlte Läufe in dieser Sitzung:
**keine** (fal aus der Cloud gesperrt).
JS-Bündel **482 KB (gzip 161)** — plus 21 KB seit dem 26.08., das sind
die elf neuen Stilprompts.

## Wo wir stehen

**Die Bildkette ist fertig und bezahlt bewiesen** (Raster als Hauptweg,
$0,113 je Vier-Bilder-Traum) — **aber seit heute mit einer Korrektur, die
noch niemand bezahlt geprüft hat:** Die Serverkappung (`MAX_CRAFTED_PROMPT`)
schnitt seit dem 25.08. jeden Rasterprompt mitten im Stil ab, samt
Foto-Anker und Referenzklauseln. Jetzt 12.000 statt 3000, mit Test.
Die vier bezahlten Läufe vom 25.08. liefen ALLE mit gekapptem Prompt.

**19 Stile statt 8.** Elf Handwerksstile aus Antons Prompt-Bibliothek
(Knete, Tusche, Scherenschnitt, Marionette …), zehn in der ersten Reihe,
neun hinter „More styles". Look und Bewegung getrennt (`prompt` /
`motion`), alle elf ohne Foto-Anker.

**Der Preisentscheid ist vorgerechnet, aber nicht getroffen** — siehe
Nächste Schritte 1. Weiterhin die einzige Entscheidung, die eine
Veröffentlichung blockiert.

## Nächste Schritte

1. **⚠ PREISENTSCHEID — die einzige offene Entscheidung vor dem Launch.**
   Vorlage fertig: `docs/plans/2026-08-26-preisentscheid.md`.
   Empfehlung: Preise unverändert · **Credits verfallen nicht mehr**
   (`refillAllowance` in `credits.js:123` addiert statt zu setzen) ·
   Paket heißt „ohne Abo" statt „verfällt nie" (`packNote`, dazu die
   Zeile in `en.js:811`) · **viertes Paket $29,99/150**.
   ⚠ `plans.js` und `credits.js` sind unberührt. Es fehlt ein Ja.
2. **⚠ EIN bezahlter Lauf mit ungekapptem Prompt** — derselbe Traum wie
   am 25.08., Stil `ultrareal`. Erst dann wissen wir, was die Klauseln
   am Ende des Prompts wirklich bewirken; bisher hat sie fal nie gesehen.
3. **⚠ EIN bezahlter Lauf mit einem Handwerksstil** (Knete). Zwei Fragen:
   Kommt der Look an? Bleiben die Gesichter erkennbar, obwohl der Anker
   aus ist? Wenn nicht: `buildReferences()` sagt „this exact likeness" —
   vielleicht braucht es bei Handwerksstilen „rendered in this material".
4. **Top 10 bestätigen.** Ink + Claymation in der ersten Reihe ist meine
   Wahl (die zwei entferntesten), nicht Antons. `featured: true` in
   `styles.js`, der Test zählt zehn.
5. **`WizardShell.jsx:65`**: Wiederaufnahme setzt `"dreamlike"` als
   Stil-Vorgabe, die App-Vorgabe ist seit 24.08. `ultrareal`. Einzeiler.
6. **Den Policy-Weg im Echtbetrieb prüfen** — gebaut, nie ausgelöst.
7. **Die Reflection-Sprache beweisen** — ein kostenloser Klick.
8. **`data/traeume` gegen den Vorschau-Browser absichern.**
9. **Server härten** (Analyse 26.08.): 14× `fetch` ohne Timeout ·
   `spawnSync` bei `/api/film-outro` blockiert den GANZEN Server ·
   fal-Fehler als „pending" verschluckt · kein `maxRequestBodySize`.
10. Die zwei anderen Maskottchen · Dreier-Streifen (`PREVIEW_COUNT = 3`)
    umstellen oder streichen · Klang-Presets (28 Kandidaten).

## Bekannte Baustellen

- **⚠ Kein bezahlter Beweis für den ungekappten Prompt** (Nächste
  Schritte 2). Alles, was seit dem 25.08. „bezahlt bewiesen" heißt, wurde
  mit einem Prompt bewiesen, dem Stil-Rest, Anker und Klauseln fehlten.
- **⚠ Policy-Weg ungetestet im Echtbetrieb.**
- **Server-Härtung** — siehe Nächste Schritte 9.
- **Frontend-Analyse-Funde, bewusst liegen gelassen:** ein Context für
  alles (33 Konsumenten) · Journal ohne Virtualisierung · ~16 ungenutzte
  lib-Exports · vier fast identische Backup-Routen.
- **`styles.js` trägt `poster`-Angaben, die niemand liest** — der
  Plakat-Bauer ist weg. Steht am Dateikopf.
- **Antons Gesicht in den Bildern nicht überprüfbar** — es fehlt ein
  Traum mit frontaler Szene.
- **`data/traeume/` UND `media/besetzung/` müssen vor Veröffentlichung
  raus** — alles an `import.meta.env.DEV`.
- **Kein Zahlungsanbieter** (Dummy-Film in `Paywall.jsx`).
- **Antons Berechtigungsliste** (`.claude/settings.local.json`):
  ⚠ Nicht selbst erweitern.

## Fallen, die man nur einmal sieht

### Die vier stummen Geldfehler

- **⚠⚠ Ein gekappter Prompt ist ein gültiger Prompt.** `MAX_CRAFTED_PROMPT
  = 3000` schnitt vom 25.08. bis 08.09. jeden Rasterprompt ab — Stil-Rest,
  Foto-Anker, ALLE Referenzklauseln. Kein Fehler, keine Warnung, vier
  bezahlte Läufe. Jetzt an den gemessenen schlimmsten Fall gebunden
  (`styles.test.js` liest `server.js`). **Jede Obergrenze braucht einen
  Test, der den größten echten Fall dagegen hält — sonst wächst der
  Inhalt still über sie hinaus.**
- **⚠⚠ Ein Fehler, der Geld kostet, meldet sich NIE von selbst.**
- **⚠⚠ Ein verirrtes Zeichen in einer String-Verkettung ist
  Prompt-Sabotage, die kein Test sieht** (`"… " + +` → NaN, 26.08.).
- **⚠⚠ Ein Anker, der ins Leere zeigt, meldet sich genauso wenig**
  (Maskottchen-Tipp, 35 % daneben).

### Prompts und Stile

- **⚠ Ein Prompt, der „photoreal" sagt und drei Zeilen später „gouache",
  hat sich entschieden, bevor der Stil dran ist.** Das Wort in der Kachel
  folgt jetzt dem Stil (`stillNoun()`).
- **⚠ `painterly` heißt „ohne Foto-Anker", nicht „gemalt".** Der Anker
  bestellt Poren; Knete, Papier und Marionetten haben keine, obwohl sie
  fotografiert sind.
- **⚠ Video-Prompts tragen Bewegungssprache, die dem Bildmodell nichts
  nützt.** Deshalb `prompt` (Look) und `motion` (Bewegung) getrennt; nur
  der Regisseur bekommt beides (`filmStyleAnchor()`).
- **⚠ Eine Liste, die zweimal steht, läuft beim ersten neuen Eintrag
  auseinander** (`ANALYSIS_STYLES` stand als Konstante UND im
  Schema-Kommentar). Jetzt abgeleitet.
- **⚠ Ausgegraut liest sich als „kostet extra".** Deshalb klappt die
  zweite Stilreihe auf, statt grau dazustehen.
- **⚠ Der BOGEN ist das Nadelöhr der Ähnlichkeit** (`sheets.js`).
- **⚠ Der erste bezahlte Lauf gehört mit EINEM Traum gemacht.**
- **⚠ Vorgaben ABLEITEN, nie hinschreiben** — und doch: `WizardShell:65`
  schreibt `"dreamlike"` hin (Nächste Schritte 5).
- **Ein falscher Feldname wirft bei fal keinen Fehler** — fal-Vorgabe bei
  GPT ist „high".
- **2×2 ist die Rastereinheit** · **Weltanker als LETZTES Bild** · **eine
  leere Nacht ist KEIN TRAUM** (`blankNight.js:27`).

### Werkzeuge und Umgebung

- **⚠⚠ Eine Rot-Probe wird mit `sed` zurückgedreht, nie mit
  `git checkout -- datei`** — das holt ALLE Änderungen der Datei zurück,
  nicht nur die Probe (08.09.: vier Stellen neu gesetzt).
- **⚠ `pkill -f "bun server.js"` trifft die eigene Shell** und bricht den
  Befehl ab, in dem es steht. `pkill -f "[b]un server.js"`.
- **⚠ Ohne `charset=utf-8` im HTTP-Kopf wird die App zu Kauderwelsch**
  („â€"", `ðŸ˜'`). Das `<meta>` im Build fängt es; bei der Portierung in
  einen WebView nachprüfen.
- **⚠ In der Cloud fehlt `node_modules` nach einer Weile** — `bun test`
  meldet dann „Cannot find package 'react'". `bun install`, fertig.
- **⚠⚠ Der Vorschau-Browser überschreibt `data/traeume`.** Nach jedem
  Test: `git status` auf `data/`, im Zweifel `git checkout -- data/traeume/`.
- **⚠ `node` gibt es auf Antons Rechner nicht, nur `bun`.**
- **⚠ Die Browser-Vorschau kann WebGL nicht prüfen.**
- **⚠ Stützuntergrenze: Chrome 119 / Safari 17.4.**
- **⚠ `setLanguage()` ist async** · **Speichern ist GESAMMELT** (250 ms)
  · **Uploads werden auf 1600 px verkleinert.**
- **Sitzungen laufen ohne Worktree.** Cloud-Sitzungen pushen auf
  `claude/new-session-x9qv1w` (vorgeschrieben), zurückgesetzt auf `main`.
- Erzeugte Medien NIE im Worktree · **die Renderskripte kosten echtes
  Geld** und brauchen `--ja` · fal.ai, DeepSeek und docs.google.com sind
  aus der Cloud gesperrt (403).

### Gestaltung (unverändert seit 26.08.)

- **⚠⚠ Ein WERT kann keinen VERGLEICH ausdrücken.** Zahlen gehören in
  den Satz, wo ihre Einheit danebensteht.
- **⚠ In der CSS-Hintergrundliste liegt der ZUERST genannte Verlauf
  OBEN.** Masken statt Farbe darüber.
- **⚠ Verläufe NIE über `background-position` animieren** (`heroGlow.css`).
- **⚠ Eine Zeile, die es nur auf EINEM Reiter gibt, schiebt alles unter
  sich weg.** · **⚠ In einer Flex-SPALTE bekommt jedes Element seine
  eigene Zeile.** · **⚠ `aspect-ratio` auf gestreckten Grid-Kindern.**
- **⚠ JSX-Text ist kein JavaScript-String.** · **⚠ Ein Klick auf den
  AKTIVEN Tab wechselt die Route nicht** (`location.key`).
- **⚠ HeroGlow: Die Seite setzt nur `--hero-h`/`--glow-a`/`--glow-b`.**

## Werkzeuge

- `bun scripts/raster-rechnung.mjs [n]` · `bun scripts/gpt-preise.mjs [n]`
- `bun scripts/bogen-vergleich.mjs <gesicht> [koerper] --ja`
- `bun scripts/raster-rendern.mjs <traum.json> <bogen> <modell> … --ja`
- `bun scripts/alpha-packen.mjs <quelle> [ziel.mp4] [--premultipliziert]`
- `bun scripts/preis-durchreichen.mjs` — Einkauf, Marge, Rabattleiter.
- **StartMenu → „Mascot test bench"** — Tipp-Einspieler, Größenregler.
- Cloud-Vorschau (Stand VOR den Stilen, Oberfläche ohne API):
  https://claude.ai/code/artifact/e07a94f4-9666-44da-a3c2-fdd061f638fe

## Was die App ist

React-SPA: Traum aufschreiben oder sprechen → KI macht Bildstrecke,
optional Film, Reflection und Muster. Vier Tabs (Home · Journal · ⊕ ·
Sleep · Profil), Wizard über der Tab-Leiste.
**Stack:** Bun + Vite + React 18 (HashRouter); `server.js` als
schlüsselhaltender Proxy (fal.ai, DeepSeek, Gemini). Zustand in
`localStorage` (`dreamrushes_v1`). Sieben Sprachen, gepflegt **en+de**.
**Stile:** 19 (`styles.js`) — 8 Stimmungs-Stile mit Foto-Anker (außer
Dreamlike, Surreal), 11 Handwerksstile ohne; 10 in der ersten Reihe.

## Geld

Preisliste (`plans.js`, UNVERÄNDERT bis zum Entscheid): Woche $4,99/**25** ·
Monat ★ $9,99/**100** · Jahr $79,99/**100** p.M. · Pakete $2,99/**13** ·
$7,99/**36** · $14,99/**70**.
Bildzahlen: **4 oder 8**. Willkommensgeschenk: **4 Credits**.
Einkauf: **$0,0283 je Bild** · $0,113 je Vier-Bilder-Traum.
Film: 3/9/17 Credits je Sekunde.
⚠ Heute verfällt `allowance` zum Periodenende, `credits` bleiben — genau
das steht zur Entscheidung (Nächste Schritte 1).
