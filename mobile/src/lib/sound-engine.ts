import { File, Paths } from "expo-file-system";
import { createVideoPlayer, type VideoPlayer } from "expo-video";
// Dieselben Rausch-Generatoren wie im Web (reine Funktionen, src/lib/noise.js).
import { NOISE_FILLS, SOUND_IDS } from "../../../src/lib/noise.js";

/* Das Klang-Mischpult, nativ — das Gegenstück zu src/lib/soundMixer.js.
 *
 * Im Web war es ein Web-Audio-Graph im Tab; in der Hülle würde der mit dem
 * Webview sterben, sobald man den Raum verlässt. Hier lebt es als Modul
 * außerhalb von React: drei Spieler (expo-video spielt auch reines Audio,
 * kein weiteres natives Paket nötig), jeder mit vier Sekunden erzeugtem
 * Rauschen in Schleife. Die WAV-Dateien entstehen einmal im Cache — kein
 * Download, keine Lizenz, wie im Web. Keine Autoplay-Regel: nativ darf
 * Klang ohne Geste anfangen, der Autostart funktioniert also wirklich.
 *
 * Schnittstelle wie soundMixer.js: setVolume, getVolumes, applyMix,
 * startTimer, timerEnds, subscribe, isActive. */
const LOOP_SECONDS = 4;
const RATE = 44100;
const FADE_SECONDS = 60;

export type SoundId = "white" | "pink" | "brown";
export const IDS = SOUND_IDS as SoundId[];

const players: Partial<Record<SoundId, VideoPlayer>> = {};
const volumes: Record<SoundId, number> = { white: 0, pink: 0, brown: 0 };
const listeners = new Set<() => void>();
let ready = false;

function wavFor(id: SoundId): File {
  const file = new File(Paths.cache, `dr-noise-${id}-v1.wav`);
  if (file.exists) return file;
  const n = RATE * LOOP_SECONDS;
  const samples = new Float32Array(n);
  (NOISE_FILLS as Record<string, (out: Float32Array) => Float32Array>)[id](samples);
  const bytes = new Uint8Array(44 + n * 2);
  const view = new DataView(bytes.buffer);
  const str = (o: number, s: string) => { for (let i = 0; i < s.length; i++) bytes[o + i] = s.charCodeAt(i); };
  str(0, "RIFF"); view.setUint32(4, 36 + n * 2, true); str(8, "WAVE");
  str(12, "fmt "); view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, RATE, true); view.setUint32(28, RATE * 2, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true);
  str(36, "data"); view.setUint32(40, n * 2, true);
  for (let i = 0; i < n; i++) view.setInt16(44 + i * 2, Math.max(-1, Math.min(1, samples[i])) * 32767, true);
  file.write(bytes);
  return file;
}

function ensure() {
  if (ready) return;
  for (const id of IDS) {
    const p = createVideoPlayer({ uri: wavFor(id).uri });
    p.loop = true;
    p.volume = 0;
    p.audioMixingMode = "mixWithOthers";
    p.staysActiveInBackground = true;
    p.showNowPlayingNotification = false;
    players[id] = p;
  }
  ready = true;
}

function notify() { listeners.forEach((fn) => fn()); }

/* Während einer Aufnahme (recording-store.ts) schweigen die Spieler — sie
   würden mit jedem Ereignis die Audio-Session auf Wiedergabe kippen. Die
   Lautstärken bleiben, danach läuft es weiter. */
let heldForRecording = false;
export function holdForRecording(on: boolean) {
  if (!ready || on === heldForRecording) return;
  heldForRecording = on;
  for (const id of IDS) { const p = players[id]; if (!p) continue; if (on) p.pause(); else if (volumes[id] > 0) p.play(); }
}

function apply(id: SoundId, v: number) {
  const p = players[id]; if (!p) return;
  p.volume = v;
  if (v > 0 && !p.playing) p.play();
  if (v === 0 && p.playing) p.pause();
}

/** Eine Farbe stellen (0..1). Wer am Regler dreht, ist wach — ein laufendes Ausblenden bricht ab. */
export function setVolume(id: SoundId, v: number) {
  if (!(id in volumes)) return;
  if (fading) stopFade();
  volumes[id] = v;
  if (!ready && v === 0) return;
  ensure();
  apply(id, v);
}

/** Eine ganze gespeicherte Mischung auf einmal (der Autostart). */
export function applyMix(saved: Partial<Record<SoundId, number>> = {}) {
  for (const id of IDS) setVolume(id, Number(saved[id]) || 0);
}

export function getVolumes(): Record<SoundId, number> { return { ...volumes }; }
export function isActive() { return IDS.some((id) => volumes[id] > 0); }
export function subscribe(fn: () => void) { listeners.add(fn); return () => { listeners.delete(fn); }; }

/* ── Der Einschlaf-Timer: nach `minutes` wird über eine Minute ausgeblendet
   und dann geschwiegen. Nur der KLANG, nicht die gespeicherte Mischung —
   die will man morgen wieder (soundMixer.js). */
let fadeTimer: ReturnType<typeof setTimeout> | null = null;
let fadeTick: ReturnType<typeof setInterval> | null = null;
let fading = false;
let timerEndsAt: number | null = null;

export function startTimer(minutes: number) {
  if (fadeTimer) clearTimeout(fadeTimer);
  fadeTimer = null; timerEndsAt = null;
  const wasFading = fading;
  stopFade();
  const m = Number(minutes) || 0;
  if (m <= 0) { if (wasFading) applyMix(volumes); return; }
  timerEndsAt = Date.now() + m * 60_000;
  fadeTimer = setTimeout(fadeOut, m * 60_000);
}
export function timerEnds() { return timerEndsAt; }

function stopFade() {
  fading = false;
  if (fadeTick) clearInterval(fadeTick);
  fadeTick = null;
}

function fadeOut() {
  fadeTimer = null; timerEndsAt = null; fading = true;
  const start = Date.now();
  const from = { ...volumes };
  fadeTick = setInterval(() => {
    const k = Math.min(1, (Date.now() - start) / (FADE_SECONDS * 1000));
    for (const id of IDS) apply(id, from[id] * (1 - k));
    if (k >= 1) {
      stopFade();
      for (const id of IDS) volumes[id] = 0;
      notify();
    }
  }, 200);
}
