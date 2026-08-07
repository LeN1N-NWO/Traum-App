# Phase 1 — Gerüst: Vite + React, Tabs, Screens

> **Für agentische Bearbeiter:** ERFORDERLICHE SUB-SKILL:
> `superpowers:subagent-driven-development` (empfohlen) oder
> `superpowers:executing-plans`, um diesen Plan Aufgabe für Aufgabe
> umzusetzen. Schritte nutzen Checkbox-Syntax (`- [ ]`) zum Mitführen.

**Ziel:** Die App läuft als React-SPA mit Tab-Navigation, Splash und allen
heutigen Funktionen — funktional gleichwertig zu heute, aber in der Struktur,
auf der Phase 2 (der Wizard) aufbaut.

**Architektur:** Vite baut eine statische SPA nach `dist/`. `server.js` bleibt
unverändert der schlüsselhaltende Proxy und liefert künftig `dist/` statt
einzelner HTML-Dateien aus. Reine Logik (Speicher, Symbole, Tags) wandert in
`src/lib/` und wird erstmals ohne Browser getestet.

**Tech-Stack:** Bun (Laufzeit + Testrunner), Vite, React 18, react-router-dom
(HashRouter). Keine UI-Bibliothek, keine CSS-Bibliothek, kein Test-Framework
als Abhängigkeit — `bun test` genügt.

**Grundlage:** `docs/specs/2026-08-07-app-umbau-design.md`, `ADR-0004`.

## Globale Vorgaben

- **Oberflächensprache ist Deutsch.** Alle sichtbaren Texte, auch portierte.
  Bezeichner im Code bleiben englisch, wo sie es heute sind.
- **`server.js` ist die einzige Stelle mit API-Schlüsseln.** Kein Schlüssel,
  kein `process.env`-Zugriff im Client. Der Client kennt nur `API_BASE`.
- **`HashRouter`, nicht `BrowserRouter`.** Capacitor lädt die App über
  `file://`; die History-API funktioniert dort nicht zuverlässig.
- **Speicherschlüssel bleibt `dreamrushes_v1`.** Alle neuen Felder sind
  optional mit Vorgabewert. Ein Schema-Bruch wäre Datenverlust bei echten
  Nutzern.
- **`scripts/test-static.mjs` muss nach jeder Aufgabe grün sein.** Diese
  Prüfung schützt `.env` — sie ist nicht verhandelbar.
- **Zwischenstand:** Von Aufgabe 1 bis 11 ist die neue App unvollständig. Das
  ist beabsichtigt. Der alte Stand liegt in `legacy/` und in der Git-Historie;
  gelöscht wird er erst in Aufgabe 12.
- Committen nach jeder Aufgabe, Conventional Commits auf Deutsch.

---

### Aufgabe 1: Vite + React aufsetzen

**Dateien:**
- Ändern: `package.json`
- Erstellen: `vite.config.js`, `index.html` (neu, Vite-Einstieg)
- Erstellen: `src/main.jsx`, `src/App.jsx`
- Erstellen: `scripts/dev.mjs`
- Verschieben: `index.html` → `legacy/index.html`, `symbole.html` →
  `legacy/symbole.html`, `fotos.html` → `legacy/fotos.html`,
  `app.js` → `legacy/app.js`, `app.css` → `legacy/app.css`
- Verschieben: `clips/` → `public/clips/`

**Schnittstellen:**
- Liefert: ein lauffähiges `bun run build` → `dist/`, und `bun run dev` mit
  Vite auf 5173 + `server.js` auf 8100.

- [ ] **Schritt 1: Altbestand nach `legacy/` verschieben**

Vite braucht `index.html` im Wurzelverzeichnis als Einstiegspunkt — der Name
ist belegt. `clips/` zieht nach `public/`, damit Vite es in `dist/` kopiert.

```bash
mkdir -p legacy
git mv index.html legacy/index.html
git mv symbole.html legacy/symbole.html
git mv fotos.html legacy/fotos.html
git mv app.js legacy/app.js
git mv app.css legacy/app.css
mkdir -p public
git mv clips public/clips
```

- [ ] **Schritt 2: Abhängigkeiten eintragen**

`package.json` — `scripts` und `dependencies` ersetzen:

```json
{
  "name": "dream-rushes",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "bun scripts/dev.mjs",
    "dev:api": "bun server.js",
    "dev:web": "vite",
    "build": "vite build",
    "start": "bun run build && bun server.js",
    "test": "bun test && node scripts/test-static.mjs && node scripts/test-prompt-sanitize.mjs"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.26.2"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.1",
    "vite": "^5.4.0"
  }
}
```

Dann installieren:

```bash
bun install
```

- [ ] **Schritt 3: `vite.config.js` anlegen**

```js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Der Dev-Server liefert nur die Oberflaeche. Alles unter /api geht an
// server.js — dort und nur dort liegen FAL_KEY und DEEPSEEK_KEY.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { "/api": "http://127.0.0.1:8100" },
  },
  build: { outDir: "dist", emptyOutDir: true },
});
```

- [ ] **Schritt 4: Vite-Einstieg anlegen**

`index.html` (neu, im Wurzelverzeichnis):

```html
<!doctype html>
<html lang="de">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <meta name="theme-color" content="#0b0718" />
    <title>Dream Rushes</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

`src/main.jsx`:

```jsx
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

`src/App.jsx` (vorläufig, wird in Aufgabe 6 ersetzt):

```jsx
export default function App() {
  return <h1>Dream Rushes</h1>;
}
```

- [ ] **Schritt 5: Startskript für beide Prozesse**

`scripts/dev.mjs` — startet API und Oberfläche zusammen, ohne zusätzliche
Abhängigkeit und ohne Shell-Syntax, die unter Windows scheitert:

```js
#!/usr/bin/env bun
// Startet server.js (API, Port 8100) und Vite (Oberflaeche, Port 5173).
// Bewusst ohne "concurrently": eine Abhaengigkeit weniger, und `&` als
// Trenner funktioniert in PowerShell nicht.
import { spawn } from "node:child_process";

const procs = [
  spawn("bun", ["server.js"], { stdio: "inherit", shell: true }),
  spawn("bunx", ["vite"], { stdio: "inherit", shell: true }),
];

function shutdown() {
  for (const p of procs) p.kill();
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
for (const p of procs) p.on("exit", shutdown);
```

- [ ] **Schritt 6: Bauen und prüfen**

```bash
bun run build
```

Erwartet: `dist/index.html`, `dist/assets/*.js`, `dist/clips/` existieren.

```bash
ls dist dist/assets dist/clips
```

- [ ] **Schritt 7: Committen**

```bash
git add -A
git commit -m "chore: Vite und React aufsetzen, Altbestand nach legacy/"
```

---

### Aufgabe 2: `server.js` liefert `dist/` aus

**Dateien:**
- Ändern: `server.js:34` (ROOT), `server.js:256-281` (Freigabeliste)
- Ändern: `scripts/test-static.mjs:35`, `:40-51`

**Schnittstellen:**
- Nutzt: `dist/` aus Aufgabe 1.
- Liefert: `resolveStatic()` mit `dist/` als Web-Wurzel.

Das ist zugleich eine Verbesserung der Absicherung: Liegt die Web-Wurzel in
`dist/`, sind `.env`, `.git/`, `docs/` und `server.js` **strukturell** außer
Reichweite, nicht nur durch die Freigabeliste. Zwei unabhängige Schranken
statt einer.

- [ ] **Schritt 1: Test zuerst anpassen — er muss fehlschlagen**

In `scripts/test-static.mjs` Zeile 35 und die beiden Listen ersetzen:

```js
const ROOT_ABS = join(REPO, "dist");

// Was die App zum Laufen braucht — und sonst nichts.
// Die Asset-Namen tragen einen Build-Hash; geprueft wird die REGEL
// (/assets/ ist frei), nicht eine konkrete Datei. resolveStatic() prueft
// ohnehin keine Existenz.
const MUST_SERVE = ["/", "/index.html", "/assets/index-abc123.js",
                    "/assets/index-abc123.css", "/clips/dream.mp4",
                    "/clips/frame.png"];

const MUST_BLOCK = [
  "/.env", "/.env.example", "/.git/config", "/.gitignore", "/.claude/settings.local.json",
  "/package.json", "/server.js", "/scripts/checkpoint.js", "/scripts/shared-files.json",
  "/docs/STAND.md", "/AGENTS.md", "/README.md", "/CLAUDE.md",
  "/src/main.jsx", "/legacy/index.html", "/vite.config.js",
  "/../../etc/passwd", "/..%2f..%2fetc/passwd", "/%2e%2e/%2e%2e/etc/passwd",
  "/clips/../.env", "/clips/..%2f.env", "/clips/../../../etc/passwd",
  "/%00", "/foo", "/%ZZ", "/index.html.bak", "/INDEX.HTML",
];
```

- [ ] **Schritt 2: Test laufen lassen, Fehlschlag bestätigen**

```bash
node scripts/test-static.mjs
```

Erwartet: FEHLSCHLÄGE bei `/assets/index-abc123.js` (noch nicht freigegeben)
und bei `/symbole.html`-Resten. Läuft er grün durch, wurde Schritt 1 nicht
gespeichert.

- [ ] **Schritt 3: `server.js` umstellen**

Zeile 34 ersetzen:

```js
// Web-Wurzel ist der Build, nicht das Repo. Damit liegen .env, .git/, docs/
// und der Servercode selbst ausserhalb dessen, was ueberhaupt aufloesbar ist.
const ROOT = resolve(import.meta.dir, "dist");
```

Und den Freigabeblock (`PUBLIC_FILES`/`PUBLIC_DIRS`):

```js
// Deny by default. Der Build erzeugt genau eine Seite plus gehashte Assets;
// clips/ kommt aus public/. Ein neues oeffentliches Asset ist eine bewusste
// Aenderung hier.
const PUBLIC_FILES = new Set(["/index.html"]);
const PUBLIC_DIRS = ["/assets/", "/clips/"];
```

- [ ] **Schritt 4: Testlauf, jetzt grün**

```bash
bun run build && node scripts/test-static.mjs
```

Erwartet: `✓ alle N Prüfungen bestanden`.

- [ ] **Schritt 5: Echter Abruf zur Gegenprobe**

```bash
bun server.js &
sleep 2
curl -s -o /dev/null -w "index: %{http_code}\n" http://localhost:8100/
curl -s -o /dev/null -w "env:   %{http_code}\n" http://localhost:8100/.env
curl -s -o /dev/null -w "src:   %{http_code}\n" http://localhost:8100/src/main.jsx
kill %1
```

Erwartet: `index: 200`, `env: 404`, `src: 404`.

- [ ] **Schritt 6: Committen**

```bash
git add server.js scripts/test-static.mjs
git commit -m "feat: server.js liefert dist/ aus, Web-Wurzel ausserhalb des Repos"
```

---

### Aufgabe 3: Design-Tokens

**Dateien:**
- Erstellen: `src/styles/tokens.css`, `src/styles/base.css`
- Ändern: `src/main.jsx`

**Schnittstellen:**
- Liefert: alle CSS-Variablen, die alle folgenden Komponenten nutzen. **Kein
  Farbwert steht ab hier direkt in einer Komponente** — das ist die
  Voraussetzung für das spätere Mobbin-Redesign.

- [ ] **Schritt 1: Tokens übernehmen**

`src/styles/tokens.css` — wörtlich aus `legacy/app.css:5-22`, damit die Optik
identisch bleibt:

