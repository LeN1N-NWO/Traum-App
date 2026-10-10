/* Die großen Ring-Geschenke im Konto (Antons Übergabe 10.10.2026, Teil 2).
 *
 * Mit Konto zeigt und bucht die App den Kontostand des Servers — ein
 * Geschenk, das nur auf dem Gerät gutgeschrieben wird, wäre unsichtbar.
 * Deshalb bucht POST /api/gifts/claim die Credit-Geschenke bei 24, 36, 48
 * ins Konto, und nur für Menschen, die schon gekauft haben.
 *
 * Wie viele Träume zählen, sagt die App (Hannis Entscheidung 3a, 10.10.):
 * Die Träume sind versiegelt, der Server sieht nicht, ob an einem Bild
 * oder Film hängt. Er glaubt der Zahl nur so weit, wie er Traum-Zeilen des
 * Kontos hat. Schlimmstenfalls schummelt ein Käufer sich die drei
 * Geschenke einmal früher — jedes ist per Ledger-Kennung nur einmal
 * buchbar (≈ 98 Credits, ≈ $3 Einkauf).
 *
 * Mengen und Plätze kommen aus streakBoard.js (bigGiftAt) — dieselbe
 * Quelle wie auf dem Gerät, damit Anzeige und Konto nie auseinanderlaufen.
 * Die Glimpse-Geschenke bleiben auf dem Gerät, bis der Server Glimpses
 * abbucht (Übergabe, Punkt 3). */
import { bigGiftAt } from "./streakBoard.js";

/** Die Plätze, auf denen ein Credit-Geschenk liegen kann. */
export const CREDIT_GIFT_PLACES = [24, 36, 48];

/**
 * Welche Credit-Geschenke dieses Konto jetzt beanspruchen darf.
 * @param {{ claimed: unknown, rows: number, paid: boolean }} p
 *   claimed — die Traumzahl der App; rows — Traum-Zeilen auf dem Server;
 *   paid — gibt es eine Kauf- oder Abo-Buchung im Ledger.
 * @returns {{ count: number, gifts: { place: number, credits: number, ref: string }[] }}
 */
export function claimableGifts({ claimed, rows, paid }) {
  const want = Number.isSafeInteger(claimed) && claimed > 0 ? claimed : 0;
  const have = Number.isSafeInteger(rows) && rows > 0 ? rows : 0;
  const count = Math.min(want, have);
  if (!paid) return { count, gifts: [] };
  const gifts = [];
  for (const place of CREDIT_GIFT_PLACES) {
    if (place > count) break;
    const g = bigGiftAt(place, true);
    if (g?.credits > 0) gifts.push({ place, credits: g.credits, ref: `ring-gift-${place}` });
  }
  return { count, gifts };
}
