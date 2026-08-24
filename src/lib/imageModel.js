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
    /* ⚠⚠ AUSSER DIENST seit 24.08.2026 (Antons Entscheidung nach dem
       Modellvergleich): „Seedream fliegt komplett raus, das erfüllt nicht
       unsere Anforderung."

       Der Grund ist nicht der Preis, sondern die Verlässlichkeit: Seedream
       lehnte Aufträge MIT Referenzfoto unregelmäßig ab — am 23.08. gemessen
       4× durch, 8× abgelehnt, als `content_policy_violation` auf
       `body.image` mit `reason: "partner_validation_failed"`, bei WÖRTLICH
       identischen Aufträgen. Geld ging keins verloren (der Collector
       erstattet), aber das Bild fehlte — und zwar ausgerechnet bei den
       Träumen, in denen Menschen vorkommen. Ein Bildmodell, das bei zwei
       Dritteln der Aufträge mit Gesichtern aussteigt, ist für diese App
       kein Bildmodell.

       ⚠ Warum die Zeile trotzdem stehen bleibt, statt gelöscht zu werden:
       Seedream ist das EINZIGE Modell mit freien Pixelmaßen (`sizes`).
       Löschte man den Eintrag, verlöre `imageSubmitBody` seinen einzigen
       Prüfling für diesen Zweig — und der Zweig ist genau das, was ein
       künftiges Pixelmaß-Modell wieder brauchen wird.

       Unwählbar wird es durch `pickImageModel()` — die eine Stelle, an der
       der Server sein Modell aussucht. `imageModel()` bleibt bewusst ein
       reines Nachschlagewerk und gibt den Eintrag weiter heraus; sonst
       baute `imageSubmitBody` heimlich einen Auftrag für ein anderes
       Modell als das genannte. Das ist „raus" im Sinne der Wirkung, ohne
       das Gemessene wegzuwerfen. */
    retired: "unzuverlässig mit Referenzfotos (23.08.2026: 8 von 12 abgelehnt)",
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
    /* fal nennt bei Pro NUR den 4K-Aufschlag („4K outputs will be charged
       at double the standard rate"); für 2K steht dort kein Faktor, also
       gilt der Grundpreis. ⚠ Anders als bei Nano Banana 2, wo 2K
       ausdrücklich das 1,5-Fache kostet — die beiden Modelle rechnen NICHT
       gleich, und wer das eine vom anderen abschreibt, liegt daneben. */
    usdBy: { "1K": 0.15, "2K": 0.15, "4K": 0.30 },
    resolutions: ["1K", "2K", "4K"],
    aspect: true,
    /* Feste Seitenverhaeltnisse, aus dem fal-Schema. Steht hier, damit
       niemand ein krummes Rasterformat (3x2 = 27:32) hinschickt: fal lehnt
       das nicht ab, es rundet still — und der Schnitt sucht die Kacheln
       danach an der falschen Stelle. */
    aspects: ["21:9", "16:9", "3:2", "4:3", "5:4", "1:1", "4:5", "3:4", "2:3", "9:16"],
  },
  /* GPT Image 2 (OpenAI über fal).
   *
   * Es rechnet ANDERS als alles andere hier: nicht ein Preis je Bild und
   * nicht ein Faktor je Auflösung, sondern eine MATRIX aus Qualitätsstufe
   * MAL Auflösung — und obendrein token-basiert, weshalb die Zahlen keine
   * glatten Vielfachen sind.
   *
   * ⚠⚠ ZWEI PREISTABELLEN, und wir zahlen die teurere. fal weist für den
   * Bearbeitungs-Endpunkt (`/edit`) höhere Preise aus als für Text-zu-Bild,
   * ausdrücklich „including one input image" — das Eingabebild wird als
   * Token mitberechnet. Beispiel 1024×768: $0,005 rein aus Text, $0,011 mit
   * einem Bild. Unser Weg ist IMMER `/edit` (wir schicken eine Referenz),
   * also gilt hier die Edit-Tabelle. Wer die Text-zu-Bild-Preise zitiert,
   * rechnet uns systematisch zu billig. Beide geprüft 23.08.2026.
   *
   * ⚠ Die Vorgabe bei fal ist „high" — die TEUERSTE Stufe. Wer die Stufe
   * vergisst, zahlt bei 4K das Siebzehnfache von „low".
   *
   * ⚠ Grenzen: längste Kante 3840 px, Gesamtfläche 655 360 bis 8 294 400 px,
   * Seitenverhältnis bis 3:1, beide Kanten Vielfache von 16. Ein 9:16-Bild
   * an der Obergrenze ist deshalb 2160×3840 — dieselbe Fläche wie 3840×2160
   * und damit dieselbe Preiszeile. */
  "gpt-image-2": {
    id: "gpt-image-2",
    label: "GPT Image 2",
    t2i: "fal-ai/gpt-image-2",
    edit: "fal-ai/gpt-image-2/edit",
    usd: 0.178,                       // 9:16 in „high", unser Normalfall
    qualities: ["low", "medium", "high"],
    /* Die Stufe, die wir kaufen (Antons Entscheidung 24.08. nach dem
       Vergleich). „medium" ist der Punkt, an dem die Gesichter halten und
       der Preis noch unter dem alten Weg liegt; „high" kostet das
       Dreieinhalbfache für einen Unterschied, den auf einem Telefon
       niemand sieht. */
    stufe: "medium",
    maxRefs: 16,
    maxPixels: 8294400,
    maxSide: 3840,
    aspect: true,
    /* Preis je Bild am EDIT-Endpunkt, nach Fläche und Stufe. Der Schlüssel
       ist die Auflösung als „BxH"; `imagePrice` findet über die Fläche die
       passende Zeile, damit auch ein hochkantes 2160×3840 richtig landet. */
    preise: {
      "1024x768":  { low: 0.011, medium: 0.043, high: 0.151 },
      "1024x1024": { low: 0.015, medium: 0.061, high: 0.219 },
      "1024x1536": { low: 0.018, medium: 0.054, high: 0.178 },
      "1920x1080": { low: 0.017, medium: 0.053, high: 0.158 },
      "2560x1440": { low: 0.019, medium: 0.068, high: 0.234 },
      "3840x2160": { low: 0.024, medium: 0.113, high: 0.413 },
    },
    /* ⚠ Es nimmt keine Verhaeltnisse, sondern NAMEN — und die Presets sind
       KLEIN: `portrait_16_9` ist 576×1024, nicht etwa 1080×1920. Für alles
       Größere muss ein Pixelmaß gesetzt werden. „16:9" waere hier ein
       unbekannter Wert, und fal rundet Unbekanntes still statt abzulehnen. */
    sizeNames: { "16:9": "landscape_16_9", "9:16": "portrait_16_9", "1:1": "square_hd" },
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
    /* Es KANN 4K — anders als seine Lite-Fassung, die den Parameter gar
       nicht kennt und deshalb bei 1K festhängt. fal rechnet in Faktoren
       auf den Grundpreis: „2K and 4K outputs will be charged at 1.5 times
       and 2 times the standard rate, respectively. 0.5K (512px) resolution
       outputs will be charged at 0.75 times." (fal, geprüft 23.08.2026) */
    usdBy: { "0.5K": 0.06, "1K": 0.08, "2K": 0.12, "4K": 0.16 },
    resolutions: ["0.5K", "1K", "2K", "4K"],
    /* ⚠ Ohne diese Zeile gab `imageStage()` hier `null` zurück, und ein
       Auftrag ohne `resolution` rendert bei fal in 1K. Als Ausweichmodell
       (FALLBACK_IMAGE_MODEL) waere Plan B damit stumm auf Kacheln von
       384x683 gefallen — bezahlt und unbrauchbar, genau die Fehlerklasse,
       vor der der Dateikopf warnt. 4K ist die Stufe, in der Nano Banana 2
       am 23.08. gegen GPT angetreten ist; alles darunter waere ein
       anderer Vergleich. */
    stufe: "4K",
    aspect: true,
    aspects: ["21:9", "16:9", "3:2", "4:3", "5:4", "1:1", "4:5", "3:4", "2:3", "9:16",
              "4:1", "1:4", "8:1", "1:8"],
  },
};

