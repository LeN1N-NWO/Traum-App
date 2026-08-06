@AGENTS.md

Nur Claude-Code-Spezifisches ab hier — alles, was für alle Agenten gilt, steht in AGENTS.md.

- Slash-Befehle: `/start`, `/wrap`, `/checkpoint`, `/rollback` (in `.claude/commands/`).
- Der SessionStart-Hook (`scripts/session-start.js`) zeigt beim Chatstart automatisch:
  wer arbeitet, Branch/Worktree, letzte Commits, STAND.md, letzte Worklog-Einträge,
  ob der lokale Stand veraltet ist, und offene PRs der anderen.
- `/rewind` ersetzt die Checkpoints NICHT — Unterschied steht in AGENTS.md unter Rollback.
