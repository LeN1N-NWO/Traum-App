import { describe, test, expect } from "bun:test";
import {
  IMAGE_MODELS, DEFAULT_IMAGE_MODEL, FALLBACK_IMAGE_MODEL, imageModel, imageEndpoint,
  imageSubmitBody, imagePrice, supportsAspect,
} from "./imageModel.js";
import { priceForImages } from "./pricing.js";

describe("imageModel", () => {
  test("faellt bei unbekanntem Namen auf die Vorgabe zurueck, nicht auf undefined", () => {
    expect(imageModel("gibt-es-nicht").id).toBe(DEFAULT_IMAGE_MODEL);
    expect(imageModel(undefined).id).toBe(DEFAULT_IMAGE_MODEL);
  });

  /* Der teure Fehler vom 07.08.: Referenzen an den Text-zu-Bild-Endpunkt,
     der sie ohne Fehlermeldung wegwirft. Bezahlt, aber ohne Gesichter. */
  test("waehlt mit Referenzen IMMER den Edit-Endpunkt", () => {
    for (const id of Object.keys(IMAGE_MODELS)) {
      expect(imageEndpoint(id, true)).toBe(IMAGE_MODELS[id].edit);
      expect(imageEndpoint(id, false)).toBe(IMAGE_MODELS[id].t2i);
    }
  });

  test("kein Modell benutzt den nackten Slug als Endpunkt", () => {
    // Bei Seedream ist er ein 404 — genau deshalb gibt es diese Tabelle.
    for (const m of Object.values(IMAGE_MODELS)) {
      expect(m.t2i).toBeTruthy();
      expect(m.edit).toBeTruthy();
      expect(m.edit).not.toBe(m.t2i);
    }
  });
});

describe("imageSubmitBody", () => {
  test("spricht Seedream in Pixeln und Nano Banana in Verhaeltnissen", () => {
    const see = imageSubmitBody("seedream-5-lite", { prompt: "x", aspectRatio: "9:16" });
    expect(see.input.image_size).toEqual({ width: 1440, height: 2560 });
    expect(see.input.aspect_ratio).toBeUndefined();

    const nb = imageSubmitBody("nano-banana-2-lite", { prompt: "x", aspectRatio: "9:16" });
    expect(nb.input.aspect_ratio).toBe("9:16");
    expect(nb.input.image_size).toBeUndefined();
  });

  /* Seedreams eigene Untergrenze: 2560x1440 Gesamtpixel. Wer darunter
     bestellt, bekommt still hochskaliert — und vergleicht spaeter zwei
     Aufloesungen statt zwei Modelle. */
  test("bleibt bei Seedream in jedem Format ueber der Pixel-Untergrenze", () => {
    for (const ar of ["9:16", "16:9", "1:1"]) {
      const { input } = imageSubmitBody("seedream-5-lite", { prompt: "x", aspectRatio: ar });
      expect(input.image_size.width * input.image_size.height).toBeGreaterThanOrEqual(2560 * 1440);
    }
  });

  test("faellt bei unbekanntem Format auf Hochkant zurueck statt undefined zu senden", () => {
    const { input } = imageSubmitBody("seedream-5-lite", { prompt: "x", aspectRatio: "3:2" });
    expect(input.image_size).toEqual({ width: 1440, height: 2560 });
  });

  test("setzt image_urls nur, wenn es welche gibt", () => {
    const ohne = imageSubmitBody("seedream-5-lite", { prompt: "x" });
    expect("image_urls" in ohne.input).toBe(false);
    expect(ohne.model).toBe(IMAGE_MODELS["seedream-5-lite"].t2i);

    const mit = imageSubmitBody("seedream-5-lite", { prompt: "x", imageUrls: ["a"] });
    expect(mit.input.image_urls).toEqual(["a"]);
    expect(mit.model).toBe(IMAGE_MODELS["seedream-5-lite"].edit);
  });

  test("wirft leere Eintraege raus, statt sie als Referenz zu senden", () => {
    const { input, model } = imageSubmitBody("seedream-5-lite", {
      prompt: "x", imageUrls: [null, "", undefined],
    });
    expect("image_urls" in input).toBe(false);
    expect(model).toBe(IMAGE_MODELS["seedream-5-lite"].t2i);
  });

  /* Geklemmt wird von hinten: der Weltanker steht als letztes Bild und ist
     der richtige Verlust. Ein fehlendes Besetzungsbild wuerde die Zaehlung
     verschieben, auf die sich die Klauseln im Prompt beziehen. */
  test("klemmt bei Seedream auf zehn und opfert dabei das letzte Bild", () => {
    const viele = Array.from({ length: 14 }, (_, i) => `bild-${i}`);
    const { input } = imageSubmitBody("seedream-5-lite", { prompt: "x", imageUrls: viele });
    expect(input.image_urls).toHaveLength(10);
    expect(input.image_urls[0]).toBe("bild-0");
    expect(input.image_urls.at(-1)).toBe("bild-9");
  });

  test("klemmt NICHT, wo fal keine Grenze ausweist", () => {
    const viele = Array.from({ length: 14 }, (_, i) => `bild-${i}`);
    const { input } = imageSubmitBody("nano-banana-2-lite", { prompt: "x", imageUrls: viele });
    expect(input.image_urls).toHaveLength(14);
  });
});

