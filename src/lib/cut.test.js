import { test, expect, describe } from "bun:test";
import {
  beatMeta, signatureIndex, minKern, minAlles, selectBeats, shotPlan,
  recommendation, beruehrt, MIN_SHOT_SECONDS, HOOKS,
} from "./cut.js";
import { shotBudget, beatBudget, filmPace, videoModel } from "./video.js";

/* Der Zahntraum aus dem Trockenlauf (DreamBank van:101, Bericht vom
 * 03.09.2026). Er ist der Grund, warum es diese Datei gibt: Sechs seiner
 * elf Szenen sind Kulisse — Bangkok, ein Resort, eine Ausstellung, eine
 * Parkplatzsuche — und die App gab ihnen bei fünfzehn Sekunden neun davon.
 * Die Texte sind nachgebaut, nicht abgeschrieben: DreamBank steht unter
 * einer nicht-kommerziellen Lizenz. Die STRUKTUR ist die gemessene. */
const ZAHNTRAUM = {
  beats: [
    "A golf cart carries three friends through a closed resort in Bangkok",   // 0 Kulisse
    "Strangers hoist picture frames on cables to build an exhibition",         // 1 Kulisse
    "He slides down a railing and lands hard on the balls of his feet",        // 2 Kulisse
    "The group hunts for a parking space outside a friend's house",            // 3 Kulisse
    "Brown carpet and square furniture fill a room from the seventies",        // 4 Kulisse
    "Inside the car a front tooth chips loose and drops onto his lip",         // 5 turn
    "More teeth loosen while he hopes it will stop",                           // 6 build
    "In the mirror the canine is gone and the gap is dark",                    // 7 reveal
    "He spits the teeth into his open palm",                                   // 8 climax
    "Some teeth fall from his hand and he cannot count them",                  // 9 resolution
  ],
  beatMeta: [
    { hook: "setup", min_s: 3 }, { hook: "build", min_s: 3 }, { hook: "build", min_s: 3 },
    { hook: "transit", min_s: 3 }, { hook: "setup", min_s: 3 },
    { hook: "turn", min_s: 4 }, { hook: "build", min_s: 3 }, { hook: "reveal", min_s: 4 },
    { hook: "climax", min_s: 5 }, { hook: "resolution", min_s: 3 },
  ],
  signature: 7,
};

/* Der Flugtraum (DreamBank samantha:56): Sein letzter Beat ist ein Kuss an
 * einem Ort, der nie vorkam — die Analyse gibt ihm deshalb "transit", nicht
 * "resolution". Vier von fünf geprüften Träumen enden so. */
const FLUGTRAUM = {
  beats: [
    "Cubicles pack an office floor with far too many people",
    "She pushes through the crowd towards the lift",
    "The lift is now an aeroplane lifting off above the city",
    "The pilot loops the aircraft over the rooftops",
    "She leans out of an open window and waves at the park below",
    "Later she reaches over and kisses a man on a sofa",
  ],
  beatMeta: [
    { hook: "setup", min_s: 3 }, { hook: "build", min_s: 3 },
    { hook: "turn", min_s: 5 }, { hook: "climax", min_s: 5 },
    { hook: "reveal", min_s: 4 }, { hook: "transit", min_s: 3 },
  ],
  signature: 2,
};

/* Ein Traum von vor dem 03.09.2026: fünf Texte, keine Gewichtung. Er muss
 * durch denselben Weg laufen — kein Migrationszwang war die Bedingung. */
const ALTTRAUM = {
  beats: ["A woman waits on a pier", "A boat arrives", "She steps aboard", "The shore fades", "Fog closes in"],
};

describe("beatMeta", () => {
  test("fills in what an old dream never had", () => {
    const m = beatMeta(ALTTRAUM);
    expect(m).toHaveLength(5);
    expect(m.every((b) => b.hook === "build" && b.min_s === MIN_SHOT_SECONDS)).toBe(true);
  });

  test("an invented hook becomes build rather than breaking the cut", () => {
    const m = beatMeta({ beats: ["a"], beatMeta: [{ hook: "montage", min_s: 4 }] });
    expect(HOOKS).toContain(m[0].hook);
    expect(m[0].hook).toBe("build");
  });

  test("a duration below the readable minimum is lifted, not honoured", () => {
    const m = beatMeta({ beats: ["a"], beatMeta: [{ hook: "climax", min_s: 1 }] });
    expect(m[0].min_s).toBe(MIN_SHOT_SECONDS);
  });

  test("meta longer than beats cannot smuggle in extra scenes", () => {
    const m = beatMeta({ beats: ["a"], beatMeta: [{ hook: "turn" }, { hook: "climax" }] });
    expect(m).toHaveLength(1);
  });
});

