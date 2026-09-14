# Marketing-Agenten mit Hermes: Einrichtung

Stand 14.09.2026. Das sind Vorlagen für Antons Hermes-Agenten (Nous Research,
v0.21.2). Die Regeln dahinter stehen mit Quellen in
`docs/plans/2026-09-14-recherche-marketing-agenten.md`. Es gibt keine Rechtsberatung,
vor dem Launch schaut eine Anwältin oder ein Anwalt auf UWG, HWG und DSGVO.

⚠ Die Konfigurationsschlüssel unten stammen aus der Hermes-Doku vom
14.09.2026. Hermes erscheint im Takt von Tagen. Vor dem Einrichten gegen
https://hermes-agent.nousresearch.com/docs/ prüfen.

## Die eine Regel für beide

**Die Agenten arbeiten zu, ein Mensch veröffentlicht.** Der SEO-Agent schreibt
Entwürfe als Pull Request, der Community-Agent schickt Antwortentwürfe per
Telegram an Anton. Keiner der beiden hat Zugangsdaten zum Veröffentlichen.

Warum (Kurzfassung):
- **Blog:** Die KI-Verordnung (Art. 50 Abs. 4, gilt seit 02.08.2026) verlangt
  bei Texten über Gesundheit und Wissenschaft eine KI-Kennzeichnung. Die
  Pflicht entfällt nur, wenn ein fachkundiger Mensch den Text wirklich prüft
  und dafür redaktionell geradesteht. Google stuft Masse ohne Mehrwert als
  Spam ein.
- **Reddit:** Jede Automatisierung braucht Reddits Genehmigung, ein
  [App]-Label und ein eigenes Konto. Ein Unternehmer, der sich als normaler
  Nutzer ausgibt, handelt immer unzulässig (UWG Anhang Nr. 22).
  Automatisierte Beiträge von menschlich wirkenden Konten müssen gekennzeichnet
  sein (§ 18 Abs. 3 Medienstaatsvertrag).

## Zwei Profile

```bash
hermes profile create seo
hermes profile create community
```

Jedes Profil bekommt den Skill aus diesem Ordner (`seo-redaktion/` bzw.
`community-scout/`) nach `~/.hermes/profiles/<name>/skills/` (oder den Weg,
den `hermes profile` anzeigt). Nie zwei Prozesse auf dasselbe Profil.

## Einstellungen (config.yaml je Profil)

| Einstellung | Wert | Warum |
|---|---|---|
| `approvals.mode` | `manual` | kein Befehl ohne Freigabe, nie `--yolo` |
| `skills.write_approval` | `true` | der Agent schreibt sich sonst eigene Regeln |
| `memory.write_approval` | `true` | dasselbe fürs Gedächtnis |
| `agent.max_turns`, `agent.run_budget_seconds` | setzen | Kosten deckeln |
| Cron | Monitor-Modus, alle 6 h statt alle 10 min | kostet sonst ohne Ergebnis |
| Gateway | `TELEGRAM_ALLOWED_USERS=<Antons ID>` | nie `GATEWAY_ALLOW_ALL_USERS` |

**Werkzeuge:**
- `community`: nur `web`, `file`, `memory`, `cronjob`, Nachricht an Anton.
  **Kein** `browser`, `terminal`, `x_search`.
- `seo`: `web`, `file`, `terminal` im Docker-Backend, `browser` nur lokal.

**Abschalten bzw. nie anbinden:**
- Cloud-Browser mit Stealth-Modus, Residential-Proxys, CAPTCHA-Lösung, Camofox:
  genau die Signale, an denen Reddit, X und TikTok Bot-Netze erkennen.
- Skill `blocked-page-recovery`: umgeht Sperren und Bezahlschranken.
- Skill `humanizer` nie, um KI-Herkunft zu verstecken.
- Passwort-Tresor (neu in v0.21.2), Zahlungsdaten, Social-Media-Tokens mit
  Schreibrecht, CMS-Zugänge mit Veröffentlichungsrecht.
- Modelle, die mit den eingegebenen Daten trainieren (Hermes warnt).

## Was Anton selbst tun muss, bevor der Community-Agent läuft

1. Die Regeln jedes Subreddits lesen und in
   `community-scout/references/subreddit-rules.md` eintragen, mit Datum. Die
   Recherche kam an reddit.com nicht heran, dort steht noch nichts Geprüftes.
2. Prüfen, ob Reddit Pro (Trends, Verifizierung) für eine deutsche Firma geht.
   Das ist der saubere Weg zum Beobachten.
3. Gründer-Konto offen kennzeichnen (Profil-Text unten).

## Offenlegung zum Kopieren

- Reddit-Kommentar: „Disclosure: I'm one of the founders of Dream Rushes, a
  dream-journal app. Not linking it here – happy to answer questions."
- Wenn die App empfohlen wird: „Full disclosure: this is my own app, so I'm biased."
- Mit KI-Hilfe: „(Drafted with help from an AI tool; I checked the sources myself.)"
- Profil: „Co-founder @ Dream Rushes (dream journal app). I always disclose when I mention it."
- Deutsch: „Transparenzhinweis: Ich bin Mitgründer von Dream Rushes (Traumtagebuch-App)."
