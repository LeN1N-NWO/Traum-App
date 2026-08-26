# STAND — aktueller Projektzustand

> Diese Datei wird bei jedem Sitzungsende KOMPLETT überschrieben.
> Sie zeigt immer nur die Gegenwart. Historie gehört ins WORKLOG.

**Stand:** 2026-08-26 (07:55) — `session/2026-08-25-anton-2` (PR #29),
aufgesetzt auf `9ad7e00`. **442 Tests grün**, fünf Skriptprüfungen grün,
Build sauber. Bezahlte Läufe in dieser Sitzung: **keine.**
JS-Bündel: **459 KB (gzip 154)** — war 626/238 vor der Sprachen-Abspaltung.

## Wo wir stehen

**Die Bildkette ist fertig und bezahlt bewiesen** (Raster als Hauptweg,
$0,113 je Vier-Bilder-Traum, Details im WORKLOG vom 25.08. vormittags).

**Die Oberfläche hat eine Sichtprüfungs-Runde hinter sich:** Schlaf-Tab
komplett neu (Zeilen-Übersicht, Mischpult, Podest, Bühne auf allen
Unterseiten), zwanzig Traumsymbole als Strichzeichnungen einer Familie,
Profil zeigt einen Namen statt „@ich", Storyboard zeigt nur noch Szenen,
die Bilder werden, der Journal-Tab führt aus jedem Nebenraum heraus.

**Und eine Codeanalyse-Runde:** Ein NaN im Sprach-Systemprompt behoben
(stand seit unbekannt in JEDER Sprachsitzung), Bündel um ein Drittel
kleiner, Speichern gesammelt statt synchron bei jedem Patch, Uploads
werden verkleinert. Die nicht umgesetzten Funde stehen unten als
Baustellen.

## Nächste Schritte

1. **⚠ Den Policy-Weg im Echtbetrieb prüfen** — unverändert offen; der
   Umschreiber muss ENTIDENTIFIZIEREN, nicht tarnen (Recht §8d).
2. **Preisentscheidung** — weiter der einzige echte Blocker.
   `node scripts/preis-durchreichen.mjs`.
3. **Die Reflection-Sprache beweisen** — gebaut, aber ungeprüft: ein
   kostenloser Klick auf „Was könnte dieser Traum sagen wollen?" bei
   einem deutschen Traum.
4. **Server härten** (Analyse-Funde 26.08., alle in server.js):
   a) 14× fetch ohne Timeout — hängende DeepSeek/fal-Sockets halten
      Anfragen bis idleTimeout 255 s; b) `spawnSync` bei /api/film-outro
      (1617/1661) blockiert den GANZEN Server für die Dauer eines
      ffmpeg-Laufs; c) fal-Fehler werden als „pending" verschluckt
      (1494) — permanent kaputte Aufträge sehen aus wie „läuft noch",
      job.createdAt existiert und wird nie gelesen; d) content-length-
      Prüfung umgehbar, kein maxRequestBodySize an Bun.serve.
      Alles nah an Geld-/Filmpfaden → mit Bedacht, einzeln, mit Beweis.
5. **Die zwei anderen Maskottchen** (Paar: Ruhe- + Tipp-Clip; Plan
   2026-08-25-maskottchen-auswahl.md).
6. **Dreier-Streifen** (`PREVIEW_COUNT = 3`, pricing.js) — umstellen
   oder streichen, Antons Entscheidung.
7. **Klang-Presets:** 28 CC0-Kandidaten unter media/klang-kandidaten/.

## Bekannte Baustellen

- **⚠ Policy-Weg ungetestet im Echtbetrieb** — vier bezahlte Läufe mit
  geschützten Namen gingen alle durch; Inhaltsfilter sind nicht
  deterministisch. Der Umschreiber sitzt auf der Kippe („Freddy Krüger"
  → „Mann mit verbranntem Gesicht, braunem Hut, Klingenhandschuh" ist
  noch erkennbar die Figur).
- **Server-Härtung** — siehe Nächste Schritte 4.
- **Frontend-Analyse-Funde, bewusst liegen gelassen:** ein Context für
  alles (33 Konsumenten; Toast rendert den ganzen Baum, zweimal pro
  Meldung) · Journal ohne Virtualisierung (restyle() schreibt bei jedem
  Scroll 3 Styles je Karte) · ~16 ungenutzte lib-Exports (kosten im
  Bündel nichts, Tree-Shaking) · vier fast identische Backup-Routen.
- **Antons Gesicht in den Bildern nicht überprüfbar** — ein Traum mit
  frontaler Szene fehlt als Beleg.
