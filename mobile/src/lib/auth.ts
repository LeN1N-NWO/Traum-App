import * as SecureStore from "expo-secure-store";
import { useSyncExternalStore } from "react";
import { requestSignIn } from "@/lib/signin-prompt";
import { expiresSoon } from "../../../src/lib/jwtExpiry.js";

/* Die Anmeldung, nativ — gegen Hannis Backend (Übergabe 12.09.2026,
 * `docs/uebergabe/2026-09-12-anton-login-ui.md`; Endpunkte in server.js,
 * `src/lib/auth.js`). Der Client spricht NUR mit unserem Server, nie mit
 * Supabase (ADR-0005).
 *
 * ⚠ Die Token liegen im sicheren Speicher des Geräts (expo-secure-store,
 * iOS-Schlüsselbund), nie in AsyncStorage, nie im Zustand der Brücke: Wer
 * das refresh_token hat, IST der Nutzer, bis es widerrufen wird. Im
 * Arbeitsspeicher hält dieses Modul nur, wer angemeldet ist (ID, E-Mail), für
 * die Oberfläche.
 *
 * Ablauf bei einem Aufruf mit Konto (`authFetch`): Token mitschicken; bei
 * 401 EINMAL erneuern und wiederholen; scheitert auch das, ist die Sitzung
 * weg — Token löschen, die Oberfläche zeigt wieder die Anmeldung. Zwei
 * gleichzeitige 401 teilen sich EINE Erneuerung (`refreshing`), sonst
 * würde die zweite mit dem schon verbrauchten Token scheitern. */

const API_BASE = process.env.EXPO_PUBLIC_API_BASE || "http://localhost:8100";
const KEY_ACCESS = "dreamrushes.access";
const KEY_REFRESH = "dreamrushes.refresh";
const KEY_EMAIL = "dreamrushes.email";
const KEY_USER = "dreamrushes.user";

export type AuthUser = { id: string; email: string | null };
type Session = { access_token: string; refresh_token: string; user?: AuthUser | null };

export type LoginFailure = "wrong" | "busy" | "unavailable" | "offline" | "unconfirmed";
export type LoginResult = { ok: true; user: AuthUser } | { ok: false; why: LoginFailure };

/* Who is signed in, for the UI — read back from the keychain at start
   (`restoreSession`), held in memory afterwards.
   ⚠ Signed in means: a session exists. The e-mail is shown, never tested —
   Sign in with Apple can create accounts without one, and keying on it put
   such a person back on the sign-in screen after every start. */
let account: AuthUser | null = null;
let restored = false;
/* Erst nach der ersten Ansage (restoreSession oder eine Anmeldung) ist
   bekannt, wer am Gerät ist — vorher wüsste keine Brücke, welcher Bereich
   gilt (ADR-0009). */
let known = false;
const listeners = new Set<() => void>();
function announce(next: AuthUser | null) { account = next; known = true; listeners.forEach((l) => l()); }
/** Outside React: called after every sign-in, sign-out or account switch
 *  (media-key.ts fetches the next account's media key). */
export function onAccountChange(fn: () => void) {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}
export function useAccount() {
  return useSyncExternalStore((l) => { listeners.add(l); return () => { listeners.delete(l); }; }, () => account, () => account);
}

/** Für `<JournalBridge account={…}>` (ADR-0009): undefined, solange die
 *  Sitzung noch nicht geladen ist (die Brücke wartet), sonst die Konto-ID
 *  oder null für den Gast. Eine alte Sitzung ohne gespeicherte ID zählt als
 *  Gast — das Verhalten von vor ADR-0009. */
export function useBridgeAccount(): string | null | undefined {
  const who = () => (known ? account?.id || null : undefined);
  return useSyncExternalStore((l) => { listeners.add(l); return () => { listeners.delete(l); }; }, who, who);
}

/** Die Konto-ID (Supabase-UUID) — oder null ohne Anmeldung. Für den Kauf:
 *  StoreKit trägt sie als `appAccountToken` in jede Transaktion, damit der
 *  Server Kauf und Erstattung dem Konto zuordnet (Einladungen, 03.10.). */
export function accountId(): string | null {
  return account?.id || null;
}

export async function restoreSession() {
  if (restored) return account;
  restored = true;
  /* Scheitert der Schlüsselbund, trotzdem ansagen (als Gast): Ohne Ansage
     blieben alle Brücken stumm und die App leer (ADR-0009). */
  const [access, id, saved] = await Promise.all([KEY_ACCESS, KEY_USER, KEY_EMAIL].map((k) => SecureStore.getItemAsync(k)))
    .catch(() => [null, null, null] as (string | null)[]);
  announce(access ? { id: id ?? "", email: saved } : null);
  return account;
}

