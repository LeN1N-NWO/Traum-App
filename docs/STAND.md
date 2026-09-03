# STAND — aktueller Projektzustand

> Diese Datei wird bei jedem Sitzungsende KOMPLETT überschrieben.
> Sie zeigt immer nur die Gegenwart. Historie gehört ins WORKLOG.

**Stand:** 2026-09-04 (00:06) — `session/2026-08-31-anton` (PR #32,
Entwurf), aufgesetzt auf `3da34aa`. **505 Tests grün**, Sprachdateien in
Form (en+de gepflegt, 92 Schlüssel in den fünf eingefrorenen Sprachen
offen). Bezahlte Läufe in dieser Sitzung: drei Filme, rund $3.

## Wo wir stehen

**Dream Rushes ist ein Videoprodukt.** Antons Entscheidung vom 31.08.:
Bilder werden nicht mehr verkauft, nur noch Film. Zwei Modelle (MiniMax H3
bis 15 s, Seedance 2.5 bis 30 s), je zwei Qualitäten, drei Tempi, neun
Stil-Presets als Video-Kacheln. Der Film steht im Journal oben; mehrere
Fassungen je Traum, „Nochmal, anders".

**Der Regisseur schneidet nach Gewicht.** Die Analyse zerlegt einen Traum
in so viele Szenen, wie er Ereignisse hat, benennt Typ, Mindestdauer und
den Signatur-Beat; `src/lib/cut.js` wählt, verteilt die Zeit ungleich und
schreibt den Schnittplan in das Format des Modells. An fünf fremden
Traumprotokollen geprüft, mit drei bezahlten Filmen bestätigt.

**Was der Film heute noch nicht kann:** in der Zeit bleiben. Analyse und
Regie denken minutenlang — siehe Baustelle 1.

## Nächste Schritte

1. **⚠⚠ Die Uhren** (`api.js` TIMEOUTS, `server.js` directFilm/analyzeDream):
   `/api/generate` soll im Film-Modus SOFORT eine Auftragsnummer liefern
   und die Regie im Hintergrund schreiben — das schließt vermutlich die
   Ursache der verwaisten Filme. Für die Analyse: schnelleres Modell oder
   Denkbudget begrenzen; 2–4 Minuten sind kein Wartebildschirm mehr.
2. **⚠ PREISENTSCHEID** — jetzt mit einer Variablen weniger, siehe
   `docs/plans/2026-08-26-preisentscheid.md` und
   `2026-08-31-nur-noch-film.md` §3: Willkommensgeschenk (4 Cr kauft
   keinen Film; der billigste kostet 11), Paketgrößen, `dreamsFor()` in
   Filmen, Zweiteiler als Produkt ja/nein. **Braucht Antons Ja.**
3. **Nur-noch-Film Phase 3** (`2026-08-31-nur-noch-film.md` §5): Modus
   „Bilder" aus dem Wizard, Standbild aus dem Film (ffmpeg, erstes Frame),
   Charakterbögen sichtbar und beim Anlegen gerendert. Erst DANN den toten
   Bildcode entfernen.
4. **Echte Preset-Clips:** neun Clips, je einer im Stil gerendert, fünf
   Sekunden, 270 px, stumm, nach `src/assets`; in `presets.js` wird `clip`
   ein Import. Bis dahin Attrappen (Antons Filme, gerätegebunden).
5. **Gesichter-Kopien beim schnellen Schnitt:** Der Regie-Brief muss
   sagen, dass Nebenfiguren Fremde sind, die keiner Referenz gleichen
   (`director.js`, ACTIVE REFERENCES).
6. **Regie-Prompt unter dem Limit halten** — bei sieben Shots kappt
   `server.js:~885` am Ende (Ton, Schluss). Kontinuitäts-Wiederholung je
   Shot kürzen oder das Budget im Brief härter fassen.
7. **Server härten** (unverändert seit 26.08.): 14× `fetch` ohne Timeout ·
   `spawnSync` bei `/api/film-outro` blockiert den ganzen Server ·
   fal-Fehler als „pending" verschluckt (`server.js` jobStatus).
8. **Name für Dreamflow** bestätigen (`en.js`/`de.js`
   `wizard.step5.presets`) · Policy-Weg im Echtbetrieb · Reflection-
   Sprache · zwei weitere Maskottchen · Klang-Presets.

