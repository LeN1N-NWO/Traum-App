---
description: Session abschließen — Worklog + STAND fortschreiben, committen, pushen, PR freigeben
---

Schließe die aktuelle Arbeitssession sauber ab:

1. **Worklog fortschreiben:** Neuen Eintrag OBEN in `docs/WORKLOG.md` anhängen:
   Datum, Uhrzeit, Name (aus `git config user.name`), Branch, Commit-Hashes,
   was gemacht wurde, warum, und was der Nächste wissen muss. Alte Einträge nie ändern.
2. **STAND überschreiben:** `docs/STAND.md` komplett neu schreiben — nur Gegenwart:
   woran gearbeitet wird, bekannte Baustellen (mit Datei und Zeilennummer), nächste Schritte.
3. **Lint:** Falls `npm run lint` existiert, laufen lassen und Fehler beheben.
4. **Committen:** Conventional Commits (feat/fix/docs/chore …), aussagekräftige Nachricht.
5. **Pushen:** `git push` UND `git push --tags`.
6. **PR:** Wenn die Arbeit fertig ist, den Entwurfs-PR freigeben
   (`gh pr ready`), sonst als Entwurf stehen lassen und im PR-Text den Zwischenstand notieren.
7. **Aufräumen:** Nach dem Merge den Worktree entfernen:
   `git worktree remove ../<projektordner>-<vorname>` und `git worktree prune`.
