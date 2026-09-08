import { test, expect } from "bun:test";
import { VIDEO_MODELS, QUALITIES, videoModel, filmQuality, clampSeconds, priceForFilm, videoSubmitBody } from "./video.js";
import { CREDIT_COST_USD } from "./plans.js";

/* Diese Datei existiert wegen eines echten Fehlers (Befund 2 des
   Film-Plans, 17.08.2026): Die Modellwahl erreichte den Server nie, und
   dessen harte 5–15-Klemme hätte Premiums 30 Sekunden stillschweigend auf
   15 gedrückt — BEZAHLT worden wären die 30. Die Zeilen hier nageln fest,
   dass Dauer, Preis und Auftragsform aus EINER Tabelle kommen. */

test("premium's 30 seconds survive the clamp; standard still caps at 15", () => {
  expect(clampSeconds("premium", 30)).toBe(30);
  expect(clampSeconds("standard", 30)).toBe(15);
  expect(clampSeconds("standard", 1)).toBe(5);
  expect(clampSeconds("premium", 1)).toBe(5);
});

test("an unknown model id falls back to standard, never to a crash", () => {
  expect(videoModel("director-of-photography").id).toBe("standard");
  expect(videoSubmitBody("nonsense", { imageUrl: "x", prompt: "p", seconds: 30 }).body.duration).toBe(15);
});

/* Was jemand bezahlt und was bestellt wird, muss aus derselben Klemme
   kommen — sonst kehrt der Fehler zurück, nur subtiler. */
test("price and order agree on the seconds, for every model", () => {
  for (const m of VIDEO_MODELS) {
    const wild = 999;
    const ordered = videoSubmitBody(m.id, { imageUrl: "x", prompt: "p", seconds: wild }).body.duration;
    const paid = priceForFilm(m.id, wild, { ownKeyframe: true });
    expect(paid).toBe(ordered * m.creditsPerSecond);
  }
});

test("each model orders at its own address with its own resolution", () => {
  const std = videoSubmitBody("standard", { imageUrl: "img", prompt: "p", seconds: 6 });
  expect(std.slug).toBe("minimax/h3/reference-to-video");
  /* "768P" ist Geld, nicht Geschmack: die Schema-Vorgabe ist "2K" und
     kostet $0,13/s statt $0,06/s (Filmplan §10b). */
  expect(std.body.resolution).toBe("768P");

  const prem = videoSubmitBody("premium", { imageUrl: "img", prompt: "p", seconds: 30 });
  expect(prem.slug).toBe("bytedance/seedance-2.5/reference-to-video");
  /* Seit 31.08. ist 480p die VORGABE bei Seedance — die scharfe Stufe
     kostet dort mehr als das Doppelte (video.js, `preferred`). */
  expect(prem.body.resolution).toBe("480p");
  expect(prem.body.duration).toBe(30);
});

/* Antons Bedingung zum Neuzuschnitt (§10d): jede Stufe ein EIGENES Modell.
   Zwei Stufen auf demselben Endpoint wären eine Preisliste, die zweimal
   dasselbe verkauft. */
test("every tier orders from a different model", () => {
  const slugs = VIDEO_MODELS.map((m) => m.slug);
  expect(new Set(slugs).size).toBe(slugs.length);
});

/* H3 formuliert Prompts standardmäßig selbst um (enable_prompt_expansion
   steht im Schema AN) — bliebe das an, überschriebe ein fremdes Modell die
   Arbeit unseres Regisseurs. Seedance kennt den Parameter nicht, und ein
   unbekanntes Feld kann einen bezahlten Auftrag kosten. */
test("prompt expansion is switched off exactly where it exists", () => {
  expect(videoSubmitBody("standard", { imageUrl: "x", prompt: "p", seconds: 6 }).body.enable_prompt_expansion).toBe(false);
  expect("enable_prompt_expansion" in videoSubmitBody("premium", { imageUrl: "x", prompt: "p", seconds: 6 }).body).toBe(false);
  expect("enable_prompt_expansion" in videoSubmitBody("premium", { imageUrl: "x", prompt: "p", seconds: 6 }).body).toBe(false);
});

/* minimax kennt generate_audio nicht — ein unbekanntes Feld kann bei einem
   strengen Validator den ganzen (bezahlten) Auftrag kosten. Seedance
   braucht es, sonst kommt der Film stumm. */
test("generate_audio goes only where the parameter exists", () => {
  expect("generate_audio" in videoSubmitBody("standard", { imageUrl: "x", prompt: "p", seconds: 6 }).body).toBe(false);
  expect(videoSubmitBody("premium", { imageUrl: "x", prompt: "p", seconds: 15 }).body.generate_audio).toBe(true);
});