/* Seit 24.08.2026: GPT Image 2, Stufe „medium", im 2×2-Raster mit
 * Foto-Anker und Stil `ultrareal`. Das ist keine Meinung, sondern das
 * Ergebnis eines Tages bezahlter Vergleiche (~$3,10, siehe WORKLOG):
 * $0,113 für vier Szenen statt $0,140 einzeln — 7 % billiger bei besseren
 * Gesichtern und echter Fotografie statt Malerei. */
export const DEFAULT_IMAGE_MODEL = "gpt-image-2";

/* ── Der Ausweg, wenn das Hauptmodell den Traum ablehnt (24.08.2026) ──────
 *
 * Antons Vorschlag, nachdem GPT seinen Freddy-Krüger-Traum als
 * `content_policy_violation` zurückgewiesen hatte: „In dieser Fehlermeldung
 * gibt es dem User die Möglichkeit, ein anderes Modell zu verwenden, und
 * zwar sozusagen Plan B."
 *
 * Nano Banana 2 im 4K-Raster, weil es die einzige gemessene Alternative
 * ist, die dieselbe Rasterform liefert: 2×2, vier Szenen aus einem Aufruf,
 * $0,16 statt $0,113 — also 1,42× unser Einkauf.
 *
 * ⚠⚠ Drei Dinge, die man hier NICHT missverstehen darf:
 *
 * 1. Das ist kein Schlupfloch, sondern ein anderes Modell. Nano Banana ist
 *    Google und bei geschützten Figuren ANDERS streng, nicht WENIGER. Es
 *    kann klappen; versprochen wird es nirgends, und die Texte in i18n
 *    formulieren es entsprechend. Eine App, die damit wirbt, Inhaltsfilter
 *    zu umgehen, fliegt beim Anbieter raus — zu Recht.
 * 2. Scheitert auch Plan B, erstattet der Collector wie immer. Deshalb darf
 *    er angeboten werden, ohne jemanden in ein Risiko zu locken.
 * 3. ⚠ Es ist EINE Ausweichadresse, keine freie Modellwahl. Der Client
 *    schickt nur ein Ja/Nein (`fallback: true`), nie einen Modellnamen —
 *    sonst könnte er sich Nano Banana Pro bestellen ($0,30) und wir
 *    berechneten den Preis von Plan B. Deshalb steht die Auflösung hier im
 *    Code und nicht im Auftrag.
 */