describe("signatureIndex", () => {
  test("takes the analysis's own choice", () => {
    expect(signatureIndex(ZAHNTRAUM)).toBe(7);
  });

  test("falls back to the heaviest hook when the analysis is silent", () => {
    const { signature, ...ohne } = ZAHNTRAUM;
    expect(signatureIndex(ohne)).toBe(8);   // der climax
  });

  test("an index outside the list is refused, not used", () => {
    expect(signatureIndex({ ...FLUGTRAUM, signature: 99 })).toBe(3);
  });
});

describe("minKern gegen minAlles", () => {
  /* Der Fehler, den erst fremdes Material zeigte: Über ALLE Szenen summiert
     landet jeder erzählte Traum über dem Maximum beider Modelle — der Rat
     wäre fünfmal von fünf „Zweiteiler" gewesen. */
  test("the core is a number a film can hold, the whole is not", () => {
    expect(minKern(ZAHNTRAUM)).toBe(16);
    expect(minAlles(ZAHNTRAUM)).toBe(34);
    expect(minKern(ZAHNTRAUM)).toBeLessThanOrEqual(videoModel("premium").max);
    expect(minAlles(ZAHNTRAUM)).toBeGreaterThan(videoModel("premium").max);
  });
});

describe("selectBeats", () => {
  test("one shot keeps the signature beat and nothing else", () => {
    expect(selectBeats(ZAHNTRAUM, 1)).toEqual([7]);
    expect(selectBeats(FLUGTRAUM, 1)).toEqual([2]);
  });

  /* Der Kernbefund des Trockenlaufs: Bei fünf Sekunden zeigte die App den
     Golfwagen und die Hand — der Zahnverlust selbst fiel weg, weil er in
     der Mitte stand. Beim Flugtraum blieben Büro und Kuss, aber kein Flug. */
  test("the moment the dream is about survives where the old cut lost it", () => {
    for (const n of [1, 2, 3, 4]) {
      expect(selectBeats(ZAHNTRAUM, n)).toContain(7);
      expect(selectBeats(FLUGTRAUM, n)).toContain(2);
    }
  });

  test("the climax is never dropped while anything else remains", () => {
    for (const n of [2, 3, 4, 5]) expect(selectBeats(ZAHNTRAUM, n)).toContain(8);
  });

  test("scenery goes before action that belongs to the dream", () => {
    const sel = selectBeats(ZAHNTRAUM, 4);
    // Bangkok, Ausstellung, Geländer, Parkplatz, Siebziger — nichts davon.
    expect(sel.every((i) => i >= 5)).toBe(true);
  });

  /* Gemessen am echten Lauf vom 03.09.2026: Die Analyse gab dem Flugtraum
     als Höhepunkt den Kuss mit einem Freund — den gefühlvollsten Moment,
     aber an einem Ort, der nie vorkam. Ein geschützter Typ ganz am Schluss,
     der mit dem Signatur-Beat nichts teilt, darf den Film nicht kapern. */
  test("a climax the analysis put on an unrelated ending loses its priority", () => {
    const verrutscht = {
      ...FLUGTRAUM,
      beatMeta: FLUGTRAUM.beatMeta.map((m, i) => (i === 5 ? { hook: "climax", min_s: 5 } : m)),
    };
    expect(selectBeats(verrutscht, 3)).not.toContain(5);
    expect(selectBeats(verrutscht, 3)).toContain(2);
  });

  test("a climax that belongs to the dream is kept even at the end", () => {
    // Derselbe Bau, aber der Schlussbeat teilt sein Thema mit dem Signatur-Beat.
    const stimmig = {
      beats: [...FLUGTRAUM.beats.slice(0, 5), "The aeroplane finally settles and the city goes quiet"],
      beatMeta: FLUGTRAUM.beatMeta.map((m, i) => (i === 5 ? { hook: "climax", min_s: 5 } : m)),
      signature: 2,
    };
    expect(selectBeats(stimmig, 3)).toContain(5);
  });

  test("a transit ending is worth less than a reveal", () => {
    const sel = selectBeats(FLUGTRAUM, 3);
    expect(sel).toContain(2);   // die Verwandlung
    expect(sel).toContain(3);   // der Looping
    expect(sel).not.toContain(5);  // der Kuss aus dem Nichts
  });

  test("indices come back in the dream's own order, never in rank order", () => {
    const sel = selectBeats(ZAHNTRAUM, 4);
    expect([...sel].sort((a, b) => a - b)).toEqual(sel);
  });

  test("more room than scenes keeps every scene", () => {
    expect(selectBeats(FLUGTRAUM, 99)).toEqual([0, 1, 2, 3, 4, 5]);
  });

  test("an old dream without weights still yields a usable cut", () => {
    const sel = selectBeats(ALTTRAUM, 2);
    expect(sel).toHaveLength(2);
    expect(new Set(sel).size).toBe(2);
  });

  test("no beats, no crash", () => {
    expect(selectBeats({ beats: [] }, 3)).toEqual([]);
    expect(selectBeats(null, 3)).toEqual([]);
  });
});

