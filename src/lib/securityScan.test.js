/* Zwei Arten Tests, bewusst getrennt:
 *
 *   1. Einheiten — jede Funktion gegen feste Eingaben. Kein Dateizugriff,
 *      je Test genau ein Verhalten.
 *   2. Invarianten gegen den echten Code — lesen server.js und die
 *      Migrationen, schreiben nichts. Sie prüfen nur, was SICHER sein muss
 *      (RLS überall, Sperre da, kein Wildcard-CORS), nie den Ist-Zustand:
 *      Ein Test, der „Route X ist nicht angemeldet“ festschreibt, würde rot,
 *      sobald jemand die Lücke schließt.
 */
import { describe, expect, test } from "bun:test";
import { readFileSync, readdirSync } from "node:fs";
import {
  SECRET_PATTERNS, PLACEHOLDER_PROBES, scanSecrets, jwtRole, envShape,
  trackedEnvFiles, secretLookingPublicVars, rlsGaps, publicGrants,
  routeInventory, corsOrigins, chargeArmed, errorLeaks, sensitiveLogs,
  headersSet, bindsAllInterfaces, auditCounts, selfTest, localOnlyPaths,
} from "./securityScan.js";

const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const fakeJwt = (payload) => `${b64({ alg: "HS256" })}.${b64(payload)}.${"s".repeat(12)}`;

describe("selfTest", () => {
  test("alle Detektoren finden ihre Probe", () => {
    expect(selfTest()).toEqual([]);
  });
});

describe("scanSecrets", () => {
  test.each(SECRET_PATTERNS.map((p) => [p.id, p.probe]))("%s findet seine Probe", (id, probe) => {
    expect(scanSecrets(`x\n${probe}\ny`).map((h) => h.pattern)).toContain(id);
  });

  test.each(PLACEHOLDER_PROBES)("Platzhalter bleibt still: %s", (probe) => {
    expect(scanSecrets(probe)).toEqual([]);
  });

  test("meldet die Zeile des Funds", () => {
    expect(scanSecrets(`a\nb\n${SECRET_PATTERNS[1].probe}`)[0].line).toBe(3);
  });

  test("gibt nie den Wert zurück", () => {
    const probe = SECRET_PATTERNS[0].probe;
    expect(JSON.stringify(scanSecrets(probe))).not.toContain(probe.slice(0, 8));
  });

  test("findet einen Schlüssel am Ende einer sehr langen Zeile (Bundle)", () => {
    expect(scanSecrets("x".repeat(500_000) + " " + SECRET_PATTERNS[1].probe)).toHaveLength(1);
  });

  test("findet den echten Wert hinter einem Platzhalter in derselben Zeile", () => {
    const line = `FAL_KEY="YOUR_KEY_ID:YOUR_KEY_SECRET" ${SECRET_PATTERNS[0].probe}`;
    expect(scanSecrets(line).map((h) => h.pattern)).toEqual(["fal-key"]);
  });

  test("DATABASE_URL mit Passwort zählt einmal, nicht als db-url UND env-assign", () => {
    expect(scanSecrets(`DATABASE_URL=${SECRET_PATTERNS.find((p) => p.id === "db-url").probe}`))
      .toEqual([{ pattern: "db-url", line: 1 }]);
  });

  test("PEM-Kopf ohne Rumpf ist kein Fund", () => {
    expect(scanSecrets("-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----")).toEqual([]);
  });

  test("PEM als einzeiliger .env-Wert mit \\n-Escapes ist ein Fund", () => {
    const body = "Qw7eR9tY2uI4oP6a".repeat(4);
    expect(scanSecrets(`KEY="-----BEGIN PRIVATE KEY-----\\n${body}\\n-----END PRIVATE KEY-----"`).map((h) => h.pattern))
      .toContain("private-key");
  });

  test("JWT-Treffer tragen die Rolle", () => {
    expect(scanSecrets(fakeJwt({ role: "service_role" }))[0].role).toBe("service_role");
  });
});

