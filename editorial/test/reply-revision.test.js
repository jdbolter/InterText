'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  buildRevisionMessage,
  checkRevision,
  revisionConfig,
  reviseReply,
} = require('../../api/lib/reply-revision');
const {
  continuationUserMessage,
  normalizeContinueHistory,
} = require('../../api/lib/reading-continuation');

function fakeClient(reply, calls = []) {
  return { messages: { create: async (req) => { calls.push(req); if (reply instanceof Error) throw reply; return { content: [{ type: 'text', text: reply }], usage: { input_tokens: 10, output_tokens: 5 } }; } } };
}

test('revision is off unless a text configures model and instructions', () => {
  assert.equal(revisionConfig({}), null);
  assert.equal(revisionConfig({ revision: { model: 'm' } }), null);
  assert.equal(revisionConfig({ revision: { instructions: 'x' } }), null);
  assert.deepEqual(revisionConfig({ revision: { model: 'm', instructions: ' x ' } }), { model: 'm', instructions: 'x', maxTokens: 1500, thinking: { type: 'disabled' } });
});

test('the revision message carries the reader and the draft; Return turns are named as such', () => {
  assert.equal(buildRevisionMessage({ readerMessage: ' Why? ', draft: 'Because. ' }),
    "THE READER'S WORDS\nWhy?\n\nTHE DRAFT REPLY\nBecause.");
  assert.match(buildRevisionMessage({ continuing: true, draft: 'On.' }), /asked the work to go on/);
});

test('a revision is rejected if empty, if it drops or adds an image token, or if it emits the marker', () => {
  const draft = 'A [[IMAGE:olmstead]] B';
  assert.equal(checkRevision(draft, '  ').ok, false);
  assert.equal(checkRevision(draft, 'A B').ok, false);
  assert.equal(checkRevision(draft, 'A [[IMAGE:olmstead]] [[IMAGE:kandinsky]]').ok, false);
  assert.equal(checkRevision(draft, 'A [[IMAGE:olmstead]] [[SECTION_COMPLETE]]').ok, false);
  assert.deepEqual(checkRevision(draft, ' Revised [[IMAGE:olmstead]]. '), { ok: true, text: 'Revised [[IMAGE:olmstead]].' });
});

test('reviseReply uses the configured model with thinking off, and falls back to the draft on failure', async () => {
  const config = { revision: { model: 'claude-sonnet-5-5', instructions: 'Revise.' } };
  const calls = [];
  const ok = await reviseReply({ client: fakeClient('Revised.', calls), config, readerMessage: 'q', draft: 'Draft.' });
  assert.equal(ok.text, 'Revised.');
  assert.equal(ok.applied, true);
  assert.equal(calls[0].model, 'claude-sonnet-5-5');
  assert.deepEqual(calls[0].thinking, { type: 'between_tools' }, 'Sonnet 5.5 turns thinking off this way');
  assert.equal(calls[0].system, 'Revise.');
  const failed = await reviseReply({ client: fakeClient(new Error('boom')), config, readerMessage: 'q', draft: 'Draft.' });
  assert.deepEqual([failed.text, failed.applied], ['Draft.', false]);
  assert.match(failed.reason, /^revision call failed: boom/);
  const empty = await reviseReply({ client: fakeClient(''), config, readerMessage: 'q', draft: 'Draft.' });
  assert.deepEqual([empty.text, empty.applied, empty.reason], ['Draft.', false, 'empty revision']);
  const off = await reviseReply({ client: fakeClient('x'), config: {}, readerMessage: 'q', draft: 'Draft.' });
  assert.deepEqual([off.text, off.applied], ['Draft.', false]);
});

test('old Return-turn messages in the history take the text\'s own wording', () => {
  const wording = { continueMessage: 'Go on.', openingContinueMessage: 'Go on from the boxed opening.' };
  const history = [
    { role: 'user', content: continuationUserMessage(true) },
    { role: 'assistant', content: 'a' },
    { role: 'user', content: continuationUserMessage(false) },
    { role: 'assistant', content: 'b' },
    { role: 'user', content: 'Continue reading from where we have reached in this section, please' },
  ];
  const out = normalizeContinueHistory(history, wording);
  assert.deepEqual(out.map(m => m.content), ['Go on from the boxed opening.', 'a', 'Go on.', 'b', 'Continue reading from where we have reached in this section, please']);
  assert.equal(normalizeContinueHistory(history, null), history, 'no wording: history untouched');
  assert.equal(history[0].content, continuationUserMessage(true), 'the input is not mutated');
});

test('digital-plenitude configures the revision pass on claude-sonnet-5-5; plenitude does not', () => {
  assert.equal(revisionConfig(require('../../digital-plenitude/config')).model, 'claude-sonnet-5-5');
  assert.deepEqual(revisionConfig(require('../../digital-plenitude/config')).thinking, { type: 'between_tools' });
  assert.equal(revisionConfig(require('../../plenitude/config')), null);
});
