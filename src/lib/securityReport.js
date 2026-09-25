/* Der Sicherheitsbericht als Security-Assessment-Report — reine Funktionen:
 * prüfen, sortieren, mit dem letzten Lauf vergleichen, als HTML setzen.
 * Das PDF daraus macht scripts/security-report.mjs (Chrome headless).
 *
 * Der Agent (.claude/agents/security-expert.md) liefert JSON in der Form,
 * die validateReport() prüft. Absichtlich JSON und nicht Markdown: Die
 * Kritikalität ist ein Feld, kein Wort im Fließtext — sonst sortiert am Ende
 * doch wieder ein Mensch nach Gefühl.
 *
 * Alles, was aus dem Bericht ins HTML geht, läuft durch esc(). Die Befunde
 * zitieren Code, und Code enthält `<`.
 */

export const SEVERITIES = [
  { id: "critical", label: "Kritisch", color: "#9b1c1c", bg: "#fde8e8",
    rule: "Heute ohne Voraussetzung ausnutzbar: direkter Geldverlust, Personendaten Dritter (Gesichter = DSGVO Art. 9) oder Kontoübernahme." },
  { id: "high", label: "Hoch", color: "#b45309", bg: "#fef3c7",
    rule: "Mit geringer Voraussetzung ausnutzbar (gleiches WLAN, erratbare Adresse) — oder wird kritisch mit dem nächsten geplanten Schritt (Hosting, TestFlight extern, Store)." },
  { id: "medium", label: "Mittel", color: "#a16207", bg: "#fefce8",
    rule: "Braucht mehrere Voraussetzungen oder Insiderwissen; Schaden begrenzt oder aufwendig." },
  { id: "low", label: "Niedrig", color: "#1e40af", bg: "#e0ecff",
    rule: "Härtung und Tiefenverteidigung: kein eigener Angriffsweg, aber eine Schicht weniger." },
  { id: "info", label: "Info", color: "#4b5563", bg: "#f3f4f6",
    rule: "Beobachtung ohne Handlungsbedarf, oder eine Frage an Hanni/Anton." },
];
const SEV = Object.fromEntries(SEVERITIES.map((s, i) => [s.id, { ...s, rank: i }]));

export const STATUSES = {
  neu: "Neu",
  bekannt: "Bekannt, entschieden",
  offen: "Offen seit letztem Lauf",
};

/**
 * Prüft den Bericht des Agenten. Wirft nicht, sondern sammelt — der Läufer
 * zeigt alle Fehler auf einmal.
 * @returns {string[]}
 */
export function validateReport(r) {
  const errors = [];
  if (!r || typeof r !== "object") return ["Bericht ist kein Objekt"];
  for (const k of ["date", "branch", "commit", "scope"]) {
    if (!r.meta?.[k]) errors.push(`meta.${k} fehlt`);
  }
  if (typeof r.summary !== "string" || r.summary.length < 20) errors.push("summary fehlt oder ist zu kurz");
  if (!Array.isArray(r.findings)) errors.push("findings ist keine Liste");
  const keys = new Set();
  (r.findings || []).forEach((f, i) => {
    const at = `findings[${i}]${f?.key ? ` (${f.key})` : ""}`;
    for (const k of ["key", "title", "severity", "status", "description", "evidence", "recommendation"]) {
      if (!f?.[k] || (typeof f[k] === "string" && !f[k].trim())) errors.push(`${at}: ${k} fehlt`);
    }
    if (f?.severity && !SEV[f.severity]) errors.push(`${at}: severity „${f.severity}“ unbekannt (${Object.keys(SEV).join(", ")})`);
    if (f?.status && !STATUSES[f.status]) errors.push(`${at}: status „${f.status}“ unbekannt (${Object.keys(STATUSES).join(", ")})`);
    if (f?.key && keys.has(f.key)) errors.push(`${at}: key doppelt`);
    keys.add(f?.key);
  });
  if (!Array.isArray(r.passed)) errors.push("passed ist keine Liste");
  if (!Array.isArray(r.not_checked)) errors.push("not_checked ist keine Liste");
  return errors;
}

