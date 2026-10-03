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
   zurückkommen und gespeichert werden. Bei Filmen ist das die Abholung:
   Die App fragt `/api/job`, der Server fragt fal, und wenn der Film fertig
   ist, lädt `storeAll` → `storeMedia` ihn herunter und legt ihn unter
   `/media/` ab. Genau diese Anfrage trägt seit S1 das geprüfte Token — dort
   ist bekannt, wem der Film gehört. **Frage:** Baust du das, oder darf ich es bauen — nur die
   Zuordnung beim Speichern, ohne Prompts, Modelle oder Anfragekörper
   anzufassen?
2. **Lücke in der Sicherung — deine Pipeline:** Scheitert das
   Herunterladen von fal, gibt `storeAll` die **fal-Adresse** weiter
   (`(await storeMedia(u)) || u`). Dann liegt der Film nur bei fal, nicht
   bei uns, und fal-Adressen gelten nicht ewig. Vorschlag: später erneut
   herunterladen, statt die fal-Adresse zu behalten. Und: Abgeholt wird nur,
   solange eine App `/api/job` fragt — sonst bleibt ein fertiger Film bei
   fal liegen (die verwaisten Filme). Für die Sicherung sollte der Server
   fertige Aufträge selbst abholen.
3. **Konto löschen löscht die Medien (B8)** — hängt an derselben Zuordnung;
   das baue ich mit, sobald Punkt 1 steht.
4. **Snapshots/Backups des VPS bei Hetzner einschalten** — die Sicherung
   braucht selbst eine Sicherung (stand schon in der Übergabe vom 25.09.,
   ist jetzt wichtiger).
5. **Platz im Blick behalten:** 5–10 MB je Film. Die Rechnung vom 24.09.:
   bei 1.000 Nutzern wäre eine VPS-Platte nach rund einem Monat voll. Dann
   ziehen die Medien in Object Storage um — `src/lib/media-store.js` liegt
   dafür bereit.

Den Object-Storage-Bucket brauchst du vorerst nicht anzulegen.
