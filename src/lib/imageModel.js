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
export function imageSubmitBody(id, { prompt, imageUrls = [], aspectRatio = "9:16" }) {
  const m = imageModel(id);
  const alle = imageUrls.filter(Boolean);
  const refs = m.maxRefs ? alle.slice(0, m.maxRefs) : alle;
  const input = { prompt };

  if (m.sizes) input.image_size = m.sizes[aspectRatio] || m.sizes["9:16"];
  else input.aspect_ratio = aspectRatio;

  if (refs.length) input.image_urls = refs;
  return { model: imageEndpoint(m.id, refs.length > 0), input };
}