describe("Aufloesung und Preis (Nano Banana Pro)", () => {
  test("4K wird gesendet — und kostet das Doppelte", () => {
    const { input } = imageSubmitBody("nano-banana-pro", { prompt: "x", resolution: "4K" });
    expect(input.resolution).toBe("4K");
    expect(imagePrice("nano-banana-pro", "4K")).toBe(0.30);
    expect(imagePrice("nano-banana-pro", "1K")).toBe(0.15);
  });

  /* Ein unbekannter Wert waere hier besonders teuer: fal faellt auf 1K
     zurueck, man bezahlt weniger als erwartet und misst das falsche Bild. */
  test("ein unbekannter Aufloesungswert wird gar nicht erst gesendet", () => {
    const { input } = imageSubmitBody("nano-banana-pro", { prompt: "x", resolution: "8K" });
    expect("resolution" in input).toBe(false);
  });

  /* Aus der TABELLE abgeleitet, nicht aufgezaehlt. Die erste Fassung listete
     die Modelle von Hand — und wurde falsch, sobald Nano Banana 2 Stufen
     bekam: der Test behauptete weiter, es habe keine. Ein Test, der eine
     Aufzaehlung pflegt, prueft irgendwann die Aufzaehlung. */
  test("wer keine Aufloesungsstufen hat, bekommt das Feld nie", () => {
    const ohne = Object.values(IMAGE_MODELS).filter((m) => !m.resolutions);
    expect(ohne.length).toBeGreaterThan(0);
    for (const m of ohne) {
      const { input } = imageSubmitBody(m.id, { prompt: "x", resolution: "4K" });
      expect("resolution" in input).toBe(false);
      // …und ohne Stufen faellt der Preis auf den flachen Wert zurueck.
      expect(imagePrice(m.id, "4K")).toBe(m.usd);
    }
  });

  /* ⚠ Die beiden Nano-Bananas rechnen NICHT gleich. Bei Nano Banana 2 kostet
     2K das 1,5-Fache, bei Pro steht fuer 2K kein Aufschlag. Wer das eine vom
     anderen abschreibt, liegt um 50 % daneben. */
  test("jede Stufe hat einen Preis, und die Modelle teilen ihn sich nicht", () => {
    for (const m of Object.values(IMAGE_MODELS).filter((x) => x.resolutions)) {
      for (const stufe of m.resolutions) {
        expect(typeof imagePrice(m.id, stufe)).toBe("number");
      }
    }
    expect(imagePrice("nano-banana-2", "2K")).toBe(0.12);
    expect(imagePrice("nano-banana-pro", "2K")).toBe(0.15);
  });
});

