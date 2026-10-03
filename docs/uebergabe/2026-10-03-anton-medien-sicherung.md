für: Anton, LeN1N-NWO

# Übergabe an Anton — Medien bleiben auf dem Server (03.10.2026, Hanni)

Wie abgesprochen, festgehalten in
`docs/decisions/ADR-0008-server-als-sicherung-kein-object-storage.md`:
Ein Film entsteht auf dem Server und bleibt dort als Sicherung; das Gerät
holt ihn einmal ab und spielt ihn ab dann lokal. Kein Upload, kein Object
Storage, kein Löschen nach dem Abholen — Keyframes und Abspann finden ihre
Quellen weiter unter `/media/`. Traumtexte bleiben verschlüsselt in Supabase.

## Was daraus folgt — und wo ich dich brauche

1. **Wer darf welche Datei abrufen (S2) — berührt deine Pipeline.** Weil die
   Medien jetzt dauerhaft auf dem Server liegen, darf `/media/*` nur noch an
   den Besitzer gehen. Dafür muss der Server beim Ablegen festhalten, wem
   die Datei gehört — also an der Stelle, wo Bilder und Filme von fal.ai
   zurückkommen und gespeichert werden (`storeBytes`, die Film-Abholung über
   `/api/job`). Die Nutzerkennung gibt es seit S1 an jeder bezahlten
   Anfrage. **Frage:** Baust du das, oder darf ich es bauen — nur die
   Zuordnung beim Speichern, ohne Prompts, Modelle oder Anfragekörper
   anzufassen?
2. **Konto löschen löscht die Medien (B8)** — hängt an derselben Zuordnung;
   das baue ich mit, sobald Punkt 1 steht.
3. **Snapshots/Backups des VPS bei Hetzner einschalten** — die Sicherung
   braucht selbst eine Sicherung (stand schon in der Übergabe vom 25.09.,
   ist jetzt wichtiger).
4. **Platz im Blick behalten:** 5–10 MB je Film. Die Rechnung vom 24.09.:
   bei 1.000 Nutzern wäre eine VPS-Platte nach rund einem Monat voll. Dann
   ziehen die Medien in Object Storage um — `src/lib/media-store.js` liegt
   dafür bereit.

Den Object-Storage-Bucket brauchst du vorerst nicht anzulegen.
