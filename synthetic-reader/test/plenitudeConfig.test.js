const test = require('node:test');
const assert = require('node:assert/strict');

const config = require('../../plenitude/config');

test('Plenitude synthesis retains only sources that support incorporated revisions', () => {
  assert.match(config.synthesisInstructions, /materially supported by a supplied source/i);
  assert.match(config.synthesisInstructions, /descriptive Markdown link/i);
  assert.match(config.synthesisInstructions, /Preserve the supplied URL exactly/i);
  assert.match(config.synthesisInstructions, /Omit links whose supporting material was not incorporated/i);
  assert.match(config.synthesisInstructions, /never invent, complete, or alter a URL/i);
});
