import { Directory, File, Paths } from "expo-file-system";

/* Die Aufnahme-Dateien auf dem Gerät (Antons Frage 10.10.: „bleibt das
 * irgendwo stecken, wenn jemand ständig anfängt und wegklickt?").
 *
 * expo-audio legt jede Aufnahme als eigene .m4a in Caches/ExpoAudio an
 * (≈ 1 MB je Minute) und löscht sie nie. Bis 10.10. blieb jede liegen —
 * verworfene, zu kurze, abgebrochene und auch die schon hochgeladenen.
 * iOS räumt Caches nur bei Platznot. Jetzt:
 *   · dropRecording — eine bestimmte Aufnahme weg (verworfen, zu kurz,
 *     oder sicher auf dem Server angekommen),
 *   · sweepRecordings — Reste älter als `maxAgeMs` weg (Absturz, App
 *     beendet mitten im Hochladen), die laufende Aufnahme ausgenommen. */
const DIR = "ExpoAudio";

export function dropRecording(uri: string | null | undefined) {
  if (!uri) return;
  try {
    const f = new File(uri);
    if (f.exists) f.delete();
  } catch (e) {
    console.warn("[recordings] drop", e);
  }
}

export function sweepRecordings(keep: string | null = null, maxAgeMs = 24 * 3600 * 1000) {
  try {
    const dir = new Directory(Paths.cache, DIR);
    if (!dir.exists) return 0;
    const now = Date.now();
    let n = 0;
    for (const item of dir.list()) {
      if (!(item instanceof File)) continue;
      if (keep && item.uri === keep) continue;
      const info = item.info();
      const t = info.modificationTime ?? info.creationTime ?? 0;
      if (t && now - t < maxAgeMs) continue;
      try { item.delete(); n += 1; } catch {}
    }
    return n;
  } catch (e) {
    console.warn("[recordings] sweep", e);
    return 0;
  }
}
