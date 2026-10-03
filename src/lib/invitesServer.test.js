import { test, expect, describe } from "bun:test";
import { newCode, ensureCode, shapeOverview, connect, notSetUp } from "./invitesServer.js";
import { CODE_ALPHABET, CODE_LENGTH, isInviteCode } from "./invites.js";

/* Ein `tx`, der aufschreibt, welche Funktion mit welchem Wert gerufen wurde,
   und vorbereitete Antworten der Reihe nach zurückgibt. */
function fakeTx(...answers) {
  const calls = [];
  const tx = async (strings, ...values) => {
    calls.push({ sql: strings.join("?"), values });
    return answers.length ? answers.shift() : [];
  };
  return { tx, calls };
}

describe("newCode", () => {
  test("every code fits the shared format", () => {
    for (let i = 0; i < 500; i++) expect(isInviteCode(newCode())).toBe(true);
  });

  test("no bias: bytes above the last whole multiple of the alphabet are skipped", () => {
    // 248..255 würden sonst auf die ersten acht Zeichen fallen.
    let i = 0;
    const seq = [255, 250, 248, 0, 1, 2, 3, 4, 5, 6];
    const code = newCode((n) => Uint8Array.from({ length: n }, () => seq[i++ % seq.length]));
    expect(code).toBe(CODE_ALPHABET.slice(0, CODE_LENGTH));
  });
});

describe("ensureCode", () => {
  test("returns the code the database settles on", async () => {
    const { tx, calls } = fakeTx([{ code: "ABCDEFG" }]);
    expect(await ensureCode(tx, () => "XYZXYZX")).toBe("ABCDEFG");
    expect(calls[0].sql).toContain("server_invite_code");
    expect(calls[0].values).toEqual(["XYZXYZX"]);
  });

  test("a collision (null) is retried with a fresh candidate", async () => {
    const { tx, calls } = fakeTx([{ code: null }], [{ code: "NEWCODE" }]);
    let n = 0;
    expect(await ensureCode(tx, () => ["AAAAAAA", "BBBBBBB"][n++])).toBe("NEWCODE");
    expect(calls.map((c) => c.values[0])).toEqual(["AAAAAAA", "BBBBBBB"]);
  });

  test("gives up loudly after five collisions in a row", async () => {
    const { tx } = fakeTx(...Array(6).fill([{ code: null }]));
    await expect(ensureCode(tx, () => "AAAAAAA")).rejects.toThrow("INVITE_CODE_COLLISIONS");
  });
});

describe("connect", () => {
  test("the code is normalised before it reaches the database", async () => {
    const { tx, calls } = fakeTx([{ result: "ok" }]);
    const r = await connect(tx, { code: "https://dreamrushes.app/i/drm4kx7" });
    expect(r).toEqual({ status: 200, body: { ok: true } });
    expect(calls[0].values).toEqual(["DRM4KX7"]);
  });

  test("garbage never reaches the database", async () => {
    const { tx, calls } = fakeTx();
    for (const body of [null, {}, { code: "" }, { code: "ABC" }, { code: "OOOOOOO" }, { code: 1234567 }]) {
      expect((await connect(tx, body)).body).toEqual({ error: "unknown" });
    }
    expect(calls).toHaveLength(0);
  });

  test("each database answer becomes the word the app knows", async () => {
    for (const [result, status] of [["unknown", 404], ["own", 409], ["mutual", 409], ["already", 409]]) {
      const { tx } = fakeTx([{ result }]);
      expect(await connect(tx, { code: "DRM4KX7" })).toEqual({ status, body: { error: result } });
    }
  });

  test("an answer nobody planned for is an error, not a silent success", async () => {
    const { tx } = fakeTx([{ result: "weird" }]);
    await expect(connect(tx, { code: "DRM4KX7" })).rejects.toThrow("INVITE_CONNECT_UNEXPECTED");
  });
});

describe("shapeOverview", () => {
  const T = "2026-10-01T10:00:00.000Z";

  test("the exact shape mobile/src/lib/invites.ts reads", () => {
    const out = shapeOverview("DRM4KX7", {
      connected: true, rewardsThisMonth: "2",
      referrals: [
        { id: "a", name: " Mila ", status: "rewarded", product: "pack-m", purchasedAt: T },
        { id: "b", name: null, status: "bought", product: "monthly", purchasedAt: T },
        { id: "c", name: "", status: "joined", product: null, purchasedAt: null },
      ],
    });
    expect(out).toEqual({
      code: "DRM4KX7", connected: true, rewardsThisMonth: 2,
      referrals: [
        { id: "a", name: "Mila", status: "rewarded", product: "pack-m", films: 2, rewardAt: null },
        { id: "b", name: null, status: "bought", product: "monthly", films: 1, rewardAt: "2026-10-15T10:00:00.000Z" },
        { id: "c", name: null, status: "joined", product: null, films: 0, rewardAt: null },
      ],
    });
  });

  test("nothing yet: empty list, not connected, zero rewards", () => {
    expect(shapeOverview("DRM4KX7", null)).toEqual({ code: "DRM4KX7", connected: false, rewardsThisMonth: 0, referrals: [] });
  });

  test("a rejected or unknown product earns nothing", () => {
    const out = shapeOverview("X", { referrals: [
      { id: "r", status: "rejected", product: "pack-xl" },
      { id: "u", status: "bought", product: "credits.starter", purchasedAt: T },
    ] });
    expect(out.referrals.map((r) => r.films)).toEqual([0, 0]);
  });
});

/* Solange die Migration fehlt, soll die App ihre Vorschau zeigen (501), nicht
   „offline" (500). Erkannt wird das am SQL-Code, nicht am Text. */
test("a missing database function counts as 'not set up', anything else does not", () => {
  expect(notSetUp({ errno: "42883", code: "ERR_POSTGRES_SERVER_ERROR" })).toBe(true);
  expect(notSetUp({ errno: "42501" })).toBe(false);          // keine Berechtigung ist ein echter Fehler
  expect(notSetUp({ code: "42883" })).toBe(false);           // Bun trägt den SQL-Code in errno
  expect(notSetUp(new Error("boom"))).toBe(false);
  expect(notSetUp(null)).toBe(false);
});