/** Kritischste zuerst; bei gleicher Stufe Neues vor Bekanntem. */
export function sortFindings(findings) {
  const st = { neu: 0, offen: 1, bekannt: 2 };
  return [...findings].sort((a, b) => SEV[a.severity].rank - SEV[b.severity].rank
    || (st[a.status] ?? 9) - (st[b.status] ?? 9)
    || String(a.key).localeCompare(String(b.key)));
}

/** Vergleich mit dem letzten Lauf über die stabilen Schlüssel. */
export function compareRuns(current, previous) {
  if (!previous) return null;
  const now = new Map(current.findings.map((f) => [f.key, f]));
  const before = new Map((previous.findings || []).map((f) => [f.key, f]));
  return {
    since: previous.meta?.date || "?",
    added: [...now.keys()].filter((k) => !before.has(k)),
    resolved: [...before.values()].filter((f) => !now.has(f.key)).map((f) => ({ key: f.key, title: f.title, severity: f.severity })),
    escalated: [...now.values()].filter((f) => before.has(f.key) && SEV[f.severity]?.rank < SEV[before.get(f.key).severity]?.rank).map((f) => f.key),
  };
}

export function countBySeverity(findings) {
  const c = Object.fromEntries(SEVERITIES.map((s) => [s.id, 0]));
  for (const f of findings) if (f.severity in c) c[f.severity]++;
  return c;
}

/** Gesamturteil für das Deckblatt: die schlimmste offene Stufe. */
export function overallRating(findings) {
  const worst = sortFindings(findings)[0];
  return worst ? SEV[worst.severity] : { id: "none", label: "Keine Befunde", color: "#166534", bg: "#dcfce7" };
}

/** Für CSS-Zeichenketten in content: "…" — Anführungszeichen, Backslash und
 *  Zeilenumbruch würden die Regel brechen, `<` die style-Sektion. */
