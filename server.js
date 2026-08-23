// Dream Rushes — minimal backend (Bun)
// Holds the API keys server-side and proxies generation so the browser never
// sees credentials. Serves the static app too.
//
// Pipeline for every dream:
//   1) dream text + named reference metadata (tag/category/desc, NOT the
//      photos themselves — DeepSeek-V4-Flash is text-only, no vision on the
//      public API) go to DeepSeek, which writes a Nano-Banana-formula prompt
//      that binds each @tag to "its reference photo".
//   2) that prompt + the actual reference photos go to fal.ai (Nano Banana 2)
//      to render the image(s) — Nano Banana itself IS vision-capable, so the
//      real photo-matching happens here, guided by DeepSeek's prompt.
//   3) film mode additionally feeds the resulting still into fal.ai's
//      minimax/h3/image-to-video to animate it.
// DeepSeek is optional: if DEEPSEEK_KEY is unset or the call fails, step 1
// falls back to a local prompt template so image generation still works.
//
//   1) export FAL_KEY="YOUR_KEY_ID:YOUR_KEY_SECRET"        (fal.ai/dashboard/keys — required)
//      export DEEPSEEK_KEY="YOUR_KEY"                       (platform.deepseek.com — optional, better prompts)
//   2) bun server.js          → http://localhost:8100
//
// Without FAL_KEY the server still boots and serves the app; /api/generate
// then returns a clear, actionable error instead of crashing.
//
// ⚠ Seit 10.08.2026 steht eine Schranke davor (src/lib/gatekeeper.js): eine
// Mengenbegrenzung je Absender, die IMMER greift, und ein optionales
// Geheimnis über API_TOKEN. Das ersetzt KEINE Benutzerverwaltung — es gibt
// weiterhin keine Konten und kein serverseitiges Guthaben, das hängt an der
// Backend-Entscheidung in docs/STAND.md. Für eine öffentliche Adresse
// braucht es zusätzlich API_TOKEN und einen Proxy, der TLS beendet.

import { resolve, sep } from "node:path";
import { statSync, readFileSync } from "node:fs";
// Wo die Bilder liegen dürfen — eigene Datei, weil daran schon einmal echte
// Träume verloren gegangen sind (src/lib/mediaRoot.test.js).
import { mediaRootFrom } from "./src/lib/mediaRoot.js";
// Doppelte Figuren aussortieren — eigene Datei, damit sie ohne laufenden
// Server prüfbar ist (src/lib/people.test.js).
import { dedupePeople } from "./src/lib/people.js";
// Die Schranke vor allem, was Geld kostet — eigene Datei, damit sie ohne
// laufenden Server prüfbar ist (src/lib/gatekeeper.test.js).
import { guard } from "./src/lib/gatekeeper.js";
import { buildCharacterPrompt, buildSheetFromPhotoPrompt, stripReferenceClauses } from "./src/lib/promptBuilder.js";
// Stiltexte sind Konstanten aus dem Repo — der Client schickt nur eine ID,
// damit über dieses Feld kein Fremdtext in einen bezahlten Prompt wandert.
import { styleById } from "./src/lib/styles.js";
// Wie viele Szenen in eine Filmlänge passen — drei Sekunden je Szene ist
// die Untergrenze, darunter wird aus Regie eine Schnittfolge.
import { beatsForSeconds } from "./src/lib/beats.js";
// Die Filmbestellung je Modell — Slug, Klemme, Auflösung, Tonparameter —
// kommt aus EINER Tabelle, die auch Preis und UI speist (video.test.js).
import { videoSubmitBody, videoModel, clampSeconds } from "./src/lib/video.js";
/* Bildmodell: Endpunkte, Adressformat und Referenzbudget stehen seit dem
 * 23.08. in EINER Tabelle (src/lib/imageModel.js) — Seedream und Nano Banana
 * sprechen nicht dieselbe Sprache, und ein falscher Feldname wirft keinen
 * Fehler, er liefert nur das Falsche. */
import { imageSubmitBody, imageModel, IMAGE_MODELS, DEFAULT_IMAGE_MODEL } from "./src/lib/imageModel.js";
// Der Filmregisseur: Bauanleitung + mechanische Prüfung (director.test.js).
import {
  DIRECTOR_MOTION, directorFull, KEYFRAME_REF,
  buildDirectorBrief, checkDirectedPrompt, filmReferences,
} from "./src/lib/director.js";

/* Wohin die erzeugten Dateien gehen. ⚠ NICHT einfach `import.meta.dir` —
   aus einem Sitzungs-Worktree heraus zeigt der Ordner auf das Hauptrepo,
   sonst löscht `git worktree remove` nach dem Merge die Bilder mit weg.
   Genau das ist am 21.08.2026 passiert; die Regel steht in
   src/lib/mediaRoot.js und ist dort festgenagelt. */
const MEDIA_DIR = mediaRootFrom(
  import.meta.dir,
  (() => {
    try {
      const dotGit = resolve(import.meta.dir, ".git");
      return statSync(dotGit).isFile() ? readFileSync(dotGit, "utf8") : null;
    } catch {
      return null;      // kein .git (installierte Kopie) — dann eben hier
    }
  })(),
  process.env.DREAMRUSHES_MEDIA,
);

/* Wohin die gesicherten Träume gehen. Neben dem Medienordner und aus
   demselben Grund über mediaRootFrom(): Aus einem Worktree heraus gehören
   sie ins Hauptrepo, sonst nimmt `git worktree remove` sie mit — genau so
   sind am 21.08. die Bilder verschwunden. */
const BACKUP_DIR = resolve(MEDIA_DIR, "..", "data", "traeume");

const PORT = process.env.PORT || 8100;
// Web-Wurzel ist der Build, nicht das Repo. Damit liegen .env, .git/, docs/
// und der Servercode selbst ausserhalb dessen, was ueberhaupt aufloesbar ist —
// eine zweite, unabhaengige Schranke zusaetzlich zur Freigabeliste unten.
// Ohne vorherigen `vite build` gibt es kein dist/ und alles antwortet 404.
const ROOT = resolve(import.meta.dir, "dist");

// Reference photos are base64 dataURLs, so bodies are chunky — but not unbounded.
const MAX_BODY = 12 * 1024 * 1024;
const MAX_REFERENCES = 6;
const MAX_DREAM = 2000;
const MAX_FRAGMENT = 120; // per pet/place description, mirrors the client-side cap
const MAX_CRAFTED_PROMPT = 3000; // ceiling on what DeepSeek is allowed to hand to fal.ai

/* Welches Bildmodell. Der Name zeigt in die Tabelle in imageModel.js —
 * NICHT mehr ein roher fal-Slug, denn davon gibt es je Modell zwei
 * (Text-zu-Bild und Edit), und bei Seedream ist der nackte Slug ein 404.
 *
 * Seit 23.08.2026 ist Seedream 5 Lite die Vorgabe (Antons Entscheidung nach
 * dem A/B mit derselben Kette, denselben Prompts und demselben Referenzbild,
 * media/ab-test/): $0,035 statt $0,042 je Bild — 17 % billiger — bei
 * 1440×2560 statt 768×1376, also der sechsfachen Pixelzahl. Die Bildkette
 * hielt, der Photoshop-Effekt blieb weg. Davor galt seit 20.08. Nano Banana
 * Lite, davor das volle Nano Banana zu $0,08.
 *
 * Verkaufspreise bleiben unverändert — das war schon beim letzten Wechsel so
 * entschieden: die Ersparnis verbreitert die Marge, sie verbilligt nichts.
 *
 * Rückweg bei Befund, ohne Codeänderung:
 *   FAL_MODEL_IMAGE=nano-banana-2-lite   (oder nano-banana-2) in .env */
const FAL_MODEL_IMAGE = process.env.FAL_MODEL_IMAGE || DEFAULT_IMAGE_MODEL;
/* Videomodelle stehen NICHT mehr hier: Slug, Dauergrenzen, Auflösung und
 * Tonparameter je Modell leben in src/lib/video.js (videoSubmitBody) —
 * dieselbe Tabelle, aus der auch der Preis und die UI kommen. Eine zweite
 * Kopie hier war der halbe Weg zu Befund 2 des Film-Plans (Premium
 * berechnet, minimax geliefert). */
// Whisper v3 as hosted by fal.ai — used by /api/transcribe (dictation). Slug
// confirmed against fal.ai/models/fal-ai/wizper on 2026-08-08.
const FAL_MODEL_STT = process.env.FAL_MODEL_STT || "fal-ai/wizper";

// DeepSeek-V4-Flash: OpenAI-compatible chat completions API, text-only (no
// image input on the public API as of writing). Used purely to turn the dream
// + reference metadata into a well-formed Nano Banana prompt — the actual
// photos never go to DeepSeek, only to fal.ai afterwards.
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || "deepseek-v4-flash";
const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions";

// Gemini Live — the voice interview. fal has no realtime conversational
// model, so this one talks to Google directly.
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.1-flash-live-preview";
const GEMINI_WS =
  "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent";

/* Gemini TTS — ONLY for the voice previews in the picker. It shares the Live
 * API's voice catalogue, which is the whole point: the sample you tap is the
 * exact voice that will then talk to you. There is no prebuilt-samples
 * endpoint (checked 09.08.2026 — AI Studio has them, the API does not), so
 * each sample is generated once and cached on disk; after that it costs
 * nothing and plays instantly.
 * Measured: returns audio/l16;rate=24000 mono (~48 KB/s), NOT a WAV — the
 * header is added below, because a browser <audio> cannot play headerless
 * PCM. */
const GEMINI_TTS_MODEL = process.env.GEMINI_TTS_MODEL || "gemini-3.1-flash-tts-preview";

/* The picker's shortlist, mirrored in src/lib/voices.js (ids must match).
 * Six of the thirty, chosen for a dream journal at 3am: mostly soft and warm,
 * one bright, one deep — variety without a wall of names. Also the allowlist:
 * `voice` from the hello frame goes into the Gemini setup verbatim, so only
 * these exact strings may pass. */
const VOICE_NAMES = new Set(["Sulafat", "Achernar", "Vindemiatrix", "Leda", "Puck", "Charon"]);

/* What a voice says to introduce itself — in the app language, because that
 * is the language it will actually speak. One warm line, long enough to hear
 * the character, short enough to tap through all six. */
const VOICE_SAMPLE_LINES = {
  en: "Hi, it's me. I'll be here when you wake up — tell me everything you dreamed.",
  de: "Hallo, ich bin's. Ich bin da, wenn du aufwachst — erzähl mir alles, was du geträumt hast.",
  es: "Hola, soy yo. Estaré aquí cuando despiertes: cuéntame todo lo que soñaste.",
  fr: "Bonjour, c'est moi. Je serai là à ton réveil — raconte-moi tout ce que tu as rêvé.",
  zh: "你好，是我。你醒来的时候我就在这里——把你梦到的一切都讲给我听吧。",
  hi: "नमस्ते, मैं हूँ। जब आप जागेंगे, मैं यहीं रहूँगी — मुझे अपना पूरा सपना सुनाइए।",
  ar: "مرحبًا، هذه أنا. سأكون هنا عندما تستيقظ — احكِ لي كلّ ما حلمت به.",
};

/** Wrap raw 16-bit mono PCM in the 44-byte RIFF header that makes it a WAV. */
function pcmToWav(pcm, rate) {
  const header = new ArrayBuffer(44);
  const v = new DataView(header);
  const ascii = (off, s) => { for (let i = 0; i < s.length; i++) v.setUint8(off + i, s.charCodeAt(i)); };
  ascii(0, "RIFF"); v.setUint32(4, 36 + pcm.length, true); ascii(8, "WAVE");
  ascii(12, "fmt "); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, rate, true); v.setUint32(28, rate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  ascii(36, "data"); v.setUint32(40, pcm.length, true);
  const out = new Uint8Array(44 + pcm.length);
  out.set(new Uint8Array(header)); out.set(pcm, 44);
  return out;
}

/** The sample for one (voice, language), from disk or freshly generated. */
async function voiceSample(voice, lang) {
  /* Drei Stufen, von billig nach teuer:
     1. MITGELIEFERT — public/voice/<Stimme>-<Sprache>.m4a. Einmal erzeugt
        (scripts/make-voice-samples.mjs), eingecheckt, ausgeliefert: keine
        Wartezeit, kein Gemini-Schlüssel, kein Netz. Antons Wunsch vom
        22.08.: „damit das nicht immer neu geladen wird."
     2. LOKAL GEMERKT — media/voice-sample-…wav vom letzten Mal.
     3. Erst dann Gemini. */
  for (const shipped of [
    resolve(import.meta.dir, "public", "voice", `${voice}-${lang}.m4a`),
    resolve(import.meta.dir, "public", "voice", `${voice}-${lang}.wav`),
  ]) {
    const f = Bun.file(shipped);
    if (await f.exists()) return f;
  }

  const path = resolve(MEDIA_DIR, `voice-sample-${voice}-${lang}.wav`);
  const cached = Bun.file(path);
  if (await cached.exists()) return cached;

  const key = process.env.GEMINI_KEY;
  if (!key) throw new Error("NO_GEMINI_KEY");
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_TTS_MODEL}:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: VOICE_SAMPLE_LINES[lang] }] }],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
        },
      }),
    },
  );
  if (!res.ok) throw new Error("TTS_FAILED");
  const body = await res.json();
  const part = body?.candidates?.[0]?.content?.parts?.[0]?.inlineData;
  if (!part?.data) throw new Error("TTS_FAILED");
  // The advertised rate rides in the mimeType ("audio/l16;rate=24000") —
  // read it rather than assuming, in case the model ever changes it.
  const rate = Number(/rate=(\d+)/.exec(part.mimeType || "")?.[1]) || 24000;
  const wav = pcmToWav(Buffer.from(part.data, "base64"), rate);
  await Bun.write(path, wav);
  return Bun.file(path);
}

/* What the assistant is told, and what it may do.
 *
 * The tools are the whole design. Without them the answer comes back as a
 * transcript, and somebody has to guess afterwards which words were a name
 * and which were a place — a second model call, a second bill, and a new way
 * to be wrong. With them, the assistant hands over `addPerson("Rex","pet")`
 * the moment it hears it, already structured.
 */
/* The onboarding survey speaks through the same relay as the dream
 * interview, but collects PROFILE facts, not a dream — different tools,
 * different briefing (see voiceSystem's onboarding branch). Every field is
 * optional by design: refusing a question must never stall the flow. */