- **`data/traeume/` UND `media/besetzung/` müssen vor Veröffentlichung
  raus** — Ordner, vier Endpunkte in server.js, Ladepfade in
  AppState.jsx, alles an import.meta.env.DEV.
- **Preislinie nicht entschieden** · **kein Zahlungsanbieter**
  (Dummy-Film in Paywall.jsx).
- **Antons Berechtigungsliste** (.claude/settings.local.json): fast
  jeder Befehl fragt nach. ⚠ Nicht selbst erweitern.

## Fallen, die man nur einmal sieht

- **⚠⚠ Ein Fehler, der Geld kostet, meldet sich NIE von selbst.** Vier
  bezahlte Läufe, vier stumme Geldfehler (25.08.). Kein roter Test.
- **⚠⚠ Ein verirrtes Zeichen in einer String-Verkettung ist
  Prompt-Sabotage, die kein Test sieht.** `"… " + +` machte den
  Folgesatz zu NaN — das Modell las »NaN« im Systemprompt, in jeder
  Sprachsitzung, ohne jede Fehlermeldung (server.js, behoben 26.08.).
- **⚠⚠ Ein Anker, der ins Leere zeigt, meldet sich genauso wenig**
  (Maskottchen-Tipp, 35 % daneben — nur Nachmessen fand es).
- **⚠ Der Vorschau-Browser vergiftet `data/traeume`.** Sein localStorage
  läuft über den Backup-Abgleich in die geteilten Traumdateien zurück —
  zweimal in einer Sitzung passiert (references weg, style verstellt).
  Nach jedem Test im Vorschau-Browser: `git status` auf data/, im
  Zweifel `git checkout -- data/traeume/`.
- **⚠ „Schreibe in der Sprache des Traums" ist RATEN.** Das Modell riet
  bei einem deutschen Traum Englisch. Die App WEISS die Sprache — immer
  explizit mitgeben (reflect hat jetzt `lang`; wer neue Textwege baut,
  gibt sie auch mit).
- **⚠ setLanguage() ist async** (26.08.): erst awaiten, dann Re-Render
  anstoßen. Die fünf eingefrorenen Sprachen laden per import() nach;
  top-level await in i18n/index.js hält „t stimmt vor dem ersten
  Render" — deshalb build.target es2022 (vite.config.js).
- **⚠ Speichern ist jetzt GESAMMELT** (AppState.jsx): 250 ms nach der
  letzten Änderung, pagehide flusht. Wer „sofort persistent" braucht,
  ruft saveState selbst — aber erst begründen, warum.
- **⚠ Uploads werden auf 1600 px verkleinert** (AvatarDialog): Ein
  4-MB-Foto als base64 sprengte ALLEIN die localStorage-Quota. Die
  Bildmodelle sehen ohnehin nie mehr als 1600 px.
- **⚠ JSX-Text ist kein JavaScript-String:** `‹` steht wörtlich auf
  dem Bildschirm (Menagerie, 25.08. — Datei lag mit ASCII-Escapes auf
  der Platte, vermutlich aus einer Cloud-Sitzung).
- **⚠ Ein Klick auf den AKTIVEN Tab wechselt die Route nicht** — Nebenraum-
  Zustände bleiben stehen. `location.key` ist das Signal zum Zurücksetzen
  (JournalScreen).
- **⚠ Die Analyse liefert IMMER fünf Quell-Beats** (beats.js). Anzeige
  und Rendern wählen per evenIndices dieselbe Teilmenge; das Storyboard
  trägt dafür `indices` (Anzeige 1..n, Speicherung auf Quell-Indizes).
- **⚠ `aspect-ratio` auf gestreckten Grid-Kindern** rechnet die Breite
  aus der Zeilenhöhe zurück — Kacheln wachsen aus dem Bild (sleep.css,
  Variante C des Prüfstands).
- **⚠ Der Tipp-Anker gehört zur DATEI, nicht zur App** (mascots.js).
- **⚠ Der Einspieler ist NIE ein Tor** (ButtonTapOverlay.jsx).
- **⚠ ProRes spielt in KEINEM Browser** — immer durch alpha-packen.mjs.
- **⚠ Premultipliziert erkennt man am Zahlenverlauf** (R fällt mit A).
- **⚠ Es gibt kein Alpha-Videoformat für iOS UND Android** — die
  Alpha-Packung ist der Weg; Quelle höchstens 1080×1920.