## Bekannte Baustellen

- **Analyse und Regie sind langsam** — Baustelle 1. 96 % der erzeugten
  Token sind Denk-Token; das war vor dem Umbau genauso (121 s gegen 184 s
  am selben Traum), fiel nur nie auf, weil niemand einen langen Traum
  eingegeben hatte.
- **Verwaiste Filme** — dreimal gesehen (31.08. zweimal, 03.09. beinahe).
  Netz: `mergeShared` füllt Filme nach, `/api/job` holt bei Anfrage.
  Strukturfix ist Baustelle 1.
- **`data/traeume/2026-09-03-e_mtlxb972tea3m5.json` liegt uncommittet** —
  DreamBank-Traum unter CC BY-NC-SA, darf nicht ins Repository. Löschen
  oder liegen lassen, nie committen.
- **Bildcode ist noch da** (Raster, Schnitt, `imageJobs`, Storyboard-
  Nachfüllen, Paywall-Bilderkachel) — bewusst, bis Phase 3 durch ist.
- **Policy-Weg ungetestet im Echtbetrieb** · **kein Zahlungsanbieter** ·
  **`data/traeume` und `media/besetzung` müssen vor Veröffentlichung raus**
  · **Antons Berechtigungsliste nicht selbst erweitern.**

## Fallen, die man nur einmal sieht

### Regie und Schnitt (neu, 03.09.)

- **⚠⚠ Ein Test am eigenen Traum findet die eigenen Fehler nicht.** Fünf
  fremde Protokolle fanden fünf Fehler in einer Stunde. Vor jedem
  Regie-Umbau: `/regisseur-schnitt` an fremdem Material.
- **⚠⚠ Vier von fünf Träumen hören einfach auf.** Ein letzter Beat ist
  nur dann eine Auflösung, wenn er Ort oder Figuren mit dem Höhepunkt
  teilt. `cut.js` entzieht einem abbrechenden Schluss den Vorrang, auch
  wenn die Analyse ihn „climax" nennt.
- **⚠ Die Empfehlung rechnet über den KERN, nie über alle Szenen** —
  sonst rät sie jedem „Zweiteiler".
- **⚠ Bei fünf Sekunden ist ein Film ein Bild:** der Signatur-Beat,
  sonst nichts. Ohne ihn bricht die Auswahl.
- **⚠ `beatBudget` ≠ `shotBudget`:** Der Fluss hat EINEN Shot, aber
  ALLE Szenen darin — und darum kein Storyboard: nichts zu wählen. Wird
  die Zeit je Station knapp, warnt der Satz; die App sortiert nie still.
- **⚠ `list()` in `server.js` ist für Personen und Orte gebaut** (120
  Zeichen, acht Einträge) — nicht für Szenen.
- **⚠ Die Prompt-Kappung war stumm** — jetzt warnt sie. 7000 bei H3 heißt
  gekappt, nicht „passt genau".
- **⚠ Der Regie-Brief nennt das Budget JE SHOT**, nicht nur insgesamt —
  „insgesamt kürzer" wirkt beim dritten von sieben Blöcken nicht mehr.
- **⚠ Kurze Blöcke + Referenz = alle Gesichter werden die Referenz.**
- **⚠ `filmsOf()` stellt die alte Form voran** — sonst verschwindet der
  erste Film beim zweiten.

### Gestaltung

- **⚠ Ein Wert kann keinen Vergleich ausdrücken** (Luzid-Guide, zweimal).
- **⚠ Der ZUERST genannte CSS-Verlauf liegt OBEN**; Masken statt Overlays.
  Verläufe nie über `background-position` animieren.
- **⚠ In einer Flex-SPALTE bekommt jedes Element seine eigene Zeile.**
- **⚠ `aspect-ratio` auf gestreckten Grid-Kindern** läuft aus dem Bild.
- **⚠ Ein 9:16-Wartefeld ohne Bild sind 700 px Leere** — `j-video-wait-leer`.
- **⚠ Neun Kacheln in drei Spalten gehen nur mit zwei doppelt breiten auf.**
- **⚠ `mix-blend-mode: screen` braucht KEIN `isolation: isolate`** — und
  kein Panel dahinter (MascotLoader).
- **⚠ JSX-Text ist kein JavaScript-String** · **HeroGlow: nur Variablen
  setzen, nie eigener Verlauf.**

