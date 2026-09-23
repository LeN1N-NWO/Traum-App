/* The film options: which renderer, and how many seconds.
 *
 * Both cost and price are derived from ONE number per model — its per-second
 * rate — so a price change is a single edit and the credit figures cannot
 * drift away from what we actually pay.
 *
 * Rates re-measured 19.08.2026 (fal OpenAPI schemas + paid tests, film plan
 * §10b/§10c); the queue ACCEPTS any duration at submit and only validates at
 * render time, so a wrong minimum here costs real credits and comes back as
 * a failed job minutes later:
 *   minimax/h3 R2V   768P  $0.06 / second  5–15s, first 5 reference images free
 *   seedance 2.0 fast R2V  $0.2419 / s     5–15s
 *   seedance 2.5 R2V 720p  $0.473 / second up to 30s, native single take
 *
 * ── ⚠ Neu gerechnet am 24.08.2026: der Credit ist DREIMAL billiger ───────
 * Bis hierher galt „1 Credit = $0,08 = ein Bild", und daraus fiel für
 * minimax/h3 genau 1 Credit je Sekunde heraus — eine Merkregel, die man im
 * Kopf behalten konnte. Sie ist weg, und das war unvermeidlich: Ein Bild
 * kostet uns seit der Umstellung auf das 2×2-Raster **$0,0283**, nicht
 * $0,08 (`creditCostUsd()` in gridLayout.js rechnet es aus).
 *
 * Der Credit misst das BILD. Bilder sind billiger geworden, Film NICHT —
 * also muss Film in Credits teurer werden, sonst misst dieselbe Einheit
 * zwei verschiedene Dinge. Genau das war der Fehler, den Anton am 24.08.
 * gefunden hat: Bei gleichbleibenden Filmpreisen hätte jede Erhöhung der
 * Credit-Zahlen nicht Bilder verschenkt, sondern FILM — und das Jahresabo
 * lag beim Kino-Film schon vorher unter dem Zielaufschlag (1,3× statt 1,5×).
 *
 * `usdPerSecond` steht deshalb ab jetzt IN dieser Tabelle (vorher nur als
 * Konstante in scripts/preis-durchreichen.mjs), und `creditsPerSecond` ist
 * daraus aufgerundet:  ceil(usdPerSecond / creditCostUsd()).
 * ⚠ Aufgerundet, nie ab: `video.test.js` rechnet beide nach und schlägt an,
 * wenn ein Modellwechsel die Herleitung überholt.
 *
 * Was das für den Kunden heißt, steht in plans.js: Die Credit-Zahlen der
 * Pläne steigen mit, sodass die FILM-Menge ungefähr gleich bleibt und die
 * BILD-Menge sich mehr als verdoppelt. Die Ersparnis ist beim Bild
 * entstanden, also wird sie beim Bild ausgezahlt.
 */
import { PRICES } from "./pricing.js";

/* `promptMax`: wie viele Zeichen Prompt das MODELL verträgt — recherchiert
 * 19.08.2026, je Modell verschieden, deshalb steht es in dieser Tabelle und
 * nicht als eine Zahl im Server. Ein Prompt über dem Limit wird je nach
 * Plattform abgelehnt (bezahlte Runde verloren) oder still abgeschnitten
 * (der Schluss des Films fehlt, ohne dass es jemand merkt).
 *
 *   minimax/h3       7 000 (offizielle H3-API; ältere minimax-Modelle 2 000)
 *   seedance 2.0     5 000 modellseitig — Plattformen klemmen unterschiedlich
 *                    (3 000–10 000); fal dokumentiert im Schema KEINE Grenze,
 *                    also gilt die modellseitige
 *   seedance 2.5     10 000 (Runware-API-Doku; Runway erweitert auf 15 000 —
 *                    die 2.5-Prompts mit Sekunden-Timestamps über 30 s sind
 *                    absichtlich lang). Die erste Fassung nahm „wie 2.0" an
 *                    und hätte dem Kino-Regisseur die Hälfte seines echten
 *                    Budgets vorenthalten. fal-seitig weiter ungemessen —
 *                    beim ersten echten Kino-Lauf gegenprüfen.
 *
 * Der Wert hier ist zugleich das Budget, das der Regisseur GENANNT bekommt
 * (buildDirectorBrief), und die Notbremse, an der der Server seine Antwort
 * kappt — eine Zahl, zwei Verwendungen, damit sie nie auseinanderlaufen. */
