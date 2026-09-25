import * as AppleAuthentication from "expo-apple-authentication";

/* Apples Blatt noch einmal, nur für einen frischen Autorisierungscode —
   vor dem Löschen eines Apple-Kontos (Weg A, Hanni 23.09.2026). Der Server
   tauscht den Code sofort gegen Token und widerruft sie (src/lib/apple-
   revoke.js); gespeichert wird nichts.

   Keine Scopes: Name und E-Mail braucht der Widerruf nicht, und ohne Scopes
   zeigt Apple nur die Bestätigung. Keine Nonce: das identityToken geht
   hier nirgends hin.

   null = abgebrochen oder auf diesem Gerät nicht möglich (Android). Wer
   abbricht, will nicht löschen — das ist keine Fehlermeldung wert. */
export async function appleReauthCode(): Promise<string | null> {
  try {
    if (!(await AppleAuthentication.isAvailableAsync())) return null;
    const credential = await AppleAuthentication.signInAsync({ requestedScopes: [] });
    return credential.authorizationCode ?? null;
  } catch {
    return null;
  }
}
