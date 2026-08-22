import { test, expect } from "bun:test";
import { mediaRootFrom } from "./mediaRoot.js";

/* Diese Datei bewacht einen echten Verlust, keinen hypothetischen: Am
   21.08.2026 lagen die Bilder einer Testrunde im Worktree, der Worktree wurde
   nach dem Merge entfernt, und mit ihm die Bilder. Wer die Regel unten wieder
   lockert, wiederholt das. */

test("im Hauptrepository bleibt der Medienordner, wo er ist", () => {
  expect(mediaRootFrom("/Users/a/Traum-App", null)).toBe("/Users/a/Traum-App/media");
});

test("aus einem Worktree heraus zeigt er auf das Hauptrepository", () => {
  const gitFile = "gitdir: /Users/a/Traum-App/.git/worktrees/Traum-App-anton\n";
  expect(mediaRootFrom("/Users/a/Traum-App-anton", gitFile)).toBe("/Users/a/Traum-App/media");
});

test("ein .git, das NICHT auf einen Worktree zeigt, wird nicht umgebogen", () => {
  // Submodul o. Ä. — raten wäre hier schlimmer als danebenliegen.
  expect(mediaRootFrom("/Users/a/sub", "gitdir: ../.git/modules/sub\n")).toBe("/Users/a/sub/media");
});

test("die Umgebungsvariable schlägt alles", () => {
  const gitFile = "gitdir: /Users/a/Traum-App/.git/worktrees/x\n";
  expect(mediaRootFrom("/Users/a/x", gitFile, "/Volumes/Platte/dreams/")).toBe("/Volumes/Platte/dreams");
});

test("Mist im .git kippt den Server nicht um", () => {
  for (const junk of ["", "   ", "kein gitdir hier", null, undefined]) {
    expect(mediaRootFrom("/Users/a/Traum-App", junk)).toBe("/Users/a/Traum-App/media");
  }
});
