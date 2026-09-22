import * as SecureStore from "expo-secure-store";
import { useSyncExternalStore } from "react";

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

export type LoginFailure = "wrong" | "busy" | "unavailable" | "offline";
export type LoginResult = { ok: true; user: AuthUser } | { ok: false; why: LoginFailure };

/* Who is signed in, for the UI — read back from the keychain at start
   (`restoreSession`), held in memory afterwards.
   ⚠ Signed in means: a session exists. The e-mail is shown, never tested —
   Sign in with Apple can create accounts without one, and keying on it put
   such a person back on the sign-in screen after every start. */
let account: AuthUser | null = null;
let restored = false;
const listeners = new Set<() => void>();
function announce(next: AuthUser | null) { account = next; listeners.forEach((l) => l()); }
export function useAccount() {
  return useSyncExternalStore((l) => { listeners.add(l); return () => { listeners.delete(l); }; }, () => account, () => account);
}

export async function restoreSession() {
  if (restored) return account;
  restored = true;
  const [access, id, saved] = await Promise.all([KEY_ACCESS, KEY_USER, KEY_EMAIL].map((k) => SecureStore.getItemAsync(k)));
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
  if (!res.ok) return { ok: false, why: failure(res.status) };
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