const ONBOARDING_TOOLS = [{
  functionDeclarations: [
    {
      name: "setName",
      description: "What they want to be called. First name or nickname, exactly as they said it.",
      parameters: { type: "OBJECT", properties: { name: { type: "STRING" } }, required: ["name"] },
    },
    {
      name: "setBirthday",
      description: "Their date of birth as YYYY-MM-DD. Year may be 0000 if they only gave day and month.",
      parameters: { type: "OBJECT", properties: { date: { type: "STRING" } }, required: ["date"] },
    },
    {
      name: "setDreamRecall",
      description: "How often they remember their dreams.",
      parameters: {
        type: "OBJECT",
        properties: { frequency: { type: "STRING", description: "nightly | weekly | rarely | almost-never" } },
        required: ["frequency"],
      },
    },
    {
      name: "setLucidLevel",
      description: "Their relationship with lucid dreaming.",
      parameters: {
        type: "OBJECT",
        properties: { level: { type: "STRING", description: "never-heard | curious | tried | practicing" } },
        required: ["level"],
      },
    },
    {
      name: "addTheme",
      description: "A recurring dream, place, person or feeling they mention. Call once per theme.",
      parameters: { type: "OBJECT", properties: { name: { type: "STRING" } }, required: ["name"] },
    },
    {
      /* ⚠ "nightmares" kam am 23.08. dazu und ist kein Nachtrag, sondern
         eine Lücke: Bei zwei untersuchten Wettbewerbern steht „Albträume
         überwinden" unter den fünf HAUPTZIELEN, bei uns fehlte es ganz.
         Imagery Rehearsal Therapy ist die bestbelegte Selbsthilfe-Methode
         im ganzen Traumfeld — besser belegt als jede Klartraum-Technik.
         Wer deswegen kommt, muss die Frage wenigstens gestellt bekommen.
         Was danach angeboten wird, ist P3a im Mehrwert-Plan. */
      name: "setGoal",
      description: "What draws them to their dreams.",
      parameters: {
        type: "OBJECT",
        properties: { goal: { type: "STRING", description: "remember | understand | create | sleep-better | nightmares" } },
        required: ["goal"],
      },
    },
    {
      /* Schlafdauer ist NICHT Statistik, sondern inhaltlich relevant: REM
         ballt sich im letzten Drittel der Nacht. Wer unter sechs Stunden
         schläft, hat strukturell weniger und kürzere REM-Phasen — weniger
         Traum, weniger Erinnerung. Bei so jemandem ist die wirksamste
         Maßnahme „länger schlafen", und das ist ehrlicher als jede
         Technik, die man ihm stattdessen empfehlen könnte. */
      name: "setSleepHours",
      description: "Roughly how long they sleep on a normal night.",
      parameters: {
        type: "OBJECT",
        properties: { hours: { type: "STRING", description: "under-6 | 6-7 | 7-8 | 8-9 | over-9" } },
        required: ["hours"],
      },
    },
    {
      /* Das Zeitbudget entscheidet, welche Technik überhaupt vorgeschlagen
         werden DARF. WBTB verlangt ein nächtliches Aufwachen, MILD ein
         paar Minuten vor dem Einschlafen. Wer „fünf Minuten" sagt, dem
         WBTB zu empfehlen, ist ein Plan, der von vornherein scheitert. */
      name: "setTimeBudget",
      description: "How much time a day they can spend on dream practice.",
      parameters: {
        type: "OBJECT",
        properties: { minutes: { type: "STRING", description: "5 | 10 | 20 | 30 | 60plus" } },
        required: ["minutes"],
      },
    },
    {
      /* ⚠ Diese Antwort löst NICHTS aus. Sie merkt sich nur den Wunsch.
         Der Grund steht in docs/plans/2026-08-23-benachrichtigungen.md:
         iOS gibt für die Benachrichtigungs-Erlaubnis genau EINEN Versuch,
         und eine verhörte Silbe wäre unwiderruflich. Der Systemdialog
         gehört deshalb hinter einen bewussten Tipp — die Stimme sammelt
         die Absicht, der Finger gibt sie frei. */
      name: "setReminderWish",
      description:
        "Whether they would like gentle reminders, and how many a day. Only record what " +
        "they say — this does not switch anything on.",
      parameters: {
        type: "OBJECT",
        properties: {
          wants: { type: "BOOLEAN" },
          perDay: { type: "NUMBER", description: "1 to 4, only if they gave a number" },
        },
        required: ["wants"],
      },
    },
    {
      name: "finish",
      description: "The survey is complete or they want to stop. Call this last.",
      parameters: { type: "OBJECT", properties: {} },
    },
  ],
}];

const VOICE_TOOLS = [{
  functionDeclarations: [
    {
      name: "setDreamText",
      description: "The dream as one flowing account, in the language the person spoke. Call this whenever they add to it; the newest call wins.",
      parameters: { type: "OBJECT", properties: { text: { type: "STRING" } }, required: ["text"] },
    },
    {
      name: "addPerson",
      description: "Someone or some animal who appeared in the dream. Call once per character.",
      parameters: {
        type: "OBJECT",
        properties: {
          name: { type: "STRING" },
          kind: { type: "STRING", description: "person or pet" },
          desc: { type: "STRING", description: "short visual description, empty if the dream gives none" },
        },
        required: ["name", "kind"],
      },
    },
    {
      name: "addPlace",
      description: "A distinct location in the dream. A dream that moves has more than one.",
      parameters: { type: "OBJECT", properties: { name: { type: "STRING" } }, required: ["name"] },
    },
    {
      name: "finish",
      description: "The person has told the whole dream and has nothing to add. Call this last.",
      parameters: { type: "OBJECT", properties: {} },
    },
  ],
}];

/* The seven languages LanguagePicker offers (src/lib/locales.js), mapped to
 * a name a language model can act on reliably — safer than trusting it to
 * expand a bare "de" or "ar" correctly every single time. `lang` only ever
 * reaches here as one of these ids: sendVoiceSetup's caller restricts it to
 * [A-Za-z0-9-] before it is quoted into anything, same as every other
 * client-supplied string that ends up in a prompt. */
const LANGUAGE_NAMES = {
  en: "English", de: "German", es: "Spanish", fr: "French",
  zh: "Mandarin Chinese", hi: "Hindi", ar: "Modern Standard Arabic",
};

/* Shared by voiceSystem() and onboardingSystem(). Unlike a device-guessed
 * locale, this is a language someone DELIBERATELY chose in LanguagePicker
 * before anything else in the app happened — so it governs the whole
 * conversation from the first word, not just an opening line that used to
 * be a one-sentence guess. It still yields instantly if they actually speak
 * something else; a chosen default is not a cage. */
function languageDirective(lang) {
  const name = LANGUAGE_NAMES[lang];
  if (!name) return "";
  return (
    `They chose ${name} as this app's language before anything else happened. Speak ${name} for ` +
    `this entire conversation, starting with your very first word. If they clearly answer in a ` +
    `different language, follow them there instead.\n\n`
  );
}

/* WHO is talking — the app's persona, shared by both briefings (chosen
 * 09.08.2026 from three demoed styles: "the cool night porter").
 *
 * One character, everywhere: the interview and the welcome survey must not
 * feel like two different people, because to the user they are one voice
 * that already knows them.
 *
 * The hard part of a persona prompt is not the character, it is the FLOOR
 * under it. A model told to be "funny and laid-back" starts performing:
 * jokes about the dream, riffs on the answers, a comedian at 3am. So every
 * trait below is paired with what it must never cost — and the last
 * paragraph says outright that the character yields the moment the dream
 * gets heavy. A persona is a way of speaking, not a thing to protect.
 *
 * Deliberately NOT written as "you are a sloth": a model given an animal
 * tends to mention being one, and an assistant that keeps announcing its
 * own quirkiness is exhausting by the third question. The sloth lives in
 * the tempo and in the artwork; here it is only a temperament.
 */
const PERSONA =
  "WHO YOU ARE\n" +
  "You are the calm, slightly amused night presence of this app — the porter of the small hours. " +
  "You have heard every kind of night and are surprised by none of them, which is exactly why " +
  "people can tell you anything. Unhurried to the point of being a little lazy: you never rush " +
  "anyone, never sound busy, never act as if the next question matters more than this one.\n" +
  "Dry, warm understatement. Being awake at an absurd hour, being half asleep, forgetting most " +
  "of it: all completely fine by you, and you say so lightly rather than reassuringly.\n" +
  "\n" +
  "HOW THAT SOUNDS, CONCRETELY\n" +
  "Your first sentence is where this voice gets established, so it is never a bare 'Welcome.' or " +
  "'Hello.' — you are not a reception desk. It does two things in one breath: it notices " +
  "something true about the moment (the hour, that they are barely awake, that they came back, " +
  "that mornings are a rumour), and then it asks. Half a clause of noticing, then the question. " +
  "Later turns are plainer — the character lives in the openings and in the occasional single " +
  "dry clause, not in every sentence.\n" +
  "Understatement, not jokes: you never tell a joke, never comment on the dream itself, never " +
  "make the dreamer the punchline. If a remark would make them explain themselves, drop it.\n" +
  "Do not describe yourself, do not announce what you are about to do, and never say you are " +
  "slow or lazy — that is a tempo you have, not a fact you share. You understand quickly.\n" +
  "\n" +
  "The character is the FIRST thing to go if the dream turns frightening or sad: then you are " +
  "simply quiet, plain and kind, with no wink in it. Wit is how you make room for someone, " +
  "never something you protect at their cost.\n\n";

/* The briefing. Built per session, because the two things that make this feel
 * like a person rather than a form — knowing your name and knowing who is
 * already in your journal — are different for everyone.
 *
 * Both come from the client and are therefore untrusted: they go through the
 * same sanitiser as any other free text before they are put in a prompt. A tag
 * is [a-z0-9]{1,12} by construction, a name is trimmed hard. Neither can carry
 * a newline, so neither can pretend to be a new instruction paragraph.
 */
function voiceSystem({ name = "", cast = [], lang = "", mode = "" } = {}) {
  if (mode === "onboarding") return onboardingSystem({ lang });
  const greeting = name
    ? `Their name is ${name}. Greet them by it in your very first sentence, then ask straight away ` +
      `what they dreamt. Use the name once more at most; repeating it every turn is what a machine ` +
      `does.\n\n`
    : `You do not know their name. Do not ask for it — open with a greeting and the first question.\n\n`;

  const opening = languageDirective(lang);

  const known = cast.length
    ? `These already exist in their journal, with a face on file: ${cast.join(", ")}. ` +
      `If they mention one, pass exactly that name to addPerson/addPlace — spelled the same — ` +
      `so the dream reuses the picture they already have instead of inventing a stranger. ` +
      `Do not bring these up yourself; they are only for recognising.\n\n`
    : "";

  return (
    "You are the dream interviewer in a dream journal app. Someone has just woken up and is " +
    "talking to you in the dark, probably still half asleep, probably holding the phone badly.\n\n" +

    PERSONA + greeting + opening + known +

    "HOW TO SPEAK\n" +
    "Follow the language instruction above for the whole conversation. If they nonetheless answer " +
    "in something else, continue in THAT language without remarking on the switch — a chosen " +
    "language is a strong default, not a rule to enforce on someone. " +
    "One or two short sentences per turn, never more. " +
    "No lists, no summaries of what they just said, no 'how interesting'. Warm, quiet, awake.\n\n" +

    "WHAT TO ASK\n" +
    "Your job is to get the dream out of them, not to interpret it. Ask for what is missing, in " +
    "roughly this order: what happened, then who was there, then where it was, then what it looked " +
    "like. One question at a time. Follow what they actually said — if they mention a house, ask " +
    "about the house, not about a checklist. Three or four questions is usually the whole interview; " +
    "stop once the dream has a shape, even if details are missing. A half-remembered dream is normal " +
    "and is not a problem to be solved.\n\n" +

    "WHAT NEVER TO DO\n" +
    "Never analyse, never say what a dream 'means', never reassure, never give sleep advice. If they " +
    "went through something frightening, acknowledge it in a few words and carry on with the account. " +
    "If they say they cannot remember more, accept it immediately and finish.\n\n" +

    "THE WRITTEN DREAM — this is what the whole conversation is for\n" +
    "Call setDreamText as the account grows, not only at the end; the newest call replaces the last. " +
    "Write it the way they would write it themselves: first person, past tense, their language, their " +
    "words, their images, in the order things happened. Turn their scattered answers into connected " +
    "sentences — that is the work — but add nothing that was not said. No invented details, no " +
    "adjectives they did not use, no interpretation, no moral, no tidy ending. If they said 'a big " +
    "dark dog', it stays a big dark dog and does not become a menacing hound. Leave out your own " +
    "questions and everything you said; only their dream goes in the text.\n\n" +

    "TOOLS\n" +
    "Call addPerson and addPlace the moment someone or somewhere is named — do not wait for the end. " +
    /* Der Abschiedssatz (Antons Wunsch 22.08.): Vorher hörte die Stimme
       einfach auf und die App sprang weiter — ein Gespräch, das mitten im
       Satz endet, fühlt sich nach Absturz an, nicht nach Abschluss. EIN
       kurzer Satz, kein Ritual: gesagt wird er VOR finish, sonst ist die
       Sitzung schon zu, bevor er ausgesprochen ist. */
    "Call finish when they are done, and call setDreamText one last time before you do. " +
    "BEFORE calling finish, say one short warm closing line in their language — that you have " +
    "everything and the dream is now being taken care of (in the spirit of: 'Alles drin. Ich " +
    "kümmere mich jetzt um deinen Traum — bis gleich.'). One sentence, then finish. Never end " +
    "the conversation silently."
  );
}

/* The welcome survey. Six questions, roughly two minutes, and every answer
 * is allowed to be "skip" — this buys them credits, it must never feel like
 * a form with required fields. */
function onboardingSystem({ lang = "" } = {}) {
  const opening = languageDirective(lang);
  return (
    "You are the voice inside a dream journal app, meeting a brand-new user for the " +
    "first time. This is a short welcome chat that personalises their profile — they get bonus " +
    "credits for finishing it, and they already know that.\n\n" +

    PERSONA + opening +

    "HOW TO SPEAK\n" +
    "Brief above all: one question per turn, one or two short sentences. This is the first " +
    "impression, so the character may show a little more here than during a dream — but six " +
    "questions is still six questions, and nobody wants a comedian between each one. Never " +
    "read out a list of options — ask naturally and map whatever they say onto the tool values.\n\n" +

    "THE QUESTIONS, in this order, one tool call the moment each is answered:\n" +
    "1. What should I call you? → setName\n" +
    "2. What brings you here — remembering more, understanding what dreams mean, turning them " +
    "into pictures, sleeping better, or getting out from under bad dreams? → setGoal\n" +
    "3. When were you born? Day, month and year — the year also gives their star sign. If they " +
    "prefer not to say the year, day and month are enough (year 0000). → setBirthday\n" +
    "4. How often do you remember your dreams? → setDreamRecall\n" +
    "5. How long do you usually sleep? → setSleepHours\n" +
    "6. Have you heard of lucid dreaming — knowing you're dreaming while it happens? Where are " +
    "they on that journey? → setLucidLevel\n" +
    "7. Only if question 6 says anything other than never-heard: how much time a day could they " +
    "give it? → setTimeBudget\n" +
    "8. Is there a dream, place or person that keeps coming back at night? → addTheme, once per " +
    "thing they name\n" +
    "9. Would a gentle nudge help — a reminder to write the dream down in the morning? Would " +
    "they want one, and how many a day? → setReminderWish\n\n" +

    "WHY THE ORDER MATTERS\n" +
    "The goal comes second, right after their name, because everything after it is in service " +
    "of that goal — and because someone who is here about nightmares should not have to sit " +
    "through five questions before anyone asks what they came for.\n\n" +

    "RULES\n" +
    "Any question may be skipped the moment they hesitate or decline — move on cheerfully, never " +
    "press, never ask why. Never interpret their dreams or make health claims; if they share " +
    "something heavy, acknowledge it kindly in a few words and continue.\n" +
    "If their goal is nightmares, say plainly that there is something here for that and move on. " +
    "Do not counsel, do not ask what the nightmares are about, and never suggest it can be cured.\n" +
    "⚠ Question 9 only WRITES DOWN a wish. Never say reminders are now on, never say they will " +
    "start tonight — they still have to be switched on with a tap afterwards.\n" +
    "After the last question, thank them, tell them their bonus credits are in, and call finish."
  );
}

