/* Wo die erzeugten Dateien liegen — und warum das nicht der Ordner ist, in
 * dem der Server gerade läuft.
 *
 * ⚠ Am 21.08.2026 sind echte, bezahlte Bilder verloren gegangen. Der Ablauf:
 * Eine Sitzung arbeitet laut AGENTS.md in einem eigenen Worktree
 * (`../Traum-App-vorname`). Wird der Server DORT gestartet, schreibt er seine
 * Bilder nach `../Traum-App-vorname/media/` — denn `media` ist ignoriert und
 * entsteht neu in jedem Checkout. Nach dem Merge wird der Worktree entfernt,
 * `git worktree remove` löscht auch die ignorierten Dateien, und das Tagebuch
 * zeigt auf `/media/…`-Pfade, hinter denen nichts mehr liegt. Die Träume
 * bleiben, die Bilder sind weg.
 *
 * Deshalb: Aus einem Worktree heraus zeigt der Medienordner IMMER auf das
 * Hauptrepository. Ein Worktree ist eine Arbeitskopie des Codes — die Bilder
 * eines Menschen sind keine Arbeitskopie.
 *
 * Erkennungsmerkmal: Im Hauptrepository ist `.git` ein VERZEICHNIS, in einem
 * Worktree eine DATEI mit einer Zeile
 *     gitdir: /pfad/zum/hauptrepo/.git/worktrees/<name>
 * Alles vor `/.git/worktrees/` ist die Wurzel, die wir suchen.
 */

const WORKTREE_MARK = /^(.*?)[/\\]\.git[/\\]worktrees[/\\]/;

/** @param {string} checkoutDir   Ordner, in dem der Server läuft
 *  @param {string|null} gitFileText  Inhalt von <checkoutDir>/.git, falls es
 *         eine DATEI ist (im Hauptrepo ist es ein Verzeichnis → null)
 *  @param {string} [override]  DREAMRUSHES_MEDIA, schlägt alles andere
 *  @returns {string} absoluter Pfad des Medienordners */
export function mediaRootFrom(checkoutDir, gitFileText, override) {
  if (override) return override.replace(/[/\\]+$/, "");

  const line = String(gitFileText || "").match(/gitdir:\s*(.+)/);
  if (line) {
    const hit = line[1].trim().match(WORKTREE_MARK);
    // Nur wenn der Pfad wirklich nach Worktree aussieht. Ein `.git`, das
    // irgendwohin sonst zeigt (Submodul), bleibt bei seinem eigenen Ordner:
    // raten ist hier schlimmer als danebenliegen.
    if (hit && hit[1]) return `${hit[1]}/media`;
  }
  return `${checkoutDir.replace(/[/\\]+$/, "")}/media`;
}
