# Recherche: Benachrichtigungen, HealthKit-Schlaf, Widgets, Konfetti — Expo SDK 57

Stand 13.09.2026. Nur Recherche, nichts im Repo geändert.

## 0. Ist-Zustand `mobile/`

- Expo `57.0.22`, RN `0.86.3`, Reanimated `4.5.1`, Worklets `0.10.1`, `@expo/ui ~57.0.18`,
  expo-router 57, `experiments.reactCompiler: true`, `typedRoutes: true`. Kein `app.config.*`, nur `app.json`.
- **`mobile/ios/` existiert, ist aber git-ignoriert (`/ios` in `mobile/.gitignore`) → CNG/Prebuild.**
  Erzeugt über `bun run prebuild:ios` (= `bunx expo prebuild --platform ios --no-install`, dann
  `.xcode.env.local` + `bun run pods` mit lokalen Hermes-/RN-Core-Tarballs). Gebaut wird **lokal**
  mit Xcode ▶ bzw. `xcodebuild … -derivedDataPath /tmp/dr-dd`, dann `simctl install`. Kein `eas.json`,
  kein `expo-dev-client` im package.json (die Hülle läuft trotzdem gegen Metro).
- Deployment Target 16.4, Entitlements-Datei leer, **kein `DEVELOPMENT_TEAM`** gesetzt → bisher nur Simulator.
- Konsequenz für alles unten mit nativem Code: Paket installieren → Plugin in `app.json` →
  `bun run prebuild:ios` → neu bauen. Handänderungen in `ios/` gehen beim Prebuild verloren.
- Noch nichts vorhanden zu Notifications/HealthKit/Widgets/Konfetti in `mobile/src`.

---

## 1. expo-notifications (lokale Erinnerungen)

**Installation:** `cd mobile && bunx expo install expo-notifications` (SDK-57-Version `~57.0.x`).

**Native Rebuild: JA.** Neues natives Modul (nicht im Podfile.lock) → `bun run prebuild:ios` + Xcode-Build.
Lokale Notifications gehen im iOS-Simulator (Xcode 14+/iOS 16+).

**Config-Plugin** (optional; wird von `@expo/prebuild-config` sogar automatisch angewendet, sobald das
Paket installiert ist — steht in `versionedExpoSDKPackages`):
```json
["expo-notifications", { "icon": "./assets/images/notification-icon.png", "color": "#0a0d16", "sounds": [] }]
```
Optionen: `icon`, `color`, `defaultChannel` (Android), `sounds`, `enableBackgroundRemoteNotifications`, `mode`.

