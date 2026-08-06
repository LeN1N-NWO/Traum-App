# SETUP — Einrichtung auf einem neuen Rechner in zehn Minuten

## 0. Zugriff bekommen (einmalig, pro Person)

Das Repository ist privat. Bevor irgendetwas geklont werden kann:

1. Du brauchst einen (kostenlosen) GitHub-Account: https://github.com/signup
2. Sag dem Repo-Besitzer deinen GitHub-Benutzernamen.
3. Der Besitzer lädt dich ein (siehe „Für den Besitzer" unten).
4. Du bekommst eine E-Mail „Invitation to collaborate" — dort **Accept invitation**
   klicken (alternativ: https://github.com/notifications). Die Einladung verfällt
   nach 7 Tagen.

**Für den Besitzer — Mitarbeiter einladen:**
Auf github.com → Repository → *Settings* → *Collaborators* → *Add people* →
GitHub-Namen eingeben → Rolle **Write** wählen.
Oder per GitHub CLI:

    gh api --method PUT repos/LeN1N-NWO/Traum-App/collaborators/<github-name> -f permission=push

Berechtigungen: `pull` (nur lesen) · `push` (schreiben — der Normalfall) ·
`maintain` (plus Einstellungen) · `admin` (alles, inklusive löschen).
Ab etwa vier Personen: GitHub-Organisation mit Teams statt Einzeleinladungen.

## 1. Voraussetzungen installieren

- **Git**: https://git-scm.com/downloads (Windows: Git for Windows; Mac: `xcode-select --install`)
- **Node.js ≥ 20**: https://nodejs.org (LTS reicht)
- **Claude Code**: `npm install -g @anthropic-ai/claude-code` — oder Desktop-App
- **GitHub CLI** (empfohlen, für PRs und die PR-Warnungen beim Sitzungsstart):
  https://cli.github.com — danach einmalig `gh auth login`
  (GitHub.com → HTTPS → Login with a web browser)

## 2. Klonen

**Wichtig:** NICHT in einen Google-Drive-, OneDrive- oder Dropbox-Ordner klonen.
Diese Dienste synchronisieren den .git-Ordner dateiweise und in beliebiger
Reihenfolge — das Repository wirkt danach beschädigt. Lokaler Ordner, fertig.

    git clone https://github.com/LeN1N-NWO/Traum-App.git
    cd Traum-App

(Mit `gh`: `gh repo clone LeN1N-NWO/Traum-App`)

## 3. Namen setzen (Pflicht — REGEL 0)

    git config user.name "DeinVorname"
    git config user.email "deine@mail.de"

Ohne gesetzten Namen verweigern die Regeln jede Dateiänderung — absichtlich,
damit jeder Commit automatisch dem richtigen Menschen zugeordnet ist.

## 4. Starten

    claude

Im Chat dann `/start` eingeben — das klärt den Nutzer, holt den aktuellen Stand,
legt Worktree + Branch an und öffnet den Entwurfs-PR.

Sobald ein package.json existiert, kommt hier dazu: `npm install`, `npm run dev`.

## Etwas kaputt gemacht?

Vom mildesten Mittel aufwärts — im Zweifel `/rollback` im Chat, das führt durch:

| Situation | Befehl |
|---|---|
| Datei verändert, noch nicht committet | `git restore <datei>` |
| Alles Uncommittete verwerfen, aber aufheben | `git stash` (zurück: `git stash pop`) |
| Letzten eigenen Commit ungeschehen machen | `git revert HEAD` |
| Zurück zu einem Checkpoint | `node scripts/checkpoint.js list` dann `node scripts/checkpoint.js restore <name>` |
| Nur nachsehen, wie es früher aussah | `git log --oneline` / `git show <commit>:<datei>` |

NIEMALS auf geteilten Branches: `git reset --hard`, `git push --force`.
Checkpoint-`restore` schreibt keine Historie um — es holt den alten Stand als
normale, noch zu committende Änderung zurück und ist damit selbst umkehrbar.