describe("scanSecrets gegen die eigenen Dateien", () => {
  test.each(["securityScan.js", "securityScan.test.js", "securityReport.js", "securityReport.test.js"])(
    "%s ist kein Fund (sonst bräuchte der Verlaufs-Scan eine Ausnahme)", (f) => {
      expect(scanSecrets(readFileSync(new URL(f, import.meta.url), "utf8"))).toEqual([]);
    });
});

describe("jwtRole", () => {
  test("liest die Rolle", () => {
    expect(jwtRole(fakeJwt({ role: "anon" }))).toBe("anon");
  });
  test("ohne Rolle null", () => {
    expect(jwtRole(fakeJwt({ sub: "x" }))).toBeNull();
  });
  test("kaputter Token null", () => {
    expect(jwtRole("kaputt")).toBeNull();
  });
});

describe("envShape", () => {
  test("gibt Längen statt Werte", () => {
    expect(envShape('A=abc\nexport B="xy"\nD=')).toEqual({ A: 3, B: 2, D: 0 });
  });
  test("überspringt Kommentare", () => {
    expect(envShape("# C=1")).toEqual({});
  });
  test("mehrzeiliger Wert: Folgezeilen werden keine Namen", () => {
    // Zusammengesetzt, damit diese Datei selbst kein Fund ist (Test oben).
    const pem = `KEY="-----BEGIN ${"PRIVATE"} KEY-----\n${"Qw7eR9tY2uI4oP6a".repeat(3)}Qg=\n-----END PRIVATE KEY-----"\nNEXT=1`;
    expect(Object.keys(envShape(pem))).toEqual(["KEY", "NEXT"]);
  });
});

describe("trackedEnvFiles", () => {
  test("meldet .env-Varianten und Schlüsseldateien", () => {
    expect(trackedEnvFiles(["mobile/.env.production", "x.pem", "k.p8"])).toEqual(["mobile/.env.production", "x.pem", "k.p8"]);
  });
  test("lässt .env.example und Code in Ruhe", () => {
    expect(trackedEnvFiles([".env.example", "src/env.js", "environment.md"])).toEqual([]);
  });
});

describe("secretLookingPublicVars", () => {
  test("meldet öffentliche Variablen mit Geheimnis-Namen", () => {
    expect(secretLookingPublicVars(["VITE_SUPABASE_SECRET", "EXPO_PUBLIC_TOKEN"])).toEqual(["VITE_SUPABASE_SECRET", "EXPO_PUBLIC_TOKEN"]);
  });
  test("lässt Adressen und nicht-öffentliche Namen in Ruhe", () => {
    expect(secretLookingPublicVars(["VITE_API_BASE", "FAL_KEY"])).toEqual([]);
  });
});

describe("rlsGaps", () => {
  test("findet die Tabelle ohne RLS", () => {
    expect(rlsGaps("create table a (x int);\ncreate table public.b (x int);\nalter table public.a enable row level security;").gaps).toEqual(["public.b"]);
  });
  test("auskommentiertes enable zählt nicht", () => {
    expect(rlsGaps("create table foo (x int);\n-- alter table foo enable row level security;").gaps).toEqual(["public.foo"]);
  });
});

describe("publicGrants", () => {
  test("meldet Tabellenrechte an anon", () => {
    expect(publicGrants("grant select on public.dreams to anon;")).toEqual(["select on public.dreams to anon"]);
  });
  test("ignoriert Funktionsrechte", () => {
    expect(publicGrants("grant execute on function public.f() to authenticated;")).toEqual([]);
  });
});

