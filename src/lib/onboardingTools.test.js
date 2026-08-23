import { test, expect } from "bun:test";
import { readFileSync } from "node:fs";

/* Die Einführungsumfrage hängt an DREI Stellen, die auseinanderlaufen
   können, ohne dass irgendetwas kaputtgeht:

     · server.js  ONBOARDING_TOOLS  — was Gemini aufrufen DARF
     · server.js  onboardingSystem  — wonach überhaupt gefragt wird
     · OnboardingSurvey.jsx onTool  — was davon ankommt

   Ein Werkzeug ohne Frage wird nie aufgerufen. Eine Frage ohne Werkzeug
   landet nirgends. Ein Werkzeug ohne Auswertung wird stillschweigend
   weggeworfen — und genau das ist der Fehler, der nicht auffällt: Das
   Gespräch läuft, der Mensch antwortet, und die Antwort verschwindet.

   Deshalb wird hier der QUELLTEXT verglichen, nicht das Verhalten. Ein
   Verhaltenstest bräuchte einen Gemini-Anschluss; dieser hier läuft in
   Millisekunden und schlägt genau dann an, wenn jemand eines der drei
   Stücke anfasst und die anderen vergisst. */

const server = readFileSync(new URL("../../server.js", import.meta.url), "utf8");
const survey = readFileSync(
  new URL("../screens/Onboarding/OnboardingSurvey.jsx", import.meta.url), "utf8");

const toolBlock = server.match(/const ONBOARDING_TOOLS = \[([\s\S]*?)\n\}\];/)?.[1] || "";
const briefing = server.match(/function onboardingSystem\(([\s\S]*?)\n\}/)?.[1] || "";
const werkzeuge = [...toolBlock.matchAll(/name: "(\w+)"/g)].map((m) => m[1]);

test("the survey defines the tools it is supposed to", () => {
  expect(werkzeuge).toContain("setGoal");
  expect(werkzeuge).toContain("setSleepHours");
  expect(werkzeuge).toContain("setTimeBudget");
  expect(werkzeuge).toContain("setReminderWish");
  expect(werkzeuge).toContain("finish");
});

test("every tool is actually asked for in the briefing", () => {
  const fehlend = werkzeuge.filter((w) => w !== "finish" && !briefing.includes(w));
  expect(fehlend).toEqual([]);
});

test("every tool is picked up by the client — an unread answer is a lost answer", () => {
  const fehlend = werkzeuge.filter((w) => !survey.includes(`"${w}"`));
  expect(fehlend).toEqual([]);
});

/* ⚠ Der Grund für diese Datei überhaupt: „Albträume überwinden" fehlte
   bei uns ganz, während es bei zwei Wettbewerbern unter den fünf
   Hauptzielen steht. Wer den Wert wieder herausnimmt, soll hier
   stolpern.

   ⚠⚠ Die erste Fassung prüfte `toolBlock.toContain("nightmares")` und war
   WERTLOS: Der Kommentar über setGoal, der den Wert begründet, enthält
   das Wort selbst. Die Rot-Probe (Wert aus der description entfernen)
   lief glatt durch, weil der Text drei Zeilen höher stehen blieb.
   Geprüft wird deshalb die description SELBST — die Zeichenkette, die
   Gemini tatsächlich zu sehen bekommt. */
test("nightmares are a goal one can name", () => {
  /* ⚠ Nicht die erste description nach „setGoal" nehmen — das ist die des
     WERKZEUGS („What draws them to their dreams."). Gemeint ist die des
     Feldes `goal`, in der die erlaubten Werte stehen. Auch dieser Fehler
     ist beim Rot-Probieren aufgefallen, nicht beim Schreiben. */
  const goalTool = toolBlock.match(/goal: \{ type: "STRING", description: "([^"]*)" \}/);
  const werte = (goalTool?.[1] || "").split("|").map((v) => v.trim());
  expect(werte).toContain("nightmares");
  expect(werte).toContain("remember");
});

/* Die Reihenfolge ist Absicht: Wer wegen Albträumen kommt, soll nicht
   fünf Fragen lang warten, bis jemand fragt, warum er da ist. */
test("the goal is asked before the small talk", () => {
  const iZiel = briefing.indexOf("setGoal");
  const iThemen = briefing.indexOf("addTheme");
  const iLuzide = briefing.indexOf("setLucidLevel");
  expect(iZiel).toBeGreaterThan(-1);
  expect(iZiel).toBeLessThan(iThemen);
  expect(iZiel).toBeLessThan(iLuzide);
});

/* Die härteste Zusage in diesem ganzen Ablauf: Die Stimme schaltet
   nichts ein. iOS gibt einen Versuch, und eine verhörte Silbe darf ihn
   nicht verbrauchen (lib/reminders.js). Das Briefing MUSS das sagen —
   sonst verspricht der Assistent im Gespräch etwas, das nicht passiert. */
test("the briefing forbids claiming reminders are switched on", () => {
  expect(briefing).toMatch(/only WRITES DOWN a wish/i);
  expect(briefing).toMatch(/tap/i);
});