```css
:root {
  --bg:#0b0718; --bg2:#150f30; --sky:#2a1d5e;
  --panel:rgba(255,255,255,.05); --panel-line:rgba(255,255,255,.11);
  --text:#f4f1ff; --muted:#a9a2cd; --faint:#8d85b4;
  --violet:#8b5cf6; --violet-soft:#a78bfa; --violet-deep:#6d3fe0;
  --pink:#ec4899; --cyan:#22d3ee; --gold:#fbbf24; --ok:#34d399;
  --radius:20px; --radius-lg:26px;
  --t-hero:clamp(30px,7vw,48px); --t-h2:22px; --t-h3:16px;
  --t-body:15px; --t-small:13px; --t-micro:11px;
  --sans:-apple-system,BlinkMacSystemFont,"Segoe UI",Inter,system-ui,sans-serif;

  /* Neu: Abstaende als Skala statt Einzelwerte, und die Hoehe der Tab-Leiste
     als Variable — Screens brauchen sie fuer ihren unteren Innenabstand. */
  --s-1:4px; --s-2:8px; --s-3:12px; --s-4:16px; --s-5:22px; --s-6:32px;
  --tabbar-h:64px;
}
```

⚠️ `--faint` auf `--sky` ist der Härtefall für WCAG AA (4,79:1). Wer diese
Werte ändert, prüft diese Paarung erneut — `docs/STAND.md` führt das als
verbindliche Grenze.

- [ ] **Schritt 2: Grundlayout übernehmen**

`src/styles/base.css` — aus `legacy/app.css:23-36`, ergänzt um Sicherheits-
abstände für die Geräte-Notch (relevant für iOS):

```css
* { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
html, body { margin: 0; padding: 0; }
body {
  background: radial-gradient(125% 85% at 50% -12%, var(--sky) 0%, var(--bg2) 42%, var(--bg) 100%);
  background-attachment: fixed;
  color: var(--text);
  font-family: var(--sans);
  line-height: 1.6;
  min-height: 100vh;
  overflow-x: hidden;
}
#root { min-height: 100vh; }
.screen {
  max-width: 680px;
  margin: 0 auto;
  padding: calc(env(safe-area-inset-top) + var(--s-5)) var(--s-4)
           calc(var(--tabbar-h) + env(safe-area-inset-bottom) + var(--s-6));
}
```

- [ ] **Schritt 3: Einbinden**

In `src/main.jsx` vor dem `App`-Import ergänzen:

```jsx
import "./styles/tokens.css";
import "./styles/base.css";
```

- [ ] **Schritt 4: Sichtprüfung**

```bash
bun run build
```

Erwartet: Build ohne Fehler, `dist/assets/*.css` enthält `--violet`.

```bash
grep -c "violet" dist/assets/*.css
```

- [ ] **Schritt 5: Committen**

```bash
git add src/styles src/main.jsx
git commit -m "feat: Design-Tokens und Grundlayout als eigene Dateien"
```

---

### Aufgabe 4: Speicherschicht mit Tests

**Dateien:**
- Erstellen: `src/lib/storage.js`
- Test: `src/lib/storage.test.js`

**Schnittstellen:**
- Liefert:
  - `DB_KEY: string` — `"dreamrushes_v1"`
  - `DEFAULT_STATE: object`
  - `genId(prefix: string): string`
  - `loadState(backend?): object` — `backend` vorgabeweise `localStorage`
  - `saveState(state, backend?): boolean` — `false` bei vollem Speicher

Der einspeisbare `backend` ist der Grund, warum diese Schicht überhaupt
testbar ist: die Tests reichen eine `Map`-Attrappe herein und brauchen weder
Browser noch DOM-Bibliothek.

- [ ] **Schritt 1: Fehlschlagenden Test schreiben**

`src/lib/storage.test.js`:

```js
import { test, expect } from "bun:test";
import { DEFAULT_STATE, genId, loadState, saveState } from "./storage.js";

/** Minimale localStorage-Attrappe. */
function fakeBackend(initial = null) {
  const map = new Map();
  if (initial !== null) map.set("dreamrushes_v1", initial);
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, v),
  };
}

test("leerer Speicher liefert die Vorgabewerte", () => {
  const s = loadState(fakeBackend());
  expect(s.journal).toEqual([]);
  expect(s.cast).toEqual([]);
  expect(s.credits).toBe(0);
});

test("kaputtes JSON wirft nicht, sondern faellt auf Vorgaben zurueck", () => {
  const s = loadState(fakeBackend("{nicht json"));
  expect(s.journal).toEqual([]);
});

test("alte cast-Eintraege bekommen id und category nachgeruestet", () => {
  const alt = JSON.stringify({ cast: [{ tag: "anna", img: "x" }] });
  const s = loadState(fakeBackend(alt));
  expect(s.cast[0].category).toBe("person");
  expect(s.cast[0].id).toBeTruthy();
  expect(s.cast[0].tag).toBe("anna");
});

test("gespeicherter Zustand ueberlebt eine Runde", () => {
  const backend = fakeBackend();
  saveState({ ...DEFAULT_STATE, streak: 7 }, backend);
  expect(loadState(backend).streak).toBe(7);
});

test("voller Speicher meldet false statt zu werfen", () => {
  const voll = {
    getItem: () => null,
    setItem: () => { throw new Error("QuotaExceededError"); },
  };
  expect(saveState(DEFAULT_STATE, voll)).toBe(false);
});

test("genId erzeugt eindeutige Werte mit Praefix", () => {
  const a = genId("c"), b = genId("c");
  expect(a.startsWith("c_")).toBe(true);
  expect(a).not.toBe(b);
});
```

- [ ] **Schritt 2: Test laufen lassen, Fehlschlag bestätigen**

```bash
bun test src/lib/storage.test.js
```

Erwartet: FEHLSCHLAG, „Cannot find module './storage.js'".

- [ ] **Schritt 3: Umsetzen**

`src/lib/storage.js` — portiert aus `legacy/app.js:15-46`, mit einspeisbarem
Speicher und den neuen Feldern aus der Spec:

```js
/* Speicherschicht. Bewusst ohne React und ohne DOM: dadurch pruefbar.
 *
 * Der Schluessel bleibt dreamrushes_v1. Alle Ergaenzungen sind optionale
 * Felder mit Vorgabewert — ein Schema-Bruch waere Datenverlust in echten
 * Traumtagebuechern.
 */
export const DB_KEY = "dreamrushes_v1";

export const DEFAULT_STATE = {
  creatures: [], lastDream: null, streak: 0,
  mode: "sequence", cons: "standard",
  me: null, cast: [], journal: [], events: [],
  credits: 0,   // Platzhalter, siehe Spec Abschnitt 6
};

export function genId(prefix) {
  return prefix + "_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function defaultBackend() {
  return typeof localStorage === "undefined" ? null : localStorage;
}

export function loadState(backend = defaultBackend()) {
  if (!backend) return structuredClone(DEFAULT_STATE);
  try {
    const roh = JSON.parse(backend.getItem(DB_KEY)) || {};
    const s = { ...DEFAULT_STATE, ...roh };
    // Zuerst spreizen, damit ein gespeichertes null die Vorgabe nicht
    // wieder herausschlaegt.
    s.cast = (s.cast || []).map((p) => ({
      ...p, id: p.id || genId("c"), category: p.category || "person",
    }));
    if (!Array.isArray(s.journal)) s.journal = [];
    if (!Array.isArray(s.events)) s.events = [];
    if (typeof s.credits !== "number") s.credits = 0;
    return s;
  } catch {
    return structuredClone(DEFAULT_STATE);
  }
}

// Referenzfotos liegen als base64 im Speicher, das ~5-MB-Kontingent ist
// erreichbar. Ein Wurf hier hat frueher den Knopf dauerhaft gesperrt —
// deshalb: laut scheitern, aber bedienbar bleiben.
export function saveState(state, backend = defaultBackend()) {
  if (!backend) return false;
  try {
    backend.setItem(DB_KEY, JSON.stringify(state));
    return true;
  } catch (err) {
    console.warn("[DreamRushes] Speichern fehlgeschlagen:", err);
    return false;
  }
}
```

- [ ] **Schritt 4: Test laufen lassen, jetzt grün**

```bash
bun test src/lib/storage.test.js
```

Erwartet: 6 Tests bestanden.

- [ ] **Schritt 5: Committen**

```bash
git add src/lib/storage.js src/lib/storage.test.js
git commit -m "feat: Speicherschicht als pruefbares Modul, erste Unit-Tests"
```

---

### Aufgabe 5: Symbolerkennung und Tag-Erkennung mit Tests

**Dateien:**
- Erstellen: `src/lib/symbols.js`, `src/lib/tags.js`
- Test: `src/lib/symbols.test.js`, `src/lib/tags.test.js`

**Schnittstellen:**
- `symbols.js` liefert: `SYMBOL_CATEGORIES`, `SYMBOLS`,
  `detectSymbols(text): string[]`, `symbolOccurrences(journal): Map`,
  `symbolById(id): object|null`, `dreamsDuringEvent(journal, event): array`
- `tags.js` liefert: `mentionsTag(text, tag): boolean`,
  `findTagSpans(text, tags): {start,end,tag}[]`,
  `taggedPhotosIn(state, text): array` — **nimmt `state` als Parameter**,
  anders als heute, wo es eine globale Variable liest.

- [ ] **Schritt 1: Fehlschlagende Tests schreiben**

`src/lib/symbols.test.js`:

```js
import { test, expect } from "bun:test";
import { detectSymbols, symbolById, symbolOccurrences, dreamsDuringEvent } from "./symbols.js";

test("erkennt Symbole an Wortgrenzen", () => {
  expect(detectSymbols("I was flying over the sea")).toContain("flying");
  expect(detectSymbols("I was flying over the sea")).toContain("water");
});

test("schlaegt nicht innerhalb laengerer Woerter an", () => {
  expect(detectSymbols("the season was over")).not.toContain("water");
  expect(detectSymbols("I read the catalogue")).not.toContain("animal");
});

test("typografische Apostrophe zaehlen wie gerade", () => {
  expect(detectSymbols("I can’t find the way")).toContain("lost");
});

test("leerer Text liefert keine Symbole", () => {
  expect(detectSymbols("")).toEqual([]);
  expect(detectSymbols(null)).toEqual([]);
});

test("symbolById findet und liefert sonst null", () => {
  expect(symbolById("water").label).toBe("Water");
  expect(symbolById("gibtsnicht")).toBe(null);
});

test("Vorkommen werden neueste zuerst sortiert", () => {
  const journal = [
    { id: "a", createdAt: "2026-01-01T00:00:00Z", title: "alt", text: "water" },
    { id: "b", createdAt: "2026-06-01T00:00:00Z", title: "neu", text: "water" },
  ];
  expect(symbolOccurrences(journal).get("water").map((o) => o.entryId)).toEqual(["b", "a"]);
});

test("Ereigniszeitraum nutzt Ortszeit-Tagesgrenzen", () => {
  // Ein um 00:30 Ortszeit notierter Traum muss in seinen eigenen Tag fallen.
  const mitternachts = new Date(2026, 7, 1, 0, 30).toISOString();
  const journal = [{ id: "a", createdAt: mitternachts, title: "t", text: "x" }];
  const treffer = dreamsDuringEvent(journal, { startsAt: "2026-08-01", endsAt: "2026-08-01" });
  expect(treffer).toHaveLength(1);
});
```

`src/lib/tags.test.js`:

