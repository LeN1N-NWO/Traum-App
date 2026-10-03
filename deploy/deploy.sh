#!/usr/bin/env bash
# Neuen Stand auf den Server bringen — ein Befehl.
#
#   sudo bash /opt/dreamrushes/app/deploy/deploy.sh            # origin/main
#   sudo bash /opt/dreamrushes/app/deploy/deploy.sh <commit>   # bestimmter Stand
#
# Holt den Stand, prüft die .env, startet neu und fragt den Server, ob er
# antwortet. Antwortet er nicht, geht es von selbst auf den vorigen Stand
# zurück — ein kaputter Deploy soll die App nicht länger als eine Minute
# abschalten.
#
# Kein `bun install`: server.js braucht keine Pakete aus node_modules (nur
# Bun und node:-Module). Ändert sich das, gehört es hierher.

set -euo pipefail

REF="${1:-origin/main}"
APP_USER="dreamrushes"
APP_DIR="/opt/dreamrushes/app"
ENV_FILE="/etc/dreamrushes/dreamrushes.env"
HEALTH_URL="http://127.0.0.1:8100/api/prices"
LOCK_URL="http://127.0.0.1:8100/api/generate"

say() { printf '\n\033[1m== %s\033[0m\n' "$*"; }
die() { printf '\033[31mXX %s\033[0m\n' "$*" >&2; exit 1; }

[[ $EUID -eq 0 ]] || die "Bitte mit sudo ausführen."
[[ -x /usr/local/bin/bun ]] || die "Bun fehlt — erst deploy/setup.sh laufen lassen."
[[ -f "$ENV_FILE" ]] || die "$ENV_FILE fehlt — siehe deploy/README.md."
cd "$APP_DIR"

# Auf dem Server wird nicht programmiert. Liegt dort eine Änderung, hat sie
# jemand von Hand gemacht — die soll ein Mensch ansehen, nicht der Deploy
# überschreiben.
[[ -z "$(git status --porcelain)" ]] || die "Im Checkout liegen Änderungen:
$(git status --short)
Erst klären, dann deployen."

PREV="$(git rev-parse HEAD)"

say "Holen: $REF"
git fetch --quiet --prune origin
git checkout --quiet --detach "$REF"
NEW="$(git rev-parse HEAD)"
git log -1 --format='%h %s (%an, %ad)' --date=short

# Als Dienstnutzer und mit dessen Umgebung wie in dreamrushes.service —
# runuser behielte sonst HOME=/root, und Bun sähe dort hinein.
as_service() {
  runuser -u "$APP_USER" -- env HOME=/opt/dreamrushes BUN_RUNTIME_TRANSPILER_CACHE_PATH=0 \
    /usr/local/bin/bun --no-install --env-file="$ENV_FILE" "$@"
}

check_env() {
  as_service deploy/check-env.mjs
}

# /api/prices ist ohne Konto offen (needsAccount() in src/lib/gatekeeper.js)
# und kostet nichts — ein 200 heißt „Server bedient".
answers() {
  as_service -e '
    const r = await fetch(process.argv[1], { signal: AbortSignal.timeout(2000) }).catch(() => null);
    process.exit(r?.ok ? 0 : 1);
  ' "$HEALTH_URL"
}

# S1: Ist die Tür wirklich zu? Ein Aufruf, der Geld kosten würde, ohne
# Anmeldung — er muss mit 401 und reason "signin" abgewiesen werden, BEVOR
# der Server ihn liest (ohne Tür käme nur „Dream too short", auch kostenlos).
# Greift das nicht (REQUIRE_AUTH fehlt), stünde der Server offen im Netz.
locked() {
  as_service -e '
    const r = await fetch(process.argv[1], { method: "POST", headers: { "content-type": "application/json" }, body: "{}", signal: AbortSignal.timeout(5000) }).catch(() => null);
    const body = r ? await r.json().catch(() => null) : null;
    process.exit(r?.status === 401 && body?.reason === "signin" ? 0 : 1);
  ' "$LOCK_URL"
}

healthy() {
  for _ in $(seq 1 30); do
    if answers; then return 0; fi
    sleep 1
  done
  return 1
}

say ".env prüfen"
if ! check_env; then
  git checkout --quiet --detach "$PREV"
  die ".env passt nicht zum neuen Stand — zurück auf $(git rev-parse --short HEAD), Dienst unverändert."
fi

# Die Dienst-Datei kommt mit dem Code; ist sie neu, muss systemd sie kennen.
if ! cmp -s deploy/dreamrushes.service /etc/systemd/system/dreamrushes.service; then
  install -m 644 deploy/dreamrushes.service /etc/systemd/system/dreamrushes.service
  systemctl daemon-reload
fi

say "Neustart"
systemctl restart dreamrushes

if healthy; then
  if ! locked; then
    # Lieber zu als offen: Ein Server, der Bezahltes ohne Konto annimmt,
    # bleibt nicht am Netz — auch nicht der vorige Stand, der es genauso täte.
    systemctl stop dreamrushes
    die "Bezahltes ging OHNE Anmeldung durch ($LOCK_URL) — Dienst gestoppt. REQUIRE_AUTH=1 in /etc/systemd/system/dreamrushes.service? (S1)"
  fi
  say "Läuft: $(git rev-parse --short HEAD)"
  [[ "$PREV" == "$NEW" ]] || echo "vorher: ${PREV:0:7} — zurück mit: sudo bash $0 ${PREV:0:7}"
  exit 0
fi

journalctl -u dreamrushes -n 40 --no-pager || true
say "Keine Antwort von $HEALTH_URL — zurück auf ${PREV:0:7}"
git checkout --quiet --detach "$PREV"
install -m 644 deploy/dreamrushes.service /etc/systemd/system/dreamrushes.service
systemctl daemon-reload
systemctl restart dreamrushes
if healthy; then
  if ! locked; then
    systemctl stop dreamrushes
    die "Neuer Stand ${NEW:0:7} startet nicht, und der vorige ${PREV:0:7} nimmt Bezahltes ohne Anmeldung an — Dienst gestoppt. (S1)"
  fi
  die "Neuer Stand ${NEW:0:7} startet nicht. Der vorige Stand ${PREV:0:7} läuft wieder."
fi
die "Auch der vorige Stand ${PREV:0:7} antwortet nicht. Log: journalctl -u dreamrushes -n 100"