/* Only what is known gets written: a refresh answer without an e-mail must
   not wipe the one saved at sign-in. */
async function store(s: Session, user: AuthUser | null | undefined = s.user) {
  await Promise.all([
    SecureStore.setItemAsync(KEY_ACCESS, s.access_token),
    SecureStore.setItemAsync(KEY_REFRESH, s.refresh_token),
    user?.id ? SecureStore.setItemAsync(KEY_USER, user.id) : Promise.resolve(),
    user?.email ? SecureStore.setItemAsync(KEY_EMAIL, user.email) : Promise.resolve(),
  ]);
}
async function forget() {
  await Promise.all([KEY_ACCESS, KEY_REFRESH, KEY_EMAIL, KEY_USER].map((k) => SecureStore.deleteItemAsync(k).catch(() => {})));
  announce(null);
}

function failure(status: number): LoginFailure {
  if (status === 401) return "wrong";
  if (status === 429) return "busy";
  return "unavailable";          // 503 nicht eingerichtet, 5xx von Supabase, alles andere
}

/* The shared end of both ways in: check, keychain, tell the UI who is there.
   The server's answer wins; `fallbackEmail` only fills an e-mail the server
   does not carry. */
async function completeLogin(res: Response, fallbackEmail: string | null): Promise<LoginResult> {
  if (!res.ok) {
    /* Signed up but the mail link not clicked yet — not a wrong password. */
    const reason = ((await res.json().catch(() => null)) as { reason?: string } | null)?.reason;
    return { ok: false, why: reason === "unconfirmed" ? "unconfirmed" : failure(res.status) };
  }
  /* A proxy or captive portal can answer 200 with HTML. Unguarded, that threw
     past the caller and left the sign-in form spinning for good. */
  const s = (await res.json().catch(() => null)) as Session | null;
  if (!s?.access_token || !s.refresh_token) return { ok: false, why: "unavailable" };
  const user: AuthUser = { id: s.user?.id ?? "", email: s.user?.email || fallbackEmail || null };
  await store(s, user);
  announce(user);
  return { ok: true, user };
}

export async function login(mail: string, password: string): Promise<LoginResult> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: mail.trim(), password }),
    });
  } catch {
    return { ok: false, why: "offline" };
  }
  return completeLogin(res, mail.trim());
}

/* Create an account with e-mail and password (03.10.2026). With "Confirm
   email" on in Supabase there is no session yet: `confirm` means "a link is in
   the inbox — tap it, then sign in". Supabase answers a taken address the
   same way, on purpose. With confirmation off it signs in directly. */
export type SignupFailure = LoginFailure | "weak" | "invalid" | "exists";
export type SignupResult = { ok: true; user: AuthUser } | { ok: true; confirm: true } | { ok: false; why: SignupFailure };

export async function register(mail: string, password: string): Promise<SignupResult> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/api/auth/signup`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: mail.trim(), password }),
    });
  } catch {
    return { ok: false, why: "offline" };
  }
  if (!res.ok) {
    const reason = ((await res.json().catch(() => null)) as { reason?: string } | null)?.reason;
    if (reason === "weak" || reason === "invalid" || reason === "exists") return { ok: false, why: reason };
    return { ok: false, why: res.status === 429 ? "busy" : "unavailable" };
  }
  /* A clone, because completeLogin() reads the body itself. */
  const body = (await res.clone().json().catch(() => null)) as { confirm?: boolean } | null;
  if (body?.confirm) return { ok: true, confirm: true };
  return completeLogin(res, mail.trim());
}

/* Forgot password (03.10.2026): a code by mail, then code + new password.
   Step 1 answers the same for every address — whether it has an account is
   not the app's to know. Step 2 ends signed in, like a login. */
export type ResetFailure = SignupFailure | "code";
export type ResetResult = { ok: true; user: AuthUser } | { ok: false; why: ResetFailure };

async function authPost(path: string, body: object): Promise<Response | null> {
  try {
    return await fetch(`${API_BASE}${path}`, {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body),
    });
  } catch {
    return null;
  }
}
async function failureOf(res: Response): Promise<ResetFailure> {
  const reason = ((await res.json().catch(() => null)) as { reason?: string } | null)?.reason;
  if (reason === "weak" || reason === "invalid" || reason === "code") return reason;
  return res.status === 429 ? "busy" : "unavailable";
}

export async function requestReset(mail: string): Promise<{ ok: true } | { ok: false; why: ResetFailure }> {
  const res = await authPost("/api/auth/recover", { email: mail.trim() });
  if (!res) return { ok: false, why: "offline" };
  return res.ok ? { ok: true } : { ok: false, why: await failureOf(res) };
}

export async function resetPassword(mail: string, code: string, password: string): Promise<ResetResult> {
  const res = await authPost("/api/auth/reset", { email: mail.trim(), code: code.trim(), password });
  if (!res) return { ok: false, why: "offline" };
  if (!res.ok) return { ok: false, why: await failureOf(res) };
  return completeLogin(res, mail.trim());
}

/* Sign in with Apple (15.09.2026). Unlike the password way, this creates an
   account if there is none — Apple has already vouched for the person.
 *
 * ⚠ The `nonce` goes RAW to our server; Apple only saw its SHA-256. Supabase
 *   hashes it itself and compares. Sending the hash "to be safe" hashes a hash,
 *   and the failure reads like a rejected token — like Apple's fault.
 *
 * ⚠ Apple hands out `credential.email` ONLY on the very first authorisation
 *   (and with "Hide My Email" it is a relay). So it is just the fallback:
 *   Supabase keeps the address and returns it in `s.user` on every later
 *   sign-in. */
export async function loginWithApple(identityToken: string, nonce: string, appleEmail?: string | null): Promise<LoginResult> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/api/auth/apple`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ identityToken, nonce }),
    });
  } catch {
    return { ok: false, why: "offline" };
  }
  return completeLogin(res, appleEmail ?? null);
}

