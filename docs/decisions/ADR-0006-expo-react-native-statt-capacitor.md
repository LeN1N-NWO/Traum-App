# ADR-0006: React Native mit Expo statt Capacitor — die Oberfläche wird nativ, die Logik bleibt

**Status:** angenommen · **Datum:** 2026-09-11 · **Format:** MADR
**Entschieden von:** Anton (Produktbesitzer), abends nach dem ersten Durchklicken
im Simulator. Hanni ist per Übergabe informiert (`docs/uebergabe/2026-09-11-hanni-expo-skills.md`).
**Verhältnis zu ADR-0004:** ersetzt dessen Capacitor-Ausblick. ADR-0004 hatte
einen nativen Neubau als „teuer und verfrüht" verworfen und für eine
Neubewertung „ein eigenes ADR mit echten Messungen" verlangt — das ist dieses.
React als Oberflächenbibliothek und der Wizard-Zustand aus ADR-0004 bleiben.
**Verhältnis zu ADR-0002/0005:** bestätigt beide im Kern. `server.js` bleibt
der einzige schlüsselhaltende Prozess, Supabase die Datenschicht. Daran ändert
sich nichts; die native App ist ein weiterer HTTP-Client desselben Servers.

## Kontext

Antons Ansage vom 11.09.2026, wörtlich: „Ab jetzt wollen wir nur noch in
Xcode weiterbauen. Web interessiert uns nicht mehr. Wir wollen es aber später
dann auf Android auch portieren." Und zum Gefühl der App im Simulator: „Das
fühlt sich noch nicht richtig geil an, UI-technisch … das muss mehr
Apple-native werden" und „das sieht jetzt noch ein bisschen sehr, sehr nicht
high-end aus."

Was die Capacitor-Hülle am 11.09. konnte und nicht konnte, gemessen:

- **Am Morgen** (Stand `540a10b`): keine einzige Bildschirmübergangs-Animation,
  13 Overlays ohne Ausblenden und ohne Ziehen-zum-Schließen, Druckzustände an
  5 Elementen, kein Haptik-Plugin, 24 Übergänge und 37 Animationen mit
  handgetippten Zeiten, eine einzige echte Kurve im ganzen CSS.