```js
import { test, expect } from "bun:test";
import { mentionsTag, findTagSpans, taggedPhotosIn } from "./tags.js";

test("mentionsTag achtet auf Wortgrenzen", () => {
  expect(mentionsTag("anna was there", "anna")).toBe(true);
  expect(mentionsTag("the annals of history", "anna")).toBe(false);
  expect(mentionsTag("I sat the exam", "ex")).toBe(false);
});

test("mentionsTag ohne Tag ist false", () => {
  expect(mentionsTag("beliebig", "")).toBe(false);
  expect(mentionsTag("beliebig", null)).toBe(false);
});

test("findTagSpans liefert Positionen und verwirft Ueberschneidungen", () => {
  const spans = findTagSpans("anna and anna", ["anna"]);
  expect(spans).toHaveLength(2);
  expect(spans[0].start).toBe(0);
  expect(spans[1].start).toBe(9);
});

test("taggedPhotosIn nimmt den Zustand als Parameter", () => {
  const state = {
    me: { img: "ich.png" },
    cast: [
      { tag: "anna", category: "person", img: "a.png" },
      { tag: "rex", category: "pet", img: "r.png" },
    ],
  };
  const treffer = taggedPhotosIn(state, "me and anna went walking");
  expect(treffer.map((t) => t.tag).sort()).toEqual(["anna", "me"]);
});

test("taggedPhotosIn ueberspringt Eintraege ohne Bild", () => {
  const state = { me: null, cast: [{ tag: "anna", category: "person", img: "" }] };
  expect(taggedPhotosIn(state, "anna")).toEqual([]);
});
```

- [ ] **Schritt 2: Tests laufen lassen, Fehlschlag bestätigen**

```bash
bun test src/lib/symbols.test.js src/lib/tags.test.js
```

Erwartet: FEHLSCHLAG, Module nicht gefunden.

- [ ] **Schritt 3: Umsetzen**

`src/lib/symbols.js`: den Block `legacy/app.js:67-211` unverändert
übernehmen (`SYMBOL_CATEGORIES`, `SYMBOLS`, `SYMBOL_RE`, `detectSymbols`,
`symbolOccurrences`, `symbolById`, `localDayStart`, `localDayEnd`,
`dreamsDuringEvent`) und die öffentlichen Namen mit `export` versehen.
`SYMBOL_RE`, `localDayStart` und `localDayEnd` bleiben modulintern.

Inhaltlich nichts ändern — die Stichwortlisten, die Wortgrenzen-Regex und die
Ortszeit-Tagesgrenzen sind hart erarbeitete Korrekturen. Nur die
Kategorie-Beschriftungen werden eingedeutscht:

```js
export const SYMBOL_CATEGORIES = {
  place:    { label: "Orte",       emoji: "🏞" },
  scenario: { label: "Szenen",     emoji: "🎬" },
  creature: { label: "Wesen",      emoji: "🐾" },
  person:   { label: "Menschen",   emoji: "🧑" },
  emotion:  { label: "Gefühle",    emoji: "💗" },
};
```

⚠️ Die `keywords` bleiben **englisch**. Das ist eine bewusste Entscheidung aus
`docs/STAND.md`; deutsche Begriffe zu ergänzen ist ein eigener Vorgang, nicht
Teil dieser Aufgabe.

`src/lib/tags.js`: `mentionsTag` und `findTagSpans` aus `legacy/app.js:226-260`
unverändert übernehmen und exportieren. `taggedPhotosIn` bekommt `state` als
ersten Parameter:

```js
/** Alle Bibliothek-Eintraege, die der Text namentlich nennt (inkl. @me).
 *  Nimmt den Zustand als Parameter — frueher las es eine globale Variable,
 *  was in React weder pruefbar noch nachvollziehbar waere. */
export function taggedPhotosIn(state, text) {
  const out = [];
  if (state?.me?.img && mentionsTag(text, "me")) {
    out.push({ tag: "me", category: "person", img: state.me.img });
  }
  for (const p of state?.cast || []) {
    if (p.img && mentionsTag(text, p.tag)) out.push(p);
  }
  return out;
}
```

- [ ] **Schritt 4: Tests laufen lassen, jetzt grün**

```bash
bun test
```

Erwartet: alle Tests aus Aufgabe 4 und 5 bestanden.

- [ ] **Schritt 5: Committen**

```bash
git add src/lib
git commit -m "feat: Symbol- und Tag-Erkennung als pruefbare Module"
```

---

### Aufgabe 6: App-Shell — Router, Tab-Leiste, Splash

**Dateien:**
- Ändern: `src/App.jsx`
- Erstellen: `src/state/AppState.jsx`
- Erstellen: `src/components/TabBar.jsx`, `src/components/TabBar.css`
- Erstellen: `src/components/Splash.jsx`, `src/components/Splash.css`
- Erstellen: `src/components/Toast.jsx`, `src/components/Toast.css`

**Schnittstellen:**
- Nutzt: `loadState`, `saveState` (Aufgabe 4).
- Liefert:
  - `useAppState()` → `{ state, setState, update(teil), toast(text) }`
    - `update(teil)` mischt ein Teilobjekt in den Zustand und speichert
      sofort — **unveränderlich**, nie am Bestand mutieren.
  - Routen: `/` (Home), `/tagebuch`, `/symbole`, `/profil`, `/traum` (Erfassen)

- [ ] **Schritt 1: Zustandsschicht anlegen**

`src/state/AppState.jsx`:

```jsx
import { createContext, useContext, useState, useCallback } from "react";
import { loadState, saveState } from "../lib/storage.js";

const Ctx = createContext(null);

export function AppStateProvider({ children }) {
  const [state, setState] = useState(loadState);
  const [toastText, setToastText] = useState("");

  const toast = useCallback((text) => {
    setToastText(text);
    setTimeout(() => setToastText(""), 2600);
  }, []);

  // Immer eine neue Struktur erzeugen, nie den Bestand veraendern —
  // sonst rendert React nicht neu und Fehler werden unauffindbar.
  const update = useCallback((teil) => {
    setState((alt) => {
      const neu = { ...alt, ...teil };
      if (!saveState(neu)) toast("⚠ Speicher voll — alte Einträge oder Fotos löschen.");
      return neu;
    });
  }, [toast]);

  return (
    <Ctx.Provider value={{ state, setState, update, toast, toastText }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAppState() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAppState ausserhalb von AppStateProvider benutzt");
  return v;
}
```

- [ ] **Schritt 2: Tab-Leiste bauen**

`src/components/TabBar.jsx`:

```jsx
import { NavLink, useNavigate } from "react-router-dom";
import "./TabBar.css";

const TABS = [
  { to: "/",         label: "Start",    icon: "🌙" },
  { to: "/tagebuch", label: "Tagebuch", icon: "📖" },
  { to: "/symbole",  label: "Symbole",  icon: "✧" },
  { to: "/profil",   label: "Profil",   icon: "👤" },
];

export default function TabBar() {
  const navigate = useNavigate();
  return (
    <nav className="tabbar" aria-label="Hauptnavigation">
      {TABS.slice(0, 2).map((t) => <Tab key={t.to} {...t} />)}
      <button
        className="tabbar-plus"
        onClick={() => navigate("/traum")}
        aria-label="Neuen Traum erfassen"
      >
        <span aria-hidden="true">+</span>
      </button>
      {TABS.slice(2).map((t) => <Tab key={t.to} {...t} />)}
    </nav>
  );
}

function Tab({ to, label, icon }) {
  return (
    <NavLink to={to} end={to === "/"} className={({ isActive }) => "tab" + (isActive ? " tab-aktiv" : "")}>
      <span className="tab-icon" aria-hidden="true">{icon}</span>
      <span className="tab-label">{label}</span>
    </NavLink>
  );
}
```

`src/components/TabBar.css` — alle Werte aus Tokens, kein Hex direkt:

```css
.tabbar {
  position: fixed; left: 0; right: 0; bottom: 0; z-index: 20;
  display: flex; align-items: center; justify-content: space-around;
  height: calc(var(--tabbar-h) + env(safe-area-inset-bottom));
  padding-bottom: env(safe-area-inset-bottom);
  background: rgba(11, 7, 24, .82);
  backdrop-filter: blur(14px);
  border-top: 1px solid var(--panel-line);
}
.tab {
  display: flex; flex-direction: column; align-items: center; gap: 2px;
  flex: 1; text-decoration: none; color: var(--faint);
  font-size: var(--t-micro); padding: var(--s-2) 0;
}
.tab-aktiv { color: var(--violet-soft); }
.tab-icon { font-size: 19px; line-height: 1; }
.tab:focus-visible { outline: 2px solid var(--violet-soft); outline-offset: -3px; border-radius: 10px; }
.tabbar-plus {
  flex: 0 0 auto; width: 52px; height: 52px; margin-top: -18px;
  border: none; border-radius: 50%; cursor: pointer;
  background: linear-gradient(160deg, var(--violet-soft), var(--violet-deep));
  color: var(--text); font-size: 27px; line-height: 1;
  box-shadow: 0 6px 20px rgba(109, 63, 224, .5);
}
.tabbar-plus:focus-visible { outline: 2px solid var(--text); outline-offset: 3px; }
```

- [ ] **Schritt 3: Splash und Toast bauen**

`src/components/Splash.jsx`:

```jsx
import { useEffect, useState } from "react";
import "./Splash.css";

export default function Splash({ onFertig }) {
  const [weg, setWeg] = useState(false);
  useEffect(() => {
    const t1 = setTimeout(() => setWeg(true), 1400);
    const t2 = setTimeout(onFertig, 1800);   // nach dem Ausblenden
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onFertig]);
  return (
    <div className={"splash" + (weg ? " splash-weg" : "")} role="status" aria-label="Dream Rushes wird geladen">
      <div className="splash-mond" aria-hidden="true" />
      <p className="splash-name">Dream Rushes</p>
    </div>
  );
}
```

`src/components/Splash.css`:

```css
.splash {
  position: fixed; inset: 0; z-index: 100;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: var(--s-4);
  background: radial-gradient(125% 85% at 50% -12%, var(--sky) 0%, var(--bg2) 42%, var(--bg) 100%);
  transition: opacity .4s ease;
}
.splash-weg { opacity: 0; pointer-events: none; }
.splash-mond {
  width: 74px; height: 74px; border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, #fff 0%, #e2d6ff 32%, var(--violet) 76%, #5b21b6 100%);
  box-shadow: 0 0 46px rgba(139, 92, 246, .6);
  animation: splash-atmen 2.4s ease-in-out infinite;
}
.splash-name { color: var(--muted); font-size: var(--t-h3); letter-spacing: .04em; margin: 0; }
@keyframes splash-atmen { 0%,100% { transform: scale(1); } 50% { transform: scale(1.06); } }
@media (prefers-reduced-motion: reduce) { .splash-mond { animation: none; } }
```

`src/components/Toast.jsx`:

```jsx
import "./Toast.css";

export default function Toast({ text }) {
  return (
    <div className={"toast" + (text ? " toast-an" : "")} role="status" aria-live="polite">
      {text}
    </div>
  );
}
```

`src/components/Toast.css`:

```css
.toast {
  position: fixed; left: 50%; transform: translateX(-50%);
  bottom: calc(var(--tabbar-h) + env(safe-area-inset-bottom) + var(--s-4));
  z-index: 50; max-width: 90vw;
  padding: var(--s-3) var(--s-5); border-radius: 999px;
  background: rgba(11, 7, 24, .94); border: 1px solid var(--panel-line);
  color: var(--text); font-size: var(--t-small);
  opacity: 0; pointer-events: none; transition: opacity .25s ease;
}
.toast-an { opacity: 1; }
```

- [ ] **Schritt 4: `App.jsx` zusammensetzen**

