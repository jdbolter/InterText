'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { parseEvolveArgs } = require('../lib/evolveArgs');

test('requires --session', () => {
  assert.throws(() => parseEvolveArgs([]), /--session is required/);
});

test('accepts --session alone, with section defaulted to null', () => {
  const opts = parseEvolveArgs(['--session', '/tmp/some-run']);
  assert.equal(opts.session, '/tmp/some-run');
  assert.equal(opts.section, null);
  assert.equal(opts.baseUrl, 'http://localhost:3000');
});

test('accepts --section as a positive integer', () => {
  const opts = parseEvolveArgs(['--session', '/tmp/x', '--section', '3']);
  assert.equal(opts.section, 3);
});

test('rejects a non-positive --section', () => {
  assert.throws(() => parseEvolveArgs(['--session', '/tmp/x', '--section', '0']), /--section must be/);
});

test('--help short-circuits', () => {
  assert.deepEqual(parseEvolveArgs(['--help']), { help: true });
  assert.deepEqual(parseEvolveArgs(['-h']), { help: true });
});

test('rejects an unknown flag', () => {
  assert.throws(() => parseEvolveArgs(['--session', '/tmp/x', '--nonsense']), /Unknown option/);
});

test('accepts --base-url override', () => {
  const opts = parseEvolveArgs(['--session', '/tmp/x', '--base-url', 'http://localhost:4000']);
  assert.equal(opts.baseUrl, 'http://localhost:4000');
});
