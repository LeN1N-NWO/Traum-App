# ADR-0003: Mehrere Seiten mit geteiltem `app.css` und `app.js`

**Status:** angenommen · **Datum:** 2026-08-07 · **Format:** MADR
**Verhältnis zu ADR-0002:** ergänzt es. Der Stack (Bun, Vanilla, kein
Build-Schritt, Higgsfield-Proxy) bleibt unverändert gültig; nur die Annahme
„die App ist eine einzige `index.html`" wird abgelöst.

## Kontext

Die Symbolsammlung (wiederkehrende Traummotive, Deutung, Verknüpfung mit
Lebensereignissen) braucht spürbar Platz: eigenes Raster, Detailansicht,
Formular für Lebensereignisse. ADR-0002 ging von einer einzigen Seite aus, weil
die App damals „eine Seite mit einem API-Aufruf" war. Das stimmt nicht mehr.

Zum Entscheidungszeitpunkt hatte `index.html` 792 Zeilen — davon 230 Zeilen
Stil und 410 Zeilen Skript.

## Betrachtete Optionen

1. **Zweite HTML-Datei mit ausgelagertem `app.css` und `app.js`**
2. Ansicht innerhalb von `index.html` umschalten (Hash-Routing)
3. Zweite HTML-Datei mit dupliziertem Stil und Skript

## Entscheidung

Option 1, vom Produktbesitzer bewusst gewählt.

Sobald eine zweite Seite existiert, ist die Auslagerung nicht optional, sondern
zwingend: Option 3 hätte 230 Zeilen Stil dupliziert (die Seiten laufen optisch
auseinander) und — deutlich schlimmer — die Speicherschicht. Zwei driftende
Kopien eines Datenschemas beschädigen die Traumtagebücher der Nutzer. Das ist
kein Stilproblem, sondern ein Datenverlustproblem.

`app.js` enthält deshalb ausschließlich, was beide Seiten wirklich brauchen:
Speicher (`DB`, `DEF`, `load`, `save`, `genId`), `escapeHtml`, `toast` und die
Symbolerkennung. Alles Seitenspezifische bleibt in der jeweiligen Seite.

## Konsequenzen

- Weiterhin kein Build-Schritt: zwei `<link>`/`<script>`-Verweise, sonst nichts.
  `bun server.js` bleibt der einzige Startbefehl.
- **Die Freigabeliste im Server wächst.** `PUBLIC_FILES` in `server.js` enthält
  jetzt `/index.html`, `/symbole.html`, `/app.css`, `/app.js`. Jede weitere
  öffentliche Datei ist eine bewusste Änderung an genau der Stelle, die den
  Higgsfield-Schlüssel schützt — abgesichert durch `scripts/test-static.mjs`
  (31 Prüfungen).
- `app.css` und `app.js` sind ab sofort geteilte Dateien im Sinne von
  `scripts/shared-files.json`: praktisch jedes Feature fasst sie an.
- Die Ladereihenfolge ist bindend: `app.js` ist ein klassisches Skript, keine
  ES-Modul-Datei, und muss vor dem Seitenskript stehen.

## Verworfene Alternativen — warum

**Ansicht in derselben Datei (Hash-Routing):** hätte die Freigabeliste
unangetastet gelassen und keine Auslagerung erzwungen. Verworfen, weil
`index.html` dann auf weit über 1000 Zeilen gewachsen wäre und zwei inhaltlich
unabhängige Oberflächen in einer Datei gelegen hätten. `docs/STAND.md` führt die
Dateilänge bereits als Baustelle.

**Duplizierter Stil und Speicher:** siehe oben — Datenverlustrisiko durch
driftende Schemata. Wurde nicht ernsthaft erwogen.

## Wann neu prüfen

Wenn eine dritte oder vierte Seite dazukommt und die Verweise unübersichtlich
werden, oder wenn gemeinsame Zustandslogik über `app.js` hinauswächst. Erster
Kandidat wäre dann *nicht* ein Framework, sondern ES-Module — die brauchen
weiterhin keinen Build-Schritt und halten ADR-0002 intakt.