```jsx
import { useState } from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import { AppStateProvider, useAppState } from "./state/AppState.jsx";
import TabBar from "./components/TabBar.jsx";
import Splash from "./components/Splash.jsx";
import Toast from "./components/Toast.jsx";

// HashRouter, nicht BrowserRouter: Capacitor laedt die App ueber file://,
// wo die History-API nicht zuverlaessig funktioniert.
export default function App() {
  const [zeigeSplash, setZeigeSplash] = useState(true);
  return (
    <AppStateProvider>
      {zeigeSplash && <Splash onFertig={() => setZeigeSplash(false)} />}
      <HashRouter>
        <Routes>
          <Route path="/"         element={<Platzhalter name="Start" />} />
          <Route path="/tagebuch" element={<Platzhalter name="Tagebuch" />} />
          <Route path="/symbole"  element={<Platzhalter name="Symbole" />} />
          <Route path="/profil"   element={<Platzhalter name="Profil" />} />
          <Route path="/traum"    element={<Platzhalter name="Traum erfassen" />} />
        </Routes>
        <TabBar />
      </HashRouter>
      <ToastAnschluss />
    </AppStateProvider>
  );
}

function ToastAnschluss() {
  const { toastText } = useAppState();
  return <Toast text={toastText} />;
}

// Wird in den Aufgaben 7 bis 11 einzeln ersetzt.
function Platzhalter({ name }) {
  return <main className="screen"><h1>{name}</h1></main>;
}
```

- [ ] **Schritt 5: Im Browser prüfen**

```bash
bun run dev
```

Prüfen unter `http://localhost:5173`: Splash erscheint und blendet aus, fünf
Bedienelemente in der Tab-Leiste, jeder Tab wechselt den Titel, der
Plus-Knopf führt auf „Traum erfassen".

- [ ] **Schritt 6: Committen**

```bash
git add src/App.jsx src/state src/components
git commit -m "feat: App-Shell mit Tab-Navigation, Splash und Zustandsschicht"
```

---

### Aufgabe 7: Basiskomponenten

**Dateien:**
- Erstellen: `src/components/Button.jsx`, `src/components/Card.jsx`,
  `src/components/ScreenHeader.jsx`, `src/components/ui.css`

**Schnittstellen:**
- Liefert:
  - `<Button variant="primär"|"still"|"geist" onClick disabled>` — Vorgabe `"primär"`
  - `<Card as="div"|"button" onClick>` — Panel-Optik, tastaturbedienbar wenn `as="button"`
  - `<ScreenHeader titel unterzeile aktion>`

Diese drei tragen später das Mobbin-Redesign: Wer die Optik austauscht, ändert
hier und in `tokens.css` — nicht in den Screens.

- [ ] **Schritt 1: Komponenten schreiben**

`src/components/Button.jsx`:

```jsx
import "./ui.css";

export default function Button({ variant = "primär", children, ...rest }) {
  return <button className={`btn btn-${variant}`} {...rest}>{children}</button>;
}
```

`src/components/Card.jsx`:

```jsx
import "./ui.css";

export default function Card({ as = "div", children, className = "", ...rest }) {
  const Tag = as;
  return <Tag className={`card ${className}`} {...rest}>{children}</Tag>;
}
```

`src/components/ScreenHeader.jsx`:

```jsx
import "./ui.css";

export default function ScreenHeader({ titel, unterzeile, aktion }) {
  return (
    <header className="screen-header">
      <div>
        <h1 className="screen-titel">{titel}</h1>
        {unterzeile && <p className="screen-unterzeile">{unterzeile}</p>}
      </div>
      {aktion}
    </header>
  );
}
```

- [ ] **Schritt 2: Stile schreiben**

`src/components/ui.css`:

```css
.btn {
  display: inline-flex; align-items: center; justify-content: center; gap: var(--s-2);
  padding: var(--s-3) var(--s-5); border-radius: 999px;
  font-family: var(--sans); font-size: var(--t-body); font-weight: 600;
  border: 1px solid transparent; cursor: pointer; transition: opacity .15s ease;
}
.btn:disabled { opacity: .5; cursor: not-allowed; }
.btn:focus-visible { outline: 2px solid var(--violet-soft); outline-offset: 3px; }
.btn-primär { background: linear-gradient(160deg, var(--violet-soft), var(--violet-deep)); color: var(--text); }
.btn-still  { background: var(--panel); border-color: var(--panel-line); color: var(--text); }
.btn-geist  { background: none; color: var(--muted); }

.card {
  display: block; width: 100%; text-align: left;
  background: var(--panel); border: 1px solid var(--panel-line);
  border-radius: var(--radius); padding: var(--s-4);
  color: var(--text); font-family: var(--sans); font-size: var(--t-body);
}
button.card { cursor: pointer; }
button.card:focus-visible { outline: 2px solid var(--violet-soft); outline-offset: 2px; }

.screen-header { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--s-3); margin-bottom: var(--s-5); }
.screen-titel { font-size: var(--t-h2); font-weight: 600; letter-spacing: -.02em; margin: 0; }
.screen-unterzeile { color: var(--muted); font-size: var(--t-small); margin: var(--s-1) 0 0; }
```

- [ ] **Schritt 3: Bauen zur Kontrolle**

```bash
bun run build
```

Erwartet: Build ohne Fehler.

- [ ] **Schritt 4: Committen**

```bash
git add src/components
git commit -m "feat: Basiskomponenten Button, Card und ScreenHeader"
```

---

### Aufgabe 8: Tagebuch-Screen

**Dateien:**
- Erstellen: `src/screens/Journal/JournalScreen.jsx`,
  `src/screens/Journal/JournalCard.jsx`,
  `src/screens/Journal/JournalDetail.jsx`,
  `src/screens/Journal/journal.css`
- Ändern: `src/App.jsx` (Route `/tagebuch`)
- Vorlage: `legacy/index.html` — Funktionen `renderJournal()` und `openEntry()`

**Schnittstellen:**
- Nutzt: `useAppState()` (Aufgabe 6), `Card`, `ScreenHeader` (Aufgabe 7).
- Liefert: Route `/tagebuch`.

- [ ] **Schritt 1: Karte und Liste bauen**

`src/screens/Journal/JournalCard.jsx`:

```jsx
import Card from "../../components/Card.jsx";
import "./journal.css";

const MONATE = ["Jan","Feb","Mär","Apr","Mai","Jun","Jul","Aug","Sep","Okt","Nov","Dez"];

export default function JournalCard({ eintrag, onOeffnen }) {
  const d = new Date(eintrag.createdAt);
  const bild = eintrag.media?.urls?.[0];
  return (
    <Card as="button" className="j-karte" onClick={() => onOeffnen(eintrag.id)}>
      <div className="j-datum">
        <span className="j-tag">{d.getDate()}</span>
        <span className="j-monat">{MONATE[d.getMonth()]}</span>
      </div>
      <div className="j-inhalt">
        <h2 className="j-titel">{eintrag.title || "Ohne Titel"}</h2>
        <p className="j-text">{eintrag.text}</p>
      </div>
      {bild && <img className="j-vorschau" src={bild} alt="" loading="lazy" />}
    </Card>
  );
}
```

`src/screens/Journal/JournalScreen.jsx`:

```jsx
import { useState, useMemo } from "react";
import { useAppState } from "../../state/AppState.jsx";
import ScreenHeader from "../../components/ScreenHeader.jsx";
import JournalCard from "./JournalCard.jsx";
import JournalDetail from "./JournalDetail.jsx";
import "./journal.css";

export default function JournalScreen() {
  const { state } = useAppState();
  const [suche, setSuche] = useState("");
  const [offenId, setOffenId] = useState(null);

  // Neueste zuerst. Sortierung nicht in den Speicher schreiben — die
  // Reihenfolge ist Darstellung, keine Eigenschaft der Daten.
  const eintraege = useMemo(() => {
    const q = suche.trim().toLowerCase();
    return [...(state.journal || [])]
      .filter((e) => !q || (e.text + " " + (e.title || "")).toLowerCase().includes(q))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [state.journal, suche]);

  const offen = eintraege.find((e) => e.id === offenId) || null;

  return (
    <main className="screen">
      <ScreenHeader titel="Tagebuch" unterzeile={`${state.journal?.length || 0} Träume`} />
      <input
        className="j-suche"
        type="search"
        value={suche}
        onChange={(e) => setSuche(e.target.value)}
        placeholder="Träume durchsuchen…"
        aria-label="Träume durchsuchen"
      />
      {eintraege.length === 0 ? (
        <p className="j-leer">
          {suche ? "Nichts gefunden." : "Noch keine Träume aufgeschrieben."}
        </p>
      ) : (
        <div className="j-liste">
          {eintraege.map((e) => (
            <JournalCard key={e.id} eintrag={e} onOeffnen={setOffenId} />
          ))}
        </div>
      )}
      {offen && <JournalDetail eintrag={offen} onSchliessen={() => setOffenId(null)} />}
    </main>
  );
}
```

- [ ] **Schritt 2: Detailansicht bauen**

`src/screens/Journal/JournalDetail.jsx` — Markup und Feldreihenfolge aus
`legacy/index.html`, Funktion `openEntry()` übernehmen:

```jsx
import { useEffect, useRef } from "react";
import Button from "../../components/Button.jsx";
import { useAppState } from "../../state/AppState.jsx";
import "./journal.css";

export default function JournalDetail({ eintrag, onSchliessen }) {
  const { state, update, toast } = useAppState();
  const schliessenRef = useRef(null);

  // Fokus in den Dialog holen und Escape belegen — sonst bleibt die Tastatur
  // hinter dem Modal haengen.
  useEffect(() => {
    schliessenRef.current?.focus();
    const beiTaste = (e) => { if (e.key === "Escape") onSchliessen(); };
    document.addEventListener("keydown", beiTaste);
    return () => document.removeEventListener("keydown", beiTaste);
  }, [onSchliessen]);

  function loeschen() {
    update({ journal: state.journal.filter((e) => e.id !== eintrag.id) });
    toast("Eintrag gelöscht");
    onSchliessen();
  }

  const d = new Date(eintrag.createdAt);
  return (
    <div className="j-modal-hinter" onClick={onSchliessen}>
      <div className="j-modal" role="dialog" aria-modal="true"
           aria-label={eintrag.title || "Traumeintrag"}
           onClick={(e) => e.stopPropagation()}>
        <button ref={schliessenRef} className="j-schliessen" onClick={onSchliessen}
                aria-label="Schließen">×</button>
        <p className="j-modal-datum">{d.toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" })}</p>
        <h2 className="j-modal-titel">{eintrag.title || "Ohne Titel"}</h2>
        {eintrag.media?.urls?.length > 0 && (
          <div className="j-medien">
            {eintrag.media.type === "video"
              ? <video src={eintrag.media.urls[0]} controls playsInline />
              : eintrag.media.urls.map((u, i) => <img key={i} src={u} alt="" loading="lazy" />)}
          </div>
        )}
        <p className="j-modal-text">{eintrag.text}</p>
        {eintrag.references?.length > 0 && (
          <p className="j-referenzen">
            Verwendete Fotos: {eintrag.references.map((r) => "@" + r.tag).join(", ")}
          </p>
        )}
        <Button variant="still" onClick={loeschen}>Eintrag löschen</Button>
      </div>
    </div>
  );
}
```

- [ ] **Schritt 3: Stile schreiben**

`src/screens/Journal/journal.css` — Layout aus `legacy/app.css` übernehmen
(Abschnitt Tagebuch), alle Farben über Tokens. Mindestens nötig:

