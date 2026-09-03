#!/usr/bin/env node
/* Trockenlauf: ein Traum durch die GANZE Kette, jeder Prompt sichtbar.
 *
 *   node scripts/dry-run-prompts.mjs                 # eingebauter Beispieltraum
 *   node scripts/dry-run-prompts.mjs "mein Traum…"   # eigener Traum
 *   node scripts/dry-run-prompts.mjs --live          # ruft DeepSeek WIRKLICH
 *
 * Wozu: Zwischen „Traum eintippen" und „Video kommt raus" liegen fünf
 * Umformungen, von denen vier unsichtbar sind. Wer beurteilen will, ob ein
 * Modell die richtige Wahl ist oder ein Prompt taugt, muss den Text LESEN
 * können, der tatsächlich verschickt wird. Genau den druckt dieses Skript.
 *
 * Was es kostet: OHNE `--live` nichts — kein Netz, keine Credits. Es baut
 * jeden Prompt mit demselben Code, den der Server benutzt (importiert, nicht
 * nachgebaut — eine Kopie bliebe grün, während der Server längst anders
 * arbeitet), und setzt für die eine Stelle, die nur ein Modell liefern kann,
 * eine handgeschriebene Beispielanalyse ein.
 * MIT `--live` laufen die zwei echten DeepSeek-Aufrufe (Analyse + Regie).
 * Das kostet rund $0,0005 — zwei Zehntelcent. Bild und Video werden NIE
 * angefasst, auch mit --live nicht; die kosten je $0,08 bzw. $0,08–0,47
 * je Sekunde und sind genau das, was hier vermieden werden soll.
 */

import { beatsForCount, beatsForSeconds } from "../src/lib/beats.js";
import { buildReferences, buildImagePrompt, buildGridPrompt, buildPosterPrompt, buildCharacterPrompt, stripReferenceClauses } from "../src/lib/promptBuilder.js";
import { buildDirectorBrief, filmReferences, checkDirectedPrompt, KEYFRAME_REF, DIRECTOR_MOTION, DIRECTOR_FULL } from "../src/lib/director.js";
import { videoSubmitBody, videoModel, clampSeconds, VIDEO_MODELS } from "../src/lib/video.js";
import { priceForFilm } from "../src/lib/video.js";
import { styleById } from "../src/lib/styles.js";

const LIVE = process.argv.includes("--live");
const argDream = process.argv.slice(2).find((a) => !a.startsWith("--"));

/* Antons Traum vom 19.08.2026, wie diktiert. Absichtlich das ROHE Diktat
 * mit seinen Brüchen — die Analyse soll ja gerade zeigen, was sie damit
 * macht. Wer sauber vorformuliert, testet den halben Weg nicht mit. */
const DEFAULT_DREAM = `Ein junger Mann namens Anton sitzt in einem Flughafen, eine Massage zu kurz. Später tauchen ganz ganz viele Kaninchen auf und laufen durch den Gang hindurch. Er ist super irritiert und plötzlich sieht er, dass hinter diesen Kaninchen ein riesiger Alligator rennt und versucht, diese aufzufressen. Er selbst fängt an, mit den Kaninchen wegzulaufen, geht durch ein Gate, steigt in ein Flugzeug ein und das Flugzeug hebt ab. Der Alligator im Hintergrund wird immer größer und verspeist den ganzen Flughafen.`;

const DREAM = argDream || DEFAULT_DREAM;

/* ---------- Ausgabe-Hilfen: der Text IST das Ergebnis ---------- */
const line = (c = "─") => console.log(c.repeat(78));
function stage(n, title, note) {
  console.log("");
  line("━");
  console.log(`  SCHRITT ${n} — ${title}`);
  if (note) console.log(`  ${note}`);
  line("━");
}
function block(label, text, meta) {
  console.log(`\n▼ ${label}${meta ? `   [${meta}]` : ""}`);
  line();
  console.log(text);
  line();
}

/* ---------- Der eine Schritt, den nur ein Modell leisten kann ----------
 * Von Hand geschrieben nach dem Schema aus server.js (ANALYSIS_SYSTEM), damit
 * die nachgelagerten Prompts ECHT entstehen können. Deutlich als Beispiel
 * markiert — wer die wahre Antwort will, nimmt --live. */
