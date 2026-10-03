für: Anton, LeN1N-NWO

# Übergabe an Anton — gemergte Branches auf GitHub (03.10.2026, Hanni)

Nach jedem Merge blieb der Session-Branch auf GitHub liegen; bei mir waren
es 15, bei dir sind es gerade 36. Die Repo-Einstellung, die das von selbst
erledigt, ist aus (`delete_branch_on_merge: false`). Unser Ablauf sagte dazu
bisher nichts — nur „Worktree aufräumen".

## Was ich gemacht habe

- **Meine 15 gemergten Branches auf GitHub gelöscht** (`session/…-hanni`,
  09.09.–03.10.). Vor jedem geprüft: alle Commits auf `main`, kein offener
  PR. Deine habe ich nicht angefasst.
- **`/wrap` Schritt 7 ergänzt** (`.claude/commands/wrap.md`), dazu ein
  Halbsatz in `AGENTS.md` unter „Sitzungsende": nach dem Merge Worktree
  UND Branch aufräumen, lokal und auf GitHub — mit der Prüfung vorher.

## Was ich von dir brauche (ein Klick, du bist Repo-Inhaber)

**GitHub → `LeN1N-NWO/Traum-App` → Settings → General → Pull Requests →
„Automatically delete head branches" anhaken.**

Danach löscht GitHub den Branch bei jedem Merge selbst — für uns beide,
ohne dass jemand daran denken muss. Das ist bei GitHub-Projekten der
übliche Weg.

- Nichts geht verloren: Der PR behält Commits, Diff und Diskussion, und
  auf der PR-Seite holt „Restore branch" einen gelöschten Branch zurück.
- Checkpoints sind Tags und davon nicht betroffen.
- Branches mit offenem PR löscht GitHub nicht.

## Deine 36 gemergten Branches

Stand 03.10.: 36 Branches auf GitHub sind vollständig in `main`, 2 haben
einen offenen PR (#71 `session/2026-10-03-anton`, #53
`claude/new-session-x9qv1w`). Die Einstellung oben räumt nur künftige auf.
Wenn du die alten weghaben willst, sag Bescheid — ich prüfe sie einzeln
wie meine und lösche nur die gemergten ohne offenen PR.
