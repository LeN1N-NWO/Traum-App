/* Prüft die .env des öffentlichen Servers, bevor der Dienst startet.
 *
 * Läuft als ExecStartPre in dreamrushes.service und in deploy.sh — mit
 * demselben `bun --env-file=…` wie der Server selbst, damit hier genau die
 * Werte ankommen, die auch server.js sieht (Bun liest `\n` in doppelten
 * Anführungszeichen anders als systemds EnvironmentFile; der Apple-Schlüssel
 * steht so in der Datei).
 *
 * Warum ein eigener Schritt und nicht server.js: Lokal soll alles ohne diese
 * Werte laufen (siehe gatekeeper.js — eine Sicherung, die jede
 * Entwicklungsumgebung abschaltet, schaltet man ab). Auf dem VPS ist es
 * umgekehrt: Dort steht der Port im Internet, und ein fehlender Wert ist
 * kein Komfortverlust, sondern ein offenes Guthaben oder verlorene Filme.
 *
 * Fehler halten den Start an. Warnungen nicht.
 */

import { isAbsolute, relative, resolve } from "node:path";

/** Caddy leitet fest auf diesen Port weiter (deploy/Caddyfile), und der
 *  Gesundheitscheck in deploy.sh fragt dort. */
export const EXPECTED_PORT = "8100";

/** Ohne diese läuft der Server, aber die App kann Wesentliches nicht. */
const WANTED = [
  ["FAL_KEY", "keine Bilder und Filme"],
  ["DEEPSEEK_KEY", "keine Traumanalyse"],
  ["GEMINI_KEY", "kein Sprachinterview und keine Stimmen"],
];

/**
 * @param {Record<string, string | undefined>} env
 * @param {string} appDir  Ordner des Checkouts auf dem Server
 * @returns {{ errors: string[], warnings: string[] }}
 */
export function checkEnv(env, appDir) {
  const errors = [];
  const warnings = [];

  /* S1 (03.10.2026): Die bezahlten Routen schützt die Anmeldung —
     REQUIRE_AUTH=1 in dreamrushes.service, geprüft gegen Supabase. Ohne
     SUPABASE_URL/SUPABASE_ANON_KEY gelänge die Prüfung nie: Der Server liefe,
     aber niemand käme je an einen Traum. */
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
    errors.push("SUPABASE_URL/SUPABASE_ANON_KEY fehlen — ohne sie kann sich niemand anmelden, und Bezahltes geht nur mit Konto (S1).");
  }

  /* Das alte gemeinsame Geheimnis. Gesetzt verlangt der Türsteher den Kopf
     x-api-token auf JEDER /api/-Route — die App schickt ihn nicht, sie wäre
     komplett ausgesperrt. Seit S1 ersetzt es die Anmeldung. */
  if (env.API_TOKEN) {
    errors.push("API_TOKEN ist gesetzt — das sperrt die App aus. Seit S1 schützt die Anmeldung (REQUIRE_AUTH); die Zeile aus der .env löschen.");
  }

  /* S2 (05.10.2026): /media/* nur gegen eine Signatur, die aus diesem
     Geheimnis abgeleitet ist (src/lib/mediaAccess.js). Fehlt es, liefert der
     Server gar keine Medien aus — die App zeigte keinen einzigen Film. Zu
     kurz, und die Signaturen ließen sich durchprobieren. */
  const mediaSecret = env.MEDIA_SECRET || "";
  if (!mediaSecret) {
    errors.push("MEDIA_SECRET fehlt — ohne es liefert der Server keine Medien aus (S2). Erzeugen: openssl rand -hex 32");
  } else if (mediaSecret.length < 32) {
    errors.push(`MEDIA_SECRET ist zu kurz (${mediaSecret.length} Zeichen, mindestens 32). Erzeugen: openssl rand -hex 32`);
  }

  /* S7 (05.10.2026): Der Server bucht jeden Film im Konto ab, bevor er
     rendert — ohne Datenbank gibt es keine Kasse, und dann lehnt er jeden
     Film mit 503 ab (lieber kein Film als ein unbezahlter). Mit der
     Rolle dreamrushes_server, nie postgres (prüft src/lib/db.js beim Start). */
  if (!env.DATABASE_URL) {
    errors.push("DATABASE_URL fehlt — ohne Datenbank kann der Server nicht abbuchen und lehnt jeden Film ab (S7).");
  }

  /* Ohne DREAMRUSHES_MEDIA legt mediaRootFrom() den Ordner in den Checkout.
     Der ist austauschbar — die Filme der Nutzer sind es nicht (21.08.2026). */
  const media = env.DREAMRUSHES_MEDIA || "";
  if (!media) {
    errors.push("DREAMRUSHES_MEDIA fehlt — Medien landeten im Checkout. Vorgabe: /var/lib/dreamrushes/media");
  } else if (!isAbsolute(media)) {
    errors.push(`DREAMRUSHES_MEDIA muss ein absoluter Pfad sein, ist aber "${media}".`);
  } else {
    const rel = relative(resolve(appDir), resolve(media));
    if (rel === "" || (!rel.startsWith("..") && !isAbsolute(rel))) {
      errors.push(`DREAMRUSHES_MEDIA liegt im Checkout (${appDir}) — Medien gehören nach /var/lib/dreamrushes.`);
    }
  }

  if (env.PORT && env.PORT !== EXPECTED_PORT) {
    errors.push(`PORT ist ${env.PORT}, Caddy leitet aber auf ${EXPECTED_PORT} weiter.`);
  }

  for (const [key, loss] of WANTED) {
    if (!env[key]) warnings.push(`${key} fehlt — ${loss}.`);
  }

  return { errors, warnings };
}

if (import.meta.main) {
  const appDir = resolve(import.meta.dir, "..");
  const { errors, warnings } = checkEnv(process.env, appDir);
  for (const w of warnings) console.warn(`[check-env] Warnung: ${w}`);
  for (const e of errors) console.error(`[check-env] FEHLER: ${e}`);
  if (errors.length) {
    console.error("[check-env] Start abgebrochen. Datei: /etc/dreamrushes/dreamrushes.env (siehe deploy/README.md)");
    process.exit(1);
  }
  console.log("[check-env] in Ordnung.");
}
