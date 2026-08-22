# AGENTS.md — Regelsatz für alle Agenten und Menschen

Gilt für Claude Code, Codex, Cursor, Copilot, Gemini CLI und Menschen gleichermaßen.

## REGEL 0 — Wer arbeitet?

Vor jeder Dateiänderung prüfen: `git config user.name`.
Ist er leer oder generisch (root, user, Administrator, Claude):
den Menschen nach seinem Namen fragen und setzen:

    git config user.name "Vorname"

Ohne Namen keine Änderung.

## Sitzungsstart — Lesereihenfolge

1. `docs/STAND.md` — wo stehen wir gerade
2. `docs/WORKLOG.md` — die letzten drei Einträge
3. `docs/decisions/` — nur bei Architekturfragen

## Arbeitsablauf

- Erst holen, dann arbeiten: `git pull --rebase` vor Änderungen.
- Eine Session = ein Worktree = ein Branch `session/JJJJ-MM-TT-vorname`:

      git worktree add ../<projektordner>-vorname -b session/JJJJ-MM-TT-vorname

- Branch SOFORT pushen und Entwurfs-PR öffnen — bevor die Arbeit beginnt.
  Der Entwurfs-PR ist die Reservierung, an der alle sehen, woran gearbeitet wird.
- Wirkungsradius vor der ersten Änderung nennen (welche Dateien/Ordner);
  anhalten und Bescheid sagen, wenn er überschritten werden muss.
- Merge nur per Pull Request, nie direkt auf main.
- Am Ende: `git push` UND `git push --tags` — Tags gehen bei normalem Push nicht mit.
- **Erzeugte Bilder und Filme gehören NIE in einen Worktree.** `media/` ist
  ignoriert, entsteht also in jedem Checkout neu — und `git worktree remove`
  löscht es nach dem Merge mitsamt Inhalt. Am 21.08.2026 sind so echte,
  bezahlte Bilder verschwunden. Der Server biegt den Medienordner deshalb
  selbst auf das Hauptrepository um (`src/lib/mediaRoot.js`); wer daran
  arbeitet, liest erst den Dateikopf dort.

## Sitzungsende (Pflicht)

1. `docs/WORKLOG.md`: neuen Eintrag OBEN anhängen. Alte Einträge nie ändern.
2. `docs/STAND.md`: komplett überschreiben — zeigt immer nur die Gegenwart.
3. Committen (Conventional Commits), pushen, PR freigeben wenn fertig, Worktree aufräumen.

## Rollback

- VERBOTEN auf geteilten Branches: `git reset --hard`, `git push --force`.
- `/rewind` (doppeltes Esc) ist sitzungslokal und flüchtig: es erfasst nur Änderungen
  über Claudes Datei-Werkzeuge — nicht was per Bash gelöscht/verschoben wurde, nicht
  Handedits, nicht parallele Sessions. Gut für „die letzten zehn Minuten waren Unsinn".
- Checkpoints sind annotierte Git-Tags: geteilt, dauerhaft, überleben die Sitzung.
  Gut für „vor dem Umbau war es lauffähig". Bedienung: `node scripts/checkpoint.js`.
- `restore` schreibt die Historie NIE um: der alte Stand kommt als normale,
  noch zu committende Änderung zurück — auch das Zurückholen bleibt umkehrbar.

## Konflikte bei paralleler Arbeit

- `docs/WORKLOG.md` merged automatisch (union). `docs/STAND.md` absichtlich nicht:
  der Konflikt dort ist erwünscht und wird bewusst von Hand gelöst.
- `package-lock.json` nie von Hand lösen: eine Seite nehmen, `npm install` neu laufen lassen.
- Müssen zwei ans selbe Feature: nacheinander, nicht parallel.
- Geteilte Dateien stehen in `scripts/shared-files.json`; der Sitzungsstart warnt,
  wenn eine davon in einem fremden offenen PR auftaucht.

## Projektregeln

- Sprache — **zwei verschiedene Dinge, nicht verwechseln:**
  - **App-Oberfläche: Englisch.** Alle sichtbaren Texte, Platzhalter und
    Fehlermeldungen. Deutsch ist als *zweite* Sprache geplant, nicht als
    Ersatz. Alle Texte stehen in `src/i18n/en.js` — nirgends sonst; das macht
    die zweite Sprache zu einer neuen Datei statt zu einem Umbau.
  - **Übersetzungs-Stopp (Antons Ansage 21.08.2026):** Neue Texte werden nur
    noch in `en.js` und `de.js` gepflegt. Die übrigen fünf Sprachen
    (es/fr/zh/hi/ar) bekommen EINE Sammelübersetzung, wenn die App fast
    fertig ist — nicht bei jedem Feature („sonst übersetzen wir uns dumm
    und dämlich"). Fehlende Schlüssel fallen zur Laufzeit auf Englisch
    zurück (`withFallback` in `src/i18n/index.js`);
    `scripts/check-i18n-shape.mjs` zählt sie nur noch, statt zu meckern —
    diese Zählung ist die Arbeitsliste für die Sammelübersetzung.
  - **Doku und Commit-Nachrichten: Deutsch** (Conventional Commits:
    feat/fix/docs/chore). Codekommentare und Bezeichner: Englisch.
- Stack: Bun + Vanilla HTML/JS + Higgsfield-API-Proxy — siehe `docs/decisions/ADR-0002-stack-bun-vanilla-higgsfield.md`.
- Keine Secrets ins Repository: keine `.env`, keine Schlüssel, keine Tokens.
- Kein externes Gedächtnis-Werkzeug (Vektordatenbank, Memory-MCP, externer Dienst).
  Projektstand liegt als Markdown im Repository. Begründung: ADR-0001.
