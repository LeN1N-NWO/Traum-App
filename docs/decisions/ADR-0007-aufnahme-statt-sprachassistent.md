# ADR-0007 — Aufnahme + Transkription statt Sprachassistent

**Status:** angenommen (Anton, 12.09.2026)

## Kontext

Der Traum wurde bisher im Gespräch mit einem Gemini-Live-Assistenten
erzählt (VoiceInterview.jsx, voiceSession.js): Er stellt Rückfragen, der
Text entsteht aus dem Dialog. Antons Befund nach Tests mit ein paar Leuten:
„Wenn du schlafen gehst und versuchst das einzusprechen, und er redet mit
dir — das ist ein bisschen weird." Dazu kostet die Live-Sitzung Geld, das
sich nicht sauber beziffern lässt (Audio-Token rein und raus, je Minute
Gespräch), und sie braucht eine offene WebSocket-Verbindung samt Mikrofon
im Webview — nativ ein zweiter Umzug, den niemand gebraucht hätte.

## Entscheidung

1. **Aufnehmen statt reden.** Der Plus-Tab zeigt einen Rekorder: Antippen,
   einsprechen, fertig. Keine Rückfragen, kein Dialog. Nativ mit
   `expo-audio` (m4a, AAC).
2. **Transkription über die vorhandene Route `/api/transcribe`** (fal.ai
   Wizper, Whisper v3): 0,50 $ je 1.000 Minuten, also 0,05 Cent pro
   Minute Traum — gegen Gemini Live faktisch kostenlos. Erkennt die Sprache
   selbst (de/en). DeepSeek kann kein Audio; Replicate wäre ein zweiter
   Anbieter für dasselbe. Die Lesung (DeepSeek, Analyse und Reinschrift)
   bleibt unverändert der nächste Schritt.
3. **Die Aufnahme bleibt am Traum.** Die m4a-Datei wird über `/api/panel`
   im Medienordner abgelegt (nach Inhalt benannt, wie Bilder und Filme) und
   am Journaleintrag als `audio.url` gespeichert. Die Traum-Seite spielt sie
   ab: die eigene Stimme von damals ist Teil des Journals, nicht nur der
   Text daraus.
4. **Der Gemini-Assistent bleibt im Web-Code liegen** (VoiceInterview.jsx),
   wird aber nicht mehr angeboten. Der Server-Teil (`/api/voice-*`) wird
   erst entfernt, wenn niemand ihn mehr braucht — Web ist kein Ziel mehr
   (ADR-0006).

## Konsequenzen

- Kosten je Traum-Aufnahme: ~0,001 $ (zwei Minuten) statt eines nicht
  bezifferbaren Live-Gesprächs. Keine Abbuchung beim Menschen.
- Speicher: ~1 MB je Minute m4a im Medienordner des Hauptrepositories
  (mediaRoot.js) — bei Fotos und Filmen fällt das nicht auf.
- Rechtstext: „Traumtexte" gehen an fal.ai — die Aufnahme ist Sprache
  desselben Inhalts; die Datenaufklärung (t.consent.details) nennt fal.ai
  bereits. Vor dem Store-Launch prüft der Anwalt, ob „Aufnahmen" explizit
  genannt werden müssen.
- Onboarding: das Stimm-Gespräch zur Profilumfrage (OnboardingSurvey)
  fällt damit ebenfalls — Fragebogen statt Gespräch (Antons Wunsch 12.09.).
