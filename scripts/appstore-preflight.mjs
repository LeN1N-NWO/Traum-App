/* App-Store-Preflight — prüft die Blocker-Liste aus docs/APP-STORE-EINREICHUNG.md
 * gegen den Quelltext, offline und in Sekunden. Antons Ansage 23.09.2026:
 * „Prüfwerkzeug bei uns integrieren, damit wir später selbst prüfen können."
 *
 * Aufruf:  bun run preflight   (oder: node scripts/appstore-preflight.mjs)
 * Exit 1, sobald ein ❌ dabei ist — CI-tauglich. In der Testphase sind
 * mehrere ❌ NORMAL (Test-Credits, Onboarding-jeder-Start …); das Skript
 * ist die Checkliste für den Tag, an dem eingereicht wird.
 *
 * Absichtlich nur statische Checks: kein Netz, keine Apple-Anmeldung.
 * Was App Store Connect braucht (Metadaten-Scan), macht später
 * `fastlane precheck` — siehe Teil 4 des Guides. */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => { try { return readFileSync(resolve(root, p), "utf8"); } catch { return null; } };

const results = [];
const check = (id, title, state, note) => results.push({ id, title, state, note });

// ── B1: Credits über Apple In-App-Kauf (3.1.1) ─────────────────────────────
const mobilePkg = read("mobile/package.json") ?? "";
const hasIap = /react-native-iap|expo-iap|react-native-purchases/.test(mobilePkg);
check("B1", "StoreKit/IAP-Paket vorhanden (3.1.1 — Credits nur über Apple)",
  hasIap ? "ok" : "fail",
  hasIap ? null : "Kein IAP-Paket in mobile/package.json — Kaufblatt ist Attrappe.");

// ── B2: Konto-Löschung in der App (5.1.1(v)) ───────────────────────────────
const server = read("server.js") ?? "";
const auth = read("mobile/src/lib/auth.ts") ?? "";
const delServer = server.includes("server_delete_account");
const delClient = auth.includes("deleteAccount");
check("B2", "Konto-Löschung in der App (5.1.1(v))",
  delServer && delClient ? "ok" : "fail",
  delServer && delClient ? null : `Server: ${delServer ? "ja" : "FEHLT"}, Client: ${delClient ? "ja" : "FEHLT"}`);

