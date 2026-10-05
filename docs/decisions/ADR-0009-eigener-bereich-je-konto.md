# ADR-0009: Eigener Bereich je Konto auf dem Gerät

**Status:** angenommen · **Datum:** 2026-10-05 · **Format:** MADR
**Entschieden von:** Hanni (05.10.2026), Anton zur Kenntnis (Übergabenotiz).

## Kontext

Der ganze Zustand der App liegt in EINEM Eintrag im localStorage der
Webviews: `dreamrushes_v1` (`src/lib/storage.js`, Stand `a79d5ed`). Darin
stehen Journal, eigenes Foto (`me`) und Besetzungsfotos (`cast`), Profil,
Einwilligung und Credits. Ein Konto kommt darin nicht vor.

Gemessen am Code (Stand `a79d5ed`):

- Meldet sich auf einem Gerät ein zweites Konto an, sieht es die Träume und
  die **Gesichter** des ersten.
- Der erste Abgleich eines Kontos ohne Sicherung lädt das ganze
  Geräte-Journal in dieses Konto hoch (`mobile/src/lib/dream-sync.ts`).
  Verschlüsselt wird mit dem Schlüssel aus dem iCloud-Schlüsselbund des
  Geräts, also mit dem des ersten Nutzers.
- Abmelden zeigt das Journal weiter an. Der Text dazu sagt „Deine Träume
  bleiben auf diesem Gerät“, und das stimmt auch, nur für jeden, der das
  Gerät danach in die Hand nimmt.
- Ein Gast (Onboarding mit „Later“) kann nichts Bezahltes erzeugen
  (`src/lib/gatekeeper.js`, Hannis Regel vom 03.10.), aber Traumtexte,
  Aufnahmen, Profil und Foto speichern.

## Betrachtete Optionen

1. **Gerät gehört einem Konto:** Besitzmarke im Journal. Ein zweites Konto
   bekommt nur einen Hinweis und keinen Abgleich.
2. **Eigener Bereich je Konto:** Jedes Konto hat einen eigenen Eintrag im
   localStorage, die App wechselt den Bereich mit der Anmeldung.
3. Nichts tun, nur vor dem öffentlichen Start warnen.

## Entscheidung

Gewählt: **Option 2.** Ein geteiltes iPhone ist ein normaler Fall (Paare,
Familien), und Träume und Gesichter sind besonders schützenswert
(DSGVO Art. 9).

### Wie (ohne Kopieren)

Bereiche werden nie kopiert, sondern **zugeordnet**. Ein kleines
Verzeichnis `dreamrushes_slots` im localStorage hält fest, welcher Eintrag
wem gehört:

    { owners: { "<konto-id>": "<schlüssel>" }, guest: "<schlüssel>" }

- **Ohne Verzeichnis** (jedes Gerät heute) ist der Gast-Bereich der alte
  Eintrag `dreamrushes_v1`. Für den Gast ändert sich also nichts.
- **Anmelden, Konto X hat noch keinen Bereich:** X übernimmt den
  *aktuellen Gast-Bereich*, so wie er ist. Der neue Gast-Bereich heißt
  `dreamrushes_v1@guest-<X>`, ist leer und wird erst beim ersten Schreiben
  angelegt. Damit gehört das heutige Geräte-Journal dem Konto, das jetzt
  angemeldet ist, und ein Onboarding vor dem Anmelden (Foto, Name,
  Einwilligung) landet im richtigen Konto. Hannis Begründung: Ein Gast, der
  seine Traumtexte in Filme verwandeln will, meldet sich genau dafür an,
  und seine Texte sollen mitkommen.
- Der neue Gast-Bereich startet mit dem, was zum **Gerät** gehört: Sprache
  und die Marke „Onboarding gesehen“ (B4b). Die **Einwilligung** bekommt er
  nicht mit, denn die nächste Person am Gerät stimmt selbst zu. Nach dem
  Abmelden erscheint deshalb das Einwilligungs-Tor.
- **Anmelden, X hat schon einen Bereich:** Die App benutzt ihn. Was der Gast
  seitdem gespeichert hat, bleibt im Gast-Bereich.
- **Abmelden:** zurück in den Gast-Bereich. Das Journal ist leer, die Träume
  des Kontos liegen weiter auf dem Gerät und kommen mit dem Anmelden zurück.
- **Konto löschen:** Der Bereich des Kontos wird wieder zum Gast-Bereich.
  So bleibt das Versprechen „Träume auf diesem Gerät bleiben“ im
  Löschdialog wahr.

Warum zuordnen statt kopieren:

- Der localStorage fasst etwa 5 MB, und Fotos liegen darin als base64
  (Kommentar über `saveState`). Eine Kopie kann daran scheitern.