describe("routeInventory", () => {
  const src = [
    '    if (url.pathname === "/api/generate" && req.method === "POST") {',
    "    }",
    '    if (url.pathname === "/api/account" || url.pathname.startsWith("/api/dreams")) {',
    "      const person = await verifyAccessToken(x);",
    '        if (url.pathname === "/api/dreams" && req.method === "GET") {',
    "        }",
    "    }",
    '    if ((url.pathname === "/api/backup" || url.pathname === "/api/other")',
    "        && !isLocalRequest(ip, req.headers)) {",
    "    }",
    '    if (url.pathname === "/api/backup" && req.method === "POST") {',
    "      /* Anders als dort, wo await verifyAccessToken(t) prüft … */",
    '      // if (url.pathname === "/api/ghost") {',
    "    }",
    "    return serveStatic(url.pathname);",
  ].join("\n");
  const routes = routeInventory(src);
  const find = (path, method) => routes.find((r) => r.path === path && r.method === method);

  test("Route ohne verifyAccessToken ist offen", () => {
    expect(find("/api/generate", "POST").authed).toBe(false);
  });
  test("verschachtelte Route im Anmeldeblock ist angemeldet", () => {
    expect(find("/api/dreams", "GET").authed).toBe(true);
  });
  test("ein Kommentar, der verifyAccessToken nennt, ist keine Anmeldung", () => {
    expect(find("/api/backup", "POST").authed).toBe(false);
  });
  test("Sperrblöcke erzeugen keine eigenen Routen", () => {
    expect(find("/api/backup", "*")).toBeUndefined();
    expect(find("/api/other", "*")).toBeUndefined();
  });
  test("auskommentierte Routen zählen nicht", () => {
    expect(routes.some((r) => r.path === "/api/ghost")).toBe(false);
  });
});

describe("localOnlyPaths", () => {
  test("liest die Pfade aus der Sperrbedingung", () => {
    const src = [
      '    if ((url.pathname === "/a" || url.pathname === "/b")',
      "        && !isLocalRequest(ip, req.headers)) {",
      '      return new Response("Not found", { status: 404 });',
    ].join("\n");
    expect(localOnlyPaths(src)).toEqual(["/a", "/b"]);
  });
  test("ohne 404/403 ist es keine Sperre", () => {
    expect(localOnlyPaths('if (url.pathname === "/a" && !isLocalRequest(x)) {\n  log();\n}')).toEqual([]);
  });
  test("Pfade aus dem Block davor zählen nicht mit", () => {
    const src = [
      '    if (url.pathname === "/davor") {',
      "    }",
      '    if (url.pathname === "/a" && !isLocalRequest(ip, h)) {',
      '      return new Response("", { status: 404 });',
    ].join("\n");
    expect(localOnlyPaths(src)).toEqual(["/a"]);
  });
});

describe("corsOrigins", () => {
  test("liest die Positivliste", () => {
    expect(corsOrigins('const NATIVE_ORIGINS = new Set(["capacitor://localhost", "null"]);').list).toEqual(["capacitor://localhost", "null"]);
  });
  test("erkennt Wildcard", () => {
    expect(corsOrigins('"access-control-allow-origin": "*"').wildcard).toBe(true);
  });
  test("ohne Liste null", () => {
    expect(corsOrigins("nichts").list).toBeNull();
  });
});

describe("chargeArmed", () => {
  test("scharf, wenn server_spend gerufen wird", () => {
    expect(chargeArmed("function settleCharge(x) {\n  await tx`select public.server_spend(1)`;\n  return { charged: true };\n}")).toBe(true);
  });
  test("unscharf bei charged: false", () => {
    expect(chargeArmed("function settleCharge(x) {\n  return { charged: false };\n}")).toBe(false);
  });
  test("null, wenn die Funktion fehlt", () => {
    expect(chargeArmed("nichts")).toBeNull();
  });
});