- **Am Abend** (Branch `session/2026-09-11-anton-native`, PR #40): all das
  nachgebaut — Sheet-Verhalten, geschobene Seiten, Wisch vom Rand, Haptik,
  Statusleiste. Ergebnis: besser, aber **nachgeahmt**. Ein Web-Sheet ist kein
  UISheetPresentationController, eine CSS-Kurve keine UIKit-Feder.
- **Zwei harte Grenzen**, die keine Nacharbeit aufhebt:
  1. **Liquid Glass gibt es im WebView nicht.** Die Lichtbrechung braucht
     `backdrop-filter: url(#svg)`, und das rendert nur Chromium; WebKit fällt
     still auf einen Weichzeichner zurück (W3C svgwg #1142; die bekannteste
     Web-Bibliothek `liquid-glass-react` sagt es im README selbst: „Safari and
     Firefox only partially support the effect"). Echtes Glas gibt es nur
     über UIKit/SwiftUI.
  2. **Die Tastatur.** Das Capacitor-Tastatur-Plugin schneidet den WebView
     über der Tastatur ab; nach dem Schließen wertet WebKit
     `env(safe-area-inset-bottom)` nicht neu aus, die Tab-Leiste rutscht in
     die Displayrundung (Anton hat es beim ersten Durchklicken gesehen;
     ionic-team/capacitor #6430, offen). Die App müsste die Tastaturhöhe an
     17 Stellen in 14 Dateien selbst mitführen.

Die Codebasis zum Entscheidungszeitpunkt (Stand `1d349ce`, ohne Tests):

| Teil | Zeilen | Bei einem nativen Neubau |
|---|---:|---|
| Oberfläche (JSX) | 9.825 | neu |
| Stile (CSS) | 4.100 | neu |
| Logik `src/lib` | 8.039 | bleibt — 48 von 57 Dateien importieren weder React noch `document`/`window` |
| Texte `src/i18n`, sieben Sprachen | 6.263 | bleiben |
| `server.js` | 2.890 | bleibt in jedem Fall |

Also: rund 14.000 Zeilen Oberfläche werden ersetzt, rund 17.000 Zeilen
Logik, Texte und Server bleiben. Prompt-Kette, Regisseur, Schnitt,
Preisrechnung (`quote.js`) und Modelltabellen sind nicht betroffen.

## Betrachtete Optionen

1. **Capacitor behalten, Web nur nicht mehr als Ziel.** PR #40 zu Ende
   bringen, Tastatur-Plugin ausbauen, Tab-Leiste über
   `@capgo/capacitor-native-navigation` nativ legen.
2. **React Native mit Expo.** Neue Oberfläche mit nativen Bauteilen, eine
   Codebasis für iOS und Android, Logik und Texte übernommen.
3. **SwiftUI jetzt, Kotlin/Compose später.** Zwei native Oberflächen.

## Entscheidung

Gewählt: **Option 2, React Native mit Expo**, weil sie als einzige beides
liefert, was Anton verlangt: echte iOS-Bauteile (und damit Liquid Glass,
System-Übergänge, System-Tastatur) **und** Android aus derselben Codebasis.

Was Expo zum Entscheidungszeitpunkt konkret bietet (Expo Router v55,
veröffentlicht 02.03.2026; Reanimated 4 stabil):

- **NativeTabs:** auf iOS 26 zeichnet das System die Tab-Leiste mit Liquid
  Glass, Verkleinern beim Scrollen, optionalem Such-Tab; auf Android Material
  3 in den Farben des Hintergrundbilds. ⚠ Status **Alpha**, „API subject to
  change"; Android maximal fünf Tabs; **kein erhöhter Knopf in der Mitte**.
- **`GlassView`/`GlassContainer`** (`expo-glass-effect`): echte
  UIVisualEffectView, nur iOS 26+, sonst normale Fläche.
- **Toolbars** mit Glas und System-Animation, **Zoom-Übergänge** (der Traum
  öffnet sich aus seiner Kachel) — beides nur auf Apple.
- **Reanimated 4:** CSS-artige Übergänge und Federn auf dem UI-Thread; geteilte
  Elemente zwischen Bildschirmen noch experimentell.
- **`@expo/ui`:** echte SwiftUI-/Compose-Bauteile (Buttons, Listen, Sheets,
  Picker) aus React heraus.

**Antons Festlegung zum Plus-Knopf (11.09.):** Er wird ein normaler fünfter
Tab in der Mitte — Home · Journal · **Traum** · Schlaf · Profil — „da ist er
halt nicht mehr so oben." Fünf Tabs sind genau das Android-Maximum. Damit die
Mitte als Hauptaktion lesbar bleibt: gefülltes Plus-Symbol, die anderen vier
als Linien.

**Der Weg ist der Würgefeigen-Umzug**, nicht der Neubau auf der grünen Wiese
(so beschreibt es auch Expos eigener Skill `expo-web-to-native`): eine
Expo-Hülle, in der am ersten Tag die ganze bestehende React-Oberfläche als
DOM-Komponente läuft; danach Bildschirm für Bildschirm nativ neu gebaut,
wertvollste zuerst. Die App bleibt dabei jederzeit lauffähig. Reihenfolge,
vorläufig: Tab-Leiste → Journal-Liste und Traum-Seite → Wizard → Home →
Schlaf/Profil. Der Wizard-Zustand (`useWizard`) und `AppState` werden dabei
übernommen, nicht neu erfunden.

## Konsequenzen

**Besser:**
- Glas, Übergänge, Tastatur, Sheets, Zurück-Wischen: vom System, nicht
  nachgebaut. Das ist der Unterschied, den Anton meint.
- Android kommt aus derselben Codebasis, mit Material 3 statt fremdem Glas.
- Die Tastatur-Frage aus PR #40 erledigt sich; der Umbau an 17 Stellen entfällt.
- Der Browser ist kein Ziel mehr: Desktop-Layout, Chrome-Effekte und
  Safari-Verträglichkeit sind keine Kriterien mehr. **Der Vite-Dev-Server
  bleibt als Werkzeug** (Logik-Tests, Regie-Trockenläufe), nicht als Produkt.

**Schlechter / zur Pflicht:**
- Rund 14.000 Zeilen Oberfläche werden ein zweites Mal geschrieben. Das
  hält die Produktarbeit (Preisentscheid, Uhren, Anmeldung, Credits) an,
  solange es dauert — genau der Einwand aus ADR-0004, der weiter wahr ist.
  Der Würgefeigen-Weg mildert ihn: Server, Anmeldung und Abbuchung laufen
  unabhängig weiter, weil die native App denselben `server.js` spricht.
- NativeTabs ist Alpha. Wer darauf baut, hält den Expo-SDK-Stand fest und
  liest die Release Notes vor jedem Upgrade (`expo-upgrade`-Skill).
- Bezahlung ist ein **Fork, kein Tausch**: digitale Güter in der App laufen
  über Store-IAP mit RevenueCat, wie im Wachstumsplan vorgesehen — nicht
  über Stripe im WebView.
- PR #40 (natives Gefühl in Capacitor) wird zur **Zwischenlösung** für die
  alte Hülle. Er wird nur gemergt, wenn die Capacitor-App bis zum Umzug noch
  gezeigt werden soll; sonst bleibt er als Referenz für Bewegungssprache
  (Kurven, Dauern, Schwellen) und wird geschlossen.
- Die Skills `expo@claude-plugins-official` und
  `software-mansion-labs/skills` sind installiert und Pflichtlektüre vor
  jeder Oberflächenarbeit (Übergabe an Hanni).

## Verworfene Alternativen — warum

**Option 1, Capacitor mit nativer Tab-Leiste:** `@capgo/capacitor-native-navigation`
legt eine echte UITabBar über den WebView (Capacitor 8, MPL-2.0). Das löst
die Leiste, aber nicht Sheets, Übergänge, Glas auf Flächen oder die
Tastatur. Die Hülle bliebe ein WebView mit nativem Rand — „eine Webseite im
Rahmen", die Anton gerade abgelehnt hat. `stay-liquid` war zusätzlich nur ein
Proof of Concept (48 Sterne).

**Option 3, SwiftUI + Compose:** auf dem iPhone noch einen Tick besser als
React Native, aber jede Oberfläche zweimal, und die 8.039 Zeilen Logik plus
6.263 Zeilen Texte müssten zweimal übersetzt werden (Swift, Kotlin) statt
unverändert weiterzulaufen. Mit Android im Plan zu teuer für zwei Gründer
ohne Bezahlmodell.

**Web-Glas-Bibliotheken** (`liquid-glass-react`, 6.100 Sterne; Vue-/Tailwind-
Nachbauten): rendern in WebKit ohne Brechung — sähen auf dem iPhone aus wie
das, was die App schon hat. **Konsta UI** (iOS-26-Look, braucht Tailwind v4)
und das **iOS-26-Theme für Ionic** setzen je einen Stack voraus, den die App
nicht hat, und geben selbst zu, Glas nur mit Weichzeichnern anzunähern.

## Wann diese Entscheidung neu zu stellen ist

- Wenn NativeTabs nach zwei SDK-Versionen noch Alpha ist **und** die
  Tab-Leiste deshalb selbst gebaut werden müsste — dann ist der Vorteil
  gegenüber Option 1 kleiner als angenommen.
- Wenn der Umzug nach drei Monaten nicht mindestens Tab-Leiste, Journal und
  Traum-Seite nativ hat: dann frisst er die Produktarbeit, vor der ADR-0004
  gewarnt hat, und Option 1 ist der ehrlichere Weg.
