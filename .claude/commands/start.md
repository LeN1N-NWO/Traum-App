---
description: Session starten — Nutzer klären, pullen, Worktree + Branch + Entwurfs-PR anlegen
---

Starte eine neue Arbeitssession. Führe die Schritte in dieser Reihenfolge aus und
brich ab, wenn Schritt 1 nicht erfüllt ist:

1. **Nutzer klären (BLOCKIEREND):** Prüfe `git config user.name`. Ist er leer oder
   generisch (root, user, Administrator, Claude), frage den Menschen nach seinem
   Vornamen und setze ihn mit `git config user.name "<Vorname>"`. Ohne Namen geht
   es nicht weiter.
2. **Holen:** `git fetch origin` und auf main `git pull --rebase origin main`.
3. **Stand laden:** Lies `docs/STAND.md`, die letzten drei Einträge aus
   `docs/WORKLOG.md`, und fasse beides in drei Sätzen zusammen.
4. **Worktree + Branch anlegen:** `git worktree add ../<projektordner>-<vorname> -b session/<JJJJ-MM-TT>-<vorname>`
   und dorthin wechseln. Datum = heute.
5. **SOFORT reservieren:** Branch pushen (`git push -u origin session/<...>`) und
   Entwurfs-PR öffnen (`gh pr create --draft --title "session/<...>" --body "Reservierung — Dateiliste wächst mit den Pushes."`).
   Falls `gh` fehlt: sage das deutlich und gib den Link zum manuellen PR-Anlegen aus.
6. **Wirkungsradius ansagen:** Frage den Menschen, was in dieser Session gemacht
   werden soll, und nenne VOR der ersten Änderung, welche Dateien/Ordner du
   voraussichtlich anfasst. Halte an und sage Bescheid, wenn du darüber hinaus musst.
