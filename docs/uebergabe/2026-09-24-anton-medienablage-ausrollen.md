Für: Anton, LeN1N-NWO

Hallo Anton — die Umstellung, die wir heute Abend entschieden haben
(Träume auf dem Gerät, Sicherung Ende-zu-Ende verschlüsselt), ist zu drei
Vierteln gebaut: Schritte A, B und D in PR #59. Plan:
`docs/plans/2026-09-24-medienablage.md`. **Deine Prompt-Kette, Modelle und
Regie sind unberührt.** Hier, worauf du beim Ausrollen achten musst, und
was Schritt C von dir braucht.

## Was fertig ist (und bei mir belegt)

- **A:** Filme, Bilder, Aufnahmen werden einmal nach `Documents/media/`
  geladen und von dort gespielt (`mobile/src/lib/media-cache.ts`). Server
  aus → Film spielt trotzdem.
- **B:** Jeder Traum wird auf dem Gerät verschlüsselt (AES-256-GCM),
  Schlüssel im iCloud-Schlüsselbund (`mobile/src/lib/backup-key.ts`).
  Der Server nimmt nur noch versiegelte Träume an. App gelöscht und neu
  installiert → Traum entschlüsselt zurück, Film und Aufnahme wieder da.
- **D:** Datenschutz, Einwilligung und Kachel sagen „verschlüsselt, nur für
  dich lesbar" — ausdrücklich nur für die Träume. Die Einwilligung sagt
  auch, dass Filme bis Schritt C noch unverschlüsselt auf dem Server liegen.

⚠ **Nicht belegt: die iCloud-Synchronisation selbst.** Im Simulator ist
keine Apple-ID angemeldet. Belegt ist nur, dass der Schlüssel das Löschen
der App übersteht. Ob er über iCloud auf ein anderes iPhone wandert, zeigt
erst ein echtes Gerät — **bitte bei dir am iPhone:** Traum anlegen, warten
bis gesichert, App löschen, neu installieren → Traum muss mit Text
zurückkommen. Mit einem zweiten Gerät derselben Apple-ID wäre es ganz
belegt.

## Reihenfolge beim Ausrollen — bitte genau so

1. **Datenbank zuerst.** Migration
   `supabase/migrations/20260924100000_dreams_sealed.sql` (Spalten `sealed`,
   `key_id`). ✅ **Habe ich im Supabase-Dashboard schon ausgeführt** — für
   uns beide erledigt, wir teilen dieselbe Datenbank.
2. **Dann der Server** (`server.js` aus PR #59). Ohne die Migration würde
   er beim Abgleich mit einem Datenbankfehler scheitern — deshalb 1 vor 2.
3. **Zuletzt die App.** Der neue Bau braucht auf deinem Mac:
   - `bun install` im Ordner `mobile` — spielt den Patch
     `mobile/patches/expo-secure-store@57.0.4.patch` ein (iCloud-
     Schlüsselbund). ⚠ Wie beim jsi-Patch: nicht von Hand in
     `node_modules` ändern.
   - **Prebuild, `pod install` und ein neuer App-Bau** — der Patch ist
     nativer Code, Metro allein reicht nicht. (Gilt genauso für den
     Hauptordner auf meinem Mac.)
   - Auf dem iPhone muss der **iCloud-Schlüsselbund an** sein, sonst
     übersteht der Schlüssel das Löschen der App nicht.

**Warum diese Reihenfolge nicht egal ist** — ich habe es im Test erlebt:
Eine neue App gegen einen alten Server hat die verschlüsselten Träume als
leere Klartext-Träume gespeichert und damit die Sicherung überschrieben.
Das ist jetzt abgesichert (Commit `89788a7`): Der neue Server kündigt
`format: "sealed-v1"` an, und die App schickt **nichts**, wenn die
Ankündigung fehlt (`server-too-old`). Trotzdem: Server vor App.

Was in den Übergangsfällen passiert:
- **Neue App, alter Server** (z. B. dein `bun run api` noch auf `main`):
  die App schickt nichts. Kein Schaden, nur keine Sicherung.
- **Alte App, neuer Server:** der Server lehnt Klartext ab (400) — die
  alte App sichert nichts mehr. Beim Holen bekommt sie Zeilen ohne Text;
  Träume, die schon auf dem Gerät sind, bleiben unverändert (die Brücke
  ergänzt nur Unbekanntes). Nur nach einer Neuinstallation der ALTEN App
  tauchen leere Einträge auf. → Alte Bauten nach dem Merge nicht mehr
  benutzen.
- **Alte Klartext-Zeilen** in der Datenbank überschreibt der erste Abgleich
  der neuen App versiegelt und leert die Klartext-Spalten.

## Schritt C — braucht dich

**Was C ist:** Auch Filme, Bilder und Aufnahmen werden auf dem Gerät
verschlüsselt und so gesichert. Ablage in **Hetzner Object Storage** (S3,
Deutschland, 6,49 €/Monat für 1 TB inkl. Traffic; Hetzner ist durch deinen
VPS schon Auftragsverarbeiter, kein neuer Anbieter). Der Server hält Filme
nur noch, **bis das Gerät sie abgeholt hat**, und löscht sie dann — heute
bleiben sie unbegrenzt liegen und sind für jeden mit der `/media/…`-Adresse
abrufbar (Architektur-Baustellen S2/S3). Konto löschen löscht auch die
Objekte in Hetzner.

**Warum C wartet:** C hängt am Umzug des Servers auf deinen Hetzner-VPS.
Vorher gibt es keinen Ort, an dem der Server dauerhaft läuft und die
Filme ausliefern kann.

**Was ich von dir brauche, bevor ich C baue:**
1. **Die Bedingungen für den VPS** aus dem Plan (Abschnitt „Bedingungen für
   Antons Hetzner-VPS"): Standort DE oder FI; eigener Systemnutzer und
   eigene `.env`, getrennt von deinen anderen Projekten; Firewall
   22/80/443; wer außer dir Zugang hat; Auftragsverarbeitungsvertrag im
   Hetzner-Kundenkonto. Sag mir, was davon schon so ist.
2. **Ein Object-Storage-Bucket** in derselben Region, privat, und ein
   Zugangsschlüssel nur für diesen Bucket. ⚠ Den Schlüssel bitte nicht in
   den Chat oder ins Repo, sondern direkt in die `.env` auf dem Server.
3. **Wann der Umzug passt.** Das Einrichtungsskript (Bun, ffmpeg, Caddy,
   systemd, Updates, Deploy mit einem Befehl) baue ich gern vorher mit —
   sag nur, ob du es selbst machen willst.
4. **Deine Sicht auf zwei Punkte, die C berührt:**
   - Auftragsstand (`media/jobs`) bleibt vorerst auf der Server-Platte —
     einverstanden?
   - `/api/cast-backup` speichert Fotos auf dem Server und muss vor der
     Veröffentlichung raus (`server.js:3028`). Brauchst du es noch?

Bauen würde ich C als ein Speicher-Modul mit vier Befehlen (ablegen, holen,
löschen, alles eines Kontos löschen), mit `local` für die Entwicklung —
`server.js` kennt dann nur diese Befehle. Wo es andockt, spreche ich vorher
mit dir ab.

Hanni
