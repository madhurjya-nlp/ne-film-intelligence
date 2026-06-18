#!/usr/bin/env node
'use strict';

/**
 * NE Film Intelligence — Instruction Agent
 * Enforces memory updates and optional GitHub auto-push after major changes.
 */

const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const MEMORY = path.join(ROOT, 'AGENT_MEMORY.md');
const PKG = path.join(ROOT, 'package.json');
const LOG = path.join(ROOT, 'scripts', '.instruction-agent-log.json');

const DB_PATHS = [
  'server/db/',
  'server/services/',
  'server/ingestion/',
  'server/routes/',
  'server/config/sources.json',
  'data/',
  'database.sqlite',
];

const MAJOR_PATHS = [
  'server/db/schema.sql',
  'server/db/migrate.js',
  'package.json',
  'tests/',
  'AGENT_MEMORY.md',
];

function run(cmd, opts = {}) {
  try {
    return execSync(cmd, { cwd: ROOT, encoding: 'utf8', stdio: opts.silent ? 'pipe' : 'inherit', ...opts });
  } catch (e) {
    if (opts.ignoreError) return (e.stdout || '') + (e.stderr || '');
    throw e;
  }
}

function runCapture(cmd) {
  return run(cmd, { silent: true, stdio: 'pipe' });
}

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}

function writeLog(entry) {
  const log = readJson(LOG, { sessions: [], db_touches: [] });
  log.sessions = log.sessions || [];
  log.db_touches = log.db_touches || [];
  log.sessions.push({ ...entry, at: new Date().toISOString() });
  fs.mkdirSync(path.dirname(LOG), { recursive: true });
  fs.writeFileSync(LOG, JSON.stringify(log, null, 2));
}

function appendDbTouch(actor, action) {
  const log = readJson(LOG, { sessions: [], db_touches: [] });
  log.db_touches = log.db_touches || [];
  log.db_touches.push({ actor, action, at: new Date().toISOString() });
  fs.mkdirSync(path.dirname(LOG), { recursive: true });
  fs.writeFileSync(LOG, JSON.stringify(log, null, 2));
}

function gitStatusPorcelain() {
  return runCapture('git status --porcelain 2>nul || git status --porcelain').trim();
}

function changedFiles() {
  const status = gitStatusPorcelain();
  if (!status) return [];
  return status.split('\n').map((line) => {
    const part = line.slice(3).trim();
    return part.includes(' -> ') ? part.split(' -> ').pop() : part;
  });
}

function memoryModifiedRecently() {
  if (!fs.existsSync(MEMORY)) return false;
  const status = gitStatusPorcelain();
  if (status.includes('AGENT_MEMORY.md')) return true;
  const content = fs.readFileSync(MEMORY, 'utf8');
  const today = new Date().toISOString().slice(0, 10);
  return content.includes(today) && content.includes('Session Update');
}

function isMajorChange(files) {
  if (files.length >= 5) return true;
  return files.some((f) =>
    MAJOR_PATHS.some((p) => f.startsWith(p) || f === p)
    || DB_PATHS.some((p) => f.startsWith(p))
  );
}

function hasRemote() {
  try {
    const remotes = runCapture('git remote -v');
    return remotes.includes('github.com/madhurjya-nlp/ne-film-intelligence');
  } catch {
    return false;
  }
}

function sessionStart() {
  console.log('\n=== NEFI Instruction Agent — SESSION START ===\n');
  console.log('[1] Read AGENT_MEMORY.md in full');
  console.log('[2] Compare package.json version to memory snapshot');
  console.log('[3] If drift → update memory before other work');
  console.log('[4] Log session start in memory Session Log\n');

  if (!fs.existsSync(MEMORY)) {
    console.warn('WARN: AGENT_MEMORY.md missing');
    process.exit(1);
  }

  const pkg = JSON.parse(fs.readFileSync(PKG, 'utf8'));
  const mem = fs.readFileSync(MEMORY, 'utf8');
  const versionMatch = mem.match(/\*\*Version\*\*\s*\|\s*([^\|]+)/);
  const memVersion = versionMatch ? versionMatch[1].trim() : 'unknown';

  if (memVersion !== pkg.version) {
    console.log(`DRIFT: memory=${memVersion} repo=${pkg.version} → update memory first`);
  } else {
    console.log(`Version OK: ${pkg.version}`);
  }

  const files = changedFiles();
  if (files.some((f) => DB_PATHS.some((p) => f.startsWith(p)))) {
    console.log('DB_PATHS_DETECTED: run db-touch after database work');
  }

  writeLog({ type: 'session-start', version: pkg.version });
  console.log('\n=== Ready — follow instruction-agent skill for every prompt ===\n');
}

