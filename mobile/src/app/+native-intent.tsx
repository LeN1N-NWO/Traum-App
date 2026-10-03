/* Einladungslinks (03.10.2026): `dreamrushes://invite/CODE` und — sobald
 * Hanni die Domain mit Universal Links verbindet (associatedDomains + AASA)
 * — `https://dreamrushes.app/i/CODE` landen auf der Einladungs-Seite im
 * Profil, der Code steht dort schon im Feld. Alles andere geht unverändert
 * durch. */
export function redirectSystemPath({ path }: { path: string; initial: boolean }) {
  try {
    const m = /(?:^|\/)(?:i|invite)\/([A-Za-z0-9-]{5,12})(?:[/?#]|$)/.exec(path);
    if (m) return `/profile/invite?code=${encodeURIComponent(m[1])}`;
  } catch {}
  return path;
}