```css
.j-suche {
  width: 100%; margin-bottom: var(--s-4);
  padding: var(--s-3) var(--s-4); border-radius: 999px;
  background: var(--panel); border: 1px solid var(--panel-line);
  color: var(--text); font-family: var(--sans); font-size: var(--t-body);
}
.j-suche:focus-visible { outline: 2px solid var(--violet-soft); outline-offset: 2px; }
.j-liste { display: flex; flex-direction: column; gap: var(--s-3); }
.j-karte { display: flex; gap: var(--s-4); align-items: flex-start; }
.j-datum { display: flex; flex-direction: column; align-items: center; flex: 0 0 42px; }
.j-tag { font-size: var(--t-h2); font-weight: 600; line-height: 1; }
.j-monat { font-size: var(--t-micro); color: var(--faint); text-transform: uppercase; letter-spacing: .08em; }
.j-inhalt { flex: 1; min-width: 0; }
.j-titel { font-size: var(--t-h3); font-weight: 600; margin: 0 0 var(--s-1); }
.j-text { color: var(--muted); font-size: var(--t-small); margin: 0;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.j-vorschau { width: 54px; height: 54px; border-radius: 12px; object-fit: cover; flex: 0 0 54px; }
.j-leer { color: var(--faint); text-align: center; padding: var(--s-6) 0; }

.j-modal-hinter { position: fixed; inset: 0; z-index: 60; background: rgba(11,7,24,.8);
  backdrop-filter: blur(6px); display: flex; align-items: flex-end; justify-content: center; }
.j-modal { position: relative; width: 100%; max-width: 680px; max-height: 88vh; overflow-y: auto;
  background: var(--bg2); border: 1px solid var(--panel-line);
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  padding: var(--s-6) var(--s-4) calc(env(safe-area-inset-bottom) + var(--s-6)); }
.j-schliessen { position: absolute; top: var(--s-3); right: var(--s-3);
  width: 34px; height: 34px; border-radius: 50%; cursor: pointer;
  background: var(--panel); border: 1px solid var(--panel-line); color: var(--text); font-size: 19px; }
.j-modal-datum { color: var(--faint); font-size: var(--t-small); margin: 0 0 var(--s-1); }
.j-modal-titel { font-size: var(--t-h2); font-weight: 600; margin: 0 0 var(--s-4); }
.j-medien { display: flex; flex-direction: column; gap: var(--s-2); margin-bottom: var(--s-4); }
.j-medien img, .j-medien video { width: 100%; border-radius: var(--radius); display: block; }
.j-modal-text { white-space: pre-wrap; margin: 0 0 var(--s-4); }
.j-referenzen { color: var(--faint); font-size: var(--t-small); margin: 0 0 var(--s-4); }
```

- [ ] **Schritt 4: Route eintragen**

In `src/App.jsx` den Platzhalter ersetzen:

```jsx
import JournalScreen from "./screens/Journal/JournalScreen.jsx";
// …
<Route path="/tagebuch" element={<JournalScreen />} />
```

- [ ] **Schritt 5: Im Browser prüfen**

```bash
bun run dev
```

Prüfen: Vorhandene Einträge erscheinen (der `localStorage` aus der alten App
wird weiterverwendet — gleicher Schlüssel, gleicher Ursprung). Suche filtert,
Karte öffnet das Modal, Escape schließt es, Löschen entfernt den Eintrag und
er bleibt nach dem Neuladen weg.

- [ ] **Schritt 6: Committen**

```bash
git add src/screens/Journal src/App.jsx
git commit -m "feat: Tagebuch-Screen mit Suche, Detailansicht und Loeschen"
```

---

### Aufgabe 9: Symbole-Screen

**Dateien:**
- Erstellen: `src/screens/Symbols/SymbolsScreen.jsx`,
  `src/screens/Symbols/SymbolDetail.jsx`, `src/screens/Symbols/symbols.css`
- Ändern: `src/App.jsx` (Route `/symbole`)
- Vorlage: `legacy/symbole.html`

**Schnittstellen:**
- Nutzt: `SYMBOLS`, `SYMBOL_CATEGORIES`, `symbolOccurrences`, `symbolById`,
  `dreamsDuringEvent` (Aufgabe 5); `useAppState()`.
- Liefert: Route `/symbole`.

- [ ] **Schritt 1: Übersicht bauen**

`src/screens/Symbols/SymbolsScreen.jsx`:

```jsx
import { useMemo, useState } from "react";
import { useAppState } from "../../state/AppState.jsx";
import { SYMBOLS, SYMBOL_CATEGORIES, symbolOccurrences } from "../../lib/symbols.js";
import ScreenHeader from "../../components/ScreenHeader.jsx";
import Card from "../../components/Card.jsx";
import SymbolDetail from "./SymbolDetail.jsx";
import "./symbols.css";

export default function SymbolsScreen() {
  const { state } = useAppState();
  const [offenId, setOffenId] = useState(null);

  // Vorkommen werden bei jedem Rendern neu berechnet, nicht gespeichert:
  // ein spaeter ergaenztes Symbol reichert dadurch auch alte Traeume an.
  const vorkommen = useMemo(() => symbolOccurrences(state.journal), [state.journal]);

  const nachKategorie = Object.entries(SYMBOL_CATEGORIES).map(([key, kat]) => ({
    key, ...kat,
    symbole: SYMBOLS.filter((s) => s.category === key && vorkommen.has(s.id)),
  })).filter((g) => g.symbole.length > 0);

  return (
    <main className="screen">
      <ScreenHeader
        titel="Symbole"
        unterzeile="Wiederkehrende Motive aus deinen Träumen"
      />
      {nachKategorie.length === 0 ? (
        <p className="s-leer">
          Noch keine Symbole gefunden. Schreib ein paar Träume auf — die
          Erkennung arbeitet mit englischen Stichwörtern.
        </p>
      ) : (
        nachKategorie.map((g) => (
          <section key={g.key} className="s-gruppe">
            <h2 className="s-gruppe-titel">
              <span aria-hidden="true">{g.emoji}</span> {g.label}
            </h2>
            <div className="s-raster">
              {g.symbole.map((s) => (
                <Card as="button" key={s.id} className="s-kachel" onClick={() => setOffenId(s.id)}>
                  <span className="s-emoji" aria-hidden="true">{s.emoji}</span>
                  <span className="s-label">{s.label}</span>
                  <span className="s-anzahl">{vorkommen.get(s.id).length}×</span>
                </Card>
              ))}
            </div>
          </section>
        ))
      )}
      {offenId && (
        <SymbolDetail
          symbolId={offenId}
          vorkommen={vorkommen.get(offenId) || []}
          onSchliessen={() => setOffenId(null)}
        />
      )}
    </main>
  );
}
```

- [ ] **Schritt 2: Detailansicht bauen**

`src/screens/Symbols/SymbolDetail.jsx`:

```jsx
import { useEffect, useRef } from "react";
import { symbolById } from "../../lib/symbols.js";
import "./symbols.css";

export default function SymbolDetail({ symbolId, vorkommen, onSchliessen }) {
  const symbol = symbolById(symbolId);
  const schliessenRef = useRef(null);

  useEffect(() => {
    schliessenRef.current?.focus();
    const beiTaste = (e) => { if (e.key === "Escape") onSchliessen(); };
    document.addEventListener("keydown", beiTaste);
    return () => document.removeEventListener("keydown", beiTaste);
  }, [onSchliessen]);

  if (!symbol) return null;
  return (
    <div className="s-modal-hinter" onClick={onSchliessen}>
      <div className="s-modal" role="dialog" aria-modal="true" aria-label={symbol.label}
           onClick={(e) => e.stopPropagation()}>
        <button ref={schliessenRef} className="s-schliessen" onClick={onSchliessen}
                aria-label="Schließen">×</button>
        <p className="s-modal-emoji" aria-hidden="true">{symbol.emoji}</p>
        <h2 className="s-modal-titel">{symbol.label}</h2>
        <p className="s-deutung">{symbol.meaning}</p>
        <p className="s-hinweis">
          Eine gängige Lesart zur Selbstbeobachtung — keine Diagnose.
        </p>
        <h3 className="s-vorkommen-titel">In {vorkommen.length} Traum/Träumen</h3>
        <ul className="s-vorkommen">
          {vorkommen.map((v) => (
            <li key={v.entryId}>
              <span className="s-v-datum">
                {new Date(v.createdAt).toLocaleDateString("de-DE", { day: "numeric", month: "short" })}
              </span>
              <span className="s-v-titel">{v.title || "Ohne Titel"}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
```

- [ ] **Schritt 3: Stile schreiben**

`src/screens/Symbols/symbols.css`:

```css
.s-gruppe { margin-bottom: var(--s-6); }
.s-gruppe-titel { font-size: var(--t-h3); font-weight: 600; margin: 0 0 var(--s-3); color: var(--muted); }
.s-raster { display: grid; grid-template-columns: repeat(auto-fill, minmax(104px, 1fr)); gap: var(--s-3); }
.s-kachel { display: flex; flex-direction: column; align-items: center; gap: var(--s-1); text-align: center; }
.s-emoji { font-size: 26px; line-height: 1; }
.s-label { font-size: var(--t-small); font-weight: 500; }
.s-anzahl { font-size: var(--t-micro); color: var(--faint); }
.s-leer { color: var(--faint); text-align: center; padding: var(--s-6) 0; }

.s-modal-hinter { position: fixed; inset: 0; z-index: 60; background: rgba(11,7,24,.8);
  backdrop-filter: blur(6px); display: flex; align-items: flex-end; justify-content: center; }
.s-modal { position: relative; width: 100%; max-width: 680px; max-height: 88vh; overflow-y: auto;
  background: var(--bg2); border: 1px solid var(--panel-line);
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  padding: var(--s-6) var(--s-4) calc(env(safe-area-inset-bottom) + var(--s-6)); }
.s-schliessen { position: absolute; top: var(--s-3); right: var(--s-3);
  width: 34px; height: 34px; border-radius: 50%; cursor: pointer;
  background: var(--panel); border: 1px solid var(--panel-line); color: var(--text); font-size: 19px; }
.s-modal-emoji { font-size: 38px; margin: 0 0 var(--s-2); }
.s-modal-titel { font-size: var(--t-h2); font-weight: 600; margin: 0 0 var(--s-3); }
.s-deutung { margin: 0 0 var(--s-2); }
.s-hinweis { color: var(--faint); font-size: var(--t-small); margin: 0 0 var(--s-5); }
.s-vorkommen-titel { font-size: var(--t-h3); font-weight: 600; margin: 0 0 var(--s-2); }
.s-vorkommen { list-style: none; padding: 0; margin: 0; }
.s-vorkommen li { display: flex; gap: var(--s-3); padding: var(--s-2) 0; border-bottom: 1px solid var(--panel-line); }
.s-v-datum { color: var(--faint); font-size: var(--t-small); flex: 0 0 62px; }
.s-v-titel { font-size: var(--t-small); }
```

- [ ] **Schritt 4: Route eintragen und prüfen**

```jsx
import SymbolsScreen from "./screens/Symbols/SymbolsScreen.jsx";
// …
<Route path="/symbole" element={<SymbolsScreen />} />
```

```bash
bun run dev
```

Prüfen: Symbole erscheinen gruppiert, Zähler stimmen mit den Tagebucheinträgen
überein, Detail öffnet und schließt.

- [ ] **Schritt 5: Committen**

```bash
git add src/screens/Symbols src/App.jsx
git commit -m "feat: Symbole-Screen mit Kategorien und Detailansicht"
```

---

### Aufgabe 10: Profil-Screen mit Avataren und Orten

