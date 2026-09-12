import { useSyncExternalStore } from "react";

/* „Es wird aufgenommen" — ein Schalter für die ganze App.
   Grund (Antons Befund 12.09., Aufnahme brach nach ~7 s ab): expo-video
   setzt bei JEDEM Player-Ereignis (Schleife, Status) die AVAudioSession auf
   .playback ohne .record (VideoManager.setAudioSession) — der
   AVAudioRecorder stoppt dann still. Solange dieser Schalter steht, pausieren
   alle Video- und Klang-Player (Home-Faultier, Klangmischer, Clips). */
let recording = false;
const listeners = new Set<() => void>();
export function setRecording(on: boolean) { if (recording === on) return; recording = on; listeners.forEach((l) => l()); }
export function isRecording() { return recording; }
export function useRecording() {
  return useSyncExternalStore((l) => { listeners.add(l); return () => { listeners.delete(l); }; }, () => recording, () => recording);
}
