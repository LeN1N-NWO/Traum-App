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
7. **Aufräumen nach dem Merge** — vorher prüfen, dass nichts fehlt:
   `git log origin/main..<branch>` muss leer sein, und im Worktree darf kein
   `media/` liegen (`git worktree remove` löscht ihn mit).
   - Worktree: `git worktree remove ../<projektordner>-<vorname>` und `git worktree prune`.
   - Lokaler Branch: `git branch -d <branch>`. Meldet Git „nicht gemergt",
     obwohl der Log oben leer ist (es vergleicht dann mit dem Remote-Branch),
     ist `git branch -D <branch>` sicher.
   - Branch auf GitHub: löscht GitHub nach dem Merge selbst, wenn im Repo
     „Automatically delete head branches" an ist (Übergabe an Anton
     03.10.2026). Sonst von Hand: `git push origin --delete <branch>`.
     Der PR behält Commits und Verlauf; „Restore branch" auf der PR-Seite
     holt ihn bei Bedarf zurück.
