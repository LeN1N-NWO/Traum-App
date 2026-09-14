# Werbung gegen Credits, Dream Recorder, Marketing-Agenten — Antworten

Stand 14.09.2026. Antons Fragen vom selben Tag. Die Belege stehen in drei
Recherchen:
- `2026-09-14-recherche-werbung-gegen-credits.md`
- `2026-09-14-recherche-dream-recorder.md`
- `2026-09-14-recherche-marketing-agenten.md`

## 1. Jahresabo — entschieden und gebaut

480 Credits am Kauftag, danach jeden Monat 131, Übertrag im Abojahr (Details
in `2026-09-13-abo-gewicht-und-jahresguthaben.md`, Regel `allowanceGrant()` in
`src/lib/plans.js`).

## 2. XL-Paket: Sind +40 % zu viel? — entschieden: 650 Credits (14.09.2026)

Vorsichtig gerechnet (Dollar = Euro, alle 700 Credits verbraucht, teuerster
Einkauf je Credit):

| | Apple 15 % | Apple 30 % |
|---|---|---|
| 49,99 € minus 19 % MwSt | 42,01 € | 42,01 € |
| minus Apple | 35,71 € | 29,41 € |
| minus KI-Kosten (700 Credits) | 15,93 € übrig (1,81×) | 9,63 € übrig (1,49×) |

Die 200 Extra-Credits kosten uns im Einkauf höchstens 5,65 €, nicht 40 % des
Preises. XL bringt je Euro am wenigsten von allen Paketen (S 2,52×, M 2,19×,
L 1,97×) und liegt knapp über der Test-Schwelle 1,75×.

**Empfehlung:** 650 Credits (+30 %). Das bringt 17,34 € (1,94×), die
Extra-Leiter M +15 / L +28 / XL +30 bleibt steigend, und der 30-s-Seedance-Film
in HD (511 Credits) passt weiter in einen Kauf. 600 Credits brächten mehr,
aber XL gäbe dann weniger Extra als L. **Der größere Hebel ist Apples Anteil:**
15 % statt 30 % sind 6,30 € je XL-Kauf.

## 3. „Wir haben keine Paywall" — der Kaufmoment

Stimmt: Es gibt keine Sperre am Anfang, die Beispiele und das Gratis-Angebot
kommen zuerst. Ein Kaufblatt gibt es trotzdem an drei Stellen
(`mobile/src/app/dream/order.tsx`, Profil):
- **„first"** direkt nach dem ersten Film („Das war dein erster"),
- **„spent"**, wenn die Credits nicht reichen,
- **„browse"** über den Credits-Knopf.

Mojos Befund (+14 % Abo-Umsatz ohne Credit-Pakete) gilt für das **erste**
Kaufblatt, das jemand sieht — bei uns „first". Unsere Paywall zeigt die Pakete
schon hinter einem zweiten Reiter, das Abo ist vorgewählt. Die Hälfte von Mojos
Änderung ist also schon da. **Nichts bauen**; nach dem Start „first" mit und
ohne Paket-Reiter testen.

## 4. Werbung schauen gegen Credits

**Was eine Werbung bringt:** Rewarded Video auf iOS in Deutschland rund 11 $
je 1.000 Ansichten, also **gut 1 Cent je Werbung** (USA 1,5 Cent, Android
Deutschland 0,5 Cent). Stand der gemessenen Werte: Appodeal, September 2024,
seitdem eher leicht gestiegen.

**Wie lange für einen Film** (30–35 s je Werbung inklusive Endkarte):

| Film | Einkauf | iOS Deutschland | iOS USA | Android Deutschland |
|---|---|---|---|---|
| günstigster (H3, 5 s, Standard, 11 Credits) | ~0,28 $ | ~26 Werbungen, **13–15 min** | ~19, 10–11 min | ~47, 24–28 min |
| 15 s Standard (31 Credits) | ~0,78 $ | ~71 Werbungen, **36–41 min** | ~52, 26–30 min | ~130, 65–76 min |

**In der Praxis länger:** Menschen sehen im Schnitt nur 0,65–0,8 solche
Werbungen am Tag, Apps begrenzen meist auf 2–10. Beim Durchschnittsnutzer
dauert der günstigste Film also rund einen Monat.

**Ein Credit gegen eine Werbung wäre Verlust:** Ein Credit kostet uns 2,5–2,8
Cent, eine Werbung bringt gut 1 Cent. Kostendeckend wären etwa 0,4 Credits je
Werbung. Die übliche Erwartung „1–3 Werbungen = 1 Film" läge beim 6- bis
24-Fachen der realistischen Erlöse.

**Erlaubt wäre es:** Apple erlaubt Belohnung fürs Werbung-Ansehen ausdrücklich
(Guideline 3.2.2(x), seit 09.06.2025). Grenzen: Abonnenten nie zu Werbung
zwingen, die App darf nicht überwiegend Werbung zeigen, keine Belohnung für
die Tracking-Zustimmung. Offerwalls mit „lade App X" sind auf iOS heikel.

**Was es uns außerdem kosten würde:** Ein Werbe-SDK bringt die
Tracking-Abfrage (ATT), eine zertifizierte Einwilligungsabfrage nach TCF v2.3
im EWR (Pflicht) und im App Store den Eintrag „Data Used to Track You" — auf
einem Traumtagebuch. Das passt nicht zu dem, was wir versprechen.

