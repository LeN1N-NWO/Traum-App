# Übergabe an Hanni — Startbild, Startseite, Geräusche (PR #96, Anton, 10.10.2026)

Kurz, was du vor dem TestFlight-Upload am **Mi 14.10.** wissen musst.

## 1. Startbild braucht deinen Prebuild ⚠

Das Startbild zeigt jetzt das Augen-Zeichen auf `#050a14` statt des alten
Icons (Antons Befund 09.10.: „beim Start sieht man manchmal das alte Icon").

- Geändert: `mobile/app.json` (Splash-Plugin `backgroundColor "#050a14"`,
  `imageWidth 120`, oben `backgroundColor "#050a14"`) und
  `mobile/assets/images/splash-icon.png` (684 × 528).
- Wirkt **erst nach `expo prebuild`** — bei Anton wird nie ein Prebuild gemacht
  (nichts von Hand in `mobile/ios`). Also bitte vor dem Archive auf deinem
  Mac prebuilden, danach wie gewohnt „Clean Build Folder".
- Prüfen: App kalt starten → dunkler Grund mit dem Auge, kein altes Icon.

## 2. Die Startseite ist jetzt ein eigener Stapel

- `mobile/src/app/index.tsx` liegt jetzt in `mobile/src/app/(home)/index.tsx`,
  dazu `(home)/_layout.tsx` (Stack, Startseite ohne Kopf).
- Der NativeTabs-Trigger in `mobile/src/app/_layout.tsx` heißt `(home)`
  statt `index`. Die Adresse `/` ist unverändert.
- Neu: `(home)/night/[id]` und `(home)/night/edit` reichen
  `journal/[id]` und `journal/edit` durch — ein Traum aus dem Traumfänger
  öffnet sich im Home-Tab, „‹ Home" führt zurück (vorher landete man im
  Journal).

## 3. Traumfänger = Moonweave, Geschenke öffnen sich auf Tipp

- `mobile/src/components/moonweave.tsx` ersetzt `moon-ring.tsx` und
  `dream-stone.tsx` (beide gelöscht).
- Vergabe unverändert (`giftFor`, `giftedUpTo`). Aber: `GiftOpen` springt
  **nicht mehr von selbst** auf — es öffnet sich über das Siegel in der
  Mitte oder „Open gift" im Feld darunter.
- Neuer Befehl `catcherSeen` (Brücke, `journal-bridge.jsx`): merkt sich,
  bis zu welchem Traum die Startseite die Blätter gezeigt hat.
- `src/lib/dreamRing.js` hat `holdFull`: bei 12, 24 … bleibt der volle
  Ring stehen, bis der nächste Traum kommt (Nummern unverändert).

## 4. Einschlafgeräusche über expo-audio

`mobile/src/lib/sound-engine.ts` spielt die drei Rauschfarben jetzt mit
`createAudioPlayer` (lückenlose Schleife) statt expo-video, Audio-Modus
`playsInSilentMode`, `shouldPlayInBackground`, `mixWithOthers`. Der
Rekorder (`dream-recorder.tsx`) setzt nach einer Aufnahme denselben Modus
zurück. expo-audio war schon im Projekt — kein neues natives Modul.
Im Durchlauf am 15.10. bitte: Rauschen an, iPhone sperren — läuft es weiter?

## 5. Vorschau-Schalter nie im TestFlight-Bau

`mobile/src/app/profile/moonweave-preview.tsx` zeigt alle Zustände des
Traumfängers mit Platzhaltern — nur im Dev-Bau oder mit
`EXPO_PUBLIC_DEV_PREVIEW=1`. Diese Variable darf beim Archive **nicht**
gesetzt sein (sonst ist die Seite per Link erreichbar; sie vergibt aber
nichts).
