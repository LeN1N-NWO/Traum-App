/* Welches Bildmodell, und wie man mit ihm spricht.
 *
 * Bis zum 23.08.2026 stand das im Server als zwei Konstanten: ein Slug und
 * derselbe Slug mit „/edit" hinten dran. Das trug genau solange, wie alle
 * Kandidaten von Google kamen — Nano Banana heißt `<slug>` für Text-zu-Bild
 * und `<slug>/edit` mit Referenzen, und beide nehmen `aspect_ratio`.
 *
 * Seedream tut beides nicht:
 *   · Der nackte Slug ist KEIN Endpunkt (fal antwortet 404). Text-zu-Bild
 *     heißt `.../text-to-image`, mit Referenzen `.../edit`.
 *   · Es kennt kein `aspect_ratio`, sondern `image_size` — und hat eine
 *     UNTERGRENZE von 2560×1440 Gesamtpixeln. Wer sie nicht selbst setzt,
 *     bekommt sie von fal hochskaliert und weiß hinterher nicht, welche
 *     Auflösung er eigentlich bezahlt hat.
 *
 * Zwei Modelle, zwei Adressformate — also eine Tabelle, wie bei video.js,
 * und der Aufrufer entscheidet nichts mehr selbst. Der nano-banana-Vorfall
 * vom 07.08. (ein still ignoriertes `image_urls`, tagelang Renders ohne
 * Gesichter bezahlt) ist genau die Fehlerklasse, die hier lauert: ein
 * falscher Feldname wirft keinen Fehler, er liefert nur das Falsche.
 *
 * ⚠ `usd` ist der EINKAUFSPREIS je Bild, kein Verkaufspreis. Die Credits
 * hängen NICHT daran (siehe pricing.js: 1 Credit = 1 Bild, per Definition);
 * ein billigeres Modell verbreitert die Marge, es verbilligt nichts für den
 * Kunden. Das war schon beim Wechsel auf Lite am 20.08. so entschieden.
 */

/* Seedream misst in Pixeln, nicht in Verhältnissen. Diese Maße liegen GENAU
 * auf der Untergrenze (1440 × 2560 = 3 686 400 = 2560 × 1440), sind also das
 * kleinste, was das Modell überhaupt ausgibt — jede höhere Zahl wäre eine
 * Entscheidung für mehr Pixel, die niemand getroffen hat, und der Preis ist
 * je Bild derselbe. */
const SEEDREAM_SIZES = {
  "9:16": { width: 1440, height: 2560 },
  "16:9": { width: 2560, height: 1440 },
  "1:1": { width: 1920, height: 1920 },
};

export const IMAGE_MODELS = {
  /* Vorgabe seit 23.08.2026 (Antons Entscheidung nach dem A/B mit derselben
     Kette, denselben Prompts und demselben Referenzbild): billiger UND
     schärfer als Nano Banana Lite — $0,035 statt $0,042 bei 1440×2560 statt
     768×1376. Die Kette hielt, der Photoshop-Effekt blieb weg. */
  "seedream-5-lite": {
    id: "seedream-5-lite",
    label: "Seedream 5 Lite",
    t2i: "fal-ai/bytedance/seedream/v5/lite/text-to-image",
    edit: "fal-ai/bytedance/seedream/v5/lite/edit",
    usd: 0.035,
    maxRefs: 10, // fal-Schema, geprüft 23.08.2026
    sizes: SEEDREAM_SIZES,
    /* Vorsichtsdeckel für die lange Seite. Das fal-Schema erlaubt 4096;
       die Doku des Modells nennt 3072. Wo die Wahrheit liegt, ist am
       23.08. NICHT sauber gemessen worden — die Läufe, aus denen ich es
       ablesen wollte, waren von den Ablehnungen unten verseucht. 3072 ist
       deshalb die konservative Zahl, keine bewiesene Grenze.

       ⚠⚠ WICHTIGER als die Zahl, und der eigentliche Befund des Tages:
       Seedream lehnt Aufträge MIT REFERENZFOTO unregelmäßig ab. Die
       Antwort ist ein `content_policy_violation` auf `body.image` mit
       `reason: "partner_validation_failed"` — und sie kommt bei WÖRTLICH
       identischen Aufträgen mal und mal nicht. Am 23.08. gemessen: mit
       Referenz 4× durch, 8× abgelehnt; ohne Referenz durch; und dieselbe
       Einzelszene, die morgens durch die App lief, wurde nachmittags
       abgelehnt. Es ist also weder die Größe, noch der Rasterprompt, noch
       ein genannter Prominenter (alle drei einzeln ausgeschlossen).

       Was das praktisch heißt: Ein abgelehnter Auftrag kommt bei fal als
       COMPLETED mit leerem `images[]` zurück. jobStatus() macht daraus
       „failed" und der Collector erstattet den Credit — es geht also kein
       Geld verloren. Verloren geht das BILD, und zwar bei genau den
       Träumen, in denen Menschen vorkommen.

       Bevor das jemand als gelöst abhakt: erst eine Messreihe über einen
       Tag, dann entscheiden, ob Seedream die Vorgabe bleibt. */
    maxSide: 3072,
  },
  /* Nur fuer Messungen im Raster (Antons 4K-Test, 23.08.). NICHT die
     Vorgabe: Ein 4K-Bild kostet das Achtfache eines Seedream-Lite-Bildes.
     Slugs am fal-Schema abgeschrieben, nicht geraten — der nackte Slug ist
     hier ausnahmsweise der Text-zu-Bild-Endpunkt, anders als bei Seedream. */
  "nano-banana-pro": {
    id: "nano-banana-pro",
    label: "Nano Banana Pro",
    t2i: "fal-ai/nano-banana-pro",
    edit: "fal-ai/nano-banana-pro/edit",
    usd: 0.15,
    /* ⚠ Der Preis haengt hier an der Aufloesung, nicht am Modell: 4K wird
       laut fal „at double the standard rate" berechnet. Eine flache Zahl
       waere nach dem ersten 4K-Lauf falsch — und zwar um 100 %. */
    usdBy: { "1K": 0.15, "2K": 0.15, "4K": 0.30 },
    resolutions: ["1K", "2K", "4K"],
    aspect: true,
    /* Feste Seitenverhaeltnisse, aus dem fal-Schema. Steht hier, damit
       niemand ein krummes Rasterformat (3x2 = 27:32) hinschickt: fal lehnt
       das nicht ab, es rundet still — und der Schnitt sucht die Kacheln
       danach an der falschen Stelle. */
    aspects: ["21:9", "16:9", "3:2", "4:3", "5:4", "1:1", "4:5", "3:4", "2:3", "9:16"],
  },
  "nano-banana-2-lite": {
    id: "nano-banana-2-lite",
    label: "Nano Banana 2 Lite",
    t2i: "google/nano-banana-2-lite",
    edit: "google/nano-banana-2-lite/edit",
    usd: 0.042,
    aspect: true,
  },
  "nano-banana-2": {
    id: "nano-banana-2",
    label: "Nano Banana 2",
    t2i: "fal-ai/nano-banana-2",
    edit: "fal-ai/nano-banana-2/edit",
    usd: 0.08,
    aspect: true,
  },
};