export function cssStr(s) {
  return String(s ?? "").replace(/[\\"]/g, "\\$&").replace(/[\n\r]/g, " ").replace(/</g, "\\3c ");
}

export function esc(s) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

/** Absätze und `Code` im Fließtext, sonst nichts — kein Markdown-Parser. */
function prose(s) {
  return esc(s).split(/\n{2,}/).map((p) => `<p>${p.replace(/`([^`]+)`/g, "<code>$1</code>").replace(/\n/g, "<br>")}</p>`).join("");
}

const badge = (sev) => `<span class="badge" style="color:${SEV[sev].color};background:${SEV[sev].bg};border-color:${SEV[sev].color}">${esc(SEV[sev].label)}</span>`;
const list = (xs) => (Array.isArray(xs) ? xs : xs ? [xs] : []);

/**
 * Das ganze Dokument als HTML für den Druck (A4).
 * @param {object} r        validierter Bericht des Agenten
 * @param {object} [mech]   Ausgabe von `security-check.mjs --json`
 * @param {object} [delta]  compareRuns()
 */
export function renderReportHtml(r, mech = null, delta = null) {
  const findings = sortFindings(r.findings);
  const counts = countBySeverity(findings);
  const rating = overallRating(findings);
  const max = Math.max(1, ...Object.values(counts));
  const ids = new Map(findings.map((f, i) => [f.key, `F-${String(i + 1).padStart(2, "0")}`]));

  const bars = SEVERITIES.map((s) => `
    <div class="bar-row"><span class="bar-label">${esc(s.label)}</span>
      <span class="bar-track"><span class="bar" style="width:${(counts[s.id] / max) * 100}%;background:${s.color}"></span></span>
      <span class="bar-n">${counts[s.id]}</span></div>`).join("");

  const deltaHtml = delta ? `
    <h3>Veränderung seit dem letzten Lauf (${esc(delta.since)})</h3>
    <ul class="delta">
      <li><b>${delta.added.length}</b> neu${delta.added.length ? ": " + delta.added.map((k) => `${ids.get(k)} ${esc(findings.find((f) => f.key === k)?.title)}`).join("; ") : ""}</li>
      <li><b>${delta.resolved.length}</b> behoben${delta.resolved.length ? ": " + delta.resolved.map((f) => esc(f.title)).join("; ") : ""}</li>
      ${delta.escalated.length ? `<li><b>${delta.escalated.length}</b> höher eingestuft: ${delta.escalated.map((k) => ids.get(k)).join(", ")}</li>` : ""}
    </ul>` : `<p class="muted">Kein früherer Bericht gefunden — dies ist die Ausgangslage.</p>`;

  const overview = findings.length ? `
    <table class="overview">
      <thead><tr><th>ID</th><th>Befund</th><th>Kritikalität</th><th>Status</th><th>Liste</th><th>Aufwand</th></tr></thead>
      <tbody>${findings.map((f) => `<tr>
        <td class="mono">${ids.get(f.key)}</td><td>${esc(f.title)}</td><td>${badge(f.severity)}</td>
        <td>${esc(STATUSES[f.status])}</td><td class="mono">${esc(list(f.points).join(", "))}</td><td>${esc(f.effort || "–")}</td></tr>`).join("")}
      </tbody></table>` : `<p>Keine Befunde.</p>`;

  const detail = findings.map((f) => `
    <section class="finding" style="border-left-color:${SEV[f.severity].color}">
      <div class="finding-head">
        <span class="mono fid">${ids.get(f.key)}</span>
        <h3>${esc(f.title)}</h3>
        ${badge(f.severity)}
      </div>
      <table class="facts">
        <tr><th>Status</th><td>${esc(STATUSES[f.status])}${f.condition ? ` — Bedingung: ${esc(f.condition)}` : ""}</td></tr>
        <tr><th>Fundstelle</th><td class="mono">${list(f.location).map(esc).join("<br>") || "–"}</td></tr>
        <tr><th>Checklisten-Punkt</th><td>${esc(list(f.points).join(", ")) || "–"}</td></tr>
        ${f.effort ? `<tr><th>Aufwand</th><td>${esc(f.effort)}</td></tr>` : ""}
      </table>
      <h4>Beschreibung</h4>${prose(f.description)}
      <h4>Beleg</h4>${prose(f.evidence)}
      ${f.impact_now || f.impact_prod ? `<h4>Auswirkung</h4>
        <table class="facts"><tr><th>Heute (Prototyp)</th><td>${esc(f.impact_now || "–")}</td></tr>
        <tr><th>Ab öffentlichem Betrieb</th><td>${esc(f.impact_prod || "–")}</td></tr></table>` : ""}
      <h4>Empfehlung</h4>${prose(f.recommendation)}
      ${f.touches_prompt_chain ? `<p class="warn">⚠ Die Empfehlung berührt die Prompt-Kette bzw. die Bild-/Filmgenerierung — dort entscheidet nicht der Sicherheitscheck allein.</p>` : ""}
    </section>`).join("");

  const passed = r.passed.length ? `<table class="overview"><thead><tr><th>Liste</th><th>Geprüft</th><th>Warum die Prüfung hätte anschlagen können</th></tr></thead><tbody>
    ${r.passed.map((p) => `<tr><td class="mono">${esc(list(p.points).join(", "))}</td><td>${esc(p.check)}</td><td>${esc(p.why_sharp || "–")}</td></tr>`).join("")}
    </tbody></table>` : `<p class="muted">—</p>`;

  const notChecked = r.not_checked.length ? `<table class="overview"><thead><tr><th>Was</th><th>Warum nicht</th><th>So prüft es ein Mensch</th></tr></thead><tbody>
    ${r.not_checked.map((n) => `<tr><td>${esc(n.what)}</td><td>${esc(n.why)}</td><td>${esc(n.how || "–")}</td></tr>`).join("")}
    </tbody></table>` : `<p class="muted">—</p>`;

  const MECH = { fail: ["❌", "#9b1c1c"], warn: ["⚠", "#b45309"], skip: ["⏭", "#4b5563"], info: ["ℹ", "#1e40af"], ok: ["✓", "#166534"] };
  const mechHtml = mech?.results ? `
    <h2 class="pb">Anhang A — Mechanische Prüfungen</h2>
    <p class="muted">Ausgabe von <code>scripts/security-check.mjs</code>. Jeder Detektor hat vor dem Lauf seine Probe bestanden (Selbsttest).</p>
    <table class="overview mech"><thead><tr><th></th><th>Liste</th><th>Prüfung</th><th>Ergebnis</th></tr></thead><tbody>
    ${mech.results.map((m) => `<tr><td style="color:${MECH[m.status]?.[1]}">${MECH[m.status]?.[0] || ""}</td>
      <td class="mono">${esc(list(m.ids).join(","))}</td><td>${esc(m.title)}</td>
      <td>${esc(m.detail)}${m.evidence?.length ? `<ul class="ev">${m.evidence.slice(0, 12).map((e) => `<li>${esc(e)}</li>`).join("")}${m.evidence.length > 12 ? `<li>… ${m.evidence.length - 12} weitere</li>` : ""}</ul>` : ""}</td></tr>`).join("")}
    </tbody></table>` : "";

  const m = r.meta;
  return `<!doctype html>
<html lang="de"><head><meta charset="utf-8">
<title>Security Assessment Report — Dream Rushes — ${esc(m.date)}</title>
<style>
  /* Kopf und Fuß als Randfelder der Seite, nicht als position: fixed —
     fixierte Elemente setzt Chrome in den Inhaltsbereich, wo sie über den
     Überschriften lagen (gesehen im ersten Probe-PDF). */
  @page {
    size: A4; margin: 20mm 16mm 20mm;
    @top-right { content: "VERTRAULICH — NICHT INS REPOSITORY"; font: 700 7.5pt -apple-system, Helvetica, sans-serif; letter-spacing: .12em; color: #9b1c1c; }
    @bottom-left { content: "Dream Rushes · Security Assessment · ${cssStr(m.date)} · ${cssStr(m.branch)} @ ${cssStr(m.commit)}"; font: 7.5pt -apple-system, Helvetica, sans-serif; color: #6b7280; }
    @bottom-right { content: "Seite " counter(page) " von " counter(pages); font: 7.5pt -apple-system, Helvetica, sans-serif; color: #6b7280; }
  }
  @page :first { @bottom-left { content: none; } @bottom-right { content: none; } }
  * { box-sizing: border-box; }
  body { font: 10pt/1.45 -apple-system, "Helvetica Neue", Helvetica, Arial, sans-serif; color: #111827; margin: 0; }
  h1 { font-size: 26pt; line-height: 1.1; margin: 0 0 6mm; letter-spacing: -.01em; }
  h2 { font-size: 15pt; margin: 0 0 4mm; padding-bottom: 2mm; border-bottom: 1.5px solid #111827; }
  h3 { font-size: 11.5pt; margin: 5mm 0 2mm; }
  h4 { font-size: 9pt; text-transform: uppercase; letter-spacing: .06em; color: #4b5563; margin: 4mm 0 1mm; }
  p { margin: 0 0 2mm; }
  code, .mono { font-family: "SF Mono", Menlo, Consolas, monospace; font-size: 8.5pt; }
  code { background: #f3f4f6; padding: 0 3px; border-radius: 3px; }
  .pb { break-before: page; }
  .muted { color: #6b7280; }
  .cover { height: 250mm; display: flex; flex-direction: column; }
  .cover .kicker { font-size: 9pt; letter-spacing: .18em; text-transform: uppercase; color: #6b7280; margin-top: 30mm; }
  .cover .conf { display: inline-block; margin: 0 0 10mm; padding: 2mm 4mm; border: 1.5px solid #9b1c1c; color: #9b1c1c; font-weight: 700; letter-spacing: .12em; font-size: 9pt; }
  .rating { margin: 8mm 0; padding: 6mm; border-radius: 3mm; }
  .rating .big { font-size: 20pt; font-weight: 700; }
  .meta { border-collapse: collapse; margin-top: auto; width: 100%; }
  .meta th { text-align: left; width: 38mm; color: #6b7280; font-weight: 500; padding: 1.2mm 0; vertical-align: top; }
  .meta td { padding: 1.2mm 0; }
  .tiles { display: flex; gap: 3mm; margin: 4mm 0 6mm; }
  .tile { flex: 1; padding: 3mm; border-radius: 2mm; text-align: center; border: 1px solid; }
  .tile .n { font-size: 20pt; font-weight: 700; line-height: 1.1; }
  .tile .l { font-size: 8pt; text-transform: uppercase; letter-spacing: .06em; }
  .bar-row { display: flex; align-items: center; gap: 3mm; margin: 1mm 0; }
  .bar-label { width: 20mm; font-size: 9pt; }
  .bar-track { flex: 1; height: 3.5mm; background: #f3f4f6; border-radius: 2mm; overflow: hidden; }
  .bar { display: block; height: 100%; }
  .bar-n { width: 8mm; text-align: right; font-weight: 600; }
  .badge { display: inline-block; padding: .3mm 2.2mm; border-radius: 10mm; font-size: 8pt; font-weight: 700; border: 1px solid; white-space: nowrap; }
  table.overview { width: 100%; border-collapse: collapse; font-size: 9pt; margin: 2mm 0 5mm; }
  table.overview th { text-align: left; font-size: 8pt; text-transform: uppercase; letter-spacing: .05em; color: #4b5563; border-bottom: 1.5px solid #111827; padding: 1.5mm 2mm 1.5mm 0; }
  table.overview td { border-bottom: 1px solid #e5e7eb; padding: 1.8mm 2mm 1.8mm 0; vertical-align: top; }
  table.overview tr { break-inside: avoid; }
  .finding { border-left: 4px solid; padding: 1mm 0 2mm 5mm; margin: 0 0 8mm; break-inside: auto; }
  .finding-head { display: flex; align-items: baseline; gap: 3mm; break-after: avoid; }
  .finding-head h3 { flex: 1; margin: 0; }
  .fid { color: #6b7280; }
  table.facts { border-collapse: collapse; margin: 2mm 0; font-size: 9pt; width: 100%; }
  table.facts th { text-align: left; width: 38mm; color: #6b7280; font-weight: 500; padding: .8mm 0; vertical-align: top; }
  table.facts td { padding: .8mm 0; }
  .warn { background: #fef3c7; padding: 2mm 3mm; border-radius: 2mm; font-size: 9pt; }
  .delta { margin: 0 0 4mm; padding-left: 5mm; }
  .scale td:first-child { width: 24mm; }
  .mech td:first-child { width: 6mm; font-weight: 700; }
  .ev { margin: 1mm 0 0; padding-left: 4mm; color: #4b5563; font-size: 8pt; font-family: "SF Mono", Menlo, monospace; overflow-wrap: anywhere; }
</style></head>
<body>

<section class="cover">
  <div class="kicker">Security Assessment Report</div>
  <h1>Dream Rushes<br><span style="font-weight:400;color:#4b5563">App, Server und Datenbank</span></h1>
  <div><span class="conf">VERTRAULICH</span></div>
  <div class="rating" style="background:${rating.bg};border-left:5px solid ${rating.color}">
    <div class="muted" style="font-size:8.5pt;text-transform:uppercase;letter-spacing:.08em">Gesamtbewertung — höchste offene Stufe</div>
    <div class="big" style="color:${rating.color}">${esc(rating.label)}</div>
    <div>${findings.length} Befund(e): ${SEVERITIES.filter((s) => counts[s.id]).map((s) => `${counts[s.id]} ${esc(s.label)}`).join(" · ") || "keine"}</div>
  </div>
  <table class="meta">
    <tr><th>Datum</th><td>${esc(m.date)}</td></tr>
    <tr><th>Stand</th><td class="mono">${esc(m.branch)} @ ${esc(m.commit)}</td></tr>
    <tr><th>Umfang</th><td>${esc(m.scope)}</td></tr>
    ${m.focus ? `<tr><th>Schwerpunkt</th><td>${esc(m.focus)}</td></tr>` : ""}
    <tr><th>Seit</th><td>${esc(m.since || "erster Lauf")}</td></tr>
    <tr><th>Prüfer</th><td>${esc(m.assessor || "Agent security-expert (Claude) + scripts/security-check.mjs")}</td></tr>
    <tr><th>Methode</th><td>Quelltext-, Konfigurations- und Git-Prüfung. Kein Angriff auf laufende Systeme, keine bezahlten Aufrufe.</td></tr>
  </table>
</section>

<h2 class="pb">1 — Zusammenfassung für die Geschäftsführung</h2>
${prose(r.summary)}
<div class="tiles">${SEVERITIES.map((s) => `<div class="tile" style="border-color:${s.color};background:${s.bg};color:${s.color}"><div class="n">${counts[s.id]}</div><div class="l">${esc(s.label)}</div></div>`).join("")}</div>
${bars}
${deltaHtml}

<h2>2 — Befunde im Überblick</h2>
<p class="muted">Sortiert nach Kritikalität, innerhalb einer Stufe Neues zuerst. „Liste“ = Nummer auf der 50-Punkte-Checkliste.</p>
${overview}

<h2 class="pb">3 — Befunde im Detail</h2>
${detail || "<p>Keine Befunde.</p>"}

<h2 class="pb">4 — Geprüft und in Ordnung</h2>
${passed}

<h2>5 — Einschränkungen: nicht geprüft</h2>
${notChecked}

<h2>6 — Methodik und Bewertungsskala</h2>
<p>Zweistufig: Ein Skript prüft mechanisch (Geheimnismuster in Dateien und im gesamten Git-Verlauf, Anmeldepflicht der Routen, CORS, RLS, Abhängigkeiten); jeder Detektor muss vor dem Lauf eine eigene Probe finden, sonst bricht der Lauf ab. Danach prüft der Agent die Punkte, die Urteil brauchen (Rechteprüfung, IDOR, SSRF, Prompt-Injection, KI-Werkzeuge), ausschließlich lesend. Die Kritikalität richtet sich nach dem realen Schaden für dieses Projekt — Geld, Personendaten, Konten — und unterscheidet den heutigen Prototyp vom geplanten öffentlichen Betrieb.</p>
<table class="overview scale"><thead><tr><th>Stufe</th><th>Bedeutung</th></tr></thead><tbody>
${SEVERITIES.map((s) => `<tr><td>${badge(s.id)}</td><td>${esc(s.rule)}</td></tr>`).join("")}
</tbody></table>
<table class="overview"><thead><tr><th>Status</th><th>Bedeutung</th></tr></thead><tbody>
<tr><td>Neu</td><td>Erstmals gefunden.</td></tr>
<tr><td>Offen seit letztem Lauf</td><td>Schon im vorigen Bericht, nicht behoben, nicht bewusst entschieden.</td></tr>
<tr><td>Bekannt, entschieden</td><td>Bewusst hingenommen — mit Bedingung. Fällt die Bedingung, wird der Befund neu bewertet.</td></tr>
</tbody></table>
${mechHtml}
</body></html>`;
}
