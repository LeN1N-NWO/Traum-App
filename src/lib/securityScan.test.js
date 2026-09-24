import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import {
  SECRET_PATTERNS, PLACEHOLDER_PROBES, scanSecrets, jwtRole, envShape,
  trackedEnvFiles, secretLookingPublicVars, rlsGaps, publicGrants,
  routeInventory, corsOrigins, chargeArmed, errorLeaks, sensitiveLogs,
  headersSet, bindsAllInterfaces, auditCounts, selfTest,
} from "./securityScan.js";

describe("Selbsttest", () => {
  test("jeder Detektor ist scharf", () => {
    expect(selfTest()).toEqual([]);
  });
});

describe("scanSecrets", () => {
  test.each(SECRET_PATTERNS.map((p) => [p.id, p.probe]))("%s findet seine Probe", (id, probe) => {
    expect(scanSecrets(`x\n${probe}\ny`)).toContainEqual({ pattern: id, line: 2 });
  });

  test.each(PLACEHOLDER_PROBES)("Platzhalter bleibt still: %s", (probe) => {
    expect(scanSecrets(probe)).toEqual([]);
  });

  test("gibt nie den Wert zurück", () => {
    const hits = scanSecrets(SECRET_PATTERNS[0].probe);
    expect(JSON.stringify(hits)).not.toContain(SECRET_PATTERNS[0].probe.slice(0, 8));
  });

  test("diese Datei und das Modul selbst sind kein Fund", () => {
    for (const f of ["securityScan.js", "securityScan.test.js"]) {
      expect(scanSecrets(readFileSync(new URL(f, import.meta.url), "utf8"))).toEqual([]);
    }
  });
});

test("jwtRole liest die Rolle", () => {
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
  expect(jwtRole(`${b64({ alg: "HS256" })}.${b64({ role: "service_role" })}.sig`)).toBe("service_role");
  expect(jwtRole("kaputt")).toBeNull();
});

test("envShape gibt Längen statt Werte", () => {
  expect(envShape('A=abc\nexport B="xy"\n# C=1\nD=')).toEqual({ A: 3, B: 2, D: 0 });
});

test("trackedEnvFiles", () => {
  expect(trackedEnvFiles([".env.example", "mobile/.env.production", "x.pem"])).toEqual(["mobile/.env.production", "x.pem"]);
});

test("secretLookingPublicVars", () => {
  expect(secretLookingPublicVars(["VITE_API_BASE", "VITE_SUPABASE_SECRET", "EXPO_PUBLIC_TOKEN"]))
    .toEqual(["VITE_SUPABASE_SECRET", "EXPO_PUBLIC_TOKEN"]);
});

describe("Datenbank", () => {
  test("rlsGaps zählt auch ohne Schema-Präfix", () => {
    expect(rlsGaps("create table foo (x int);\n-- alter table foo enable row level security;")).toEqual({ tables: 1, gaps: ["public.foo"] });
  });
  test("publicGrants meldet Tabellenrechte an anon, nicht Funktionen", () => {
    expect(publicGrants("grant select on public.dreams to anon;\ngrant execute on function public.f() to authenticated;"))
      .toEqual(["select on public.dreams to anon"]);
  });
  test("das echte Schema hat RLS auf jeder Tabelle", () => {
    const sql = ["20260911130000_initial_schema.sql", "20260911150000_server_role.sql", "20260923090000_account_delete.sql"]
      .map((f) => readFileSync(new URL(`../../supabase/migrations/${f}`, import.meta.url), "utf8")).join("\n");
    const r = rlsGaps(sql);
    expect(r.tables).toBeGreaterThan(0);
    expect(r.gaps).toEqual([]);
  });
});

describe("server.js", () => {
  const src = readFileSync(new URL("../../server.js", import.meta.url), "utf8");

  test("routeInventory findet die Routen des echten Servers", () => {
    const routes = routeInventory(src);
    expect(routes.length).toBeGreaterThan(15);
    expect(routes.find((r) => r.path === "/api/dreams" && r.method === "GET")?.authed).toBe(true);
    expect(routes.find((r) => r.path === "/api/auth/login")?.authed).toBe(false);
    // Regression: ein Kommentar, der verifyAccessToken() erwähnt, ist keine Anmeldung.
    expect(routes.find((r) => r.path === "/api/journal-backup" && r.method === "POST")?.authed).toBe(false);
  });

  test("corsOrigins liest die echte Positivliste", () => {
    expect(corsOrigins(src).list).toContain("capacitor://localhost");
  });

  test("chargeArmed erkennt eine scharfe Abbuchung", () => {
    expect(chargeArmed("function settleCharge(x) {\n  await tx`select public.server_spend(1)`;\n  return { charged: true };\n}")).toBe(true);
    expect(chargeArmed("nichts")).toBeNull();
  });

  test("errorLeaks und sensitiveLogs", () => {
    expect(errorLeaks('return json({ error: "Server error." }, 500);')).toEqual([]);
    expect(errorLeaks("return json({ error: err.stack }, 500);")).toEqual([1]);
    expect(sensitiveLogs('console.error("[x] failed:", e);')).toEqual([]);
  });

  test("headersSet", () => {
    expect(headersSet('h.set("X-Content-Type-Options", "nosniff")')).toEqual(["x-content-type-options"]);
  });

  test("bindsAllInterfaces", () => {
    expect(bindsAllInterfaces('const serveOptions = {\n  hostname: "0.0.0.0",\n  async route(')).toBe(true);
  });
});

test("auditCounts", () => {
  expect(auditCounts({ a: [{ severity: "high" }, { severity: "moderate" }], b: [{ severity: "high" }] }))
    .toEqual({ critical: 0, high: 2, moderate: 1, low: 0 });
});
