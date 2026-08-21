# Faultier-Assets — Antons Vermerk vom 21.08.2026

Das Faultier ist die Figur der App (Startscreen-Video, Paywall-Platzhalter).
Anton baut es zur durchgängigen Marke aus. **Alle drei Punkte sind
Asset-Arbeit, die Anton selbst macht bzw. generiert** — dieser Vermerk hält
fest, WO die Assets später eingebaut werden und was der Einbau kostet, damit
die Session, die sie bekommt, nicht suchen muss.

## 1. Feature-Kacheln bekommen kleine Faultier-Clips

Antons Worte: „dort, wo wir die Features von der App zeigen, noch mal ein
paar Videos von unserem Faultier einbinden … bei den einzelnen Kacheln …
hier werde ich dann verschiedene kleine Clips einbinden, damit das auch
cooler wirkt."

- **Wo:** die Onboarding-Slides (`src/screens/Onboarding/` — die drei
  Kacheln „Whisper it, half-asleep" / „Then watch it back" / „The quiet
  part is free") und ggf. die Immer-gratis-Chips der Paywall.
- **Einbau:** je Kachel ein kurzes MP4 nach dem Muster des bestehenden
  `src/assets/home-faultier.mp4` — dunkel, langsam, ohne Ton lesbar,
  unter ~700 KB (das Repository trägt seine Medien selbst, WORKLOG 10.08.).
- **Offen:** Clips existieren noch nicht. Anton generiert sie.

## 2. Stimmen bekommen eigene Faultier-Icons

Antons Worte: „Bei ‚Wähl deine Stimme' … diesen werde ich dann auch einen
eigenen Icon generieren, der zu der Sprache passt. Vielleicht … verschiedene
Faultiere, die vom Look ein bisschen anders angezogen sind."

- **Wo:** `src/components/VoicePicker.jsx` — heute Name + Wesenszüge
  (warm/soft/…), künftig je Stimme ein Faultier-Porträt.
- **Einbau:** ein Bild je Stimme (Namen siehe `src/lib/voices.js`),
  quadratisch, als Asset ins Repo; VoicePicker zeigt es rund neben dem
  Namen — gleiche Bauart wie die Cast-Chips im Journal.
- **Offen:** Icons existieren noch nicht. Anton generiert sie.

## 3. „Faultier-Modus" als letzte Stil-Kachel (Easter Egg)

Antons Worte: „Ich werde noch eine Kachel hinzufügen … ‚Unser
Faultier-Modus', wo … alles eigentlich mit diesem Faultier gemacht wird …
als LETZTE Kachel, sozusagen ein Easter Egg."

- **Wo:** `src/lib/styles.js` — ein neunter Eintrag ANS ENDE der STYLES-
  Liste (die Reihenfolge dort ist die Anzeigereihenfolge in Schritt 5),
  plus Label/Info in `src/i18n/*.js` unter `styles.byId` (seit 21.08.
  kommen Stilnamen und ⓘ-Texte aus den Sprachdateien).
- **Kern der Sache:** der `prompt` des Stils muss das Faultier in jede
  Szene bringen (etwa: die Traumszenen werden von einem gemütlichen
  Faultier nachgespielt/begleitet) — das ist Prompt-Arbeit, kein Asset.
  Das `poster`-Feld nicht vergessen (Archetyp/Lettering/Palette), sonst
  fällt die Titelkarte aus dem Stil.
- **Zu klären mit Anton:** ersetzt das Faultier die Figuren (echte
  Referenzen wären dann witzlos) oder begleitet es sie? Das entscheidet,
  ob der Stil mit der Bogen-Pflicht und den Referenzbildern kollidiert.

## Warum jetzt nicht gebaut

Alle drei Punkte hängen an Assets bzw. an einer Stil-Prompt-Entscheidung,
die Anton treffen will („werde ich einbinden/generieren"). Code-seitig ist
alles vorbereitet: Stil-Kacheln sind i18n-fähig und haben ein ⓘ, der
VoicePicker ist eine Liste, die Onboarding-Slides sind Komponenten.
