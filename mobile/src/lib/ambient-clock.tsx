import { useEffect } from "react";
import { makeMutable, useFrameCallback, useSharedValue } from "react-native-reanimated";

/* Der gemeinsame Takt der ruhigen Hintergrund-Bewegungen (10.10., Energie).
 *
 * Gemessen im Simulator: Jede Reanimated-Animation, die ihren Wert jedes
 * Bild setzt, schickt jedes Bild eine Runde durch den Schattenbaum und das
 * Layout der ganzen Seite — auf der Startseite der größte Teil der Last.
 * Auf ProMotion-iPhones sind das 120 Runden je Sekunde, und weil jede
 * Animation ihren eigenen Takt hatte, liefen sie nicht einmal gemeinsam.
 *
 * Jetzt zählt EIN Takt die Zeit, 30 Mal je Sekunde, für alle: Schein und
 * Lichtstrahl der Knöpfe, das Funkeln des Himmels, der Schimmer der
 * Geschenk-Punkte, die Galaxie, der Atem des Portals. Alles, was sich im
 * selben Takt ändert, geht in EINER Runde durch. Für langsame, ruhige
 * Bewegungen sieht man keinen Unterschied.
 *
 * Er läuft nur, solange jemand zusieht: `useAmbient(active)` meldet sich an,
 * solange der eigene Bildschirm zu sehen ist (useScreenActive). Niemand da
 * → der Takt steht, nichts wird gerechnet. `AmbientClock` liegt einmal in
 * der Wurzel (app/_layout.tsx). */
export const ambient = makeMutable(0);       // ms, wächst ~30× je Sekunde
const FRAME = 33;

let users = 0;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

/** Der gemeinsame Takt (ms). `active` = dieser Bildschirm ist zu sehen. */
export function useAmbient(active: boolean) {
  useEffect(() => {
    if (!active) return;
    users += 1; notify();
    return () => { users -= 1; notify(); };
  }, [active]);
  return ambient;
}

export function AmbientClock() {
  const acc = useSharedValue(0);
  const clock = useFrameCallback((f) => {
    acc.value += Math.min(100, f.timeSincePreviousFrame ?? 16);
    if (acc.value < FRAME) return;
    ambient.value += acc.value;
    acc.value = 0;
  }, false);
  useEffect(() => {
    const sync = () => clock.setActive(users > 0);
    sync();
    listeners.add(sync);
    return () => { listeners.delete(sync); };
  }, [clock]);
  return null;
}

/** Sanftes Hin und Her: 0 → 1 → 0 in `period` ms (wie withRepeat + inOut(sin), reverse). */
export function swing(t: number, period: number, phase = 0) {
  "worklet";
  return (1 - Math.cos(2 * Math.PI * (t / period + phase))) / 2;
}
