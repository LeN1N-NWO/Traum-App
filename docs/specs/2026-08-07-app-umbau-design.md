# Spec: Umbau zur echten App — Screens, geführter Flow, Prompt-Baukasten

**Datum:** 2026-08-07 · **Status:** entworfen, vom Produktbesitzer freigegeben
**Betrifft:** ADR-0004 (React+Vite, ersetzt Vanilla-Teil von ADR-0002/0003)

## Warum

Die App ist heute drei lose HTML-Seiten mit einem langen Formular. Sie soll
sich wie eine echte App anfühlen — Tabs, Screens, ein geführter Ablauf — und
später über Capacitor nach Xcode und Android portiert werden. Gleichzeitig
gibt es einen konkreten Logikfehler: Referenzfotos werden nur mitgeschickt,
wenn ihr `@tag` **wörtlich** im Traumtext steht (`mentionsTag()`). Wer „meine
Schwester" schreibt statt „@anna", bekommt kein Referenzfoto — obwohl eins da
wäre. Die Zuordnung gehört in den Ablauf, nicht in einen Regex.

Drittens soll der Ablauf Geld verdienen: bezahlte Schritte („AI verbessern",
Bilder, Film) brauchen eine sichtbare Credit-Anzeige, lange bevor es echtes
Guthaben gibt.

## Nicht Teil dieser Spec

