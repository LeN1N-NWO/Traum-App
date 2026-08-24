/* Every price in the app, in one place.
 *
 * Credits are a stand-in today: the counter lives in localStorage and the user
 * can edit it. This is display and flow design, NOT access control — real
 * enforcement needs the accounts backend. Keeping the numbers here means the
 * switch to a server-side balance touches one file.
 *
 * ── The rule the whole scale rests on (08.08.2026) ────────────────────────
 *   1 CREDIT = 1 IMAGE.
 *
 * ⚠ Was ein Bild uns KOSTET, hat sich seitdem viermal geändert und steht
 * längst nicht mehr hier: $0,08 (nano-banana-2) → $0,042 (Lite) → $0,035
 * (Seedream) → **$0,0283** (GPT Image 2 „medium", eine Szene aus einem
 * 2×2-Raster, seit 24.08.2026). Die Zahl gehört in imageModel.js und wird
 * von dort gelesen (`node scripts/preis-durchreichen.mjs`); jede Kopie
 * hier wäre nach dem nächsten Modellwechsel falsch — genau das ist am
 * 23.08. passiert.
 *
 * Was BLEIBT, ist die Regel darüber: ein Credit ist ein Bild. Der Einkauf
 * bestimmt die Marge, nicht den Preis — ein billigeres Modell verbreitert
 * die Marge, es verbilligt nichts für den Kunden. So entschieden am 20.08.
 *
 * Everything else is that number divided into. Before this, the scale had
 * drifted badly: a film cost 9 credits but only $0.35 to make, while ten
 * images cost 5 credits and $0.80 — the same credit was worth anywhere
 * between 4 and 16 cents depending on what you spent it on.
 *
 * The text work is FREE because it genuinely is: one DeepSeek analysis costs
 * $0.00026, six hundredths of one percent of a five-image dream. Charging a
 * credit for it was a 400× markup on the one step that should never deter
 * anyone — and it put a price on merely writing a dream down.
 */
export const PRICES = {
  improve: 0,        // analysis in step 1 — $0.00026, so: free
  correct: 0,        // journal: spelling and grammar only
  rewrite: 0,        // journal: same dream, better words
  elaborate: 0,      // journal: work the storytelling out
  transcribe: 0,     // dictation — $0.0015 for a two-minute dream
  characterSheet: 2, // one generated reference image, plus a little
  /* Vier oder acht — nicht drei, fünf oder zehn (Antons Entscheidung
   * 23.08.2026, nachdem der Rastertest die Zahlen geliefert hat).
   *
   * Der Grund ist Geometrie, keine Vorliebe: Ein Rasterbild fasst 2×2 = VIER
   * Szenen, und ein angefangenes Raster ist ein voller, bezahlter Aufruf.
   * Bei fünf Szenen zahlt man also zwei Aufrufe für fünf Bilder — je Szene
   * 60 % mehr als bei vier. Bei zehn sind es drei Aufrufe, 20 % mehr als bei
   * acht. Vier und acht sind die einzigen Zahlen, bei denen kein Platz und
   * kein halber Aufruf verfällt.
   *
   * ⚠ Heute merkt das noch niemand: Wir rendern einzeln (Seedream 5 Lite),
   * und da kostet jede Szene dasselbe. Die Zahlen stehen hier trotzdem
   * schon richtig, damit ein späterer Wechsel aufs Raster keine
   * Preisumstellung mehr braucht — und weil vier Bilder ein Traum sind,
   * fünf waren nie eine Begründung.
   *
   * ⚠ Der Einstiegspreis steigt damit von 3 auf 4 Credits. Das ist die
   * bewusste Nebenwirkung, nicht ein Versehen. */
  images: { 4: 4, 8: 8 },            // one credit per image, no bulk discount:
                                     // every image costs us exactly the same
  keyframe: 1,       // the still a film is animated from — it IS an image
  scene: 1,          // ein einzelnes Szenenbild, nachgeliefert aus dem
                     // Storyboard (leere Kachel → „Bild erzeugen") — es IST
                     // ein Bild, also kostet es genau eines

  /* The quick look: three panels cut out of ONE rendered image, so it costs
   * us one image and is priced as one. See PREVIEW_COUNT below.
   *
   * This used to be a hidden accident (10.08.2026): the grid fired only when
   * someone happened to clear the poster title, and still charged 3 credits
   * for 1 render. Two things were wrong with that. The saving was invisible,
   * so nobody could choose it — and the price lied in the other direction,
   * because the panels come out at a THIRD of the resolution (measured:
   * 459×768 against 768×1376). Charging full price for a third of the pixels
   * is the part that would have cost trust; taking the margin quietly was
   * only the part that looked clever. */
  preview: 1,
};

export const IMAGE_COUNTS = [4, 8];

/* How many panels the preview cuts. Three is not a preference: splitGrid and
 * buildGridPrompt are proven for exactly this shape (09.08.2026), and a
 * nine-panel grid would put each frame at a ninth of the pixels, which is a
 * thumbnail, not a look at your dream. */
export const PREVIEW_COUNT = 3;

/** Was `count` Bilder kosten.
 *
 *  ⚠ Der Rückfall geht auf die KLEINSTE angebotene Zahl, nicht auf eine
 *  hingeschriebene. Bis zum 23.08. stand hier `PRICES.images[5]` — und
 *  hätte nach der Umstellung auf 4/8 `undefined` geliefert, also einen
 *  Preis von „nichts". Alte Journaleinträge mit 3, 5 oder 10 Bildern gibt
 *  es weiterhin; sie dürfen hier keine Lücke reißen. */
export function priceForImages(count) {
  return PRICES.images[count] ?? Math.min(...IMAGE_COUNTS.map((n) => PRICES.images[n]));
}
