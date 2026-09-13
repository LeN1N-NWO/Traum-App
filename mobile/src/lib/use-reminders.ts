import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import { needsNotifications, shouldAutoRecord } from "../../../src/lib/reminders.js";
import { localDateKey } from "../../../src/lib/dreamDays.js";
import { applyPlan, askPermission, clearAll, lastResponse, onResponse, permission, urlOf } from "@/lib/notifications";
import { onboardingSeen } from "@/store/dev-store";
import type { BridgeCommand, JournalSnapshot } from "@/store/journal-store";

/* Die Erinnerungen am Leben halten — sitzt auf der Startseite, weil deren
 * Tab als erster lebt und nie abgebaut wird (NativeTabs), und weil sie eine
 * Brücke hat, über die das Ergebnis der Erlaubnisfrage zurückgeschrieben
 * wird. Drei Aufgaben:
 *
 *   1. Tipp auf eine Benachrichtigung → dorthin (auch beim Kaltstart).
 *   2. Plan geändert (oder neuer Tag) → Erlaubnis holen, neu planen.
 *   3. Morgens geöffnet, heute noch nichts eingetragen → Rekorder
 *      (Antons Ansage 13.09.: „die App anmachen und nicht noch einmal
 *      klicken müssen"). Nie, solange Onboarding oder Einwilligung davor
 *      stehen — sonst liefe die Aufnahme unsichtbar hinter dem Tor. */
export function useReminders(data: JournalSnapshot | null, send: (cmd: Omit<BridgeCommand, "n">) => void) {
  const router = useRouter();
  const planned = useRef("");
  const asking = useRef(false);

  // 1. Benachrichtigungen öffnen ihr Ziel
  useEffect(() => {
    const cold = urlOf(lastResponse());
    const t = cold ? setTimeout(() => router.navigate(cold as "/dream"), 700) : null;
    const sub = onResponse((url) => router.navigate(url as "/dream"));
    return () => { if (t) clearTimeout(t); sub.remove(); };
  }, [router]);

  // 2. Planen, wann immer sich der Plan ändert — und einmal je Tag (die Woche rollt mit)
  const R = data?.reminders;
  useEffect(() => {
    if (!R) return;
    const key = JSON.stringify([R.plan, R.texts.morningTitle, localDateKey(new Date())]);
    if (key === planned.current) return;
    planned.current = key;
    (async () => {
      try {
        if (!needsNotifications({ morning: R.plan.morning, evening: R.plan.evening, wants: R.plan.reality.on, perDay: R.plan.reality.perDay })) { await clearAll(); return; }
        let p = await permission();
        if (p === "undetermined" && !asking.current) {
          asking.current = true;
          const ok = await askPermission();
          asking.current = false;
          send({ type: "reminderAnswered", wants: ok });
          p = ok ? "granted" : "denied";
        }
        if (p === "granted") await applyPlan(R.plan, R.texts);
      } catch (e) {
        console.warn("[reminders]", e);
      }
    })();
  }, [R, send]);

  // 3. Morgens direkt aufnehmen
  const latest = useRef(data);
  useEffect(() => { latest.current = data; }, [data]);
  const ready = !!data?.reminders;   // erst prüfen, wenn der erste Stand da ist
  useEffect(() => {
    const check = () => {
      const d = latest.current;
      if (!d?.reminders || d.consent?.needed || (__DEV__ && !onboardingSeen())) return;
      const now = new Date();
      const todayKey = localDateKey(now);
      const hasEntryToday = d.items.some((e) => localDateKey(e.createdAt) === todayKey) || !!d.home?.nightMarked;
      const store = { autoRecord: d.reminders.plan.autoRecord, lastAutoOpen: d.reminders.lastAutoOpen };
      if (!shouldAutoRecord(store, { now, todayKey, hasEntryToday })) return;
      send({ type: "autoOpened", date: todayKey });
      router.navigate("/dream");
    };
    const first = setTimeout(check, 900);
    const sub = AppState.addEventListener("change", (s) => { if (s === "active") setTimeout(check, 400); });
    return () => { clearTimeout(first); sub.remove(); };
  }, [router, send, ready]);
}