/* Erneuern — EINMAL gleichzeitig. Gibt das neue Zugangstoken zurück oder
   null, wenn die Sitzung endgültig weg ist (dann ist lokal schon aufgeräumt). */
let refreshing: Promise<string | null> | null = null;
export function refresh(): Promise<string | null> {
  if (!refreshing) {
    refreshing = (async () => {
      const token = await SecureStore.getItemAsync(KEY_REFRESH);
      if (!token) return null;
      try {
        const res = await fetch(`${API_BASE}/api/auth/refresh`, {
          method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ refresh_token: token }),
        });
        if (res.status === 401 || res.status === 400) { await forget(); return null; }
        if (!res.ok) return null;             // Server gerade nicht da: Sitzung behalten, später nochmal
        const s = (await res.json()) as Session;
        await store(s);
        return s.access_token;
      } catch {
        return null;
      }
    })().finally(() => { refreshing = null; });
  }
  return refreshing;
}

/* Abmelden macht BEIDES (Hannis Punkt 4): das refresh_token bei Supabase
   ungültig UND das Gerät leer. Der Server-Aufruf scheitert nie sichtbar. */
export async function logout() {
  const access = await SecureStore.getItemAsync(KEY_ACCESS);
  await forget();
  if (!access) return;
  fetch(`${API_BASE}/api/auth/logout`, { method: "POST", headers: { authorization: `Bearer ${access}` } }).catch(() => {});
}

/* Konto löschen (Apple 5.1.1(v), 23.09.2026): DELETE /api/account löscht
   den Auth-Nutzer, die Kaskade in der Datenbank nimmt Profil, Träume und
   Guthaben mit. ERST der Server, DANN das Gerät vergessen — schlägt der
   Server fehl, bleibt die Sitzung da und die App kann es sagen, statt ein
   totes Konto zurückzulassen, an das niemand mehr herankommt. Die lokalen
   Träume auf dem Gerät bleiben absichtlich: Sie gehören der Person, nicht
   dem Konto (die App läuft auch ohne Konto).

   Apple-Konten (Weg A, 23.09.2026): Der Server antwortet 409 mit
   `reauth: "apple"` und will einen frischen Apple-Code, um die Apple-Token
   vor dem Löschen zu widerrufen. `appleCode` holt ihn (Apples Blatt);
   null heißt abgebrochen → "cancelled", nichts ist passiert. Der Aufrufer
   reicht die Funktion herein, damit dieses Modul Apple nicht kennen muss. */
export type DeleteResult = "done" | "failed" | "cancelled";
export async function deleteAccount(appleCode: () => Promise<string | null>): Promise<DeleteResult> {
  try {
    let res = await authFetch("/api/account", { method: "DELETE" });
    if (res.status === 409 && (await res.clone().json().catch(() => null))?.reauth === "apple") {
      const code = await appleCode();
      if (!code) return "cancelled";
      res = await authFetch("/api/account", {
        method: "DELETE", headers: { "content-type": "application/json" },
        body: JSON.stringify({ appleAuthorizationCode: code }),
      });
    }
    if (!res.ok) return "failed";
    await forget();
    return "done";
  } catch {
    return "failed";
  }
}

