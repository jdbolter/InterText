'use strict';

// Repo-wide guard, not just chatClient.js: no source file under synthetic-reader/
// may reference the evolve endpoint. Synthetic runs must never be able to modify
// production or evolving text data, by construction, not just by convention.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

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

// Scans the implementation only (lib/ and cli.js) — the test/ directory is
// excluded because these very guard tests necessarily mention the forbidden
// strings in their own assertions.
test('no implementation file under synthetic-reader/ mentions the evolve endpoint', () => {
  const root = path.join(__dirname, '..');
  const files = listJsFiles(root);
  assert.ok(files.length > 5, 'sanity check: expected to find several source files');
  for (const file of files) {
    const src = fs.readFileSync(file, 'utf8');
    assert.doesNotMatch(src, /\/api\/evolve/, `${path.relative(root, file)} references /api/evolve`);
    assert.doesNotMatch(src, /evolveSection|postEvolve|callEvolve/, `${path.relative(root, file)} looks evolve-related`);
  }
});