/* ⚠ Der Zuschnitt „nur Regie kann Referenzen" ist eine ENDPOINT-Wahl dieser
 * App, KEIN Modelllimit — Recherche 19.08.2026 auf Antons Einspruch hin
 * („keine künstliche Verknappung, Modellpreise weitergeben wie sie sind"):
 *
 *   minimax/h3/reference-to-video   existiert auf fal: bis 9 Bilder, dazu
 *     Motion-/Audio-Referenzen, 2K. Preis lt. fal-Learn-Artikel: $0.05/s
 *     @480p, $0.06/s @768p, $0.13/s @2K — die ersten 5 Referenzbilder
 *     GRATIS, jedes weitere $0.08. Bei 768p also BILLIGER als unser
 *     jetziger image-to-video ($0.08/s) — mit Referenzen.
 *   bytedance/seedance-2.5/reference-to-video   existiert auf fal: bis 30
 *     Bilder (50 Dateien inkl. Video/Audio), @Image1…-Adressierung. Preis
 *     token-basiert, Quellen streuen (~$0.22–0.28/s @720p).
 *   WAN 3.0 (Alibaba, 30 s, Dokument-Inputs): seit 06.08. öffentliche Beta,
 *     aber NUR über Alibaba Cloud Model Studio / Qwen Cloud mit Antrag —
 *     auf fal gibt es bislang nur Wan 2.x. Kein Kandidat, bis fal es listet.
 *
 * Konsequenz steht als Messauftrag im Film-Regie-Plan §10: Feldnamen und
 * Preise dieser Endpoints am echten fal-Validator bestätigen (aus der
 * Arbeits-Sandbox ist fal.ai gesperrt), DANN die Stufen neu zuschneiden.
 * Bis dahin beschreiben die UI-Infotexte den App-Zustand („diese Stufe"),
 * nie eine Modell-Eigenschaft — nichts behaupten, was das Modell kann oder
 * nicht kann, solange nur unsere Endpoint-Wahl es einschränkt. */
/* Neuzuschnitt 20.08.2026 (Antons Go, Filmplan §10d): ALLE drei Stufen sind
 * jetzt Referenz-Modelle — der Zuschnitt „nur Regie kann Referenzen" war eine
 * Endpoint-Wahl, kein Modelllimit (§10). Jede Stufe ist ein EIGENES Modell
 * (Antons Bedingung): MiniMax H3 · Seedance 2.0 · Seedance 2.5.
 *
 * Vier Felder tragen das Modellwissen, das vorher niemand brauchte:
 *   refsField  — wie das Referenz-Array beim Modell heißt. H3-R2V sagt
 *                reference_image_urls, Seedance sagt image_urls, und keins
 *                versteht das jeweils andere (nano-banana-Fehlerklasse).
 *   refStyle   — wie der Prompt eine Referenz adressiert. Drei Familien,
 *                gemessen an fals OpenAPI-Schemata 19.08. (§10b):
 *                "at" = @Image1 · "bracket" = [Image1] · "plain" = Image 1.
 *   aspect     — R2V-Modelle haben kein Startbild, aus dem sie das Format
 *                ableiten könnten; wo das Schema 9:16 bestätigt, wird es
 *                ausdrücklich gesetzt (H3-Vorgabe wäre "adaptive").
 *   noExpand   — H3 formuliert Prompts standardmäßig selbst um
 *                (enable_prompt_expansion steht AN); für Regie-Prompts
 *                ausdrücklich abgeschaltet, sonst überschreibt ein fremdes
 *                Modell die Arbeit unseres Regisseurs. */