**Dateien:**
- Erstellen: `src/screens/Profile/ProfileScreen.jsx`,
  `src/screens/Profile/AvatarListe.jsx`,
  `src/screens/Profile/AvatarDialog.jsx`,
  `src/screens/Profile/LucidGuide.jsx`,
  `src/screens/Profile/profile.css`
- Ändern: `src/App.jsx` (Route `/profil`)
- Vorlage: `legacy/fotos.html` (Bibliothek) und `legacy/index.html`
  (Cast-Kacheln, Lucid-Guide)

**Schnittstellen:**
- Nutzt: `useAppState()`, `genId` (Aufgabe 4).
- Liefert: Route `/profil`.

Hier wird eine bekannte Baustelle aus `docs/STAND.md` miterledigt: Die
Cast-Kacheln hatten einen Löschknopf als `<div>` ohne Fokus. Beim Port wird
daraus ein echter `<button>`.

- [ ] **Schritt 1: Avatarliste bauen**

`src/screens/Profile/AvatarListe.jsx`:

```jsx
import { useAppState } from "../../state/AppState.jsx";
import "./profile.css";

export default function AvatarListe({ kategorie, onNeu }) {
  const { state, update, toast } = useAppState();
  const eintraege = (state.cast || []).filter((p) => p.category === kategorie);

  function loeschen(id, tag) {
    update({ cast: state.cast.filter((p) => p.id !== id) });
    toast(`@${tag} entfernt`);
  }

  return (
    <div className="p-raster">
      {eintraege.map((p) => (
        <div key={p.id} className="p-kachel">
          {p.img
            ? <img src={p.img} alt={`Referenzfoto für @${p.tag}`} loading="lazy" />
            : <div className="p-kein-bild" aria-hidden="true">?</div>}
          <span className="p-tag">@{p.tag}</span>
          <button className="p-loeschen" onClick={() => loeschen(p.id, p.tag)}
                  aria-label={`@${p.tag} löschen`}>×</button>
        </div>
      ))}
      <button className="p-kachel p-neu" onClick={onNeu}>
        <span aria-hidden="true">+</span>
        <span className="p-tag">Neu</span>
      </button>
    </div>
  );
}
```

- [ ] **Schritt 2: Anlegen-Dialog bauen**

`src/screens/Profile/AvatarDialog.jsx` — Foto-Einlesen aus `legacy/fotos.html`
übernehmen (FileReader → dataURL):

```jsx
import { useState } from "react";
import { useAppState } from "../../state/AppState.jsx";
import { genId } from "../../lib/storage.js";
import Button from "../../components/Button.jsx";
import "./profile.css";

// Tag-Regeln spiegeln sanitizeTag() in server.js: nur [a-z0-9], hoechstens
// 12 Zeichen. Der Server prueft ohnehin erneut — hier geht es darum, dass der
// Mensch sofort sieht, was ankommt.
function saeubereTag(roh) {
  return String(roh || "").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 12);
}

export default function AvatarDialog({ kategorie, onSchliessen }) {
  const { state, update, toast } = useAppState();
  const [tag, setTag] = useState("");
  const [bild, setBild] = useState("");

  function dateiLesen(e) {
    const datei = e.target.files?.[0];
    if (!datei) return;
    const leser = new FileReader();
    leser.onload = () => setBild(String(leser.result));
    leser.onerror = () => toast("⚠ Foto konnte nicht gelesen werden.");
    leser.readAsDataURL(datei);
  }

  function speichern() {
    const sauber = saeubereTag(tag);
    if (!sauber) return toast("⚠ Bitte einen Namen aus Buchstaben oder Zahlen angeben.");
    if ((state.cast || []).some((p) => p.tag === sauber)) return toast(`⚠ @${sauber} gibt es schon.`);
    update({ cast: [...(state.cast || []), { id: genId("c"), tag: sauber, category: kategorie, desc: "", img: bild }] });
    toast(`@${sauber} angelegt`);
    onSchliessen();
  }

  const bezeichnung = kategorie === "place" ? "Ort" : kategorie === "pet" ? "Tier" : "Person";
  return (
    <div className="p-modal-hinter" onClick={onSchliessen}>
      <div className="p-modal" role="dialog" aria-modal="true"
           aria-label={`${bezeichnung} anlegen`} onClick={(e) => e.stopPropagation()}>
        <h2 className="p-modal-titel">{bezeichnung} anlegen</h2>
        <label className="p-feld">
          <span>Name (wird zu @{saeubereTag(tag) || "…"})</span>
          <input value={tag} onChange={(e) => setTag(e.target.value)} maxLength={20} autoFocus />
        </label>
        <label className="p-feld">
          <span>Referenzfoto</span>
          <input type="file" accept="image/*" onChange={dateiLesen} />
        </label>
        {bild && <img className="p-vorschau" src={bild} alt="Vorschau des gewählten Fotos" />}
        <p className="p-hinweis">
          Das Foto wird bei der Bildgenerierung an fal.ai übertragen.
        </p>
        <div className="p-aktionen">
          <Button variant="geist" onClick={onSchliessen}>Abbrechen</Button>
          <Button onClick={speichern}>Speichern</Button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Schritt 3: Lucid-Guide portieren**

`src/screens/Profile/LucidGuide.jsx` — die vier Abschnitte (Reality Checks,
MILD, WBTB, Journaling) aus `legacy/index.html` übernehmen und übersetzen, als
aufklappbare Liste:

```jsx
import Card from "../../components/Card.jsx";
import "./profile.css";

const THEMEN = [
  { titel: "Reality Checks",
    text: "Frag dich mehrmals am Tag, ob du träumst — und prüfe es wirklich: " +
          "Hände zählen, auf eine Uhr schauen, wegsehen, nochmal hinschauen. " +
          "Im Traum verändert sich das Ergebnis." },
  { titel: "MILD",
    text: "Sag dir beim Einschlafen vor: „Heute Nacht merke ich, dass ich träume.\" " +
          "Stell dir dabei einen vergangenen Traum vor und wie du darin bemerkst, dass es einer ist." },
  { titel: "WBTB",
    text: "Nach etwa fünf Stunden Schlaf kurz aufwachen, 20 bis 30 Minuten wach bleiben, " +
          "dann mit der MILD-Formel wieder einschlafen. Wirkt am zuverlässigsten, kostet aber Schlaf." },
  { titel: "Aufschreiben",
    text: "Träume direkt nach dem Aufwachen notieren, bevor du aufstehst. " +
          "Wer regelmäßig aufschreibt, erinnert sich an mehr — und erkennt eigene wiederkehrende Muster." },
];

export default function LucidGuide() {
  return (
    <div className="p-guide">
      {THEMEN.map((t) => (
        <Card key={t.titel}>
          <details>
            <summary className="p-guide-titel">{t.titel}</summary>
            <p className="p-guide-text">{t.text}</p>
          </details>
        </Card>
      ))}
    </div>
  );
}
```

- [ ] **Schritt 4: Screen zusammensetzen**

`src/screens/Profile/ProfileScreen.jsx`:

```jsx
import { useState } from "react";
import { useAppState } from "../../state/AppState.jsx";
import ScreenHeader from "../../components/ScreenHeader.jsx";
import Card from "../../components/Card.jsx";
import AvatarListe from "./AvatarListe.jsx";
import AvatarDialog from "./AvatarDialog.jsx";
import LucidGuide from "./LucidGuide.jsx";
import "./profile.css";

export default function ProfileScreen() {
  const { state } = useAppState();
  const [dialogFuer, setDialogFuer] = useState(null);   // "person" | "pet" | "place" | null

  return (
    <main className="screen">
      <ScreenHeader titel="Profil" />

      <Card className="p-credits">
        <span className="p-credits-zahl">{state.credits ?? 0}</span>
        <span className="p-credits-label">Credits</span>
        <span className="p-credits-hinweis">Aufladen bald verfügbar</span>
      </Card>

      <h2 className="p-abschnitt">Personen</h2>
      <AvatarListe kategorie="person" onNeu={() => setDialogFuer("person")} />

      <h2 className="p-abschnitt">Tiere</h2>
      <AvatarListe kategorie="pet" onNeu={() => setDialogFuer("pet")} />

      <h2 className="p-abschnitt">Orte</h2>
      <AvatarListe kategorie="place" onNeu={() => setDialogFuer("place")} />

      <h2 className="p-abschnitt">Klarträumen lernen</h2>
      <LucidGuide />

      {dialogFuer && (
        <AvatarDialog kategorie={dialogFuer} onSchliessen={() => setDialogFuer(null)} />
      )}
    </main>
  );
}
```

- [ ] **Schritt 5: Stile schreiben**

`src/screens/Profile/profile.css`:

```css
.p-abschnitt { font-size: var(--t-h3); font-weight: 600; margin: var(--s-6) 0 var(--s-3); }
.p-raster { display: grid; grid-template-columns: repeat(auto-fill, minmax(88px, 1fr)); gap: var(--s-3); }
.p-kachel { position: relative; display: flex; flex-direction: column; align-items: center; gap: var(--s-1);
  background: var(--panel); border: 1px solid var(--panel-line); border-radius: var(--radius);
  padding: var(--s-3); color: var(--text); font-family: var(--sans); }
.p-kachel img, .p-kein-bild { width: 54px; height: 54px; border-radius: 50%; object-fit: cover; }
.p-kein-bild { display: flex; align-items: center; justify-content: center;
  background: var(--sky); color: var(--faint); }
.p-tag { font-size: var(--t-micro); color: var(--muted); }
.p-loeschen { position: absolute; top: 2px; right: 2px; width: 22px; height: 22px;
  border-radius: 50%; cursor: pointer; background: rgba(11,7,24,.8);
  border: 1px solid var(--panel-line); color: var(--text); font-size: 13px; line-height: 1; }
.p-loeschen:focus-visible, .p-neu:focus-visible { outline: 2px solid var(--violet-soft); outline-offset: 2px; }
.p-neu { cursor: pointer; border-style: dashed; font-size: 22px; color: var(--faint); }

.p-credits { display: flex; align-items: baseline; gap: var(--s-2); }
.p-credits-zahl { font-size: var(--t-h2); font-weight: 600; }
.p-credits-label { color: var(--muted); font-size: var(--t-small); }
.p-credits-hinweis { margin-left: auto; color: var(--faint); font-size: var(--t-micro); }

.p-guide { display: flex; flex-direction: column; gap: var(--s-2); }
.p-guide-titel { font-weight: 600; cursor: pointer; }
.p-guide-text { color: var(--muted); font-size: var(--t-small); margin: var(--s-2) 0 0; }

.p-modal-hinter { position: fixed; inset: 0; z-index: 60; background: rgba(11,7,24,.8);
  backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; padding: var(--s-4); }
.p-modal { width: 100%; max-width: 420px; background: var(--bg2);
  border: 1px solid var(--panel-line); border-radius: var(--radius-lg); padding: var(--s-5); }
.p-modal-titel { font-size: var(--t-h2); font-weight: 600; margin: 0 0 var(--s-4); }
.p-feld { display: block; margin-bottom: var(--s-4); }
.p-feld span { display: block; font-size: var(--t-small); color: var(--muted); margin-bottom: var(--s-1); }
.p-feld input { width: 100%; padding: var(--s-3); border-radius: 12px;
  background: var(--panel); border: 1px solid var(--panel-line);
  color: var(--text); font-family: var(--sans); font-size: var(--t-body); }
