import { describe, test, expect } from "bun:test";
import {
  IMAGE_MODELS, DEFAULT_IMAGE_MODEL, imageModel, imageEndpoint, imageSubmitBody,
  imagePrice, supportsAspect,
} from "./imageModel.js";

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

  test("Modelle ohne Aufloesungsstufen bekommen das Feld nie", () => {
    for (const id of ["seedream-5-lite", "nano-banana-2-lite", "nano-banana-2"]) {
      const { input } = imageSubmitBody(id, { prompt: "x", resolution: "4K" });
      expect("resolution" in input).toBe(false);
    }
    // …und ohne Stufen faellt der Preis auf den flachen Wert zurueck.
    expect(imagePrice("seedream-5-lite", "4K")).toBe(0.035);
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
