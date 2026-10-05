# deploy/ — Dream Rushes auf dem Hetzner-VPS

Einrichtung und Deploy der API auf Antons VPS **„Dreamrushes“** (Hetzner
Cloud CX23, x86, #167324557, Falkenstein, Ubuntu 26.04 LTS; IPv4
`188.245.92.121`, IPv6-Netz `2a01:4f8:c013:ace3::/64`). ⚠ Im selben Projekt
liegt ein zweiter Server `ubuntu-4gb-fsn1-1` (CAX11, ARM) — nicht der für die
App. Grundlage: `docs/plans/2026-09-24-hosting.md`, Bedingung 5 in
`docs/plans/2026-09-24-medienablage.md`.

**Erster Lauf: 05.10.2026 (Hanni), Stand `ef91974` — läuft.** Von außen
geprüft: HTTPS (Let's Encrypt), HTTP → HTTPS, Sicherheits-Kopfzeilen, S1
(`/api/generate` ohne Konto → 401), S2 (`/api/media-key` ohne Konto → 401,
unsignierte Medien → 404), S5 (elfte Anmeldung trotz gefälschter Kopfzeile →
429), Entwicklungs-Routen 404, Port 8100 von außen zu.

| Datei | Zweck |
|---|---|
| `setup.sh` | Einmal: Pakete, Updates, Bun, Systemnutzer, Ordner, Caddy, systemd, Firewall |
| `deploy.sh` | Jedes Mal: Stand holen, `.env` prüfen, Neustart, Gesundheitscheck, bei Fehler zurück |
| `check-env.mjs` | Hält den Start an, wenn Supabase, `MEDIA_SECRET` oder `DREAMRUSHES_MEDIA` fehlen/falsch sind oder ein altes `API_TOKEN` gesetzt ist |
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

## Zugang (einmalig, wie am 05.10. gemacht)

Ein eigener Login-Nutzer mit `sudo`, nur mit SSH-Schlüssel. Ohne vorhandenen
Zugang geht es über die **Web-Konsole** der Hetzner Console (Symbol `>_`)
als `root` (Passwort über *Rescue → Reset root password*, nur mit Antons
Okay — es gilt nur für diesen Server).

⚠ **Die Web-Konsole tippt Eingefügtes Taste für Taste nach** und verliert
dabei Shift: `_ : @ " | &` kommen als `- ; 2 ' \ 7` an. Ein Befehl mit
offenem Anführungszeichen lässt die Shell auf `>` warten — **Strg + C**.
Deshalb dort nur tippen, nach `loadkeys de` (für das y die Taste Z drücken);
auf Mac-Tastaturen liegt `>` dann auf **Shift + ^**. Unterstriche nach dem
Tippen kontrollieren.

Der öffentliche Schlüssel kommt über GitHub (`github.com/<name>.keys`) auf
den Server, damit niemand 750 Zeichen abtippen muss — vorher den
Mac-Schlüssel (`~/.ssh/id_rsa.pub`) im GitHub-Konto hinterlegen:

```bash
useradd -m -s /bin/bash -G sudo hanni
mkdir -p /home/hanni/.ssh
curl -fsSL -o /home/hanni/.ssh/authorized_keys https://github.com/H4nn40x.keys
chown -R hanni:hanni /home/hanni/.ssh
chmod 700 /home/hanni/.ssh
chmod 600 /home/hanni/.ssh/authorized_keys
passwd hanni        # für sudo
```

Danach alles Weitere im Mac-Terminal per `ssh`, dort funktioniert Einfügen.

**SSH nur mit Schlüssel** — `setup.sh` warnt nur, ändert sshd bewusst nicht.
Erst prüfen, dass der Schlüssel-Login klappt, dann:

```bash
sudo tee /etc/ssh/sshd_config.d/10-nur-schluessel.conf >/dev/null <<'EOF'
PasswordAuthentication no
KbdInteractiveAuthentication no
EOF
sudo sshd -t && sudo systemctl reload ssh
```

(`10-` vor Ubuntus `50-cloud-init.conf`: bei sshd gilt der erste Wert.)
Gegenprobe aus einem zweiten Terminal, die laufende Sitzung offen lassen:
`ssh -o PubkeyAuthentication=no -o PreferredAuthentications=password …` muss
mit „Permission denied (publickey)“ scheitern.

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
SUPABASE_URL="…"                    # Anmeldung — Bezahltes nur mit Konto (S1)
SUPABASE_ANON_KEY="…"
DREAMRUSHES_MEDIA=/var/lib/dreamrushes/media
MEDIA_SECRET="…"                    # S2: Medien nur an den Besitzer — openssl rand -hex 32
```

`MEDIA_SECRET` einmal erzeugen und nie wechseln, solange Nutzer da sind:
Ein neues Geheimnis macht alle ausgegebenen Medienadressen sofort
ungültig (die App holt sich zwar binnen 10 Minuten einen neuen Schlüssel,
aber laufende Filme brechen ab). Nirgends sonst ablegen — nicht im Repo,
nicht im Chat.

**Kein `API_TOKEN`** — das alte gemeinsame Geheimnis sperrt die App aus;
`check-env.mjs` hält den Start an, wenn es gesetzt ist.

Dazu die Dienst-Schlüssel wie lokal (`FAL_KEY`, `DEEPSEEK_KEY`, `GEMINI_KEY`,
`DATABASE_URL`, Supabase, Apple). `PORT` weglassen oder `8100`.
Den Apple-Schlüssel wie in `.env.example`: in doppelten Anführungszeichen,
Zeilenumbrüche als `\n` — Bun liest die Datei selbst (`--env-file`).

**So am 05.10. gemacht — die Werte erscheinen nirgends auf dem Bildschirm:**
Vom Mac aus nur die gebrauchten Zeilen der lokalen `.env` übertragen,
`MEDIA_SECRET` erst auf dem Server erzeugen:

```bash
# Mac:
grep -E '^(SUPABASE_URL|SUPABASE_ANON_KEY|DATABASE_URL|FAL_KEY|DEEPSEEK_KEY|GEMINI_KEY|APPLE_TEAM_ID|APPLE_SIGNIN_KEY_ID|APPLE_SIGNIN_KEY)=' ~/Claude/Traum-App/.env | ssh hanni@188.245.92.121 'umask 077 && cat > ~/dr.env && wc -l < ~/dr.env'
# Server:
printf 'DREAMRUSHES_MEDIA=/var/lib/dreamrushes/media\nMEDIA_SECRET="%s"\n' "$(openssl rand -hex 32)" >> ~/dr.env
sudo install -m 640 -o root -g dreamrushes ~/dr.env /etc/dreamrushes/dreamrushes.env && shred -u ~/dr.env
sudo grep -oE '^[A-Z_]+=' /etc/dreamrushes/dreamrushes.env   # nur Namen
```

`DATABASE_URL` ist die eingeschränkte Rolle `dreamrushes_server`, nie
`postgres`. `TESTUSER`/`TESTPASS` gehören nicht auf den Server.

Prüfen, ohne zu starten:

```bash
cd /opt/dreamrushes/app && sudo -u dreamrushes bun --no-install --env-file=/etc/dreamrushes/dreamrushes.env deploy/check-env.mjs
```

## Deployen

```bash
sudo bash /opt/dreamrushes/app/deploy/deploy.sh             # origin/main
sudo bash /opt/dreamrushes/app/deploy/deploy.sh 1a2b3c4     # bestimmter Stand
```

Statische Dateien: Es gibt auf dem Server keinen Web-Build. `deploy.sh`
kopiert bei jedem Lauf (und beim Zurückgehen) `public/clips` nach
`dist/clips` — die Stil-Kacheln und Vorzeige-Videos der App. Fehlt das,
sind die Kacheln leer (`/clips/…` → 404, erster Lauf 05.10.2026).

Antwortet der Server nach dem Neustart nicht nach rund 30 Versuchen (je eine Sekunde Abstand) auf
`/api/prices` (offen, ohne Konto), geht der Deploy von selbst auf den vorigen
Stand zurück. Liegen im Checkout Handänderungen, bricht er ab, statt sie zu
überschreiben.

Danach prüft er die Tür (S1): `POST /api/generate` ohne Anmeldung muss mit
`401` und `reason: "signin"` abgewiesen werden. Geht es durch, **stoppt er
den Dienst** — lieber zu als offen.

Nachsehen:

```bash
systemctl status dreamrushes
journalctl -u dreamrushes -f
```

## ⚠ Bevor die App diesen Server benutzt

1. **Bezahltes nur mit Konto (S1) — scharf seit 03.10.2026.**
   `Environment=REQUIRE_AUTH=1` steht in `dreamrushes.service`: Alles, was
   Geld kostet, verlangt eine gültige Anmeldung; Anmeldung, Preise und
   Hörprobe bleiben offen (`needsAccount()` in `src/lib/gatekeeper.js`).
   Das alte `API_TOKEN` ist abgelöst — es sperrte die App aus.
   **Die App muss einen Bau ab PR #72 haben**, sonst schickt sie das Token
   nicht. Unkritisch, solange alle Bauten auf den Mac im WLAN zeigen: Eine
   App, die diesen Server nutzt, braucht ohnehin einen neuen Bau mit
   `EXPO_PUBLIC_API_BASE=https://api.dreamrushes.app`.
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
