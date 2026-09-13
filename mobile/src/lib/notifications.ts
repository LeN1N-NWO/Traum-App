import * as Notifications from "expo-notifications";
import { LogBox } from "react-native";
import { realityTimes, parseTime } from "../../../src/lib/reminders.js";
import { localDateKey } from "../../../src/lib/dreamDays.js";
import type { ReminderPlan, RemindersData } from "@/store/journal-store";

/* Die Benachrichtigungen, nativ (13.09.2026). WAS geplant wird, entscheidet
 * src/lib/reminders.js (rein, getestet); hier wird nur ausgeführt.
 *
 * Nur LOKALE Benachrichtigungen — kein Push, kein Server, kein Token. Deshalb
 * wurde bewusst KEIN `expo prebuild` gefahren: Das Config-Plugin trägt das
 * Push-Entitlement (aps-environment) ein, und das ließe sich ohne bezahltes
 * Apple-Konto nicht signieren. `pod install` + Rebuild genügen für lokal.
 *
 * Planung = alles Eigene streichen, neu anlegen. Täglich morgens und abends
 * als DAILY-Auslöser; die Realitätschecks für die nächsten sieben Tage als
 * einzelne Termine, weil sie jeden Tag zu anderen Zeiten kommen (iOS hält
 * höchstens 64 ausstehende — 7 × 4 + 2 passt). Bei jedem App-Start wird neu
 * geplant, so rollt die Woche mit. */
/* ⚠ Im unsignierten Simulator-Bau (CODE_SIGNING_ALLOWED=NO) fehlt der App
   der Schlüsselbund; expo-notifications liest beim Laden die gespeicherte
   PUSH-Registrierung und meldet das als roten Fehler. Push nutzen wir nicht —
   lokale Erinnerungen hängen nicht daran. Nur die
   Meldung wird ausgeblendet, nur im Entwicklungsbau. */
if (__DEV__) LogBox.ignoreLogs(["[expo-notifications] Error reading persisted server registration info"]);

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
});

export type Permission = "granted" | "denied" | "undetermined";

export async function permission(): Promise<Permission> {
  const p = await Notifications.getPermissionsAsync();
  if (p.granted || p.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) return "granted";
  return p.canAskAgain ? "undetermined" : "denied";
}

/** Fragt EINMAL (iOS erlaubt nur einen Versuch, reminders.js). */
export async function askPermission(): Promise<boolean> {
  const p = await Notifications.requestPermissionsAsync({ ios: { allowAlert: true, allowSound: true, allowBadge: false } });
  return p.granted;
}

export async function applyPlan(plan: ReminderPlan, texts: RemindersData["texts"], now = new Date()) {
  await Notifications.cancelAllScheduledNotificationsAsync();
  const jobs: Promise<string>[] = [];
  if (plan.morning.on) {
    const t = parseTime(plan.morning.time, "07:30");
    jobs.push(Notifications.scheduleNotificationAsync({
      content: { title: texts.morningTitle, body: texts.morningBody, data: { url: "/dream" } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: t.hour, minute: t.minute },
    }));
  }
  if (plan.evening.on) {
    const t = parseTime(plan.evening.time, "22:00");
    jobs.push(Notifications.scheduleNotificationAsync({
      content: { title: texts.eveningTitle, body: texts.eveningBody, data: { url: "/sleep" } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: t.hour, minute: t.minute },
    }));
  }
  if (plan.reality.on && plan.reality.perDay > 0) {
    let k = 0;
    for (let d = 0; d < 7; d++) {
      const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + d);
      for (const t of realityTimes(plan.reality.perDay, localDateKey(day))) {
        const at = new Date(day.getFullYear(), day.getMonth(), day.getDate(), t.hour, t.minute);
        if (at <= now) continue;
        const body = texts.realityBodies[k++ % Math.max(1, texts.realityBodies.length)];
        jobs.push(Notifications.scheduleNotificationAsync({
          content: { title: texts.realityTitle, body, data: { url: "/sleep" } },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: at },
        }));
      }
    }
  }
  await Promise.all(jobs);
  return jobs.length;
}

export async function clearAll() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/** Wohin ein Tipp auf die Benachrichtigung führt — für den Start aus dem
 *  Sperrbildschirm UND für die laufende App. */
export function urlOf(response: Notifications.NotificationResponse | null): string | null {
  const url = response?.notification.request.content.data?.url;
  return typeof url === "string" && url.startsWith("/") ? url : null;
}
export const lastResponse = () => Notifications.getLastNotificationResponse();
export const onResponse = (fn: (url: string) => void) => Notifications.addNotificationResponseReceivedListener((r) => { const u = urlOf(r); if (u) fn(u); });
