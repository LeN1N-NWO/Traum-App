import { AESEncryptionKey, AESSealedData, aesDecryptAsync, aesEncryptAsync, CryptoDigestAlgorithm, digest } from "expo-crypto";
import * as SecureStore from "expo-secure-store";

/* Der Schlüssel der Sicherung (Hanni + Anton 24.09.2026,
 * docs/plans/2026-09-24-medienablage.md): Träume werden AUF DEM GERÄT
 * verschlüsselt, bevor sie als Sicherung auf den Server gehen. Server und
 * Speicheranbieter sehen nur unlesbare Daten — wir auch.
 *
 * ⚠ Der Schlüssel liegt im iCloud-Schlüsselbund (`synchronizable`, ein
 *   Bun-Patch an expo-secure-store, mobile/patches/). Nur so übersteht er,
 *   wofür die Sicherung da ist: App gelöscht, Handy verloren, neues Handy
 *   mit derselben Apple-ID. Läge er nur auf dem Gerät, wäre er mit dem Handy
 *   weg — und die Sicherung wertlos, genau wenn man sie braucht.
 *
 * Die Kennung (`keyId`) ist ein Hash des Schlüssels, nicht der Schlüssel.
 * Sie geht mit jeder Sicherung mit, damit ein Gerät mit einem ANDEREN
 * Schlüssel fremde Sicherungen erkennt, statt sie zu überschreiben. */

const KEY_NAME = "dr_backup_key_v1";
const OPTIONS = { synchronizable: true } as SecureStore.SecureStoreOptions;

export type BackupKey = { key: AESEncryptionKey; keyId: string };

let cached: Promise<BackupKey> | null = null;

async function idOf(raw: Uint8Array): Promise<string> {
  const hash = new Uint8Array(await digest(CryptoDigestAlgorithm.SHA256, new Uint8Array(raw)));
  return Array.from(hash.slice(0, 8), (b) => b.toString(16).padStart(2, "0")).join("");
}

async function load(create: boolean): Promise<BackupKey | null> {
  const stored = await SecureStore.getItemAsync(KEY_NAME, OPTIONS);
  if (stored) {
    const key = await AESEncryptionKey.import(stored, "base64");
    return { key, keyId: await idOf(await key.bytes()) };
  }
  if (!create) return null;
  const key = await AESEncryptionKey.generate();
  await SecureStore.setItemAsync(KEY_NAME, await key.encoded("base64"), OPTIONS);
  return { key, keyId: await idOf(await key.bytes()) };
}

/** Der Schlüssel dieses Nutzers, falls es ihn (in iCloud) schon gibt. */
export async function existingBackupKey(): Promise<BackupKey | null> {
  return load(false);
}

/** Der Schlüssel — beim ersten Mal erzeugt. Nur aufrufen, wenn sicher ist,
 *  dass es für dieses Konto noch keine Sicherung mit einem anderen Schlüssel
 *  gibt (dream-sync.ts prüft das vorher). */
export function backupKey(): Promise<BackupKey> {
  if (!cached) cached = load(true).then((k) => k!).catch((e) => { cached = null; throw e; });
  return cached;
}

/** Ein Traum (JSON) → versiegelt, base64 (IV + Chiffretext + Tag). */
export async function seal(value: unknown, k: BackupKey): Promise<string> {
  /* Bytes, nicht String: Ein String gilt hier als base64 (expo-crypto). */
  const sealed = await aesEncryptAsync(new TextEncoder().encode(JSON.stringify(value)), k.key);
  return sealed.combined("base64");
}

/** Versiegelt → JSON. `null`, wenn es nicht passt (falscher Schlüssel,
 *  beschädigt) — AES-GCM prüft die Echtheit, falsche Daten gehen nie durch. */
export async function unseal<T = unknown>(combined: string, k: BackupKey): Promise<T | null> {
  try {
    const data = AESSealedData.fromCombined(combined);
    const bytes = await aesDecryptAsync(data, k.key, { output: "bytes" });
    return JSON.parse(new TextDecoder().decode(bytes)) as T;
  } catch {
    return null;
  }
}
