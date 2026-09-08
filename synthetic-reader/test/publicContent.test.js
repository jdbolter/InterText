'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { extractPublicSectionData } = require('../lib/publicContent');
const { TEXTS } = require('../lib/textRegistry');

test('extracts the correct section count for each known text', () => {
  assert.equal(extractPublicSectionData(TEXTS.plenitude).sections.length, 7);
  assert.equal(extractPublicSectionData(TEXTS.uncanny).sections.length, 5);
  assert.equal(extractPublicSectionData(TEXTS['blood-on-the-wall']).sections.length, 4);
});

test('each section has a plain-text intro with no leftover markup or entities', () => {
  const { sections } = extractPublicSectionData(TEXTS.plenitude);
  for (const s of sections) {
    assert.equal(typeof s.title, 'string');
    assert.ok(s.title.length > 0);
    assert.equal(typeof s.intro, 'string');
    assert.ok(s.intro.length > 0);
    assert.doesNotMatch(s.intro, /<[^>]+>/, `intro for "${s.title}" still has HTML tags`);
    assert.doesNotMatch(s.intro, /&[a-z]+;/, `intro for "${s.title}" still has an HTML entity`);
  }
});

test('section numbers are 1-based and sequential', () => {
  const { sections } = extractPublicSectionData(TEXTS.uncanny);
  sections.forEach((s, i) => assert.equal(s.number, i + 1));
});

test('throws a clear error for a missing app.js file', () => {
  assert.throws(
    () => extractPublicSectionData({ id: 'nope', appJsPath: '/nonexistent/app.js' }),
    /Could not read/
  );
});

test('never touches source_texts or config.js — only app.js path is read', () => {
  // Regression guard: this module must derive reader-visible content solely from
  // the public app.js, never from a text's config.js or source_texts markdown.
  const src = require('fs').readFileSync(require.resolve('../lib/publicContent.js'), 'utf8');
  assert.doesNotMatch(src, /config\.js/);
  assert.doesNotMatch(src, /source_texts/);
});
