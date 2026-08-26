# STAND — aktueller Projektzustand

> Diese Datei wird bei jedem Sitzungsende KOMPLETT überschrieben.
> Sie zeigt immer nur die Gegenwart. Historie gehört ins WORKLOG.

**Stand:** 2026-08-26 (22:57) — `session/2026-08-25-anton-2` (PR #29),
aufgesetzt auf `9ad7e00`. **442 Tests grün**, fünf Skriptprüfungen grün,
Build sauber. Bezahlte Läufe in dieser Sitzung: **keine.**
JS-Bündel **462 KB (gzip 154)** — die fünf eingefrorenen Sprachen laden
seit dem 26.08. nach.

## Wo wir stehen

**Die Bildkette ist fertig und bezahlt bewiesen** (Raster als Hauptweg,
$0,113 je Vier-Bilder-Traum).

**Die Oberfläche hat zwei Sichtprüfungs-Runden hinter sich.** Der
Schlaf-Tab ist neu (Zeilen-Übersicht, Mischpult, Podest-Karten,
Strich-Icons für alle zwanzig Traumsymbole), und seit heute Abend tragen
**alle Seiten denselben Verlauf**: warm links, kühl rechts, langsam
atmend, aus einem Bauteil (`HeroGlow.jsx`).

**Der Preisentscheid ist vorgerechnet, aber nicht getroffen** — siehe
Nächste Schritte 1. Das ist die einzige Entscheidung, die eine
Veröffentlichung noch blockiert.

## Nächste Schritte

1. **⚠ PREISENTSCHEID — die einzige offene Entscheidung vor dem Launch.**
   Vorlage fertig: `docs/plans/2026-08-26-preisentscheid.md`.
   Empfehlung: Preise unverändert · **Credits verfallen nicht mehr**
   (`refillAllowance` in `credits.js:123` addiert statt zu setzen) ·
   Paket heißt „ohne Abo" statt „verfällt nie" (`packNote`, dazu die
   Zeile in `en.js:811`) · **viertes Paket $29,99/150**, damit ein
   Director-Film in EINEM Kauf erreichbar ist.
   ⚠ `plans.js` und `credits.js` sind unberührt. Es fehlt ein Ja.
2. **⚠ Den Policy-Weg im Echtbetrieb prüfen** — gebaut, einzeln geprüft,
   nie ausgelöst. Der Umschreiber muss ENTIDENTIFIZIEREN, nicht tarnen
   (Recht §8d).
3. **Die Reflection-Sprache beweisen** — gebaut am 25.08., ungeprüft. Ein
   kostenloser Klick auf einem deutschen Traum genügt.
4. **`data/traeume` gegen den Vorschau-Browser absichern** — viermal in
   einer Sitzung überschrieben (siehe Fallen). Der Rückschreibpfad im
   Entwicklungsmodus sollte nur noch ergänzen, nie überschreiben.
5. **Server härten** (Analyse 26.08., alle in `server.js`): 14× `fetch`
   ohne Timeout · `spawnSync` bei `/api/film-outro` (1617/1661)
   blockiert den GANZEN Server · fal-Fehler als „pending" verschluckt
   (1494; `job.createdAt` existiert, wird nie gelesen) ·
   `content-length`-Prüfung umgehbar, kein `maxRequestBodySize`.
6. **Die zwei anderen Maskottchen** (Paar aus Ruhe- und Tipp-Clip).
7. **Dreier-Streifen** (`PREVIEW_COUNT = 3`, `pricing.js`) — umstellen
   oder streichen.
8. **Klang-Presets:** 28 CC0-Kandidaten unter `media/klang-kandidaten/`.

## Bekannte Baustellen

- **⚠ Policy-Weg ungetestet im Echtbetrieb.** Vier bezahlte Läufe mit
  geschützten Namen gingen alle durch; Inhaltsfilter sind nicht
  deterministisch. Der Umschreiber sitzt auf der Kippe („Freddy Krüger" →
  „Mann mit verbranntem Gesicht, braunem Hut, Klingenhandschuh").
- **Server-Härtung** — siehe Nächste Schritte 5.
- **Frontend-Analyse-Funde, bewusst liegen gelassen:** ein Context für
  alles (33 Konsumenten; ein Toast rendert den ganzen Baum, zweimal) ·
  Journal ohne Virtualisierung (`restyle()` schreibt bei jedem Scroll 3
  Styles je Karte) · ~16 ungenutzte lib-Exports (im Bündel kostenlos) ·
  vier fast identische Backup-Routen.
- **Antons Gesicht in den Bildern nicht überprüfbar** — es fehlt ein
  Traum mit frontaler Szene.
- **`data/traeume/` UND `media/besetzung/` müssen vor Veröffentlichung
  raus** — Ordner, vier Endpunkte in `server.js`, beide Ladepfade in
  `AppState.jsx`, alles an `import.meta.env.DEV`.
- **Kein Zahlungsanbieter** (Dummy-Film in `Paywall.jsx`).
- **Antons Berechtigungsliste** (`.claude/settings.local.json`): fast
  jeder Befehl fragt nach. ⚠ Nicht selbst erweitern.

## Fallen, die man nur einmal sieht

### Die drei stummen Fehlertypen dieser Woche

- **⚠⚠ Ein Fehler, der Geld kostet, meldet sich NIE von selbst.** Vier
  bezahlte Läufe am 25.08., vier stumme Geldfehler, kein roter Test.
- **⚠⚠ Ein verirrtes Zeichen in einer String-Verkettung ist
  Prompt-Sabotage, die kein Test sieht.** `"… " + +` machte den
  Folgesatz zu NaN — das Modell las »NaN« im Systemprompt, in jeder
  Sprachsitzung (`server.js`, behoben 26.08.).
- **⚠⚠ Ein Anker, der ins Leere zeigt, meldet sich genauso wenig**
  (Maskottchen-Tipp, 35 % daneben — nur Nachmessen fand es).

### Gestaltung

- **⚠⚠ Ein WERT kann keinen VERGLEICH ausdrücken.** Die goldene Kennzahl
  im Luzid-Guide ist an derselben Stelle zweimal gescheitert: als
  Prozentzahl (22.08.) und als Verhältnis (26.08.). Ohne Bezugsgröße ist
  beides keine Aussage — und „fast doppelt so oft" war für Faktor 1,64
  schlicht falsch. Die Zahlen gehören in den Satz, wo ihre Einheit
  danebensteht.
- **⚠ Wer ein Gestaltungsfeld mit einer NICHT-Aussage füllen muss, damit
  eine Reihe vollständig aussieht, hat ein falsches Feld.** Die dritte
  Hebelkarte hatte keine Messung — also stand dort „die Grundlage".
- **⚠ In der CSS-Hintergrundliste liegt der ZUERST genannte Verlauf
  OBEN.** Eine Ausblendung, die dahinter steht, kann nichts auffangen —
  daher die harte Kante quer über den Schlaf-Seiten. Masken sind der
  sichere Weg: Sie nehmen Deckkraft weg, statt Farbe darüberzumalen.
- **⚠ Verläufe NIE über `background-position` animieren** — das rastert
  60×/s neu. `transform` läuft auf der GPU (`heroGlow.css`).
- **⚠ Eine Zeile, die es nur auf EINEM Reiter gibt, schiebt alles unter
  sich weg.** Deshalb steht der Paket-Hinweis UNTER der Tarifliste
  (0 px Sprung, nachgemessen).
- **⚠ In einer Flex-SPALTE bekommt jedes Element seine eigene Zeile.**
  „bis zu" musste deshalb INS Zahl-Element, nicht davor.
- **⚠ `aspect-ratio` auf gestreckten Grid-Kindern** rechnet die Breite
  aus der Zeilenhöhe zurück — die Kacheln laufen aus dem Bild.
- **⚠ JSX-Text ist kein JavaScript-String:** `‹` steht wörtlich auf
  dem Bildschirm.
- **⚠ Ein Klick auf den AKTIVEN Tab wechselt die Route nicht** —
  `location.key` ist das Signal zum Zurücksetzen.
- **⚠ HeroGlow: Die Seite setzt nur `--hero-h`/`--glow-a`/`--glow-b`,
  nie einen eigenen Verlauf.**
- **⚠ `mix-blend-mode: screen` braucht KEIN `isolation: isolate`.**

### Werkzeuge und Umgebung

- **⚠⚠ Der Vorschau-Browser überschreibt `data/traeume`.** VIERMAL in
  einer einzigen Sitzung (26.08.). Sein leerer localStorage läuft über
  den Backup-Abgleich in die geteilten Traumdateien zurück — Referenzen
  verschwinden, `style` wird verstellt. Nach jedem Test: `git status` auf
  `data/`, im Zweifel `git checkout -- data/traeume/`.
- **⚠ `node` gibt es auf diesem Rechner nicht, nur `bun`.** Statt
  `npm test`: `bun test`, danach die fünf `.mjs`-Prüfungen einzeln.
- **⚠ Die Browser-Vorschau kann WebGL nicht prüfen** (Tab gilt als
  verborgen, kein `requestAnimationFrame`). `AlphaVideo.jsx` braucht ein
  echtes Fenster.
- **⚠ Stützuntergrenze: Chrome 119 / Safari 17.4** — doppelt
  festgeschrieben (Mischpult-Fader in `sleep.css`, es2022/top-level await
  in `vite.config.js`).
- **⚠ `setLanguage()` ist async** — erst awaiten, dann Re-Render.
- **⚠ Speichern ist GESAMMELT** (250 ms, `pagehide` flusht).
- **⚠ Uploads werden auf 1600 px verkleinert** — ein 4-MB-Foto sprengte
  als base64 allein die localStorage-Quota.
- **Sitzungen laufen ohne Worktree:** Die Vorschau startet den Dev-Server
  aus dem HAUPT-Checkout.
- **⚠ Zwei Browser, zwei localStorage** — und der Vorschau-Browser
  schreibt zurück.

### Geld, Modelle, Prompts

- **⚠ Der erste bezahlte Lauf gehört mit EINEM Traum gemacht.**
- **⚠ Vorgaben ABLEITEN, nie hinschreiben** (`imageCount`,
  `CREDIT_COST_USD`).
- **⚠ `slots` ≠ `tiles`** — Verschnitt geht zu UNSEREN Lasten.
- **⚠ Ein Schnitt, der beim ERSTEN Fehlschlag aufgibt** → drei Anläufe,
  Zähler am Auftrag UND im Effekt-Fingerabdruck.
- **⚠ Der BOGEN ist das Nadelöhr der Ähnlichkeit** (`sheets.js`). Zwei
  Fotos je Person, Reihenfolge ist Vertrag; festgeschrieben über den TAG.
- **⚠ „Schreibe in der Sprache des Traums" ist RATEN** — die App weiß die
  Sprache, also mitgeben (`reflect` hat jetzt `lang`).
- **⚠ Unsere eigenen Stiltexte bestellen den Malerei-Look**
  (`styles.js:95`).
- **⚠ iOS gibt für die Benachrichtigungs-Erlaubnis genau EINEN Versuch** —
  deshalb trennt `reminders.js` Wunsch von Erlaubnis. Seit 26.08. in
  Betrieb (Realitätscheck im Luzid-Guide).
- **Ein falscher Feldname wirft bei fal keinen Fehler** — er liefert still
  das Falsche. fal-Vorgabe bei GPT ist „high".
- **2×2 ist die Rastereinheit** · **Weltanker als LETZTES Bild** · **eine
  leere Nacht ist KEIN TRAUM** (`blankNight.js:27`).
- **⚠ Es gibt kein Alpha-Videoformat für iOS UND Android** — die
  Alpha-Packung ist der Weg. **ProRes spielt in KEINEM Browser.**
  **After Effects: „Straight (Unmatted)"**, sonst dunkler Saum.
- `update()` nimmt auch Funktionen: `(prev) => patch`.
- `PORT` gehört der Oberfläche, `API_PORT` der API.
- Erzeugte Medien NIE im Worktree · **die Renderskripte kosten echtes
  Geld** und brauchen `--ja` · fal.ai und DeepSeek sind aus der Cloud
  gesperrt (403).

## Werkzeuge

- `bun scripts/raster-rechnung.mjs [n]` · `bun scripts/gpt-preise.mjs [n]`
- `bun scripts/bogen-vergleich.mjs <gesicht> [koerper] --ja`
- `bun scripts/raster-rendern.mjs <traum.json> <bogen> <modell> … --ja`
- `bun scripts/alpha-packen.mjs <quelle> [ziel.mp4] [--premultipliziert]`
- `bun scripts/preis-durchreichen.mjs` — Einkauf, Marge, Rabattleiter.
- **StartMenu → „Mascot test bench"** — Tipp-Einspieler, Größenregler.

## Was die App ist

React-SPA: Traum aufschreiben oder sprechen → KI macht Bildstrecke,
optional Film, Reflection und Muster. Vier Tabs (Home · Journal · ⊕ ·
Sleep · Profil), Wizard über der Tab-Leiste.
**Stack:** Bun + Vite + React 18 (HashRouter); `server.js` als
schlüsselhaltender Proxy (fal.ai, DeepSeek, Gemini). Zustand in
`localStorage` (`dreamrushes_v1`). Sieben Sprachen, gepflegt **en+de**.

**Wer sie gebaut hat** (ausgezählt 26.08., 313 Commits): Anton 278,
Hanni 35 — Hanni an nur zwei Tagen (6./7.08.), von ihr stehen heute noch
1.177 Zeilen, im Kern die Namenshervorhebung im Traumfeld
(`TagTextarea.jsx`, `TagCard.jsx`) und der Sicherheitsdurchgang.

## Geld

Preisliste (`plans.js`, UNVERÄNDERT bis zum Entscheid): Woche $4,99/**25** ·
Monat ★ $9,99/**100** · Jahr $79,99/**100** p.M. · Pakete $2,99/**13** ·
$7,99/**36** · $14,99/**70**.
Bildzahlen: **4 oder 8**. Willkommensgeschenk: **4 Credits**.
Einkauf: **$0,0283 je Bild** · $0,113 je Vier-Bilder-Traum.
Film: 3/9/17 Credits je Sekunde.
⚠ Heute verfällt `allowance` zum Periodenende, `credits` bleiben — genau
das steht zur Entscheidung (Nächste Schritte 1).
