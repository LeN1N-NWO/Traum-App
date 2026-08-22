/* The sleep sound mixer — one Web Audio graph for the whole app.
 *
 * Lives OUTSIDE React on purpose: the sound keeps playing while the person
 * navigates between tabs, because nothing here unmounts. Components read and
 * poke it through the functions below and mirror the state they need
 * themselves (there is deliberately no event system — the two UI surfaces,
 * SleepScreen and SoundDock, both re-render on the app state that drives
 * their changes anyway).
 *
 * Browser autoplay rules: an AudioContext only produces sound after a user
 * gesture, so ensure() must be called from an event handler. The "start my
 * mix when the app opens" preference therefore arms a one-shot listener for
 * the first tap (see SoundDock) — the honest best a web app can do; the
 * Capacitor wrapper can start natively later.
 *
 * Each colour is a few seconds of generated noise in a loop. Loop points in
 * plain noise are inaudible — there is no pattern to interrupt.
 */
import { NOISE_FILLS, SOUND_IDS } from "./noise.js";

const LOOP_SECONDS = 4;

let ctx = null;
let master = null;
const gains = {};            // id -> GainNode
const volumes = { white: 0, pink: 0, brown: 0 };
let muted = false;

function ensure() {
  if (ctx) {
    if (ctx.state === "suspended") ctx.resume();
    return;
  }
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  master = ctx.createGain();
  master.connect(ctx.destination);
  for (const id of SOUND_IDS) {
    const buffer = ctx.createBuffer(1, ctx.sampleRate * LOOP_SECONDS, ctx.sampleRate);
    NOISE_FILLS[id](buffer.getChannelData(0));
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    source.connect(gain).connect(master);
    source.start();
    gains[id] = gain;
  }
  applyMute();
}

function applyMute() {
  if (master) master.gain.value = muted ? 0 : 1;
}

/** Set one colour's volume (0..1). Call from a user-gesture handler. */
export function setVolume(id, v) {
  if (!(id in volumes)) return;
  // Wer während des Ausblendens am Regler dreht, ist wach: Das Ausblenden
  // wird abgebrochen, sonst zöge die geplante Rampe jede Änderung wieder
  // auf null.
  if (fading) stopFade();
  volumes[id] = v;
  if (!ctx && v === 0) return;   // nothing to do and no gesture wasted
  ensure();
  // A ramp, not a jump — an instant gain step clicks audibly.
  gains[id].gain.linearRampToValueAtTime(v, ctx.currentTime + 0.08);
}

/** Apply a whole saved mix at once (the autostart path). */
export function applyMix(saved = {}) {
  for (const id of SOUND_IDS) setVolume(id, Number(saved[id]) || 0);
}

export function setMuted(b) {
  muted = !!b;
  applyMute();
}

export function getMuted() {
  return muted;
}

export function getVolumes() {
  return { ...volumes };
}

/** Is anything audible (or would be, if unmuted)? */
export function isActive() {
  return SOUND_IDS.some((id) => volumes[id] > 0);
}

/* ── Der Einschlaf-Timer (Mehrwert-Plan P3b).
 *
 * Die Wahl steht in Minuten; danach blendet der Mix über FADE_SECONDS aus
 * und bleibt still. AUSGEBLENDET WIRD NUR DER KLANG, nicht die gespeicherte
 * Mischung: Wer „Regen 40 %, Braun 20 %" eingestellt hat, will das morgen
 * wieder — das Zurücksetzen von state.soundMix wäre ein Datenverlust, kein
 * Feature.
 *
 * Eine Minute Ausblenden, keine Sekunde: Ein Rauschen, das abrupt aufhört,
 * WECKT — genau das, was der Timer verhindern soll.
 *
 * ⚠ Hier kommt doch ein Melder ins Haus, den der Dateikopf ausschließt. Der
 * Grund: Das Timer-Ende ist das einzige Ereignis in diesem Modul, das ohne
 * Geste und ohne Zustandsänderung eintritt — die beiden Oberflächen hätten
 * sonst keinen Anlass, neu zu zeichnen, und der Lautsprecher-Knopf bliebe
 * über einer Stille stehen. */
const FADE_SECONDS = 60;

let fadeTimer = null;      // wartet auf das Timer-Ende
let silenceTimer = null;   // wartet auf das Ende des Ausblendens
let fading = false;
let timerEndsAt = null;
const listeners = new Set();

/** Neu zeichnen, wenn der Mix sich OHNE Zutun ändert (Timer-Ende). */
export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notify() {
  for (const fn of listeners) fn();
}

/** Startet den Timer (Minuten) oder bricht ihn mit 0/null ab.
 *
 *  Wird mitten im Ausblenden abgebrochen, kommt der Klang zurück: Wer in
 *  dem Moment „aus" wählt, ist wach und will weiterhören. */
export function startTimer(minutes) {
  if (fadeTimer) clearTimeout(fadeTimer);
  fadeTimer = null;
  timerEndsAt = null;
  const wasFading = fading;
  stopFade();
  const m = Number(minutes) || 0;
  if (m <= 0) {
    if (wasFading) applyMix(volumes);
    return;
  }
  timerEndsAt = Date.now() + m * 60_000;
  fadeTimer = setTimeout(fadeOut, m * 60_000);
}

/* Bricht ein laufendes Ausblenden ab und friert die Lautstärken dort ein,
   wo sie gerade klingen — sonst liefe die geplante Rampe unter jeder
   späteren Änderung weiter. */
function stopFade() {
  fading = false;
  if (silenceTimer) clearTimeout(silenceTimer);
  silenceTimer = null;
  if (!ctx) return;
  for (const id of SOUND_IDS) {
    const now = gains[id].gain.value;
    gains[id].gain.cancelScheduledValues(ctx.currentTime);
    gains[id].gain.setValueAtTime(now, ctx.currentTime);
  }
}

/** Läuft gerade einer? (Für die Oberfläche — sie zeigt die Wahl an.) */
export function timerEnds() {
  return timerEndsAt;
}

function fadeOut() {
  fadeTimer = null;
  timerEndsAt = null;
  fading = true;
  if (ctx) {
    for (const id of SOUND_IDS) {
      // Erst verankern, dann rampen: Ohne setValueAtTime beginnt die Rampe
      // beim zuletzt GEPLANTEN Wert, nicht beim gerade klingenden.
      gains[id].gain.setValueAtTime(gains[id].gain.value, ctx.currentTime);
      gains[id].gain.linearRampToValueAtTime(0, ctx.currentTime + FADE_SECONDS);
    }
  }
  // Die Laufzeit-Lautstärken erst NACH dem Ausblenden auf null — sonst
  // verschwände der Lautsprecher-Knopf, während noch Klang da ist.
  silenceTimer = setTimeout(() => {
    silenceTimer = null;
    fading = false;
    for (const id of SOUND_IDS) volumes[id] = 0;
    notify();
  }, FADE_SECONDS * 1000);
}
