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
export const VIDEO_MODELS = [
  {
    /* „Lebendig" — H3-R2V @768P kostet $0,06/s, WENIGER als das alte
     * image-to-video ($0,08/s), und die ersten 5 Referenzbilder sind gratis.
     * Verkaufspreis bleibt 1 Cr/s (ceil), die Marge steigt um 25 % und die
     * Besetzung ist ab jetzt in jeder Stufe im Film sie selbst.
     * maxRefs bleibt bei 5 — ab dem 6. Bild berechnet fal $0,08/Referenz,
     * und eine Stufe, deren Einkaufspreis von der Besetzungsgröße abhängt,
     * kann kein ehrlicher Festpreis mehr sein.
     * ⚠ resolution "768P" MUSS gesetzt bleiben: die Schema-Vorgabe ist "2K"
     * und kostet $0,13/s (§10b). */
    id: "standard",
    slug: "minimax/h3/reference-to-video",
    usdPerSecond: 0.06,           // fal: minimax/h3/reference-to-video @768P
    creditsPerSecond: 3,          // 0.06 ÷ 0.0283 → ceil = 3   (siehe Kopf)
    min: 5, max: 15, step: 1, preset: 6,
    resolution: "768P",
    audio: false,                 // liefert von sich aus eine AAC-Spur; einen
                                  // generate_audio-Parameter kennt es nicht,
                                  // also darf er auch nicht gesendet werden
    maxRefs: 5,                   // die gratis-Grenze, siehe oben
    refsField: "reference_image_urls",
    refStyle: "plain",            // „Image 1" — bezahlt bewiesen 19.08. (§10c)
    aspect: "9:16",
    noExpand: true,
    promptMax: 7000,              // offizielle H3-API-Grenze
  },
  {
    /* „Regie" — die Seedance-Qualitätsstufe mit Director-Brief. Machbarkeit
     * am 17.08. real bewiesen (T1/T4: data-URIs, @Image-Zuordnung, Identität
     * hält über Ortswechsel); Fast vs. Normal hat T2 entschieden. */
    id: "director",
    slug: "bytedance/seedance-2.0/fast/reference-to-video",
    usdPerSecond: 0.2419,         // fal: bytedance/seedance-2.0/fast/r2v
    creditsPerSecond: 9,          // 0.2419 ÷ 0.0283 → ceil = 9  (siehe Kopf)
    min: 5, max: 15, step: 1, preset: 10,
    resolution: "720p",
    audio: true,
    maxRefs: 9,                   // image_urls statt image_url — bis zu 9
    refsField: "image_urls",
    refStyle: "at",               // @Image1 — bezahlt bewiesen 17.08. (T1/T4)
    /* KEIN aspect: das 2.0-Schema ist der eine ungemessene Punkt, und T4
     * lief ohne den Parameter sauber 9:16 (adaptiv nach dem Startbild).
     * Nichts senden, was der Validator nicht bestätigt hat. */
    promptMax: 5000,              // modellseitige Seedance-2.0-Grenze
  },
  {
    /* „Kino" — 2.5-R2V: 30 Sekunden MIT echten Gesichtern, gleicher
     * Sekundenpreis wie das alte Ein-Bild-2.5 ($0,473/s, §10b) — Referenzen
     * kosten dort nichts extra. Damit ist T5 (Verkettung) endgültig tot. */
    id: "premium",
    slug: "bytedance/seedance-2.5/reference-to-video",
    usdPerSecond: 0.473,          // fal: bytedance/seedance-2.5/r2v
    creditsPerSecond: 17,         // 0.473 ÷ 0.0283 → ceil = 17  (siehe Kopf)
    min: 5, max: 30, step: 5, preset: 15,
    resolution: "720p",
    audio: true,                  // nativer Ton über generate_audio
    maxRefs: 9,                   // Schema erlaubt mehr; 9 hält die Brief-Form
                                  // aller Stufen gleich (Keyframe + 8 Plätze)
    refsField: "image_urls",
    refStyle: "bracket",          // [Image1] — bezahlt bewiesen 19.08. (§10c)
    aspect: "9:16",
    promptMax: 10000,             // Runware-API-Doku (19.08.2026); fal ungemessen
  },
];
/* Reihenfolge = UI-Reihenfolge = aufsteigender Preis. Eintrag [0] muss
 * "standard" bleiben: videoModel() fällt bei Unbekanntem dorthin zurück,
 * und der falsche BILLIGE Film ist der harmlosere Fehler. */

export function videoModel(id) {
  return VIDEO_MODELS.find((m) => m.id === id) || VIDEO_MODELS[0];
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
export function videoSubmitBody(modelId, { imageUrl, imageUrls, prompt, seconds }) {
  const m = videoModel(modelId);
  const body = {
    prompt,
    duration: clampSeconds(m.id, seconds),
    resolution: m.resolution,
  };

  /* Referenzmodelle nehmen ein ARRAY, Ein-Bild-Modelle ein FELD (image_url) —
   * und der Array-NAME ist selbst Modellwissen: H3-R2V will
   * reference_image_urls, Seedance will image_urls, und keins von beiden
   * verzeiht das jeweils andere. Der nano-banana-Vorfall vom 07.08.
   * (image_urls still ignoriert, Renders ohne Gesichter tagelang bezahlt)
   * ist genau die Fehlerklasse, die hier lauert. Deshalb entscheidet die
   * Tabelle, nie der Aufrufer. */
  if (m.maxRefs) {
    const urls = (imageUrls?.length ? imageUrls : [imageUrl]).filter(Boolean).slice(0, m.maxRefs);
    body[m.refsField || "image_urls"] = urls;
  } else {
    body.image_url = imageUrl;
  }

  // Nur senden, wo der Parameter existiert: ein unbekanntes Feld kann bei
  // einem strengen Validator den ganzen Auftrag kosten.
  if (m.audio) body.generate_audio = true;
  // R2V hat kein Startbild als Formatgeber; nur setzen, wo das Schema den
  // Wert bestätigt (H3 stünde sonst auf "adaptive").
  if (m.aspect) body.aspect_ratio = m.aspect;
  // H3 formuliert Prompts standardmäßig um — für Regie-Prompts ausdrücklich
  // aus, sonst überschreibt fremde Umformulierung unseren Regisseur (§10b).
  if (m.noExpand) body.enable_prompt_expansion = false;
  return { slug: m.slug, body };
}

/** What a film costs: the animation, plus a keyframe — unless the film
 *  animates an image the dream already has, which costs nothing new. */
export function priceForFilm(modelId, seconds, { ownKeyframe = false } = {}) {
  const m = videoModel(modelId);
  const secs = clampSeconds(modelId, seconds);
  return secs * m.creditsPerSecond + (ownKeyframe ? 0 : PRICES.keyframe);
}

/** Keep a length inside what the model actually accepts — fal rejects the
 *  rest with a validation error, and finding that out costs a round trip. */
export function clampSeconds(modelId, seconds) {
  const m = videoModel(modelId);
  const n = Math.round((Number(seconds) || m.preset) / m.step) * m.step;
  return Math.min(Math.max(n, m.min), m.max);
}
