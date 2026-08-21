import { test, expect } from "bun:test";

/* Die Uhren von Server und Client müssen zueinander passen — und sie
 * stehen in zwei verschiedenen Dateien, also driften sie.
 *
 * Anlass (21.08.2026): Bun.serve trennt eine Verbindung nach 10 Sekunden
 * ohne Datenverkehr, und genau so sieht ein Bild-Render von aussen aus.
 * Jede Generierung unter Last starb mit „AbortError: The connection was
 * closed" — einem Fehler, der nach fal klang und unserer war. Isoliert
 * nachgestellt: derselbe Handler stirbt mit der Voreinstellung nach 10 s
 * und läuft mit idleTimeout durch.
 *
 * Die Regel, die hier festgenagelt wird: Der Server muss LÄNGER warten
 * als der Client. Sonst gewinnt er das Wettrennen, und der Mensch sieht
 * eine nackte 500 statt der ehrlichen „Der Dienst hat nicht geantwortet"-
 * Meldung, die api.js für genau diesen Fall baut.
 *
 * Quelltext-Prüfung statt Laufzeit-Prüfung: server.js startet beim
 * Importieren einen echten Server auf Port 8100 — in einem Testlauf ist
 * das keine Prüfung, sondern ein Nebeneffekt. */
// Unterstriche raus: `180_000` ist gültiges JavaScript, aber Number()
// macht daraus NaN — und ein NaN-Vergleich ist immer falsch, also hätte
// der Test stumm alles durchgelassen. Beim ersten Lauf aufgefallen.
const num = (src, re) => Number((src.match(re)?.[1] || "").replace(/_/g, ""));

test("the server waits longer for any request than the client does", async () => {
  const server = await Bun.file(new URL("../../server.js", import.meta.url)).text();
  const client = await Bun.file(new URL("./api.js", import.meta.url)).text();

  const idle = num(server, /idleTimeout:\s*(\d+)/);
  const clientWait = num(client, /default:\s*([\d_]+)/);

  expect(idle).toBeGreaterThan(0);                   // ohne die Zeile stirbt jede lange Anfrage
  expect(clientWait).toBeGreaterThan(0);             // und ohne diese liefe der Client ewig
  expect(idle * 1000).toBeGreaterThan(clientWait);   // Server überlebt den Client, nicht umgekehrt
});

/* Die eigentliche Lehre aus dem 21.08.: Kein Renderpfad darf auf einer
   gehaltenen Verbindung warten — weder Bild noch Bogen noch Film. Alle
   drei geben einen Auftrag ab, den awaitJob im Hintergrund abholt.
   Diese Zeilen fallen rot, sobald jemand einen Sofort-Render
   zurückbaut. */
test("no render path waits on a held-open connection", async () => {
  const server = await Bun.file(new URL("../../server.js", import.meta.url)).text();
  const client = await Bun.file(new URL("./api.js", import.meta.url)).text();

  // Server: die Renderrouten antworten mit einer Auftragsnummer.
  expect(server).toContain("falSubmitImage");
  expect(server).not.toMatch(/return json\(\{ ok: true, urls: await storeAll\(urls\) \}\)/);

  // Client: es gibt eine Schleife, die nachfragt, statt zu warten.
  expect(client).toContain("export async function awaitJob");
  expect(client).toContain("export async function renderImages");
});
