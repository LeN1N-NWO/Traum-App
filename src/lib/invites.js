/* Freunde einladen — was App und Server gemeinsam wissen müssen
 * (Antons Ansage 03.10.2026, Plan: docs/plans/2026-09-14-codes-einladungen-plan.md,
 * Nachtrag 03.10.).
 *
 * Die Regel in einem Satz: Kauft ein Freund, den du eingeladen hast, zum
 * ersten Mal Credits oder ein Abo, bekommst du Träume geschenkt — nach 14
 * Tagen ohne Erstattung, höchstens fünfmal im Monat. Der Freund selbst
 * bekommt nichts extra (Apple lehnt Prämien fürs Installieren ab).
 *
 * ⚠ Hier steht nur, was beide Seiten gleich rechnen müssen: Code-Format,
 * Link, Prämientabelle. Zuordnen, prüfen und gutschreiben macht der
 * Server (Hanni) — die App zeigt nur an und schickt den Code. Ein Code
 * schaltet beim Eingeladenen NICHTS frei (Apple 3.1.1), er verbindet nur
 * zwei Konten. */
import { FILM_GIFT } from "./streakBoard.js";

/* 7 Zeichen, ohne die Verwechsler 0/O, 1/I/L — wer den Code abtippt, soll
   nicht raten müssen. */
export const CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
export const CODE_LENGTH = 7;
export const INVITE_HOST = "dreamrushes.app";

/** Prämie in Träumen je Kauf des Freundes (plan.id aus plans.js).
 *  Ein Traum = ein ganzer 15-s-Film = FILM_GIFT Credits. Rechnung und
 *  Anteil am Gewinn: Plan-Nachtrag 03.10. */
export const REFERRAL_FILMS = {
  "pack-s": 1,
  monthly: 1,
  "pack-m": 2,
  "pack-l": 3,
  "pack-xl": 5,
  yearly: 6,
};
export const REFERRAL_HOLD_DAYS = 14;    // so lange läuft auch das EU-Widerrufsrecht
export const REFERRAL_MONTHLY_CAP = 5;

/** Was ein Kauf dem Einladenden bringt — oder null (Gratis-Code, unbekannt). */
export function referralReward(planId) {
  const films = REFERRAL_FILMS[planId];
  return films ? { films, credits: films * FILM_GIFT } : null;
}

/** Ist das ein gültiger Code? */
export function isInviteCode(code) {
  const c = String(code || "");
  return c.length === CODE_LENGTH && [...c].every((ch) => CODE_ALPHABET.includes(ch));
}

/** Aus dem, was jemand einfügt oder antippt, den Code holen: den nackten
 *  Code (auch klein, mit Leerzeichen oder Bindestrich), den Link
 *  `https://dreamrushes.app/i/CODE` oder `dreamrushes://invite/CODE`.
 *  Gibt null zurück, wenn kein gültiger Code darin steckt. */
export function normalizeCode(input) {
  const raw = String(input || "").trim();
  const fromLink = /(?:\/i\/|invite\/)([A-Za-z0-9-]+)/.exec(raw);
  const c = (fromLink ? fromLink[1] : raw).replace(/[\s-]/g, "").toUpperCase();
  return isInviteCode(c) ? c : null;
}

/** Der Link zum Teilen. */
export function inviteLink(code) {
  return `https://${INVITE_HOST}/i/${code}`;
}
