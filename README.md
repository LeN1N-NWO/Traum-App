# Traum-App (Dream Rushes)

Traum reinsprechen oder tippen → daraus wird eine 10-Bild-Kinosequenz (fal.ai,
Nano Banana 2) oder ein 15-Sekunden-Film (fal.ai, MiniMax H3 image-to-video),
mit dem eigenen Gesicht in jedem Frame. DeepSeek schreibt dabei optional den
Bild-Prompt. Jeder Traum hinterlässt außerdem ein sammelbares Wesen und zählt
auf eine tägliche Streak ein.

## Einstieg

- **Neu im Team?** → [docs/ANLEITUNG.md](docs/ANLEITUNG.md) — einfach erklärt, Schritt für Schritt
- **Technische Einrichtung** → [docs/SETUP.md](docs/SETUP.md)
- **Wo stehen wir?** → [docs/STAND.md](docs/STAND.md)
- **Was ist zuletzt passiert?** → [docs/WORKLOG.md](docs/WORKLOG.md)
- **Warum ist das so?** → [docs/decisions/](docs/decisions/)
- **Die Regeln** → [AGENTS.md](AGENTS.md) (gelten für Menschen UND KI-Agenten)

## Arbeitsweise in einem Satz

Jede Session bekommt einen eigenen Branch und Worktree, reserviert sich per
Entwurfs-PR, und schreibt am Ende STAND und WORKLOG fort — im Chat: `/start`
zum Anfangen, `/wrap` zum Abschließen, `/checkpoint` vor riskanten Umbauten,
`/rollback` wenn etwas schiefging.

## App starten

Beim Entwickeln — Oberfläche auf 5173 mit Hot Reload, API auf 8100:

    bun install
    cp .env.example .env        # dann FAL_KEY eintragen (DEEPSEEK_KEY optional)
    bun run dev                 # → http://localhost:5173

Produktionsnah — alles auf einem Port:

    bun run build && bun server.js    # → http://localhost:8100

`bun server.js` allein genügt seit dem Vite-Umbau (ADR-0004) **nicht** mehr:
der Server liefert `dist/` aus, das erst gebaut werden muss. Ohne Build
antwortet alles mit 404.

Tests:

    bun run test                # Unit-Tests + Dateifreigabe + Prompt-Hygiene

## Schlüssel und Absicherung

fal.ai-Key besorgen unter **fal.ai/dashboard/keys**, DeepSeek-Key optional unter
**platform.deepseek.com**. Beide bleiben serverseitig in `server.js` — der
Browser bekommt sie nie zu sehen, und das gilt auch für die später geplante
iPhone-App: ein App-Bundle ist extrahierbar.

Die Web-Wurzel ist `dist/`, also der Build. Damit liegen `.env`, `.git/`,
`docs/` und der Servercode selbst außerhalb dessen, was überhaupt auflösbar ist
— zusätzlich zur Freigabeliste in `server.js`, die nur `/index.html`,
`/assets/*` und `/clips/*` erlaubt. Abgesichert durch
`node scripts/test-static.mjs`.

Details, Model-Slugs und Deploy-Hinweise: siehe `server.js`-Kommentare und
`docs/STAND.md`.