/* ── Zwei Modelle, je zwei Qualitäten (Antons Entscheidung 31.08.2026) ────
 * Seedance 2.0 ist raus („komplett weg"). Übrig bleiben MiniMax H3 und
 * Seedance 2.5 — und jedes bekommt einen Qualitätsschalter, weil die
 * Auflösung bei Seedance mehr als den PREIS VERDOPPELT. Am 31.08. auf den
 * fal-Modellseiten nachgelesen, nicht aus dem Gedächtnis:
 *   H3            480P $0,05/s  · 768P $0,06/s   (erste 5 Referenzbilder gratis)
 *   Seedance 2.5  480p $0,2205/s · 720p $0,473/s (1080p $1,164 — nicht angeboten)
 * `creditsPerSecond` je Qualität = ceil(usd / creditCostUsd()); video.test.js
 * rechnet jede der vier Zahlen nach.
 *
 * `preferred` ist die Vorgabe des Schalters, und sie ist je Modell BEWUSST
 * verschieden: Bei H3 kostet die scharfe Stufe EINEN Credit mehr — bei
 * 9:16 ist 480P sichtbar weich, das ist der Credit wert. Bei Seedance
 * kostet sie NEUN Credits mehr; dort ist 480p die Vorgabe, denn genau das
 * war der Sinn des Umbaus („die Preise runter"). Wer das ändert, sieht in
 * preis-durchreichen.mjs sofort, was es kostet.
 *
 * ⚠ Die Felder resolution/usdPerSecond/creditsPerSecond auf MODELLEBENE
 * sind aus `preferred` ABGELEITET (VIDEO_MODELS unten), nie abgeschrieben:
 * Skripte und Aufrufer ohne Qualitätsangabe sehen so die Vorgabe, und es
 * gibt weiterhin genau eine Quelle je Zahl.
 *
 * Modellwissen, das bleibt (Herkunft: Filmplan §10b/§10c, bezahlt geprüft):
 *   H3: `resolution` MUSS gesetzt sein — die Schema-Vorgabe ist "2K" und
 *       kostet $0,13/s. Kein generate_audio-Parameter (liefert von sich aus
 *       AAC; ein unbekanntes Feld kann den Auftrag kosten). Referenzen in
 *       `reference_image_urls`, adressiert als „Image 1". Prompt-Expansion
 *       steht standardmäßig AN und wird ausdrücklich abgeschaltet.
 *   Seedance 2.5: Referenzen in `image_urls`, adressiert als [Image1];
 *       generate_audio nötig, sonst stumm. 9 Referenzen (Keyframe + 8),
 *       damit die Brief-Form aller Stufen gleich bleibt. */
/* ── Standard = H3 Max Turbo, NUR image-to-video (Antons Entscheid, zwei
 * Ansagen am 23.09.2026) ─────────────────────────────────────────────────
 * Erst: „Turbo verwenden, Ersparnis weitergeben." Dann, auf den Befund
 * „Turbo kann keine Referenz-Arrays" (minimax/h3-max-turbo/reference-to-
 * video existiert nicht, 404 am fal-Schema gemessen): „Ich will Max Turbo
 * mit Bildern." Das geht, weil die Fotos ÜBERS KEYFRAME wirken: das
 * Bildmodell rendert das Startbild MIT den Besetzungs-Referenzen, und
 * Turbo beginnt pixelgenau mit diesem Bild (bezahlt geprüft 23.09.,
 * Frosch-Test: Frame 0 = unser Bild). Das Videomodell selbst bekommt EIN
 * Bild (image_url) und keine Referenzliste mehr.
 * ⚠ Ungemessen: ob Turbo Gesichter über 15 s Bewegung hält. Beim ersten
 * echten Foto-Film prüfen. Der doppelte-Preis-Rückweg mit echter
 * Identitätsführung existiert: minimax/h3-max/reference-to-video (bis 9
 * Bilder, hielt im Frosch-Test die Identität; Weiche und Preise standen
 * in Commit 0155f6c).
 * Einkauf lt. fal-Modellseite 23.09.: 480P $0,025 · 768P $0,04 ·
 * 1080P $0,08 (Antons Ansage: Auflösungen im Klartext, drei Stufen;
 * Seedance bietet 1080p weiter nicht an — dort hieße es 42 Credits/s).
 * ⚠ Der Endpunkt VERLANGT prompt_expansion_mode (Pflichtfeld); "disabled",
 * denn die Umformulierung würde unseren Regisseur überschreiben. Ein
 * aspect_ratio kennt i2v nicht: DAS KEYFRAME führt das Format — die
 * Formatwahl des Wizards reist deshalb als aspectRatio in die
 * KEYFRAME-Erzeugung (server.js startVideo), nicht in diesen Auftrag. */