describe("Rasterformate", () => {
  test("freie Pixelmasze schlagen das App-Format — das braucht der Behaelter", () => {
    const { input } = imageSubmitBody("seedream-5-lite", {
      prompt: "x", aspectRatio: "9:16", size: { width: 3456, height: 4096 },
    });
    expect(input.image_size).toEqual({ width: 3456, height: 4096 });
  });

  test("ein Modell mit fester Liste bekommt KEIN Pixelmasz untergeschoben", () => {
    const { input } = imageSubmitBody("nano-banana-pro", {
      prompt: "x", aspectRatio: "9:16", size: { width: 3456, height: 4096 },
    });
    expect("image_size" in input).toBe(false);
    expect(input.aspect_ratio).toBe("9:16");
  });

  /* ⚠ Der Kern des Rasters: 3x2 ergibt 27:32, und das kennt Nano Banana
     nicht. fal wuerde es still runden — bezahlt, und der Schnitt suchte
     die Kacheln danach an der falschen Stelle. */
  test("27:32 kann nur Seedream — Nano Banana Pro muss hier nein sagen", () => {
    expect(supportsAspect("seedream-5-lite", "27:32")).toBe(true);
    expect(supportsAspect("nano-banana-pro", "27:32")).toBe(false);
    expect(supportsAspect("nano-banana-pro", "9:16")).toBe(true);
  });
});

/* ── Die Umstellung vom 24.08.2026 ────────────────────────────────────────
   Drei Zusagen, an denen echtes Geld hängt. */

import { pickImageModel, retiredReason, lieferbareModelle, imageStage } from "./imageModel.js";
import { appGrid, gridRuns, GRID_SLOTS } from "./gridLayout.js";
import { readFileSync } from "node:fs";

test("Seedream ist ausser Dienst und wird nicht mehr gewaehlt", () => {
  const p = pickImageModel("seedream-5-lite");
  expect(p.id).toBe(DEFAULT_IMAGE_MODEL);
  expect(p.reason).toBe("retired");
  expect(retiredReason("seedream-5-lite")).toBeTruthy();
  expect(lieferbareModelle()).not.toContain("seedream-5-lite");
});

/* ⚠ „Unbekannt" und „ausser Dienst" duerfen nicht dasselbe melden: Beim
   einen sucht man den Tippfehler, beim anderen den Grund. */
test("unbekannt und stillgelegt sind zwei verschiedene Nachrichten", () => {
  expect(pickImageModel("gibtsnicht").reason).toBe("unknown");
  expect(pickImageModel("seedream-5-lite").reason).toBe("retired");
  expect(pickImageModel("").reason).toBe("ok");
  expect(pickImageModel("gpt-image-2").id).toBe("gpt-image-2");
});

/* ⚠ Die teuerste Zeile der App. fals Vorgabe bei GPT Image 2 ist „high":
   ohne Stufe zahlt ein Rasterbild $0,413 statt $0,113 — das
   Dreieinhalbfache, und zwar lautlos. */
test("die Stufe steht am Modell und ist medium", () => {
  expect(imageStage("gpt-image-2")).toBe("medium");
  const { input } = imageSubmitBody("gpt-image-2", {
    prompt: "x", quality: imageStage("gpt-image-2"), imageUrls: ["a"],
  });
  expect(input.quality).toBe("medium");
});

/* ⚠ Ohne ausdrueckliches Mass nimmt GPT seinen Preset-NAMEN, und
   `portrait_16_9` ist 576×1024. Ein 2×2 daraus haette Kacheln von
   288×512 — bezahlt und unbrauchbar. */
test("das Raster schickt Pixelmasse, keinen Preset-Namen", () => {
  const g = appGrid("gpt-image-2");
  expect(g.size).toEqual({ width: 2160, height: 3840 });
  expect(g.tile).toEqual({ width: 1080, height: 1920 });
  const { input } = imageSubmitBody("gpt-image-2", { prompt: "x", size: g.size, imageUrls: ["a"] });
  expect(input.image_size).toEqual({ width: 2160, height: 3840 });
  expect(typeof input.image_size).not.toBe("string");
});

test("der Rasterpreis ist der gemessene", () => {
  const g = appGrid("gpt-image-2");
  expect(imagePrice("gpt-image-2", "medium", g.size)).toBeCloseTo(0.113, 3);
  // je Szene, und damit unter dem alten Einzelweg
  expect(imagePrice("gpt-image-2", "medium", g.size) / GRID_SLOTS).toBeLessThan(0.035);
});

/* Ein angefangenes Raster ist ein voller, bezahlter Aufruf — daran haengt,
   warum vier und acht die Traumgroessen sind. */
