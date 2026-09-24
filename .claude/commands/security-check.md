---
description: Sicherheitscheck — mechanische Prüfung plus Agent security-expert, Ergebnis als PDF-Bericht außerhalb des Repos
argument-hint: "[schnell | Schwerpunkt, z. B. \"nur Anmeldung\"]"
---

Führe den Sicherheitscheck der Traum-App aus. Du änderst dabei NICHTS am
Projekt — kein Fix, kein `bun audit fix`, kein Commit. Befunde beheben ist
eine eigene Sitzung, die Hanni oder Anton beauftragen.

Der Bericht gehört NIE ins Repository (es ist öffentlich, und ein Bericht
über offene Lücken ist eine Anleitung). Ablage: `~/Claude/Sicherheitsberichte/`.
Zwischendateien nur im Scratchpad bzw. `$TMPDIR`, nie im Projektordner.

1. **Mechanischer Teil:** `bun scripts/security-check.mjs` im Projektordner
   laufen lassen, Ausgabe zeigen. Danach dasselbe mit `--json` in eine
   Zwischendatei (`check.json`).
   - Bei `$ARGUMENTS` = `schnell`: beide Male mit `--no-history --offline`.
   - Ausgang 2 (Selbsttest rot) → hier abbrechen und das melden: ein Lauf
     mit stumpfen Detektoren meldet „nichts gefunden“ und lügt damit.
   - Ausgang 1 heißt nur „es gibt ❌“ — weitermachen.

2. **Letzter Lauf:** Die jüngste `JJJJ-MM-TT-HHMMSS.json` in
   `~/Claude/Sicherheitsberichte/` ist „seit wann“. Aus ihr `meta.date` und
   die Liste der `key`s mit Titel lesen. Gibt es keine, sag das.

3. **Urteilsteil:** Agent `security-expert` starten. Mitgeben: den Inhalt
   von `check.json`, Datum und `key`s des letzten Laufs, Branch und kurzen
   Commit-Hash, und `$ARGUMENTS` als Schwerpunkt, falls es einer ist. Er
   antwortet mit einem ```json-Block.

4. **PDF setzen:** Die Antwort des Agenten unverändert in eine
   Zwischendatei (`bericht.json`) schreiben und
   `bun scripts/security-report.mjs bericht.json --mech check.json`
   laufen lassen.
   - Ausgang 1 „unvollständig“ → dem Agenten die Fehlerliste zurückgeben
     (SendMessage) und seinen korrigierten Block erneut setzen. Nicht selbst
     Befunde umschreiben.
   - Ausgang 1 „geheimnisartige Stelle“ → dem Agenten Zeile und Muster
     nennen, er ersetzt den Wert durch Datei:Zeile. Den Wert selbst NICHT
     anzeigen.
   - Ausgang 2 → Umgebungsproblem (Chrome, Zielordner) melden.
   Danach die Zwischendateien löschen und das PDF mit `open` öffnen.

5. **Zusammenfassen:** Pfad des PDFs, Gesamtbewertung, die Befunde der
   Stufen Kritisch und Hoch mit je einem Satz Schaden und nächstem Schritt,
   was seit dem letzten Lauf neu bzw. behoben ist. Frag, ob und welche
   Befunde in einer eigenen Sitzung behoben werden sollen.
