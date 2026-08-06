#!/usr/bin/env node
// Checkpoints: benannte Wiederherstellungspunkte als annotierte Git-Tags.
// Geteilt, dauerhaft, für alle sichtbar — im Gegensatz zum sitzungslokalen /rewind.
//
//   node scripts/checkpoint.js create <name> [beschreibung...]
//   node scripts/checkpoint.js list
//   node scripts/checkpoint.js show <name>
//   node scripts/checkpoint.js restore <name>
//
// restore schreibt die Historie NIE um: der alte Stand kommt als normale,
// noch zu committende Änderung zurück — auch das Zurückholen bleibt umkehrbar.

'use strict';

const { execFileSync } = require('node:child_process');

const PREFIX = 'checkpoint/';

function git(...args) {
  return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).replace(/\n$/, '');
}

function fail(msg) {
  console.error('✗ ' + msg);
  process.exit(1);
}

function fullTag(name) {
  return name.startsWith(PREFIX) ? name : PREFIX + name;
}

function tagExists(tag) {
  try { git('rev-parse', '--verify', '--quiet', 'refs/tags/' + tag); return true; }
  catch { return false; }
}

const [, , cmd, name, ...rest] = process.argv;

switch (cmd) {
  case 'create': {
    if (!name) fail('Name fehlt. Aufruf: node scripts/checkpoint.js create <name> [beschreibung]');
    if (!/^[a-z0-9][a-z0-9._-]*$/i.test(name)) fail('Name darf nur Buchstaben, Zahlen, Punkt, Minus, Unterstrich enthalten.');
    const tag = fullTag(name);
    if (tagExists(tag)) fail('Checkpoint "' + name + '" existiert schon. Anderen Namen wählen (list zeigt alle).');
    const dirty = git('status', '--porcelain');
    if (dirty) {
      console.log('⚠ Es gibt uncommittete Änderungen — die landen NICHT im Checkpoint.');
      console.log('  Ein Checkpoint zeigt immer auf einen Commit. Erst committen, dann Checkpoint setzen.');
      process.exit(1);
    }
    const who = (() => { try { return git('config', 'user.name'); } catch { return 'unbekannt'; } })();
    const message = (rest.join(' ') || 'Wiederherstellungspunkt') + ' — gesetzt von ' + who;
    git('tag', '-a', tag, '-m', message);
    console.log('✓ Checkpoint gesetzt: ' + tag + ' → ' + git('rev-parse', '--short', 'HEAD'));
    console.log('  Teilen nicht vergessen: git push --tags');
    break;
  }

  case 'list': {
    let out = '';
    try {
      out = git('for-each-ref', 'refs/tags/' + PREFIX + '*', '--sort=-creatordate',
        '--format=%(refname:short) · %(creatordate:short) · %(subject)');
    } catch { /* leer */ }
    if (!out) { console.log('Keine Checkpoints vorhanden. Anlegen: create <name> [beschreibung]'); break; }
    console.log('Checkpoints (neueste zuerst):');
    for (const l of out.split('\n')) console.log('  ' + l);
    break;
  }

  case 'show': {
    if (!name) fail('Name fehlt. Aufruf: node scripts/checkpoint.js show <name>');
    const tag = fullTag(name);
    if (!tagExists(tag)) fail('Checkpoint "' + name + '" gibt es nicht (list zeigt alle).');
    console.log(git('show', '--stat', '--no-patch', tag));
    console.log('\nGeänderte Dateien seit diesem Checkpoint:');
    const diff = git('diff', '--stat', tag, 'HEAD');
    console.log(diff || '  (keine — HEAD entspricht dem Checkpoint)');
    break;
  }

  case 'restore': {
    if (!name) fail('Name fehlt. Aufruf: node scripts/checkpoint.js restore <name>');
    const tag = fullTag(name);
    if (!tagExists(tag)) fail('Checkpoint "' + name + '" gibt es nicht (list zeigt alle).');
    const dirty = git('status', '--porcelain');
    if (dirty) fail('Es gibt uncommittete Änderungen. Erst committen oder stashen (git stash), dann restore.');

    // Historie wird NICHT umgeschrieben: wir holen den Dateistand des Tags in den
    // Arbeitsbereich zurück; das Ergebnis ist eine normale, zu committende Änderung.
    git('restore', '--source=' + tag, '--staged', '--worktree', '--', '.');

    // Dateien, die es beim Checkpoint noch nicht gab, bleiben liegen — ehrlich ansagen.
    let added = '';
    try { added = git('diff', '--name-only', '--diff-filter=A', tag, 'HEAD'); } catch { /* ignorieren */ }

    console.log('✓ Stand von ' + tag + ' in den Arbeitsbereich zurückgeholt.');
    if (added) {
      console.log('⚠ Diese Dateien kamen NACH dem Checkpoint dazu und bleiben bestehen:');
      for (const f of added.split('\n')) console.log('  ' + f);
      console.log('  Wenn sie weg sollen: einzeln prüfen und mit git rm entfernen.');
    }
    const status = git('status', '--short');
    console.log('\nOffene Änderungen (git status --short):');
    console.log(status ? status.split('\n').map((l) => '  ' + l).join('\n') : '  (keine — der Stand war identisch)');
    console.log('\nNächster Schritt: prüfen, dann committen, z. B.:');
    console.log('  git commit -am "revert: zurück auf ' + tag + '"');
    console.log('Umentschieden? Alles verwerfen: git restore --staged --worktree .');
    break;
  }

  default:
    console.log('Aufruf: node scripts/checkpoint.js <create|list|show|restore> [name] [beschreibung]');
    process.exit(cmd ? 1 : 0);
}
