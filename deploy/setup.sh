#!/usr/bin/env bash
# Einmalige Einrichtung des Dream-Rushes-Servers (Hetzner-VPS, Ubuntu).
#
#   sudo bash deploy/setup.sh api.dreamrushes.app
#
# Darf mehrmals laufen: Was schon da ist, bleibt, was fehlt, kommt dazu.
# Die .env legt ein Mensch von Hand an (Schlüssel gehören nicht ins Repo und
# nicht in ein Skript) — siehe deploy/README.md. Fehlt sie, richtet das Skript
# alles andere ein und sagt am Ende, was noch zu tun ist.
#
# Was hier NICHT passiert, mit Absicht:
# - sshd wird nicht angefasst. Ein Fehler dort sperrt alle aus; das Skript
#   warnt nur, wenn Passwort-Anmeldung noch erlaubt ist.
# - Snapshots und die Hetzner-Firewall stellt man in der Hetzner Console ein.

set -euo pipefail

DOMAIN="${1:-}"
REPO_URL="https://github.com/LeN1N-NWO/Traum-App.git"
BUN_VERSION="1.4.0"           # wie auf den Entwicklungsrechnern

APP_USER="dreamrushes"
APP_HOME="/opt/dreamrushes"
APP_DIR="$APP_HOME/app"
DATA_DIR="/var/lib/dreamrushes"
ENV_DIR="/etc/dreamrushes"
ENV_FILE="$ENV_DIR/dreamrushes.env"

say()  { printf '\n\033[1m== %s\033[0m\n' "$*"; }
warn() { printf '\033[33m!! %s\033[0m\n' "$*"; }
die()  { printf '\033[31mXX %s\033[0m\n' "$*" >&2; exit 1; }

[[ $EUID -eq 0 ]] || die "Bitte mit sudo ausführen."
[[ -n "$DOMAIN" ]] || die "Domain fehlt. Aufruf: sudo bash deploy/setup.sh api.dreamrushes.app"
[[ "$DOMAIN" =~ ^[a-z0-9.-]+$ ]] || die "Domain sieht ungültig aus: $DOMAIN"
grep -q '^ID=ubuntu' /etc/os-release || die "Nur für Ubuntu geschrieben."

# ── Pakete ────────────────────────────────────────────────────────────────
say "Pakete"
export DEBIAN_FRONTEND=noninteractive
apt-get update -q
# caddy aus Ubuntus eigenen Quellen: älter als bei caddyserver.com, aber ohne
# fremde Paketquelle und mit den Updates des Systems.
apt-get install -y -q --no-install-recommends \
  ca-certificates curl git unzip ffmpeg ufw caddy unattended-upgrades

# ── Automatische Sicherheits-Updates ──────────────────────────────────────
say "Automatische Sicherheits-Updates"
cat > /etc/apt/apt.conf.d/20auto-upgrades <<'EOF'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
EOF
systemctl enable --now unattended-upgrades >/dev/null

# ── Bun (fest auf eine Version, Prüfsumme gegen die Release-Liste) ─────────
say "Bun $BUN_VERSION"
if [[ "$(/usr/local/bin/bun --version 2>/dev/null || true)" == "$BUN_VERSION" ]]; then
  echo "schon installiert"
else
  case "$(uname -m)" in
    x86_64)  BUN_ASSET="bun-linux-x64" ;;
    aarch64) BUN_ASSET="bun-linux-aarch64" ;;
    *) die "Unbekannte Architektur: $(uname -m)" ;;
  esac
  BUN_URL="https://github.com/oven-sh/bun/releases/download/bun-v$BUN_VERSION"
  TMP="$(mktemp -d)"
  trap 'rm -rf "$TMP"' EXIT
  curl -fsSL -o "$TMP/$BUN_ASSET.zip" "$BUN_URL/$BUN_ASSET.zip"
  curl -fsSL -o "$TMP/SHASUMS256.txt" "$BUN_URL/SHASUMS256.txt"
  (cd "$TMP" && awk -v f="$BUN_ASSET.zip" '$2 == f' SHASUMS256.txt | sha256sum -c --status) \
    || die "Prüfsumme von $BUN_ASSET.zip stimmt nicht — abgebrochen."
  unzip -q "$TMP/$BUN_ASSET.zip" -d "$TMP"
  install -d "/opt/bun-$BUN_VERSION"
  install -m 755 "$TMP/$BUN_ASSET/bun" "/opt/bun-$BUN_VERSION/bun"
  ln -sfn "/opt/bun-$BUN_VERSION/bun" /usr/local/bin/bun
  echo "installiert: $(/usr/local/bin/bun --version)"