- Echtes Credit-Ledger, Accounts, Bezahlung (braucht Supabase → eigenes ADR).
- Capacitor-Wrapping selbst (braucht Developer-Accounts → eigenes ADR).
- Das Mobbin-Redesign (eigener Schritt, siehe „Vorbereitung Mobbin").
- Auth/Rate-Limit für `/api/*` (bleibt offener Punkt aus `STAND.md`).

---

## 1 · Architektur

**React + Vite** als Single-Page-App unter `src/`. **`server.js` bleibt
unverändert das Backend** — es hält `FAL_KEY` und `DEEPSEEK_KEY` und ist die
einzige Stelle, die sie kennt. Das ist nicht verhandelbar und gilt auch nach
dem Capacitor-Wrapping: ein App-Bundle ist extrahierbar, Schlüssel dürfen nie
hinein.

```
Client (React SPA, später Capacitor-Bundle)
    │  fetch(API_BASE + "/api/…")     ← API_BASE aus Build-Konfiguration
    ▼
server.js (Bun)  ── FAL_KEY, DEEPSEEK_KEY ──▶  fal.ai / DeepSeek
```

- **Entwicklung:** `vite dev` auf Port 5173, Proxy für `/api` → `server.js`
  auf 8100. Zwei Prozesse, ein Befehl (`bun run dev` startet beide).
- **Produktion/Vorschau:** `vite build` erzeugt `dist/`, `server.js` liefert es
  über seine bestehende Freigabeliste aus. `PUBLIC_FILES`/`PUBLIC_DIRS` werden
  auf `dist/` umgestellt — die deny-by-default-Absicherung bleibt exakt so
  erhalten, `scripts/test-static.mjs` wird entsprechend angepasst.
- **Capacitor später:** wrappt `dist/`. Vorzubereiten ist nur zweierlei —
  `API_BASE` konfigurierbar (nicht hart `localhost`), und keine Annahme, dass
  Client und Server dieselbe Herkunft haben.

**Sprache:** Die Oberfläche wird beim Umbau auf **Deutsch** gezogen. Damit ist
der in `STAND.md` seit Wochen offene Sprachwiderspruch (AGENTS.md verlangt
Deutsch, UI war Englisch) miterledigt statt weitergeschleppt.

### Verzeichnisstruktur

```
src/
  main.jsx, App.jsx            Einstieg, Router, Tab-Shell
  screens/                     ein Verzeichnis pro Tab
    Home/ Journal/ Symbols/ Profile/
  wizard/                      der Traum-Flow, ein Modul pro Schritt
    WizardShell.jsx            Fortschritt, Zurück/Abbrechen, Schritt-State
    Step1Dream.jsx … Step6Result.jsx
  components/                  Button, Card, Tile, TabBar, CreditBadge, …
  lib/
    storage.js                 Speicherschicht (aus app.js übernommen)
    symbols.js                 Symbolerkennung (aus app.js übernommen)
    promptBuilder.js           Master-Prompt aus Bausteinen — KEIN LLM
    styles.js                  Style-Templates als Konstanten
    api.js                     die drei Server-Aufrufe
  styles/tokens.css            Design-Tokens (Farben, Typo, Abstände)
```

Regel aus `coding-style`: viele kleine Dateien. Jeder Wizard-Schritt ist eine
eigene Datei mit einer Aufgabe; `promptBuilder.js` ist reine Logik ohne
UI-Bezug und damit ohne Browser testbar.

---

## 2 · Screens und Navigation

**Splash-Screen** beim Start: Logo, ruhige Nacht-Animation, 1–2 Sekunden,
dann Home. Er ist nicht nur Deko — beim Capacitor-Build ist ein Splash
ohnehin Pflicht, und er überdeckt das Laden des `localStorage`.

**Tab-Bar unten, fünf Einträge:**

| Tab | Inhalt |
|---|---|
| Home | Begrüßung, Streak, letzter Traum, großer CTA |
| Tagebuch | bestehende Kartenansicht + Detail-Modal |
| **⊕** | öffnet den Wizard (kein Tab-Inhalt, nur Aktion) |
| Symbole | bestehende Symbolsammlung |
| Profil | Avatare, Orte, Lucid-Guide, Credits, Einstellungen |

Der zentrale Plus-Knopf ist das etablierte Mobile-Muster (Instagram, TikTok):
die Kernaktion ist von überall einen Tipp entfernt. Der Wizard öffnet sich als
**Vollbild-Flow über der Tab-Bar** — während man einen Traum erfasst, gibt es
keine Ablenkung, nur Zurück, Abbrechen und Fortschrittspunkte.

Bestehende Funktionen ziehen unverändert um: Menagerie und Streak nach Home,
Foto-Bibliothek (`fotos.html`) und Cast werden zu „Avatare" und „Orte" unter
Profil, `symbole.html` wird der Symbole-Tab.

---

## 3 · Der Wizard

Sechs Schritte. Jeder Schritt macht **eine** Sache und zeigt oben, wo man
steht.

### Schritt 1 — Traum erzählen

Textfeld plus Spracheingabe (wie heute). Darunter:

> **✨ AI verbessern** · 1 Credit

Der Aufruf geht an `/api/analyze` (siehe Abschnitt 4). Das Ergebnis erscheint
als **Vorschau**: links der Originaltext, rechts der verbesserte, darunter
„Übernehmen" oder „So lassen".

**Der Originaltext wird immer mitgespeichert** (`originalText` im
Journal-Eintrag), auch nach dem Übernehmen. Ein bezahltes Feature, das den
eigenen Traum unwiederbringlich überschreibt, zerstört Vertrauen — und der
Traumtext ist das persönlichste Datum in dieser App.

Was „verbessern" heißen darf, ist im System-Prompt eng gefasst: Rechtschreibung
und Grammatik korrigieren, bildhafter formulieren, Struktur klären. **Nicht**
erlaubt: Ereignisse erfinden, Personen hinzufügen, die Aussage ändern, den Ton
umdeuten. Wer „AI verbessern" überspringt, kommt trotzdem weiter — dann greift
die lokale Extraktion (Abschnitt 4).

### Schritt 2 — Was soll passieren?

Drei Karten, jede mit Preis:

| Karte | Preis |
|---|---|
| 💾 Nur speichern | kostenlos |
| 📸 Bilderstrecke erzeugen | 3 Credits |
| 🎬 Film — erzeugt zuerst die Bilder | 10 Credits (3 Bilder + 7 Film) |

Beim Film steht ausdrücklich „erzeugt zuerst die Bilder", weil genau das
technisch passiert: `minimax/h3` ist image-to-video und braucht ein Standbild.
Der Preis ist die Summe, nicht versteckt. „Nur speichern" beendet den Wizard
sofort und legt den Eintrag ins Tagebuch.

### Schritt 3 — Wer kommt vor?

Kacheln, eine pro erkannter Person aus der Analyse.

- **Automatische Zuordnung:** Trifft ein erkannter Name einen vorhandenen
  Avatar eindeutig (Groß-/Kleinschreibung egal, exakter Tag-Vergleich), ist
  die Kachel **vorausgewählt** und zeigt das Foto. „Anton" findet `@anton`,
  ohne dass jemand etwas tippt.
- **Mehrdeutig oder unbekannt:** die Kachel ist leer und bietet drei Wege:
  1. **Aus Avataren wählen** — Liste der gespeicherten Avatare.
  2. **Neuen Avatar anlegen** — Foto hochladen (kostenlos) *oder* beschreiben.
     Bei Beschreibung erzeugt Nano Banana ein **Character-Sheet** (neutrale
     Ansicht der Figur) für 2 Credits, das als Referenzbild am Avatar hängt
     und ab dann kostenlos wiederverwendbar ist.
  3. **KI entscheidet frei** — kein Referenzbild; der Prompt bekommt eine
     Klausel, dass die Figur frei erfunden werden darf.

Man kann Kacheln auch löschen (Person kommt doch nicht vor) und eigene
hinzufügen (Analyse hat jemanden übersehen).

### Schritt 4 — Wo spielt es?

Identische Mechanik für Orte. **Mehrere Orte sind ausdrücklich vorgesehen:**
„ich fliege von meinem Zimmer über das Meer" ergibt zwei Kacheln — die Analyse
liefert eine Liste, keinen einzelnen Wert. Die Reihenfolge der Kacheln ist die
Reihenfolge im Traum und bestimmt später die Reihenfolge der Bilder.

Orte brauchen kein neues Datenfeld: `state.cast` kennt bereits
`category: "place"`. Avatare und Orte sind dieselbe Struktur, nur gefiltert.

### Schritt 5 — Stimmung und Format

- **Style-Kacheln** — sechs feste Styles: *Traumhaft* · *Romantisch* ·
  *Düster* · *Surreal* · *Nostalgisch* · *Abenteuer*. Der aus der Analyse
  erkannte ist **vorausgewählt**; ein Tipp weiter, wenn es passt, umwählbar,
  wenn nicht. Das kostet nichts extra — die Erkennung fiel beim einen
  Analyse-Aufruf ab. Die sechs Namen sind zugleich die erlaubten Werte des
  `style`-Feldes aus `/api/analyze`; alles andere fällt auf *Traumhaft*
  zurück.
- **Format-Umschalter** 9:16 / 16:9, **9:16 ist Standard**. Die App lebt auf
  dem Telefon.
- Darunter die Zusammenfassung: wie viele Bilder, welche Referenzen, welcher
  Preis — dann **Erzeugen**.

### Schritt 6 — Ergebnis

Bilder zum Durchwischen, „Ins Tagebuch speichern", optional „Film daraus
machen" (nutzt das erste Bild als Ausgangsbild, ohne neu zu generieren).

---

## 4 · Prompt-Baukasten und Token-Sparsamkeit

Das Leitprinzip: **ein einziger LLM-Aufruf pro Traum.** Alles danach ist
lokale Logik.

### Der eine Aufruf: `POST /api/analyze`

Löst „AI verbessern" aus und liefert alles auf einmal:

```json
{
  "text": "…verbesserter Traumtext…",
  "personen": ["Anton", "eine fremde Frau"],
  "orte": ["mein Schlafzimmer", "über dem Meer"],
  "style": "traumhaft",
  "stimmung": "friedlich"
}
```

Der Server verlangt JSON-Ausgabe, validiert die Struktur streng und wirft
alles weg, was nicht passt. Ein zweiter LLM-Aufruf, um „den Style zu
bestimmen" oder „die Personen zu finden", findet **nicht** statt — das wäre
dreimal bezahlt für Information, die im selben Text steht.

### Der Master-Prompt: `lib/promptBuilder.js`, ohne LLM

Wird aus vier Bausteinen zusammengesetzt:

1. **Szenentext** — der (verbesserte) Traumtext.
2. **Referenzklauseln** — pro zugeordnetem Avatar/Ort eine Bindung, wie sie
   `buildFallbackPrompt()` heute schon erzeugt: *„Reference image 2 shows
   @anton — depict him with this exact likeness."* Die Nummer muss zur
   Position im `image_urls`-Array stimmen; das ist die fehleranfälligste
   Stelle im ganzen System und bekommt deshalb eigene Tests.
3. **Style-Template** — eine Konstante pro Style in `lib/styles.js`, die die
   Nano-Banana-6-Elemente-Formel für Art Style, Lighting und Details
   ausformuliert (*düster* → kalte Farben, harte Schatten, hoher Kontrast).
   Fest verdrahtet, kein LLM.
4. **Formatparameter** — 9:16 oder 16:9. Heute steht „9:16 vertical" hart im
   System-Prompt; das wird zum Parameter.

### Ohne „AI verbessern"

Der Wizard funktioniert vollständig weiter: Die lokale Extraktion gleicht den
Text gegen vorhandene Avatar-Tags ab (die heutige `mentionsTag()`-Logik, aber
nur noch als **Vorschlag**, nicht als Filter), Style bleibt auf „Traumhaft",
Orte bleiben leer und werden von Hand gewählt. Kein bezahltes Feature ist
Voraussetzung für ein anderes.

### Sicherheit

Die Analyse-Antwort ist Fremdtext, der zum Prompt für einen weiteren
bezahlten Dienst wird — sie bekommt dieselbe Behandlung wie Nutzereingaben:
`sanitizePromptText()` auf den Text, `sanitizeTag()` auf jeden erkannten
Namen, harte Längen- und Anzahlgrenzen auf die Listen. Das ist die bestehende
Regel aus `server.js`, hier nur konsequent auf ein neues Feld angewandt.

---

## 5 · Datenmodell

**Der Schlüssel `dreamrushes_v1` bleibt.** Alle Ergänzungen sind optionale
Felder mit Vorgabewert — bestehende Tagebücher laden unverändert weiter. Ein
Schema-Bruch wäre hier Datenverlust bei echten Nutzern.

| Feld | Änderung |
|---|---|
| `cast[]` | neu optional: `sheet` (Character-Sheet-URL). `category` deckt Personen, Tiere und Orte bereits ab. |
| `credits` | neu, Vorgabe `0` |
| `journal[]` | neu optional: `originalText`, `improvedText`, `style`, `format`, `cost` |

`load()` in `lib/storage.js` behält die vorhandene Migrationslogik und
ergänzt die neuen Felder nach demselben Muster.

---

## 6 · Credits (Platzhalter)

Ein Zähler in `localStorage`, sichtbar im Profil und **an jedem
kostenpflichtigen Knopf**. Kein Aufladen, kein echtes Geld — bei zu wenig
Guthaben erscheint „Guthaben aufladen (bald verfügbar)".

Alle Preise stehen an **einer** Stelle, `lib/pricing.js`, und sind für den
Anfang gesetzt (frei änderbar, sobald echte API-Kosten bekannt sind):

| Aktion | Credits |
|---|---|
| AI verbessern | 1 |
| Character-Sheet erzeugen | 2 |
| Bilderstrecke | 3 |
| Film (inkl. Bilder) | 10 |

Das ist bewusst eine Attrappe. Der Zweck ist, den Ablauf jetzt ehrlich
aussehen zu lassen und alle Preisstellen im Code an einer Konstante zu haben. Wenn Supabase kommt, wird der lokale Zähler durch
echte Serverabfragen ersetzt — die UI muss sich dann nicht mehr ändern.

⚠️ Ausdrücklich festgehalten: `localStorage` ist vom Nutzer frei editierbar.
Solange die Credits dort liegen, sind sie **keine** Zugangskontrolle, sondern
Anzeige. Echte Durchsetzung passiert serverseitig, sobald es Accounts gibt.

---

## 7 · Vorbereitung Mobbin

Damit das spätere Redesign kein zweiter Umbau wird:

- **Alle** Farben, Schriftgrößen, Abstände und Radien als CSS-Variablen in
  `styles/tokens.css`. Kein Hex-Wert direkt in einer Komponente.
- Jedes UI-Element als eigene Komponente (`Button`, `Card`, `Tile`, `TabBar`,
  `CreditBadge`, `StepHeader`). Ein Mobbin-Screen wird dann nachgebaut, indem
  Tokens und Komponenten getauscht werden — Screens, Flow und Logik bleiben
  unberührt.
- Layout- und Logikcode getrennt halten: `promptBuilder.js`, `styles.js` und
  `storage.js` enthalten keine Darstellung und überleben jedes Redesign.

---

## 8 · Bauphasen

**Phase 1 — Gerüst.** Vite+React aufsetzen, Tab-Navigation, Splash, Tokens,
Basiskomponenten. Tagebuch, Symbole und Foto-Bibliothek 1:1 portieren,
Oberfläche auf Deutsch. `server.js` liefert `dist/`, `scripts/test-static.mjs`
entsprechend umstellen. Danach ist die App funktional wie heute, aber in der
neuen Struktur.

**Phase 2 — Wizard.** Die sechs Schritte, `/api/analyze`, `promptBuilder.js`,
Style-Templates, Credit-Anzeige. Danach läuft der neue Flow end-to-end.

**Phase 3 — Ausbau.** Character-Sheets über Nano, Mehrfach-Orte verfeinern,
Ergebnis-Screen mit Film-Anschluss.

**Phase 4 — Capacitor.** Eigenes ADR, sobald Developer-Accounts vorliegen.

Jede Phase ist ein eigener PR mit eigenem Plan. Diese Spec beschreibt das
Ziel; der Plan für Phase 1 entsteht als Nächstes.

## 9 · Tests

Heute testet nur `scripts/test-static.mjs` (Dateifreigabe) und
`scripts/test-prompt-sanitize.mjs` (Prompt-Hygiene) — beide den Server. Der
Umbau ist der Anlass, das zu ändern:

- **`promptBuilder.js`** bekommt echte Unit-Tests. Der kritische Fall: Stimmen
  Referenznummern im Prompt mit den Positionen im Bild-Array überein, auch
  wenn eine Person auf „KI entscheidet frei" steht und damit **kein** Bild
  beisteuert? Genau hier entstehen falsche Gesichter.
- **`/api/analyze`** wird gegen fehlerhafte LLM-Antworten getestet: kein JSON,
  zu viele Personen, Tags mit Sonderzeichen, leerer Text. Ohne echten
  Netzaufruf, mit festen Antwort-Attrappen.
- `scripts/test-static.mjs` wird auf `dist/` umgestellt und muss weiterhin
  beweisen, dass `.env` nicht ausgeliefert wird.