- Die Webviews der App sehen den localStorage der anderen nicht sofort.
  Gemessen am 05.10.: 8 Brücken melden denselben Film 8×, weil die Pacht
  sie nicht trennt. Wer kopiert und danach leert, kann bei einem
  verspäteten Leser ein ganzes Tagebuch verlieren. Eine Zuordnung ist
  eindeutig: Jede Brücke, die vom selben Verzeichnis ausgeht, schreibt
  dieselbe Zuordnung, und kein Tagebuch wird angefasst.

### Wer was weiß

- Die native Seite kennt das Konto (`mobile/src/lib/auth.ts`). Sie gibt es
  jeder Brücke als Eigenschaft mit und zeigt eine Brücke erst, wenn die
  Sitzung geladen ist. Vorher wüsste niemand, welcher Bereich gilt, und
  eine Brücke würde in den falschen schreiben.
- Die Brücke (`journal-bridge.jsx`) stellt `storage.js` auf den Bereich um,
  bevor sie irgendetwas liest (`selectStateKey(slotFor(konto))`), und zwar
  vor jedem Lesen neu. `storage.js` bekommt dafür eine Umschaltung; die
  Web-App ruft sie nie auf und bleibt beim alten Eintrag.
- Die alten Web-Ansichten (`legacy-page.jsx`, `legacy-app.jsx`,
  `legacy-order.jsx`) lesen über `AppState` selbst. Sie wählen den Bereich
  ebenso und bauen sich beim Kontowechsel neu auf. Ausnahme: Der Web-Motor
  einer Bestellung (`legacy-order.jsx`) bleibt in seinem Bereich, denn ein
  Neustart gäbe mit `autoRender` einen zweiten, bezahlten Auftrag ab.
- Der Abholer speichert nicht, wenn sich der Bereich während einer Runde
  geändert hat. Das Ergebnis gehört dem alten Bereich, der Server hebt es
  auf, und die nächste Runde dort holt es wieder.
- Eine Sitzung ohne gespeicherte Konto-ID (sehr alte Anmeldungen) benutzt
  den Gast-Bereich, also das Verhalten von heute.

## Konsequenzen

- Kein Konto sieht die Träume oder Gesichter eines anderen, und kein Abgleich
  mischt Tagebücher.
- **Credits:** Sie liegen jetzt je Konto im Bereich, sind aber weiter nur
  Buchhaltung auf dem Gerät. Wirklich ans Konto gebunden sind sie erst mit
  S7 (Abbuchen auf dem Server, `settleCharge`, Antons Teil).
- **Bekannte Grenze, Sicherungsschlüssel:** Der Schlüssel liegt im
  iCloud-Schlüsselbund des Geräts. Sichert ein zweites Konto auf einem
  fremden iPhone, ist diese Sicherung nur mit dem iCloud-Schlüssel des
  Gerätebesitzers lesbar. `dream-sync.ts` erkennt fremde Schlüssel
  („foreign-key“) und schickt dann nichts. Je nach Reihenfolge blockiert
  das die Sicherung auf dem eigenen iPhone. Ungelöst, eigene Entscheidung.
- **Bekannte Grenze, laufende Aufträge beim Wechsel:** Ein Film von Konto A
  wird erst wieder abgeholt, wenn A angemeldet ist (der Server hebt ihn
  auf). Ein Glimpse, der während eines Wechsels fertig wird
  (`glimpse-jobs.json`), landet im gerade aktiven Bereich. Das ist sehr
  selten und wird hier nicht gelöst.
- **Bekannte Grenze, Sprache beim Start:** `src/i18n/index.js` liest die
  Sprache beim Import aus `dreamrushes_v1`, bevor ein Bereich feststeht.
  Die Brücke stellt sie danach richtig. Weicht die Sprache zweier Konten auf
  einem Gerät ab, kann eine alte Web-Ansicht kurz in der anderen starten.
- Neue Pflicht: Jede neue Stelle, die `<JournalBridge>` zeigt, gibt das
  Konto mit (`account={useBridgeAccount()}`), ebenso jede alte Web-Ansicht.
  Ohne `account` tut die Brücke nichts.

## Verworfene Alternativen — warum

- **Option 1 (Gerät gehört einem Konto):** kleiner, aber ein geteiltes
  iPhone wäre für das zweite Konto unbrauchbar.
- **Kopieren statt zuordnen:** Speicherkontingent und Datenverlust beim
  Leeren, siehe oben.
- **Bereich nach dem Abmelden löschen:** verliert Traumtexte, die nie
  gesichert wurden (ohne Einwilligung keine Sicherung).