.p-vorschau { width: 100%; max-height: 200px; object-fit: contain; border-radius: var(--radius); margin-bottom: var(--s-3); }
.p-hinweis { color: var(--faint); font-size: var(--t-small); margin: 0 0 var(--s-4); }
.p-aktionen { display: flex; gap: var(--s-2); justify-content: flex-end; }
```

- [ ] **Schritt 6: Route eintragen und prüfen**

```jsx
import ProfileScreen from "./screens/Profile/ProfileScreen.jsx";
// …
<Route path="/profil" element={<ProfileScreen />} />
```

```bash
bun run dev
```

Prüfen: Vorhandene Cast-Einträge erscheinen unter der richtigen Kategorie, ein
neuer Avatar mit Foto lässt sich anlegen und überlebt das Neuladen, der
Löschknopf ist per Tabulator erreichbar und zeigt einen Fokusrahmen.

- [ ] **Schritt 7: Committen**

```bash
git add src/screens/Profile src/App.jsx
git commit -m "feat: Profil-Screen mit Avataren, Orten, Guide und Credit-Anzeige"
```

---

### Aufgabe 11: Home und „Traum erfassen"

**Dateien:**
- Erstellen: `src/screens/Home/HomeScreen.jsx`, `src/screens/Home/home.css`
- Erstellen: `src/screens/Home/Menagerie.jsx`
- Erstellen: `src/screens/Dream/DreamScreen.jsx`, `src/screens/Dream/dream.css`
- Erstellen: `src/lib/api.js`
- Erstellen: `src/lib/streak.js`, Test: `src/lib/streak.test.js`
- Erstellen: `src/lib/creatures.js`
- Ändern: `src/App.jsx` (Routen `/` und `/traum`)
- Vorlage: `legacy/index.html` — `summon()`, `tryBackend()`, `bumpStreak()`,
  `refreshStreak()`, `renderMenagerie()`, `matchCreature()`, `pickRarity()`,
  `titleFrom()`

**Schnittstellen:**
- `api.js` liefert: `generate({ dream, mode, cast }): Promise<string[]>` —
  wirft `Error` mit lesbarer Meldung, wenn der Server einen Fehler meldet.
- `streak.js` liefert: `todayStr(): string` (`"JJJJ-MM-TT"`),
  `bumpStreak(state): {streak, lastDream}`,
  `refreshStreak(state): {streak, lastDream}`
- `creatures.js` liefert: `CREATURE_POOL`, `RARITIES`, `ADJ`,
  `neueKreatur(text): object`
- Liefert: Routen `/` und `/traum`.

⚠️ **`state.lastDream` ist ein Datumsstring, kein Traumtext.** Die
Streak-Logik vergleicht ihn mit `todayStr()`. Wer dort den Traumtext
hineinschreibt, setzt die Serie jedes Mal auf 1 zurück — der Feldname legt
das Gegenteil nahe, deshalb steht es hier ausdrücklich.

⚠️ `DreamScreen` ist bewusst ein **1:1-Port des heutigen Formulars**, kein
Wizard. Der sechsstufige Ablauf ist Phase 2 und ersetzt genau diese Datei.
Zweck hier: die App kann am Ende von Phase 1 alles, was sie vorher konnte.

- [ ] **Schritt 1: API-Schicht schreiben**

`src/lib/api.js`:

```js
// Einzige Stelle, an der der Client den Server anspricht. API_BASE ist
// konfigurierbar, weil das Capacitor-Bundle spaeter nicht auf demselben
// Ursprung laeuft wie der Server.
const API_BASE = import.meta.env.VITE_API_BASE || "";

export async function generate({ dream, mode, cast }) {
  const res = await fetch(`${API_BASE}/api/generate`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ dream, mode, cast }),
  });
  const daten = await res.json().catch(() => null);
  if (!res.ok) throw new Error(daten?.error || `Server antwortete mit ${res.status}.`);
  if (!Array.isArray(daten?.urls)) throw new Error("Unerwartete Antwort vom Server.");
  return daten.urls;
}
```

- [ ] **Schritt 2: Streak- und Kreaturen-Logik als prüfbare Module**

Zuerst der Test. `src/lib/streak.test.js`:

```js
import { test, expect } from "bun:test";
import { bumpStreak, refreshStreak, todayStr } from "./streak.js";

const heute = todayStr();
const gestern = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
const vorwoche = new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10);

test("erster Traum ueberhaupt startet die Serie bei 1", () => {
  expect(bumpStreak({ streak: 0, lastDream: null })).toEqual({ streak: 1, lastDream: heute });
});

test("Traum an Folgetagen zaehlt hoch", () => {
  expect(bumpStreak({ streak: 3, lastDream: gestern })).toEqual({ streak: 4, lastDream: heute });
});

test("zweiter Traum am selben Tag aendert nichts", () => {
  expect(bumpStreak({ streak: 4, lastDream: heute })).toEqual({ streak: 4, lastDream: heute });
});

test("Luecke beginnt die Serie neu", () => {
  expect(bumpStreak({ streak: 9, lastDream: vorwoche })).toEqual({ streak: 1, lastDream: heute });
});

test("refreshStreak setzt eine abgerissene Serie zurueck", () => {
  expect(refreshStreak({ streak: 9, lastDream: vorwoche }).streak).toBe(0);
});

test("refreshStreak laesst eine laufende Serie stehen", () => {
  expect(refreshStreak({ streak: 3, lastDream: gestern }).streak).toBe(3);
});
```

```bash
bun test src/lib/streak.test.js
```

Erwartet: FEHLSCHLAG, Modul nicht gefunden.

`src/lib/streak.js` — aus `legacy/index.html:190-206`, aber als reine
Funktionen ohne DOM-Zugriff und ohne Speichern:

```js
/* Serie ("Streak") aufeinanderfolgender Traumtage.
 *
 * ACHTUNG: state.lastDream ist ein DATUM ("2026-08-07"), nicht der Traumtext.
 * Der Name legt anderes nahe; die Vergleiche hier haengen daran.
 */
export function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

/** Nach einem gespeicherten Traum aufrufen. */
export function bumpStreak(state) {
  const heute = todayStr();
  if (state.lastDream === heute) return { streak: state.streak, lastDream: heute };
  const gestern = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
  return {
    streak: state.lastDream === gestern ? (state.streak || 0) + 1 : 1,
    lastDream: heute,
  };
}

/** Beim Anzeigen aufrufen: eine abgerissene Serie faellt auf 0. */
export function refreshStreak(state) {
  if (!state.lastDream) return { streak: state.streak || 0, lastDream: state.lastDream };
  const abstand = (new Date(todayStr()) - new Date(state.lastDream)) / 864e5;
  return abstand > 1
    ? { streak: 0, lastDream: state.lastDream }
    : { streak: state.streak || 0, lastDream: state.lastDream };
}
```

`src/lib/creatures.js` — `CREATURE_POOL`, `RARITIES`, `ADJ`, `DEFAULT` und
`STOP` unverändert aus `legacy/index.html` übernehmen und exportieren, dazu
eine zusammenfassende Funktion, die ersetzt, was `summon()` inline tat:

```js
import { genId } from "./storage.js";

/** Eine Kreatur aus einem Traumtext. Zufall bleibt Zufall — nicht pruefbar
 *  und muss es auch nicht sein; es ist Spielerei, keine Datenhaltung. */
export function neueKreatur(text) {
  const basis = matchCreature(text);
  const [rare, rareClass] = pickRarity();
  return {
    id: genId("cr"),
    e: basis.e,
    name: basis.names[Math.floor(Math.random() * basis.names.length)],
    rare, rareClass,
    power: 20 + Math.floor(Math.random() * 80),
    lucid: 1 + Math.floor(Math.random() * 10),
    date: new Date().toLocaleDateString("de-DE", { day: "numeric", month: "short" }),
    title: titleFrom(text),
  };
}
```

`matchCreature`, `pickRarity` und `titleFrom` bleiben modulintern und werden
wörtlich aus `legacy/index.html:183-189` übernommen.

```bash
bun test src/lib/streak.test.js
```

Erwartet: 6 Tests bestanden.

- [ ] **Schritt 3: Menagerie-Komponente bauen**

`src/screens/Home/Menagerie.jsx` — ersetzt `renderMenagerie()`:

```jsx
import { useAppState } from "../../state/AppState.jsx";
import "./home.css";