export const FALLBACK_IMAGE_MODEL = "nano-banana-2";

/** Das Ausweichmodell — oder `null`, wenn es keines gibt (weil es dasselbe
 *  wäre wie das Hauptmodell oder außer Dienst steht). Ein `null` hier
 *  bedeutet für die Oberfläche schlicht: kein Plan-B-Knopf. */
export function fallbackModel(hauptmodell = DEFAULT_IMAGE_MODEL) {
  const m = IMAGE_MODELS[FALLBACK_IMAGE_MODEL];
  if (!m || m.retired || FALLBACK_IMAGE_MODEL === hauptmodell) return null;
  return FALLBACK_IMAGE_MODEL;
}

/** Welche Qualitätsstufe wir bei diesem Modell kaufen — `null`, wo es
 *  keine gibt.
 *
 *  ⚠ Die Stufe steht hier und NUR hier. fals Vorgabe ist „high", also die
 *  teuerste: Wer sie im Auftrag vergisst, zahlt bei 4K das Siebzehnfache
 *  von „low" und bei unserem Normalfall das Dreifache von „medium". Eine
 *  zweite Stelle, an der eine Stufe steht, wäre eine Stelle, an der sie
 *  irgendwann fehlt. */
export function imageStage(id) {
  const m = imageModel(id);
  return m.stufe || null;
}

/* ⚠ Bewusst ein reines NACHSCHLAGEWERK: Es gibt heraus, was in der Tabelle
   steht, auch ein außer Dienst gestelltes Modell. Der Riegel gehört nicht
   hierher, sondern dorthin, wo das Modell GEWÄHLT wird — `pickImageModel()`
   direkt darunter, und die ist im Server genau einmal aufgerufen.

   Der Unterschied ist nicht akademisch: `imageSubmitBody` baut über diese
   Funktion den Auftragsrumpf. Würde sie bei einem stillgelegten Modell
   etwas anderes zurückgeben, baute der Formatierer heimlich einen Auftrag
   für ein Modell, das der Aufrufer nie genannt hat — dieselbe Klasse
   stiller Verwechslung, vor der der Dateikopf warnt. */
export function imageModel(id) {
  return IMAGE_MODELS[id] || IMAGE_MODELS[DEFAULT_IMAGE_MODEL];
}

/** Warum dieses Modell nicht mehr benutzt wird — oder `null`. */
export function retiredReason(id) {
  return IMAGE_MODELS[id]?.retired || null;
}