describe("shotPlan", () => {
  const plan15 = shotPlan(ZAHNTRAUM, selectBeats(ZAHNTRAUM, 3), 15);

  test("the timeline is gapless and ends exactly on the ordered duration", () => {
    expect(plan15[0].from).toBe(0);
    expect(plan15[plan15.length - 1].to).toBe(15);
    for (let i = 1; i < plan15.length; i++) expect(plan15[i].from).toBe(plan15[i - 1].to);
  });

  test("every block is whole seconds — Seedance 2.5 reads no other kind", () => {
    for (const s of plan15) {
      expect(Number.isInteger(s.from)).toBe(true);
      expect(Number.isInteger(s.to)).toBe(true);
    }
  });

  test("no block falls below the readable minimum", () => {
    for (const s of plan15) expect(s.to - s.from).toBeGreaterThanOrEqual(MIN_SHOT_SECONDS);
  });

  /* Der zweite Teil des alten Fehlers: director.js rechnete `seconds /
     scenes` und gab dem Höhepunkt so viel Zeit wie einem Weg. */
  test("time is not spread evenly — the climax gets the longest block", () => {
    const laengen = plan15.map((s) => s.to - s.from);
    expect(new Set(laengen).size).toBeGreaterThan(1);
    const climax = plan15.find((s) => s.hook === "climax");
    expect(climax.to - climax.from).toBe(Math.max(...laengen));
  });

  test("a single shot fills the whole film", () => {
    const p = shotPlan(ZAHNTRAUM, [7], 5);
    expect(p).toHaveLength(1);
    expect(p[0]).toMatchObject({ from: 0, to: 5, index: 7 });
  });

  test("the same input always produces the same plan", () => {
    expect(shotPlan(ZAHNTRAUM, [5, 7, 8], 15)).toEqual(shotPlan(ZAHNTRAUM, [5, 7, 8], 15));
  });

  test("each block carries its own beat's text", () => {
    for (const s of plan15) expect(s.text).toBe(ZAHNTRAUM.beats[s.index]);
  });
});

describe("das Budget kommt vom Modell", () => {
  /* Belegt, nicht geschätzt: Seedance 2.5 zeigt 9 Shots auf 30 Sekunden im
     eigenen Beispiel, H3 hält 2–3 je Clip. */
  test.each([
    ["standard", 5, 1], ["standard", 10, 2], ["standard", 15, 3],
    ["premium", 5, 1], ["premium", 15, 3], ["premium", 30, 7],
  ])("%s at %is carries %i shots", (id, secs, want) => {
    expect(shotBudget(id, secs)).toBe(want);
  });

  test("a film always carries at least one shot", () => {
    for (const id of ["standard", "premium"]) {
      expect(shotBudget(id, 0)).toBeGreaterThanOrEqual(1);
      expect(shotBudget(id, -5)).toBeGreaterThanOrEqual(1);
    }
  });

  test("the budget never asks for shots shorter than the minimum", () => {
    for (const id of ["standard", "premium"]) {
      const m = videoModel(id);
      for (let s = m.min; s <= m.max; s += m.step) {
        expect(shotBudget(id, s) * MIN_SHOT_SECONDS).toBeLessThanOrEqual(s);
      }
    }
  });
});