/* Two things have to be true before Gemini can be set up: the socket to Google
 * must be open, and the client must have said who is talking. They arrive in
 * either order, so both paths call this and the second one through wins. */
function sendVoiceSetup(ws) {
  const up = ws.data.upstream;
  if (ws.data.setupSent || up?.readyState !== 1 || !ws.data.greeted) return;
  ws.data.setupSent = true;
  clearTimeout(ws.data.helloTimer);

  up.send(JSON.stringify({
    setup: {
      model: `models/${GEMINI_MODEL}`,
      generationConfig: {
        responseModalities: ["AUDIO"],
        // The voice chosen in the picker. Absent → Gemini's default, so an
        // old client that never sends one keeps working unchanged.
        ...(ws.data.who?.voice ? {
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: ws.data.who.voice } } },
        } : {}),
      },
      systemInstruction: { parts: [{ text: voiceSystem(ws.data.who) }] },
      tools: ws.data.who?.mode === "onboarding" ? ONBOARDING_TOOLS : VOICE_TOOLS,
      inputAudioTranscription: {},   // what THEY said, as text
      outputAudioTranscription: {},  // what IT said, as text
    },
  }));
  try { ws.send(JSON.stringify({ type: "ready" })); } catch { /* client gone */ }
}

/* Gemini Live does not speak first on its own — it waits for a turn. This is
 * that turn: an instruction, not something the person said. It never reaches
 * the transcript, because only audio is transcribed back to the client. */
const VOICE_OPENING_CUE =
  "[The app has just opened and the microphone is live. Open the way YOU open — the noticing " +
  "half-clause, then the question — in one or two short sentences. This first line sets the " +
  "voice for everything after it, so do not fall back on a neutral greeting.]";

// ---- prompt hygiene (start) ----
// Scope note, because "prompt injection" means something narrower here than
// usual: the dream text is the user's OWN prompt for their OWN image. Someone
// writing "ignore previous instructions" into it is just using the app — there
// is no privilege boundary to cross and nothing to escalate to. So a blocklist
// of suspicious phrases would be theatre: trivially sidestepped by rewording or
// translating, and badly false-positive-prone (dreams are surreal — "I ignored
// everything I'd been told" is an ordinary sentence to find in one).
//
// What is actually worth defending:
//   1. PASTED text. A dream copied off a website can carry characters the user
//      cannot see — zero-width joiners, bidi overrides, Unicode TAG characters
//      (U+E0000..E007F) — which are invisible to them and fully visible to the
//      model. That is a genuine untrusted-data path into the prompt.
//   2. Prompt STRUCTURE. Free text used to be concatenated in raw, so a newline
//      or a stray ")" could restructure the instruction. Fragments are now
//      flattened and delimited so they can only ever read as data.
//   3. DeepSeek's OWN output. It's a second model call whose result becomes a
//      prompt for a third paid API — sanitised the same way as user input
//      before it's trusted, regardless of how well-behaved DeepSeek usually is.
//
// Note: this also strips ZWJ, so emoji sequences (👨‍👩‍👧) degrade to their parts.
// Acceptable — they carry nothing for an image model, and ZWJ is a smuggling
// vector.
const PROMPT_CONTROL_CHARS =
  /[\u{0000}-\u{0008}\u{000B}-\u{001F}\u{007F}-\u{009F}\u{00AD}\u{200B}-\u{200F}\u{202A}-\u{202E}\u{2060}-\u{2064}\u{2066}-\u{206F}\u{FEFF}\u{FFF9}-\u{FFFB}]/gu;
const PROMPT_TAG_CHARS = /[\u{E0000}-\u{E007F}]/gu; // invisible-text smuggling block

// Deliberately does NOT truncate — the caller decides whether an over-long
// dream is rejected or trimmed, so nobody silently loses half their dream.
function sanitizePromptText(raw) {
  let s = String(raw ?? "");
  try { s = s.normalize("NFKC"); } catch { /* lone surrogates etc. — keep as-is */ }
  s = s.replace(PROMPT_TAG_CHARS, "").replace(PROMPT_CONTROL_CHARS, "");
  s = s.replace(/[\r\n\t]+/g, " ");  // single line: only OUR separators shape the prompt
  return s.replace(/\s{2,}/g, " ").trim();
}

// Fragments get embedded inside a clause we build, so they also lose the
// characters that could break out of that clause.
function sanitizeFragment(raw, maxLen) {
  return sanitizePromptText(raw).replace(/[()[\]{}<>"“”'`]/g, "").replace(/\s{2,}/g, " ").trim().slice(0, maxLen);
}

// Cast tags are already constrained client-side to [a-z0-9]{1,12} at creation
// (see index.html), but the server never trusts client-side constraints —
// re-apply the same shape here before a tag ever reaches a prompt.
function sanitizeTag(raw) {
  return String(raw ?? "").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 12);
}

// Local fallback prompt (no LLM call) — used when DEEPSEEK_KEY is unset or
// the DeepSeek call fails, so image generation still works without it. Each
// cast entry the client sent (because its @tag literally appears in the
// dream text) becomes one @tag ↔ reference-image binding, spelled out in the
// prompt so Nano Banana uses that person's/pet's/place's actual likeness
// instead of inventing one whenever the dream mentions them by name.
function buildFallbackPrompt(dream, namedRefs = []) {
  const clauses = namedRefs.map((r, i) => {
    const tag = sanitizeTag(r.tag);
    if (!tag) return null;
    const kind = r.category === "pet" ? "pet" : r.category === "place" ? "place" : "person";
    const desc = sanitizeFragment(r.desc || "", MAX_FRAGMENT);
    const descClause = desc ? `, described as: ${desc}` : "";
    return `Reference image ${i + 1} shows @${tag} (${kind}${descClause}) — whenever "${tag}" appears in the dream below, depict them with this exact likeness, not a generic stand-in.`;
  }).filter(Boolean);
  const refBlock = clauses.length ? `\n${clauses.join(" ")}` : "";
  return `A cinematic, photoreal film still capturing this dream: ${dream}${refBlock}\nNatural cinematic lighting, 9:16 vertical framing, ultra-detailed, accurate hands and faces.`;
}

// DeepSeek-crafted prompt: same job as buildFallbackPrompt() above, but
// written by an LLM following Google's official Nano Banana 6-element
// formula (Subject, Action, Environment, Art Style, Lighting, Details, one
// flowing paragraph) instead of our fixed template — richer, varies per
// dream. DeepSeek never sees the actual photos (text-only API): it gets tag/
// category/description metadata and writes the @tag-binding clauses the same
// way buildFallbackPrompt() does, just in better prose.
async function craftPromptViaDeepseek(dream, namedRefs = []) {
  const key = process.env.DEEPSEEK_KEY;
  if (!key) throw new Error("NO_DEEPSEEK_KEY");

  const refLines = namedRefs.map((r) => {
    const tag = sanitizeTag(r.tag);
    const kind = r.category === "pet" ? "pet" : r.category === "place" ? "place" : "person";
    const desc = sanitizeFragment(r.desc || "", MAX_FRAGMENT);
    return `- @${tag} (${kind}${desc ? `: ${desc}` : ""})`;
  }).join("\n");

  const system = `You are a prompt engineer for Google's Nano Banana (Gemini) image model. Write ONE image prompt using its official 6-element formula — Subject, Action, Environment, Art Style, Lighting, Details — as a single flowing natural-language paragraph, not a keyword list. Style: cinematic, photoreal, 9:16 vertical framing, accurate hands and faces.
If named references are given below, weave in a clear binding clause for each one you use — e.g. "@rex, shown in his reference photo, ..." — so the image model uses that exact photo instead of inventing an appearance. Only use references actually relevant to the dream; never invent new named people/pets/places beyond what's given.
Output ONLY the finished prompt text. No preamble, no markdown, no quotes around it.`;
  const user = `Dream: "${dream}"\n\nAvailable named references (use only if relevant):\n${refLines || "(none)"}`;

  const res = await fetch(DEEPSEEK_API_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      messages: [{ role: "system", content: system }, { role: "user", content: user }],
      stream: false,
    }),
  });
  if (!res.ok) {
    console.error("[DreamRushes] DeepSeek request failed:", res.status, await res.text().catch(() => ""));
    throw new Error("DEEPSEEK_FAILED");
  }
  const data = await res.json().catch(() => null);
  const text = data?.choices?.[0]?.message?.content;
  if (!text || typeof text !== "string") throw new Error("DEEPSEEK_FAILED");
  // DeepSeek's output becomes a prompt for a paid third-party API next —
  // sanitise it exactly like user input, regardless of the source.
  const cleaned = sanitizePromptText(text).slice(0, MAX_CRAFTED_PROMPT);
  if (!cleaned) throw new Error("DEEPSEEK_FAILED");
  return cleaned;
}

/* Der Regisseur: schreibt aus Traum + Startbild einen BEWEGUNGS-Prompt für
 * das Videomodell. Bis 18.08.2026 bekam das Videomodell den Standbild-Prompt
 * wörtlich weitergereicht („photoreal film still …") — was sich bewegte, war
 * Zufall. Bauanleitung und Prüfung liegen in src/lib/director.js (getestet);
 * hier steht nur der Aufruf.
 *
 * ⚠ KEIN max_tokens: deepseek-v4-flash denkt erst ins Denkfeld, ein Deckel
 * lässt die eigentliche Antwort leer zurückkommen (gemessen 17.08., T0).
 *
 * Der Regisseur ist Kür, nie Pflicht: Jeder Fehler hier wird vom Aufrufer
 * geschluckt und der Film läuft wie bisher — schlechter Film schlägt keinen
 * Film. Deshalb wirft diese Funktion großzügig. */
/* Die Länge der Regisseur-Antwort begrenzt nicht dieser Server, sondern das
 * ZIELMODELL — und zwar je Modell verschieden (video.js, promptMax: minimax
 * H3 verträgt 7 000 Zeichen, Seedance 2.0 modellseitig 5 000). Eine pauschale
 * Zahl hier stand deshalb immer falsch: erst 6 000 (hätte gute lange
 * Antworten amputiert), dann 9 000 (hätte Seedance einen Prompt über dessen
 * eigenem Limit geschickt — je nach Plattform Ablehnung nach bezahlter Runde
 * oder stilles Abschneiden des Endes). Jetzt bekommt der Regisseur sein
 * Budget im Brief GENANNT (er priorisiert dann selbst) und die Notbremse
 * kappt exakt am Limit des bestellten Modells. */
async function directFilm({ dream, still, beats = [], style, seconds, modelId, refs = [] }) {
  const key = process.env.DEEPSEEK_KEY;
  if (!key) throw new Error("NO_DEEPSEEK_KEY");

  const m = videoModel(modelId);
  /* Zwei Drehbücher: Ein-Bild-Modelle bekommen reine Bewegungsregie (das
     Bild existiert schon), Referenzmodelle das volle Programm mit @ImageN.
     `refs` ist bereits nummeriert-in-Reihenfolge — Zeile N wird @ImageN. */
  const withRefs = refs.length > 0;
  /* `still` geht seit 19.08.2026 an BEIDE Drehbücher. Vorher stand hier
     `withRefs ? undefined : still` — ausgerechnet die teure Referenzstufe
     bekam die Beschreibung ihres eigenen Startbilds nicht, sollte aber
     Positionen darin in Metern angeben. buildDirectorBrief() weist das Bild
     bei Referenz-Modellen ausdrücklich als @Image1 aus, damit daraus kein
     zweites Material wird. */
  /* Die Länge wird EINMAL geklemmt und dann überall dieselbe benutzt — der
     Bogen wird danach zugeschnitten, und die Rechnung „Sekunden je Szene"
     im Brief muss zu derselben Zahl passen, die auch bei fal.ai bestellt
     wird (videoSubmitBody klemmt erneut, aus derselben Tabelle). */
  const secs = clampSeconds(modelId, seconds);

  const brief = buildDirectorBrief({
    dream,
    /* Ohne die Referenzklauseln des Bildprompts: die zählen „Reference image
       1…N" nach der Bildliste, das Videomodell zählt @Image1…9 nach seiner
       eigenen — und dort ist @Image1 das Startbild. Beide Zählungen roh
       nebeneinander vertauschen Gesichter. */
    still: stripReferenceClauses(still),
    /* Adressformat und Referenzbudget des BESTELLTEN Modells — seit 20.08.
       spricht jede Stufe ihre eigene Syntax (Filmplan §10b: @Image1 /
       [Image1] / „Image 1"). */
    refStyle: m.refStyle,
    maxRefs: m.maxRefs,
    /* Auf die Filmlänge zugeschnitten: Fünf Szenen auf fünf Sekunden wären
       eine Sekunde je Szene — darin wird keine Handlung lesbar. */
    beats: beatsForSeconds(beats, secs),
    style,
    refs,
    seconds: secs,
    audio: m.audio,
    /* Das Zeichenlimit des BESTELLTEN Modells (video.js) — dem Regisseur
       genannt statt nur still gekappt: ein Modell, das sein Budget kennt,
       kürzt Stilprosa; die Schere kürzt immer das Ende. */
    promptBudget: m.promptMax,
  });

  const res = await fetch(DEEPSEEK_API_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      messages: [
        { role: "system", content: withRefs ? directorFull(m.refStyle) : DIRECTOR_MOTION },
        { role: "user", content: brief },
      ],
      stream: false,
    }),
  });
  if (!res.ok) throw new Error("DEEPSEEK_FAILED");
  const data = await res.json().catch(() => null);
  const text = data?.choices?.[0]?.message?.content;
  if (!text || typeof text !== "string") throw new Error("DEEPSEEK_FAILED");

  // Modellausgabe ist so untrusted wie Nutzereingabe: erst dieselbe Hygiene,
  // dann die mechanische Prüfung — jedes @ImageN muss eine der übergebenen
  // Referenzen sein; ohne Referenzen ist JEDES @Image eine Anweisung ins
  // Leere. Verstoß → Rückfall, nie ein halluziniertes Bild.
  const cleaned = sanitizePromptText(text).slice(0, m.promptMax);
  if (!checkDirectedPrompt(cleaned, refs.length).ok) throw new Error("DEEPSEEK_FAILED");
  // Eine Zeile Sichtbarkeit für ein bezahltes Feature: lief der Regisseur,
  // und wie viel hat er geschrieben? (Der Prompt selbst wird nicht geloggt.)
  console.log(`[DreamRushes] film director wrote ${cleaned.length} chars for ${m.id} (${refs.length} refs)`);
  return cleaned;
}
// ---- prompt hygiene (end) ----

