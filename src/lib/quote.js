/* Der Preis eines Auftrags — EINE Rechnung für Client und Server.
 *
 * Hannis Übergabe (docs/uebergabe/2026-09-11-anton-credits-abbuchung.md,
 * Punkt 1): „Der Server rechnet den Preis selbst. Nie einen Preis vom
 * Client annehmen — sonst schickt jemand cost: 0 und rendert umsonst."
 *
 * Bis zum 11.09.2026 stand die Preisrechnung nur im Client (Step5Style,
 * JournalDetail, AppState) — der Server kannte überhaupt keine Kosten.
 * Diese Datei ist reine Logik ohne React, damit server.js sie genauso
 * importiert wie der Wizard: derselbe Auftrag ergibt auf beiden Seiten
 * dieselbe Zahl, weil es dieselbe Funktion ist.
 *
 * ── Antons Sorge: „der Preis kann sich unterscheiden" ───────────────────
 * Client und Server sind heute EIN Auslieferungsstand — solange beide aus
 * demselben Commit laufen, ist die Zahl identisch. Auseinander laufen sie
 * nur, wenn die native App (ein Bundle auf dem Gerät) älter ist als der
 * Server. Dafür gibt es `compareQuote()`:
 *   · Server billiger oder gleich  → rendern, zum SERVER-Preis. Niemand
 *     zahlt mehr als angezeigt.
 *   · Server teurer               → NICHT rendern, sondern den neuen Preis
 *     zurückmelden (HTTP 409), der Mensch bestätigt ihn. Das ist Antons
 *     Ultimatum: „Wenn der Preis eines Modells angehoben wird und wir es zu
 *     günstig verkaufen — das darf nicht passieren."
 * Latenz: null. Das ist eine lokale Rechnung aus der Modelltabelle, kein
 * Netzaufruf. Die spätere Abbuchung in der Datenbank ist EIN Roundtrip
 * nach Frankfurt (Größenordnung 20–60 ms) vor einem Render, der Minuten
 * dauert.
 *
 * ⚠ Was diese Datei NICHT löst: Wenn fal den Einkaufspreis anhebt, merkt
 * es niemand von selbst — die Tabelle in video.js ist von Hand gepflegt
 * (`bun scripts/preis-durchreichen.mjs` rechnet Einkauf gegen Verkauf).
 * Der Preisschutz hier greift erst, wenn die Tabelle nachgezogen ist.
 */
import { PRICES, PREVIEW_COUNT, priceForImages } from "./pricing.js";
import { priceForFilm, videoModel, clampSeconds, filmQuality } from "./video.js";

/**
 * Was ein Auftrag kostet, aus den Feldern, die auch der Server sieht.
 * Unbekanntes wird wie auf dem Server behandelt: unbekanntes Modell →
 * "standard", unbekannte Qualität → Vorgabe des Modells. So kann ein
 * manipulierter Body den Preis nicht nach unten ziehen.
 *
 * @param {object} order
 * @param {"film"|"image"|"scene"|"preview"|"character"} order.mode
 * @param {string} [order.model]      Film: "standard" | "premium"
 * @param {number} [order.seconds]    Film
 * @param {string} [order.quality]    Film: "sd" | "hd"
 * @param {boolean} [order.keyframe]  Film: eigenes Startbild → kein Keyframe-Credit
 * @param {number} [order.count]      Bilder: 4 | 8 (Anzahl im Auftrag, bei Rastern: Kacheln)
 * @param {boolean} [order.fallback]  Bilder: Plan B (teureres Modell)
 * @returns {number} Credits, ganzzahlig, nie negativ
 */
export function quoteFor(order = {}) {
  const mode = order.mode;
  if (mode === "film") {
    const m = videoModel(order.model);
    const secs = clampSeconds(m.id, order.seconds);
    const q = filmQuality(m.id, order.quality).id;
    return priceForFilm(m.id, secs, { ownKeyframe: !!order.keyframe, quality: q });
  }
  if (mode === "preview") return PRICES.preview;
  if (mode === "character") return PRICES.characterSheet;
  if (mode === "scene") return PRICES.scene;
  if (mode === "image") {
    /* Ein Bildauftrag ist entweder eine bestellte Zahl (4/8) oder ein
       Rasterblock mit `count` Kacheln — je Kachel ein Credit, wie überall. */
    const n = Number(order.count);
    if (Number.isInteger(n) && n > 0 && !(n in PRICES.images)) return n * (order.fallback ? 1.5 : 1);
    return priceForImages(Number.isInteger(n) ? n : undefined, !!order.fallback);
  }
  return 0;
}

/**
 * Die Regel, wenn Client und Server verschieden rechnen.
 * @param {number|undefined} quoted  was der Client angezeigt hat (fehlt bei alten Clients)
 * @param {number} actual            was der Server gerechnet hat
 * @returns {{ ok: boolean, charge: number, quoted: number|null, actual: number }}
 */
export function compareQuote(quoted, actual) {
  const q = Number(quoted);
  if (!Number.isFinite(q) || q < 0) return { ok: true, charge: actual, quoted: null, actual };
  /* Der Server ist NIE teurer als angezeigt, ohne dass der Mensch es
     bestätigt hat — und nie billiger als seine eigene Rechnung. */
  if (actual > q) return { ok: false, charge: actual, quoted: q, actual };
  return { ok: true, charge: actual, quoted: q, actual };
}

/** Die Preistabelle, wie der Server sie kennt — für `/api/prices`, damit
 *  ein Client prüfen kann, ob sein eingebautes Bundle noch dieselben Zahlen
 *  trägt. Bewusst nur die Zahlen, keine Texte. */
export function priceTable() {
  return {
    prices: { ...PRICES },
    previewCount: PREVIEW_COUNT,
    films: ["standard", "premium"].map((id) => {
      const m = videoModel(id);
      return {
        id, min: m.min, max: m.max, step: m.step, preferred: m.preferred,
        qualities: Object.fromEntries(
          Object.entries(m.qualities).map(([k, v]) => [k, { creditsPerSecond: v.creditsPerSecond, resolution: v.resolution }]),
        ),
      };
    }),
  };
}
