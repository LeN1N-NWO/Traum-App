# Traum-App (Dream Rushes)

Traum reinsprechen oder tippen → daraus wird eine 10-Bild-Kinosequenz (Nano Banana,
Deakins-Framing) oder ein 15-Sekunden-Film (Seedance), mit dem eigenen Gesicht in
jedem Frame. Jeder Traum hinterlässt außerdem ein sammelbares Wesen und zählt auf
eine tägliche Streak ein.

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

Statische Vorschau (keine echte Generierung, zeigt Beispiel-Inhalte):

    python3 -m http.server 8100 --bind 127.0.0.1

⚠️ **`--bind 127.0.0.1` nicht weglassen, und die Vorschau nicht starten, sobald
`.env` existiert.** Dieser Einzeiler ist Pythons Standard-Dateiserver: er kennt
keine Freigabeliste und liefert *alles* im Ordner aus — auch `.env` mit deinem
Higgsfield-Key. Ohne `--bind` lauscht er zusätzlich auf allen Netzwerk-
Schnittstellen, ist also für jeden im selben WLAN erreichbar. Die Absicherung in
`server.js` greift hier nicht, weil dieser Weg daran vorbeigeht.

Echte Generierung (braucht Bun + einen Higgsfield-API-Key):

    bun install
    cp .env.example .env        # dann HF_CREDENTIALS eintragen
    bun server.js               # → http://localhost:8100

Key besorgen unter **cloud.higgsfield.ai** (API Keys). Der Key bleibt serverseitig
in `server.js` — der Browser bekommt ihn nie zu sehen: `server.js` liefert nur
`index.html` und `clips/*` aus, alles andere ist 404 (abgesichert durch
`node scripts/test-static.mjs`). Details, Model-Slugs und Deploy-Hinweise: siehe
`server.js`-Kommentare und `docs/decisions/ADR-0002-stack-bun-vanilla-higgsfield.md`.
