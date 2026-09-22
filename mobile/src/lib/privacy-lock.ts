import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";

/* Der Face-ID-Schutz (Antons Ansage 22.09.2026): ein Schalter in den
   Einstellungen, der die GANZE App sperrt — nicht nur das Journal, weil
   der letzte Traum auch auf der Startseite und im Traum-Tab steht; ein
   Tor, kein Leck.

   Die Marke liegt im Schlüsselbund (expo-secure-store, wie die
   Sitzungs-Token in auth.ts) und NICHT im localStorage der Brücke: Das
   Tor muss beim Kaltstart stehen, BEVOR der Brücken-Webview seine ersten
   Daten liefert — auf dem Gerät dauert das Sekunden, und so lange wäre
   die App offen. */

const KEY = "dr_privacy_lock";

export async function isLockEnabled(): Promise<boolean> {
  try { return (await SecureStore.getItemAsync(KEY)) === "1"; } catch { return false; }
}

export async function setLockEnabled(on: boolean): Promise<void> {
  if (on) await SecureStore.setItemAsync(KEY, "1");
  else await SecureStore.deleteItemAsync(KEY);
}

/* Gerät kann sperren: Face ID/Touch ID eingerichtet ODER ein Gerätecode —
   authenticateAsync fällt von selbst auf den Code zurück. Ganz ohne beides
   wäre der Schalter eine Selbstaussperrung, deshalb prüft settings.tsx
   das VOR dem Einschalten. */
export async function canLock(): Promise<boolean> {
  try {
    const level = await LocalAuthentication.getEnrolledLevelAsync();
    return level !== LocalAuthentication.SecurityLevel.NONE;
  } catch { return false; }
}

/* true = entsperrt. Der Systemdialog übernimmt Sprache und Rückfall auf
   den Code; `disableDeviceFallback` bleibt aus, sonst sperrt ein nasser
   Finger die eigenen Träume. */
export async function unlock(prompt: string): Promise<boolean> {
  try {
    const r = await LocalAuthentication.authenticateAsync({ promptMessage: prompt, cancelLabel: "Cancel" });
    return r.success;
  } catch { return false; }
}
