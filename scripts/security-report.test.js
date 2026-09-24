/* Die Sperren von security-report.mjs, als echter Aufruf des Skripts.
 *
 * Isoliert: Jeder Test bekommt ein eigenes Wegwerf-Verzeichnis (mkdtemp) und
 * räumt es in afterEach ab. Kein Test schreibt nach ~/Claude/Sicherheitsberichte
 * — `--out` zeigt immer ins Wegwerf-Verzeichnis. Die Sperr-Tests brechen vor
 * Chrome ab und laufen überall; nur der Durchlauf mit PDF braucht Chrome und
 * wird ohne übersprungen, statt rot zu werden.
 */
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, rmSync, statSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const SCRIPT = join(import.meta.dir, "security-report.mjs");
const CHROME = process.env.CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const validReport = (findings) => ({
  meta: { date: "2026-09-24", branch: "test", commit: "abc1234", scope: "Test" },
  summary: "Eine Zusammenfassung mit genug Zeichen.",
  findings: findings ?? [{ key: "k1", title: "T", severity: "high", status: "neu", description: "d", evidence: "e", recommendation: "r" }],
  passed: [],
  not_checked: [],
});

let dir;
beforeEach(() => { dir = mkdtempSync(join(tmpdir(), "dr-report-test-")); });
afterEach(() => { rmSync(dir, { recursive: true, force: true }); });

function run(report, ...extra) {
  const input = join(dir, "bericht.json");
  writeFileSync(input, typeof report === "string" ? report : JSON.stringify(report));
  return spawnSync("bun", [SCRIPT, input, ...extra], { encoding: "utf8" });
}
const pdfs = (d) => (existsSync(d) ? readdirSync(d).filter((f) => f.endsWith(".pdf")) : []);

describe("Sperren", () => {
  test("Ziel in einem Git-Arbeitsbaum: Ausgang 2", () => {
    spawnSync("git", ["init", "-q", dir]);
    expect(run(validReport(), "--out", join(dir, "berichte")).status).toBe(2);
  });

  test("Ziel in einem Git-Arbeitsbaum: kein Ordner angelegt", () => {
    spawnSync("git", ["init", "-q", dir]);
    run(validReport(), "--out", join(dir, "berichte", "tief"));
    expect(existsSync(join(dir, "berichte"))).toBe(false);
  });

  test("Geheimniswert im Bericht: Ausgang 1, kein PDF", () => {
    const r = validReport();
    r.findings[0].evidence = "Wert " + "s" + "k-" + "Qw7eR9tY2uI4oP6aQw7eR9tY2uI4";
    const out = join(dir, "out");
    expect(run(r, "--out", out).status).toBe(1);
    expect(pdfs(out)).toEqual([]);
  });

  test("Geheimniswert in der Skriptausgabe (--mech): Ausgang 1", () => {
    const mech = join(dir, "check.json");
    writeFileSync(mech, JSON.stringify({ results: [{ ids: [1], title: "x", status: "ok", detail: "AI" + "za" + "Qw7eR9tY2uI4oP6aQw7eR9tY2uI4oP6aQw7", evidence: [] }] }));
    expect(run(validReport(), "--mech", mech, "--out", join(dir, "out")).status).toBe(1);
  });

  test("ungültiger Bericht: Ausgang 1 mit Fehlerliste", () => {
    const r = run({ meta: {}, summary: "kurz", findings: [], passed: [], not_checked: [] }, "--out", join(dir, "out"));
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("meta.date fehlt");
  });

  test("kein JSON: Ausgang 1", () => {
    expect(run("das ist kein json", "--out", join(dir, "out")).status).toBe(1);
  });

  test("ohne Eingabedatei: Ausgang 2", () => {
    expect(spawnSync("bun", [SCRIPT], { encoding: "utf8" }).status).toBe(2);
  });
});

describe.skipIf(!existsSync(CHROME))("Durchlauf mit Chrome", () => {
  test("schreibt PDF und JSON mit Rechten 600", () => {
    const out = join(dir, "out");
    expect(run(validReport(), "--out", out).status).toBe(0);
    const files = readdirSync(out);
    expect(files.filter((f) => /^\d{4}-\d{2}-\d{2}-\d{6}\.(pdf|json)$/.test(f))).toHaveLength(2);
    for (const f of files) expect(statSync(join(out, f)).mode & 0o777).toBe(0o600);
    expect(statSync(out).mode & 0o777).toBe(0o700);
  }, 60_000);

  test("zweiter Lauf stuft einen wiedergefundenen Befund als „offen“ ein", async () => {
    const out = join(dir, "out");
    expect(run(validReport(), "--out", out).status).toBe(0);
    await Bun.sleep(1100); // Dateiname hat Sekunden — der zweite Lauf braucht einen eigenen
    expect(run(validReport(), "--out", out).status).toBe(0);
    const latest = readdirSync(out).filter((f) => f.endsWith(".json")).sort().pop();
    expect(JSON.parse(readFileSync(join(out, latest), "utf8")).findings[0].status).toBe("offen");
  }, 60_000);
});