const MODELLE = [
  {
    id: "standard",
    slug: "minimax/h3-max-turbo/image-to-video",
    qualities: {
      sd: { resolution: "480P", usdPerSecond: 0.025, creditsPerSecond: 1 },
      hd: { resolution: "768P", usdPerSecond: 0.04, creditsPerSecond: 2 },
      fhd: { resolution: "1080P", usdPerSecond: 0.08, creditsPerSecond: 3 },
    },
    preferred: "hd",
    min: 5, max: 15, step: 1, preset: 6,
    audio: true,          // H3 Max Turbo rendert nativen, synchronen Ton — ohne Parameter
    expansionMode: "disabled",
    negatives: true,      // H3 nimmt Negativ-Regeln ungewöhnlich ernst (fal-Prompting-Guide)
    promptMax: 10000,     // Schema erlaubt 50 000; 10 000 ist unser Regie-Budget (wie Seedance)
    shotEvery: 5, maxShots: 3, timeFormat: "ms",
  },
  {
    id: "premium",
    slug: "bytedance/seedance-2.5/reference-to-video",
    qualities: {
      sd: { resolution: "480p", usdPerSecond: 0.2205, creditsPerSecond: 8 },
      hd: { resolution: "720p", usdPerSecond: 0.473,  creditsPerSecond: 17 },
    },
    preferred: "sd",
    min: 5, max: 30, step: 5, preset: 15,
    audio: true,
    audioParam: true,     // Seedance braucht generate_audio, sonst kommt der Film stumm
    maxRefs: 9,
    refsField: "image_urls",
    refStyle: "bracket",
    aspect: "9:16",
    /* Die Formate, die das 2.5-Schema BESTÄTIGT (gemessen 23.09.; das Enum
     * kennt auch 21:9/4:3/3:4/auto — nicht angeboten). Ein Wunsch außerhalb
     * dieser Liste fällt in videoSubmitBody auf `aspect` zurück. */
    aspects: ["9:16", "16:9", "1:1"],
    promptMax: 10000,
    shotEvery: 4, maxShots: 9, timeFormat: "s",
  },
];

/* Alle Stufen-IDs, die es IRGENDWO gibt — die Allowlist des Servers.
 * Welche ein Modell wirklich anbietet, sagt seine qualities-Tabelle
 * (Seedance kennt kein fhd; Unbekanntes fällt in filmQuality auf die
 * Vorgabe zurück, in Preis UND Bestellung gleichermaßen). */
export const QUALITIES = ["sd", "hd", "fhd"];

export const VIDEO_MODELS = MODELLE.map((m) => ({ ...m, ...m.qualities[m.preferred] }));
/* Reihenfolge = UI-Reihenfolge = aufsteigender Preis. Eintrag [0] muss
 * "standard" bleiben: videoModel() fällt bei Unbekanntem dorthin zurück,
 * und der falsche BILLIGE Film ist der harmlosere Fehler. */

export function videoModel(id) {
  return VIDEO_MODELS.find((m) => m.id === id) || VIDEO_MODELS[0];
}

/** Die gewählte Qualität eines Modells — oder seine Vorgabe, wenn keine
 *  (oder eine unbekannte) genannt ist. Preis UND Auftrag laufen hierdurch,
 *  damit niemand 480p bezahlt und 720p bestellt bekommt. */