### Werkzeuge und Umgebung

- **⚠⚠ Der Vorschau-Browser überschreibt `data/traeume`** — nach jedem
  Test `git status` auf `data/`; Commits mit `:!data/traeume`.
- **⚠ Der Vorschau-Browser klickt daneben** (Koordinaten trafen den
  Credits-Knopf); `element.click()` per JavaScript ist zuverlässig. Nach
  HMR an `AppState.jsx` steht die Seite leer — voller Reload.
- **⚠ Neun laufende Videos in voller Größe blockieren den Renderer** —
  Vorschau-Kopien: 270 px, 6 s, stumm, < 200 KB. Und der Vorschau-Tab
  meldet `visibilityState: hidden`: Chrome friert Videos dann ein, obwohl
  `play()` nichts wirft — stillstehende Clips sind dort kein App-Fehler.
- **⚠ `resolveMedia()` lässt nur `[a-z0-9]{1,20}` durch** — kein
  Unterordner, kein Bindestrich, nicht aufweichen.
- **⚠ Renderskripte kosten Geld, brauchen `--ja`** · `node` gibt es nicht,
  nur `bun` · Stützuntergrenze Chrome 119 / Safari 17.4 · `setLanguage()`
  ist async · Speichern gesammelt (250 ms) · Uploads auf 1600 px.
- **Sitzungen laufen ohne Worktree** — der Dev-Server läuft aus dem
  Hauptcheckout.

### Geld, Modelle, Prompts

- **⚠ Der erste bezahlte Lauf gehört mit EINEM Traum gemacht.**
- **⚠ H3 schneidet nur bei neuer Information; Seedance will ≥ 3 s je
  Shot** — das schnelle Tempo (2 s) steht bewusst dagegen (`PACES.fast`).
- **⚠ Vorgaben ABLEITEN, nie hinschreiben** · **`slots` ≠ `tiles`** ·
  **der Bogen ist das Nadelöhr der Ähnlichkeit** · **iOS gibt für die
  Benachrichtigungs-Erlaubnis EINEN Versuch** · **ein falscher Feldname
  wirft bei fal keinen Fehler** · **kein Alpha-Videoformat für iOS UND
  Android** — Alpha-Packung.
- fal.ai und DeepSeek sind aus der Cloud gesperrt (403).

## Werkzeuge

- `/regisseur-schnitt` — Traumtext + Sekunden + Modell → Beat-Tabelle,
  Empfehlung, Shot-Liste. Rendert nichts.
- `bun scripts/preis-durchreichen.mjs` — alle vier Modell/Qualitäts-Stufen.
- `bun scripts/raster-rechnung.mjs` · `gpt-preise.mjs` · `bogen-vergleich.mjs
  --ja` · `raster-rendern.mjs --ja` · `alpha-packen.mjs`.
- **StartMenu → „Mascot test bench"** · **„Style tiles mockup"** (drei
  Layouts für Preset-Kacheln, B ist gebaut).

## Was die App ist

React-SPA: Traum aufschreiben oder sprechen → KI schneidet ihn zum Film
(H3 oder Seedance 2.5), dazu Reflection und Muster. Vier Tabs (Home ·
Journal · ⊕ · Sleep · Profil), Wizard über der Tab-Leiste.
**Stack:** Bun + Vite + React 18 (HashRouter); `server.js` als
schlüsselhaltender Proxy (fal.ai, DeepSeek, Gemini). Zustand in
`localStorage` (`dreamrushes_v1`). Sieben Sprachen, gepflegt **en+de**.

## Geld

Preisliste (`plans.js`, UNVERÄNDERT bis zum Entscheid): Woche $4,99/**25** ·
Monat ★ $9,99/**100** · Jahr $79,99/**100** p.M. · Pakete $2,99/**13** ·
$7,99/**36** · $14,99/**70**. Willkommensgeschenk: **4 Credits** — kauft
keinen Film mehr.
Film je Sekunde: H3 **2/3** Cr (480P/768P) · Seedance 2.5 **8/17** Cr
(480p/720p), plus 1 Cr Keyframe. Einkauf $0,05/0,06 bzw. $0,2205/0,473
je Sekunde. Ein 15-s-H3-Film in 768P: 46 Credits, ≈ $0,93 Einkauf.
