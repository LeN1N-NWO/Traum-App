# Übergabe an Anton — Käufe und Ring-Geschenke im Konto, deine App-Seite (Hanni, 10.10.2026)

Geteilter Branch `session/2026-10-10-hanni-anton`, PR #100. Der Server-Teil
steht. Du machst auf **demselben Branch** weiter: erst `git pull --rebase`,
nie gleichzeitig mit Hanni, kein `git push --force`. Gemergt wird einmal am
Ende, damit App und Server zusammen live gehen.

---

## 1. Käufe: `POST /api/purchases/verify` (B1)

**Hannis Entscheidungen 10.10.:**
- Der Server fragt Apple selbst (App-Store-Server-API). Keine Bibliothek,
  der Server bleibt paketfrei.
- **Sandbox-Käufe (TestFlight)** werden nur gutgeschrieben, solange auf
  dem VPS `ALLOW_SANDBOX_PURCHASES=1` steht.
- **Abos:** jetzt nur der Kauf. Verlängerungen, Kündigung und Erstattung
  kommen später über Apples Server-Benachrichtigungen auf einem eigenen
  Branch.

**Aufruf:** mit Konto (wie `/api/account`).

```
POST /api/purchases/verify   { "transactionId": "2000000123456789" }
```

Die Transaktions-ID steht im Kaufergebnis von expo-iap. Bitte prüfen,
welches Feld es in v5 ist (`transactionId` bzw. `id`). Nur Ziffern.

**Antworten:**

| Status | Rumpf | Was die App tut |
|---|---|---|
| 200 | `{ ok, kind, plan, credited, total }` | `finishTransaction`, dann `refreshKonto(true)` |
| 200 | `{ ok, already: true, credited: 0 }` | schon gebucht: ebenso abschließen, neu laden |
| 503 | `{ retry: true, reason }` | **nicht** abschließen, später erneut versuchen |
| 400 | `{ retry: false, reason }` | abschließen, Fehler zeigen, nichts gutschreiben |
| 401 | `{ reason: "signin" }` | anmelden lassen |

**⚠ Die Reihenfolge in `mobile/src/lib/iap.ts` muss sich ändern.**
Heute ruft `buyPlan` `finishTransaction` sofort nach dem Kauf. Danach
muss es so laufen:

1. Kaufen.
2. Den Server fragen.
3. Erst bei `ok` abschließen.

Eine nicht abgeschlossene Transaktion liefert StoreKit beim nächsten Start
wieder aus. Das ist der eingebaute Wiederholungsweg, falls der Server oder
Apple gerade nicht antwortet. Wird vorher abgeschlossen, ist ein bezahlter
Kauf ohne Gutschrift weg.

**`reason` bei 400:**

| `reason` | Bedeutung |
|---|---|
| `wrong_account` | Der Kauf trägt kein oder ein anderes `appAccountToken` als das angemeldete Konto. |
| `unknown_product` | Das Produkt steht nicht in der Tabelle. |
| `revoked` | Der Kauf wurde erstattet. |
| `expired` | Das Abo ist abgelaufen. |
| `not_found` | Apple kennt die Transaktion nicht, oder es ist ein Sandbox-Kauf, während die Sandbox aus ist. |
| `invalid` | Die Transaktions-ID ist keine reine Ziffernfolge. |

**⚠ Gäste:** Ohne Anmeldung setzt `buyPlan` kein `appAccountToken`, und
ohne Konto gibt es nichts zu buchen. Bitte entscheiden:
- **Entweder** Kaufen nur mit Konto (Anmelde-Blatt vor dem Kauf). Hannis
  Empfehlung, sonst hängt bezahltes Guthaben an einem Gerät.
- **Oder** Gäste bleiben bei der lokalen Gutschrift wie heute.

**Mit Konto keine lokale Gutschrift mehr.** Der Brücken-Befehl `purchase`
soll weiter `paidAt` setzen (für `giftFor`), aber mit Konto keine Credits
mehr auf dem Gerät gutschreiben. Das Konto ist die Quelle (S7 Phase 2).

## 2. Ring-Geschenke: `POST /api/gifts/claim`

**Hannis Entscheidung 3a:** Die Traumzahl sagt die App. Der Server deckelt
sie mit der Zahl der Traum-Zeilen dieses Kontos. Er sieht in versiegelten
Träumen nicht, ob Bild oder Film daran hängen. Schlimmster Fall: ein
Käufer holt sich die drei Geschenke einmal zu früh (≈ 98 Credits, ≈ $3
Einkauf).

```
POST /api/gifts/claim   { "count": <dreamCount wie in giftFor> }
→ { ok, count, paid, booked: [{ place, credits }], total }
```

- **Wann:** sobald `giftFor` ein Credit-Geschenk liefert (`ringFilm`,
  `ringFilms`, `bloom`) und ein Konto da ist. Danach
  `refreshKonto(true)`.
- **Wiederholen ist harmlos.** Jedes Geschenk wird nur einmal gebucht. Der
  Aufruf darf auch bei jedem Öffnen der Startseite laufen.
- **`paid: false`:** Der Server kennt noch keinen Kauf dieses Kontos.
  Käufe vor B1 kennt er nicht. Dann bucht er nichts, auch wenn das Gerät
  `paidAt` hat.
- **Die Glimpse-Geschenke** (3/6/9 …, 10 bei 48 ohne Kauf) bleiben auf
  dem Gerät, wie in deiner Übergabe, Punkt 3.

## 3. Was Hanni noch tun muss (nicht dein Teil)

- **Migration im Supabase-Editor einspielen:**
  `supabase/migrations/20261010180000_ring_gifts.sql`, danach den Test
  `supabase/tests/ring_gifts.sql`.
- **In-App-Kauf-Schlüssel** in App Store Connect anlegen und
  `APPLE_IAP_*` in die `.env` auf dem VPS eintragen (siehe
  `.env.example`). Für TestFlight zusätzlich `ALLOW_SANDBOX_PURCHASES=1`.
- **Nach dem Merge:** `deploy.sh`.
