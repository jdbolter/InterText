'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { parseArgs } = require('../lib/args');

test('applies defaults with no arguments', () => {
  const opts = parseArgs([]);
  assert.equal(opts.help, false);
  assert.equal(opts.text, 'plenitude');
  assert.equal(opts.section, 1);
  assert.equal(opts.profile, 'curious');
  assert.equal(opts.turns, 10);
  assert.equal(opts.edition, 'evolving');
});

test('parses the example from the feature request', () => {
  const opts = parseArgs(['--profile', 'curious', '--section', '1', '--turns', '10']);
  assert.equal(opts.profile, 'curious');
  assert.equal(opts.section, 1);
  assert.equal(opts.turns, 10);
});

test('--help short-circuits with help: true', () => {
  assert.deepEqual(parseArgs(['--help']), { help: true });
  assert.deepEqual(parseArgs(['-h']), { help: true });
});

test('rejects an unknown text', () => {
  assert.throws(() => parseArgs(['--text', 'nonexistent']), /--text must be one of/);
});

test('rejects an unknown profile', () => {
  assert.throws(() => parseArgs(['--profile', 'grumpy']), /--profile must be one of/);
});

test('rejects a non-positive section number', () => {
  assert.throws(() => parseArgs(['--section', '0']), /--section must be/);
  assert.throws(() => parseArgs(['--section', 'abc']), /--section must be/);
});

test('rejects a non-positive turn count', () => {
  assert.throws(() => parseArgs(['--turns', '0']), /--turns must be/);
});

test('rejects an invalid edition', () => {
  assert.throws(() => parseArgs(['--edition', 'remixed']), /--edition must be/);
});

test('rejects an unknown flag', () => {
  assert.throws(() => parseArgs(['--nonsense']), /Unknown option/);
});

test('a flag missing its value raises a clear error', () => {
  assert.throws(() => parseArgs(['--profile']), /--profile requires a value/);
});

test('accepts --base-url, --reader-model and --out overrides', () => {
  const opts = parseArgs(['--base-url', 'http://localhost:4000', '--reader-model', 'gpt-test', '--out', '/tmp/x']);
  assert.equal(opts.baseUrl, 'http://localhost:4000');
  assert.equal(opts.readerModel, 'gpt-test');
  assert.equal(opts.out, '/tmp/x');
});
