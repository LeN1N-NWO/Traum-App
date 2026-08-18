import { test, expect } from "bun:test";
import { VIDEO_MODELS, videoModel, clampSeconds, priceForFilm, videoSubmitBody } from "./video.js";

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
  expect(std.slug).toBe("minimax/h3/image-to-video");
  expect(std.body.resolution).toBe("768P");

  const prem = videoSubmitBody("premium", { imageUrl: "img", prompt: "p", seconds: 30 });
  expect(prem.slug).toBe("bytedance/seedance-2.5/image-to-video");
  expect(prem.body.resolution).toBe("720p");
  expect(prem.body.duration).toBe(30);
});

/* minimax kennt generate_audio nicht — ein unbekanntes Feld kann bei einem
   strengen Validator den ganzen (bezahlten) Auftrag kosten. Seedance
   braucht es, sonst kommt der Film stumm. */
test("generate_audio goes only where the parameter exists", () => {
  expect("generate_audio" in videoSubmitBody("standard", { imageUrl: "x", prompt: "p", seconds: 6 }).body).toBe(false);
  expect(videoSubmitBody("premium", { imageUrl: "x", prompt: "p", seconds: 15 }).body.generate_audio).toBe(true);
});
