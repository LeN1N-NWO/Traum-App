---
description: Sicherheitscheck — mechanische Prüfung plus Agent security-expert, Bericht außerhalb des Repos
argument-hint: "[schnell | Schwerpunkt, z. B. \"nur Anmeldung\"]"
---

Führe den Sicherheitscheck der Traum-App aus. Du änderst dabei NICHTS am
Projekt — kein Fix, kein `bun audit fix`, kein Commit. Befunde beheben ist
eine eigene Sitzung, die Hanni oder Anton beauftragen.

1. **Mechanischer Teil:** `bun scripts/security-check.mjs` im Projektordner
   laufen lassen und die Ausgabe vollständig zeigen.
   - Bei `$ARGUMENTS` = `schnell`: mit `--no-history --offline`.
   - Ausgang 2 (Selbsttest rot) → hier abbrechen und das melden: ein Lauf
     mit stumpfen Detektoren meldet „nichts gefunden“ und lügt damit.
   - Ausgang 1 heißt nur „es gibt ❌“ — weitermachen.

2. **Letzter Lauf:** Berichte liegen in `~/Claude/Sicherheitsberichte/`
   (bewusst außerhalb jedes Repositorys — das Repo ist öffentlich, und ein
   Bericht über offene Lücken ist eine Anleitung). Das jüngste Datum dort
   ist „seit wann“. Gibt es keinen, sag das.

3. **Urteilsteil:** Agent `security-expert` starten. Mitgeben: die
   JSON-Ausgabe von `bun scripts/security-check.mjs --json` (bei `schnell`
   mit denselben Schaltern), das Datum des letzten Laufs, Branch und Commit,
   und `$ARGUMENTS` als Schwerpunkt, falls es einer ist.

4. **Bericht ablegen:** Die Antwort des Agenten unverändert nach
   `~/Claude/Sicherheitsberichte/<JJJJ-MM-TT>-<HHMM>.md` schreiben (Ordner
   bei Bedarf anlegen). Vorher prüfen, dass kein Geheimniswert darin steht —
   Muster aus `src/lib/securityScan.js` per `bun -e` über die Datei, zählen,
   nicht mit `grep`.

5. **Zusammenfassen:** Die ❌-Befunde mit je einem Satz Schaden und dem
   vorgeschlagenen nächsten Schritt, dann die Zahl der ⚠️ und was neu seit
   dem letzten Lauf ist. Frag, ob und welche Befunde in einer eigenen
   Sitzung behoben werden sollen.
