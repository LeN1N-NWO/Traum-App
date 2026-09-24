-- Träume-Sicherung Ende-zu-Ende verschlüsselt (Hanni + Anton 24.09.2026,
-- docs/plans/2026-09-24-medienablage.md, Schritt B).
--
-- Die App verschlüsselt jeden Traum AUF DEM GERÄT (AES-256-GCM, Schlüssel im
-- iCloud-Schlüsselbund) und schickt nur noch den versiegelten Block. Server
-- und Datenbank sehen keinen Traumtext mehr.
--
--   sealed  — IV + Chiffretext + Tag, base64. Unlesbar ohne den Schlüssel.
--   key_id  — Kennung des Schlüssels (Hash, NICHT der Schlüssel). Damit
--             überschreibt ein Gerät mit einem anderen Schlüssel nie eine
--             fremde Sicherung (server.js prüft das beim Einspielen).
--
-- Die Klartext-Spalten bleiben (leer) stehen: Ein Zurückbauen wäre eine
-- zweite Migration mit Datenverlust-Risiko, und leere Spalten kosten nichts.
-- Vorhandene Klartext-Zeilen überschreibt der nächste Abgleich versiegelt.
--
-- Rechte: dreamrushes_server hat Tabellenrechte auf dreams (server_role.sql),
-- RLS gilt zeilenweise — neue Spalten sind damit abgedeckt, nichts zu tun.

begin;

alter table public.dreams
  add column sealed text,
  add column key_id text;

-- Gegen Unfug, nicht gegen Angriffe: ein versiegelter Traum ist Text plus
-- Analyse, weit unter einem Megabyte. Die Kennung ist 16 Hex-Zeichen.
alter table public.dreams
  add constraint dreams_sealed_size check (sealed is null or length(sealed) <= 1048576),
  add constraint dreams_key_id_shape check (key_id is null or key_id ~ '^[0-9a-f]{16}$');

commit;
