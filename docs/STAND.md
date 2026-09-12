# STAND — aktueller Projektzustand

> Diese Datei wird bei jedem Sitzungsende KOMPLETT überschrieben.
> Sie zeigt immer nur die Gegenwart. Historie gehört ins WORKLOG.

**Stand:** 2026-09-12 früh — `session/2026-09-11-anton-expo` (PR #41,
Entwurf): **die Expo-Hülle baut in Xcode, und die native Tab-Leiste steht**
— fünf Tabs mit Liquid Glass (iOS 26), Traum in der Mitte mit gefülltem
Plus. Jeder Tab zeigt den passenden Bildschirm der alten Oberfläche als
DOM-Komponente (`mobile/src/components/legacy-tab.tsx`). Schritt 2–3 des
Umzugs aus ADR-0006 sind durch, Schritt 4 (Bildschirme nativ) beginnt.

**⚠⚠ ENTSCHIEDEN (Anton, 11.09. abends): Die Oberfläche wird nativ — React
Native mit Expo statt Capacitor.** Web ist kein Ziel mehr, Android kommt
später aus derselben Codebasis. Begründung mit Messungen:
`docs/decisions/ADR-0006-expo-react-native-statt-capacitor.md`. Kurz:
Liquid Glass gibt es im WebView nicht (WebKit rendert `backdrop-filter:
url()` nicht), die Capacitor-Tastatur zerschoss die Safe Area, und alles
Nachgebaute bleibt nachgebaut. Es bleiben `server.js`, Supabase, die Logik
in `src/lib` (48 von 57 Dateien ohne React/DOM) und alle Texte; neu werden
~14.000 Zeilen JSX/CSS. Weg: Würgefeigen-Umzug — Expo-Hülle, in der die alte
Oberfläche am ersten Tag als DOM-Komponente läuft, dann Bildschirm für
Bildschirm nativ. Plus-Knopf wird fünfter Tab in der Mitte (Antons Wort).
Skills sind installiert; Hanni bekommt die Anleitung beim nächsten Start
(`docs/uebergabe/2026-09-11-hanni-expo-skills.md`).

**Der Server rechnet den Filmpreis selbst.** `src/lib/quote.js` ist EINE
Rechnung für Wizard und Server. Liegt der Server teurer als angezeigt,
antwortet er 409 mit beiden Zahlen — bevor Regisseur oder fal etwas
kosten. Liegt er gleich oder billiger, gilt sein Preis. Bilder werden nur
beobachtet (Log). `GET /api/prices` liefert die Tabelle. Das ist Punkt 1
aus `docs/uebergabe/2026-09-11-anton-credits-abbuchung.md`; **Punkte 2–6**
(abbuchen über `server_spend`, `jobRef`, Erstattung je Topf,
fal-Fehler in `jobStatus`, Client-Abbuchung zurückbauen) **warten auf die
Anmeldung**.