// ── B3: Server-Härtung fürs öffentliche Netz ───────────────────────────────
const corsNull = /NATIVE_ORIGINS\s*=\s*new Set\(\[[^\]]*"null"/.test(server);
check("B3a", "CORS: Testphasen-Eintrag \"null\" wieder entfernt",
  corsNull ? "fail" : "ok",
  corsNull ? "server.js NATIVE_ORIGINS erlaubt Origin \"null\" — nur fürs Heimnetz vertretbar." : null);
const env = read("mobile/.env") ?? "";
check("B3b", "App-Serveradresse ist HTTPS (kein LAN-HTTP eingebacken)",
  /EXPO_PUBLIC_API_BASE\s*=\s*https:\/\//.test(env) ? "ok" : "fail",
  /http:\/\//.test(env) ? `mobile/.env zeigt auf ${env.match(/EXPO_PUBLIC_API_BASE=(\S+)/)?.[1] ?? "?"}` : "mobile/.env fehlt oder ohne https-Adresse.");

// ── B4: Testphasen-Schalter ────────────────────────────────────────────────
const journalData = read("mobile/src/components/journal-data.tsx") ?? "";
const testCredits = /devCredits=\{(?!__DEV__)[^}]*\}/.test(journalData) && !/devCredits=\{__DEV__/.test(journalData);
check("B4a", "Test-Credits nur im Entwicklungsbau (journal-data.tsx)",
  testCredits ? "fail" : "ok",
  testCredits ? "devCredits gilt in ALLEN Bauarten — vor Release zurück auf `__DEV__ ? 100 : 0`." : null);
const gate = read("mobile/src/components/onboarding-gate.tsx") ?? "";
/* Nicht auf __DEV__ irgendwo prüfen (steht auch in Kommentaren), sondern
   auf die zwei echten Sperren: Start-Zustand und Frührückkehr. */
const onbAlways = !(/useState\([^)]*__DEV__/.test(gate) || /if \(!__DEV__\) return/.test(gate));
check("B4b", "Onboarding nur einmal (nicht bei jedem Start im Release)",
  onbAlways ? "fail" : "ok",
  onbAlways ? "onboarding-gate.tsx zeigt das Onboarding bei jedem Start — Testphasen-Schalter." : null);

// ── B5: Lokalisierte Systemtexte ───────────────────────────────────────────
const iosDir = existsSync(resolve(root, "mobile/ios/DreamRushes"));
if (iosDir) {
  /* Zwei Orte: Antons Handarbeit im Xcode-Projekt (de.lproj direkt unter
     DreamRushes/) und seit 23.09. Expos `locales` aus app.json, die der
     Prebuild unter Supporting/de.lproj/ anlegt. */
  const deStrings = ["mobile/ios/DreamRushes/de.lproj/InfoPlist.strings", "mobile/ios/DreamRushes/Supporting/de.lproj/InfoPlist.strings"]
    .some((p) => existsSync(resolve(root, p)));
  check("B5", "Erlaubnis-Texte lokalisiert (InfoPlist.strings de)",
    deStrings ? "ok" : "fail",
    deStrings ? null : "NSMicrophone/NSPhoto/NSFaceID-Texte sind nur englisch (Onboarding-Befund 10).");
} else {
  check("B5", "Erlaubnis-Texte lokalisiert", "skip", "mobile/ios fehlt in diesem Checkout (Worktree) — im Hauptordner prüfen.");
}

// ── B6: Privacy Manifest ───────────────────────────────────────────────────
if (iosDir) {
  const manifest = read("mobile/ios/DreamRushes/PrivacyInfo.xcprivacy");
  const hasApiTypes = manifest?.includes("NSPrivacyAccessedAPITypes");
  check("B6", "PrivacyInfo.xcprivacy mit Required-Reason-Einträgen",
    manifest ? (hasApiTypes ? "ok" : "warn") : "fail",
    manifest ? (hasApiTypes ? null : "Manifest da, aber ohne NSPrivacyAccessedAPITypes — Einträge der Pods ggf. hineinkopieren.") : "PrivacyInfo.xcprivacy fehlt.");
} else {
  check("B6", "PrivacyInfo.xcprivacy", "skip", "mobile/ios fehlt in diesem Checkout — im Hauptordner prüfen.");
}

// ── B7: Export-Compliance-Flag ─────────────────────────────────────────────
if (iosDir) {
  const plist = read("mobile/ios/DreamRushes/Info.plist") ?? "";
  check("B7", "ITSAppUsesNonExemptEncryption gesetzt",
    plist.includes("ITSAppUsesNonExemptEncryption") ? "ok" : "fail",
    plist.includes("ITSAppUsesNonExemptEncryption") ? null : "Ohne das Flag fragt jeder Upload nach Verschlüsselungs-Doku (Einzeiler in Info.plist).");
  check("FaceID", "NSFaceIDUsageDescription vorhanden",
    plist.includes("NSFaceIDUsageDescription") ? "ok" : "fail", null);
} else {
  check("B7", "ITSAppUsesNonExemptEncryption", "skip", "mobile/ios fehlt in diesem Checkout — im Hauptordner prüfen.");
}

// ── Was stimmen muss und stimmt (Anker gegen Rückbau) ──────────────────────
const en = read("src/i18n/en.js") ?? "";
check("KI", "Einwilligungs-Tor nennt KI-Anbieter + Klartext-Kacheln (Nov-2025-Pflicht)",
  en.includes("facts:") && /fal\.ai, Google, DeepSeek/.test(en) ? "ok" : "fail",
  null);
const appJson = read("mobile/app.json") ?? "";
const bundleId = appJson.match(/"bundleIdentifier":\s*"([^"]+)"/)?.[1];
check("ID", `Bundle-ID: ${bundleId ?? "?"}`,
  "warn",
  "Antons Build nutzt app.dreamrushes, Hannis Signierung com.dreamrushes.app — VOR dem ersten Upload EINE festlegen (unveränderlich).");

// ── Ausgabe ────────────────────────────────────────────────────────────────
const mark = { ok: "✅", fail: "❌", warn: "⚠️ ", skip: "➖" };
console.log("App-Store-Preflight — docs/APP-STORE-EINREICHUNG.md, Teil 2\n");
for (const r of results) {
  console.log(`${mark[r.state]}  [${r.id}] ${r.title}`);
  if (r.note) console.log(`      ${r.note}`);
}
const fails = results.filter((r) => r.state === "fail").length;
const warns = results.filter((r) => r.state === "warn").length;
console.log(`\n${fails} Blocker, ${warns} Warnungen, ${results.length} Prüfungen.`);
if (fails) { console.log("In der Testphase sind Blocker normal — vor der Einreichung muss hier 0 stehen."); process.exit(1); }
