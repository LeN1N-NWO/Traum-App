# STAND — aktueller Projektzustand

> Diese Datei wird bei jedem Sitzungsende KOMPLETT überschrieben.
> Sie zeigt immer nur die Gegenwart. Historie gehört ins WORKLOG.

**Stand:** 2026-08-23 (10:35) — laufende Sitzung
`session/2026-08-22-anton-4` (PR #23), main ist `17e0b4c`.
⚠ Ohne eigenen Worktree im Hauptrepo — Begründung unten unter „Fallen".

## Wo wir stehen

**Die Bildstrecke ist ein Film geworden, kein Zufallsstapel.** Jede Szene
ankert am vorigen Bild (`src/lib/imageChain.js`), und der Anker ist als
LETZTES Referenzbild Vertrag mit dem Prompt. Antons „das sieht aus wie
Photoshop" ist behoben: die Klausel in `promptBuilder.js` sagt jetzt
ausdrücklich, dass der vorige Frame nur Welt und Licht liefert und jede
Figur für DIESE Szene neu fotografiert wird.

**Das Bildmodell ist Seedream 5 Lite** (`src/lib/imageModel.js`, seit
23.08.). $0,035 statt $0,042 je Bild bei 1440×2560 statt 768×1376 —
billiger UND sechsmal so viele Pixel. Endpunkte, Adressformat und
Referenzbudget stehen in EINER Tabelle; Bogen und Szene nehmen denselben
Weg, ein Modellwechsel trifft also beide oder keinen.

**Die Wartezeit nach dem Sprachgespräch ist versteckt.** Die Auswertung
startet mitten im Erzählen, nicht beim Abschied.

Die Preislinie ist weiter durchgerechnet, aber **nicht entschieden** —
sie ist der einzige echte Blocker.

## Nächste Schritte

1. **Antons Preisentscheidung** — Weg C + Paket XL ($29,99, bemessen am
   30-%-Fall) ODER Kino ehrlich auf 10 Sekunden begrenzen. Danach:
   `plans.js`, `video.js` und die Paywall-Texte in einem Zug.
2. **Seedream an echten Träumen prüfen.** Bisher steht EIN A/B-Lauf über
   fünf Szenen dahinter, plus zwei Einzelaufträge durch die App. Zwei,
   drei echte Träume von Anton, bevor das als erledigt gilt.
3. **Antons Bogen erneuern** (Foto neu hochladen) — oder entscheiden, ob
   das Modell in den Fingerabdruck soll. Siehe „Baustellen".
4. **Klang-Presets:** Anton hört durch, wählt 2–3, holt die Originale
   über sein Freesound-Konto. Danach `public/sounds/<preset>.m4a` und
   ein zweiter Puffer-Lieferant in `src/lib/noise.js`.
5. **Traumzeichen-Karten** (`2026-08-22-traumzeichen-karten.md`): 20
   Bilder von Anton. Vertagt auf sein Wort.

## Bekannte Baustellen

- **Vorhandene Charakterbögen überleben einen Modellwechsel**
  (`src/lib/sheets.js:31`). Der Fingerabdruck ist Foto + Beschreibung,
  das Modell steht nicht drin. Antons Bogen stammt darum noch von Nano
  Banana Lite. Reparatur ohne Code: Foto neu hochladen. Die Alternative
  (Modell in den Fingerabdruck) ist bewusst nicht gebaut — sie kostet bei
  jedem Wechsel einen Gratis-Bogen je Figur.
- **Synthetische Testträume schreiben sich zurück.** `e_leer`, `e_test1`,
  `e_test2` liegen wieder unversioniert in `data/traeume/`, obwohl
  `3c23b65` sie entfernt hat: sie stehen in Antons localStorage und
  landen bei jedem App-Start erneut auf der Platte. Nicht committet.
  Wirklich weg sind sie erst, wenn er sie in der App löscht.
- **Preislinie** (`2026-08-22-preislinie-durchreichen.md`, Abschnitt 8):
  Kino ist in voller Länge mit keinem Angebot in einem Kauf erreichbar.
  ⚠ Neu dazu: Im JAHRESPLAN bleiben je Fünf-Bilder-Traum nach MwSt. und
  Apple nur $0,53. Mit Seedream ($0,175 Einkauf) trägt das; mit vollem
  Nano Banana ($0,40) blieben $0,13. Wer je zurückwechselt, muss den
  Jahrespreis mitnehmen.
- **Streak §5 offen:** das garantierte Sonderwesen je Meilenstein.
- **Mehrwert-Plan:** P1, P2a, P2b, P3b gebaut. Offen: P2c (Traumzeichen),
  P3a Albtraum-Umschreiben (Wortlaut mit dem Rechtsplan abstimmen).
- **Recht** (Plan recht-einwilligung §4): Punkt 1 gebaut; offen
  Upload-Zusicherung im AvatarDialog (2) · KI-Kennzeichnung/C2PA (3) ·
  Speicherfristen /media (4, server.js speichert unbegrenzt) ·
  DeepSeek-China-Entscheidung (5) · Klang-Lizenzliste (6).
- **`data/traeume/` muss vor Veröffentlichung raus** — Ordner UND
  Ladepfad in `AppState.jsx`. Begründung steht in `.gitignore`.
- **Kein Zahlungsanbieter.** Dummy-Film im Kaufblatt (`Paywall.jsx`).

## Fallen, die man nur einmal sieht

- **`FAL_MODEL_IMAGE` ist ein NAME, kein fal-Slug** (seit 23.08.).
  Erlaubt: `seedream-5-lite`, `nano-banana-2-lite`, `nano-banana-2`. Ein
  unbekannter Wert fällt auf die Vorgabe zurück — der Server warnt beim
  Start und nennt in jedem Fall das laufende Modell samt Stückpreis.
- **Ein falscher Feldname wirft bei fal keinen Fehler.** Er liefert still
  das Falsche. Deshalb entscheidet `imageModel.js` über Endpunkt und
  Adressformat, nie der Aufrufer. Mit Referenzen MUSS es der
  Edit-Endpunkt sein; der Text-zu-Bild-Pfad ignoriert `image_urls`
  wortlos (07.08.: tagelang Bilder ohne Gesichter, bezahlt).
- **Der Weltanker der Bildkette steht als LETZTES Bild.**
  `buildImagePrompt` sagt dem Modell genau das. Wer die Reihenfolge in
  `falSubmitImage` ändert, bricht die Kette lautlos.
- **Eine leere Nacht ist KEIN TRAUM** (`src/lib/blankNight.js:27`). Die
  Erkennung hängt an EINEM Feld, alle Filter lesen `isBlank()`.
- **Keine Teilrettung bei der Schlummernacht** (`streak.js:61`).
- **Das wandernde Licht steht EINMAL** in `src/styles/orbit.css`. Der
  Winkel MUSS `@property` bleiben — sonst interpoliert er nicht.
- `update()` (`src/state/AppState.jsx`) nimmt auch Funktionen:
  `(prev) => patch`. Wer in Schritten arbeitet, MUSS das benutzen.
- `clearStalePending()` räumt beim Start hängende „wird erstellt"-Marken.
- `recurrenceFor()` (`src/lib/atlas.js`) zählt ALLE anderen Träume.
- `key={open.id}` am JournalDetail ist Pflicht (JournalScreen.jsx).
- `PORT` gehört der Oberfläche, `API_PORT` der API.
- Erzeugte Medien NIE im Worktree (`src/lib/mediaRoot.js`, AGENTS.md).
- **`scripts/modell-ab.mjs` rendert echt und kostet Geld** ($0,18–0,40 je
  Lauf). Es nimmt den Modellnamen als drittes Argument.
- **Warum die Sitzungen trotz AGENTS.md ohne Worktree laufen:** Die
  Browser-Vorschau startet den Dev-Server immer aus dem HAUPT-Checkout
  (`.claude/launch.json` liegt dort). Aus einem Worktree heraus würde sie
  fremden Code servieren, und die Live-Prüfung wäre blind. Wer ohne
  Live-Prüfung arbeitet, legt den Worktree wie vorgesehen an.

## Klickbare Wolken-Vorschau (aus #18)

**https://claude.ai/code/artifact/7a42cf64-fe13-49f2-a31e-46b67afb5616**
Alles Lokale funktioniert, Erzeugen nicht (braucht den Server). Zum
Auffrischen: `bun run build` + Bündelskript, denselben Pfad erneut
veröffentlichen. Bewusst NICHT im Repo. Stand: 22.08. vormittags.