/* Ein Aufruf mit Konto. Pfad relativ (`/api/account`). Ohne Sitzung
   kommt ein 401 zurück, ohne dass etwas gesendet wurde. */
export async function authFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const go = (token: string) => fetch(`${API_BASE}${path}`, { ...init, headers: { ...(init.headers || {}), authorization: `Bearer ${token}` } });
  const access = await SecureStore.getItemAsync(KEY_ACCESS);
  if (!access) return new Response(JSON.stringify({ error: "Not signed in." }), { status: 401 });
  const first = await go(access);
  if (first.status !== 401) return first;
  const fresh = await refresh();
  if (!fresh) return first;
  return go(fresh);
}

/* Das Zugangstoken für Aufrufe, die NICHT zwingend ein Konto brauchen —
   die bezahlten Routen (S1, needsAccount() in src/lib/gatekeeper.js).
   Anders als authFetch: ohne Sitzung kommt null, und der Aufruf geht
   trotzdem raus; ob er ein Konto braucht, entscheidet der Server
   (REQUIRE_AUTH). So bleibt das lokale Entwickeln ohne Konto möglich.

   Geht als Funktions-Prop `getToken` an die Web-Ansichten (mobile/src/legacy),
   die den Schlüsselbund nicht erreichen. Diese Stellen gibt es nur, weil der
   Geldweg noch durch die alte Web-Oberfläche läuft (ADR-0006) — nach dem
   Umzug auf nativ fallen sie weg.

   Läuft das gespeicherte Token gleich ab (eine Stunde), wird vorher erneuert
   — sonst kostete jeder erste Aufruf danach einen 401-Umweg, und das
   Sprachinterview (WebSocket) könnte den gar nicht gehen.

   `fresh` heißt: der Server hat gerade „bitte anmelden" gesagt (api.js
   fragt nur dann). Lässt sich dann keine Sitzung erneuern UND ist niemand
   mehr angemeldet (Gast oder verlorene Sitzung), geht das Anmelde-Blatt auf
   (Schritt 3). Scheitert die Erneuerung nur am Netz, bleibt die Sitzung —
   dann kein Blatt. */
export async function getAccessToken(fresh = false): Promise<string | null> {
  if (!fresh) {
    const stored = await SecureStore.getItemAsync(KEY_ACCESS);
    if (stored && expiresSoon(stored)) return (await refresh()) ?? stored;
    return stored;
  }
  const token = await refresh();
  if (!token && !account) requestSignIn();
  return token;
}

/* Hat der Server mit „bitte anmelden" abgewiesen (needsAccount, S1)? Nur
   dann wird erneuert bzw. das Blatt geöffnet — ein anderer 401 bleibt, was
   er ist. Liest eine Kopie, die Antwort bleibt für den Aufrufer lesbar. */
async function wantsSignIn(res: Response): Promise<boolean> {
  if (res.status !== 401) return false;
  const body = await res.clone().json().catch(() => null);
  return body?.reason === "signin";
}

/* fetch auf eine volle Adresse, mit Token, wenn eines da ist. Verlangt der
   Server eine Anmeldung: mit Token einmal erneuern und wiederholen; ohne
   Token (Gast) oder ohne erneuerbare Sitzung das Anmelde-Blatt öffnen. */
export async function fetchWithSession(url: string, init: RequestInit = {}): Promise<Response> {
  const go = (token: string | null) => fetch(url, token ? { ...init, headers: { ...(init.headers || {}), authorization: `Bearer ${token}` } } : init);
  const access = await getAccessToken();
  const first = await go(access);
  if (!(await wantsSignIn(first))) return first;
  const fresh = access ? await refresh() : null;
  if (!fresh) {
    if (!account) requestSignIn();     // Netzaussetzer bei Angemeldeten: kein Blatt
    return first;
  }
  return go(fresh);
}

/* Das Profil ins Konto schreiben (PATCH /api/account, Hannis Erlaubnisliste:
   display_name, language, voice, onboarded, survey_done, survey). Nach dem
   Onboarding, wenn eine Sitzung da ist — sonst passiert nichts. Fehler
   sind hier keine Nachricht wert: das Gerät bleibt die Wahrheit, das
   Konto holt nach. */
export async function pushProfile(patch: { display_name?: string; language?: string; onboarded?: boolean; survey_done?: boolean; survey?: Record<string, unknown> }) {
  try {
    const res = await authFetch("/api/account", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(patch) });
    return res.ok;
  } catch {
    return false;
  }
}
