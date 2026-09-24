'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  buildContinuationInstructions,
  continuationUserMessage,
  openingSectionText,
  resolveFirstContinuation,
} = require('../../api/lib/reading-continuation');

test('an opening continuation requires an explicit flag and an empty section history', () => {
  assert.equal(resolveFirstContinuation({
    continuing: true,
    requestedFirstContinuation: true,
    context: [],
  }), true);
  assert.equal(resolveFirstContinuation({
    continuing: true,
    requestedFirstContinuation: true,
    context: [{ role: 'assistant', content: 'Already read.' }],
  }), false);
  assert.equal(resolveFirstContinuation({
    continuing: false,
    requestedFirstContinuation: true,
    context: [],
  }), false);
});

test('opening continuation fixes the boundary before the first supplied passage', () => {
  const instructions = buildContinuationInstructions({
    continuing: true,
    firstContinuation: true,
    editorialReading: true,
  });
  assert.match(instructions, /opening boundary is BEFORE the first supplied passage/);
  assert.match(instructions, /do not skip any substantive claim/);
  assert.match(instructions, /Set sectionComplete to false/);
  assert.match(continuationUserMessage(true), /boxed opening/);
});

test('opening continuation exposes only the first packaged passage', () => {
  const supplied = [
    '<!-- intertext:passage p01 -->',
    '',
    'Opening passage.',
    '',
    '<!-- intertext:passage p02 -->',
    '',
    'Later passage that must not be visible yet.',
  ].join('\n');
  assert.equal(
    openingSectionText(supplied),
    '<!-- intertext:passage p01 -->\n\nOpening passage.'
  );
});

test('opening continuation exposes the first body block of an unpackaged section', () => {
  assert.equal(
    openingSectionText('## A title\n\nFirst paragraph.\n\nSecond paragraph.'),
    'First paragraph.'
  );
});

test('later continuations use the conversation as their cursor', () => {
  const instructions = buildContinuationInstructions({
    continuing: true,
    firstContinuation: false,
    editorialReading: false,
  });
  assert.match(instructions, /exchanges below as the reading cursor/);
  assert.match(instructions, /\[\[SECTION_COMPLETE\]\]/);
  assert.equal(buildContinuationInstructions({ continuing: false }), null);
});