/** Welches Modell die App tatsächlich fährt.
 *
 *  EINE Stelle für die Auswahl, damit ein stillgelegtes Modell nirgends
 *  mehr durchrutscht: Wer `FAL_MODEL_IMAGE=seedream-5-lite` in einer alten
 *  `.env` stehen hat, bekommt die Vorgabe — und der Server sagt beim Start,
 *  dass und warum.
 *
 *  @returns {{id: string, reason: "ok"|"retired"|"unknown", asked: string}}
 */
export function pickImageModel(asked) {
  const gewuenscht = String(asked || "").trim();
  if (!gewuenscht) return { id: DEFAULT_IMAGE_MODEL, reason: "ok", asked: gewuenscht };
  const m = IMAGE_MODELS[gewuenscht];
  if (!m) return { id: DEFAULT_IMAGE_MODEL, reason: "unknown", asked: gewuenscht };
  if (m.retired) return { id: DEFAULT_IMAGE_MODEL, reason: "retired", asked: gewuenscht };
  return { id: gewuenscht, reason: "ok", asked: gewuenscht };
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
export function imageSubmitBody(id, { prompt, imageUrls = [], aspectRatio = "9:16", size = null, resolution = null, quality = null }) {
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
  /* ⚠ Ein ausdrueckliches Masz schlaegt den Preset-NAMEN. Die Presets von
     GPT Image 2 sind winzig (`portrait_16_9` = 576×1024); ein Raster
     braucht 2160×3840, und das gibt es nur als Zahlenpaar. Ohne diese
     Zeile bekaeme das Raster Kacheln von 288×512. */
  else if (m.sizeNames) input.image_size = size || m.sizeNames[aspectRatio] || m.sizeNames["9:16"];
  else input.aspect_ratio = aspectRatio;

  /* Nur senden, wo der Parameter existiert, und nur mit einem Wert, den das
     Modell kennt. Ein unbekannter Wert waere hier besonders teuer: 4K
     kostet doppelt, und wer ihn falsch schreibt, bezahlt einfach 1K. */
  if (m.resolutions && m.resolutions.includes(resolution)) input.resolution = resolution;
  /* Dieselbe Regel eine Ebene tiefer: `quality` gibt es nur bei GPT Image 2,
     und ein unbekannter Wert faellt dort auf „high" zurueck — die teuerste
     Stufe. Ein Tippfehler kostet hier das Neunfache. */
  if (m.qualities && m.qualities.includes(quality)) input.quality = quality;

  if (refs.length) input.image_urls = refs;
  return { model: imageEndpoint(m.id, refs.length > 0), input };
}

/** Was EIN Bild dieses Modells bei dieser Aufloesung kostet.
 *  Nie abschreiben, immer hier fragen — bei Nano Banana Pro verdoppelt 4K
 *  den Preis, und eine Konstante daneben waere nach einem Tag falsch. */
export function imagePrice(id, stufe = null, size = null) {
  const m = imageModel(id);
  /* Modelle mit Preismatrix (GPT Image 2): die Zeile wird über die FLÄCHE
     gesucht, nicht über die Maße. Ein hochkantes 2160×3840 kostet dasselbe
     wie ein querformatiges 3840×2160 — es ist dieselbe Zahl Tokens. Ohne
     Maßangabe gilt die Zeile, die unserem Normalfall entspricht. */
  if (m.preise) {
    const zeile = size
      ? naechsteZeile(m.preise, size.width * size.height)
      : m.preise["1024x1536"];
    return zeile?.[stufe] ?? zeile?.high ?? m.usd;
  }
  return m.usdBy?.[stufe] ?? m.usd;
}

function naechsteZeile(preise, flaeche) {
  let beste = null, abstand = Infinity;
  for (const [k, v] of Object.entries(preise)) {
    const [w, h] = k.split("x").map(Number);
    const d = Math.abs(w * h - flaeche);
    if (d < abstand) { abstand = d; beste = v; }
  }
  return beste;
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

/** Die Modelle, die man heute noch wählen kann — für Fehlermeldungen und
 *  Skripte. Ein stillgelegtes gehört nicht in eine Liste, aus der jemand
 *  auswählen soll. */
export function lieferbareModelle() {
  return Object.keys(IMAGE_MODELS).filter((id) => !IMAGE_MODELS[id].retired);
}