/* ── Die drei Tempi (Antons Ansage 03.09.2026) ──────────────────────────
   „Die einzelnen Shots sind zu lang … maximal zwei Sekunden, somit sieben
   Shots" — und als Gegenstück ein Film ganz ohne Schnitt, in dem alles
   ineinander übergeht. */
describe("Tempo", () => {
  test("fast packs seven shots into fifteen seconds, calm three", () => {
    expect(shotBudget("standard", 15, "fast")).toBe(7);
    expect(shotBudget("standard", 15, "calm")).toBe(3);
  });

  test("flow is one single shot, whatever the length", () => {
    for (const s of [5, 10, 15]) expect(shotBudget("standard", s, "flow")).toBe(1);
  });

  /* ⚠ Der Unterschied, an dem das Fließen hängt: EIN Shot, aber mehrere
     Szenen darin. Mit der Shot-Zahl als Szenenbudget bekäme dieses Tempo
     genau eine Szene — also das Gegenteil von „die ganze Story in 15
     Sekunden". */
  test("flow still carries several scenes inside that one shot", () => {
    expect(beatBudget("standard", 15, "flow")).toBe(6);
    expect(beatBudget("standard", 15, "flow")).toBeGreaterThan(shotBudget("standard", 15, "flow"));
  });

  test("an unknown pace falls back to the tested one, never to the fastest", () => {
    expect(filmPace("trailer").id).toBe("calm");
    expect(filmPace(undefined).id).toBe("calm");
    expect(shotBudget("standard", 15, "quatsch")).toBe(shotBudget("standard", 15, "calm"));
  });

  test("a fast plan really does hold two-second blocks", () => {
    const sel = selectBeats(ZAHNTRAUM, shotBudget("standard", 15, "fast"));
    const plan = shotPlan(ZAHNTRAUM, sel, 15, filmPace("fast").minShot);
    expect(plan.length).toBe(7);
    for (const s of plan) expect(s.to - s.from).toBeGreaterThanOrEqual(2);
    expect(plan[plan.length - 1].to).toBe(15);
  });

  test("even at speed the climax keeps the longest block", () => {
    const sel = selectBeats(ZAHNTRAUM, 7);
    const plan = shotPlan(ZAHNTRAUM, sel, 15, 2);
    const climax = plan.find((s) => s.hook === "climax");
    expect(climax.to - climax.from).toBe(Math.max(...plan.map((s) => s.to - s.from)));
  });
});

describe("recommendation", () => {
  test("one shot is announced as an image, not as a story", () => {
    expect(recommendation(ZAHNTRAUM, 1, 5, 15).einBild).toBe(true);
  });

  test("a two-parter is judged on the core, never on the trimmings", () => {
    // minAlles liegt bei 34 s und damit über beiden Modellen — der Kern nicht.
    expect(recommendation(ZAHNTRAUM, 3, 15, 15).zweiteiler).toBe(true);
    expect(recommendation(ZAHNTRAUM, 7, 30, 30).zweiteiler).toBe(false);
  });

  test("room for everything is said plainly", () => {
    const r = recommendation(FLUGTRAUM, 9, 30, 30);
    expect(r.alle).toBe(true);
    expect(r.beats).toBe(6);
  });
});

describe("beruehrt", () => {
  test("scenery and the dream's own subject share no content word", () => {
    expect(beruehrt(ZAHNTRAUM.beats[0], ZAHNTRAUM.beats[7])).toBe(false);
  });

  test("two scenes about the same thing do touch", () => {
    expect(beruehrt(ZAHNTRAUM.beats[5], ZAHNTRAUM.beats[6])).toBe(true);
  });

  test("common filler alone is not a connection", () => {
    expect(beruehrt("The camera holds on the light", "The camera holds on the light of a door")).toBe(true);
    expect(beruehrt("There was a light", "They were still there")).toBe(false);
  });
});
