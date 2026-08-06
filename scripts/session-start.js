#!/usr/bin/env node
// Session-Start-Anzeige: wer arbeitet, wo stehen wir, ist der Stand aktuell,
// und woran arbeiten die anderen. Läuft als SessionStart-Hook von Claude Code,
// kann aber auch von Hand aufgerufen werden: node scripts/session-start.js

'use strict';

const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

function git(...args) {
  return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

function tryGit(...args) {
  try { return git(...args); } catch { return null; }
}

function line(char = '─') { console.log(char.repeat(62)); }

const repoRoot = tryGit('rev-parse', '--show-toplevel');
if (!repoRoot) {
  console.log('⚠ Kein Git-Repository gefunden — Session-Start-Anzeige übersprungen.');
  process.exit(0);
}

line('═');
console.log('SESSION-START · ' + path.basename(repoRoot));
line('═');

// 1) Wer arbeitet?
const userName = tryGit('config', 'user.name') || '';
const generic = ['', 'root', 'user', 'administrator', 'claude'];
if (generic.includes(userName.toLowerCase())) {
  console.log('⚠⚠ KEIN (ODER GENERISCHER) NAME GESETZT: "' + (userName || '—') + '"');
  console.log('   REGEL 0: Vor jeder Änderung Namen setzen:');
  console.log('   git config user.name "DeinVorname"');
} else {
  console.log('Es arbeitet laut Git: ' + userName);
}

// 2) Branch und Worktree
const branch = tryGit('rev-parse', '--abbrev-ref', 'HEAD') || '(unbekannt)';
console.log('Branch:   ' + branch);
console.log('Worktree: ' + repoRoot);

// 3) Letzte Commits
const log = tryGit('log', '--oneline', '--decorate', '-5');
if (log) {
  console.log('\nLetzte Commits:');
  console.log(log.split('\n').map((l) => '  ' + l).join('\n'));
}

// 4) Ist der lokale Stand veraltet? Bewusst nur fetch, KEIN pull.
// Wichtig: Scheitert die Prüfung, wird das NICHT als "synchron" gemeldet.
line();
let fetched = false;
try {
  execFileSync('git', ['fetch', '--quiet'], { encoding: 'utf8', timeout: 20000 });
  fetched = true;
} catch {
  console.log('⚠ KONNTE NICHT PRÜFEN, ob der lokale Stand aktuell ist (fetch fehlgeschlagen).');
  console.log('  Das heißt NICHT, dass alles synchron ist. Netz prüfen, dann: git fetch');
}
if (fetched) {
  const upstream = tryGit('rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{upstream}');
  if (!upstream) {
    console.log('ℹ Branch hat noch kein Upstream — nach dem ersten Push: git push -u origin ' + branch);
  } else {
    const behind = tryGit('rev-list', '--count', 'HEAD..' + upstream);
    const ahead = tryGit('rev-list', '--count', upstream + '..HEAD');
    if (behind === null || ahead === null) {
      console.log('⚠ KONNTE NICHT PRÜFEN, ob Commits fehlen (rev-list fehlgeschlagen).');
    } else if (behind !== '0') {
      console.log('⚠⚠ LOKALER STAND VERALTET: ' + behind + ' Commit(s) fehlen von ' + upstream + '.');
      console.log('   Vor dem Arbeiten holen: git pull --rebase');
    } else {
      console.log('✓ Auf Stand mit ' + upstream + (ahead !== '0' ? ' (' + ahead + ' lokale(r) Commit(s) noch nicht gepusht)' : '') + '.');
    }
  }
}

// 5) STAND.md
line();
const standPath = path.join(repoRoot, 'docs', 'STAND.md');
if (fs.existsSync(standPath)) {
  console.log(fs.readFileSync(standPath, 'utf8').trim());
} else {
  console.log('⚠ docs/STAND.md fehlt.');
}

// 6) Letzte drei Worklog-Einträge
line();
const worklogPath = path.join(repoRoot, 'docs', 'WORKLOG.md');
if (fs.existsSync(worklogPath)) {
  const content = fs.readFileSync(worklogPath, 'utf8');
  const entries = content.split(/^## /m).slice(1).slice(0, 3);
  if (entries.length) {
    console.log('Letzte Worklog-Einträge:');
    for (const e of entries) console.log('\n## ' + e.trim());
  } else {
    console.log('Worklog ist noch leer.');
  }
} else {
  console.log('⚠ docs/WORKLOG.md fehlt.');
}

// 7) Offene PRs der anderen + Warnung bei geteilten Dateien
line();
let sharedFiles = [];
try {
  const cfg = JSON.parse(fs.readFileSync(path.join(repoRoot, 'scripts', 'shared-files.json'), 'utf8'));
  sharedFiles = cfg.dateien || [];
} catch { /* keine Liste — dann nur PR-Übersicht ohne Warnung */ }

try {
  const me = execFileSync('gh', ['api', 'user', '--jq', '.login'], { encoding: 'utf8', timeout: 20000 }).trim();
  const raw = execFileSync(
    'gh', ['pr', 'list', '--json', 'number,title,author,isDraft,files'],
    { encoding: 'utf8', timeout: 20000 }
  );
  const prs = JSON.parse(raw).filter((pr) => pr.author && pr.author.login !== me);
  if (!prs.length) {
    console.log('Keine offenen PRs von anderen.');
  } else {
    console.log('Offene PRs der anderen:');
    for (const pr of prs) {
      const files = (pr.files || []).map((f) => f.path);
      console.log('  #' + pr.number + (pr.isDraft ? ' [Entwurf]' : '') + ' ' + pr.title + ' — ' + pr.author.login);
      const hot = files.filter((f) => sharedFiles.includes(f));
      if (hot.length) {
        console.log('  ⚠⚠ GETEILTE DATEIEN dort schon angefasst: ' + hot.join(', '));
        console.log('     Vor Änderungen an diesen Dateien absprechen — Konflikt vorprogrammiert.');
      }
    }
  }
} catch {
  console.log('ℹ PR-Übersicht nicht verfügbar (GitHub CLI "gh" fehlt oder ist nicht angemeldet).');
  console.log('  Installieren: https://cli.github.com · dann: gh auth login');
}

line('═');
