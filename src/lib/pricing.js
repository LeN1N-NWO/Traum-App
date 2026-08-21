/* Every price in the app, in one place.
 *
 * Credits are a stand-in today: the counter lives in localStorage and the user
 * can edit it. This is display and flow design, NOT access control — real
 * enforcement needs the accounts backend. Keeping the numbers here means the
 * switch to a server-side balance touches one file.
 *
 * ── The rule the whole scale rests on (08.08.2026) ────────────────────────
 *   1 CREDIT = 1 IMAGE = $0.08 of our cost (fal.ai nano-banana-2 at 1K).
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
  images: { 3: 3, 5: 5, 10: 10 },   // one credit per image, no bulk discount:
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

export const IMAGE_COUNTS = [3, 5, 10];

/* How many panels the preview cuts. Three is not a preference: splitGrid and
 * buildGridPrompt are proven for exactly this shape (09.08.2026), and a
 * nine-panel grid would put each frame at a ninth of the pixels, which is a
 * thumbnail, not a look at your dream. */
export const PREVIEW_COUNT = 3;

export function priceForImages(count) {
  return PRICES.images[count] ?? PRICES.images[5];
}