const SAMPLE_ANALYSIS = {
  language: "de",
  text: "Ich sitze in einem Flughafen und warte. Die Zeit zieht sich. Dann laufen auf einmal hunderte Kaninchen durch den Gang — ein einziger Strom aus Fell. Ich verstehe nicht, was das soll. Und dann sehe ich, was hinter ihnen herjagt: ein riesiger Alligator, der nach ihnen schnappt. Ich renne los, mitten im Kaninchenstrom, durch das Gate, die Fluggastbrücke hinauf ins Flugzeug. Die Maschine hebt ab. Unter mir wird der Alligator immer größer, bis er den ganzen Flughafen verschlingt.",
  people: [
    { name: "Anton", kind: "person", desc: "junger Mann" },
    { name: "die Kaninchen", kind: "pet", desc: "hunderte rennende Kaninchen" },
    { name: "der Alligator", kind: "pet", desc: "riesiger Alligator, wächst ins Monströse" },
  ],
  places: ["Flughafenterminal", "Gate und Fluggastbrücke", "Flugzeug in der Luft"],
  beats: [
    "Anton sits waiting alone in a wide airport terminal, time dragging.",
    "Hundreds of rabbits pour down the concourse in a single streaming mass past him.",
    "Behind the rabbits a huge alligator charges, jaws snapping at the stragglers.",
    "Anton runs with the rabbit stream through the gate and up the jet bridge into the plane.",
    "The plane lifts off while below the alligator swells enormous and swallows the airport.",
  ],
  style: "surreal",
  mood: "aufgewühlt",
  title: "Der Strom",
  tagline: "Manche rennen mit. Manche werden verschlungen.",
  filmSeconds: 14, // die Reise durch drei Orte plus das Finale — kein 6-Sekünder
};

/* ---------- echte Aufrufe, nur mit --live ---------- */
async function callDeepseek(system, user, { json = false } = {}) {
  const key = process.env.DEEPSEEK_KEY;
  if (!key) throw new Error("DEEPSEEK_KEY fehlt — ohne Schlüssel kein --live");
  const res = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({
      model: process.env.DEEPSEEK_MODEL || "deepseek-v4-flash",
      messages: [{ role: "system", content: system }, { role: "user", content: user }],
      ...(json ? { response_format: { type: "json_object" } } : {}),
      stream: false,
      // ⚠ KEIN max_tokens — das Denkmodell schreibt erst ins Denkfeld, ein
      // Deckel lässt die Antwort leer zurückkommen (gemessen 17.08., T0).
    }),
  });
  if (!res.ok) throw new Error(`DeepSeek ${res.status}: ${await res.text().catch(() => "")}`);
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (typeof text !== "string") throw new Error("DeepSeek: keine Textantwort");
  return { text, usage: data?.usage };
}

/* Der Analyse-Systemprompt wird aus server.js GELESEN statt kopiert — eine
 * Kopie würde hier grün bleiben, während der Server längst anders fragt. */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const REPO = join(dirname(fileURLToPath(import.meta.url)), "..");
function extractFromServer(re, what) {
  const src = readFileSync(join(REPO, "server.js"), "utf8");
  const m = src.match(re);
  if (!m) throw new Error(`${what} nicht in server.js gefunden — dort umbenannt?`);
  return m[1];
}
const ANALYSIS_SYSTEM = extractFromServer(/const ANALYSIS_SYSTEM = `([\s\S]*?)`;/, "ANALYSIS_SYSTEM");

