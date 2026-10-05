# Übergabe an Anton — eigener Bereich je Konto (ADR-0009)

**Von:** Hanni (mit Claude), 05.10.2026 spätabends, `session/2026-10-05-hanni-5`
**Warum in deinem Bereich:** TestFlight-Woche, wie abgesprochen. Prompt-Kette,
Auftrag, Regie und Server sind unverändert. Geändert sind die Speicherschicht
und die Stellen, die sie benutzen.

## Was sich für dich ändert

**Jedes Konto hat auf dem Gerät seinen eigenen localStorage-Eintrag.** Vorher
sah ein zweites Konto auf demselben iPhone die Träume und Gesichter des
ersten, und der erste Abgleich lud das fremde Journal in sein Konto hoch.
Begründung und Abwägung: `docs/decisions/ADR-0009-eigener-bereich-je-konto.md`.

- `src/lib/storage.js`: `loadState`/`saveState` lesen und schreiben den
  *aktiven* Eintrag (`selectStateKey`). Ein Verzeichnis `dreamrushes_slots`
  ordnet Konten Einträgen zu (`slotFor`, `releaseSlot`). **Kopiert wird nie.**
  Ohne Aufruf von `selectStateKey` bleibt alles bei `dreamrushes_v1`, also
  ist die Web-App unverändert.
- Das erste Konto übernimmt den bisherigen Eintrag `dreamrushes_v1` mit
  allen Träumen. Auf deinem iPhone ändert sich also nichts, solange du
  angemeldet bleibst.
- **Abmelden** zeigt einen leeren Gast-Bereich (Sprache und Onboarding-Marke
  bleiben, die Einwilligung nicht). **Anmelden** bringt den eigenen Bereich
  zurück. **Konto löschen** macht den Bereich wieder zum Gast-Bereich.

## Was du beim Bauen beachten musst

- **Jede neue `<JournalBridge>`** bekommt `account={useBridgeAccount()}`
  (`mobile/src/lib/auth.ts`). Ohne `account` tut sie nichts, das ist
  Absicht: Sonst schriebe sie vor dem Laden der Sitzung in den falschen
  Bereich.
- **Jede neue alte Web-Ansicht** (DOM-Komponente mit `AppState`) bekommt
  dasselbe und ruft vor dem Rendern `selectStateKey(slotFor(account))`
  auf. Vorbild: `mobile/src/legacy/legacy-page.jsx`.
- Wer `localStorage.getItem("dreamrushes_v1")` direkt liest, liest den
  Bereich des ersten Kontos. Stattdessen `loadState()` oder
  `activeStateKey()` benutzen. `AppState.jsx` habe ich dafür umgestellt
  (`fresh`).

## Einwilligungs-Tor ist jetzt eine Ebene, kein Modal

`mobile/src/components/consent-gate.tsx`: Die Einwilligung kann jetzt
mitten in der Sitzung fehlen (nach dem Abmelden). Als Modal wurde das Tor
von iOS abgelehnt, während der Abmelde-Dialog schloss, und die App nahm
keinen Tipp mehr an. Es ist derselbe Fehler wie am 26.09. mit dem
Onboarding. Jetzt liegt das Tor als Ebene über den Tabs, wie das Face-ID-Tor.

## Bewusst nicht gelöst

- **Credits** liegen jetzt je Konto, bleiben aber Buchhaltung auf dem Gerät,
  bis S7 (Abbuchen auf dem Server, `settleCharge`) steht.
- **Kontowechsel während ein Film läuft:** Hanni hat entschieden, das zu
  ignorieren. Der Abholer speichert nur nicht über einen Wechsel hinweg.
- **Sicherungsschlüssel:** Er liegt im iCloud-Schlüsselbund des Geräts.
  Sichert ein zweites Konto auf einem fremden iPhone, kann es diese
  Sicherung nur dort lesen (steht im ADR).

## Geprüft

934 Unit-Tests grün, davon 10 neue in `src/lib/storage-slots.test.js`. Die
Gegenprobe mit dem alten festen Eintrag fällt durch. Im Simulator mit zwei
echten Konten durchgespielt: Bestandsjournal bleibt, Abmelden leer, zweites
Konto leer, erstes Konto bekommt seine Träume zurück. Nicht am Gerät
geprüft: Konto löschen.
