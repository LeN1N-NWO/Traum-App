import { describe, expect, test } from "bun:test";
import { validateReport, sortFindings, compareRuns, countBySeverity, overallRating, renderReportHtml, esc, cssStr } from "./securityReport.js";

const f = (key, severity, status = "neu", extra = {}) => ({
  key, severity, status, title: `Befund ${key}`, description: "Beschreibung", evidence: "server.js:1", recommendation: "Beheben", ...extra,
});
const report = (findings) => ({
  meta: { date: "2026-09-24", branch: "main", commit: "abc1234", scope: "server.js, mobile/, supabase/" },
  summary: "Eine Zusammenfassung mit genug Zeichen.",
  findings,
  passed: [{ points: [7], check: "RLS", why_sharp: "Probe mit fehlender RLS schlägt an" }],
  not_checked: [{ what: "Supabase-Dashboard", why: "kein Zugang", how: "Auth → URL Configuration" }],
});

describe("validateReport", () => {
  test("ein vollständiger Bericht ist gültig", () => {
    expect(validateReport(report([f("A", "high")]))).toEqual([]);
  });
  test("meldet alle Fehler auf einmal", () => {
    const r = report([f("A", "schlimm", "vielleicht"), f("A", "low", "neu", { evidence: "" })]);
    delete r.meta.commit;
    const e = validateReport(r);
    expect(e).toContain("meta.commit fehlt");
    expect(e.some((x) => x.includes("severity „schlimm“"))).toBe(true);
    expect(e.some((x) => x.includes("status „vielleicht“"))).toBe(true);
    expect(e.some((x) => x.includes("key doppelt"))).toBe(true);
    expect(e.some((x) => x.includes("evidence fehlt"))).toBe(true);
  });
  test("kein Objekt", () => {
    expect(validateReport(null)).toEqual(["Bericht ist kein Objekt"]);
  });
});

test("sortFindings: kritisch zuerst, innerhalb der Stufe neu vor bekannt", () => {
  const s = sortFindings([f("a", "low"), f("b", "critical", "bekannt"), f("c", "critical", "neu"), f("d", "info")]);
  expect(s.map((x) => x.key)).toEqual(["c", "b", "a", "d"]);
});

test("compareRuns: neu, behoben, höher eingestuft", () => {
  const prev = report([f("A", "low"), f("B", "high")]);
  const now = report([f("A", "critical"), f("C", "medium")]);
  expect(compareRuns(now, prev)).toEqual({
    since: "2026-09-24", added: ["C"], resolved: [{ key: "B", title: "Befund B", severity: "high" }], escalated: ["A"],
  });
  expect(compareRuns(now, null)).toBeNull();
});

test("countBySeverity und overallRating", () => {
  const xs = [f("a", "high"), f("b", "high"), f("c", "info")];
  expect(countBySeverity(xs)).toEqual({ critical: 0, high: 2, medium: 0, low: 0, info: 1 });
  expect(overallRating(xs).label).toBe("Hoch");
  expect(overallRating([]).id).toBe("none");
});

describe("renderReportHtml", () => {
  test("escapet alles, was aus dem Bericht kommt", () => {
    const html = renderReportHtml(report([f("X", "high", "neu", { title: "<script>alert(1)</script>" })]));
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;");
  });
  test("Reihenfolge im Dokument folgt der Kritikalität", () => {
    const html = renderReportHtml(report([f("L", "low", "neu", { title: "Niedriger Fund" }), f("K", "critical", "neu", { title: "Kritischer Fund" })]));
    expect(html.indexOf("Kritischer Fund")).toBeLessThan(html.indexOf("Niedriger Fund"));
    expect(html).toContain("F-01");
  });
  test("Vertraulichkeitsvermerk, Deckblatt-Urteil und Anhang", () => {
    const html = renderReportHtml(report([f("K", "critical")]), { results: [{ ids: [2], title: "Env", status: "ok", detail: "gut", evidence: [] }] });
    expect(html).toContain("VERTRAULICH");
    expect(html).toContain("Gesamtbewertung");
    expect(html).toContain("Anhang A");
  });
  test("Prompt-Ketten-Hinweis nur, wenn gesetzt", () => {
    expect(renderReportHtml(report([f("P", "low", "neu", { touches_prompt_chain: true })]))).toContain("Prompt-Kette");
    expect(renderReportHtml(report([f("P", "low")]))).not.toContain("berührt die Prompt-Kette");
  });
});

test("esc", () => {
  expect(esc(`<a href="x">'&'</a>`)).toBe("&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;");
});

test("cssStr bricht weder die CSS-Regel noch die style-Sektion", () => {
  expect(cssStr('a"b\\c\n</style>')).toBe('a\\"b\\\\c \\3c /style>');
  const html = renderReportHtml({ ...report([]), meta: { ...report([]).meta, branch: 'x"}</style><script>' } });
  expect(html).not.toContain("</style><script>");
});
