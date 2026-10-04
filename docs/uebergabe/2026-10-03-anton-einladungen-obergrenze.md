für: Anton, LeN1N-NWO

# Notiz an Anton — Einladungen: Obergrenze fürs Verbinden? (03.10.2026, Hanni)

Kurz zur Entscheidung, nichts Dringendes.

**Heute:** Mit einem Code kann man **beliebig viele** Konten verbinden. Begrenzt
ist nur die Prämie (höchstens 5 pro Monat, `REFERRAL_MONTHLY_CAP` in
`src/lib/invites.js`). Jedes Konto kann selbst nur einmal eingeladen werden
(`invitee_id` ist `unique` in `invite_redemptions`).

**Vorschlag:** eine Obergrenze, mit wie vielen Leuten man sich höchstens
verbinden kann — z. B. 50 oder 100 je Einladendem.

**Warum:**
- Geld verlieren wir ohne Grenze nicht — eine Prämie gibt es nur nach einem
  echten Kauf, 14 Tagen ohne Erstattung, gedeckelt auf 5 im Monat.
- Aber eine Grenze macht Massen-Wegwerfkonten unattraktiver, und
  `server_invite_overview()` gibt heute die **komplette** Liste aller
  Eingeladenen auf einmal zurück (`supabase/migrations/20261003120000_invites.sql`).
  Bei Tausenden Verbindungen wird die Antwort für die Profilseite groß.

**Offen — deine Entscheidung:**
1. Wollen wir eine Grenze? Wenn ja, wie hoch?
2. Was sieht der Eingeladene, wenn der Code „voll" ist? (Neuer Fehler neben
   `mutual`, also neuer Text in `en.js`/`de.js` und in
   `mobile/src/lib/invites.ts`.)

Den Server-Teil (Prüfung in `server_invite_connect`, Liste begrenzen) baue
ich, sobald du Ja und eine Zahl sagst.