test("vier und acht gehen ohne Verschnitt auf, fuenf nicht", () => {
  expect(gridRuns(4)).toEqual({ runs: 1, slots: 4, spare: 0 });
  expect(gridRuns(8)).toEqual({ runs: 2, slots: 8, spare: 0 });
  expect(gridRuns(5)).toEqual({ runs: 2, slots: 8, spare: 3 });
});

/* ⚠ Verdrahtungstest: Die Tabelle kann die Stufe kennen, so viel sie will —
   wenn der Auftrag sie nicht mitschickt, zahlt fal „high". Genau das war
   bis zum 24.08. der Fall. */
test("JEDER Aufrufer schickt Stufe UND Mass mit", () => {
  const srv = readFileSync(new URL("../../server.js", import.meta.url), "utf8");
  /* ⚠ ALLE Aufrufe pruefen, nicht den ersten. Genau daran ist die
     Umstellung am 24.08. fast gescheitert: Der Warteschlangen-Weg war
     umgestellt, der synchrone nicht, und ein Test, der nur den ersten
     Treffer ansieht, haette gruen gemeldet. */
  /* ⚠ Das erste Argument wird NICHT festgenagelt. Am 24.08. hiess es noch
     `FAL_MODEL_IMAGE`; seit Plan B (Ausweichmodell) heisst es `id`, und der
     Test meldete rot, obwohl die Verdrahtung stimmte. Ein Test, der den
     Variablennamen prueft statt der Sache, wird beim naechsten Umbenennen
     wieder falsch — also greift er jeden Aufruf. */
  const aufrufe = [...srv.matchAll(
    /imageSubmitBody\([A-Za-z_$][\w$]*, \{([\s\S]*?)\}\)/g)].map((m) => m[1]);
  expect(aufrufe.length).toBeGreaterThanOrEqual(2);
  for (const a of aufrufe) {
    expect(a).toMatch(/quality:/);
    /* ⚠ `resolution` ist seit Plan B genauso Pflicht wie `quality`: Bei GPT
       heisst die Stufe `quality` ("medium"), bei Nano Banana `resolution`
       ("4K"). Wer nur `quality` schickt, rendert beim Ausweichmodell still
       in 1K — Kacheln von 384x683, bezahlt und unbrauchbar. Welches Feld
       WIRKLICH rausgeht, entscheidet die Tabelle; hier zaehlt nur, dass der
       Aufrufer beide anbietet. */
    expect(a).toMatch(/resolution:/);
    // `size: …` oder die Kurzschreibweise `size,` — beides zaehlt.
    expect(a).toMatch(/\bsize\s*[:,]/);
  }
});

/* ⚠ Der Riegel vor der offenen Kasse: Der Client darf ein JA/NEIN schicken,
   nie einen Modellnamen. Mit einem freien Feld koennte er sich Nano Banana
   Pro bestellen ($0,30) und bekaeme es zum Preis von Plan B ($0,16). */
