/* Die Abbuchung auf dem Server (S7, 05.10.2026).
 *
 * Bis heute zählte nur das Gerät Credits (localStorage, frei änderbar —
 * Befund S7 in docs/ARCHITEKTUR.md). Jetzt bucht der Server VOR dem
 * bezahlten Aufruf im Konto ab, über server_spend (Least-Privilege-Rolle,
 * nur für den per withUser erklärten Menschen), und erstattet über
 * server_refund, wenn der Render danach scheitert
 * (supabase/migrations/20261005200000_credits_refund.sql).
 *
 * Diese Datei ist der Teil ohne Netz und Datenbank: Kennungen und die
 * Übersetzung von Datenbankfehlern. server.js ruft sie auf.
 *
 * Phase 1 = nur der FILM (dort ist die Preisprüfung seit 11.09. scharf,
 * quote.js). Bilder, Raster und Skizzen bleiben „beobachtet" (Log), wie
 * Antons settleCharge() es vorsieht — der Bildweg wird zurückgebaut.
 */
import { randomUUID } from "node:crypto";

/** Die Kennung, die Abbuchung und Erstattung verbindet (Spalte `ref` im
 *  Ledger). Zufällig, nie vom Client: Der Index
 *  credits_ledger_no_double_booking macht damit jede Buchung je Topf
 *  einmalig — eine wiederholte Erstattung bucht nichts. */
export function chargeRef(kind) {
  const safe = String(kind || "charge").replace(/[^a-z0-9-]/gi, "").slice(0, 20) || "charge";
  return `${safe}-${randomUUID()}`;
}

/** Was ein Fehler von server_spend für die Antwort bedeutet.
 *  Bun legt den SQL-Code in `errno` ab (wie in invitesServer.js).
 *    23514 check_violation   — credits_spend: „insufficient credits"
 *    P0002 no_data_found     — kein Saldo-Eintrag für das Konto
 *  Beides heißt für den Menschen: nicht genug Credits → 402, nichts
 *  rendern. Alles andere (Netz, Rechte, fehlende Funktion) ist ein
 *  Ausfall der Kasse → 503, ebenfalls nichts rendern. */
export function chargeFailure(e) {
  const code = e?.errno;
  if (code === "23514" || code === "P0002") return "NO_CREDITS";
  return "CHARGE_UNAVAILABLE";
}

/** Fehler eines Erstattungsversuchs, fürs Log — eine Erstattung, die
 *  scheitert, darf den Ablauf nie abbrechen, muss aber auffallen. */
export function refundFailure(e) {
  if (e?.errno === "42883") return "server_refund fehlt — Migration 20261005200000_credits_refund.sql noch nicht eingespielt";
  if (e?.errno === "42501") return "keine Berechtigung für server_refund (Rolle dreamrushes_server?)";
  return e?.message || String(e);
}