/* Referenzmodelle bestellen mit einem ARRAY — und der Array-NAME ist selbst
   Modellwissen: H3 will reference_image_urls, Seedance will image_urls, und
   keins versteht das jeweils andere. Der nano-banana-Vorfall vom 07.08.
   (image_urls still ignoriert, gesichtslose Renders tagelang bezahlt) ist
   die Fehlerklasse, die diese Zeilen fernhalten. */
test("seedance orders with image_urls, keyframe first, capped at 9", () => {
  const got = videoSubmitBody("premium", {
    imageUrl: "keyframe",
    imageUrls: ["keyframe", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j"],
    prompt: "p", seconds: 10,
  });
  expect(got.slug).toBe("bytedance/seedance-2.5/reference-to-video");
  expect("image_url" in got.body).toBe(false);
  expect("reference_image_urls" in got.body).toBe(false);
  expect(got.body.image_urls.length).toBe(9);
  expect(got.body.image_urls[0]).toBe("keyframe");
  expect(got.body.generate_audio).toBe(true);
});

test("h3 orders with reference_image_urls, keyframe first, capped at its 5 free slots", () => {
  const got = videoSubmitBody("standard", {
    imageUrl: "keyframe",
    imageUrls: ["keyframe", "a", "b", "c", "d", "e", "f"],
    prompt: "p", seconds: 6,
  });
  expect("image_url" in got.body).toBe(false);
  expect("image_urls" in got.body).toBe(false);
  /* Die 5 ist die gratis-Grenze: ab dem 6. Bild berechnet fal $0,08 je
     Referenz, und ein Festpreis, der von der Besetzungsgröße abhängt,
     wäre keiner mehr. */
  expect(got.body.reference_image_urls).toEqual(["keyframe", "a", "b", "c", "d"]);
});

test("without an explicit list, reference models still get their keyframe as an array", () => {
  expect(videoSubmitBody("premium", { imageUrl: "kf", prompt: "p", seconds: 8 }).body.image_urls).toEqual(["kf"]);
  expect(videoSubmitBody("standard", { imageUrl: "kf", prompt: "p", seconds: 8 }).body.reference_image_urls).toEqual(["kf"]);
});

/* R2V hat kein Startbild, aus dem sich das Format ableiten ließe — wo das
   Schema 9:16 bestätigt, wird es gesetzt (H3 stünde sonst auf "adaptive").
   Für Seedance 2.0 ist der Parameter ungemessen und wird darum NICHT
   gesendet (T4 lief ohne ihn sauber 9:16). */
/* Bis 31.08. prüfte diese Zeile auch, dass Seedance 2.0 KEIN aspect_ratio
   bekommt (sein Schema war der eine ungemessene Punkt). Das Modell ist
   raus; die beiden verbliebenen haben 9:16 bestätigt und bekommen es. */
test("aspect_ratio goes only where the schema confirmed it", () => {
  expect(videoSubmitBody("standard", { imageUrl: "x", prompt: "p", seconds: 6 }).body.aspect_ratio).toBe("9:16");
  expect(videoSubmitBody("premium", { imageUrl: "x", prompt: "p", seconds: 10 }).body.aspect_ratio).toBe("9:16");
});

/* Seedance 2.5 läuft in Fünferschritten (5–30) — eine Wunschlänge von
   12 s wird auf 10 gerundet, nicht auf 15, und nicht wörtlich bestellt. */
test("premium rounds to its own five-second steps", () => {
  expect(clampSeconds("premium", 12)).toBe(10);
  expect(clampSeconds("premium", 13)).toBe(15);
  expect(clampSeconds("premium", 40)).toBe(30);
});

/* promptMax: das Zeichenlimit des Modells für den Prompt — recherchiert
   19.08.2026, je Modell verschieden (H3: 7000 laut offizieller API,
   Seedance 2.0: 5000 modellseitig, 2.5: Annahme wie 2.0). Es speist zwei
   Stellen zugleich: das Budget im Regisseur-Brief und die Server-Notbremse.
   Fehlt es einem neuen Modell, würde der Regisseur ohne Budget schreiben
   und die Notbremse mit undefined kappen — slice(0, undefined) kappt NICHTS,
   und ein Über-Limit-Prompt geht raus. */
test("every model declares a plausible promptMax", () => {
  for (const m of VIDEO_MODELS) {
    expect(typeof m.promptMax).toBe("number");
    // Unter 2000 wäre enger als das älteste bekannte Modell — vermutlich ein
    // Tippfehler; über 20000 vermutlich auch.
    expect(m.promptMax).toBeGreaterThanOrEqual(2000);
    expect(m.promptMax).toBeLessThanOrEqual(20000);
  }
});

/* ── Die Herleitung des Sekundenpreises (24.08.2026) ──────────────────────
   Bis zum 24.08. stand `creditsPerSecond` als blanke Zahl in der Tabelle,
   hergeleitet aus einem Credit-Einkaufspreis von $0,08 — und der war da
   schon drei Modellwechsel alt. Aufgefallen ist es niemandem, weil eine
   falsche Konstante nichts kaputtmacht: Sie liefert still den falschen
   Preis, und der sieht aus wie ein Preis.

   Diese beiden Tests sind der Ersatz für Aufmerksamkeit. Sie rechnen die
   Tabelle gegen die EINE Quelle nach, aus der auch plans.js liest. */

test("creditsPerSecond ist aus usdPerSecond hergeleitet — aufgerundet, nie ab", () => {
  for (const m of VIDEO_MODELS) {
    expect(typeof m.usdPerSecond).toBe("number");
    const soll = Math.ceil(m.usdPerSecond / CREDIT_COST_USD);
    expect(`${m.id}: ${m.creditsPerSecond}`).toBe(`${m.id}: ${soll}`);
  }
});

/* ⚠ Der Test, der die eigentliche Gefahr abdeckt: Ein Credit muss ÜBERALL
   ungefähr dasselbe kosten. Solange Film je Credit teurer ist als ein Bild,
   verschenkt jede Erhöhung der Credit-Zahlen in Wahrheit FILM — genau der
   Fehler, den Anton am 24.08. gefunden hat. Aufrunden garantiert die eine
   Richtung; diese Zeile garantiert, dass es nicht grotesk in die andere
   kippt (ein Modell, das je Credit ein Vielfaches billiger ist, wäre eine
   versteckte Quersubvention in die Gegenrichtung). */
test("kein Filmmodell ist je Credit teurer als ein Bild", () => {
  for (const m of VIDEO_MODELS) {
    const proCredit = m.usdPerSecond / m.creditsPerSecond;
    expect(`${m.id}: ${(proCredit <= CREDIT_COST_USD).toString()}`).toBe(`${m.id}: true`);
  }
});


/* ── Der Qualitätsschalter (31.08.2026) ────────────────────────────────── */

/* Vier Zahlen, vier Herleitungen: Jede creditsPerSecond muss aus dem
   Einkauf aufgerundet sein — sonst verkauft die Tabelle irgendwann eine
   Sekunde unter Einkaufspreis, ohne dass es jemand sieht. */
test("credits per second are derived from the purchase price, for every quality", () => {
  for (const m of VIDEO_MODELS) {
    for (const q of QUALITIES) {
      const k = filmQuality(m.id, q);
      expect(k.creditsPerSecond).toBe(Math.ceil(k.usdPerSecond / CREDIT_COST_USD));
      expect(k.creditsPerSecond * CREDIT_COST_USD).toBeGreaterThanOrEqual(k.usdPerSecond);
    }
  }
});

/* Preis und Bestellung müssen an DERSELBEN Stufe hängen — 480p bezahlen
   und 720p bestellt bekommen wäre der teuerste stille Fehler der Tabelle. */
test("the quality switch moves resolution and price together", () => {
  const sd = videoSubmitBody("premium", { imageUrl: "x", prompt: "p", seconds: 15, quality: "sd" });
  const hd = videoSubmitBody("premium", { imageUrl: "x", prompt: "p", seconds: 15, quality: "hd" });
  expect(sd.body.resolution).toBe("480p");
  expect(hd.body.resolution).toBe("720p");
  expect(priceForFilm("premium", 15, { ownKeyframe: true, quality: "sd" })).toBe(15 * 8);
  expect(priceForFilm("premium", 15, { ownKeyframe: true, quality: "hd" })).toBe(15 * 17);
  expect(videoSubmitBody("standard", { imageUrl: "x", prompt: "p", seconds: 6, quality: "sd" }).body.resolution).toBe("480P");
});

test("an unknown quality falls back to the model's preferred one, never to a crash", () => {
  expect(filmQuality("premium", "4k").id).toBe("sd");
  expect(filmQuality("standard", undefined).id).toBe("hd");
  expect(videoSubmitBody("standard", { imageUrl: "x", prompt: "p", seconds: 6, quality: "nonsense" }).body.resolution).toBe("768P");
});

/* Die Modellebene ist aus `preferred` abgeleitet — wer die Vorgabe umstellt,
   darf keine zweite Zahl vergessen. */
test("model-level fields mirror the preferred quality", () => {
  for (const m of VIDEO_MODELS) {
    const k = filmQuality(m.id, m.preferred);
    expect(m.resolution).toBe(k.resolution);
    expect(m.usdPerSecond).toBe(k.usdPerSecond);
    expect(m.creditsPerSecond).toBe(k.creditsPerSecond);
  }
});

test("Seedance 2.0 is gone — Antons Entscheidung 31.08.", () => {
  expect(VIDEO_MODELS.some((m) => m.slug.includes("seedance-2.0"))).toBe(false);
  expect(VIDEO_MODELS.map((m) => m.id)).toEqual(["standard", "premium"]);
});
