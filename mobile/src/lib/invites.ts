import * as SecureStore from "expo-secure-store";
import { authFetch } from "@/lib/auth";
import { normalizeCode } from "../../../src/lib/invites.js";

/* Freunde einladen — die App-Seite (03.10.2026). Zuordnen, prüfen und
 * gutschreiben macht der Server (Hanni, Übergabe
 * docs/uebergabe/2026-09-14-hanni-codes-einladungen.md, Nachtrag 03.10.);
 * hier steht nur, was die Oberfläche fragt und schickt:
 *
 *   GET  /api/invite          → { code, connected, rewardsThisMonth,
 *                                 referrals: [{ id, name, status, product, films, rewardAt }] }
 *   POST /api/invite/connect  { code } → { ok: true }
 *                                 | 4xx { error: "unknown"|"own"|"already"|"device" }
 *
 * ⚠ VORSCHAU: Solange der Server die Endpunkte nicht kennt (404/501), zeigt
 * die Seite Beispieldaten mit dem Hinweis „Vorschau" — damit Anton die
 * Oberfläche auf dem iPhone sieht. Vor der Veröffentlichung INVITE_PREVIEW
 * auf false (wie devCredits in journal-data.tsx). */
export const INVITE_PREVIEW = true;

export type ReferralStatus = "joined" | "bought" | "rewarded" | "rejected";
export type Referral = { id: string; name: string | null; status: ReferralStatus; product: string | null; films: number; rewardAt: string | null };
export type InviteData = { code: string; connected: boolean; rewardsThisMonth: number; referrals: Referral[] };
export type InviteState =
  | { kind: "ready"; data: InviteData }
  | { kind: "preview"; data: InviteData; signedIn: boolean }
  | { kind: "signin" }
  | { kind: "offline" };
export type ConnectError = "invalid" | "unknown" | "own" | "already" | "device" | "signin" | "offline";

const SAMPLE: InviteData = {
  code: "DRM4KX7", connected: false, rewardsThisMonth: 1,
  referrals: [
    { id: "s1", name: "Mila", status: "rewarded", product: "pack-m", films: 2, rewardAt: null },
    { id: "s2", name: "Jonas", status: "bought", product: "monthly", films: 1, rewardAt: new Date(Date.now() + 9 * 864e5).toISOString() },
    { id: "s3", name: "Ava", status: "joined", product: null, films: 0, rewardAt: null },
  ],
};

export async function loadInvite(): Promise<InviteState> {
  let res: Response;
  try { res = await authFetch("/api/invite"); } catch { return { kind: "offline" }; }
  if (res.status === 401) return INVITE_PREVIEW ? { kind: "preview", data: SAMPLE, signedIn: false } : { kind: "signin" };
  if (res.status === 404 || res.status === 501) return INVITE_PREVIEW ? { kind: "preview", data: SAMPLE, signedIn: true } : { kind: "offline" };
  if (!res.ok) return { kind: "offline" };
  const d = await res.json().catch(() => null);
  if (!d || typeof d.code !== "string") return { kind: "offline" };
  return { kind: "ready", data: { code: d.code, connected: !!d.connected, rewardsThisMonth: Number(d.rewardsThisMonth) || 0, referrals: Array.isArray(d.referrals) ? d.referrals : [] } };
}

export async function connectInvite(input: string): Promise<{ ok: true } | { ok: false; why: ConnectError }> {
  const code = normalizeCode(input);
  if (!code) return { ok: false, why: "invalid" };
  let res: Response;
  try {
    res = await authFetch("/api/invite/connect", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ code }) });
  } catch { return { ok: false, why: "offline" }; }
  if (res.ok) { await SecureStore.deleteItemAsync(KEY_PENDING).catch(() => {}); return { ok: true }; }
  if (res.status === 401) return { ok: false, why: "signin" };
  const d = await res.json().catch(() => null);
  const why = d?.error;
  return { ok: false, why: why === "unknown" || why === "own" || why === "already" || why === "device" ? why : "offline" };
}

/* Ein Code aus einem Link, bevor es ein Konto gibt: bleibt im Schlüsselbund,
   bis er verbunden ist — die Seite füllt ihn vor. */
const KEY_PENDING = "dreamrushes.inviteCode";
export async function savePendingCode(input: string) {
  const code = normalizeCode(input);
  if (code) await SecureStore.setItemAsync(KEY_PENDING, code).catch(() => {});
  return code;
}
export async function pendingCode(): Promise<string | null> {
  return SecureStore.getItemAsync(KEY_PENDING).catch(() => null);
}
