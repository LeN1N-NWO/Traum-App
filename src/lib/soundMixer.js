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