export const DEFAULT_IMAGE_MODEL = "seedream-5-lite";

export function imageModel(id) {
  return IMAGE_MODELS[id] || IMAGE_MODELS[DEFAULT_IMAGE_MODEL];
}

/** Der Endpunkt für diesen Auftrag.
 *
 *  ⚠ Mit Referenzen MUSS es der Edit-Endpunkt sein. Der Text-zu-Bild-Pfad
 *  nimmt `image_urls` entgegen, ohne zu meckern, und ignoriert sie — genau
 *  so sind am 07.08. tagelang Bilder ohne Ähnlichkeiten entstanden und
 *  bezahlt worden. Deshalb entscheidet das hier die Tabelle, nicht der Ruf. */
export function imageEndpoint(id, hasRefs) {
  const m = imageModel(id);
  return hasRefs ? m.edit : m.t2i;
}

/** Der komplette Auftrag an fal: Endpunkt und Rumpf, aus einer Hand.
 *
 *  `maxRefs` steht NUR dort, wo fal im Schema ein `maxItems` ausweist —
 *  bei Seedream zehn. Nano Banana dokumentiert keine Grenze, also klemmt
 *  hier auch keine: eine geratene Zahl würde stumm Referenzen wegwerfen,
 *  und ein fehlendes Gesicht sieht aus wie ein Modellfehler, nicht wie
 *  unser eigener.
 *
 *  Wo geklemmt wird, fällt das LETZTE Bild zuerst — also der Weltanker der
 *  Kette. Das ist die richtige Reihenfolge: ohne Anker verliert eine Szene
 *  ihre Anschlussstimmung, ohne ein Besetzungsbild verschiebt sich die
 *  ganze Zählung, auf die sich die Klauseln („Reference image 2") beziehen,
 *  und dann trägt der Falsche das falsche Gesicht.
 */
export function imageSubmitBody(id, { prompt, imageUrls = [], aspectRatio = "9:16", size = null, resolution = null }) {
  const m = imageModel(id);
  const alle = imageUrls.filter(Boolean);
  const refs = m.maxRefs ? alle.slice(0, m.maxRefs) : alle;
  const input = { prompt };

  /* `size` ist der Weg fuer das Raster: dort ist der Behaelter kein
     App-Format, sondern eine ausgerechnete Pixelflaeche. Er gilt NUR bei
     Modellen mit freien Pixelmaszen — ein Modell mit fester Liste bekommt
     weiter sein Verhaeltnis, sonst schickten wir ihm ein Feld, das es
     stillschweigend ignoriert. */
  if (m.sizes) input.image_size = size || m.sizes[aspectRatio] || m.sizes["9:16"];
  else input.aspect_ratio = aspectRatio;

  /* Nur senden, wo der Parameter existiert, und nur mit einem Wert, den das
     Modell kennt. Ein unbekannter Wert waere hier besonders teuer: 4K
     kostet doppelt, und wer ihn falsch schreibt, bezahlt einfach 1K. */
  if (m.resolutions && m.resolutions.includes(resolution)) input.resolution = resolution;

  if (refs.length) input.image_urls = refs;
  return { model: imageEndpoint(m.id, refs.length > 0), input };
}

/** Was EIN Bild dieses Modells bei dieser Aufloesung kostet.
 *  Nie abschreiben, immer hier fragen — bei Nano Banana Pro verdoppelt 4K
 *  den Preis, und eine Konstante daneben waere nach einem Tag falsch. */
export function imagePrice(id, resolution = null) {
  const m = imageModel(id);
  return m.usdBy?.[resolution] ?? m.usd;
}

/** Vertraegt dieses Modell dieses Seitenverhaeltnis?
 *
 *  ⚠ Die Frage ist nicht akademisch. fal lehnt ein unbekanntes Verhaeltnis
 *  NICHT ab, es rundet still auf etwas Aehnliches — bezahlt, und der
 *  Schnitt findet die Kacheln danach nicht mehr dort, wo er sie sucht.
 *  Modelle mit freien Pixelmaszen (`sizes`) koennen jedes Verhaeltnis. */
export function supportsAspect(id, ratio) {
  const m = imageModel(id);
  if (m.sizes) return true;
  return m.aspects ? m.aspects.includes(ratio) : ratio === "9:16" || ratio === "16:9";
}
