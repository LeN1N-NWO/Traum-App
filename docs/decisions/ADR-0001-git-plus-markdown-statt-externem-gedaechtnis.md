# ADR-0001: Git + Markdown als Projektgedächtnis, kein externes Gedächtnis-System

**Status:** angenommen · **Datum:** 2026-08-04 · **Format:** MADR

## Kontext

KI-Assistenten haben kein Gedächtnis zwischen Sitzungen. Mehrere Menschen arbeiten
von mehreren Rechnern. Es braucht einen Ort, der festhält: wo stehen wir, wer hat
was warum geändert, und welche Wege wurden bereits verworfen.

## Betrachtete Optionen

1. **Git + Markdown im Repository** (STAND.md, WORKLOG.md, ADRs)
2. **Externes Gedächtnis-System** (MemPalace, mem0, Zep, Letta — Vektor-/Graphdatenbank
   mit semantischer Suche)
3. **Eigenes System bauen** (Datenbank, Wiki, Notion o. Ä. außerhalb des Repos)

## Entscheidung

Option 1. Git löst Versionierung, Zuordnung (Blame/Author) und Rückholbarkeit
technisch bereits. Darüber liegt nur eine dünne Markdown-Schicht für das, was Git
nicht beantwortet: *wo stehen wir* (STAND) und *warum ist das so* (ADRs, WORKLOG).

## Konsequenzen

- Alles ist mergebar, reviewbar, diffbar, zurückrollbar und von jedem Werkzeug lesbar.
- Disziplinpflicht: STAND und WORKLOG müssen am Sitzungsende gepflegt werden
  (erzwungen über AGENTS.md und /wrap).
- Suche ist Volltext (`grep`) — kein semantisches Retrieval.

## Verworfene Alternativen — warum

**Externe Gedächtnis-Systeme (geprüft 2026-07-27, Anlass MemPalace):** Der Speicher
ist eine Binärdatenbank — nicht mergebar, nicht reviewbar, nicht im Diff lesbar,
nicht zurückrollbar. MemPalace ist laut eigener Aussage ein Einzelplatzwerkzeug
(mehrere Prozesse beschädigen den geteilten Speicher). Die viralen Benchmark-Zahlen
wurden nachträglich als geschönt korrigiert.

**Eigenes System:** wird immer eine schlechtere Version von Git.

## Wann neu prüfen

Wenn WORKLOG.md so groß wird, dass Volltextsuche nicht mehr trägt, oder Einarbeitung
regelmäßig an „das haben wir vor Monaten besprochen" scheitert. Erster Kandidat ist
dann NICHT MemPalace, sondern ein Suchindex ÜBER dem weiterhin in Markdown liegenden
Speicher — lesbar und versioniert bleibt Pflicht.
