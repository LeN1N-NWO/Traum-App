import * as Notifications from "expo-notifications";
import { useEffect } from "react";
import { AppState } from "react-native";
import { accountId, fetchWithSession, useAccount } from "@/lib/auth";
import { permission } from "@/lib/notifications";

/* Push „Dein Film ist fertig" — die App-Hälfte (Antons Entscheidung
 * 05.10.2026, docs/decisions/ADR-0010-server-holt-ab.md: der Server holt
 * fertige Filme selbst ab und meldet sich, auch wenn die App zu ist).
 *
 * Die App meldet nur ihr Geräte-Token beim Server an (POST /api/push-token),
 * sobald jemand angemeldet ist und Mitteilungen erlaubt hat — bei jeder
 * Anmeldung und jedes Mal, wenn die App nach vorn kommt (die Erlaubnis
 * fragt der Bestellablauf nach dem ersten Film). Senden tut der Server.
 *
 * ⚠ AUS, bis Hanni die Gegenstücke gebaut hat (Übergabe
 * docs/uebergabe/2026-10-05-hanni-server-holt-ab-push.md): APNs-Schlüssel,
 * Push-Berechtigung (`aps-environment` über app.json) und die Route
 * /api/push-token. Antons Personal Team kann die Berechtigung nicht
 * signieren — ohne sie gibt iOS gar kein Token heraus. Einschalten im Bau:
 * EXPO_PUBLIC_PUSH=1. */
export const PUSH_ENABLED = process.env.EXPO_PUBLIC_PUSH === "1";
const API_BASE = process.env.EXPO_PUBLIC_API_BASE || "http://localhost:8100";

let sentFor: string | null = null;   // „Konto:Token", das schon angemeldet ist

export async function registerPush(): Promise<"sent" | "off" | "no-account" | "no-permission" | "failed"> {
  if (!PUSH_ENABLED) return "off";
  const uid = accountId();
  if (!uid) return "no-account";
  if ((await permission()) !== "granted") return "no-permission";
  try {
    const { data: token } = await Notifications.getDevicePushTokenAsync();
    const key = `${uid}:${token}`;
    if (sentFor === key) return "sent";
    const res = await fetchWithSession(`${API_BASE}/api/push-token`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ token, platform: "ios" }),
    });
    if (!res.ok) return "failed";
    sentFor = key;
    return "sent";
  } catch (e) {
    console.warn("[push] register", e);
    return "failed";
  }
}

/** Im Wurzel-Layout: nach jeder Anmeldung und wenn die App nach vorn kommt. */
export function usePushRegistration() {
  const account = useAccount();
  useEffect(() => {
    if (!PUSH_ENABLED) return;
    registerPush().catch(() => {});
    const sub = AppState.addEventListener("change", (s) => { if (s === "active") registerPush().catch(() => {}); });
    return () => sub.remove();
  }, [account]);
}
