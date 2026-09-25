# Übergabe an Anton — Einrichtung des VPS (25.09.2026, Hanni)

Das Einrichtungsskript für deinen Hetzner-VPS ist geschrieben (PR #64,
Ordner `deploy/`, Anleitung in `deploy/README.md`). **Gelaufen ist es noch
nicht** — dafür fehlt mir der Zugang. Hier steht, was ich von dir brauche,
was du entscheiden musst und was noch niemand geprüft hat.

## Was es macht

`sudo bash deploy/setup.sh api.dreamrushes.app` richtet einmal ein:
automatische Sicherheits-Updates, ffmpeg, Caddy (HTTPS von selbst), Bun
1.4.0 (Download mit Prüfsumme), Systemnutzer `dreamrushes` ohne Login,
systemd-Dienst, Firewall nur 22/80/443. sshd fasst es nicht an, es warnt
nur, wenn Passwort-Anmeldung erlaubt ist.

`sudo bash deploy/deploy.sh` bringt danach jeden neuen Stand mit einem
Befehl hoch und geht von selbst zurück, wenn der Server nicht antwortet.

Medien liegen unter `/var/lib/dreamrushes`, nicht im Checkout (die Lehre vom
21.08.). Die `.env` legt ein Mensch von Hand an:
`/etc/dreamrushes/dreamrushes.env`.

## Was ich von dir brauche

1. **SSH-Zugang für mich:** eigener Login-Nutzer mit `sudo`, nicht `root`.
   Ich schicke dir meinen öffentlichen Schlüssel. Damit ist auch Bedingung 3
   aus dem Plan beantwortet (wer außer dir Zugang hat) — bitte bestätigen,
   dann trage ich es in `docs/plans/2026-09-24-hosting.md` ein.
2. **Hetzner Console:** Firewall eingehend nur 22, 80, 443 (TCP) und 443
   (UDP); Snapshots/Backups an; AV-Vertrag im Kundenkonto (Bedingung 4).
3. **Object Storage für Schritt C:** Der Bucket hängt am Cloud-Projekt,
   nicht am VPS. Entweder mich als Projektmitglied eintragen, oder du legst
   Bucket + Zugangsschlüssel an und gibst mir die `MEDIA_S3_*`-Werte über
   einen sicheren Weg — nicht im Klartext im Chat, nie ins Repo.
4. **IPv6:** `ip -6 addr show scope global` auf dem Server, damit wir den
   AAAA-Eintrag setzen können (von meinem Anschluss nicht prüfbar).

DNS ist erledigt: `api.dreamrushes.app` → `188.245.92.121` (geprüft 25.09.).

## Was du entscheiden musst (zwei Punkte, beide in `server.js`)

**1. S1 — der Server ist mit dem Skript für die App zu.** `check-env.mjs`
verlangt ein `API_TOKEN`, sonst startet der Dienst nicht. Grund: Ohne Token
sind die bezahlten Routen für jeden im Internet offen (`ARCHITEKTUR.md`
schätzt ~9 $/Minute). Mit Token sperrt der Türsteher aber JEDE `/api/`-Route
ohne `x-api-token`, auch Anmeldung und Träume — und die App schickt keinen.
Deshalb wurde das Token am 11.09. schon einmal gebaut und zurückgenommen;
entschieden ist, S1 mit den echten Konten zu lösen. Das heißt jetzt konkret: Die teuren Routen verlangen eine
Anmeldung. Bis dahin ist der Server zum Einrichten und Testen da, nicht für
die App.

**2. S5 — Rate-Limit hinter Caddy.** `guard()` bekommt die Adresse von
`server.requestIP()`. Hinter Caddy ist das für jede Anfrage `127.0.0.1`: alle
Nutzer teilen sich 10 Anmeldungen und 20 Bilder pro Minute, einer kann alle
aussperren. Der Kommentar über `guard(` sagt das voraus (Befund S5). Vorschlag: Nur wenn
die Anfrage von Loopback kommt UND ein Schalter wie `TRUST_PROXY=1` gesetzt
ist, `X-Forwarded-For` nehmen — Caddy ersetzt die Kopfzeile, statt sie
durchzureichen (auf dem Server gegenprüfen). Eine Stelle, nichts sonst.

Beide Änderungen erst **nach deinem PR #62**, weil der `server.js` auch
ändert. Wer sie macht, sagen wir vorher ab.

## Was noch niemand geprüft hat

Lokal belegt: die Tests für `check-env.mjs` (Gegenprobe: sechs eingebaute
Fehler, alle gefunden); der Gesundheitscheck gegen den echten `server.js`
(ohne Token 401, falsches 401, richtiges 200); `server.js` läuft ohne
`node_modules` und mit `--no-install`; die Bun-Dateinamen gibt es für 1.4.0.

**Erst auf dem Server zu sehen** (kein Linux, kein Caddy, kein shellcheck
hier):
- ob Ubuntus `caddy`-Paket auf deiner Version installierbar ist und die
  Caddyfile annimmt (das Skript prüft sie vor dem Einsetzen und bricht sonst
  ab, die alte bleibt);
- ob der Prüfsummen-Abgleich für Bun passt (scheitert er, bricht das Skript
  ab — es installiert nie ungeprüft);
- ob die systemd-Abschottung (`ProtectSystem=strict` u. a.) Bun oder ffmpeg
  etwas verbietet, das sie brauchen → dann `journalctl -u dreamrushes`.

Den ersten Lauf würde ich gern mit dir zusammen machen.