function sessionEnd(summary) {
  console.log('\n=== NEFI Instruction Agent — SESSION END ===\n');

  const files = changedFiles();
  const major = isMajorChange(files);
  const memoryOk = memoryModifiedRecently();

  console.log(`Files changed: ${files.length}`);
  if (summary) console.log(`Summary: ${summary}`);

  if (!memoryOk) {
    console.log('\nMEMORY_REQUIRED: Update AGENT_MEMORY.md before ending turn.');
    console.log('Add Session Update with: date, version, summary, files changed, follow-up.');
    process.exit(2);
  }

  console.log('MEMORY_OK: AGENT_MEMORY.md appears updated');

  if (major) {
    console.log('MAJOR_CHANGES: true');
    console.log('PUSH_RECOMMENDED: run `npm run agent:push` or `node scripts/instruction-agent.js push-if-major`');
  } else {
    console.log('MAJOR_CHANGES: false (push optional)');
  }

  writeLog({ type: 'session-end', summary, files: files.length, major, memoryOk });
  console.log('');
}

function dbTouch(actor, action) {
  appendDbTouch(actor || 'cli-agent', action || 'database access');
  console.log('\n=== DB TOUCH LOGGED ===');
  console.log(`Actor: ${actor || 'cli-agent'}`);
  console.log(`Action: ${action || 'database access'}`);
  console.log('\nMEMORY_REQUIRED: Update AGENT_MEMORY.md with data/schema findings from this touch.');
  console.log('Run session-end when the prompt is complete.\n');
}

function pushIfMajor() {
  console.log('\n=== NEFI Instruction Agent — PUSH IF MAJOR ===\n');

  if (!hasRemote()) {
    console.log('NO_REMOTE: origin not set to madhurjya-nlp/ne-film-intelligence');
    process.exit(1);
  }

  const files = changedFiles();
  const major = isMajorChange(files);

  if (!memoryModifiedRecently()) {
    console.log('BLOCKED: AGENT_MEMORY.md must be updated before push');
    process.exit(2);
  }

  if (!major && files.length === 0) {
    console.log('SKIP: no changes to push');
    return;
  }

  if (!major) {
    console.log('MINOR_CHANGES: push only if user requested (use --force to push anyway)');
    if (!process.argv.includes('--force')) {
      return;
    }
  }

  try {
    if (files.length > 0) {
      const toAdd = files.filter((f) => !f.includes('database.sqlite') && !f.startsWith('node_modules'));
      if (toAdd.length) {
        run(`git add ${toAdd.map((f) => `"${f}"`).join(' ')}`, { silent: true });
      }
      if (gitStatusPorcelain().includes('AGENT_MEMORY.md')) {
        run('git add AGENT_MEMORY.md', { silent: true });
      }
    }

    const status = gitStatusPorcelain();
    if (!status) {
      const ahead = runCapture('git rev-list --count origin/main..HEAD 2>nul').trim();
      if (ahead && ahead !== '0') {
        run('git push origin main');
        console.log('PUSH_OK: https://github.com/madhurjya-nlp/ne-film-intelligence');
        return;
      }
      console.log('NOTHING_TO_COMMIT');
      return;
    }

    const pkg = JSON.parse(fs.readFileSync(PKG, 'utf8'));
    const msg = process.env.AGENT_COMMIT_MSG
      || `docs: agent memory sync (NEFI v${pkg.version})`;
    run(`git commit -m "${msg.replace(/"/g, '\\"')}"`, { silent: true });
    run('git push origin main');
    console.log('PUSH_OK: https://github.com/madhurjya-nlp/ne-film-intelligence');
  } catch (e) {
    console.error('PUSH_FAILED:', e.message);
    console.log('Manual: git add -A && git commit -m "your message" && git push origin main');
    process.exit(1);
  }
}

function parseArgs() {
  const args = process.argv.slice(2);
  const cmd = args[0] || 'help';
  let summary = '';
  let actor = '';
  let action = '';
  const rest = [];
  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--summary' && args[i + 1]) { summary = args[++i]; continue; }
    if (args[i] === '--actor' && args[i + 1]) { actor = args[++i]; continue; }
    if (args[i] === '--action' && args[i + 1]) { action = args[++i]; continue; }
    if (!args[i].startsWith('--')) rest.push(args[i]);
  }
  // npm on Windows sometimes drops --summary; accept trailing positional text
  if (!summary && rest.length) summary = rest.join(' ');
  return { cmd, summary, actor, action };
}

const { cmd, summary, actor, action } = parseArgs();

switch (cmd) {
  case 'session-start':
    sessionStart();
    break;
  case 'session-end':
    sessionEnd(summary);
    break;
  case 'db-touch':
    dbTouch(actor, action);
    break;
  case 'push-if-major':
    pushIfMajor();
    break;
  case 'help':
  default:
    console.log(`
NEFI Instruction Agent

  node scripts/instruction-agent.js session-start
  node scripts/instruction-agent.js session-end --summary "what you did"
  node scripts/instruction-agent.js db-touch --actor "grok" --action "seed programs"
  node scripts/instruction-agent.js push-if-major [--force]
`);
}