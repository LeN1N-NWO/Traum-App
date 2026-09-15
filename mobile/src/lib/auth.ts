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
 * Arbeitsspeicher hält dieses Modul nur, wer angemeldet ist (E-Mail), für
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

export type AuthUser = { id: string; email: string };
type Session = { access_token: string; refresh_token: string; user?: AuthUser };

export type LoginFailure = "wrong" | "busy" | "unavailable" | "offline";
export type LoginResult = { ok: true; user: AuthUser } | { ok: false; why: LoginFailure };

/* Wer angemeldet ist, für die Oberfläche — beim Start aus dem Schlüsselbund
   nachgelesen (`restoreSession`), danach im Speicher. */
let email: string | null = null;
let restored = false;
const listeners = new Set<() => void>();
function announce(next: string | null) { email = next; listeners.forEach((l) => l()); }
export function useAccountEmail() {
  return useSyncExternalStore((l) => { listeners.add(l); return () => { listeners.delete(l); }; }, () => email, () => email);
}

export async function restoreSession() {
  if (restored) return email;
  restored = true;
  const [access, saved] = await Promise.all([SecureStore.getItemAsync(KEY_ACCESS), SecureStore.getItemAsync(KEY_EMAIL)]);
  announce(access && saved ? saved : null);
  return email;
}

async function store(s: Session) {
  await Promise.all([
    SecureStore.setItemAsync(KEY_ACCESS, s.access_token),
    SecureStore.setItemAsync(KEY_REFRESH, s.refresh_token),
    s.user?.email ? SecureStore.setItemAsync(KEY_EMAIL, s.user.email) : Promise.resolve(),
  ]);
}
async function forget() {
  await Promise.all([KEY_ACCESS, KEY_REFRESH, KEY_EMAIL].map((k) => SecureStore.deleteItemAsync(k).catch(() => {})));
  announce(null);
}

function failure(status: number): LoginFailure {
  if (status === 401) return "wrong";
  if (status === 429) return "busy";
  return "unavailable";          // 503 nicht eingerichtet, 5xx von Supabase, alles andere
}

/* Der gemeinsame Schluss beider Anmeldewege: prüfen, in den Schlüsselbund
   legen, der Oberfläche sagen, wer da ist. Die Antwort des Servers hat immer
   Vorrang vor dem, was wir lokal zu wissen glauben — nur wenn sie keinen
   Nutzer trägt, greift `fallbackEmail`. */
async function completeLogin(res: Response, fallbackEmail: string): Promise<LoginResult> {
  if (!res.ok) return { ok: false, why: failure(res.status) };
  const s = (await res.json()) as Session;
  if (!s.access_token || !s.refresh_token) return { ok: false, why: "unavailable" };
  await store(s);
  const user = s.user ?? { id: "", email: fallbackEmail };
  announce(user.email);
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

/* Mit Apple anmelden (15.09.2026). Anders als oben entsteht hier ein Konto,
   wenn es noch keines gibt — Apple hat die Person schon geprüft.
 *
 * ⚠ Der `nonce` geht ROH an unseren Server; Apple hat nur den SHA-256-Abdruck
 *   davon gesehen. Supabase bildet den Abdruck selbst und vergleicht. Wer hier
 *   „sicherheitshalber" den gehashten Wert schickt, hasht einen Hash — und der
 *   Fehler liest sich wie ein abgelehnter Token, also wie Apples Schuld.
 *
 * ⚠ `credential.email` gibt Apple NUR bei der allerersten Freigabe heraus,
 *   danach nie wieder (und bei „Hide My Mail" ist es eine Weiterleitung).
 *   Deshalb ist es hier nur der Notnagel: Supabase merkt sich die Adresse und
 *   schickt sie in `s.user` bei jeder weiteren Anmeldung mit. */
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
  return completeLogin(res, appleEmail ?? "");
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
