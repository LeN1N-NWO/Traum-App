/* Freunde einladen — die Server-Seite (03.10.2026, Hanni).
 *
 * Vertrag mit der App: docs/uebergabe/2026-09-14-hanni-codes-einladungen.md
 * (Nachtrag 03.10.), Client mobile/src/lib/invites.ts. Die Regeln, die App
 * und Server gleich rechnen müssen (Code-Format, Prämie, Wartezeit), stehen
 * in src/lib/invites.js und werden hier nur importiert — Antons Bitte.
 *
 * Die Datenbank kennt drei Funktionen (Migration 20261003120000_invites.sql);
 * dieses Modul ruft sie innerhalb von withUser() auf und formt die Antwort.
 * Rein bis auf `tx`, deshalb ohne Datenbank testbar.
 */
import {
  CODE_ALPHABET, CODE_LENGTH, REFERRAL_HOLD_DAYS, normalizeCode, referralReward,
} from "./invites.js";

/** Ein zufälliger Code aus CODE_ALPHABET. Kryptografischer Zufall, und ohne
 *  Verzerrung: Bytes ab 248 (= 8 × 31) werden verworfen, sonst kämen die
 *  ersten Zeichen des Alphabets häufiger vor. */
export function newCode(random = (n) => crypto.getRandomValues(new Uint8Array(n))) {
  const limit = Math.floor(256 / CODE_ALPHABET.length) * CODE_ALPHABET.length;
  let out = "";
  while (out.length < CODE_LENGTH) {
    for (const b of random(CODE_LENGTH * 2)) {
      if (b < limit && out.length < CODE_LENGTH) out += CODE_ALPHABET[b % CODE_ALPHABET.length];
    }
  }
  return out;
}

/* 31^7 ≈ 27 Mrd. Codes — eine Kollision ist selten, fünf hintereinander
   heißt: etwas anderes stimmt nicht. Dann lieber laut scheitern. */
const CODE_TRIES = 5;

/** Der eigene Code: vorhandener, sonst ein neuer. */
export async function ensureCode(tx, gen = newCode) {
  for (let i = 0; i < CODE_TRIES; i++) {
    const [row] = await tx`select public.server_invite_code(${gen()}) as code`;
    if (row?.code) return row.code;
  }
  throw new Error("INVITE_CODE_COLLISIONS");
}

/** Was GET /api/invite zurückgibt — genau die Form aus mobile/src/lib/invites.ts. */
export function shapeOverview(code, overview) {
  const o = overview && typeof overview === "object" ? overview : {};
  const referrals = Array.isArray(o.referrals) ? o.referrals : [];
  return {
    code,
    connected: !!o.connected,
    rewardsThisMonth: Number(o.rewardsThisMonth) || 0,
    referrals: referrals.map((r) => {
      const counts = r.status === "bought" || r.status === "rewarded";
      const bought = r.status === "bought" && r.purchasedAt ? Date.parse(r.purchasedAt) : NaN;
      return {
        id: String(r.id),
        name: typeof r.name === "string" && r.name.trim() ? r.name.trim() : null,
        status: r.status,
        product: r.product ?? null,
        films: counts ? (referralReward(r.product)?.films ?? 0) : 0,
        rewardAt: Number.isFinite(bought) ? new Date(bought + REFERRAL_HOLD_DAYS * 864e5).toISOString() : null,
      };
    }),
  };
}

/** Alles für GET /api/invite in einem Durchgang. */
export async function loadOverview(tx) {
  const code = await ensureCode(tx);
  const [row] = await tx`select public.server_invite_overview() as o`;
  const o = typeof row?.o === "string" ? JSON.parse(row.o) : row?.o;
  return shapeOverview(code, o);
}

/* Was die App aus dem Fehler macht: invites.ts liest `error` aus jeder
   4xx-Antwort und kennt genau diese Wörter. */
const CONNECT_STATUS = { ok: 200, unknown: 404, own: 409, already: 409 };

/** POST /api/invite/connect: Eingabe prüfen, verbinden, Antwort als {status, body}. */
export async function connect(tx, body) {
  const code = normalizeCode(body?.code);
  if (!code) return { status: 400, body: { error: "unknown" } };
  const [row] = await tx`select public.server_invite_connect(${code}) as result`;
  const result = row?.result;
  if (result === "ok") return { status: 200, body: { ok: true } };
  if (result in CONNECT_STATUS) return { status: CONNECT_STATUS[result], body: { error: result } };
  throw new Error(`INVITE_CONNECT_UNEXPECTED: ${result}`);
}