/* ================================================================= */
async function main() {
  console.log("");
  line("═");
  console.log("  TROCKENLAUF — was aus einem Traum wird, Schritt für Schritt");
  console.log(`  Modus: ${LIVE ? "LIVE (DeepSeek wird wirklich gefragt, ~$0,0005)" : "TROCKEN (kein Netz, keine Credits)"}`);
  console.log("  Bild- und Videogenerierung werden NIE ausgelöst.");
  line("═");

  /* ---- 0: was der Mensch eintippt ---- */
  stage(0, "DER ROHE TRAUM", "genau das, was im Textfeld steht");
  block("Eingabe", DREAM, `${DREAM.length} Zeichen`);

  /* ---- 1: die eine Analyse ---- */
  stage(1, "ANALYSE — der EINZIGE Modellaufruf pro Traum",
    "server.js analyzeDream() · alles danach ist lokale Logik ohne Modell");
  block("① System-Prompt an DeepSeek", ANALYSIS_SYSTEM, `${ANALYSIS_SYSTEM.length} Zeichen`);
  block("② User-Nachricht an DeepSeek", `Dream:\n${DREAM}`);

  let analysis = SAMPLE_ANALYSIS;
  if (LIVE) {
    console.log("\n… rufe DeepSeek für die Analyse …");
    const { text, usage } = await callDeepseek(ANALYSIS_SYSTEM, `Dream:\n${DREAM}`, { json: true });
    block("③ ANTWORT von DeepSeek (roh)", text, usage ? `${usage.total_tokens} Tokens` : "");
    try {
      analysis = JSON.parse(text.replace(/^\s*```(?:json)?\s*|\s*```\s*$/g, ""));
    } catch {
      console.log("\n⚠ Antwort war kein gültiges JSON — nutze die Beispielanalyse weiter.");
    }
  } else {
    block("③ ANTWORT — ⚠ BEISPIEL, nicht vom Modell",
      JSON.stringify(analysis, null, 2),
      "mit --live steht hier die echte Antwort");
  }

  console.log("\n  Was die App daraus liest:");
  console.log(`    Titel:    ${analysis.title}`);
  console.log(`    Tagline:  ${analysis.tagline}`);
  console.log(`    Stil:     ${analysis.style}   (steuert ALLE Bildprompts)`);
  console.log(`    Stimmung: ${analysis.mood}`);
  console.log(`    Figuren:  ${analysis.people.map((p) => `${p.name} [${p.kind}]`).join(", ")}`);
  console.log(`    Orte:     ${analysis.places.join(" · ")}`);

  /* ---- 2: Beats → Bildanzahl ---- */
  stage(2, "BEATS → BILDANZAHL", "src/lib/beats.js · rein lokal, kostet nichts");
  for (const count of [3, 5, 10]) {
    const beats = beatsForCount(analysis.beats, count);
    console.log(`\n  ${count} Bilder:`);
    beats.forEach((b, i) => console.log(`    ${String(i + 1).padStart(2)}. ${b}`));
  }

  /* ---- 3: Referenzen ---- */
  stage(3, "REFERENZEN — wer bekommt ein echtes Gesicht?",
    "src/lib/promptBuilder.js buildReferences() · die Nummer MUSS zur Bildposition passen");
  /* Angenommen: Anton hat sich selbst ein Foto zugewiesen, den Alligator
     überlässt er dem Modell, die Kaninchen bekommen einen Charakterbogen. */
  const assignments = [
    { name: "Anton", kind: "person", avatar: { tag: "anton", img: "data:image/png;base64,AAAA", desc: "junger Mann, dunkle Jacke" } },
    { name: "die Kaninchen", kind: "pet", avatar: { tag: "kaninchen", img: "data:image/png;base64,BBBB", desc: "hunderte rennende Kaninchen" } },
    { name: "der Alligator", kind: "pet", free: true },
  ];
  const { references, clauses } = buildReferences(assignments);
  console.log("\n  Zuweisung (so wie im Wizard geklickt):");
  assignments.forEach((a) => console.log(`    ${a.name.padEnd(18)} → ${a.avatar?.img ? `Foto @${a.avatar.tag}` : "frei erfunden"}`));
  console.log(`\n  → ${references.length} Bilder gehen mit, in dieser Reihenfolge:`);
  references.forEach((r, i) => console.log(`    Bild ${i + 1}: @${r.tag}`));
  block("Referenz-Klauseln (hängen an JEDEN Bildprompt)", clauses.join("\n\n"));

  /* ---- 4: Bildprompts ---- */
  stage(4, "BILDPROMPTS → fal.ai Nano Banana 2",
    "src/lib/promptBuilder.js · JEDER dieser Prompts kostet beim Absenden $0,08");

  block("A · Das Filmplakat (Titelkarte)", buildPosterPrompt({
    title: analysis.title, tagline: analysis.tagline,
    essence: analysis.beats[0], styleId: analysis.style,
    format: "9:16", clauses,
  }));

  const five = beatsForCount(analysis.beats, 5);
  block("B · Einzelbild (Beat 3 von 5)", buildImagePrompt({
    beat: five[2], styleId: analysis.style, format: "9:16",
    clauses, index: 3, total: 5,
  }));

  block("C · Schnellvorschau: 3 Panels aus EINEM Rendering (1 Credit statt 3)",
    buildGridPrompt({ beats: beatsForCount(analysis.beats, 3), styleId: analysis.style, clauses }));

  block("D · Charakterbogen (nur bei Figuren OHNE Foto)", buildCharacterPrompt({
    desc: analysis.people[2]?.desc || "riesiger Alligator", category: "pet",
  }));

  /* ---- 5: der Regisseur ---- */
  stage(5, "DER REGISSEUR — Traum → BEWEGUNGS-Prompt",
    "src/lib/director.js + server.js directFilm() · zweiter DeepSeek-Aufruf");

  const cast = assignments
    .filter((a) => a.avatar?.img)
    .map((a) => ({ tag: a.avatar.tag, category: a.kind, desc: a.avatar.desc, img: a.avatar.img }));
  const stillPrompt = buildImagePrompt({ beat: five[0], styleId: analysis.style, format: "9:16", clauses, index: 1, total: 5 });

  for (const m of VIDEO_MODELS) {
    const label = { standard: "Lebendig", director: "Regie", premium: "Kino" }[m.id];
    const seconds = clampSeconds(m.id, m.preset);
    const withRefs = !!m.maxRefs;   // seit 20.08. alle Stufen, seit 31.08. ohne Seedance 2.0
    const kept = withRefs ? filmReferences(cast) : [];
    const refsForBrief = withRefs
      ? [KEYFRAME_REF, ...kept.map((c) => ({ tag: c.tag, kind: c.category, desc: c.desc }))]
      : [];

    console.log("");
    line("═");
    console.log(`  STUFE „${label}"  ·  ${m.slug}`);
    console.log(`  ${seconds}s · ${m.resolution} · ${m.creditsPerSecond} Credits/s`
      + ` · ${priceForFilm(m.id, seconds)} Credits gesamt`
      + ` · ${refsForBrief.length ? `${refsForBrief.length} Referenzen` : "1 Startbild"}`);
    line("═");

    block(`① System-Prompt (${withRefs ? "DIRECTOR_FULL" : "DIRECTOR_MOTION"})`,
      withRefs ? DIRECTOR_FULL : DIRECTOR_MOTION);

    /* Spiegelt den Aufruf in server.js directFilm(). Läuft der hier
       auseinander, zeigt der Trockenlauf etwas anderes als die App tut —
       director.test.js hält den Serveraufruf selbst fest. */
    const brief = buildDirectorBrief({
      dream: analysis.text,
      still: stripReferenceClauses(stillPrompt),
      beats: beatsForSeconds(analysis.beats, seconds),
      style: styleById(analysis.style).prompt,
      refs: refsForBrief,
      seconds,
      audio: m.audio,
      promptBudget: m.promptMax,
    });
    block("② User-Nachricht (die Materialliste)", brief, `${brief.length} Zeichen`);

    let motionPrompt = null;
    if (LIVE) {
      console.log(`\n… rufe DeepSeek als Regisseur für „${label}" …`);
      try {
        const { text, usage } = await callDeepseek(withRefs ? DIRECTOR_FULL : DIRECTOR_MOTION, brief);
        motionPrompt = text.trim();
        const check = checkDirectedPrompt(motionPrompt, refsForBrief.length);
        block("③ ANTWORT — der Bewegungs-Prompt", motionPrompt,
          `${motionPrompt.length} Zeichen · ${usage ? `${usage.total_tokens} Tokens · ` : ""}@Image-Prüfung: ${check.ok ? "bestanden" : `FEHLGESCHLAGEN (${check.bad.join(",")}) → Rückfall`}`);
      } catch (e) {
        console.log(`\n⚠ Regisseur fehlgeschlagen: ${e.message}`);
        console.log("   In der App heißt das: Rückfall auf den Standbild-Prompt.");
      }
    } else {
      console.log("\n▼ ③ ANTWORT — nur mit --live");
      console.log("   Ohne Regisseur fällt die App auf den STANDBILD-Prompt zurück,");
      console.log("   also Block B von oben — an ein VIDEO-Modell.");
    }

    /* ---- 6: der tatsächliche fal-Auftrag ---- */
    const { slug, body } = videoSubmitBody(m.id, {
      imageUrl: "/media/abc123.png",
      imageUrls: withRefs ? ["/media/abc123.png", ...kept.map((c) => `[Foto @${c.tag}]`)] : undefined,
      prompt: motionPrompt || "‹Regisseur übersprungen → hier stünde der Standbild-Prompt›",
      seconds,
    });
    block(`④ Der Auftrag an fal.ai  →  ${slug}`,
      JSON.stringify({ ...body, prompt: body.prompt.length > 300 ? body.prompt.slice(0, 300) + `\n… (${body.prompt.length} Zeichen gesamt, siehe oben)` : body.prompt }, null, 2));

    if (withRefs) {
      console.log("  ⚠ Reihenfolge-Invariante: Zeile N der Materialliste = @ImageN = image_urls[N-1].");
      console.log("     Laufen die auseinander, bekommen Menschen die Gesichter der anderen.");
    }
  }

  console.log("");
  line("═");
  console.log("  ENDE. Kosten dieses Laufs: " + (LIVE ? "~$0,0005 (nur DeepSeek)" : "$0,00"));
  console.log("  Nicht ausgelöst: Bildgenerierung ($0,08/Bild), Videogenerierung ($0,08–0,47/s).");
  line("═");
  console.log("");
}

main().catch((e) => { console.error("\n✗ " + e.message); process.exit(1); });