- **⚠ After Effects: „Farbe: Straight (Unmatted)"**, sonst dunkler Saum.
- **⚠ `mix-blend-mode: screen` braucht KEIN `isolation: isolate`.**
- **⚠ Der erste bezahlte Lauf gehört mit EINEM Traum gemacht.**
- **⚠ Vorgaben ABLEITEN, nie hinschreiben** (imageCount, CREDIT_COST_USD).
- **⚠ `slots` ≠ `tiles`** — Verschnitt geht zu UNSEREN Lasten.
- **⚠ Ein Schnitt, der beim ERSTEN Fehlschlag aufgibt** → drei Anläufe,
  Zähler am Auftrag UND im Effekt-Fingerabdruck.
- **⚠ Der BOGEN ist das Nadelöhr der Ähnlichkeit** (sheets.js). Zwei
  Fotos je Person, Reihenfolge ist Vertrag (1 Gesicht, 2 Ganzkörper);
  festgeschrieben über den TAG, nie über avatar.id.
- **⚠ Unsere eigenen Stiltexte bestellen den Malerei-Look** (styles.js:95).
- **⚠ Ein echtes NUL-Byte macht die Datei für Git BINÄR.**
- **Ein falscher Feldname wirft bei fal keinen Fehler** — Stufe an BEIDE
  Felder, die Tabelle entscheidet. fal-Vorgabe bei GPT ist „high".
- **2×2 ist die Rastereinheit** · **Weltanker als LETZTES Bild** ·
  **eine leere Nacht ist KEIN TRAUM** (blankNight.js:27).
- `update()` nimmt auch Funktionen: `(prev) => patch`.
- `PORT` gehört der Oberfläche, `API_PORT` der API.
- Erzeugte Medien NIE im Worktree (mediaRoot.js, AGENTS.md).
- **Die Renderskripte kosten echtes Geld** und brauchen `--ja`.
- fal.ai und api.deepseek.com sind aus der Cloud gesperrt (403).

### Was die Werkzeuge auf diesem Rechner NICHT können

- **⚠ `node` gibt es hier nicht, nur `bun`.** Statt `npm test`:
  `bun test`, dann die fünf `.mjs`-Prüfungen einzeln mit `bun`.
- **⚠ Die Browser-Vorschau kann WebGL nicht prüfen** (Tab gilt als
  verborgen, kein requestAnimationFrame). AlphaVideo.jsx braucht ein
  echtes Fenster.
- **Sitzungen laufen ohne Worktree:** Die Vorschau startet den
  Dev-Server aus dem HAUPT-Checkout (.claude/launch.json).
- **⚠ Zwei Browser, zwei localStorage** — und der Vorschau-Browser
  schreibt zurück (siehe Fallen).

## Werkzeuge

- `bun scripts/raster-rechnung.mjs [n]` · `bun scripts/gpt-preise.mjs [n]`
- `bun scripts/bogen-vergleich.mjs <gesicht> [koerper] --ja`
- `bun scripts/raster-rendern.mjs <traum.json> <bogen> <modell> … --ja`
- `bun scripts/alpha-packen.mjs <quelle> [ziel.mp4] [--premultipliziert]`
- `node scripts/preis-durchreichen.mjs` — Einkauf, Marge, Rabattleiter.
- **StartMenu → „Mascot test bench"** — Tipp-Einspieler, Größenregler.

## Was die App ist

React-SPA: Traum aufschreiben oder sprechen → KI macht Bildstrecke,
optional Film, Reflection und Muster. Vier Tabs (Home · Journal · ⊕ ·
Sleep · Profil), Wizard über der Tab-Leiste.
**Stack:** Bun + Vite + React 18 (HashRouter); `server.js` als
schlüsselhaltender Proxy (fal.ai, DeepSeek, Gemini). Zustand in
`localStorage` (`dreamrushes_v1`). Sieben Sprachen, gepflegt **en+de**;
die fünf eingefrorenen laden seit 26.08. nach (nicht mehr im Bündel).
**Stützuntergrenze: Chrome 119 / Safari 17.4** (Mischpult-Fader,
es2022/top-level await).

## Geld

Preisliste (`plans.js`): Woche $4,99/**25** · Monat ★ $9,99/**100** ·
Jahr $79,99/**100** p.M. · Pakete $2,99/**13** · $7,99/**36** ·
$14,99/**70**.
Bildzahlen: **4 oder 8**. Willkommensgeschenk: **4 Credits**.
Einkauf: **$0,0283 je Bild** · $0,113 je Vier-Bilder-Traum.
Film: 3/9/17 Credits je Sekunde, aus demselben Einkaufspreis hergeleitet.
