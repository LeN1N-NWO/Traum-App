/* Die Besetzung als Dateien — Antons Ansage vom 25.08.2026:
 *
 *   „Ich habe satt, immer wieder mich selbst in der Testumgebung
 *   hinzuzufügen und zu bemessen. … Ausdrücklich von mir so gewünscht."
 *
 * Er hat recht, und der Ärger war hausgemacht. Träume überleben einen
 * geleerten Speicher längst (journalBackup.js) — die Menschen darin nicht.
 * Wer den Browser wechselte, stand vor einem Traum, in dem er selbst
 * vorkommt, und musste sich neu anlegen: Foto hochladen, beschreiben,
 * Charakterbogen für Geld neu rendern. Jedes Mal.
 *
 * ── ⚠ Warum das ANDERS ist als die Traum-Sicherung ───────────────────────
 * `journalBackup.js` sichert ausdrücklich KEINE Fotos, über eine erlaubte
 * Feldliste, und ein Test wacht darüber. Diese Datei tut das Gegenteil —
 * auf Antons ausdrückliche Anweisung, für seine Testumgebung.
 *
 * Deshalb steht sie NEBEN der anderen und nicht darin: Zwei gegensätzliche
 * Regeln in einer Datei werden irgendwann verwechselt. Wer den Foto-Schutz
 * der Traum-Sicherung sucht, findet ihn dort unverändert.
 *
 * ⚠ Und deshalb liegt das Ziel unter `/media` (gitignored), nicht unter
 * `data/`. Die Bilder bleiben dauerhaft auf dem Rechner und gelten über
 * alle Browser hinweg — aber sie wandern nicht in die Git-Historie. Der
 * Unterschied ist nicht Vorsicht, sondern Umkehrbarkeit: Eine Datei kann
 * man löschen, einen Commit praktisch nicht. Und die Gesichter gehören
 * teils anderen Menschen, die von diesem Repository nichts wissen.
 *
 * ⚠ Vor der Veröffentlichung: diesen Weg entfernen — Ordner, die beiden
 * Endpunkte in server.js und den Ladepfad in AppState.jsx. Er hängt wie die
 * Traum-Sicherung an `import.meta.env.DEV`, ist also in einem
 * ausgelieferten Build ohnehin tot.
 */

/** Dateiname einer Figur: über den @tag, denn der ist im Ensemble eindeutig
 *  und bleibt lesbar — anders als eine erzeugte Id sieht man im Ordner, wer
 *  drinsteht. */
export function castName(member) {
  const tag = String(member?.tag || member?.id || "ohne-tag")
    .replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 60) || "ohne-tag";
  return `${tag}.json`;
}

/** Was von einer Figur gesichert wird.
 *
 *  Hier ist die Liste bewusst GROSSZÜGIG — Fotos inklusive. Das ist der
 *  ganze Zweck: Was fehlt, muss beim nächsten Mal neu hochgeladen und der
 *  Bogen neu gerendert werden, und der kostet Geld.
 *
 *  ⚠ `sheetOf` MUSS mit. Das ist der Fingerabdruck, aus dem der Bogen
 *  entstand (sheets.js). Fehlt er, hält die App den mitgesicherten Bogen
 *  für veraltet und rendert ihn beim ersten bezahlten Bild neu — die
 *  Sicherung hätte dann nichts gespart. */
export function castEntry(member) {
  if (!member?.tag) return null;
  const sicher = {
    tag: member.tag,
    id: member.id || undefined,
    name: member.name || undefined,
    category: member.category || undefined,
    desc: member.desc || undefined,
    wardrobe: member.wardrobe || undefined,
    img: member.img || undefined,
    img2: member.img2 || undefined,
    sheet: member.sheet || undefined,
    sheetOf: member.sheetOf || undefined,
    /* Markiert, wer von den beiden das eigene Porträt ist: Es lebt in
       `state.me`, nicht in `state.cast`, und muss beim Zurückholen wieder
       dorthin. Ohne die Marke stünde Anton nach dem Wiederherstellen als
       gewöhnliches Ensemble-Mitglied da. */
    self: member.self === true ? true : undefined,
  };
  for (const [k, v] of Object.entries(sicher)) if (v === undefined) delete sicher[k];
  return sicher;
}

/** Alles, was gesichert werden soll: das Ensemble plus das eigene Porträt. */
export function castPayload(cast, me) {
  const alle = [
    ...(cast || []),
    ...(me?.tag ? [{ ...me, self: true }] : []),
  ];
  return alle
    .map((m) => ({ datei: castName(m), figur: castEntry(m) }))
    .filter((x) => x.figur);
}

/** Fingerabdruck — damit die App nur schreibt, wenn sich wirklich etwas an
 *  den Figuren geändert hat.
 *
 *  ⚠ Über die LÄNGEN der Bilddaten, nicht über die Daten selbst: Ein Foto
 *  ist schnell ein Megabyte, und diese Zeichenkette wird bei jedem Render
 *  neu gebildet. Eine Länge ändert sich zuverlässig mit, wenn das Bild ein
 *  anderes wird. */
export function castFingerprint(cast, me) {
  return castPayload(cast, me)
    .map(({ datei, figur }) =>
      `${datei}:${(figur.img || "").length}:${(figur.img2 || "").length}` +
      `:${(figur.sheet || "").length}:${figur.sheetOf || ""}:${figur.desc || ""}`)
    .join("|");
}

/** Gesicherte Figuren zurück ins Ensemble.
 *
 *  ⚠ ERGÄNZT, überschreibt nie. Wer eine Figur im Gerät geändert hat, hat
 *  den neueren Stand — die Sicherung ist das Archiv, nicht die Wahrheit.
 *  Dieselbe Regel wie bei den Träumen, und aus demselben Grund.
 *
 *  @returns {{cast, me}|null} — null, wenn es nichts zu ergänzen gibt.
 */
export function mergeCast(cast, me, gesicherte) {
  const vorhanden = new Set((cast || []).map((c) => c?.tag).filter(Boolean));
  if (me?.tag) vorhanden.add(me.tag);

  let neuesMe = me;
  const neue = [];
  for (const g of gesicherte || []) {
    if (!g?.tag || vorhanden.has(g.tag)) continue;
    const { self, ...figur } = g;
    if (self && !neuesMe?.tag) neuesMe = figur;
    else neue.push(figur);
    vorhanden.add(g.tag);
  }
  if (!neue.length && neuesMe === me) return null;
  return { cast: [...(cast || []), ...neue], me: neuesMe };
}