/* ---- rewriting an existing dream ----
 *
 * Three modes behind one route, differing ONLY in the system prompt below.
 * This block is the actual feature: the sheet in the app (RefineSheet.jsx)
 * just names these three and sends a mode string — every rule about what a
 * rewrite may and may not do lives here, in one place, in English, where it
 * can be read and argued with.
 *
 * The shared rule, and the reason all three are worded so defensively: the
 * dream belongs to the person who dreamt it. A language model asked to
 * "improve" a text will, unprompted, tidy away the strange parts — and the
 * strange parts ARE the dream. So each mode states what it may touch AND
 * what it must leave, because a prompt that only says what to do gets the
 * rest invented.
 *
 * SHARED_RULES is appended to each: the constraints are identical for all
 * three, and duplicating them by hand is how they drift apart.
 */
const REFINE_SHARED_RULES =
  "\n\nRULES THAT ALWAYS APPLY:\n" +
  "- Write in the SAME LANGUAGE as the dream you are given. Never translate it.\n" +
  "- Keep the same grammatical person and tense the dreamer used.\n" +
  "- Invent NOTHING: no events, people, places, animals or objects that are not " +
  "already in the text. If a detail is vague, leave it vague — a half-remembered " +
  "dream is normal and is not a gap to fill.\n" +
  "- Never reorder what happened, and never explain, interpret or resolve it. " +
  "Dreams do not need to make sense.\n" +
  "- Keep the emotional register. Do not make a frightening dream cosy, or a dull " +
  "one dramatic.\n" +
  "- Return ONLY the text itself: no preamble, no title, no markdown, no quotation " +
  "marks around it, no commentary about what you changed.";

const REFINE_MODES = {
  /* The lightest touch there is. Deliberately forbids improvement of any
   * kind — someone who asks for spelling and gets their voice rewritten
   * has lost something they cannot get back except via "show original". */
  correct:
    "Fix ONLY spelling, grammar and punctuation in the dream below. Change nothing " +
    "else whatsoever: not a word choice, not a sentence boundary, not the order, not " +
    "the tone. If a sentence is clumsy but correct, leave it clumsy." +
    REFINE_SHARED_RULES,

  /* Same content, better prose. The line it must not cross is adding
   * anything; it may only re-say what is already said. */
  rewrite:
    "Rewrite the dream below so it reads more vividly and flows better. Improve the " +
    "wording, the rhythm and the sentence structure. Every event, person and place " +
    "must survive exactly as given — you are changing HOW it is told, never WHAT is " +
    "told. Keep it roughly the same length." +
    REFINE_SHARED_RULES,

  /* The most liberal of the three, and therefore the one whose limits are
   * spelled out hardest: sensory detail is allowed, new plot is not. */
  elaborate:
    "Work the dream below into a fuller piece of storytelling. You MAY add sensory " +
    "texture to what is already there — light, sound, temperature, texture, the feel " +
    "of a space — and you may shape the existing material into a clearer arc with a " +
    "beginning, a middle and an end. You may make it noticeably longer.\n" +
    "You may NOT add a single event, person, place or object that is not already in " +
    "the text. Describing the room they are in more richly is allowed; putting a new " +
    "person in that room is not." +
    REFINE_SHARED_RULES,
};

/* Die Reflection — der Spiegel, nicht das Orakel (Mehrwert-Plan P1a).
 *
 * Die größte dokumentierte Schwäche der Konkurrenz sind generische
 * Lexikon-Deutungen („Wasser bedeutet…"). Deshalb sind die Regeln hier
 * die halbe Funktion: Angebots-Sprache statt Behauptung, keine Diagnose,
 * keine Zukunft, keine Universalsymbolik — und der einzige Kontext, den
 * das Lexikon nie hat: die wiederkehrenden Muster aus dem EIGENEN Journal
 * (atlas.js baut sie clientseitig, der Server reicht sie gewaschen durch).
 *
 * Dieselbe Persona-Lehre wie überall: keine Beispielsätze im Prompt, und
 * Verbote allein erzeugen Neutralität — deshalb sagt der Prompt zuerst,
 * WAS die drei Absätze tun, und sperrt erst danach. */
const REFLECT_SYSTEM = `You are the quiet, warm reflective voice of a dream journal, reading one dream back to the person who dreamt it. Write exactly three short paragraphs, each two to three sentences, separated by blank lines:
1. What stands out — the images, tensions and feelings actually present in THIS dream, named plainly and specifically.
2. One possible reading. Offer it as a possibility, in the language of "could", "might" and "many people find" — never as a fact about the dreamer. If recurring patterns from their journal are provided below the dream, weave in at most one where it genuinely fits.
3. One gentle, open question back to the dreamer — something the dream leaves them to sit with.

Hard rules: never diagnose or give medical, psychological or life advice; never predict the future; never claim a symbol has one universal meaning; never moralise; never quote the dream's exact wording back. If the dream touches violence, death or distress, stay calm and matter-of-fact — name the feeling, don't dramatise it. Write in the same language as the dream. No headings, no lists, no emoji. Output only the three paragraphs.`;

async function reflectDream(dream, contextLines = []) {
  const key = process.env.DEEPSEEK_KEY;
  if (!key) throw new Error("NO_DEEPSEEK_KEY");

  const context = contextLines.length
    ? `\n\nRECURRING PATTERNS from this person's journal (background, use at most one):\n${contextLines.map((l) => `- ${l}`).join("\n")}`
    : "";
  const res = await fetch(DEEPSEEK_API_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      messages: [
        { role: "system", content: REFLECT_SYSTEM },
        { role: "user", content: `THE DREAM:\n"${dream}"${context}` },
      ],
      stream: false,
    }),
  });
  if (!res.ok) {
    console.error("[DreamRushes] reflect request failed:", res.status, await res.text().catch(() => ""));
    throw new Error("REFLECT_FAILED");
  }
  const data = await res.json().catch(() => null);
  const text = data?.choices?.[0]?.message?.content;
  if (typeof text !== "string") throw new Error("REFLECT_FAILED");
  /* sanitizePromptText plättet Zeilenumbrüche — hier tragen sie aber die
     Absatzstruktur, die die Anweisung ausdrücklich verlangt. Deshalb je
     Absatz waschen und die Struktur wieder zusammensetzen. */
  const cleaned = text
    .split(/\n{2,}/)
    .map((p) => sanitizePromptText(p))
    .filter(Boolean)
    .join("\n\n")
    .slice(0, 1600);
  if (!cleaned) throw new Error("REFLECT_FAILED");
  return cleaned;
}

async function refineDream(dream, mode) {
  const system = REFINE_MODES[mode];
  if (!system) throw new Error("BAD_MODE");
  const key = process.env.DEEPSEEK_KEY;
  if (!key) throw new Error("NO_DEEPSEEK_KEY");

  const res = await fetch(DEEPSEEK_API_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      messages: [
        // No extra tail: REFINE_SHARED_RULES already ends with the
        // "return only the text" rule, and saying it twice in different
        // words is how a prompt starts contradicting itself.
        { role: "system", content: system },
        { role: "user", content: dream },
      ],
      stream: false,
    }),
  });
  if (!res.ok) {
    console.error("[DreamRushes] refine request failed:", res.status, await res.text().catch(() => ""));
    throw new Error("REFINE_FAILED");
  }
  const data = await res.json().catch(() => null);
  const text = data?.choices?.[0]?.message?.content;
  if (typeof text !== "string") throw new Error("REFINE_FAILED");
  const cleaned = sanitizePromptText(text).slice(0, MAX_DREAM);
  if (!cleaned) throw new Error("REFINE_FAILED");
  return cleaned;
}


// ---- dream analysis (the ONE llm call per dream) ----
//
// This is the wizard's foundation. A single DeepSeek call returns everything
// the rest of the flow needs as structured JSON: the polished text, who and
// where appears in it, the dream broken into beats, and a style guess.
// Everything after this — assigning avatars, splitting beats into 3/5/10
// images, picking a style template, assembling the master prompt — is local
// logic with no further model calls. That is the whole token-economy design.
const ANALYSIS_STYLES = ["ultrareal", "noir", "dreamlike", "romantic", "dark", "surreal", "nostalgic", "adventurous"];
const MAX_ANALYSIS_ITEMS = 8;   // people or places; more is noise, not signal
const ANALYSIS_BEATS = 5;       // fixed: 3/5/10 images are all derived from these

// The master prompt. Its JSON schema is the CONTRACT between the model and
// the app: every field below is a marker the app reads by name, so the shape
// is fixed and normaliseAnalysis() enforces it. The language split is the
// core design decision — fields the person SEES stay in the language they
// wrote in; fields that feed the image model are always English, because
// that is what image models understand best.
const ANALYSIS_SYSTEM = `You read a dream someone just wrote down and return STRICT JSON. No prose, no markdown, no code fences — the response must parse as JSON directly.

Schema (every key is required, exactly these names):
{
  "language": string,      // BCP-47 code of the language the dream is written in, e.g. "de", "en", "tr"
  "text": string,          // the dream, cleaned up — in the SAME LANGUAGE as the input
  "people": [              // every person AND animal appearing in the dream, in order
    {
      "name": string,      // the name if the dream gives one ("Anton", "Rex"), else a short description in the dream's language ("eine fremde Frau")
      "kind": string,      // "person" or "pet" — an animal is "pet"
      "desc": string       // short VISUAL description if the dream provides one, else ""
    }
  ],
  "places": string[],      // every distinct location, in order, in the dream's language
  "beats": string[],       // EXACTLY 5 short scene descriptions, in order — ALWAYS IN ENGLISH
  "style": string,         // one of: ultrareal, noir, dreamlike, romantic, dark, surreal, nostalgic, adventurous
  "mood": string,          // one or two words, in the dream's language
  "title": string,         // a film title for this dream: 1-4 evocative words, in the dream's language, no quotes
  "tagline": string,       // one short poster tagline (under 10 words), in the dream's language — like "Nothing on earth could come between them."
  "filmSeconds": number    // ideal length of a film of this dream, in whole seconds, 5-30
}

Why the language split matters: "text", "people[].name", "places" and "mood" are SHOWN to the person and must stay in the language they wrote in — a German dream gets a German improved text. "beats" are rendering instructions for an image model and must be English regardless of the dream's language.

Rules for "text": FIRST understand what actually happened in the dream, then retell it. The input is often dictated speech — fragmented, repetitive, thoughts spoken over each other, false starts. Do not just patch spelling: rewrite it as one flowing, well-told account in the dreamer's language. Merge repetitions, complete fragments, untangle sentences that ran into each other, and make the wording vivid and easy to picture. You may restructure sentences freely as long as the DREAM itself stays untouched: never invent events, people or places that are not there, never drop any, never change the emotional tone, never add interpretation. Keep it first person if it was first person.

Rules for "people": ONE ENTRY PER DISTINCT PERSON. The same person mentioned again later is the SAME entry — "ein Arzt" at the start and "der Arzt" three sentences on are one doctor, not two. Only list a second entry when the dream itself marks someone as different ("ein ANDERER Arzt", "eine zweite Frau"). Two entries that describe the same role in the same scene are always a mistake.

Name each person the way a casting list would: the bare noun or name, no articles and no possessives — "Arzt", not "ein Arzt" or "der Arzt"; "Anton", not "mein Freund Anton" (put "Freund" in "desc" instead). If a dream truly has two of the same role, distinguish them by something visible ("Arzt mit Brille", "junger Arzt"), never by "anderer".

If the dream is told in the FIRST PERSON, the dreamer is a character and belongs in this list as the FIRST entry, named exactly as the dream names them ("ich" / "I"). This holds even when the dreamer never describes their own appearance — the app binds that entry to the person's own photo, and without it they cannot cast themselves.

A dog, cat or other animal is kind "pet". Empty array only if truly nobody appears.

Rules for "places": one entry per distinct SETTING — a location a film crew would have to build separately. Different parts, angles or heights of the SAME setting are ONE entry: a mountain's summit and the sky above that mountain are one place, a house and the rooms inside it are one place. The sky, air or water directly around a setting is never its own entry. List a second place only when the dream truly moves somewhere else (a bedroom, then later the open sea). Never let two entries share the same core location. Empty array if there is no discernible location.

Rules for "beats": exactly 5, always, even for a short dream — split it evenly. Each beat is one English sentence describing what is SEEN, not felt. Refer to people by their "name" so the app can bind reference images.

Rules for "filmSeconds": judge from the dream itself how much screen time it needs to be told — a single quiet moment reads in 5-8 seconds, a dream that travels through several places or builds to a reveal needs 12-20, only a truly epic arc justifies up to 30. Every scene needs about 3 seconds to breathe. Whole number, 5 to 30.

Rules for "title" and "tagline": they go on a film poster for this dream. The title is what a great director would call this film — short, concrete, evocative; never generic ("My Dream", "A Strange Night" are failures). The tagline is one line that makes a stranger want to watch — it hints at the emotional core without summarising the plot. Both stay in the dream's language.`;

/** One DeepSeek call → the structured shape the wizard runs on. */
async function analyzeDream(dream) {
  const key = process.env.DEEPSEEK_KEY;
  if (!key) throw new Error("NO_DEEPSEEK_KEY");

  const res = await fetch(DEEPSEEK_API_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      messages: [
        { role: "system", content: ANALYSIS_SYSTEM },
        { role: "user", content: `Dream:\n${dream}` },
      ],
      response_format: { type: "json_object" },
      stream: false,
    }),
  });
  if (!res.ok) {
    console.error("[DreamRushes] analyze request failed:", res.status, await res.text().catch(() => ""));
    throw new Error("ANALYZE_FAILED");
  }
  const data = await res.json().catch(() => null);
  const rawText = data?.choices?.[0]?.message?.content;
  if (typeof rawText !== "string") throw new Error("ANALYZE_FAILED");

  return normaliseAnalysis(rawText, dream);
}

