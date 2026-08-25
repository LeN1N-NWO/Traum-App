#!/usr/bin/env bun
/* Ein transparentes Video in EINE Datei packen, die iOS UND Android können.
 *
 * Antons Frage vom 24.08.2026: „Ich habe eine Videoanimation, die nur über
 * Video gut animierbar ist … wie ich diese Videofiles in die App integrieren
 * kann, sodass Transparenzen mitkommen."
 *
 * ⚠ Das Problem ist nicht das Format, sondern dass es KEIN gemeinsames gibt:
 * HEVC+Alpha kann nur iOS, VP9+Alpha kann nur Android. Diese Packung legt
 * Farbe und Maske übereinander in ein gewöhnliches H.264 — das dekodiert
 * jedes Telefon in Hardware. Zusammengesetzt wird im Browser
 * (src/components/AlphaVideo.jsx).
 *
 * Gemessen am 24.08. (720×1280, 3 s, 30 fps):
 *   diese Packung   141 KB   beide Plattformen
 *   HEVC + Alpha    277 KB   nur iOS
 *   VP9 + Alpha      36 KB   nur Android
 *   PNG-Sequenz    3404 KB   ⚠ und 316 MB im Arbeitsspeicher
 *
 * ⚠ Kostet nichts und ruft nichts auf — reine Rechenarbeit auf diesem Gerät.
 *
 *   bun scripts/alpha-packen.mjs <quelle> [ziel.mp4] [--crf=23] [--premultipliziert]
 *
 * Quelle: alles mit echtem Alphakanal — .mov (ProRes 4444), .webm (VP9+A),
 * APNG, oder eine PNG-Sequenz als `bilder_%04d.png`.
 *
 * ── Aus After Effects exportieren ────────────────────────────────────────
 * Komposition → Zur Renderliste hinzufügen. Im AUSGABEMODUL:
 *
 *   Format          QuickTime
 *   Videocodec      Apple ProRes 4444
 *   Kanäle          RGB + Alpha          ← ohne das gibt es kein Alpha
 *   Tiefe           Millionen von Farben+  (das „+" IST der Alphakanal)
 *   Farbe           Straight (Unmatted)  ← siehe Warnung unten
 *
 * Kein H.264 aus AE — das Format kennt keinen Alphakanal, und AE sagt es
 * nicht dazu; man bekommt einfach ein deckendes Rechteck. Wer ProRes nicht
 * hat (Windows), nimmt eine PNG-Sequenz: dieselbe Wirkung, mehr Dateien.
 *
 * ⚠⚠ „Farbe" ist die eine Einstellung, bei der man sich lautlos alles
 * kaputtmacht. Der Shader in AlphaVideo.jsx multipliziert die Farbe SELBST
 * mit Alpha. Steht dort „Premultiplied (Matted With Black)", ist sie schon
 * multipliziert — es passiert zweimal, und jede weiche Kante bekommt einen
 * dunklen Saum. Auf dunklem Grund sieht man das kaum, auf hellem sofort;
 * eine Fehlermeldung gibt es nirgends. Am 24.08. sichtbar gemacht.
 *
 * Wer schon premultipliziert exportiert hat, muss nicht neu rendern:
 * `--premultipliziert` rechnet es beim Packen zurück. Gemessen gleichwertig.
 *
 * ⚠ Die Komposition darf höchstens 1080×1920 sein. Gepackt wird daraus
 * 1080×3840, und darüber steigen Telefon-Dekoder aus (alphaPack.js).
 * Bildrate 24–30 reicht; jede Verdopplung ist doppelte Dateigröße.
 */
import { basename, extname, resolve } from "node:path";
import { checkPackable } from "../src/lib/alphaPack.js";

const args = process.argv.slice(2);
const quelle = args.find((a) => !a.startsWith("--"));
const ziel = args.filter((a) => !a.startsWith("--"))[1]
  || `${basename(quelle || "", extname(quelle || ""))}-alpha.mp4`;
const crf = (args.find((a) => a.startsWith("--crf=")) || "--crf=23").split("=")[1];
/* ⚠ Die eine After-Effects-Einstellung, bei der man sich lautlos alles
   kaputtmacht. Im Ausgabemodul steht unter „Kanäle: RGB + Alpha" ein
   zweites Feld, „Farbe":
     Straight (Unmatted)          → die Vorgabe hier, nichts weiter tun
     Premultiplied (Matted With…) → dieser Schalter
   Der Shader in AlphaVideo.jsx multipliziert die Farbe SELBST mit Alpha.
   Ist sie schon multipliziert, passiert es zweimal — und weiche Kanten
   bekommen einen dunklen Saum. Keine Fehlermeldung, nirgends; es sieht nur
   aus, als hätte das Modell schlecht gerendert. */
const PREMULT = args.includes("--premultipliziert");

if (!quelle) {
  console.error("Aufruf: bun scripts/alpha-packen.mjs <quelle> [ziel.mp4] [--crf=23]");
  process.exit(1);
}

/* Erst messen, dann rechnen. Eine Packung, die kein Telefon abspielen kann,
   merkt man sonst erst auf einem fremden Gerät — ffmpeg schreibt sie
   klaglos. */
const probe = await new Response(
  Bun.spawn(["ffprobe", "-v", "error", "-select_streams", "v:0",
             "-show_entries", "stream=width,height,pix_fmt,nb_frames:stream_tags=alpha_mode",
             "-of", "json", quelle], { stdout: "pipe" }).stdout).json()
  .catch(() => null);
