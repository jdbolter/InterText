'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { formatAdditionsBold } = require('../lib/markdownDiff');

test('bolds a word inserted into an otherwise unchanged sentence', () => {
  assert.equal(
    formatAdditionsBold('The text keeps moving.', 'The text keeps steadily moving.'),
    'The text keeps **steadily** moving.'
  );
});

test('bolds a newly added paragraph while preserving its Markdown spacing', () => {
  assert.equal(
    formatAdditionsBold('## Title\n\nFirst paragraph.', '## Title\n\nFirst paragraph.\n\nA new thought.'),
    '## Title\n\nFirst paragraph.\n\n**A new thought.**'
  );
});

test('does not mark unchanged text', () => {
  const text = '## Title\n\nNothing changed.';
  assert.equal(formatAdditionsBold(text, text), text);
});

test('represents replacements as bold revised words', () => {
  assert.equal(
    formatAdditionsBold('The old conclusion.', 'The different conclusion.'),
    'The **different** conclusion.'
  );
});