fi

# ── Systemnutzer und Ordner ───────────────────────────────────────────────
say "Systemnutzer $APP_USER und Ordner"
if ! id -u "$APP_USER" >/dev/null 2>&1; then
  useradd --system --user-group --home-dir "$APP_HOME" --no-create-home \
    --shell /usr/sbin/nologin "$APP_USER"
fi
# Code: root gehört er, der Dienst liest nur.
install -d -o root -g root -m 755 "$APP_HOME"
# Daten: nur der Dienst.
install -d -o "$APP_USER" -g "$APP_USER" -m 750 "$DATA_DIR" "$DATA_DIR/media"
# .env: root schreibt, der Dienst liest.
install -d -o root -g "$APP_USER" -m 750 "$ENV_DIR"
if [[ -f "$ENV_FILE" ]]; then
  chown root:"$APP_USER" "$ENV_FILE"
  chmod 640 "$ENV_FILE"
fi

# ── Code ──────────────────────────────────────────────────────────────────
say "Code nach $APP_DIR"
if [[ -d "$APP_DIR/.git" ]]; then
  echo "schon da ($(git -C "$APP_DIR" rev-parse --short HEAD))"
else
  git clone --quiet "$REPO_URL" "$APP_DIR"
  git -C "$APP_DIR" checkout --quiet --detach origin/main
fi

# ── systemd ───────────────────────────────────────────────────────────────
say "systemd-Dienst"
install -m 644 "$APP_DIR/deploy/dreamrushes.service" /etc/systemd/system/dreamrushes.service
systemctl daemon-reload
systemctl enable dreamrushes >/dev/null

# ── Caddy ─────────────────────────────────────────────────────────────────
say "Caddy für $DOMAIN"
NEW_CADDY="$(mktemp)"
sed "s/__DOMAIN__/$DOMAIN/g" "$APP_DIR/deploy/Caddyfile" > "$NEW_CADDY"
caddy validate --adapter caddyfile --config "$NEW_CADDY" >/dev/null \
  || die "Caddyfile ungültig — /etc/caddy/Caddyfile bleibt unverändert."
if [[ -f /etc/caddy/Caddyfile ]] && ! cmp -s "$NEW_CADDY" /etc/caddy/Caddyfile; then
  cp /etc/caddy/Caddyfile "/etc/caddy/Caddyfile.vorher-$(date +%Y%m%d-%H%M%S)"
fi
install -m 644 "$NEW_CADDY" /etc/caddy/Caddyfile
rm -f "$NEW_CADDY"
systemctl enable caddy >/dev/null
systemctl reload-or-restart caddy

# ── Firewall ──────────────────────────────────────────────────────────────
# SSH ZUERST freigeben, dann einschalten — andersherum sperrt man sich aus.
# 8100 bleibt zu: server.js lauscht auf allen Schnittstellen, erreichbar sein
# soll er nur über Caddy.
say "Firewall (ufw): nur 22, 80, 443"
ufw allow 22/tcp  >/dev/null
ufw allow 80/tcp  >/dev/null
ufw allow 443/tcp >/dev/null
ufw allow 443/udp >/dev/null      # HTTP/3
ufw default deny incoming  >/dev/null
ufw default allow outgoing >/dev/null
ufw --force enable >/dev/null
ufw status verbose

# ── SSH: nur prüfen ───────────────────────────────────────────────────────
say "SSH"
if sshd -T 2>/dev/null | awk '$1 == "passwordauthentication" && $2 == "yes" { found = 1 } END { exit !found }'; then
  warn "Passwort-Anmeldung per SSH ist erlaubt. Empfehlung: nur Schlüssel (PasswordAuthentication no)."
else
  echo "Passwort-Anmeldung aus."
fi

# ── Start oder Hinweis ────────────────────────────────────────────────────
if [[ -f "$ENV_FILE" ]]; then
  say "Erster Deploy"
  bash "$APP_DIR/deploy/deploy.sh"
else
  say "Fast fertig"
  cat <<EOF
Es fehlt nur noch die .env des Servers: $ENV_FILE
Anlegen wie in deploy/README.md beschrieben, dann:

  sudo bash $APP_DIR/deploy/deploy.sh
EOF
fi