**Die Capacitor-App läuft im Simulator** und hat seit PR #40 ein
nachgebautes iOS-Gefühl (Sheets mit Ziehen, geschobene Traum-Seite, Wisch
vom Rand, Haptik, Statusleiste; `useSheet.js`, `styles/sheets.css`). Das
ist die **Zwischenlösung** bis zum Expo-Umzug — Kurven, Dauern und
Schwellen daraus sind die Referenz für die native Fassung. Das
Tastatur-Plugin ist wieder draußen (Safe-Area-Fehler, Capacitor #6430).

**Geschäftliche Entscheidungen (Anton, 11.09.):** UG als Rechtsform;
Buchhaltung per Software, Jahresabschluss zukaufen; **Seedance 2.5 über
Replicate** (halber Einkauf), H3 bleibt bei fal. Vermerke:
`docs/plans/2026-09-11-rechtsform.md`,
`2026-09-11-direktbezug-videomodelle.md`,
`2026-09-11-umsatzsteuer-und-gruenderrechnung.md`.

**`server.js` ist mit der Datenbank verbunden — nach Least Privilege.**
`ADR-0005`: Supabase als Datenschicht (Status vorgeschlagen, Antons
Bestätigung steht aus). `server.js` verbindet sich als eigene Rolle
`dreamrushes_server` — auf das Guthaben nur lesend, ohne Umgehung von RLS.
**⚠ Genutzt wird die Verbindung noch nicht:** Die Credits liegen weiter im
`localStorage` und sind editierbar (Befund S7, offen). Die **Anmeldung**
(Sign in with Apple) ist zurückgestellt (Hannis Entscheidung, 11.09.) —
sie hängt an der Frage, wer als Verkäufer im App Store steht.

**Die Architektur ist bewertet:** `docs/ARCHITEKTUR.md` führt acht Befunde
(S1–S8) mit Schwere und Reihenfolge. Erledigt ist S4. S1 wartet bewusst auf
die Konten.

548 Tests grün, fünf Skriptprüfungen grün, Build ~510 KB / gzip 173.
Wie es hierher kam, steht im WORKLOG.

## Wo wir stehen

**Dream Rushes ist ein Videoprodukt** (Antons Entscheidung vom 31.08.):
Bilder werden nicht mehr verkauft, nur noch Film. Zwei Modelle (MiniMax H3
bis 15 s, Seedance 2.5 bis 30 s), je zwei Qualitäten, drei Tempi, und
seit heute **20 Presets als Video-Kacheln** statt neun: Dreamflow, acht
Stimmungs-Stile, elf Handwerksstile (Knete, Tusche, Scherenschnitt,
Marionette, Siebdruck …). Zehn in der ersten Reihe, neun hinter „More
styles". Der Film steht im Journal oben; mehrere Fassungen je Traum.

**Der Regisseur schneidet nach Gewicht** (`src/lib/cut.js`), an fünf
fremden Traumprotokollen geprüft, mit drei bezahlten Filmen bestätigt.
Die Handwerksstile geben ihm zusätzlich ihre **Bewegungssprache** mit
(`motion` in `styles.js`, über `filmStyleAnchor()`).

**⚠ Eine Korrektur, die noch niemand bezahlt geprüft hat:** Die
Serverkappung `MAX_CRAFTED_PROMPT` stand auf 3000 und schnitt seit dem
25.08. jeden Standbild-Prompt mitten im Stil ab — samt Foto-Anker und
allen Referenzklauseln. Jetzt 14.000, an den gemessenen schlimmsten Fall
gebunden. Der Film-Prompt hat seine eigene Grenze (`m.promptMax`).

**Was der Film heute noch nicht kann:** in der Zeit bleiben. Analyse und
Regie denken minutenlang — siehe Baustelle 1.

## Nächste Schritte

**⚠ Vor Architekturfragen zuerst `docs/ARCHITEKTUR.md` lesen** — dort stehen
die Befunde S1–S8 mit Schwere, Begründung und Reihenfolge. Die Punkte unten
sind Produktarbeit, die Befunde dort sind Fundamentarbeit.

**Als Nächstes, in dieser Reihenfolge:**

- **Bildschirme nativ, wertvollste zuerst** (Schritt 4, ADR-0006). **Die
  Journal-Liste ist nativ** (12.09., `mobile/src/app/journal/index.tsx`):
  großer Serifentitel, Suche im Kopf, Poster im Zweierraster (`expo-image`,
  Film-Standbild per `expo-video-thumbnails`, Verlauf, Feder beim Drücken,
  Haptik). Die Daten kommen über die Web-Brücke
  `mobile/src/legacy/journal-bridge.jsx` (unsichtbarer Webview liest den
  localStorage, reicht eine schlanke Liste per async-Prop). Tippen schiebt
  die **Traum-Seite noch als Web-Seite** auf (`journal/[id].tsx` →
  `legacy-dream.jsx`); das Raster-Symbol oben öffnet das ganze Web-Journal
  mit Besetzung, Atlas, Menagerie, Kalender (`journal/web.tsx`).
  **Als Nächstes:** die Traum-Seite nativ (Film oben, Text, Fassungen,
  Aktionen als Bottom-Sheet), dann Home, Wizard, Schlaf/Profil. Je
  Bildschirm nativ neu entwerfen, nicht das Web-Layout nachbauen.
  ⚠ NativeTabs ist Alpha, SDK-Stand 57.0.x festhalten.
  ⚠ Ungeprüft, weil hier niemand tippen kann: Poster → Traum-Seite → zurück.
- **Bekannte Grenzen der Tab-Hülle heute:** (a) Jeder Tab ist ein eigener
  Webview mit eigenem Zustand; beim Fokus liest er neu aus dem localStorage
  (`dreamrushes:reload`); die Brücke liest denselben Speicher. ⚠ Im
  Produktionsbau laden DOM-Komponenten von `file://` — ob sie sich dann
  noch einen localStorage teilen, ist NICHT belegt; spätestens dann muss
  der Zustand nach `expo-sqlite`. (d) Relative Bildpfade der Web-Seiten
  (`/clips/…` aus `public/`) zeigen im Webview auf Metro statt auf den
  Server — Beispielbilder fehlen dort; die Brücke macht sie für nativ
  absolut (`API_BASE`). (b) Web-Navigation innerhalb eines Tabs (Home →
  „letzter Traum" → Journal, Wizard-Abbrechen → Home) bleibt im selben Tab,
  statt den nativen Tab zu wechseln — Übergabe DOM→nativ per Prop fehlt
  noch. (c) Die Fragezeichen-Kästchen („schwer/okay/gut", Credits) sind
  ein fehlendes Glyph im Web — verschwinden mit den nativen Bildschirmen.
- **Datenschicht der Hülle:** localStorage im WKWebView fasst ~5 MB; die
  Traumsicherung sprengt das (deshalb `DEV: false` in
  `mobile/src/legacy/vite-env.js`). Beim Umzug der Screens auf nativ den
  Zustand nach `expo-sqlite` (Skill `expo-data-fetching`, false-friends).
- **Xcode-Build läuft** (12.09., 01:13): `mobile/ios/DreamRushes.xcworkspace`
  in Xcode öffnen, Ziel „DreamRushes", Simulator, ▶ — Metro muss laufen
  (`bun run mobile`). Der Ordner ist git-ignoriert; `bun run prebuild:ios`
  erzeugt ihn samt Pods und `.xcode.env.local` neu.
- **Seedance über Replicate anbinden** — eigene Sitzung. `src/lib/video.js`
  (je Modell `provider`, `slug`, `refsField`), `server.js` `falSubmitVideo`
  anbieterabhängig, `REPLICATE_TOKEN` (liegt in Antons `.env`), Tests.
  Regie-Brief unverändert. Danach gehört die Frage in den Preisentscheid:
  halber Einkauf an Kunden weitergeben oder als Marge behalten.

Danach, wie gehabt:

0. **iOS auf einem ECHTEN Gerät** — der Simulator ist seit 10.09. durch.
   Zwei Schritte fehlen, beide nur auf Hannis Mac machbar: in Xcode unter
   *Signing & Capabilities* das Entwicklerteam eintragen (das Einzige, was
   nicht im Repo liegen kann), und beim Bauen `VITE_API_BASE` auf die
   WLAN-Adresse des Macs setzen statt auf localhost:

       ipconfig getifaddr en0
       VITE_API_BASE=http://<IP>:8100 bun run build && bunx cap sync ios

   ATS erlaubt das jetzt (`NSAllowsLocalNetworking`); beim ersten Start
   fragt iOS einmal nach dem lokalen Netz — bestätigen, sonst bleibt die
   API stumm. Der Ablauf für den Simulator steht unten unter „Werkzeuge".
1. **⚠⚠ Die Uhren** (`api.js` TIMEOUTS, `server.js` directFilm/analyzeDream):
   `/api/generate` soll im Film-Modus SOFORT eine Auftragsnummer liefern
   und die Regie im Hintergrund schreiben — das schließt vermutlich die
   Ursache der verwaisten Filme. Für die Analyse: schnelleres Modell oder
   Denkbudget begrenzen; 2–4 Minuten sind kein Wartebildschirm mehr.
2. **⚠ PREISENTSCHEID** — mit einer Variablen weniger, siehe
   `docs/plans/2026-08-26-preisentscheid.md` und
   `2026-08-31-nur-noch-film.md` §3: Willkommensgeschenk (4 Cr kauft
   keinen Film; der billigste kostet 11), Paketgrößen, `dreamsFor()` in
   Filmen, Zweiteiler als Produkt ja/nein. **Braucht Antons Ja.**
3. **⚠ EIN bezahlter Film mit einem Handwerksstil** (Knete). Drei Fragen:
   Kommt der Look im Keyframe an? Setzt der Regisseur die Bewegung um
   (Stop-Motion auf Zweiern)? Bleiben die Gesichter erkennbar, obwohl der
   Foto-Anker aus ist? Wenn nicht: `buildReferences()` sagt „this exact
   likeness" — vielleicht braucht es „rendered in this material".
4. **Top 10 bestätigen.** Ink + Claymation in der ersten Reihe ist Claudes
   Wahl (die zwei entferntesten), nicht Antons. `featured: true` in
   `styles.js`; `presets.test.js` prüft, dass das Raster aufgeht.
5. **Nur-noch-Film Phase 3** (`2026-08-31-nur-noch-film.md` §5): Modus
   „Bilder" aus dem Wizard, Standbild aus dem Film (ffmpeg, erstes Frame),
   Charakterbögen sichtbar. Erst DANN den toten Bildcode entfernen.
6. **Echte Preset-Clips:** jetzt zwanzig statt neun. Je einer im Stil
   gerendert, fünf Sekunden, 270 px, stumm, nach `src/assets`; in
   `presets.js` wird `clip` ein Import. Die elf Handwerksstile zeigen bis
   dahin Emoji auf Farbe.
7. **Gesichter-Kopien beim schnellen Schnitt:** Der Regie-Brief muss
   sagen, dass Nebenfiguren Fremde sind (`director.js`, ACTIVE REFERENCES).
8. **Regie-Prompt unter dem Limit halten** — bei sieben Shots kappt
   `server.js` (`m.promptMax`) am Ende. Mit den Handwerksstilen kommt
   `motion` dazu; der Brief sagt „cut style prose first", prüfen, ob er
   das tut.
9. **`WizardShell.jsx:66`**: Wiederaufnahme setzt `"dreamlike"` als
   Stil-Vorgabe, die App-Vorgabe ist seit 24.08. `ultrareal`. Einzeiler.
10. **Server härten** — ~~14× `fetch` ohne Timeout~~ **erledigt 11.09.** ·
    `spawnSync` bei `/api/film-outro` blockiert den ganzen Server (S8) ·
    fal-Fehler als „pending" verschluckt (`server.js` jobStatus). Der Rest
    steht mit Schwere und Reihenfolge in `docs/ARCHITEKTUR.md`.
11. **Name für Dreamflow** bestätigen · Policy-Weg im Echtbetrieb ·
    Reflection-Sprache · zwei weitere Maskottchen · Klang-Presets.

## Entschieden am 05.09. — kein drittes Videomodell

**Gemini Omni 1.1 Flash ist geprüft und gedroppt** (Antons Wort nach der
Probe; Befund mit sieben Messpunkten in
`docs/plans/2026-09-05-gemini-omni-probe.md`, Skripte `scripts/omni-*.mjs`
als Messprotokoll hinter `--ja`). Kurz: 360p wird für den Kunden nicht
billiger als H3 480P (beide 2 Credits/s), der Draft lässt sich nicht
hochrechnen, die Kette über die Vorgänger-ID hängt immer am ersten Clip,
das Verlängern hochgeladener Videos wird komplett geblockt. Die
Zweiteiler-Frage bleibt beim Preisentscheid.

## Bekannte Baustellen

- **Analyse und Regie sind langsam** — Baustelle 1. 96 % der erzeugten
  Token sind Denk-Token.
- **Verwaiste Filme** — dreimal gesehen. Netz: `mergeShared` füllt Filme
  nach, `/api/job` holt bei Anfrage. Strukturfix ist Baustelle 1.
- **⚠ Kein bezahlter Beweis für den ungekappten Standbild-Prompt.** Alles,
  was seit dem 25.08. „bezahlt bewiesen" heißt, lief mit einem Prompt,
  dem Stil-Rest, Anker und Klauseln fehlten.
- **DreamBank-Träume dürfen NIE ins Repository** — CC BY-NC-SA. Die Datei
  `data/traeume/2026-09-03-e_mtlxb972tea3m5.json` liegt (11.09. abends)
  wieder uncommittet im Hauptcheckout. So lassen, nie committen.
- **Nebenbefund Plan B:** Der Client bucht `block.length` ab (4), zeigt
  aber 6. Fällt mit der Server-Abbuchung weg, deshalb nicht angefasst.
- **Die Capacitor-Hülle ist Zwischenlösung** — ADR-0006, Umzug auf Expo.
- **iOS: Signing/Team und das echte Gerät stehen aus** (nächster Schritt 0).
  Der Simulator ist seit 10.09. durch, inklusive API-Verbindung.
- **Bildcode ist noch da** (Raster, Schnitt, `imageJobs`, Storyboard-
  Nachfüllen, Paywall-Bilderkachel) — bewusst, bis Phase 3 durch ist.
- **`styles.js` trägt `poster`-Angaben, die niemand liest** — der
  Plakat-Bauer ist weg. Steht am Dateikopf.
- **Policy-Weg ungetestet im Echtbetrieb** · **kein Zahlungsanbieter** ·
  **`data/traeume` und `media/besetzung` müssen vor Veröffentlichung raus**
  · **Antons Berechtigungsliste nicht selbst erweitern.**

## Fallen, die man nur einmal sieht

### Die stummen Geldfehler

- **⚠⚠ Ein gekappter Prompt ist ein gültiger Prompt.** `MAX_CRAFTED_PROMPT
  = 3000` schnitt vom 25.08. bis 08.09. jeden Standbild-Prompt ab —
  Stil-Rest, Foto-Anker, ALLE Referenzklauseln. Kein Fehler, keine
  Warnung, durch bezahlte Läufe hindurch. **Jede Obergrenze braucht einen
  Test, der den größten echten Fall dagegen hält** (`styles.test.js`
  liest `server.js`) — sonst wächst der Inhalt still über sie hinaus.
- **⚠⚠ Ein Fehler, der Geld kostet, meldet sich NIE von selbst** · **ein
  verirrtes `+ +` ist Prompt-Sabotage** · **ein Anker ins Leere meldet
  sich genauso wenig.**
- **⚠ Die Regie-Prompt-Kappung war stumm** — jetzt warnt sie. 7000 bei H3
  heißt gekappt, nicht „passt genau".

### Regie und Schnitt (03.09.)

- **⚠⚠ Ein Test am eigenen Traum findet die eigenen Fehler nicht.** Vor
  jedem Regie-Umbau: `/regisseur-schnitt` an fremdem Material.
- **⚠⚠ Vier von fünf Träumen hören einfach auf.** `cut.js` entzieht einem
  abbrechenden Schluss den Vorrang, auch wenn die Analyse ihn „climax"
  nennt.
- **⚠ Die Empfehlung rechnet über den KERN, nie über alle Szenen.**
- **⚠ Bei fünf Sekunden ist ein Film ein Bild:** der Signatur-Beat.
- **⚠ `beatBudget` ≠ `shotBudget`:** Der Fluss hat EINEN Shot, aber ALLE
  Szenen darin — und darum kein Storyboard.
- **⚠ `list()` in `server.js` ist für Personen und Orte gebaut**, nicht
  für Szenen (`MAX_BEAT` = 200).
- **⚠ Der Regie-Brief nennt das Budget JE SHOT.** · **Kurze Blöcke +
  Referenz = alle Gesichter werden die Referenz.** · **`filmsOf()` stellt
  die alte Form voran.**

### Stile und Presets (08.09.)

- **⚠ Ein Prompt, der „photoreal" sagt und drei Zeilen später „gouache",
  hat sich entschieden, bevor der Stil dran ist.** Das Wort in der Kachel
  folgt jetzt dem Stil (`stillNoun()` in `promptBuilder.js`).
- **⚠ `painterly` heißt „ohne Foto-Anker", nicht „gemalt".** Der Anker
  bestellt Poren; Knete, Papier und Marionetten haben keine, obwohl sie
  fotografiert sind.
- **⚠ Video-Prompts tragen Bewegungssprache, die dem Bildmodell nichts
  nützt.** `prompt` (Look, Keyframe) und `motion` (Bewegung, Regisseur)
  sind getrennt; nur `filmStyleAnchor()` fügt sie zusammen.
- **⚠ Eine Liste, die zweimal steht, läuft beim ersten neuen Eintrag
  auseinander** (`ANALYSIS_STYLES` — jetzt aus `featuredStyles()`). Die
  Analyse rät nur aus der ersten Reihe: Knete ist eine Wahl, nie ein
  Vorschlag.
- **⚠ Ob ein Preset sichtbar ist, steht am STIL (`featured`), nicht am
  Preset** — eine Wahrheit, ein Ort. `featuredPresets()` leitet ab.
- **⚠ Kacheln in drei Spalten gehen nur auf, wenn die Zellen durch drei
  teilbar sind — ZWEIMAL:** erste Reihe allein (12) und alles zusammen
  (21). Bei neun Kacheln brauchte es zwei breite, bei elf nur noch
  Dreamflow. `presets.test.js` rechnet nach.
- **⚠ Ausgegraut liest sich als „kostet extra".** Deshalb klappt die
  zweite Reihe auf, statt grau dazustehen; der Knopf verschwindet danach.
- **⚠ Ein Kachelname hat Platz für zwei kurze Wörter** — „90s Fantasy
  Anime" wurde zu „90s Fantasy…". Jetzt „Fantasy Anime".

### iOS und Capacitor (10.09.)

- **⚠⚠ Ein grüner Build sagt NICHTS über eine laufende Verbindung.** Antons
  `xcodebuild` am 09.09. war ein reiner Übersetzungslauf; dass jeder
  `/api`-Aufruf der nativen App am fehlenden CORS starb, konnte er dabei
  nicht sehen. **Native Hüllen müssen einmal echt sprechen, nicht nur
  übersetzen.**
- **⚠⚠ `capacitor://localhost` ist ein FREMDER Origin — auch gegenüber
  `http://localhost`.** Schema und Port unterscheiden sich, damit ist jeder
  Aufruf an `VITE_API_BASE` cross-origin. Im Browser fällt das nie auf, weil
  Oberfläche und API dort denselben Origin teilen. `server.js` beantwortet
  seit dem 10.09. Preflights und setzt Freigaben (`corsHeaders()`), **gegen
  eine Liste, nicht mit `*`** — der Server hält die Schlüssel, und mit `*`
  könnte jede Seite in jedem Browser bezahlte Läufe auslösen.
- **⚠ Ein Preflight muss VOR der Geldschranke beantwortet werden.** Ein
  OPTIONS trägt kein Token und tut nichts; durch den Gatekeeper geschickt
  könnte das Rate-Limit ausgerechnet die Frage abweisen, ob die echte
  Anfrage gestellt werden darf.
- **⚠⚠ Fehlende Nutzungstexte in `Info.plist` sind kein Schönheitsfehler —
  iOS beendet die App hart.** Kein Dialog, kein Fehler, nur weg, sobald sie
  nach Mikrofon (`voiceSession.js:132`) oder Kamera
  (`AvatarDialog.jsx:359`) greift. Alle drei Texte stehen jetzt drin, mit
  Begründung als Kommentar. **Wer eine Web-API nativ verpackt, prüft die
  Berechtigungen VOR dem ersten Antippen.**
- **⚠ Der erste Start dauert Minuten und sieht aus wie ein Absturz.**
  Gemessen: `WebContent 5,27 s`, `GPU 4,95 s`, `Networking 5,59 s` — WebKit
  startet drei kalte Hilfsprozesse, dazu der erste SPM-Build. Geduld, kein
  Fehler.
- **⚠ `⚡️ JS Eval error` beim Start ist harmlos** (`CapacitorBridge.swift:660`):
  Capacitor feuert `window.Capacitor.triggerEvent(...)`, bevor
  `window.Capacitor` in der Seite existiert. Steht deshalb VOR
  `⚡️ WebView loaded`. **Xcode-Konsole nach `⚡️` filtern** — von ~30
  Startzeilen sind zwei relevant, der Rest ist Simulator-Rauschen.
- **⚠ Träume gehen raus, aber nicht zurück.** Die Rückhol-Logik ist DEV-only
  (`AppState.jsx:412`) und fällt bei `vite build` heraus; die Sicherung
  selbst läuft auch nativ (`AppState.jsx:456`). Stirbt der `localStorage`
  im Simulator, liegen die Träume sicher in `data/traeume/` — die App holt
  sie sich nicht wieder. Die Besetzung mit Fotos ist ganz DEV-only
  (`AppState.jsx:468`), läuft nativ also gar nicht.
- **⚠ Ein Worktree überlebt keinen Pfadwechsel der Umgebung.** Zeigt
  `<worktree>/.git` auf einen toten Mount, sagt jedes `git` dort „not a git
  repository" und `git worktree list` meldet `prunable`. Reparatur: die
  zwei Zeiger umbiegen (`<worktree>/.git` und
  `<hauptrepo>/.git/worktrees/<name>/gitdir`). **Das ist nicht kosmetisch:**
  `mediaRoot.js` liest genau diese `.git`-Datei, um das Hauptrepo zu finden
  — mit totem Pfad schreibt die Traumsicherung ins Nirgendwo.
- **⚠ `bun run build` läuft über das System-`node`, nicht über Bun.** Bei
  Node 12 stirbt `vite` an `ERR_REQUIRE_ESM` und die Capacitor-CLI
  verweigert (`requires NodeJS >=22`). Notausgang ohne Installation:
  `bun --bun run …` erzwingt Buns eigene Runtime. Auf Hannis Mac steht seit
  dem 10.09. Node 26.8.1 (Homebrew), dort gehen die Befehle unverändert.

### Gestaltung

- **⚠ Ein Wert kann keinen Vergleich ausdrücken** (Luzid-Guide, zweimal).
- **⚠ Der ZUERST genannte CSS-Verlauf liegt OBEN**; Masken statt Overlays.
  Verläufe nie über `background-position` animieren.
- **⚠ In einer Flex-SPALTE bekommt jedes Element seine eigene Zeile.**
- **⚠ `aspect-ratio` auf gestreckten Grid-Kindern** läuft aus dem Bild.
- **⚠ Ein 9:16-Wartefeld ohne Bild sind 700 px Leere** — `j-video-wait-leer`.
- **⚠ `mix-blend-mode: screen` braucht KEIN `isolation: isolate`.**
- **⚠ JSX-Text ist kein JavaScript-String** · **HeroGlow: nur Variablen
  setzen, nie eigener Verlauf.**

### Werkzeuge und Umgebung

- **⚠⚠ Grüne Tests sagen nichts über den Build.** `bun test` lädt die
  Wizard-JSX nicht; eine fehlende Klammer in `Step5Style.jsx` lag am 11.09.
  vom Nachmittag bis abends unbemerkt (57efeed → a6aac55). Nach jeder
  JSX-Änderung `bunx vite build`.
- **⚠ Das Simulator-Panel in Claude meldet „Xcode not selected"**, obwohl
  `xcode-select -p` stimmt. Den Simulator direkt über Xcode bedienen.
- **⚠ React 18 StrictMode ruft Effekt-Cleanups doppelt, Refs nicht** — ein
  Cleanup, das Listener eines Callback-Refs abmeldet, macht Gesten im
  Dev-Modus tot (`useSheet.js`, 11.09.).
- **⚠ Capacitor-Tastatur-Plugin nie wieder einbauen:** nach dem Schließen
  wertet WebKit `env(safe-area-inset-bottom)` nicht neu aus (#6430).
- **⚠⚠ Eine Rot-Probe wird mit `sed` zurückgedreht, nie mit
  `git checkout -- datei`** — das holt ALLE Änderungen der Datei zurück,
  nicht nur die Probe (08.09.: vier Stellen neu gesetzt).
- **⚠ `pkill -f "bun server.js"` trifft die eigene Shell** und bricht den
  Befehl ab, in dem es steht — als eigener Befehl danach ausführen.
- **⚠⚠ Der Vorschau-Browser überschreibt `data/traeume`** — nach jedem
  Test `git status` auf `data/`; Commits mit `:!data/traeume`.
- **⚠ Der Vorschau-Browser klickt daneben**; `element.click()` per
  JavaScript ist zuverlässig. Nach HMR an `AppState.jsx` voller Reload.
- **⚠ Neun laufende Videos in voller Größe blockieren den Renderer** —
  Vorschau-Kopien: 270 px, 6 s, stumm, < 200 KB. Mit zwanzig Kacheln
  gilt das doppelt.
- **⚠ `resolveMedia()` lässt nur `[a-z0-9]{1,20}` durch.**
- **⚠ Ohne `charset=utf-8` im HTTP-Kopf wird die App zu Kauderwelsch**
  („â€"", `ðŸ˜'`) — bei der Portierung in einen WebView nachprüfen.
- **⚠ In der Cloud fehlt `node_modules` nach einer Weile** — `bun install`.
- **⚠ Renderskripte kosten Geld, brauchen `--ja`** · `node` gibt es nicht,
  nur `bun` · Stützuntergrenze Chrome 119 / Safari 17.4 · `setLanguage()`
  ist async · Speichern gesammelt (250 ms) · Uploads auf 1600 px.
- **Sitzungen laufen ohne Worktree.** Cloud-Sitzungen pushen auf
  `claude/new-session-x9qv1w` (vorgeschrieben), auf `main` zurückgesetzt.
- fal.ai, DeepSeek und docs.google.com sind aus der Cloud gesperrt (403).

### Geld, Modelle, Prompts

- **⚠ Der erste bezahlte Lauf gehört mit EINEM Traum gemacht.**
- **⚠ H3 schneidet nur bei neuer Information; Seedance will ≥ 3 s je
  Shot** — das schnelle Tempo (2 s) steht bewusst dagegen (`PACES.fast`).
- **⚠ Vorgaben ABLEITEN, nie hinschreiben** · **`slots` ≠ `tiles`** ·
  **der Bogen ist das Nadelöhr der Ähnlichkeit** · **iOS gibt für die
  Benachrichtigungs-Erlaubnis EINEN Versuch** · **ein falscher Feldname
  wirft bei fal keinen Fehler** · **kein Alpha-Videoformat für iOS UND
  Android** — Alpha-Packung.

## Werkzeuge

- **Expo-Hülle im Simulator** (seit 11.09. nachts; Expo Go, kein Xcode-Build):

      bun run dev:api          # Tab 1: server.js auf 8100
      bun run ios              # Tab 2: Metro auf 8081 + öffnet Expo Go per simctl

  ⚠ `expo start --ios` NICHT direkt aufrufen: der Schalter holt das
  Simulator-Fenster per AppleScript nach vorn und stirbt, wo Automation
  verboten ist (Claude-Sandbox); deshalb öffnet das Skript per
  `xcrun simctl openurl booted exp://localhost:8081`. ⚠ localhost, nicht die
  WLAN-Adresse — die erreicht der Simulator aus der Sandbox nicht.
  Die alte Oberfläche läuft aus `../src` (nichts kopiert); Speichern lädt
  sie neu. API-Adresse: `EXPO_PUBLIC_API_BASE` (Vorgabe localhost:8100).
  ⚠ `create-expo-app` braucht npm; die Vorlage kam als npm-Paket
  `expo-template-default@sdk-57` über `bun add`.
- **Werkzeugkette auf Antons Mac** (12.09. nachts, ohne Homebrew eingerichtet,
  weil Homebrew an curl hängt — siehe LuLu unten):
  · **Node 26.8.2** in `~/.local/node` (offizielles Paket von nodejs.org,
    sha256 geprüft); `node`, `npm`, `npx` in `~/.local/bin`, dazu zeigen
    `~/.bun/bin/node` und `/opt/homebrew/bin/node` darauf (vorher Buns Shim).
  · **CocoaPods 1.17.0** über Homebrews portables Ruby 4.0.6
    (System-Ruby 2.6 ist zu alt): Gems in `~/.local/cocoapods`, Wrapper
    `~/.local/bin/pod` setzt GEM_HOME und **UTF-8-Locale** (ohne die stirbt
    `pod install` an „Unicode Normalization not appropriate for ASCII-8BIT").
  · **Hermes vorgebaut** in `~/.local/hermes` (Maven Central, sha1 geprüft),
    weil React Native ihn per curl lädt; `bun run pods` setzt
    `HERMES_ENGINE_TARBALL_PATH`. ⚠ Nach einem RN-Upgrade Version aus
    `node_modules/react-native/sdks/hermes-engine/version.properties`
    (`HERMES_V1_VERSION_NAME`) neu laden.
  · **⚠⚠ LuLu blockt `/usr/bin/curl`** (Regel in
    `/Library/Objective-See/LuLu/rules.plist`). Folgen: `brew install`
    scheitert („Could not resolve host ghcr.io"), React Native fällt beim
    Hermes-Download auf den Quellbau zurück und verlangt cmake, CocoaPods-
    Downloads per curl scheitern. Anton erlaubt curl in LuLu, dann entfallen
    die Umwege. Bun, Ruby, Python und Git sind nicht betroffen.
  · **React Native vorgebaut** in `~/.local/rn` (Core + Dependencies 0.86.3
    von Maven Central, sha1 geprüft). Ohne die Tarballs prüft RN per curl,
    ob es Artefakte gibt, sieht „nein" und baut aus dem Quelltext — Expos
    vorgebaute Module erwarten aber `React.framework` und die App stirbt
    beim Start an `dyld: Library not loaded: @rpath/React.framework`.
    `bun run pods` setzt `RCT_TESTONLY_RNCORE_TARBALL_PATH` und
    `RCT_USE_LOCAL_RN_DEP`. ⚠ Nach einem RN-Upgrade Version anpassen.
  · **expo-modules-jsi gepatcht** (`mobile/patches/`, über `bun patch`):
    Xcode 26.3 (Swift 6.2.4) lehnt `SWIFT_RETURNS_RETAINED` an Konstruktoren
    ab und meldet „sending 'resultPtr' risks causing data races" als Fehler
    (expo/expo#47539 offen). Patch: Annotation weg, Zeiger in einem
    `@unchecked Sendable`-Container. ⚠ Swift-5-Modus ist KEIN Ausweg
    (andere Fehler). Beim Expo-Upgrade Patch prüfen und ggf. löschen.
  · **Capacitor-Pakete in `mobile/`** (`@capacitor/core`, `haptics`) sind
    nur für die JS-Importe der alten Oberfläche da und in `package.json`
    unter `expo.autolinking.exclude` vom nativen Einbinden ausgeschlossen —
    sonst bricht `pod install` an CapacitorCordova.

- **Skills für die native Oberfläche** (seit 11.09., Pflichtlektüre vor
  Oberflächenarbeit). Einmal je Rechner:

      claude plugin install expo@claude-plugins-official
      npx skills add software-mansion-labs/skills

  Das Expo-Plugin bringt einen MCP-Server mit, der sich per `/mcp` in einer
  interaktiven Sitzung anmelden will — nur für EAS-Dienste nötig, die Skills
  laufen ohne. Die Software-Mansion-Kopien liegen git-ignoriert in
  `.agents/skills`; versioniert ist nur `skills-lock.json`.
- **iOS im Simulator** (zwei Terminals, Stand 10.09.):

      # Tab 1 — Server, muss laufen bleiben (hält die Schlüssel)
      bun run dev:api

      # Tab 2 — bauen, in die Hülle kopieren, Xcode öffnen
      VITE_API_BASE=http://localhost:8100 bun run build \
        && bunx cap sync ios && bunx cap open ios

  In Xcode: Ziel „App", ein Simulator, ▶. Nach einer `Info.plist`-Änderung
  **Stop und neu starten**, ein Reload greift dort nicht. Bei `EADDRINUSE`
  hält ein alter Server den Port: `pkill -f "bun server.js"` als eigenen
  Befehl (er trifft sonst die eigene Shell).
- **Live-Reload beim Entwickeln** (seit 10.09.) — spart die ganze
  Xcode-Runde je Web-Änderung:

      bun run dev                                   # 8100 + 5173
      CAP_SERVER_URL=http://localhost:5173 bunx cap sync ios

  Danach lädt die App vom Vite-Server; Speichern reicht, Xcode bleibt zu.
  `VITE_API_BASE` braucht es dabei **nicht** (Vite reicht `/api` und
  `/media` selbst durch — ein Origin, keine CORS-Frage). Fürs echte Gerät
  die WLAN-IP nehmen **und** `bunx vite --host`, sonst lauscht Vite nur
  nach innen. **⚠ Die Variable gehört NICHT in die `.env`** — die
  Capacitor-CLI liest die Datei nicht. **⚠⚠ Vor dem Ausliefern einmal
  `bunx cap sync ios` OHNE die Variable**, sonst versucht die App still,
  von einem abgeschalteten Laptop zu laden: weißer Bildschirm ohne
  Begründung.
- `/regisseur-schnitt` — Traumtext + Sekunden + Modell → Beat-Tabelle,
  Empfehlung, Shot-Liste. Rendert nichts.
- `bun scripts/preis-durchreichen.mjs` — alle vier Modell/Qualitäts-Stufen.
- `bun scripts/raster-rechnung.mjs` · `gpt-preise.mjs` · `bogen-vergleich.mjs
  --ja` · `raster-rendern.mjs --ja` · `alpha-packen.mjs`.
- **StartMenu → „Mascot test bench"** · **„Style tiles mockup"** (drei
  Layouts für Preset-Kacheln, B ist gebaut).
- Cloud-Vorschau (Stand vom 28.08., Oberfläche ohne API):
  https://claude.ai/code/artifact/e07a94f4-9666-44da-a3c2-fdd061f638fe

## Was die App ist

React-SPA: Traum aufschreiben oder sprechen → KI schneidet ihn zum Film
(H3 oder Seedance 2.5), dazu Reflection und Muster. Vier Tabs (Home ·
Journal · ⊕ · Sleep · Profil), Wizard über der Tab-Leiste.
**Stack:** Bun + Vite + React 18 (HashRouter); `server.js` als
schlüsselhaltender Proxy (fal.ai, DeepSeek, Gemini). Zustand in
`localStorage` (`dreamrushes_v1`). Sieben Sprachen, gepflegt **en+de**.
**Nativ:** Capacitor 8 packt `dist/` in eine iOS-App (`ios/App`, per SPM,
kein CocoaPods) — echte `.app`, echtes Xcode-Ziel, Oberfläche im WKWebView.
Seit 10.09. im Simulator lauffähig samt API. Eine ADR, die diese Wahl
begründet, **gibt es bis heute nicht** — sie steht unter „Nächste Schritte"
der früheren Sitzungen als offener Punkt („Capacitor-ADR + In-App-Käufe").
**Stile:** 19 (`styles.js`) — 8 Stimmungs-Stile, 11 Handwerksstile; als
20 Presets mit Dreamflow (`presets.js`), 10 in der ersten Reihe.

## Geld

Preisliste (`plans.js`, UNVERÄNDERT bis zum Entscheid): Woche $4,99/**25** ·
Monat ★ $9,99/**100** · Jahr $79,99/**100** p.M. · Pakete $2,99/**13** ·
$7,99/**36** · $14,99/**70**. Willkommensgeschenk: **4 Credits** — kauft
keinen Film mehr.
Film je Sekunde: H3 **2/3** Cr (480P/768P) · Seedance 2.5 **8/17** Cr
(480p/720p), plus 1 Cr Keyframe. Einkauf $0,05/0,06 bzw. $0,2205/0,473
je Sekunde. Ein 15-s-H3-Film in 768P: 46 Credits, ≈ $0,93 Einkauf.
**Direktbezug (Entscheidung 11.09.):** Seedance über Replicate
$0,1028/$0,2312 je Sekunde (480p/720p) statt fal $0,2205/$0,473 — noch
nicht angebunden. H3 bleibt bei fal.
**Gründerrechnung:** 2×5.000 € netto brauchen ≈ 36.000 €/Monat
Nutzerumsatz brutto, also ≈ 3.600 Abos à 9,99 € (Apple 15 %, 19 % USt,
Modellkosten 30 %). Herleitung und Hebel im Umsatzsteuer-Vermerk.
