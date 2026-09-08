'use strict';

// Repo-wide guard: no source file under synthetic-reader/ may reference the evolve
// endpoint EXCEPT the two files that deliberately, explicitly implement the
// dry-run preview feature (lib/evolveClient.js and evolve-cli.js) — everything
// else, including the main reading path (chatClient.js, session.js, cli.js), must
// stay structurally incapable of it, not just conventionally.
//
// The allowed files are checked separately, below, for the one thing that makes
// them safe: every call they make is explicitly dryRun: true.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ALLOWED_TO_REFERENCE_EVOLVE = ['lib/evolveClient.js', 'evolve-cli.js'];

function listJsFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'output' || entry.name === 'test') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listJsFiles(full));
    else if (entry.name.endsWith('.js')) out.push(full);
  }
  return out;
}

test('no implementation file, other than the explicit evolve-preview files, mentions the evolve endpoint', () => {
  const root = path.join(__dirname, '..');
  const files = listJsFiles(root);
  assert.ok(files.length > 5, 'sanity check: expected to find several source files');
  for (const file of files) {
    const rel = path.relative(root, file);
    if (ALLOWED_TO_REFERENCE_EVOLVE.includes(rel)) continue;
    const src = fs.readFileSync(file, 'utf8');
    assert.doesNotMatch(src, /\/api\/evolve/, `${rel} references /api/evolve`);
    assert.doesNotMatch(src, /evolveSection|postEvolve|callEvolve/, `${rel} looks evolve-related`);
  }
});

test('every evolve-endpoint call in the allowed files is explicitly dry-run', () => {
  const root = path.join(__dirname, '..');
  for (const rel of ALLOWED_TO_REFERENCE_EVOLVE) {
    const full = path.join(root, rel);
    assert.ok(fs.existsSync(full), `expected ${rel} to exist`);
  }
  const evolveClientSrc = fs.readFileSync(path.join(root, 'lib/evolveClient.js'), 'utf8');
  // The actual request body construction (JSON.stringify({...})) must send
  // dryRun: true — this checks the real call site, not just that the string
  // "dryRun: true" appears somewhere (it also appears in this file's own
  // explanatory comments, which don't guarantee anything by themselves).
  assert.match(evolveClientSrc, /JSON\.stringify\(\{[^}]*dryRun:\s*true[^}]*\}\)/s, 'the request body sent to fetch() must include dryRun: true');
  // Exactly one fetch() call should exist in this file — one call site to reason
  // about, not a safe path and a separately-added unguarded one.
  const fetchCalls = evolveClientSrc.match(/\bfetch\(/g) || [];
  assert.equal(fetchCalls.length, 1, 'expected exactly one fetch() call in evolveClient.js');

  // chatClient.js — the module every reading-path request goes through — must
  // remain structurally incapable of this regardless of what evolveClient.js does.
  assert.deepEqual(Object.keys(require('../lib/chatClient')).sort(), ['checkServerReachable', 'postChat']);
});