const strom = probe?.streams?.[0];
if (!strom) { console.error(`Kann ${quelle} nicht lesen — ist ffprobe installiert?`); process.exit(1); }

const { width, height, pix_fmt } = strom;
console.log(`\nQuelle   ${quelle}  ${width}×${height}  ${pix_fmt}`);

/* Kein Alpha in der Quelle heißt: Das Ergebnis wäre ein voll deckendes
   Rechteck. Lieber hier abbrechen als eine 140-KB-Datei ausliefern, die
   nichts kann, was ein normales MP4 nicht auch könnte.
 *
 * ⚠ Zwei Arten zu prüfen, und beide sind nötig. Ein WebM mit VP9-Alpha
 * meldet als Pixelformat schlicht `yuv420p` — sein Alpha liegt als zweiter
 * Strom im CONTAINER und steht nur im Merkmal `alpha_mode`. Die erste
 * Fassung dieser Prüfung kannte nur das Pixelformat und hat damit genau die
 * Datei abgewiesen, für die es hier am ehesten geht. */
const hatAlpha = /argb|rgba|bgra|yuva|ya8|pal8/.test(pix_fmt || "")
  || strom.tags?.alpha_mode === "1";
if (!hatAlpha) {
  console.error(
    `\n⚠ ${pix_fmt} hat keinen Alphakanal. Die Packung wäre voll deckend.\n` +
    `   Aus After Effects: ProRes 4444 (.mov) oder PNG-Sequenz exportieren.\n` +
    `   Ist der Hintergrund nur SCHWARZ, brauchst du gar kein Alpha —\n` +
    `   dann reicht ein normales MP4 mit CSS \`mix-blend-mode: screen\`.\n`);
  process.exit(1);
}

const pruef = checkPackable(width, height);
if (!pruef.ok) {
  console.error(
    `\n⚠ Gepackt wären das ${pruef.width}×${pruef.height} — über der\n` +
    `   Dekodergrenze von 4096. Kein Telefon spielt das ab.\n` +
    `   Rechne die Quelle vorher auf ${pruef.vorschlag.width}×${pruef.vorschlag.height} herunter.\n`);
  process.exit(1);
}
console.log(`Gepackt  ${pruef.width}×${pruef.height}  (Farbe oben, Maske unten)`);
console.log(`Farbe    ${PREMULT ? "premultipliziert → wird zurückgerechnet" : "straight (unmatted)"}`);

/* Die Farbhälfte bleibt UNVORMULTIPLIZIERT: Der Shader multipliziert mit
   Alpha, und dabei fällt das Kompressionsrauschen aus den ganz
   durchsichtigen Bereichen von selbst auf Null. Wer hier vormultipliziert,
   bekommt an weichen Kanten einen dunklen Saum. */
/* Zurückrechnen: Farbe geteilt durch Alpha.
 *
 * ⚠ Zwei Fehler stecken hier, die beide beim Bauen aufgelaufen sind:
 *   1. `unpremultiply` mit `inplace=1` nimmt das Alpha aus DEMSELBEN Strom
 *      und hat deshalb nur EINEN Eingang. Zwei zu geben bricht ab.
 *   2. Es darf NUR im Farbzweig stehen. Vor dem `split` gesetzt, bekommt
 *      auch `alphaextract` seine Ausgabe — und die beiden können sich auf
 *      kein gemeinsames Pixelformat einigen („could not choose their
 *      formats"). Der Alphazweig muss die Quelle unberührt sehen.
 *
 * Wo Alpha 0 ist, ist das Ergebnis undefiniert — der Shader multipliziert
 * solche Pixel ohnehin wieder mit Null. */
const farbe = PREMULT ? "unpremultiply=inplace=1,format=rgba," : "";

const filter =
  "[0:v]format=rgba,split=2[c][a];" +
  `[c]${farbe}geq=r='r(X,Y)':g='g(X,Y)':b='b(X,Y)':a=255,format=yuv420p[top];` +
  "[a]alphaextract,format=gray,format=yuv420p[bot];" +
  "[top][bot]vstack=inputs=2[out]";

const proc = Bun.spawn([
  "ffmpeg", "-v", "error", "-y", "-i", quelle,
  "-filter_complex", filter, "-map", "[out]",
  "-c:v", "libx264", "-crf", String(crf), "-pix_fmt", "yuv420p",
  /* faststart: Der Index wandert an den Dateianfang. Ohne ihn wartet die
     WebView, bis das ganze Video da ist, bevor das erste Bild erscheint. */
  "-movflags", "+faststart", "-an", ziel,
], { stdout: "inherit", stderr: "inherit" });

if (await proc.exited !== 0) { console.error("ffmpeg ist ausgestiegen."); process.exit(1); }

const kb = Math.round(Bun.file(resolve(ziel)).size / 1024);
console.log(
  `\n✓ ${ziel} — ${kb} KB\n\n` +
  `Einbauen:\n` +
  `  import AlphaVideo from "./components/AlphaVideo.jsx";\n` +
  `  import fx from "../assets/${basename(ziel)}";\n` +
  `  <AlphaVideo src={fx} style={{ position: "absolute", inset: 0, width: "100%" }} />\n`);