export function filmQuality(modelId, quality) {
  const m = videoModel(modelId);
  const q = m.qualities[quality] ? quality : m.preferred;
  return { id: q, ...m.qualities[q] };
}


/* Der komplette fal-Auftrag für einen Film, als reine Funktion — damit die
 * Form je Modell TESTBAR ist, ohne das Netz zu berühren.
 *
 * Warum das nicht im Server inline steht: Bis 17.08.2026 war die
 * 5–15-Sekunden-Klemme von minimax hart in falSubmitVideo verdrahtet.
 * Solange nur ein Modell existierte, fiel das nicht auf; mit dem zweiten
 * hätte sie Premiums 30 Sekunden stillschweigend auf 15 gedrückt — bezahlt
 * worden wären die 30. Modellwissen gehört in die Modelltabelle, nicht in
 * die Versandfunktion.
 *
 * `duration` wird hier je Modell geklemmt. Der Server ruft DIESE Funktion —
 * der Client kann lügen, die Tabelle nicht. */
export function videoSubmitBody(modelId, { imageUrl, imageUrls, prompt, seconds, quality, aspect }) {
  const m = videoModel(modelId);
  const body = {
    prompt,
    duration: clampSeconds(m.id, seconds),
    resolution: filmQuality(m.id, quality).resolution,
  };
  // Die neuen H3-Endpunkte VERLANGEN prompt_expansion_mode (Pflichtfeld);
  // "disabled", sonst überschreibt fremde Umformulierung unseren Regisseur.
  // Das alte enable_prompt_expansion kennen sie nicht mehr.
  if (m.expansionMode) body.prompt_expansion_mode = m.expansionMode;

  /* Referenzmodelle nehmen ein ARRAY, Ein-Bild-Modelle ein FELD (image_url) —
   * und der Array-NAME ist selbst Modellwissen: Seedance will image_urls
   * und verzeiht keinen anderen. Der nano-banana-Vorfall vom 07.08.
   * (image_urls still ignoriert, Renders ohne Gesichter tagelang bezahlt)
   * ist genau die Fehlerklasse, die hier lauert. Deshalb entscheidet die
   * Tabelle, nie der Aufrufer. Standard (Turbo-i2v) ist seit 23.09. ein
   * Ein-Bild-Modell: es bekommt NUR das Keyframe — die Besetzungs-Fotos
   * stecken da längst drin (Bildmodell), eine mitgeschickte Liste wird
   * bewusst ignoriert statt an ein Feld geschickt, das es nicht gibt. */
  if (m.maxRefs) {
    const urls = (imageUrls?.length ? imageUrls : [imageUrl]).filter(Boolean).slice(0, m.maxRefs);
    body[m.refsField || "image_urls"] = urls;
  } else {
    body.image_url = imageUrl;
  }

  // Nur senden, wo der Parameter existiert: ein unbekanntes Feld kann bei
  // einem strengen Validator den ganzen Auftrag kosten. H3 Max Turbo
  // liefert seinen Ton OHNE Parameter; nur Seedance braucht generate_audio.
  if (m.audioParam) body.generate_audio = true;
  /* Das Format (23.09.: Wizard-Wahl reist bis hierher durch): nur setzen,
   * wo das Schema es kennt — Turbo-i2v hat KEIN aspect_ratio, dort führt
   * das Keyframe (der Wunsch wirkt über dessen Erzeugung, server.js).
   * Ein Wunsch außerhalb der gemessenen `aspects`-Liste fällt auf die
   * Vorgabe zurück, nie durchgereicht. */
  if (m.aspect) body.aspect_ratio = m.aspects?.includes(aspect) ? aspect : m.aspect;
  return { slug: m.slug, body };
}

/** What a film costs: the animation, plus a keyframe — unless the film
 *  animates an image the dream already has, which costs nothing new. */
export function priceForFilm(modelId, seconds, { ownKeyframe = false, quality } = {}) {
  const secs = clampSeconds(modelId, seconds);
  return secs * filmQuality(modelId, quality).creditsPerSecond + (ownKeyframe ? 0 : PRICES.keyframe);
}

