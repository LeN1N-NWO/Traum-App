import { fetchProducts, finishTransaction, initConnection, requestPurchase } from "expo-iap";

/* StoreKit-Anbindung (App-Store-Blocker B1, 23.09.2026, Antons Go).
 *
 * Die Produkt-IDs sind bewusst OHNE Bundle-ID-Präfix (die Entscheidung
 * app.dreamrushes vs. com.dreamrushes.app steht noch aus — Produkt-IDs
 * sind davon unabhängig und nach dem Anlegen unveränderlich). Dieselben
 * IDs stehen in ios/DreamRushes.storekit (lokaler Test ohne Apple-Konto,
 * Xcode ▶) und müssen später GENAU SO in App Store Connect angelegt
 * werden (Hannis Aufgabe, Übergabe 23.09.).
 *
 * ⚠ Die Gutschrift passiert heute LOKAL über den Brücken-Befehl
 * `purchase` (plans.js kennt die Mengen) — der Server prüft noch keine
 * Belege. Vor der Einreichung MUSS der Beleg zum Server und dort gegen
 * Apple geprüft werden (App-Store-Server-API → server_grant()); bis
 * dahin gilt: Sandbox-Käufe nie ins echte Ledger (Übergabe 14.09.). */

export const PRODUCT_FOR: Record<string, { sku: string; type: "in-app" | "subs" }> = {
  "pack-s": { sku: "dreamrushes.credits.s", type: "in-app" },
  "pack-m": { sku: "dreamrushes.credits.m", type: "in-app" },
  "pack-l": { sku: "dreamrushes.credits.l", type: "in-app" },
  "pack-xl": { sku: "dreamrushes.credits.xl", type: "in-app" },
  monthly: { sku: "dreamrushes.sub.monthly", type: "subs" },
  yearly: { sku: "dreamrushes.sub.yearly", type: "subs" },
};

let connected = false;
async function connect() {
  if (!connected) { await initConnection(); connected = true; }
}

/* Sind echte Produkte da? Ohne StoreKit-Konfiguration (simctl-Start) oder
   ohne App-Store-Connect-Produkte kommt hier nichts — dann bleibt das
   Kaufblatt bei seinem heutigen „kommt bald"-Verhalten, nichts bricht. */
export async function storeReady(): Promise<boolean> {
  try {
    await connect();
    const skus = Object.values(PRODUCT_FOR).map((p) => p.sku);
    const found = await fetchProducts({ skus });
    return Array.isArray(found) && found.length > 0;
  } catch {
    return false;
  }
}

/** Kauf eines Plans (plan.id aus plans.js). "done" heißt: Apple hat die
 *  Transaktion bestätigt und sie ist abgeschlossen — die Gutschrift macht
 *  der Aufrufer (Brücken-Befehl `purchase`). */
export async function buyPlan(planId: string): Promise<"done" | "cancelled" | "unavailable" | "failed"> {
  const product = PRODUCT_FOR[planId];
  if (!product) return "unavailable";
  try {
    await connect();
    const result = await requestPurchase(
      product.type === "subs"
        ? { request: { apple: { sku: product.sku } }, type: "subs" }
        : { request: { apple: { sku: product.sku } }, type: "in-app" },
    );
    const purchase = Array.isArray(result) ? result[0] : result;
    if (!purchase) return "cancelled";
    await finishTransaction({ purchase, isConsumable: product.type === "in-app" });
    return "done";
  } catch (e: any) {
    const code = String(e?.code ?? e?.message ?? "");
    if (/cancel/i.test(code)) return "cancelled";
    return "failed";
  }
}