**⚠ Stolperstein Gerät/Signierung:** Das iOS-Plugin setzt **immer** `aps-environment` (Push-Entitlement,
Quelle `packages/expo-notifications/plugin/src/withNotificationsIOS.ts`, sdk-57). Mit einem kostenlosen
„Personal Team" lässt sich Push nicht signieren → Gerätebuild scheitert. Für rein lokale Erinnerungen:
kleines eigenes Config-Plugin, das `aps-environment` wieder löscht, oder bezahlter Developer-Account.
Simulator ist nicht betroffen. (https://github.com/expo/expo/issues/18951)

**SDK-57-API (Änderungen seit SDK 52/53 beachten):**
- Trigger brauchen `type: SchedulableTriggerInputTypes.X`: `TIME_INTERVAL`, `DATE`, `DAILY {hour, minute}`,
  `WEEKLY {weekday, hour, minute}`, `MONTHLY`, `YEARLY`, `CALENDAR` (nur iOS). DAILY wird auf iOS intern
  als wiederholender Calendar-Trigger umgesetzt.
- `setNotificationHandler`: `shouldShowAlert` ist **deprecated** → `shouldShowBanner` + `shouldShowList`.
- `getLastNotificationResponse()` (synchron) ist der neue Weg; `getLastNotificationResponseAsync` deprecated.
- 56.0.0: Mindest-iOS 16.4 (passt). 55.0.0: Pod heißt `ExpoNotifications`. 57.0.0: keine Nutzeränderungen.
- Berechtigung: `getPermissionsAsync()` / `requestPermissionsAsync({ ios: { allowAlert, allowSound, allowBadge, provideAppNotificationSettings? } })`;
  auf iOS `status.ios.status` auswerten (`NOT_DETERMINED | DENIED | AUTHORIZED | PROVISIONAL | EPHEMERAL`).
- `interruptionLevel: 'passive' | 'active' | 'timeSensitive' | 'critical'` im `content` — für Reality
  Checks `passive` oder `active`, **nicht** `timeSensitive` (braucht eigenes Entitlement).
- **Apple-Limit: max. 64 ausstehende lokale Notifications pro App** (ältere/spätere werden verworfen).

**Strategie für die drei Arten:**
- Morgens 07:30 „What did you dream?" → 1× `DAILY`.
- Abends Wind-down (z. B. 22:00 oder aus Schlafenszeit berechnet) → 1× `DAILY`.
- Reality Checks „zufällig": DAILY würde jeden Tag dieselbe Uhrzeit liefern. Besser: für die nächsten
  7 Tage je N `DATE`-Trigger zu Zufallszeiten (Tagesfenster in N Slots teilen, pro Slot zufällige Minute).
  5/Tag × 7 = 35 + 2 = 37 < 64. Bei jedem App-Start/Vordergrund nachplanen (alle mit eigenem
  `identifier`-Präfix `rc-` löschen und neu setzen).

**Minimaler Code-Entwurf** (Texte gehören laut AGENTS.md in die i18n-Dateien, hier nur Platzhalter):
```ts
// mobile/src/lib/reminders.ts
import * as Notifications from "expo-notifications";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false,
  }),
});

export async function ensureNotificationPermission(): Promise<boolean> {
  const cur = await Notifications.getPermissionsAsync();
  if (cur.granted || cur.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) return true;
  if (!cur.canAskAgain) return false;
  const req = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowSound: true, allowBadge: false },
  });
  return req.granted;
}

const T = Notifications.SchedulableTriggerInputTypes;

export async function scheduleReminders(opts = {
  morning: { hour: 7, minute: 30 }, evening: { hour: 22, minute: 0 },
  checksPerDay: 5, windowStart: 10, windowEnd: 20, days: 7,
}) {
  await Notifications.cancelAllScheduledNotificationsAsync();

  await Notifications.scheduleNotificationAsync({
    identifier: "morning",
    content: { title: "What did you dream?", body: "Tell it before it fades.", data: { url: "/dream" } },
    trigger: { type: T.DAILY, ...opts.morning },
  });
  await Notifications.scheduleNotificationAsync({
    identifier: "evening",
    content: { title: "Time to wind down", body: "Set an intention for tonight.", data: { url: "/sleep/checklist" } },
    trigger: { type: T.DAILY, ...opts.evening },
  });

  const now = Date.now();
  const slotMin = ((opts.windowEnd - opts.windowStart) * 60) / opts.checksPerDay;
  for (let d = 0; d < opts.days; d++) {
    for (let i = 0; i < opts.checksPerDay; i++) {
      const date = new Date();
      date.setDate(date.getDate() + d);
      date.setHours(opts.windowStart, 0, 0, 0);
      date.setMinutes(Math.round(slotMin * i + Math.random() * slotMin * 0.8));
      if (date.getTime() <= now) continue;
      await Notifications.scheduleNotificationAsync({
        identifier: `rc-${d}-${i}`,
        content: { title: "Are you dreaming?", body: "Look at your hands. Check again.",
                   data: { url: "/sleep/guide" }, interruptionLevel: "passive" },
        trigger: { type: T.DATE, date },
      });
    }
  }
}
```
```tsx
// mobile/src/app/_layout.tsx — Deep-Link beim Tippen (auch Kaltstart)
import * as Notifications from "expo-notifications";
import { router, type Href } from "expo-router";
import { useEffect } from "react";

function useNotificationObserver() {
  useEffect(() => {
    const go = (n: Notifications.Notification) => {
      const url = n.request.content.data?.url;
      if (typeof url === "string") router.push(url as Href);
    };
    const last = Notifications.getLastNotificationResponse();
    if (last?.notification) go(last.notification);
    const sub = Notifications.addNotificationResponseReceivedListener((r) => go(r.notification));
    return () => sub.remove();
  }, []);
}
```
Hinweis: Wenn der Kaltstart-Push vor dem ersten Layout-Mount passiert, ggf. `clearLastNotificationResponseAsync()`
nach dem Navigieren aufrufen, damit es nicht doppelt feuert.

Quellen:
- https://docs.expo.dev/versions/v57.0.0/sdk/notifications/
- https://docs.expo.dev/versions/latest/sdk/notifications/
- https://github.com/expo/expo/blob/sdk-57/packages/expo-notifications/CHANGELOG.md
- https://github.com/expo/expo/blob/sdk-57/packages/expo-notifications/plugin/src/withNotificationsIOS.ts
- https://docs.expo.dev/push-notifications/faq/

---

## 2. Schlafdaten aus Apple HealthKit

**Bibliothek: `@kingstinct/react-native-healthkit`** — aktuell **15.1.0 (11.09.2026)**, sehr aktiv
(14.0.0 April, 14.1.0 Aug, 15.0.0/15.1.0 Sept; iOS-27-Typen schon drin). Basiert seit v9 auf
**Nitro Modules** → Peer-Deps: `react >=19`, `react-native >=0.79`, `react-native-nitro-modules >=0.35`.
Alternative `react-native-health` (agencyenterprise) ist deutlich älter/weniger gepflegt — nicht empfehlenswert.

**Installation:** `cd mobile && bun add @kingstinct/react-native-healthkit react-native-nitro-modules`
→ Plugin → `bun run prebuild:ios` → Rebuild. **Nicht in Expo Go, braucht eigenen nativen Build.**

**Config-Plugin** (`app.json`):
```json
["@kingstinct/react-native-healthkit", {
  "NSHealthShareUsageDescription": "Dream Rushes reads your sleep to link dreams to how you slept.",
  "NSHealthUpdateUsageDescription": false,
  "background": false
}]
```
Das Plugin setzt (Quelle `app.plugin.ts`):
- Entitlement `com.apple.developer.healthkit = true`
- `com.apple.developer.healthkit.background-delivery = true` (Standard an; `background: false` schaltet ab — für „letzte Nacht beim Öffnen lesen" nicht nötig)
- Info.plist `NSHealthShareUsageDescription` (Pflicht zum Lesen), `NSHealthUpdateUsageDescription` (nur zum Schreiben; `false` lässt den Schlüssel weg — **aber** für DEV-Testdaten im Simulator braucht man ihn, s. u.)
- Keine AppDelegate-Änderung mehr nötig (seit 15.1.0 registriert der Pod selbst).

**API:**
- `isHealthDataAvailable(): boolean` (auch `…Async`)
- `requestAuthorization({ toRead: [...], toShare?: [...] }): Promise<boolean>` — **vor jeder Abfrage Pflicht**, sonst Absturz.
  Apple verrät nie, ob Lesen verweigert wurde → verweigert = einfach leere Ergebnisse.
- `getRequestStatusForAuthorization({ toRead })` → `unknown | shouldRequest | unnecessary`
- `queryCategorySamples(identifier, { limit, ascending?, filter?: { date?: { startDate, endDate, strictStartDate?, strictEndDate? } } })`
  — `limit` ist Pflicht; `0`/`-1` = alle.
- `CategoryValueSleepAnalysis`: `inBed=0, asleepUnspecified=1 (=asleep), awake=2, asleepCore=3, asleepDeep=4, asleepREM=5`
- Hook-Variante: `useHealthkitAuthorization({ toRead: [...] })` → `[status, request]`.
- v15-Breaking-Change: `sample.sourceRevision.source` ist jetzt ein Plain-Objekt `{ name, bundleIdentifier }`.

**Code-Entwurf „letzte Nacht":**
```ts
import {
  isHealthDataAvailable, requestAuthorization, queryCategorySamples, CategoryValueSleepAnalysis as S,
} from "@kingstinct/react-native-healthkit";

const SLEEP = "HKCategoryTypeIdentifierSleepAnalysis" as const;

export async function lastNightSleep() {
  if (!isHealthDataAvailable()) return null;
  await requestAuthorization({ toRead: [SLEEP] });

  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - 1);
  start.setHours(18, 0, 0, 0); // gestern 18:00 bis jetzt

  const samples = await queryCategorySamples(SLEEP, {
    limit: 0, ascending: true, filter: { date: { startDate: start, endDate: end } },
  });
  if (!samples.length) return null;

  const asleep = samples.filter((s) => s.value !== S.inBed && s.value !== S.awake);
  // Achtung: iPhone + Watch + Dritt-Apps liefern überlappende Intervalle → pro Quelle
  // (sourceRevision.source.bundleIdentifier) filtern oder Intervalle zusammenführen.
  const minutes = (v: number[]) => asleep.filter((s) => v.includes(s.value))
    .reduce((m, s) => m + (+s.endDate - +s.startDate) / 60000, 0);

  return {
    bedtime: samples[0].startDate,
    wake: samples[samples.length - 1].endDate,
    asleepMin: minutes([S.asleepUnspecified, S.asleepCore, S.asleepDeep, S.asleepREM]),
    remMin: minutes([S.asleepREM]),   // Phasen nur mit Apple Watch (iOS 16+)
    deepMin: minutes([S.asleepDeep]),
  };
}
```

**Simulator:** HealthKit funktioniert im iPhone-Simulator, die Health-App ist dort installiert. Testdaten:
(a) in der Health-App des Simulators manuell unter Browse → Sleep → „Add Data" (nach meinem Kenntnisstand
nur „In Bed/Asleep", keine Phasen), oder (b) aus der App in `__DEV__` mit
`saveCategorySample(SLEEP, S.asleepREM, start, end)` Phasen schreiben (braucht `toShare: [SLEEP]` und
`NSHealthUpdateUsageDescription`), oder (c) Generator-App wie heal-healthkit-generator. Simulator löschen = Daten weg.

**⚠ Risiko Nitro + vorkompilierter RN-Core:** Das Projekt baut Pods mit lokalen RN-Core-Tarballs
(prebuilt core). Unter RN 0.87 mit `RCT_USE_PREBUILT_RNCORE=1` gab es Modul-Konflikte mit Nitro-Modulen
(„jsi.h … must be imported from module 'React'"). Für 0.86 nicht belegt, aber beim ersten `pod install`
darauf achten; Workaround wäre `RCT_USE_PREBUILT_RNCORE=0` bzw. `SWIFT_ENABLE_EXPLICIT_MODULES=NO`.

**Signierung/Store:** HealthKit-Capability muss auf der App-ID aktiv sein (macht Xcode/EAS automatisch
beim Signieren); App Review verlangt klaren Gesundheitsbezug + Datenschutzerklärung; Health-Daten
dürfen nicht für Werbung genutzt werden.

Quellen:
- https://github.com/kingstinct/react-native-healthkit (README, `packages/react-native-healthkit/app.plugin.ts`, `src/types/QueryOptions.ts`, `src/specs/CategoryTypeModule.nitro.ts`, `CHANGELOG.md`)
- https://kingstinct.com/react-native-healthkit/
- https://github.com/getheal/heal-healthkit-generator
- https://github.com/TheWidlarzGroup/react-native-video/issues/5084 (Nitro + prebuilt core)
- https://developer.apple.com/documentation/healthkit/hkcategoryvaluesleepanalysis

---

## 3. iOS-Widgets (Home- und Sperrbildschirm)

**Offiziell: `expo-widgets` gibt es** — seit SDK 56 stabil, in SDK 57 `~57.0.18` (babel-preset-expo 57
listet es schon als optionalen Peer, d. h. die `'widget'`-Direktive wird vom Bundler unterstützt).
Widgets werden in **TSX mit `@expo/ui/swift-ui`** geschrieben (ist schon installiert), kein Swift nötig.
Die Direktive `'widget'` kompiliert die Komponente in ein **separates JS-Bundle, das in einer isolierten
Runtime in der Widget-Extension läuft.** CNG erzeugt Extension-Target, App Group und SwiftUI-Gerüst.

**Installation:** `cd mobile && bunx expo install expo-widgets` → Plugin → `bun run prebuild:ios` → Rebuild.
Nicht in Expo Go. Mindest-iOS 16.4 (passt).

**Plugin:**
```json
["expo-widgets", {
  "bundleIdentifier": "app.dreamrushes.widgets",
  "groupIdentifier": "group.app.dreamrushes",
  "widgets": [{
    "name": "DreamStreak",
    "displayName": "Dream Streak",
    "description": "Your dream journal at a glance",
    "ios": { "supportedFamilies": ["systemSmall", "systemMedium", "accessoryCircular", "accessoryRectangular", "accessoryInline"] }
  }]
}]
```
Familien: `systemSmall/Medium/Large/ExtraLarge`, Sperrbildschirm `accessoryCircular/Rectangular/Inline`.
`groupIdentifier` ist standardmäßig `group.<bundle id>`.

**API:** `createWidget(name, Component)`; `Widget.updateSnapshot(props)` (sofort), `Widget.updateTimeline([{ date, props }])`
(geplant), `reload()`. `environment.widgetFamily` für größenabhängige Layouts. Interaktive `Button`s:
Rückgabewert von `onPress` = neue Props, App hört per `addUserInteractionListener`; `Link` aus `@expo/ui`
für Deep-Links. SDK 57 neu: konfigurierbare Widgets (57.0.8), `ChartView` (57.0.7); Live Activities
mit `staleDate` (57.0.12). Seit 56.0.17 geteiltes Verzeichnis für Bilder.

**Einschränkungen:** Im `'widget'`-Code keine Hooks, kein async/fetch, keine Referenzen auf Modul-Scope,
keine RN-Komponenten — alles kommt über Props/`environment`. Daten also in der App vorberechnen
(z. B. Streak, letzter Traumtitel, nächster Reality Check) und per `updateSnapshot` reinschieben.

```tsx
// mobile/src/widgets/dream-streak.tsx
import { Text, VStack } from "@expo/ui/swift-ui";
import { createWidget, type WidgetEnvironment } from "expo-widgets";

type Props = { streak: number; lastTitle: string };

const DreamStreak = (props: Props, env: WidgetEnvironment) => {
  "widget";
  if (env.widgetFamily === "accessoryInline") return <Text>{props.streak} nights logged</Text>;
  return (
    <VStack spacing={6}>
      <Text>{props.streak}</Text>
      <Text>{props.lastTitle}</Text>
    </VStack>
  );
};
export default createWidget("DreamStreak", DreamStreak);

// in der App nach dem Speichern eines Traums:
// DreamStreak.updateSnapshot({ streak, lastTitle });
```

**Alternative `@bacons/apple-targets`** (Evan Bacon, aktiv, CNG-freundlich, `targets/`-Ordner außerhalb
von `ios/`): `npx create-target widget`, Widget in **Swift/SwiftUI selbst schreiben**, Daten über
`ExtensionStorage` (UserDefaults der App Group) + `ExtensionStorage.reloadWidget()`. Mehr Kontrolle
(volle WidgetKit-API, Animationen, AppIntents), aber Swift-Pflege. Braucht Xcode 16+, CocoaPods ≥ 1.16.2.

**Aufwand (Schätzung):**
- `expo-widgets`, ein Small + Lock-Screen-Widget mit Streak/letztem Traum: **~0,5–1 Tag** inkl. Prebuild,
  Layout-Feinschliff in SwiftUI-Primitiven und Datenfluss.
- `@bacons/apple-targets` mit handgeschriebenem SwiftUI: **~1–2 Tage**.
- Gerät: Extension + App Group brauchen ein Signier-Team (App-Group-ID muss registrierbar sein);
  im Simulator läuft es ohne.
**Empfehlung:** `expo-widgets` — offiziell, passt zu `@expo/ui`, das schon im Projekt ist.

Quellen:
- https://docs.expo.dev/versions/latest/sdk/widgets/
- https://expo.dev/blog/ios-widgets-and-live-activities-in-expo
- https://github.com/expo/expo/blob/sdk-57/packages/expo-widgets/CHANGELOG.md
- https://github.com/EvanBacon/expo-apple-targets

---

## 4. Konfetti / Feier-Animation

| Option | Neue Abhängigkeiten | Rebuild | Stand |
|---|---|---|---|
| **Eigene Reanimated-4-Komponente** | keine (Reanimated 4.5.1 + Worklets da) | **nein**, reines JS | selbst gepflegt |
| `react-native-confetti-cannon` 1.5.2 | keine nativen (RN `Animated`) | nein | seit 2023 nicht gepflegt |
| `react-native-reanimated-confetti` 1.4.2 | keine nativen | nein | Reanimated-3-Zeit, seit 11/2024 still, 17 Sterne |
| `react-native-fast-confetti` 2.0.2 | **`@shopify/react-native-skia` ≥2** (+ Reanimated ≥4.1, Worklets) | **ja** | aktiv (Aug 2026), sehr schnell (Skia Atlas), aber Skia = großes natives Paket |

**Empfehlung:** eigene Komponente, ~60 Zeilen, null Abhängigkeiten, läuft per Metro-Reload. Ein
einziger Shared Value treibt alle Teilchen (nur eine `withTiming`-Animation), Parameter pro Teilchen
zufällig in JS. 40–80 `Animated.View`s sind unkritisch. Wegen `reactCompiler: true`
**`.get()`/`.set()` statt `.value`** verwenden; Reanimated 4: `scheduleOnRN` (react-native-worklets) statt `runOnJS`.
Mit `expo-haptics` (schon da) `notificationAsync(Success)` zum Start kombinieren.

```tsx
// mobile/src/components/confetti.tsx
import { useEffect, useMemo } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming, type SharedValue } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

const COLORS = ["#f5d06f", "#b9a6ff", "#7fd1ff", "#ff9fc4", "#ffffff"];
type P = { x: number; vx: number; vy: number; w: number; h: number; spin: number; flip: number; color: string };

function Piece({ p, t, g }: { p: P; t: SharedValue<number>; g: number }) {
  const style = useAnimatedStyle(() => {
    const s = t.get();
    return {
      opacity: s > 0.8 ? (1 - s) / 0.2 : 1,
      transform: [
        { translateX: p.x + p.vx * s },
        { translateY: -40 + p.vy * s + g * s * s },
        { rotate: `${p.spin * s}deg` },
        { rotateX: `${p.flip * s}deg` },
      ],
    };
  });
  return <Animated.View style={[styles.piece, { width: p.w, height: p.h, backgroundColor: p.color }, style]} />;
}

export function Confetti({ count = 60, duration = 2600, onDone }: { count?: number; duration?: number; onDone?: () => void }) {
  const { width, height } = useWindowDimensions();
  const t = useSharedValue(0);
  const pieces = useMemo<P[]>(() => Array.from({ length: count }, () => ({
    x: Math.random() * width,
    vx: (Math.random() - 0.5) * 160,
    vy: -Math.random() * height * 0.25,       // kurzer Wurf nach oben
    w: 6 + Math.random() * 6, h: 10 + Math.random() * 8,
    spin: (Math.random() - 0.5) * 1440, flip: Math.random() * 1080,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
  })), [count, width, height]);

  useEffect(() => {
    t.set(withTiming(1, { duration, easing: Easing.linear }, (finished) => {
      if (finished && onDone) scheduleOnRN(onDone);
    }));
  }, [t, duration, onDone]);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {pieces.map((p, i) => <Piece key={i} p={p} t={t} g={height * 1.3} />)}
    </View>
  );
}
const styles = StyleSheet.create({ piece: { position: "absolute", top: 0, left: 0, borderRadius: 2 } });
```

Quellen:
- https://github.com/AlirezaHadjar/react-native-fast-confetti
- https://github.com/VincentCATILLON/react-native-confetti-cannon
- https://github.com/marcuzgabriel/react-native-reanimated-confetti
- https://expo.dev/changelog/sdk-57 (Reanimated 4.3–4.5 in SDK 57)
- https://docs.swmansion.com/react-native-reanimated/

---

## Kurzfassung Rebuild-Bedarf

| Vorhaben | Native Rebuild | Neue native Pakete |
|---|---|---|
| Erinnerungen | ja | expo-notifications (+ ggf. Mini-Plugin gegen `aps-environment` fürs Gerät) |
| HealthKit-Schlaf | ja | @kingstinct/react-native-healthkit + react-native-nitro-modules |
| Widgets | ja | expo-widgets (+ Extension-Target & App Group via CNG) |
| Konfetti | nein | keine |

Sinnvoll: alle drei nativen Pakete in **einem** Prebuild-/Pod-/Build-Durchgang aufnehmen.