/* Wie viele Schnitte eine Filmlänge bei DIESEM Modell trägt — die Zahl, an
 * der der Schnitt (cut.js) entscheidet, wie viele Szenen es in den Film
 * schaffen.
 *
 * Zwei Felder je Modell statt einer Tabelle mit Sonderfällen:
 *   shotEvery — Sekunden, die ein Shot mindestens für sich braucht
 *   maxShots  — was das Modell noch sauber durchhält
 *
 * Beide sind belegt, nicht geschätzt (Recherche 03.09.2026):
 *   Seedance 2.5 versteht ganzzahlige Zeitstempel und will eine lückenlose
 *     Timeline; das offizielle Beispiel sind 9 Shots auf 30 Sekunden.
 *     ByteDance warnt in der eigenen Doku vor zu viel Plot je Intervall —
 *     „excessive cuts or omit parts of the plot". Ergibt 5s→1, 15s→3, 30s→7.
 *   MiniMax H3 schneidet nur, wenn ein Schnitt NEUE INFORMATION bringt;
 *     ändert sich nur Abstand oder Winkel, ist es eine Kamerafahrt. 2–3
 *     Shots je Clip. Ergibt 5s→1, 10s→2, 15s→3.
 *
 * ⚠ Ein Shot ist nie unter 3 Sekunden lesbar (cut.js, MIN_SHOT_SECONDS) —
 * `shotEvery` liegt deshalb bei beiden darüber, nicht darunter. */
/* ── Das Tempo (Antons Ansage 03.09.2026) ────────────────────────────────
 * „Ich finde, dass die einzelnen Shots doch schon zu lang sind … dass die
 * jeweiligen Cuts maximal zwei Sekunden dauern. Somit könnten wir sieben
 * Shots reinbringen. Ich will eher so ein schnelles Ding haben." Und als
 * Gegenstück: „eine zweite Version, sodass überhaupt keine Cuts verwendet
 * werden, sondern alles ineinander morpht."
 *
 * Drei Tempi, ein Schalter:
 *   calm  — die geprüfte Vorgabe: ≥3 s je Shot, Budget aus der Modelltabelle
 *   fast  — 2 s je Shot, viele Szenen; das „schnelle Ding"
 *   flow  — GAR KEIN Schnitt: eine Einstellung, in der sich alles ineinander
 *           verwandelt. Die Szenen bleiben alle, sie werden nur nicht
 *           geschnitten, sondern übergeblendet
 *
 * ⚠ `fast` steht ausdrücklich GEGEN die Herstellerempfehlung: ByteDance
 * nennt für Seedance 2.5 mindestens drei Sekunden je Shot und warnt vor
 * „excessive cuts or omit parts of the plot"; H3 schneidet von sich aus nur
 * bei neuer Information. Zwei Sekunden je Block können also zu Brei führen.
 * Das ist bekannt und Antons Entscheidung — er hat den ruhigen Schnitt
 * gesehen und will das schnellere Ding. `minShot` ist der Regler, an dem
 * sich das zurückdrehen lässt, wenn das Ergebnis es zeigt.
 *
 * `maxShots` ist bei `fast` bewusst nicht am Modelllimit orientiert,
 * sondern an der Dauer: sieben Shots auf fünfzehn Sekunden sind genau das,
 * was Anton beschrieben hat. */
/* ── Zwei Tempi statt drei (Antons Ansage 12.09.2026) ──────────────────
 * „Eigentlich gibt es nur diesen Unterschied: mit Schnitten oder fliessend.
 * Nichtsdestotrotz will ich immer den vollen Traum im Video haben, selbst
 * wenn das super schnell ablaeuft." Also: `calm` heisst jetzt „mit
 * Schnitten" und nimmt ALLE Szenen; wie schnell geschnitten wird, folgt
 * allein aus Sekunden geteilt durch Szenen (shotPlan verteilt nach
 * Gewicht, die Untergrenze weicht, wenn die Zeit nicht reicht). `fast`
 * bleibt als Alias fuer alte Eintraege, wird aber nicht mehr angeboten.
 * Die Modell-Empfehlungen (shotEvery/maxShots) sagen nur noch, welche
 * LAENGE zum Traum passt (recommendation) — sie sortieren nichts mehr aus. */