describe("errorLeaks", () => {
  test("findet e.message in einer Antwort", () => {
    expect(errorLeaks("return json({ error: err.stack }, 500);")).toEqual([1]);
  });
  test("findet auch verpackte Fehlermeldungen", () => {
    expect(errorLeaks("return json(checkResult({ error: String(e?.message || 1) }));")).toEqual([1]);
  });
  test("feste Fehlertexte sind in Ordnung", () => {
    expect(errorLeaks('return json({ error: "Server error." }, 500);')).toEqual([]);
  });
  test("Kommentare zählen nicht", () => {
    expect(errorLeaks("// return json({ error: e.message })")).toEqual([]);
  });
});

describe("sensitiveLogs", () => {
  test("findet Token im Log", () => {
    expect(sensitiveLogs('console.log("token", token);')).toEqual([1]);
  });
  test("findet camelCase-Token", () => {
    expect(sensitiveLogs("console.log(refreshToken);")).toEqual([1]);
  });
  test("ein Fehlerobjekt allein ist kein Fund", () => {
    expect(sensitiveLogs('console.error("[x] failed:", e);')).toEqual([]);
  });
});

describe("headersSet", () => {
  test("erkennt gesetzte Kopfzeilen, Groß-/Kleinschreibung egal", () => {
    expect(headersSet('h.set("X-Content-Type-Options", "nosniff")')).toEqual(["x-content-type-options"]);
  });
});

describe("bindsAllInterfaces", () => {
  test("ohne hostname: alle Schnittstellen", () => {
    expect(bindsAllInterfaces("const serveOptions = {\n  port: 1,\n  async route(")).toBe(true);
  });
  test("0.0.0.0: alle Schnittstellen", () => {
    expect(bindsAllInterfaces('const serveOptions = {\n  hostname: "0.0.0.0",\n  async route(')).toBe(true);
  });
  test("127.0.0.1: nur lokal", () => {
    expect(bindsAllInterfaces('const serveOptions = {\n  hostname: "127.0.0.1",\n  async route(')).toBe(false);
  });
});

describe("auditCounts", () => {
  test("zählt nach Schwere über alle Pakete", () => {
    expect(auditCounts({ a: [{ severity: "high" }, { severity: "moderate" }], b: [{ severity: "high" }] }))
      .toEqual({ critical: 0, high: 2, moderate: 1, low: 0 });
  });
  test("leere oder fehlende Antwort zählt null", () => {
    expect(auditCounts(null)).toEqual({ critical: 0, high: 0, moderate: 0, low: 0 });
  });
});

/* ── Invarianten gegen den echten Code (nur lesend) ──────────────────────── */

describe("Invarianten: server.js", () => {
  const src = readFileSync(new URL("../../server.js", import.meta.url), "utf8");

  test("das Routen-Inventar findet die Anmelderouten (Heuristik greift noch)", () => {
    // Bricht, wenn server.js so umgebaut wird, dass die Einrückungs-Heuristik
    // nichts mehr sieht — dann muss routeInventory nachziehen.
    expect(routeInventory(src).filter((r) => r.authed).length).toBeGreaterThan(0);
  });

  test("die Entwicklungs-Routen mit Personendaten sind nur lokal erreichbar", () => {
    expect(localOnlyPaths(src).sort()).toEqual(["/api/cast-backup", "/api/journal-backup"]);
  });

  test("CORS antwortet nie mit Wildcard", () => {
    const cors = corsOrigins(src);
    expect(cors.wildcard).toBe(false);
    expect(cors.list).not.toBeNull();
  });
});

describe("Invarianten: Datenbank", () => {
  test("jede Tabelle in den Migrationen hat RLS", () => {
    const dir = new URL("../../supabase/migrations/", import.meta.url);
    const sql = readdirSync(dir).filter((f) => f.endsWith(".sql")).map((f) => readFileSync(new URL(f, dir), "utf8")).join("\n");
    const r = rlsGaps(sql);
    expect(r.tables).toBeGreaterThan(0); // null Tabellen hieße: Muster blind, nicht „alles gut“
    expect(r.gaps).toEqual([]);
  });
});
