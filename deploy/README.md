# deploy/ — Dream Rushes auf dem Hetzner-VPS

Einrichtung und Deploy der API auf Antons VPS (`ubuntu-4gb-fsn1-2`,
Falkenstein). Grundlage: `docs/plans/2026-09-24-hosting.md`, Bedingung 5
in `docs/plans/2026-09-24-medienablage.md`.

| Datei | Zweck |
|---|---|
| `setup.sh` | Einmal: Pakete, Updates, Bun, Systemnutzer, Ordner, Caddy, systemd, Firewall |
| `deploy.sh` | Jedes Mal: Stand holen, `.env` prüfen, Neustart, Gesundheitscheck, bei Fehler zurück |
| `check-env.mjs` | Hält den Start an, wenn `API_TOKEN` oder `DREAMRUSHES_MEDIA` fehlen/falsch sind |
| `dreamrushes.service` | systemd-Dienst, abgeschottet, schreibt nur unter `/var/lib/dreamrushes` |
| `Caddyfile` | HTTPS, Sicherheits-Kopfzeilen, sperrt die Entwicklungs-Routen zusätzlich |

## Aufbau auf dem Server

```
/opt/dreamrushes/app          Checkout (gehört root, Dienst liest nur)
/var/lib/dreamrushes/media    Medien, Aufträge (gehört dem Dienst)
/var/lib/dreamrushes/data     Träume-Sicherung (legt server.js selbst an)
/etc/dreamrushes/dreamrushes.env   Geheimnisse (root schreibt, Dienst liest)
```

Der Dienst läuft als Systemnutzer `dreamrushes` ohne Login. Von außen offen:
22, 80, 443. Port 8100 nur über Caddy.

## Vorher (Hetzner Console / Strato)

1. ✅ DNS bei Strato: A-Eintrag `api.dreamrushes.app` → `188.245.92.121`
   (gesetzt, geprüft 25.09.). AAAA erst, wenn die IPv6-Adresse des Servers
   belegt ist.
2. Hetzner Console → Firewall: eingehend nur 22, 80, 443 (TCP) und 443 (UDP).
3. Hetzner Console → Snapshots/Backups einschalten.

## Einrichten

Auf dem Server, als Nutzer mit `sudo`:

```bash
sudo git clone https://github.com/LeN1N-NWO/Traum-App.git /opt/dreamrushes/app
sudo bash /opt/dreamrushes/app/deploy/setup.sh api.dreamrushes.app
```

Das Skript darf mehrmals laufen. Fehlt die `.env`, richtet es alles andere
ein und sagt am Ende, was noch zu tun ist.

## Die `.env` des Servers

Legt ein Mensch von Hand an — Schlüssel gehören nicht ins Repo, nicht in ein
Skript und nicht in den Chat. Vorlage: `.env.example`.

```bash
sudo install -m 640 -o root -g dreamrushes /dev/null /etc/dreamrushes/dreamrushes.env
sudo nano /etc/dreamrushes/dreamrushes.env
```

Pflicht auf dem Server (sonst startet der Dienst nicht):

```
API_TOKEN="…"                       # openssl rand -hex 32
DREAMRUSHES_MEDIA=/var/lib/dreamrushes/media
```

Dazu die Dienst-Schlüssel wie lokal (`FAL_KEY`, `DEEPSEEK_KEY`, `GEMINI_KEY`,
`DATABASE_URL`, Supabase, Apple). `PORT` weglassen oder `8100`.
Den Apple-Schlüssel wie in `.env.example`: in doppelten Anführungszeichen,
Zeilenumbrüche als `\n` — Bun liest die Datei selbst (`--env-file`).

Prüfen, ohne zu starten:

```bash
sudo -u dreamrushes bun --env-file=/etc/dreamrushes/dreamrushes.env /opt/dreamrushes/app/deploy/check-env.mjs
```

## Deployen

```bash
sudo bash /opt/dreamrushes/app/deploy/deploy.sh             # origin/main
sudo bash /opt/dreamrushes/app/deploy/deploy.sh 1a2b3c4     # bestimmter Stand
```

Antwortet der Server nach dem Neustart nicht innerhalb von 30 Sekunden auf
`/api/prices` (mit Token), geht der Deploy von selbst auf den vorigen Stand
zurück. Liegen im Checkout Handänderungen, bricht er ab, statt sie zu
überschreiben.

Nachsehen:

```bash
systemctl status dreamrushes
journalctl -u dreamrushes -f
```

## ⚠ Bevor die App diesen Server benutzt

1. **`API_TOKEN` sperrt heute die App aus.** Mit gesetztem Token verlangt
   der Türsteher (`src/lib/gatekeeper.js`) den Kopf `x-api-token` auf JEDER
   `/api/`-Route, auch Anmeldung und Träume — und die App schickt ihn nicht
   (`.env.example`, Befund S1). Ohne Token wären die bezahlten Routen für
   jeden im Internet offen. `check-env.mjs` verlangt das Token deshalb: Der
   Server ist lieber zu als offen, bis S1 gelöst ist.
2. **Das Rate-Limit zählt hinter Caddy alle zusammen.** `server.js` nimmt die
   Absender-IP von Bun (`server.requestIP`), und hinter Caddy ist das für
   jede Anfrage `127.0.0.1`. Alle Nutzer teilten sich dann 10 Anmeldungen
   und 20 Bilder pro Minute; einer könnte alle aussperren. Befund S5 in
   `docs/ARCHITEKTUR.md`; der Kommentar über `guard(` in `server.js` sagt
   es ebenfalls voraus. Lösung: hinter dem
   Proxy `X-Forwarded-For` lesen — Caddy (ab 2.5, ohne `trusted_proxies`)
   ersetzt eine mitgeschickte Kopfzeile durch die echte Adresse, man kann
   sie also nicht fälschen. Vor dem Umbau auf dem Server nachprüfen. Änderung in
   `server.js`, nach Antons PR #62.
