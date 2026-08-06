---
description: Durch die Rückhol-Entscheidung führen — vom mildesten Mittel aufwärts
---

Der Mensch will etwas zurückholen. Führe ihn durch die Entscheidung, vom mildesten
Mittel aufwärts. Frage zuerst: WAS soll zurück, und ist es schon committet/gepusht?

1. **Nur die letzten Minuten dieser Claude-Session:** `/rewind` (doppeltes Esc) —
   aber sage dazu: es erfasst nur Änderungen über Claudes Datei-Werkzeuge, nicht
   Bash-Löschungen, Handedits oder parallele Sessions.
2. **Eine Datei, noch nicht committet:** `git restore <datei>`
3. **Alles Uncommittete, aber aufheben:** `git stash` (zurück mit `git stash pop`)
4. **Ein bestimmter Commit war falsch:** `git revert <hash>` — erzeugt einen
   Gegen-Commit, Historie bleibt intakt.
5. **Zurück zu einem Checkpoint:** `node scripts/checkpoint.js list`, dann
   `node scripts/checkpoint.js restore <name>`. Das holt den alten Stand als
   normale, noch zu committende Änderung zurück — danach ansehen, committen.

VERBOTEN auf geteilten Branches: `git reset --hard`, `git push --force`.
Erkläre vor jedem Schritt in einem Satz, was er tut und ob er umkehrbar ist.
