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
cd /opt/dreamrushes/app && sudo -u dreamrushes bun --no-install --env-file=/etc/dreamrushes/dreamrushes.env deploy/check-env.mjs
```

## Deployen

```bash
sudo bash /opt/dreamrushes/app/deploy/deploy.sh             # origin/main
sudo bash /opt/dreamrushes/app/deploy/deploy.sh 1a2b3c4     # bestimmter Stand
```

Antwortet der Server nach dem Neustart nicht nach rund 30 Versuchen (je eine Sekunde Abstand) auf
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

   **Der Ersatz ist gebaut, aber noch aus (03.10.2026):** Mit
   `REQUIRE_AUTH=1` verlangt der Server für alles, was Geld kostet, eine
   gültige Anmeldung statt eines gemeinsamen Tokens; Anmeldung, Preise und
   Hörprobe bleiben offen (`needsAccount()` in `src/lib/gatekeeper.js`).
   Erst wenn die App das Token überall mitschickt (S1 Schritt 2, Plan in
   `docs/ARCHITEKTUR.md`), kommt `Environment=REQUIRE_AUTH=1` in
   `dreamrushes.service` und `API_TOKEN` fällt weg.
2. **Rate-Limit hinter Caddy (S5) — gelöst am 03.10.2026, auf dem Server
   noch nachzuprüfen.** Hinter Caddy kommt jede Verbindung von `127.0.0.1`;
   ohne Abhilfe teilten sich alle Nutzer einen Zähler. Jetzt nimmt
   `senderOf()` (`src/lib/gatekeeper.js`) die Adresse aus `X-Forwarded-For`
   — nur wenn `TRUST_PROXY=1` gesetzt ist (steht in `dreamrushes.service`)
   und die Verbindung von Loopback kommt. Das ist sicher, weil Caddy (ab 2.5,
   ohne `trusted_proxies`) eine mitgeschickte Kopfzeile verwirft und durch
   die echte Adresse ersetzt. **Beim ersten Lauf prüfen:** elf Anmeldungen
   mit gefälschter Kopfzeile von außen —

   ```bash
   for i in $(seq 11); do curl -s -o /dev/null -w '%{http_code} ' -X POST -H "x-forwarded-for: 1.2.3.$i" https://api.dreamrushes.app/api/auth/login; done
   ```

   Die elfte muss `429` sein, obwohl jede Anfrage eine andere Adresse
   behaupten könnte — und ein zweites Gerät (anderes Netz) muss danach
   trotzdem durchkommen.