// The model's answer is untrusted input twice over: it becomes prompt material
// for a paid third-party call, and it drives the UI. Shape, length and content
// are all pinned here rather than hoped for. Exported so it can be tested
// against malformed answers without touching the network.
export function normaliseAnalysis(rawText, fallbackDream = "") {
  let parsed;
  try {
    // Models sometimes fence JSON despite being told not to.
    const unfenced = String(rawText).replace(/^\s*```(?:json)?\s*|\s*```\s*$/g, "");
    parsed = JSON.parse(unfenced);
  } catch {
    throw new Error("ANALYZE_FAILED");
  }
  if (!parsed || typeof parsed !== "object") throw new Error("ANALYZE_FAILED");

  const text = sanitizePromptText(parsed.text).slice(0, MAX_DREAM) || sanitizePromptText(fallbackDream).slice(0, MAX_DREAM);
  if (!text) throw new Error("ANALYZE_FAILED");

  const list = (value) =>
    (Array.isArray(value) ? value : [])
      .map((v) => sanitizeFragment(v, MAX_FRAGMENT))
      .filter(Boolean)
      .slice(0, MAX_ANALYSIS_ITEMS);

  // People are structured ({name, kind, desc}) so the app can tell pets from
  // humans and pre-fill descriptions. Bare strings are tolerated — an older
  // or sloppier model answer degrades to kind "person" instead of failing.
  const people = (Array.isArray(parsed.people) ? parsed.people : [])
    .map((p) => {
      if (typeof p === "string") return { name: sanitizeFragment(p, MAX_FRAGMENT), kind: "person", desc: "" };
      if (!p || typeof p !== "object") return null;
      return {
        name: sanitizeFragment(p.name, MAX_FRAGMENT),
        kind: p.kind === "pet" ? "pet" : "person",
        desc: sanitizeFragment(p.desc || "", MAX_FRAGMENT),
      };
    })
    .filter((p) => p && p.name)
    .filter(dedupePeople())
    .slice(0, MAX_ANALYSIS_ITEMS);

  // Beats drive the image count, so their number is pinned, not trusted.
  // Too few: pad by repeating the last one rather than failing the whole
  // analysis over a formatting slip. Too many: take the first five.
  let beats = list(parsed.beats).slice(0, ANALYSIS_BEATS);
  if (beats.length === 0) beats = [text.slice(0, MAX_FRAGMENT)];
  while (beats.length < ANALYSIS_BEATS) beats.push(beats[beats.length - 1]);

  const style = ANALYSIS_STYLES.includes(parsed.style) ? parsed.style : "dreamlike";

  return {
    // Kept so the app can one day pick its UI language from it; validated so
    // a hallucinated value cannot smuggle arbitrary text into the client.
    language: /^[a-z]{2,3}(-[A-Za-z0-9]{2,8})?$/.test(parsed.language) ? parsed.language : "",
    text,
    people,
    places: list(parsed.places),
    beats,
    style,
    mood: sanitizeFragment(parsed.mood || "", 40),
    // Poster text. Both are SHOWN (dream's language) and later embedded in a
    // prompt we build, so they get the fragment treatment: quotes and brackets
    // stripped, length pinned. Empty is legal — the client then falls back to
    // plain scene images instead of a poster.
    title: sanitizeFragment(parsed.title || "", 60),
    tagline: sanitizeFragment(parsed.tagline || "", 120),
    /* Die vom Modell empfohlene Filmlänge. Nur eine ganze Zahl in 5–30
       überlebt — alles andere wird null, und null heisst für den Client
       „keine Empfehlung", nie 0 Sekunden. Die Modell-Klemme je Renderer
       (clampSeconds) passiert erst im Wizard: Die Empfehlung ist bewusst
       renderer-unabhängig, damit ein Modellwechsel sie neu auslegen kann. */
    filmSeconds: (() => {
      const n = Math.round(Number(parsed.filmSeconds));
      return Number.isFinite(n) && n >= 5 && n <= 30 ? n : null;
    })(),
  };
}