export default function Menagerie() {
  const { state } = useAppState();
  const kreaturen = [...(state.creatures || [])].reverse();   // neueste zuerst

  if (kreaturen.length === 0) {
    return (
      <p className="h-leer">
        Noch keine Wesen. Jeder aufgeschriebene Traum lässt eines zurück.
      </p>
    );
  }
  return (
    <div className="h-menagerie">
      {kreaturen.map((c) => (
        <div key={c.id} className="h-wesen">
          <span className="h-wesen-emoji" aria-hidden="true">{c.e}</span>
          <span className="h-wesen-name">{c.name}</span>
          <span className={"h-wesen-rar " + c.rareClass}>{c.rare}</span>
          <span className="h-wesen-datum">{c.date}</span>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Schritt 4: Home bauen**

`src/screens/Home/HomeScreen.jsx`:

```jsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppState } from "../../state/AppState.jsx";
import { refreshStreak } from "../../lib/streak.js";
import Button from "../../components/Button.jsx";
import Card from "../../components/Card.jsx";
import Menagerie from "./Menagerie.jsx";
import "./home.css";

function begruessung() {
  const h = new Date().getHours();
  if (h < 5) return "Gute Nacht";
  if (h < 11) return "Guten Morgen";
  if (h < 18) return "Hallo";
  return "Guten Abend";
}

export default function HomeScreen() {
  const { state, update } = useAppState();
  const navigate = useNavigate();

  // Eine abgerissene Serie faellt beim Ansehen auf 0 — sonst zeigt die App
  // nach zwei Wochen Pause weiter "9 Tage".
  useEffect(() => {
    const frisch = refreshStreak(state);
    if (frisch.streak !== state.streak) update(frisch);
    // Absichtlich nur beim Betreten: bei jeder Zustandsaenderung zu pruefen
    // wuerde eine Schleife ueber update() ausloesen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const letzter = [...(state.journal || [])]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];

  return (
    <main className="screen">
      <div className="h-kopf">
        <div className="h-mond" aria-hidden="true" />
        <p className="h-streak">🔥 {state.streak || 0} Tage</p>
      </div>

      <h1 className="h-gruss">{begruessung()}</h1>
      <p className="h-lede">Woran erinnerst du dich?</p>

      <Button onClick={() => navigate("/traum")}>Traum aufschreiben</Button>

      {letzter && (
        <>
          <h2 className="h-abschnitt">Zuletzt</h2>
          <Card as="button" className="h-letzter" onClick={() => navigate("/tagebuch")}>
            <span className="h-letzter-titel">{letzter.title || "Ohne Titel"}</span>
            <span className="h-letzter-text">{letzter.text}</span>
          </Card>
        </>
      )}

      <h2 className="h-abschnitt">Deine Wesen</h2>
      <Menagerie />
    </main>
  );
}
```

`src/screens/Home/home.css`:

```css
.h-kopf { display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--s-6); }
.h-mond { width: 30px; height: 30px; border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, #fff 0%, #e2d6ff 32%, var(--violet) 76%, #5b21b6 100%);
  box-shadow: 0 0 22px rgba(139,92,246,.55); }
.h-streak { font-size: var(--t-small); color: var(--muted); margin: 0;
  background: var(--panel); border: 1px solid var(--panel-line);
  padding: var(--s-2) var(--s-3); border-radius: 999px; }
.h-gruss { font-size: var(--t-hero); font-weight: 600; letter-spacing: -.03em; margin: 0 0 var(--s-2); }
.h-lede { color: var(--muted); margin: 0 0 var(--s-5); }
.h-abschnitt { font-size: var(--t-h3); font-weight: 600; margin: var(--s-6) 0 var(--s-3); }
.h-letzter { display: flex; flex-direction: column; gap: var(--s-1); }
.h-letzter-titel { font-weight: 600; }
.h-letzter-text { color: var(--muted); font-size: var(--t-small);
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

.h-leer { color: var(--faint); font-size: var(--t-small); text-align: center; padding: var(--s-5) 0; }
.h-menagerie { display: grid; grid-template-columns: repeat(auto-fill, minmax(96px, 1fr)); gap: var(--s-3); }
.h-wesen { display: flex; flex-direction: column; align-items: center; gap: 2px; text-align: center;
  background: var(--panel); border: 1px solid var(--panel-line);
  border-radius: var(--radius); padding: var(--s-3); }
.h-wesen-emoji { font-size: 26px; line-height: 1; }
.h-wesen-name { font-size: var(--t-small); font-weight: 600; }
.h-wesen-rar { font-size: var(--t-micro); }
.h-wesen-datum { font-size: var(--t-micro); color: var(--faint); }
```

Die Klassen für die Seltenheitsstufen (`rare-common` und die weiteren aus
`RARITIES`) wörtlich aus `legacy/app.css` übernehmen — die Farben sind Teil
der Spielerei und sollen erhalten bleiben.

- [ ] **Schritt 5: „Traum erfassen" bauen**

`src/screens/Dream/DreamScreen.jsx` — Logik aus `legacy/index.html`
(`summon()`, `tryBackend()`), Zustandsführung über `useAppState`:

```jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppState } from "../../state/AppState.jsx";
import { taggedPhotosIn } from "../../lib/tags.js";
import { genId } from "../../lib/storage.js";
import { generate } from "../../lib/api.js";
import { bumpStreak } from "../../lib/streak.js";
import { neueKreatur } from "../../lib/creatures.js";
import Button from "../../components/Button.jsx";
import ScreenHeader from "../../components/ScreenHeader.jsx";
import "./dream.css";

export default function DreamScreen() {
  const { state, update, toast } = useAppState();
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const [modus, setModus] = useState("sequence");
  const [laeuft, setLaeuft] = useState(false);

  async function absenden() {
    const sauber = text.trim();
    if (sauber.length < 8) return toast("⚠ Schreib etwas mehr auf.");
    setLaeuft(true);
    // Nur Referenzfotos mitschicken, deren Name wirklich vorkommt. Diese
    // Regel wird in Phase 2 durch die ausdrueckliche Zuordnung im Wizard
    // abgeloest — siehe Spec.
    const cast = taggedPhotosIn(state, sauber);
    let urls = [];
    let quelle = "demo";
    try {
      urls = await generate({ dream: sauber, mode: modus, cast });
      quelle = "api";
    } catch (err) {
      console.error("[DreamRushes] Generierung fehlgeschlagen:", err);
      toast(`⚠ ${err.message}`);
    }
    const kreatur = neueKreatur(sauber);
    const eintrag = {
      id: genId("e"), createdAt: new Date().toISOString(),
      text: sauber, title: kreatur.title,
      mode: modus, cons: state.cons,
      media: { type: modus === "film" ? "video" : "image", urls, source: quelle },
      references: cast.map((c) => ({ tag: c.tag, category: c.category })),
      creatureId: kreatur.id,
    };
    // bumpStreak liefert {streak, lastDream} — lastDream ist ein DATUM.
    // Niemals den Traumtext dort hineinschreiben, sonst startet die Serie
    // bei jedem Traum neu.
    update({
      journal: [...(state.journal || []), eintrag],
      creatures: [...(state.creatures || []), kreatur],
      ...bumpStreak(state),
    });
    setLaeuft(false);
    toast(`✦ ${kreatur.name} kam dazu`);
    navigate("/tagebuch");
  }

  return (
    <main className="screen">
      <ScreenHeader
        titel="Traum aufschreiben"
        aktion={<Button variant="geist" onClick={() => navigate(-1)}>Abbrechen</Button>}
      />
      <textarea
        className="d-feld"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Ich flog über ein violettes Meer…"
        rows={9}
        autoFocus
        aria-label="Traumtext"
      />
      <fieldset className="d-modus">
        <legend>Was soll entstehen?</legend>
        <label>
          <input type="radio" name="modus" value="sequence"
                 checked={modus === "sequence"} onChange={() => setModus("sequence")} />
          Bilder
        </label>
        <label>
          <input type="radio" name="modus" value="film"
                 checked={modus === "film"} onChange={() => setModus("film")} />
          Film
        </label>
      </fieldset>
      <p className="d-hinweis">
        Genannte Referenzfotos werden zur Generierung an fal.ai übertragen.
      </p>
      <Button onClick={absenden} disabled={laeuft}>
        {laeuft ? "Wird erzeugt…" : "Traum beschwören"}
      </Button>
    </main>
  );
}
```

`src/screens/Dream/dream.css`:

```css
.d-feld { width: 100%; padding: var(--s-4); border-radius: var(--radius);
  background: var(--panel); border: 1px solid var(--panel-line);
  color: var(--text); font-family: var(--sans); font-size: var(--t-body);
  line-height: 1.6; resize: vertical; margin-bottom: var(--s-4); }
.d-feld:focus-visible { outline: 2px solid var(--violet-soft); outline-offset: 2px; }
.d-modus { border: none; padding: 0; margin: 0 0 var(--s-4); }
.d-modus legend { font-size: var(--t-small); color: var(--muted); margin-bottom: var(--s-2); padding: 0; }
.d-modus label { display: inline-flex; align-items: center; gap: var(--s-2);
  margin-right: var(--s-5); font-size: var(--t-body); cursor: pointer; }
.d-hinweis { color: var(--faint); font-size: var(--t-small); margin: 0 0 var(--s-4); }
```

- [ ] **Schritt 6: Routen eintragen**

```jsx
import HomeScreen from "./screens/Home/HomeScreen.jsx";
import DreamScreen from "./screens/Dream/DreamScreen.jsx";
// …
<Route path="/"      element={<HomeScreen />} />
<Route path="/traum" element={<DreamScreen />} />
```

Die Hilfskomponente `Platzhalter` ist damit unbenutzt und wird aus `App.jsx`
entfernt.

- [ ] **Schritt 7: End-to-end prüfen**

```bash
bun test && bun run dev
```

Prüfen mit gesetzten Schlüsseln in `.env`:

1. Traum eingeben, „Beschwören" — Bilder kommen zurück, der Eintrag erscheint
   im Tagebuch mit Bild, ein neues Wesen steht auf der Startseite.
2. Die Serie steht danach auf mindestens 1. **Zweiten Traum am selben Tag
   erfassen: die Zahl darf sich nicht ändern** — genau hier fiel der
   `lastDream`-Fehler auf.
3. `FAL_KEY` leeren, Server neu starten, erneut beschwören: Fehlermeldung
   erscheint, der Eintrag wird trotzdem gespeichert, die App stürzt nicht ab.

- [ ] **Schritt 8: Committen**

```bash
git add src/screens/Home src/screens/Dream src/lib src/App.jsx
git commit -m "feat: Home-Screen, Menagerie, Serie und Traum-Erfassung"
```

---

### Aufgabe 12: Aufräumen und Doku

**Dateien:**
- Löschen: `legacy/`
- Ändern: `README.md`, `docs/STAND.md`, `docs/WORKLOG.md`,
  `scripts/shared-files.json`, `.gitignore`

- [ ] **Schritt 1: Prüfen, dass nichts mehr auf `legacy/` zeigt**

```bash
grep -rn "legacy/" src/ server.js scripts/ vite.config.js
```

Erwartet: keine Treffer. Gibt es welche, wurde etwas nicht portiert — dann
zuerst dort nacharbeiten.

- [ ] **Schritt 2: Vollständige Testrunde**

```bash
bun run build && bun run test
```

Erwartet: Build grün, alle `bun test`-Tests grün, `test-static.mjs` und
`test-prompt-sanitize.mjs` grün.

- [ ] **Schritt 3: `legacy/` löschen**

```bash
git rm -r legacy
```

- [ ] **Schritt 4: `.gitignore` und geteilte Dateien pflegen**

`.gitignore` ergänzen:

```
dist/
node_modules/
```

`scripts/shared-files.json` vollständig ersetzen — die alten Einträge
existieren nicht mehr, und die Sitzungsstart-Warnung bei paralleler Arbeit
greift sonst ins Leere:

```json
{
  "_hinweis": "Geteilte Dateien, bei denen parallele Arbeit fast sicher kollidiert. Seit dem Umbau auf React (ADR-0004) sind das die Shell und die Grundlagen: App.jsx haelt alle Routen, AppState.jsx die Speicherschicht (ein Konflikt dort beschaedigt Nutzerdaten), tokens.css und ui.css bestimmen die Optik aller Screens.",
  "dateien": [
    "package.json",
    "bun.lockb",
    "vite.config.js",
    "AGENTS.md",
    "docs/STAND.md",
    ".gitattributes",
    ".claude/settings.json",
    "server.js",
    "src/App.jsx",
    "src/state/AppState.jsx",
    "src/lib/storage.js",
    "src/styles/tokens.css",
    "src/components/ui.css"
  ]
}
```

- [ ] **Schritt 5: `README.md` aktualisieren**

Der Startbefehl hat sich geändert. Der Abschnitt zum Starten muss lauten:

```markdown
## Starten

    bun install
    bun run dev      # Oberflaeche auf 5173, API auf 8100

Fuer einen produktionsnahen Lauf:

    bun run build && bun server.js    # alles auf 8100
```

Der Hinweis auf `python3 -m http.server` entfällt ersatzlos — die statische
Vorschau ohne Freigabeliste gibt es nicht mehr.

- [ ] **Schritt 6: `docs/STAND.md` neu schreiben**

Vollständig überschreiben (die Datei zeigt immer nur die Gegenwart). Diese
Punkte müssen sich ändern:

- Stack: React + Vite + Bun, **mit** Build-Schritt, ADR-0004 statt ADR-0003.
- Fünf Tabs statt drei HTML-Seiten.
- Erledigt streichen: Sprachwiderspruch (UI ist jetzt deutsch),
  Barrierefreiheit der Cast-Kacheln (Löschknopf ist ein `<button>`),
  „keine UI-Tests" (Speicher-, Symbol- und Tag-Logik sind getestet).
- Neu unter „Bekannte Baustellen": Screens selbst sind weiterhin nur manuell
  geprüft; `dist/` muss vor dem Start gebaut sein.
- „Nächste Schritte" beginnt jetzt mit Phase 2 (Wizard).

- [ ] **Schritt 7: `docs/WORKLOG.md` ergänzen**

Neuer Eintrag **oben**, nach dem Muster der vorhandenen: Datum, Uhrzeit, Name,
Branch, was, warum, was der Nächste wissen muss. Alte Einträge nicht anfassen.

- [ ] **Schritt 8: Committen**

```bash
git add -A
git commit -m "chore: legacy entfernt, Doku und README auf den neuen Stack gezogen"
```

---

## Wenn Phase 1 fertig ist

Die App hat Tabs, Splash, alle bisherigen Funktionen und eine getestete
Logikschicht. `DreamScreen` ist die Stelle, die Phase 2 durch den
sechsstufigen Wizard ersetzt — sie ist absichtlich klein gehalten.

Vor Phase 2 zu klären: Ob `/api/analyze` (der eine DeepSeek-Aufruf) das
JSON-Schema aus der Spec zuverlässig zurückliefert, lässt sich erst mit einem
echten Aufruf sagen. Das ist der erste Schritt von Phase 2 und braucht
Netzwerkzugriff.
