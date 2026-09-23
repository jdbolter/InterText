'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { loadSessionFile } = require('../lib/sessionFile');

function tmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'session-file-test-'));
}

function validSessionData(overrides = {}) {
  return {
    meta: { textId: 'plenitude', startSectionIndex: 0, profileId: 'curious', ...overrides.meta },
    stopReason: 'reader_finished',
    turns: [],
    contributionsBySection: overrides.contributionsBySection || { 1: [{ role: 'user', content: 'hi' }, { role: 'assistant', content: 'hello' }] },
  };
}

test('loads a session.json given the file path directly', () => {
  const dir = tmpDir();
  const file = path.join(dir, 'session.json');
  fs.writeFileSync(file, JSON.stringify(validSessionData()));
  const { sessionDir, sessionPath, data } = loadSessionFile(file);
  assert.equal(sessionDir, dir);
  assert.equal(sessionPath, file);
  assert.equal(data.meta.textId, 'plenitude');
});

test('loads a session.json given the containing directory', () => {
  const dir = tmpDir();
  fs.writeFileSync(path.join(dir, 'session.json'), JSON.stringify(validSessionData()));
  const { data } = loadSessionFile(dir);
  assert.equal(data.meta.textId, 'plenitude');
});

test('throws a clear error for a nonexistent path', () => {
  assert.throws(() => loadSessionFile('/nonexistent/path/x'), /does not exist/);
});

test('throws a clear error for a directory with no session.json', () => {
  const dir = tmpDir();
  assert.throws(() => loadSessionFile(dir), /No session\.json found/);
});

test('throws a clear error for invalid JSON', () => {
  const dir = tmpDir();
  const file = path.join(dir, 'session.json');
  fs.writeFileSync(file, '{not valid json');
  assert.throws(() => loadSessionFile(file), /not valid JSON/);
});

test('throws a clear error when meta is missing/incomplete', () => {
  const dir = tmpDir();
  const file = path.join(dir, 'session.json');
  fs.writeFileSync(file, JSON.stringify({ turns: [] }));
  assert.throws(() => loadSessionFile(file), /doesn't look like a synthetic-reader session/);
});

test('throws a clear, actionable error for a pre-existing session.json with no contributionsBySection', () => {
  const dir = tmpDir();
  const file = path.join(dir, 'session.json');
  const data = validSessionData();
  delete data.contributionsBySection;
  fs.writeFileSync(file, JSON.stringify(data));
  assert.throws(() => loadSessionFile(file), /no recorded contributions.*re-run/s);
});