export const PACES = {
  calm: { id: "calm", minShot: 1, cuts: true },
  fast: { id: "fast", minShot: 1, cuts: true },
  flow: { id: "flow", minShot: 0, cuts: false },
};
export const PACE_IDS = ["calm", "flow"];
export const DEFAULT_PACE = "calm";

export function filmPace(pace) {
  return PACES[pace] || PACES[DEFAULT_PACE];
}

/** Wie viele SCHNITTE eine Filmlänge trägt — bei diesem Modell und Tempo.
 *  `flow` liefert immer 1: eine Einstellung, kein Schnitt. */
export function shotBudget(modelId, seconds, pace) {
  const m = videoModel(modelId);
  const p = filmPace(pace);
  const secs = clampSeconds(m.id, seconds);
  if (!p.cuts) return 1;
  const je = p.shotEvery || m.shotEvery || 5;
  const max = p.maxShots || m.maxShots || 3;
  return Math.max(1, Math.min(Math.floor(secs / je), max));
}

/** Wie viele SZENEN in den Film kommen. Bei geschnittenen Tempi dasselbe
 *  wie die Schnittzahl — jede Szene ist ein Shot.
 *
 *  ⚠ Bei `flow` NICHT: Dort gibt es einen einzigen Shot, aber mehrere
 *  Szenen darin, die ineinander übergehen. Wer hier `shotBudget` benutzte,
 *  bekäme eine einzige Szene und damit genau nicht das, was Anton meint —
 *  „dass die ganze Story von einem Ding ins andere morpht und somit in 15
 *  Sekunden alles drin ist". Eine Station braucht rund zweieinhalb Sekunden,
 *  um als Bild anzukommen und sich dann zu verwandeln. */
export function beatBudget(modelId, seconds, pace) {
  const p = filmPace(pace);
  /* Seit 12.09.2026 auch beim Schnitt ALLE Szenen (Antons Ansage): Die
     Laenge bestimmt, wie schnell geschnitten wird, nicht, was wegfaellt.
     shotBudget bleibt fuer die Laengen-Empfehlung erhalten. */
  if (p.cuts) return Number.POSITIVE_INFINITY;
  /* ⚠ Beim Fluss ALLE Szenen (Antons Befund 03.09., zweite Runde): Die
     erste Fassung rechnete floor(Sekunden / 2,5) und nahm bei 15 Sekunden
     sechs von acht — und das Storyboard darunter war das Einzige, was
     diese stille Auswahl sichtbar machte. Ein Preset, das „alles in einem
     Fluss" verspricht, darf nicht aussortieren. Wird die Zeit je Station
     knapp, sagt es der Wizard (flowStations); er wählt nicht heimlich. */
  return Number.POSITIVE_INFINITY;
}

/** Wie viele Sekunden je Station der Fluss hat, wenn alle Szenen hinein
 *  sollen — die Zahl, mit der der Wizard vor zu viel Tempo warnt. Unter
 *  etwa anderthalb Sekunden ist eine Station keine mehr, sondern nur noch
 *  Bewegung. */
export const FLOW_MIN_STATION = 1.5;
export function flowStationSeconds(modelId, seconds, stations) {
  const n = Math.max(1, Number(stations) || 1);
  return clampSeconds(modelId, seconds) / n;
}

/** Keep a length inside what the model actually accepts — fal rejects the
 *  rest with a validation error, and finding that out costs a round trip. */
export function clampSeconds(modelId, seconds) {
  const m = videoModel(modelId);
  const n = Math.round((Number(seconds) || m.preset) / m.step) * m.step;
  return Math.min(Math.max(n, m.min), m.max);
}
