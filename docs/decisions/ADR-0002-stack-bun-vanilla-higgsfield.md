# ADR-0002: Bun + Vanilla HTML/JS + Higgsfield-API als Stack

**Status:** angenommen · **Datum:** 2026-08-06 · **Format:** MADR

## Kontext

Die App (Traum → Bildsequenz/Film) wurde vor Anlage dieses Repos bereits als
funktionierender Prototyp gebaut und mit echter Higgsfield-Generierung getestet.
STAND.md verlangt, den Stack jetzt als ADR festzuhalten, statt ihn unentschieden
zu lassen.

## Betrachtete Optionen

1. **Bun + einzelnes `index.html` (vanilla JS) + schlanker Bun-Server als API-Proxy**
2. Node.js + Express + ein Frontend-Framework (React/Vite)
3. Next.js Full-Stack

## Entscheidung

Option 1. Die App ist bewusst klein gehalten: eine Datei als Frontend (Voice-Input,
Modus-/Cast-Auswahl, Menagerie, Streak — alles client-seitig, localStorage), ein
schlanker `server.js` als einziger Zweck: den Higgsfield-API-Key serverseitig zu
halten und `/api/generate` zu proxen. Bun, weil es Server + Package-Runner in
einem ist und kein Build-Schritt nötig ist.

## Konsequenzen

- Kein Framework-Overhead, kein Build-Step — `bun server.js` reicht.
- Kein Login/keine Datenbank: Zustand (Menagerie, Streak, Cast-Fotos) lebt in
  `localStorage` des Browsers. Mehrgeräte-Sync ist damit bewusst nicht vorhanden.
- Der Higgsfield-Key liegt ausschließlich in `.env` (server-seitig, nie im Git,
  nie im Browser) — siehe `.env.example`.
- Wächst die App über eine Seite hinaus, wird dieses ADR durch ein neues ersetzt
  (z. B. wenn Multi-User-Accounts oder eine echte DB nötig werden).

## Verworfene Alternativen — warum

**Express + React/Vite:** unnötiger Build-Schritt und mehr bewegliche Teile für
eine App, die aktuell eine einzige Seite mit einem API-Aufruf ist.

**Next.js:** Overkill für eine reine Client-App mit einem schmalen Backend-Proxy;
würde Server-Rendering/Routing einführen, das hier niemand braucht.
