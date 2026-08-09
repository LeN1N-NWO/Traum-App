/* The voice interview: microphone in, spoken answer out, structured data on
 * the side. Everything Gemini-shaped lives here so the screen stays a view.
 *
 * The audio formats are not negotiable — Gemini Live wants raw 16-bit PCM at
 * 16 kHz going in and sends 24 kHz coming back. Neither is what a browser
 * hands you, so both directions are converted by hand below. Getting this
 * wrong produces no error, just noise, which is why the numbers are named.
 */
const IN_RATE = 16000;
const OUT_RATE = 24000;
const CHUNK = 2048;

/** Float32 (-1..1) → the signed 16-bit little-endian PCM Gemini expects. */
function floatToPCM16(input) {
  const out = new Int16Array(input.length);
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]));
    out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return out;
}

function toBase64(bytes) {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}

function fromBase64(b64) {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/**
 * @param {object} h  handlers — every one optional
 *   onReady()                      the socket is up, start talking
 *   onLevel(0..1)                  how loud they are, for the backdrop
 *   onTranscript({who, text})      "you" | "assistant"
 *   onSpeaking(bool)               the assistant is talking
 *   onTool({name, args})           setDreamText / addPerson / addPlace / finish
 *   onError(code)
 * @param {object} who  who is talking — {name, cast, lang}. The server needs
 *   it for the briefing: the greeting uses the name, the cast lets the
 *   assistant recognise people who already have a face on file, and `lang`
 *   is the language chosen in LanguagePicker — a deliberate choice now, not
 *   a device guess, so it drives the WHOLE conversation, not just the
 *   opening line (see voiceSystem() in server.js). All optional; `lang`
 *   falls back to the device setting only for the rare session that somehow
 *   starts before a language was ever chosen.
 */
export function startVoiceSession(h = {}, who = {}) {
  /* Diese eine Verbindung geht direkt an den API-Port, nicht über den Proxy
   * des Dev-Servers — der kann WebSockets unter Bun nicht durchreichen; die
   * Begründung steht in vite.config.js. location.hostname statt location.host,
   * damit der Port ersetzt wird und es auch vom Handy im selben Netz geht. */
  const base = import.meta.env.VITE_API_BASE || "";
  const scheme = location.protocol === "https:" ? "wss" : "ws";
  const url = base
    ? base.replace(/^http/, "ws") + "/api/voice"
    : `${scheme}://${location.hostname}:${__API_PORT__}/api/voice`;

  const ws = new WebSocket(url);
  ws.binaryType = "arraybuffer";

  let ctx, mic, node, stream;
  let playCtx, playHead = 0;
  let closed = false;

  ws.onerror = () => h.onError?.("SOCKET");
  ws.onclose = () => { if (!closed) h.onError?.("CLOSED"); };

  /* First frame out, before any audio: who is talking. The server holds the
   * setup back until this lands, so the assistant can open with the name
   * instead of a generic hello. Nothing secret travels here — a display name
   * and tags the person chose themselves. */
  ws.onopen = () => ws.send(JSON.stringify({
    type: "hello",
    name: who.name || "",
    cast: who.cast || [],
    // "onboarding" swaps briefing and tools server-side: same relay, but the
    // conversation collects profile facts instead of a dream.
    mode: who.mode || "",
    lang: who.lang || navigator.language || "",
    // Chosen in VoicePicker just before this session opened. The server
    // allowlists it and puts it in Gemini's speechConfig.
    voice: who.voice || "",
  }));

  ws.onmessage = async (e) => {
    let msg;
    try {
      msg = JSON.parse(typeof e.data === "string" ? e.data : new TextDecoder().decode(e.data));
    } catch { return; }

    if (msg.type === "ready") { h.onReady?.(); return startMic(); }
    if (msg.type === "error") return h.onError?.(msg.code);

    const c = msg.serverContent;

    // Their words and its words, both as text — this is what runs along the
    // screen while the conversation happens.
    if (c?.inputTranscription?.text) h.onTranscript?.({ who: "you", text: c.inputTranscription.text });
    if (c?.outputTranscription?.text) h.onTranscript?.({ who: "assistant", text: c.outputTranscription.text });

    for (const part of c?.modelTurn?.parts || []) {
      if (part.inlineData?.data) play(part.inlineData.data);
    }
    if (c?.turnComplete) h.onSpeaking?.(false);

    // The structured half of the conversation. Answered immediately: Gemini
    // waits for the response before it speaks again.
    const calls = msg.toolCall?.functionCalls || [];
    if (calls.length) {
      for (const call of calls) h.onTool?.({ name: call.name, args: call.args || {} });
      ws.send(JSON.stringify({
        toolResponse: {
          functionResponses: calls.map((call) => ({
            id: call.id, name: call.name, response: { result: "ok" },
          })),
        },
      }));
    }
  };

  async function startMic() {
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true },
      });
    } catch {
      return h.onError?.("MIC_DENIED");
    }
    ctx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: IN_RATE });
    mic = ctx.createMediaStreamSource(stream);
    // ScriptProcessor is deprecated, and its replacement (AudioWorklet) needs
    // a separate module file that Vite would have to be told about. For one
    // mono 16 kHz stream the old node is measurably fine; revisit if it ever
    // shows up in a profile.
    node = ctx.createScriptProcessor(CHUNK, 1, 1);

    node.onaudioprocess = (ev) => {
      if (ws.readyState !== 1) return;
      const input = ev.inputBuffer.getChannelData(0);

      let peak = 0;
      for (let i = 0; i < input.length; i++) {
        const a = Math.abs(input[i]);
        if (a > peak) peak = a;
      }
      h.onLevel?.(peak);

      ws.send(JSON.stringify({
        realtimeInput: {
          audio: { mimeType: `audio/pcm;rate=${IN_RATE}`, data: toBase64(new Uint8Array(floatToPCM16(input).buffer)) },
        },
      }));
    };

    mic.connect(node);
    node.connect(ctx.destination);
  }

  /* Play a chunk of the reply. Each one is queued at the moment the previous
   * one ends rather than "now" — starting them all at `currentTime` would
   * overlap them into mush, which is the classic way this goes wrong. */
  function play(b64) {
    playCtx ||= new (window.AudioContext || window.webkitAudioContext)({ sampleRate: OUT_RATE });
    const pcm = new Int16Array(fromBase64(b64).buffer);
    const buf = playCtx.createBuffer(1, pcm.length, OUT_RATE);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < pcm.length; i++) ch[i] = pcm[i] / 0x8000;

    const src = playCtx.createBufferSource();
    src.buffer = buf;
    src.connect(playCtx.destination);
    const at = Math.max(playCtx.currentTime, playHead);
    src.start(at);
    playHead = at + buf.duration;
    h.onSpeaking?.(true);
  }

  /** Typed answers go in on the same socket — one conversation, two ways in. */
  function say(text) {
    if (ws.readyState !== 1) return;
    ws.send(JSON.stringify({
      clientContent: { turns: [{ role: "user", parts: [{ text }] }], turnComplete: true },
    }));
    h.onTranscript?.({ who: "you", text });
  }

  function stop() {
    closed = true;
    try { node?.disconnect(); mic?.disconnect(); } catch {}
    for (const track of stream?.getTracks() || []) track.stop();
    try { ctx?.close(); playCtx?.close(); } catch {}
    try { ws.close(); } catch {}
  }

  return { say, stop };
}