// ---- fal.ai calls ----
// Synchronous fal.ai REST endpoint (fal.run/<model>) rather than the queue
// API: simpler, no extra dependency, fine for image/video-gen latencies.
//
// ⚠ THAT CEILING HAS BEEN REACHED (measured 08.08.2026). A 15-second video on
// minimax/h3 does not finish inside the synchronous request — it times out,
// and the render is paid for but lost. Images and short clips are unaffected.
// Anything longer needs queue.fal.run: submit, poll status_url, fetch
// response_url. Do that BEFORE offering film lengths above ~10 seconds.
// Revisit if a model runs long enough to need the queue+polling flow.
async function falGenerateImage({ prompt, namedRefs = [], aspectRatio = "9:16" }) {
  const key = process.env.FAL_KEY;
  if (!key) throw new Error("NO_FAL_KEY");

  /* Endpunkt UND Rumpf kommen aus der Tabelle: welches Feld das Format
     trägt (`aspect_ratio` oder `image_size`) und ob es der Edit-Endpunkt
     sein muss, ist Modellwissen, kein Aufruferwissen. */
  const { model, input } = imageSubmitBody(FAL_MODEL_IMAGE, {
    prompt,
    aspectRatio,
    imageUrls: namedRefs.map((r) => r.img),
  });

  const res = await fetch(`https://fal.run/${model}`, {
    method: "POST",
    headers: { Authorization: `Key ${key}`, "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    console.error("[DreamRushes] fal.ai image request failed:", res.status, await res.text().catch(() => ""));
    throw new Error("GENERATION_FAILED");
  }
  const data = await res.json().catch(() => null);
  const urls = (data?.images || []).map((img) => img?.url).filter(Boolean);
  if (!urls.length) throw new Error("GENERATION_FAILED");
  return urls;
}

/* ---- the queue path ----
 *
 * Video does NOT go through fal.run. Measured 08.08.2026: a 15-second render
 * on minimax/h3 takes 280 seconds, far past what a held-open HTTP request
 * survives — and a timeout there means fal still renders it, still bills for
 * it, and nobody ever collects it. Paid for and lost.
 *
 * So: submit to the queue, hand the client a job id, let it come back. The
 * job outlives the request, which is the whole point.
 *
 * Jobs live on disk rather than in a Map, because a server restart during a
 * five-minute render would otherwise orphan something the person paid for.
 */
const JOBS_DIR = resolve(MEDIA_DIR, "jobs");
const JOB_ID = /^[a-z0-9]{6,32}$/;

async function readJob(id) {
  if (!JOB_ID.test(id)) return null;
  const f = Bun.file(resolve(JOBS_DIR, `${id}.json`));
  return (await f.exists()) ? f.json() : null;
}
const writeJob = (id, job) => Bun.write(resolve(JOBS_DIR, `${id}.json`), JSON.stringify(job));

/** Hand the work to fal's queue and return our own job id.
 *
 *  Which address, which duration clamp, which resolution and whether a
 *  generate_audio flag exists — all of that is per-model knowledge and
 *  comes from videoSubmitBody() in src/lib/video.js. The clamp runs HERE
 *  (server-side) through that same table: the queue only validates duration
 *  at RENDER time (re-measured 09.08.2026), so a bad value burns the fee
 *  and comes back as a failed job minutes later. */
async function falSubmitVideo({ modelId, imageUrl, imageUrls, prompt, seconds }) {
  const key = process.env.FAL_KEY;
  if (!key) throw new Error("NO_FAL_KEY");

  const { slug, body } = videoSubmitBody(modelId, { imageUrl, imageUrls, prompt, seconds });
  const res = await fetch(`https://queue.fal.run/${slug}`, {
    method: "POST",
    headers: { Authorization: `Key ${key}`, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    // Mit Modelladresse: seit es mehrere Modelle gibt, ist "welches?" die
    // erste Frage an jeden fehlgeschlagenen Submit.
    console.error("[DreamRushes] fal.ai video submit failed:", slug, res.status, await res.text().catch(() => ""));
    throw new Error("GENERATION_FAILED");
  }
  const { request_id, status_url, response_url } = await res.json();
  if (!request_id) throw new Error("GENERATION_FAILED");

  /* status_url/response_url are stored VERBATIM from fal's answer, never
   * rebuilt from the model slug: the queue routes under the model FAMILY
   * ("minimax/h3"), not the full slug ("minimax/h3/image-to-video") — a
   * hand-built path 405s, and jobStatus reads every failure as "pending",
   * so a finished film would never be collected. Found 09.08.2026 when a
   * COMPLETED render sat unclaimed behind exactly that 405. */
  const id = genJobId();
  await writeJob(id, {
    requestId: request_id, model: slug,
    statusUrl: status_url, responseUrl: response_url,
    createdAt: Date.now(), status: "pending",
  });
  return id;
}

/* Bilder gehen seit dem 21.08.2026 durch DIESELBE Warteschlange wie Filme
 * — Antons Ansage nach einer 500 mitten im Rendern: „Die App muss im
 * Hintergrund immer wieder eine Abfrage durchführen, solange der Traum
 * nicht auftaucht."
 *
 * Der Grund ist grundsätzlicher als der Bun-Timeout, der ihn ausgelöst
 * hat: Eine Verbindung 30 Sekunden offen zu halten, während nichts
 * fliesst, ist überall zerbrechlich — Server-Leerlauf, Mobilfunkwechsel,
 * App im Hintergrund, ein Proxy dazwischen. Ein Auftrag mit Nummer
 * überlebt das alles, auch einen Neustart dieses Servers, weil er auf
 * der Platte liegt und die Arbeit bei fal.
 *
 * Bewusst dieselbe Maschinerie und nicht eine zweite daneben: readJob,
 * jobStatus und /api/job kennen keinen Unterschied zwischen Bild und
 * Film — nur die Antwort von fal sieht anders aus (images[] statt
 * video), und genau diese eine Stelle steht in jobStatus. */
async function falSubmitImage({ prompt, namedRefs = [], aspectRatio = "9:16", sequenceRef = null }) {
  const key = process.env.FAL_KEY;
  if (!key) throw new Error("NO_FAL_KEY");

  /* Der Weltanker der Bildkette: der vorige Frame, als LETZTES Bild.
     ⚠ Die Position ist Vertrag, nicht Zufall — buildImagePrompt sagt dem
     Modell „the LAST reference image is the previous frame". Die Besetzung
     bleibt davor in ihrer gewohnten Reihenfolge, damit ihre Bindungs-
     Klauseln („shown in his reference photo") weiter dieselben Bilder
     treffen wie in einer Strecke ohne Kette. */
  const imageUrls = namedRefs.map((r) => r.img).filter(Boolean);
  if (sequenceRef) imageUrls.push(sequenceRef);
  // Endpunkt und Adressformat entscheidet die Tabelle, nicht diese Funktion.
  const { model, input } = imageSubmitBody(FAL_MODEL_IMAGE, { prompt, aspectRatio, imageUrls });

  const res = await fetch(`https://queue.fal.run/${model}`, {
    method: "POST",
    headers: { Authorization: `Key ${key}`, "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    console.error("[DreamRushes] fal.ai image submit failed:", model, res.status, await res.text().catch(() => ""));
    throw new Error("GENERATION_FAILED");
  }
  const { request_id, status_url, response_url } = await res.json();
  if (!request_id) throw new Error("GENERATION_FAILED");

  const id = genJobId();
  await writeJob(id, {
    requestId: request_id, model,
    statusUrl: status_url, responseUrl: response_url,
    createdAt: Date.now(), status: "pending",
  });
  return id;
}

function genJobId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/** Where a job stands. Finished media is copied locally before it is handed
 *  over, exactly like the synchronous path — the fal URL is never the record. */
async function jobStatus(id) {
  const job = await readJob(id);
  if (!job) return { status: "unknown" };
  if (job.status === "done") return { status: "done", urls: job.urls };
  if (job.status === "failed") return { status: "failed" };

  const key = process.env.FAL_KEY;
  /* Jobs written since 09.08.2026 carry fal's own URLs. Older ones fall back
   * to the model FAMILY (first two slug segments) — the full slug is exactly
   * the 405 that kept finished films uncollectable. */
  const family = job.model.split("/").slice(0, 2).join("/");
  const base = job.responseUrl || `https://queue.fal.run/${family}/requests/${job.requestId}`;
  const statusUrl = job.statusUrl || `${base}/status`;
  const s = await fetch(statusUrl, { headers: { Authorization: `Key ${key}` } });
  if (!s.ok) return { status: "pending" };            // a hiccup is not a failure
  const st = await s.json();

  if (st.status === "FAILED") {
    await writeJob(id, { ...job, status: "failed" });
    return { status: "failed" };
  }
  if (st.status !== "COMPLETED") return { status: "pending" };

  const r = await fetch(base, { headers: { Authorization: `Key ${key}` } });
  const data = await r.json().catch(() => null);
  /* Film ODER Bild — die einzige Stelle, an der sich die beiden Auftrags-
     arten überhaupt unterscheiden. Bildmodelle antworten mit images[],
     und zwar auch dann mit mehreren, wenn wir eines bestellt haben. */
  const found = data?.video?.url || data?.videos?.[0]?.url
    ? [data?.video?.url || data?.videos?.[0]?.url]
    : (data?.images || []).map((img) => img?.url).filter(Boolean);
  if (!found.length) {
    await writeJob(id, { ...job, status: "failed" });
    return { status: "failed" };
  }
  const urls = await storeAll(found);
  await writeJob(id, { ...job, status: "done", urls });
  return { status: "done", urls };
}

// Dictation: the client records audio (MediaRecorder) and sends it as a
// base64 data URI; Wizper auto-detects the spoken language, so German and
// English both come back as written text without a language toggle.
async function falTranscribe(audioDataUri) {
  const key = process.env.FAL_KEY;
  if (!key) throw new Error("NO_FAL_KEY");

  const res = await fetch(`https://fal.run/${FAL_MODEL_STT}`, {
    method: "POST",
    headers: { Authorization: `Key ${key}`, "content-type": "application/json" },
    body: JSON.stringify({ audio_url: audioDataUri, task: "transcribe" }),
  });
  if (!res.ok) {
    console.error("[DreamRushes] fal.ai transcribe request failed:", res.status, await res.text().catch(() => ""));
    throw new Error("TRANSCRIBE_FAILED");
  }
  const data = await res.json().catch(() => null);
  const text = data?.text;
  if (typeof text !== "string") throw new Error("TRANSCRIBE_FAILED");
  return text;
}

// ---- local media copies ----
// fal.ai hands back URLs on ITS hosting, with no promise about how long they
// stay reachable. A dream journal that quietly empties out months later is
// worthless, so every generated file is copied here and the journal is given
// the local path instead. The fal URL is the fallback, not the record.
// (MEDIA_DIR steht ganz oben — es muss VOR JOBS_DIR feststehen.)
const MEDIA_TYPES = {
  "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp",
  "video/mp4": "mp4", "video/quicktime": "mp4",
};
const MEDIA_MIME = { png: "image/png", jpg: "image/jpeg", webp: "image/webp", mp4: "video/mp4" };
const MAX_MEDIA_BYTES = 60 * 1024 * 1024;

/** Write bytes under a name derived from their own content — never from
 *  anything the model or the client chose — and hand back the path they
 *  will be served at. Shared by the fetch-and-copy path below and by the
 *  panel-upload endpoint, which has bytes already and nothing to fetch. */
async function storeBytes(bytes, contentType) {
  const ext = MEDIA_TYPES[String(contentType || "").split(";")[0].trim()];
  if (!ext || !bytes.length || bytes.length > MAX_MEDIA_BYTES) return null;
  const name = `${Bun.hash(bytes).toString(36)}.${ext}`;
  await Bun.write(resolve(MEDIA_DIR, name), bytes);
  return `/media/${name}`;
}

/** Copy one generated file locally. Returns "/media/<name>", or null to keep
 *  using the provider URL — a failed copy must never fail the generation the
 *  person already paid for. */
async function storeMedia(url) {
  try {
    if (!/^https:\/\//.test(url)) return null;
    const res = await fetch(url);
    if (!res.ok) return null;
    return await storeBytes(new Uint8Array(await res.arrayBuffer()), res.headers.get("content-type"));
  } catch (e) {
    console.error("[DreamRushes] could not store media locally:", e.message);
    return null;
  }
}

/* ── Abspann anhaengen ────────────────────────────────────────────────────
 *
 * Zwei Eigenheiten, die den Unterschied zwischen „laeuft" und „laeuft auch
 * morgen" ausmachen:
 *
 * 1. TON. Die Filme von minimax haben eine AAC-Spur, das Standbild hat
 *    keine. Ohne erzeugte Stille bricht `concat` mit einem Strommangel ab —
 *    oder, schlimmer, laesst den Ton der ersten Haelfte einfach weg. Ob es
 *    ueberhaupt Ton gibt, wird gemessen und nicht angenommen: ein Film ohne
 *    Tonspur muss genauso durchgehen.
 * 2. MASSE. Die Karte wird auf die Masse des Films skaliert und `setsar=1`
 *    gesetzt. Ohne das kippt concat bei abweichendem Pixel-Seitenverhaeltnis
 *    aus, und das faellt erst am krummen Bild auf.
 *
 * Das Ergebnis wird wie jede Datei nach Inhalt benannt und bleibt liegen:
 * derselbe Film mit derselben Karte kostet genau einmal Rechenzeit.
 */
const OUTRO_SECONDS = 2;

function ffprobeJson(file) {
  const p = Bun.spawnSync(["ffprobe", "-v", "error", "-print_format", "json",
                           "-show_streams", "-show_format", file]);
  if (!p.success) throw new Error("NO_FFMPEG");
  return JSON.parse(new TextDecoder().decode(p.stdout));
}

async function appendOutro(filmName, cardName) {
  const film = resolve(MEDIA_DIR, filmName);
  const card = resolve(MEDIA_DIR, cardName);

  // Nach Inhalt benannt, nicht nach Zufall: zweimal derselbe Wunsch liefert
  // dieselbe Datei zurueck, ohne zu rechnen.
  const key = Bun.hash(`${filmName}|${cardName}|${OUTRO_SECONDS}`).toString(36);
  const outName = `outro${key}.mp4`;
  const out = resolve(MEDIA_DIR, outName);
  if (await Bun.file(out).exists()) return `/media/${outName}`;

  const info = ffprobeJson(film);
  const v = (info.streams || []).find((x) => x.codec_type === "video");
  const hasAudio = (info.streams || []).some((x) => x.codec_type === "audio");
  if (!v) throw new Error("BAD_FILM");
  const w = v.width, h = v.height;

  const args = [
    "-y", "-i", film,
    "-loop", "1", "-t", String(OUTRO_SECONDS), "-i", card,
  ];
  // Der Ton der Karte: erzeugte Stille, exakt so lang wie sie steht.
  if (hasAudio) {
    args.push("-f", "lavfi", "-t", String(OUTRO_SECONDS),
              "-i", "anullsrc=channel_layout=stereo:sample_rate=44100");
  }
  // Die Karte blendet auf, statt hart zu schneiden — ein Abspann faellt
  // sonst in den letzten Bildeindruck hinein.
  const cardChain = `[1:v]scale=${w}:${h},setsar=1,fade=t=in:st=0:d=0.45,format=yuv420p[c]`;
  const concat = hasAudio
    ? `${cardChain};[0:v][0:a][c][2:a]concat=n=2:v=1:a=1[v][a]`
    : `${cardChain};[0:v][c]concat=n=2:v=1:a=0[v]`;

  args.push("-filter_complex", concat, "-map", "[v]");
  if (hasAudio) args.push("-map", "[a]", "-c:a", "aac", "-b:a", "128k");
  args.push("-c:v", "libx264", "-crf", "20", "-preset", "veryfast",
            "-pix_fmt", "yuv420p", "-movflags", "+faststart", out);

  const run = Bun.spawnSync(["ffmpeg", ...args]);
  if (!run.success) {
    const err = new TextDecoder().decode(run.stderr).split("\n").slice(-4).join(" ");
    console.error("[DreamRushes] ffmpeg:", err);
    throw new Error("OUTRO_FAILED");
  }
  return `/media/${outName}`;
}

async function storeAll(urls) {
  return Promise.all(urls.map(async (u) => (await storeMedia(u)) || u));
}

// Only ever serves files this server wrote: the name must be exactly the
// hash-plus-extension shape produced above, so nothing else is addressable.
const MEDIA_NAME = /^\/media\/([a-z0-9]{1,20}\.(png|jpg|webp|mp4))$/;
/** The filename a /media/ request resolves to, or null. Exported so the
 *  serving rules can be tested without the network. */
export function resolveMedia(pathname) {
  let rel;
  try { rel = decodeURIComponent(pathname); } catch { return null; }  // malformed %-escape
  const hit = MEDIA_NAME.exec(rel);
  return hit ? { name: hit[1], ext: hit[2] } : null;
}

async function serveMedia(pathname) {
  const hit = resolveMedia(pathname);
  if (!hit) return new Response("Not found", { status: 404 });
  const file = Bun.file(resolve(MEDIA_DIR, hit.name));
  if (!(await file.exists())) return new Response("Not found", { status: 404 });
  return new Response(file, {
    headers: {
      "content-type": MEDIA_MIME[hit.ext],
      // Content-addressed names never change meaning, so they cache forever.
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}

// ---- orchestration ----
// Step 1 (DeepSeek, optional) + step 2 (fal.ai, required) from the pipeline
// comment at the top of the file. DeepSeek failing or being unconfigured
// degrades to the local template rather than blocking generation.
async function generateImages({ dream, namedRefs, prompt: readyPrompt, aspectRatio }) {
  // The wizard assembles its own prompt locally (beats, style template,
  // reference clauses) and sends it here — that path costs no LLM call at
  // all. Only the older single-shot form, which sends raw dream text, still
  // asks DeepSeek to word it.
  let prompt = readyPrompt;
  if (!prompt) {
    try {
      prompt = await craftPromptViaDeepseek(dream, namedRefs);
    } catch (e) {
      console.error("[DreamRushes] DeepSeek prompt crafting unavailable, using local template:", e.message);
      prompt = buildFallbackPrompt(dream, namedRefs);
    }
  }
  return falGenerateImage({ prompt, namedRefs, aspectRatio });
}

// Film mode: render a keyframe still first (same pipeline as image mode),
// then animate it. minimax/h3 is image-to-video, so it needs a source image
// — there's no text-to-video path anymore.
/** Film: render the keyframe (fast, synchronous) and hand the animation to
 *  the queue. Returns a job id, not a URL — the client comes back for it.
 *
 *  With `keyframe` set, no keyframe is rendered at all: the film animates an
 *  image the dream already owns. The value is a /media/ path, NEVER a URL —
 *  resolveMedia() only matches names this server itself wrote, so the client
 *  cannot point this at an arbitrary file or host. fal gets the bytes as a
 *  data URI because the /media/ path only exists on this machine; fal could
 *  never fetch it (verified live 09.08.2026: minimax/h3 accepts data URIs). */
/* Zwei Prompts, zwei Aufgaben — seit 18.08. getrennt: `prompt` beschreibt
 * das STANDBILD (und rendert ggf. den Keyframe), `motionPrompt` kommt vom
 * Regisseur und beschreibt die BEWEGUNG. Vorher bekam das Videomodell den
 * Standbild-Prompt wörtlich — was sich bewegte, war Zufall. Fehlt der
 * Regisseur (kein Schlüssel, Prüfung rot), fällt die Bestellung auf den
 * alten Zustand zurück. */
async function startVideo({ dream, namedRefs, prompt, motionPrompt, seconds, keyframe, modelId, refImages = [] }) {
  const filmPrompt = motionPrompt || prompt || dream;
  /* `refImages` kommt aus filmReferences() und steht in EXAKT der
   * Reihenfolge der Materialliste des Regisseurs — das Startbild davor
   * macht @Image1 aus dem Keyframe, @Image2.. aus der Besetzung.
   * Ein-Bild-Modelle ignorieren das Array (videoSubmitBody entscheidet). */
  if (keyframe) {
    const hit = resolveMedia(keyframe);
    const file = hit && Bun.file(resolve(MEDIA_DIR, hit.name));
    if (!hit || !(await file.exists())) throw new Error("GENERATION_FAILED");
    const b64 = Buffer.from(await file.arrayBuffer()).toString("base64");
    const dataUri = `data:${MEDIA_MIME[hit.ext]};base64,${b64}`;
    return falSubmitVideo({ modelId, imageUrl: dataUri, imageUrls: [dataUri, ...refImages], prompt: filmPrompt, seconds });
  }
  const stills = await generateImages({ dream, namedRefs, prompt });
  const first = stills[0];
  if (!first) throw new Error("GENERATION_FAILED");
  return falSubmitVideo({ modelId, imageUrl: first, imageUrls: [first, ...refImages], prompt: filmPrompt, seconds });
}

// ---- static file serving ----
// The app directory also holds .env (the fal.ai/DeepSeek keys!), .git/, package.json
// and docs/. Serving it naively hands all of that to anyone who asks, which
// would defeat the whole point of keeping the key server-side. Everything below
// exists to make that impossible; scripts/test-static.mjs keeps it that way.
const TYPES = { html:"text/html", js:"text/javascript", css:"text/css", png:"image/png", jpg:"image/jpeg", jpeg:"image/jpeg", gif:"image/gif", mp4:"video/mp4", webp:"image/webp" };
const ROOT_ABS = resolve(ROOT);
// Deny by default. The app is exactly one page plus whatever lives in clips/ —
// an extension allowlist alone was not enough (it still exposed package.json
// and scripts/*.js). Adding a new public asset is a deliberate edit here.
// Der Build erzeugt genau eine Seite plus gehashte Assets; clips/ kommt
// unveraendert aus public/. Ein neues oeffentliches Asset ist eine bewusste
// Aenderung hier.
const PUBLIC_FILES = new Set(["/index.html"]);
const PUBLIC_DIRS = ["/assets/", "/clips/"];
export function resolveStatic(pathname) {
  let rel;
  try { rel = decodeURIComponent(pathname); } catch { return null; } // malformed %-escape
  if (rel === "/") rel = "/index.html";
  if (rel.includes("\0")) return null;
  // blocks .env, .git/config, .gitignore … and any encoded ../ that decoded here
  if (rel.split("/").some((seg) => seg.startsWith("."))) return null;
  if (!PUBLIC_FILES.has(rel) && !PUBLIC_DIRS.some((d) => rel.startsWith(d))) return null;
  const ext = rel.split(".").pop().toLowerCase();
  if (!Object.hasOwn(TYPES, ext)) return null; // unknown/extension-less → never served
  const abs = resolve(ROOT_ABS, "." + rel);
  if (abs !== ROOT_ABS && !abs.startsWith(ROOT_ABS + sep)) return null; // escaped the app dir
  return { abs, ext };
}
async function serveStatic(pathname) {
  const hit = resolveStatic(pathname);
  if (!hit) return new Response("Not found", { status: 404 });
  const file = Bun.file(hit.abs);
  if (!(await file.exists())) return new Response("Not found", { status: 404 });
  return new Response(file, { headers: { "content-type": TYPES[hit.ext] } });
}

Bun.serve({
  port: PORT,

  /* ⚠ OHNE DIESE ZEILE STIRBT JEDE GENERIERUNG (gefunden 21.08.2026, als
   * Anton „nur ein paar Bilder" wollte und eine 500 bekam).
   *
   * Bun.serve trennt eine Verbindung nach 10 Sekunden ohne Datenverkehr —
   * und genau so sieht ein Bild-Render von aussen aus: Wir warten still
   * auf fal, es fliesst nichts, die Uhr laeuft ab. Der Fehler traegt den
   * Namen der Folge, nicht der Ursache („AbortError: The connection was
   * closed"), was ihn so schwer zu lesen macht: Es sah aus, als haette
   * fal abgebrochen — abgebrochen hat unser eigener Server.
   *
   * 255 ist Buns Maximum. Es MUSS ueber den Uhren des Clients liegen
   * (api.js: 60 s normal, 180 s Render), sonst gewinnt der Server das
   * Wettrennen und der Mensch sieht eine 500 statt der ehrlichen
   * „Der Dienst hat nicht geantwortet"-Meldung. Filme sind davon nicht
   * betroffen — die kommen als Job-ID sofort zurueck. */
  idleTimeout: 255,

  /* The voice interview runs through here rather than browser-to-Google.
   *
   * It has to: the browser would need GEMINI_KEY to open that socket, and a
   * key in a bundle is a key everyone has. So the client talks to us, we hold
   * the key, and we pass frames through in both directions. The relay reads
   * nothing except the one message it must translate — the audio config —
   * and never stores what is said. */
  websocket: {
    async open(ws) {
      const key = process.env.GEMINI_KEY;
      if (!key) {
        ws.send(JSON.stringify({ type: "error", code: "NO_GEMINI_KEY" }));
        return ws.close();
      }

      const upstream = new WebSocket(`${GEMINI_WS}?key=${key}`);
      ws.data.upstream = upstream;

      // The setup frame carries the name and the cast, so it cannot be sent
      // until the client has told us who is talking. Whichever of the two
      // arrives second (socket open / "hello") triggers it. The timer is the
      // backstop: a client that never introduces itself still gets a session,
      // just an anonymous one, instead of a socket that stays silent forever.
      upstream.addEventListener("open", () => sendVoiceSetup(ws));
      ws.data.helloTimer = setTimeout(() => {
        ws.data.greeted = true;
        sendVoiceSetup(ws);
      }, 2000);

      // Straight through. Blobs stay blobs — the audio never becomes a string
      // on the way past, which would corrupt it and cost a copy per frame.
      upstream.addEventListener("message", (e) => {
        /* The greeting may only be sent once Gemini has confirmed the setup,
         * so the first frames are inspected — and only those. Gemini sends
         * everything as binary frames, including this one (measured, not
         * assumed: a string test here silently never matched and the
         * assistant stayed mute). The size guard keeps a stray audio frame
         * from being decoded for nothing; setupComplete is ~26 bytes. */
        if (!ws.data.kicked) {
          const head = typeof e.data === "string" ? e.data
            : e.data.byteLength <= 4096 ? new TextDecoder().decode(e.data) : "";
          if (head.includes("setupComplete")) ws.data.kicked = true;
        }
        if (ws.data.kicked && !ws.data.cued) {
          ws.data.cued = true;
          try {
            upstream.send(JSON.stringify({
              clientContent: {
                turns: [{ role: "user", parts: [{ text: VOICE_OPENING_CUE }] }],
                turnComplete: true,
              },
            }));
          } catch { /* upstream died between frames */ }
        }
        try { ws.send(e.data); } catch { /* client already gone */ }
      });
      upstream.addEventListener("close", () => { try { ws.close(); } catch {} });
      upstream.addEventListener("error", () => {
        try { ws.send(JSON.stringify({ type: "error", code: "UPSTREAM" })); ws.close(); } catch {}
      });
    },

    message(ws, data) {
      /* The client's very first frame is a "hello" naming the dreamer. It is
       * ours, not Gemini's, so it stops here. Everything after it is audio and
       * goes straight through — which is why this only looks at frame one:
       * JSON.parse on every audio frame would be the most expensive thing the
       * relay does. */
      if (!ws.data.greeted) {
        ws.data.greeted = true;
        if (typeof data === "string" && data.includes('"hello"')) {
          try {
            const msg = JSON.parse(data);
            if (msg.type === "hello") {
              ws.data.who = {
                name: sanitizeFragment(msg.name, 40),
                cast: (Array.isArray(msg.cast) ? msg.cast : [])
                  .map(sanitizeTag).filter(Boolean).slice(0, 40),
                // A BCP-47 tag and nothing else: it is quoted into the prompt,
                // so it may not carry anything but letters, digits and dashes.
                lang: String(msg.lang || "").replace(/[^A-Za-z0-9-]/g, "").slice(0, 12),
                // Allowlisted, never interpolated: picks briefing and tools.
                mode: msg.mode === "onboarding" ? "onboarding" : "",
                // Allowlisted too — this string goes into the Gemini setup.
                voice: VOICE_NAMES.has(msg.voice) ? msg.voice : "",
              };
              return sendVoiceSetup(ws);   // never forwarded upstream
            }
          } catch { /* not our handshake — fall through and treat as traffic */ }
        }
        // An older client, or a frame we do not recognise: Gemini still needs
        // its setup before anything else, so send it now with what we know.
        sendVoiceSetup(ws);
      }

      const up = ws.data.upstream;
      if (up?.readyState === 1) up.send(data);
    },

    close(ws) {
      clearTimeout(ws.data.helloTimer);
      try { ws.data.upstream?.close(); } catch { /* already gone */ }
    },
  },

  async fetch(req, server) {
    const url = new URL(req.url);

    /* Die Schranke vor allem, was Geld kostet. Steht ganz oben, damit kein
     * Endpunkt sie versehentlich umgeht — die Klassen-Tabelle in
     * gatekeeper.js entscheidet, was überhaupt betroffen ist, und alles
     * Unbekannte (Oberfläche, /media, /api/job) läuft ungebremst durch.
     *
     * Die Absenderkennung kommt von Bun selbst, nicht aus einem Kopfzeile
     * wie X-Forwarded-For: die kann jeder setzen, und ein Rate-Limit, das
     * sich der Begrenzte selbst aussucht, ist keins. Hinter einem Proxy
     * sähe der Server dann dessen Adresse — das ist beim heutigen Aufbau
     * (localhost) richtig und muss beim Umzug hinter einen Proxy bewusst
     * geändert werden. */
    const verdict = guard(
      url.pathname,
      server.requestIP(req)?.address || "unknown",
      req.headers.get("x-api-token"),
      process.env.API_TOKEN,
    );
    if (!verdict.ok) {
      return json({ error: verdict.error }, verdict.status,
        verdict.retryAfter ? { "retry-after": String(verdict.retryAfter) } : undefined);
    }

    if (url.pathname === "/api/voice") {
      if (server.upgrade(req, { data: { upstream: null } })) return undefined;
      return new Response("Expected a WebSocket upgrade.", { status: 426 });
    }

    /* A voice introducing itself. GET and cache-friendly on purpose: the
     * browser's own cache absorbs repeat taps, and the disk cache above
     * absorbs repeat users — Gemini is only ever billed once per
     * (voice, language) per machine. */
    if (url.pathname === "/api/voice-sample") {
      const voice = url.searchParams.get("voice") || "";
      const lang = url.searchParams.get("lang") || "";
      if (!VOICE_NAMES.has(voice)) return json({ error: "Unknown voice." }, 400);
      if (!VOICE_SAMPLE_LINES[lang]) return json({ error: "Unknown language." }, 400);
      try {
        const sample = await voiceSample(voice, lang);
        return new Response(sample, {
          headers: {
            // Der Typ kommt aus der Datei — mitgelieferte Proben sind AAC.
            "content-type": sample.type?.startsWith("audio/") ? sample.type : "audio/wav",
            /* Eine Stimmprobe ändert sich nie: Stimme und Sprache stehen in
               der Adresse. Ein Jahr und `immutable` sparen dem Browser jede
               Rückfrage — vorher fragte er nach einem Tag wieder nach. */
            "cache-control": "public, max-age=31536000, immutable",
          },
        });
      } catch (e) {
        if (e.message === "NO_GEMINI_KEY") {
          return json({ error: "Backend has no Gemini key. Set GEMINI_KEY and restart." }, 503);
        }
        console.error("[DreamRushes] /api/voice-sample failed:", e);
        return json({ error: "Could not fetch that voice." }, 502);
      }
    }

    if (url.pathname === "/api/analyze" && req.method === "POST") {
      try {
        if (Number(req.headers.get("content-length") || 0) > MAX_BODY) {
          return json({ error: "Request too large." }, 413);
        }
        const body = await req.json();
        const dream = sanitizePromptText(body.dream);
        if (dream.length < 8) return json({ error: "Dream too short." }, 400);
        if (dream.length > MAX_DREAM) return json({ error: "Dream too long." }, 400);
        return json({ ok: true, analysis: await analyzeDream(dream) });
      } catch (e) {
        const map = {
          NO_DEEPSEEK_KEY: [503, "Backend has no DeepSeek key. Set DEEPSEEK_KEY and restart."],
          ANALYZE_FAILED: [502, "Could not read that dream. Try again."],
        };
        const hit = map[e.message];
        if (hit) return json({ error: hit[1] }, hit[0]);
        console.error("[DreamRushes] /api/analyze failed:", e);
        return json({ error: "Server error." }, 500);
      }
    }

    if (url.pathname === "/api/refine" && req.method === "POST") {
      try {
        if (Number(req.headers.get("content-length") || 0) > MAX_BODY) {
          return json({ error: "Request too large." }, 413);
        }
        const body = await req.json();
        const dream = sanitizePromptText(body.dream);
        if (dream.length < 8) return json({ error: "Dream too short." }, 400);
        if (dream.length > MAX_DREAM) return json({ error: "Dream too long." }, 400);
        return json({ ok: true, text: await refineDream(dream, body.mode) });
      } catch (e) {
        const map = {
          BAD_MODE: [400, "Unknown refine mode."],
          NO_DEEPSEEK_KEY: [503, "Backend has no DeepSeek key. Set DEEPSEEK_KEY and restart."],
          REFINE_FAILED: [502, "Could not rework that dream. Try again."],
        };
        const hit = map[e.message];
        if (hit) return json({ error: hit[1] }, hit[0]);
        console.error("[DreamRushes] /api/refine failed:", e);
        return json({ error: "Server error." }, 500);
      }
    }

    /* Die Reflection zu einem Traum. Kostenlos wie alle Textarbeit
       (pricing.js: „the one step that should never deter anyone"), aber
       gebremst wie jeder DeepSeek-Pfad (gatekeeper: text-Klasse). */
    if (url.pathname === "/api/reflect" && req.method === "POST") {
      try {
        if (Number(req.headers.get("content-length") || 0) > MAX_BODY) {
          return json({ error: "Request too large." }, 413);
        }
        const body = await req.json();
        const dream = sanitizePromptText(body.dream);
        if (dream.length < 8) return json({ error: "Dream too short." }, 400);
        if (dream.length > MAX_DREAM) return json({ error: "Dream too long." }, 400);
        // Kontextzeilen kommen vom Client (atlas.js) — gewaschen und
        // gedeckelt wie jede Nutzereingabe, die einen Prompt erreicht.
        const context = (Array.isArray(body.context) ? body.context : [])
          .slice(0, 5)
          .map((l) => sanitizeFragment(l, 90))
          .filter(Boolean);
        return json({ ok: true, text: await reflectDream(dream, context) });
      } catch (e) {
        const map = {
          NO_DEEPSEEK_KEY: [503, "Backend has no DeepSeek key. Set DEEPSEEK_KEY and restart."],
          REFLECT_FAILED: [502, "Could not reflect on that dream. Try again."],
        };
        const hit = map[e.message];
        if (hit) return json({ error: hit[1] }, hit[0]);
        console.error("[DreamRushes] /api/reflect failed:", e);
        return json({ error: "Server error." }, 500);
      }
    }

    if (url.pathname === "/api/transcribe" && req.method === "POST") {
      try {
        if (Number(req.headers.get("content-length") || 0) > MAX_BODY) {
          return json({ error: "Recording too large." }, 413);
        }
        const body = await req.json();
        // Only a data URI is accepted — never a URL. Forwarding a
        // client-supplied URL to fal.ai would make this route a fetch-proxy
        // for whatever address the client names (SSRF by delegation).
        const audio = typeof body.audio === "string" ? body.audio : "";
        if (!/^data:audio\/[\w.+-]+;base64,/.test(audio)) {
          return json({ error: "Expected a base64 audio data URI." }, 400);
        }
        const text = sanitizePromptText(await falTranscribe(audio));
        return json({ ok: true, text });
      } catch (e) {
        const map = {
          NO_FAL_KEY: [503, "Backend has no fal.ai key. Set FAL_KEY and restart."],
          TRANSCRIBE_FAILED: [502, "Could not transcribe that recording. Try again."],
        };
        const hit = map[e.message];
        if (hit) return json({ error: hit[1] }, hit[0]);
        console.error("[DreamRushes] /api/transcribe failed:", e);
        return json({ error: "Server error." }, 500);
      }
    }

    /* Der Charakterbogen: aus einer Beschreibung EIN Referenzbild.
     *
     * Eigener Endpunkt statt eines Sonderfalls in /api/generate, weil er
     * etwas anderes tut: kein Traumbild, keine Szene, kein Stil, keine
     * Referenzen — nur ein neutrales Porträt, das ab da SELBST die Referenz
     * ist. Ein Flag in /api/generate hätte die Hälfte von dessen Prüfungen
     * übersprungen und die andere Hälfte umgangen.
     *
     * Ein einziger fal-Aufruf, also derselbe Kostenrahmen wie ein Bild; die
     * Skala in pricing.js verlangt trotzdem 2 Credits, weil die Referenz
     * danach beliebig oft wiederverwendet wird.
     */
    /* Der Abspann: Film + Standbild zu einem neuen Film.
     *
     * Warum ueberhaupt serverseitig — im Browser gaebe es nur zwei Wege, und
     * beide sind schlechter: ffmpeg.wasm waere ein Megabyte-Download fuer
     * eine Nebensache, und Canvas plus MediaRecorder wuerde den fertigen
     * Film neu abfilmen und dabei Qualitaet verlieren. Hier wird der
     * Originalstrom nur einmal umkodiert.
     *
     * Und warum die KARTE trotzdem aus dem Browser kommt: ffmpegs `drawtext`
     * braeuchte eine Schriftdatei, die auf einem fremden Server vielleicht
     * nicht liegt. So kennt diese Route nur Pixel.
     *
     * ⚠ ffmpeg ist ein Systemprogramm, keine npm-Abhaengigkeit. Fehlt es,
     * antwortet die Route mit 501 und der Client teilt den Film ohne
     * Abspann — Teilen darf an einer Nettigkeit nicht scheitern.
     */
    if (url.pathname === "/api/film-outro" && req.method === "POST") {
      try {
        const body = await req.json();
        const film = resolveMedia(String(body.film || ""));
        const card = resolveMedia(String(body.card || ""));
        // Nur eigene, selbst geschriebene Dateien — dieselbe Schranke wie
        // beim Keyframe: der Client benennt einen Pfad, nie eine URL.
        if (!film || film.ext !== "mp4") return json({ error: "Unknown film." }, 400);
        if (!card || card.ext === "mp4") return json({ error: "Unknown end card." }, 400);
        return json({ ok: true, url: await appendOutro(film.name, card.name) });
      } catch (e) {
        if (e.message === "NO_FFMPEG") {
          return json({ error: "This server cannot add an end card." }, 501);
        }
        console.error("[DreamRushes] /api/film-outro failed:", e);
        return json({ error: "Could not add the end card." }, 502);
      }
    }

    if (url.pathname === "/api/character" && req.method === "POST") {
      try {
        if (Number(req.headers.get("content-length") || 0) > MAX_BODY) {
          return json({ error: "Request too large." }, 413);
        }
        const body = await req.json();
        const desc = sanitizePromptText(body.desc);
        // Allowlist: die Kategorie wählt die Bildaufteilung, nichts wird
        // interpoliert.
        const category = ["person", "pet", "place"].includes(body.category) ? body.category : "person";

        /* Zwei Wege, ein Endpunkt (Plan 2026-08-20-charakterbogen-pflicht.md):
         * MIT Foto wird eine vorhandene Figur zum Bogen NORMALISIERT (grau,
         * geteilt: Ganzkörper + Gesicht) — der edit-Pfad, für den Nutzer
         * gratis, ausgelöst nur aus einem bezahlten Render heraus. OHNE Foto
         * bleibt es das sichtbare 2-Credit-Zeichnen aus der Beschreibung.
         * Nur ein data:image-URI zählt als Foto — dieselbe Form, in der der
         * Client auch an /api/generate Referenzen schickt; eine URL wäre ein
         * Auftrag an fal, Fremdes zu laden. */
        const photo = typeof body.photo === "string" && body.photo.startsWith("data:image/")
          ? body.photo : "";

        /* Auch der Bogen geht seit 21.08. in die Warteschlange (er war der
           erste, der am 10-Sekunden-Timeout starb) — Antwort ist eine
           Auftragsnummer, der Client fragt nach. */
        if (photo) {
          const jobId = await falSubmitImage({
            prompt: buildSheetFromPhotoPrompt({ desc, category }),
            namedRefs: [{ img: photo }],
            aspectRatio: "16:9",   // zwei Panels nebeneinander
          });
          return json({ ok: true, jobId });
        }

        // Kurze Beschreibungen ergeben keine brauchbare Referenz — und der
        // Aufruf kostet trotzdem. Die Grenze fängt „x" ab, bevor Geld fließt.
        if (desc.length < 10) return json({ error: "Describe them a little more first." }, 400);
        if (desc.length > 400) return json({ error: "Description too long." }, 400);

        const jobId = await falSubmitImage({
          prompt: buildCharacterPrompt({ desc, category }),
          aspectRatio: category === "place" ? "16:9" : "9:16",
        });
        return json({ ok: true, jobId });
      } catch (e) {
        const map = {
          NO_FAL_KEY: [503, "Backend has no fal.ai key. Set FAL_KEY and restart."],
          /* Der Schlüssel muss heißen, was falGenerateImage WIRFT. Bis 20.08.
             stand hier GENERATE_FAILED — nie geworfen, also fiel jeder
             fal-Fehler auf das generische 500 durch. Gefunden mit der
             Nullkosten-Probe (ungültiger Schlüssel) beim Bogen-Umbau. */
          GENERATION_FAILED: [502, "Could not draw them. Try again."],
        };
        const hit = map[e.message];
        if (hit) return json({ error: hit[1] }, hit[0]);
        console.error("[DreamRushes] /api/character failed:", e);
        return json({ error: "Server error." }, 500);
      }
    }

    if (url.pathname === "/api/generate" && req.method === "POST") {
      try {
        if (Number(req.headers.get("content-length") || 0) > MAX_BODY) {
          return json({ error: "Request too large." }, 413);
        }
        const body = await req.json();
        // Sanitise before validating, so length limits apply to what actually
        // reaches the model — not to padding that gets stripped afterwards.
        const dream = sanitizePromptText(body.dream);
        if (dream.length < 8) return json({ error: "Dream too short." }, 400);
        if (dream.length > MAX_DREAM) return json({ error: "Dream too long." }, 400);
        // Everything below crosses into paid third-party APIs, so shape and
        // size are pinned here rather than trusted from the client.
        //
        // `cast`: the client already filtered this down to cast members whose
        // @tag literally appears in the dream text (see index.html tryBackend())
        // — that's the "only use a reference photo when its name is actually
        // mentioned" rule. The server re-sanitises every field regardless;
        // never trust a client-side filter as the only guard.
        const cast = (Array.isArray(body.cast) ? body.cast : [])
          .slice(0, MAX_REFERENCES)
          .filter((c) => c && typeof c === "object" && typeof c.img === "string" && c.img)
          .map((c) => ({
            tag: sanitizeTag(c.tag),
            category: ["person", "pet", "place"].includes(c.category) ? c.category : "person",
            desc: String(c.desc || "").slice(0, MAX_FRAGMENT),
            img: c.img,
          }))
          .filter((c) => c.tag);

        // A prompt assembled by the wizard. It skips DeepSeek entirely, but it
        // still passes through the same hygiene as anything else that reaches
        // a paid API — a client-built prompt is no more trusted than a
        // model-built one.
        const prompt = body.prompt
          ? sanitizePromptText(body.prompt).slice(0, MAX_CRAFTED_PROMPT)
          : undefined;

        // The one caller that needs a canvas wider than the app's own
        // portrait default: a multi-panel grid, which only reads as several
        // pictures once it is wide enough to cut into portrait-ish strips.
        // Allowlisted rather than passed through — this reaches fal.ai
        // verbatim, so it is a value, never client-supplied text.
        const aspectRatio = body.aspectRatio === "16:9" ? "16:9" : undefined;

        /* Der Stil für den Regisseur: der Client schickt eine ID, nie den
           Text. styleById() fällt bei Unbekanntem auf "dreamlike" zurück, die
           Stiltexte sind Konstanten aus dem Repo — damit kann über dieses
           Feld kein fremder Text in einen bezahlten Prompt wandern. Gleiche
           Bauart wie voice/lang/aspectRatio. */
        const styleAnchor = body.styleId ? styleById(body.styleId).prompt : undefined;

        /* Die fünf Szenen aus der Analyse. Sie kommen vom Client zurück, sind
           also erneut Fremdtext und laufen durch dieselbe Hygiene wie alles
           andere — Länge und Anzahl gedeckelt wie bei der Analyse selbst. */
        const beats = (Array.isArray(body.beats) ? body.beats : [])
          .slice(0, ANALYSIS_BEATS)
          .map((b) => sanitizeFragment(b, MAX_FRAGMENT))
          .filter(Boolean);

        /* Seit dem 21.08.2026 gibt es nur noch EINE Antwort: { jobId }.
           Bild wie Film wandern in die Warteschlange, der Client fragt
           nach, bis etwas da ist. Vorher hiess es hier „images sind
           schnell genug zum Warten" — bis eine Bildstrecke unter Last
           genau daran starb (Bun trennt nach 10 s Stille). Warten ist
           kein Zustand, den man dem Netz zumuten sollte. */
        if (body.mode === "film") {
          // Only a /media/-shaped name survives; startVideo re-validates it
          // against resolveMedia before touching the filesystem.
          const keyframe = typeof body.keyframe === "string" ? body.keyframe : undefined;
          /* Allowlist statt Durchreichen, wie bei voice/lang/aspectRatio:
             Der Client schickt eine ID, nie einen Slug. Unbekanntes wird
             absichtlich zu "standard" — der falsche BILLIGE Film ist der
             harmlosere Fehler. */
          const modelId = ["premium", "director"].includes(body.model) ? body.model : "standard";
          const filmModel = videoModel(modelId);

          /* Referenz-Film — seit dem Neuzuschnitt vom 20.08. sind das ALLE
             Stufen: Auswahl und Reihenfolge kommen aus filmReferences() —
             Position in der Liste ist Referenznummer minus eins, Referenz 1
             ist immer das Startbild. Materialliste (für den Regisseur) und
             Bildliste (für fal) entstehen aus DERSELBEN Auswahl, damit sie
             nicht auseinanderlaufen können. Die Platzzahl kommt aus der
             Modelltabelle: H3 nimmt 5 (die gratis-Grenze), Seedance 9. */
          const kept = filmModel.maxRefs ? filmReferences(cast, filmModel.maxRefs - 1) : [];
          const refsForBrief = filmModel.maxRefs
            ? [KEYFRAME_REF, ...kept.map((c) => ({ tag: c.tag, kind: c.category, desc: c.desc }))]
            : [];

          /* Der Regisseur schreibt den Bewegungs-Prompt. Kür, nie Pflicht:
             Jeder Fehler hier — kein DeepSeek-Schlüssel, Zeitüberschreitung,
             rote @Tag-Prüfung — lässt den Film wie bisher laufen. Ein
             schlechter Film schlägt keinen Film. */
          let motionPrompt = null;
          try {
            motionPrompt = await directFilm({
              dream, still: prompt, beats, style: styleAnchor,
              seconds: body.seconds, modelId, refs: refsForBrief,
            });
          } catch (e) {
            console.error("[DreamRushes] film director skipped:", e.message);
          }

          const jobId = await startVideo({
            dream, namedRefs: cast, prompt, motionPrompt,
            seconds: body.seconds, keyframe, modelId,
            refImages: kept.map((c) => c.img),
          });
          return json({ ok: true, jobId });
        }
        /* Der Prompt entsteht noch HIER (der Wizard schickt ihn meist
           fertig mit; nur die alte Einzelform lässt DeepSeek formulieren)
           — das dauert Sekundenbruchteile. In die Warteschlange geht nur
           das Rendern selbst. */
        let imagePrompt = prompt;
        if (!imagePrompt) {
          try {
            imagePrompt = await craftPromptViaDeepseek(dream, cast);
          } catch (e) {
            console.error("[DreamRushes] DeepSeek prompt crafting unavailable, using local template:", e.message);
            imagePrompt = buildFallbackPrompt(dream, cast);
          }
        }
        /* Der Anker der Bildkette: ein /media/-Pfad, NIE eine URL — dieselbe
           Regel und dieselbe Begründung wie beim Film-Keyframe: resolveMedia
           matcht nur Namen, die dieser Server selbst geschrieben hat, und
           fal bekommt die Bytes als data-URI, weil es den lokalen Pfad nie
           erreichen könnte. Fehlt die Datei, rendert die Szene OHNE Anker
           weiter — ein fehlender Anker ist ein Schönheitsfehler, eine
           geplatzte Szene wäre ein Loch in der Strecke. */
        let seqRef = null;
        if (typeof body.sequenceRef === "string" && body.sequenceRef) {
          const hit = resolveMedia(body.sequenceRef);
          const file = hit && Bun.file(resolve(MEDIA_DIR, hit.name));
          if (hit && (await file.exists())) {
            const b64 = Buffer.from(await file.arrayBuffer()).toString("base64");
            seqRef = `data:${MEDIA_MIME[hit.ext]};base64,${b64}`;
          }
        }
        const imageJob = await falSubmitImage({ prompt: imagePrompt, namedRefs: cast, aspectRatio, sequenceRef: seqRef });
        return json({ ok: true, jobId: imageJob });
      } catch (e) {
        const map = {
          NO_FAL_KEY: [503, "Backend has no fal.ai key. Set FAL_KEY and restart."],
          GENERATION_FAILED: [502, "Image/video generation did not complete."],
        };
        const hit = map[e.message];
        if (hit) return json({ error: hit[1] }, hit[0]);
        // Don't echo internals (paths, key fragments) to the client.
        console.error("[DreamRushes] /api/generate failed:", e);
        return json({ error: "Server error." }, 500);
      }
    }

    // Collecting a film. Deliberately a GET with no body: the client may ask
    // days later, from a cold start, with nothing but the id it saved.
    if (url.pathname === "/api/job" && req.method === "GET") {
      try {
        return json({ ok: true, ...(await jobStatus(url.searchParams.get("id") || "")) });
      } catch (e) {
        console.error("[DreamRushes] /api/job failed:", e);
        return json({ error: "Server error." }, 500);
      }
    }

    // The grid feature (one generation, several panels) is cut client-side
    // with <canvas> — that is where the Vanilla-JS stack already has an image
    // decoder, so the server does not need one. This is therefore the one
    // endpoint that stores bytes the CLIENT produced rather than something a
    // model returned. It is no more trusted for that: storeBytes names the
    // file from a hash of its own content and only writes it at all if the
    // content-type maps to a real image extension, so nothing about the
    // request — not its size, not its declared type — reaches the filesystem
    // unchecked.
    /* Träume als Dateien sichern (Antons Ansage 22.08.2026: „Meine
       Testträume bitte hier abspeichern … und drinnen bleiben, bis ich
       ausdrücklich sage, dass man die Memory löschen soll.").
       Regeln in src/lib/journalBackup.js — hier gilt vor allem eine:
       ⚠ ES WIRD NUR GESCHRIEBEN, NIE GELÖSCHT. Verschwindet ein Traum aus
       der App, bleibt seine Datei stehen. Aufgeräumt wird von Hand, auf
       Antons Wort. */
    /* Die Rückrichtung: die geteilten Träume herausgeben (Antons Ansage
       22.08.: „alle, die jetzt an der App entwickeln, sollen diese Träume
       sehen"). Ohne sie wäre die Sicherung eine Einbahnstraße — geschrieben,
       eingecheckt, und ein frischer Checkout sähe trotzdem nichts.

       ⚠ Der Ladepfad im Client hängt an import.meta.env.DEV. Dieser Endpunkt
       liefert also auch im Betrieb, aber niemand fragt ihn dann. Wer die App
       veröffentlicht, nimmt beides heraus — Ordner und Ladepfad. */
    if (url.pathname === "/api/journal-backup" && req.method === "GET") {
      try {
        const glob = new Bun.Glob("*.json");
        const traeume = [];
        for await (const datei of glob.scan({ cwd: BACKUP_DIR, onlyFiles: true })) {
          const inhalt = await Bun.file(resolve(BACKUP_DIR, datei)).json().catch(() => null);
          if (inhalt?.id) traeume.push(inhalt);
        }
        traeume.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        return json({ traeume });
      } catch (e) {
        // Kein Ordner, keine Träume — das ist kein Fehler, das ist der
        // Normalfall bei einem frischen Klon ohne Testdaten.
        return json({ traeume: [] });
      }
    }

    if (url.pathname === "/api/journal-backup" && req.method === "POST") {
      try {
        if (Number(req.headers.get("content-length") || 0) > MAX_BODY) {
          return json({ error: "Request too large." }, 413);
        }
        const body = await req.json().catch(() => null);
        const eintraege = Array.isArray(body?.entries) ? body.entries : null;
        if (!eintraege) return json({ error: "Nothing to store." }, 400);

        let geschrieben = 0, unveraendert = 0;
        for (const { datei, traum } of eintraege) {
          /* Der Dateiname kommt vom Client — also wird er hier neu geprüft
             und nicht geglaubt. Ein „../" darin schriebe sonst irgendwohin. */
          if (typeof datei !== "string" || !/^[0-9a-zA-Z_.-]+\.json$/.test(datei) || datei.includes("..")) continue;
          if (!traum || typeof traum !== "object") continue;
          const ziel = resolve(BACKUP_DIR, datei);
          if (!ziel.startsWith(BACKUP_DIR + sep)) continue;
          const inhalt = JSON.stringify(traum, null, 2) + "\n";
          const alt = Bun.file(ziel);
          if (await alt.exists() && (await alt.text()) === inhalt) { unveraendert++; continue; }
          await Bun.write(ziel, inhalt);
          geschrieben++;
        }
        return json({ ok: true, geschrieben, unveraendert, ordner: "data/traeume" });
      } catch (e) {
        console.error("[DreamRushes] /api/journal-backup failed:", e);
        return json({ error: "Server error." }, 500);
      }
    }

    if (url.pathname === "/api/panel" && req.method === "POST") {
      try {
        if (Number(req.headers.get("content-length") || 0) > MAX_BODY) {
          return json({ error: "Request too large." }, 413);
        }
        const bytes = new Uint8Array(await req.arrayBuffer());
        const stored = await storeBytes(bytes, req.headers.get("content-type"));
        if (!stored) return json({ error: "Not a storable image." }, 400);
        return json({ ok: true, url: stored });
      } catch (e) {
        console.error("[DreamRushes] /api/panel failed:", e);
        return json({ error: "Server error." }, 500);
      }
    }

    if (url.pathname.startsWith("/media/")) return serveMedia(url.pathname);

    return serveStatic(url.pathname);
  },
});

function json(obj, status = 200, extraHeaders) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json", ...extraHeaders },
  });
}

console.log(`Dream Rushes running → http://localhost:${PORT}`);
console.log(process.env.FAL_KEY ? "fal.ai key: loaded ✓ (images + video)" : "fal.ai key: MISSING (generation disabled)");
console.log(process.env.DEEPSEEK_KEY ? "DeepSeek key: loaded ✓ (LLM-crafted prompts)" : "DeepSeek key: MISSING (using local prompt template)");
console.log(process.env.GEMINI_KEY ? "Gemini key: loaded ✓ (voice interview)" : "Gemini key: MISSING (voice interview disabled)");
/* Welches Bildmodell gerade wirklich läuft, und was es je Bild kostet.
 * Ein Slug in .env ist unsichtbar, bis die Rechnung kommt — diese Zeile
 * macht einen versehentlichen Rückweg auf das doppelt so teure Modell
 * beim Start sichtbar statt am Monatsende. */
{
  const m = imageModel(FAL_MODEL_IMAGE);
  /* ⚠ Seit 23.08. ist FAL_MODEL_IMAGE ein NAME aus der Tabelle, kein roher
     fal-Slug mehr. Eine alte .env mit "fal-ai/nano-banana-2" darin fiele
     sonst stumm auf die Vorgabe zurück — und man bekäme monatelang ein
     anderes Modell, als man bestellt hat. Also laut sagen. */
  if (process.env.FAL_MODEL_IMAGE && m.id !== process.env.FAL_MODEL_IMAGE) {
    console.warn(
      `[DreamRushes] FAL_MODEL_IMAGE="${process.env.FAL_MODEL_IMAGE}" kennt niemand — ` +
      `erlaubt sind: ${Object.keys(IMAGE_MODELS).join(", ")}. Es läuft die Vorgabe.`,
    );
  }
  console.log(`Bildmodell: ${m.label} → $${m.usd.toFixed(3)} je Bild`);
}
