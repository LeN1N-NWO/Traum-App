/* Every price in the app, in one place.
 *
 * Credits are a stand-in today: the counter lives in localStorage and the user
 * can edit it. This is display and flow design, NOT access control — real
 * enforcement needs the accounts backend. Keeping the numbers here means the
 * switch to a server-side balance touches one file.
 */
export const PRICES = {
  improve: 1,        // "Improve with AI" in step 1
  correct: 1,        // journal: spelling and grammar only
  rewrite: 1,        // journal: same dream, better words
  elaborate: 2,      // journal: work the storytelling out
  characterSheet: 2, // generate a reference sheet for a described character
  images: { 3: 2, 5: 3, 10: 5 },
  film: 9,           // includes the still it is animated from
};

export const IMAGE_COUNTS = [3, 5, 10];

export function priceForImages(count) {
  return PRICES.images[count] ?? PRICES.images[5];
}
