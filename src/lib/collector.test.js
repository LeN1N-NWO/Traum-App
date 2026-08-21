import { test, expect } from "bun:test";
import { collectTick, hasPendingJobs, pendingFingerprint } from "./collector.js";

/* Der Abholer läuft im Hintergrund gegen echtes Geld — seine Regeln
   werden deshalb ohne Server festgenagelt: `ask` wird als Attrappe
   hereingereicht. */

const askWith = (answers) => async (id) => {
  const a = answers[id];
  if (a instanceof Error) throw a;
  return a || { status: "pending" };
};

test("a dream lands when all its images do, in display order", async () => {
  const journal = [{
    id: "e1", title: "Zug aus Glas",
    media: { type: "image", urls: [], source: "api", poster: true },
    imageJobs: [{ id: "a" }, { id: "b" }, { id: "c" }],
  }];
  const res = await collectTick(journal, askWith({
    a: { status: "done", urls: ["/media/poster.png"] },
    b: { status: "done", urls: ["/media/two.png"] },
    c: { status: "done", urls: ["/media/three.png"] },
  }));
  expect(res.journal[0].media.urls).toEqual(["/media/poster.png", "/media/two.png", "/media/three.png"]);
  expect(res.journal[0].imageJobs).toBeUndefined();
  expect(res.journal[0].media.poster).toBe(true);
  expect(res.refund).toBe(0);
  expect(res.messages).toContainEqual(["dreamReady", "Zug aus Glas"]);
});

test("a failed image is refunded and a failed poster stops lying", async () => {
  const journal = [{
    id: "e1", title: "T",
    media: { type: "image", urls: [], source: "api", poster: true },
    imageJobs: [{ id: "a" }, { id: "b" }],
  }];
  const res = await collectTick(journal, askWith({
    a: { status: "failed" },
    b: { status: "done", urls: ["/media/two.png"] },
  }));
  expect(res.journal[0].media.urls).toEqual(["/media/two.png"]);
  // Das Poster (Auftrag 1) kam nie an — Bild 1 ist eine SZENE, keine
  // Titelkarte, und genau das muss media.poster jetzt sagen.
  expect(res.journal[0].media.poster).toBe(false);
  expect(res.refund).toBe(1);
  expect(res.messages).toContainEqual(["refunded", 1]);
});

test("a network hiccup keeps the order open instead of failing it", async () => {
  const journal = [{ id: "e1", media: { urls: [] }, imageJobs: [{ id: "a" }] }];
  const res = await collectTick(journal, askWith({ a: new Error("offline") }));
  expect(res).toBeNull();   // nichts entschieden, nächste Runde fragt wieder
});

test("partial progress is written down so a reload cannot lose it", async () => {
  const journal = [{ id: "e1", media: { urls: [] }, imageJobs: [{ id: "a" }, { id: "b" }] }];
  const res = await collectTick(journal, askWith({
    a: { status: "done", urls: ["/media/one.png"] },
    b: { status: "pending" },
  }));
  expect(res.journal[0].imageJobs[0].url).toBe("/media/one.png");
  expect(res.journal[0].imageJobs[1].url).toBeUndefined();
});

test("films are collected by the same loop", async () => {
  const journal = [{ id: "e1", jobId: "f1" }];
  const res = await collectTick(journal, askWith({ f1: { status: "done", urls: ["/media/film.mp4"] } }));
  expect(res.journal[0].film.urls).toEqual(["/media/film.mp4"]);
  expect(res.journal[0].jobId).toBeUndefined();
  expect(res.messages).toContainEqual(["filmArrived"]);
});

test("the fingerprint ignores everything except open orders", () => {
  const journal = [
    { id: "a", imageJobs: [{ id: "x" }] },
    { id: "b", text: "still" },
    { id: "c", jobId: "f" },
  ];
  expect(hasPendingJobs(journal)).toBe(true);
  expect(pendingFingerprint(journal)).toBe("a,c");
  expect(pendingFingerprint([{ id: "b", text: "x" }])).toBe("");
});

/* Szenenbilder (Storyboard-Nachfüllung): landen an ihrem Beat, nicht in
   der Sequenz — und ein gescheitertes wird erstattet. */
test("a scene job lands on its beat and a failed one is refunded", async () => {
  const journal = [{
    id: "e1", title: "T",
    media: { type: "image", urls: ["/media/a.png"] },
    sceneImages: { 0: "/media/a.png" },
    sceneJobs: [{ id: "s2", beat: 1 }, { id: "s4", beat: 3 }],
  }];
  const res = await collectTick(journal, askWith({
    s2: { status: "done", urls: ["/media/scene2.png"] },
    s4: { status: "failed" },
  }));
  expect(res.journal[0].sceneImages).toEqual({ 0: "/media/a.png", 1: "/media/scene2.png" });
  expect(res.journal[0].sceneJobs).toBeUndefined();
  expect(res.journal[0].media.urls).toEqual(["/media/a.png"]);   // Sequenz unberührt
  expect(res.refund).toBe(1);
  expect(res.messages).toContainEqual(["sceneReady", 2]);
});