test("das Ausweichmodell steht im Server, nicht im Auftrag", () => {
  const srv = readFileSync(new URL("../../server.js", import.meta.url), "utf8");
  // Der einzige Weg zu einem anderen Modell fuehrt ueber modelFor().
  expect(srv).toMatch(/function modelFor\(/);
  expect(srv).toMatch(/body\.fallback === true/);
  // modelFor loest NUR auf: Ausweichmodell oder Hauptmodell. Nichts sonst.
  const koerper = srv.match(/function modelFor\(fallback\) \{([\s\S]*?)\n\}/)?.[1] || "";
  expect(koerper).toMatch(/fallbackModel\(/);
  expect(koerper).toMatch(/FAL_MODEL_IMAGE/);
  // Und nie ein Modellname aus dem Auftragskoerper in einen Bildauftrag.
  expect(srv).not.toMatch(/imageSubmitBody\(body\./);
});

/* ⚠ Dieselbe Gefahr beim FILM, und dort war sie schon vorher richtig
   geloest: `body.model` DARF der Client schicken — aber der Server nimmt es
   nur, wenn es in der Liste steht. Ohne diese Zeile faellt beim naechsten
   Umbau vielleicht die Liste weg und der Client bestellt sich „premium"
   zum Preis von „standard". */
test("die Filmstufe aus dem Auftrag bleibt auf eine Liste beschraenkt", () => {
  const srv = readFileSync(new URL("../../server.js", import.meta.url), "utf8");
  expect(srv).toMatch(/\[[^\]]*"premium"[^\]]*\]\.includes\(body\.model\)/);
});

/* ⚠ Der Verdrahtungstest fuer den Rasterweg (24.08.2026). Beim Bauen kam
   `grid` NICHT bis zum Server durch — zweimal hintereinander, an zwei
   verschiedenen Stellen:
     1. `generate()` in api.js listet die Felder einzeln auf und liess es weg.
     2. Der /api/generate-Zweig in server.js reichte es nicht an
        falSubmitImage weiter, obwohl die Funktion es kennt.
   In beiden Faellen haette es keine Fehlermeldung gegeben: Das Raster waere
   ohne Pixelmass gerendert worden, also mit Kacheln von 288×512 — bezahlt
   und unbrauchbar. Genau die Fehlerklasse, vor der imageModel.js im Kopf
   warnt: „Ein falscher Feldname wirft bei fal keinen Fehler." */
test("das Rasterkennzeichen kommt vom Browser bis zum fal-Auftrag durch", () => {
  const api = readFileSync(new URL("./api.js", import.meta.url), "utf8");
  const srv = readFileSync(new URL("../../server.js", import.meta.url), "utf8");

  // 1. generate() nimmt es an UND schickt es weiter.
  const sig = api.match(/export async function generate\(\{([^}]*)\}/)?.[1] || "";
  expect(sig).toContain("grid");
  /* Toleriert Zeilenumbrüche zwischen Pfad und Rumpf: Seit der Film seine
     eigene, lange Uhr bekommt (03.09.2026), steht der Aufruf mehrzeilig. */
  const body = api.match(/post\(\s*"\/api\/generate",\s*\{([^}]*)\}/)?.[1] || "";
  expect(body).toContain("grid");

  // 2. Der Server liest es und gibt es an den Bildauftrag weiter.
  expect(srv).toMatch(/grid:\s*body\.grid === true/);

  // 3. Und der Bildauftrag setzt daraus wirklich ein Mass.
  expect(srv).toMatch(/grid \? appGrid\(/);
});

/* ── Plan B: Preis und Verdrahtung (24.08.2026) ───────────────────────────
   Der Ausweg kostet mehr, WEIL er uns mehr kostet. Die Zahl ist am
   Jahresabo nachgerechnet — dem engsten Plan der ganzen Liste: Zum gleichen
   Preis laege Plan B dort bei 1,19× statt der angepeilten 1,5×. */
test("Plan B kostet anderthalbmal so viel — und deckt den Mehrpreis", () => {
  const g = appGrid(FALLBACK_IMAGE_MODEL);
  const einkaufB = imagePrice(FALLBACK_IMAGE_MODEL, imageStage(FALLBACK_IMAGE_MODEL), g.size);
  const einkaufA = imagePrice(DEFAULT_IMAGE_MODEL, imageStage(DEFAULT_IMAGE_MODEL),
                              appGrid(DEFAULT_IMAGE_MODEL).size);

  // Der Aufschlag im Verkauf muss den Aufschlag im Einkauf mindestens decken.
  const verkauf = priceForImages(4, true) / priceForImages(4, false);
  expect(verkauf).toBeGreaterThanOrEqual(einkaufB / einkaufA);

  // Und acht Szenen kosten genau das Doppelte von vier — keine Mengenrabatte.
  expect(priceForImages(8, true)).toBe(priceForImages(4, true) * 2);
});

/* ⚠ Ohne Stufe rendert Nano Banana in 1K statt 4K: Kacheln von 384×683
   statt ~766×1367. Bezahlt und unbrauchbar — und ohne Fehlermeldung. */
test("das Ausweichmodell kennt seine Stufe", () => {
  expect(imageStage(FALLBACK_IMAGE_MODEL)).toBeTruthy();
  const { input } = imageSubmitBody(FALLBACK_IMAGE_MODEL, {
    prompt: "x", imageUrls: ["data:a"], aspectRatio: "9:16",
    quality: imageStage(FALLBACK_IMAGE_MODEL), resolution: imageStage(FALLBACK_IMAGE_MODEL),
  });
  expect(input.resolution).toBe("4K");
});