**Empfehlung: keine Werbung** (Anton: einverstanden). ⚠ Die beiden Ideen darunter
sind überholt — Einladungsprämie nur bei echtem Kauf des Freundes, kein
Willkommensgeschenk (`2026-09-14-codes-einladungen-plan.md`). Ursprünglich:
- **Freunde einladen:** Beide bekommen einen 5-s-Film (11 Credits, ~0,28 $
  Einkauf). Ein zahlender Neukunde ist ein Vielfaches wert.
- **Serie:** Sieben Morgen hintereinander aufgenommen → ein 5-s-Film. Stärkt
  genau die Gewohnheit, von der die App lebt.
Eine solche Belohnung kostet uns so viel, wie 26 Werbungen einbringen würden —
bringt aber einen Menschen oder eine Gewohnheit statt einer halben Stunde
Werbung, und es braucht kein Tracking.

## 5. Dream Recorder — Kooperation?

**Was es ist:** kein Unternehmen, sondern ein Open-Source-Bastelprojekt (MIT)
des Amsterdamer Studios Modem Works: Raspberry Pi am Nachttisch, Stimme →
Whisper → gpt-4o-mini → Luma, 5 s Lo-Fi-Film, eigene API-Schlüssel, ~285 € Teile.
Nicht zu kaufen.

**Stand:** ruht seit Juni 2025 (letzter Commit 19.06.2025, kein fremder PR je
bearbeitet). Luma hat die API umgestellt, neu gebaute Geräte laufen
wahrscheinlich nicht ohne Anpassung. Trotzdem 1.618 Sterne und 2026 wieder
Presse.

**Warum es reibt:** Modem will ein Schlafzimmer ohne Handy und Apps,
verwischte Gesichter, eine Woche Gedächtnis, und stellt sich gegen KI von
Konzernen und Risikokapital. Dream Rushes ist das Gegenteil davon.

**Empfehlung:** klein anfragen, mit einem Geschenk vorweg.
1. Eine kurze Mail von Anton an office@modemworks.com: Wir bieten einen
   anbieterneutralen Fix für die kaputte Luma-Anbindung an (MIT, ohne
   Dream-Rushes-Branding) und fragen, ob sie ihn annehmen würden. Entwurf in
   der Recherche, Abschnitt 8 — **nicht verschickt**.
2. Vorher nichts Öffentliches in ihrem Repo.
3. Nach drei bis vier Wochen ohne Antwort einmal nachfassen, dann loslassen.

**Nie den Namen „Dream Recorder" verwenden:** In Deutschland ist
„dreamrecorder" als Wortmarke eines Dritten eingetragen (nicht Modem). „Dream
Rushes" hatte in TMview und DPMA keine Treffer.

**Mitnehmen:** Die Kritik auf Hacker News trifft uns genauso — Worte verlieren
Information, die KI erfindet Details, niemand nimmt Träume wirklich auf. Das
im Onboarding ehrlich sagen.

## 6. SEO-Agent und Reddit-Bots mit Hermes

**Hermes Agent kann das technisch alles** (v0.21.2): mehrere Profile parallel,
Cron-Jobs, Skills, Gedächtnis, Telegram. Das Risiko ist der Einsatz, nicht die
Technik.

**SEO-Agent — ja, als Zuarbeiter.** Recherche, Entwürfe, technisches SEO als
Pull Request; ein fachkundiger Mensch prüft und veröffentlicht. Start mit einem
gründlichen Artikel pro Woche. Zwei Gründe, warum er nicht selbst postet:
- KI-Verordnung Art. 50 Abs. 4 (seit 02.08.2026, nicht verschoben): Texte über
  Gesundheit und Wissenschaft brauchen eine KI-Kennzeichnung, außer ein Mensch
  prüft sie echt und steht redaktionell dafür ein.
- Google: Masse ohne Mehrwert ist „scaled content abuse". KI-Übersichten nehmen
  reinen Zusammenfassungen die Klicks (Platz 1 rund −58 %).

**Reddit-Bots, die Beiträge beantworten — so nicht.**
- Reddit: Seit 11.11.2025 braucht jeder API-Zugang eine Genehmigung,
  kommerzielle Nutzung eine schriftliche. Bots tragen seit 31.03.2026 ein
  [App]-Label und brauchen ein eigenes Konto. KI-Text, der sich als menschlich
  ausgibt, ist verboten. Reddit löscht täglich rund 100.000 Bot-Konten.
- Recht: Ein Unternehmer, der sich als normaler Nutzer ausgibt, handelt immer
  unzulässig (UWG Anhang Nr. 22). Automatisierte Beiträge von menschlich
  wirkenden Konten müssen gekennzeichnet sein (§ 18 Abs. 3 MStV). In den USA:
  FTC bis 53.088 $ je Verstoß, Kaliforniens Bot-Gesetz.

**Was geht:** Der Agent beobachtet und schickt Anton Antwortentwürfe per
Telegram. Anton postet selbst, vom offen gekennzeichneten Gründer-Konto, neun
von zehn Beiträgen ohne App-Nennung. Ein echter Bot höchstens später im eigenen
Subreddit, genehmigt und gekennzeichnet.

**Gebaut:** Skill-Vorlagen und Einrichtung in `docs/marketing/hermes/`
(`seo-redaktion`, `community-scout`, Regeltabelle der Subreddits zum Ausfüllen).
Die Regeln der Subreddits selbst sind **ungeprüft** — die Recherche kam an
reddit.com nicht heran.

**Nebenbefund:** Die Filme der App selbst brauchen ab Tag 1 eine
maschinenlesbare KI-Markierung (Art. 50 Abs. 2); die Schonfrist bis 02.12.2026
gilt nur für Systeme, die vor dem 02.08.2026 am Markt waren. Steht schon im
Marketingplan, gehört vor den Launch zur Anwältin.
