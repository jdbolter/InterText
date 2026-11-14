'use strict';

// 2026-11-14: the order of the system prompt, so that what stays the same through a section is
// cached and what changes from turn to turn comes after it.

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');

const { systemBlocks, joinParts } = require('../../api/lib/system-prompt');

test('stable blocks first, the cache marker on the last of them, the per-turn text after', () => {
  const blocks = systemBlocks({
    stable: ['Instructions.', null, '  ', 'Framing.'],
    passage: 'The passage.',
    library: 'WORKS\n\n[a-1] A.',
    perTurn: [null, 'Go on.', 'Writers already introduced: Bürger.'],
  });
  assert.deepEqual(blocks, [
    { type: 'text', text: 'Instructions.\n\nFraming.' },
    { type: 'text', text: 'The passage.' },
    { type: 'text', text: 'WORKS\n\n[a-1] A.', cache_control: { type: 'ephemeral' } },
    { type: 'text', text: 'Go on.\n\nWriters already introduced: Bürger.' },
  ]);
  assert.equal(joinParts(['a', '', null, 'b']), 'a\n\nb');
});

test('without a library list the marker moves to the passage; without per-turn text there is no tail', () => {
  const blocks = systemBlocks({ stable: ['I.'], passage: 'P.', library: null, perTurn: [] });
  assert.deepEqual(blocks, [
    { type: 'text', text: 'I.' },
    { type: 'text', text: 'P.', cache_control: { type: 'ephemeral' } },
  ]);
});

// The handler itself, against a stand-in for the Anthropic client: the prompt it assembles for
// The Digital Plenitude has the same prefix on two turns of one section, and the parts that
// change between turns come after the cache marker.
test('two turns of one section share the cached prefix; what changes comes after it', async () => {
  const cwd = process.cwd();
  process.chdir(path.join(__dirname, '..', '..'));
  const handler = require('../../api/chat');
  const calls = [];
  handler.setClient({ messages: { create: async (params) => {
    calls.push(params);
    return { content: [{ type: 'text', text: 'A reply about the world [[CITE:greenberg-1939]].' }], usage: {} };
  } } });
  function res() {
    const out = { code: 200, body: null, status(c) { out.code = c; return out; }, json(b) { out.body = b; return out; } };
    return out;
  }
  try {
    const first = res();
    await handler({ method: 'POST', body: {
      textId: 'digital-plenitude', sectionIndex: 0, edition: 'original', action: 'continue',
      firstContinuation: false, sectionHistory: [], history: [], shownImages: [], shownMedia: [],
    } }, first);
    assert.equal(first.code, 200, JSON.stringify(first.body));
    const second = res();
    await handler({ method: 'POST', body: {
      textId: 'digital-plenitude', sectionIndex: 0, edition: 'original', message: 'But surely the Met still decides?',
      sectionHistory: [{ role: 'user', content: 'Go on.' }, { role: 'assistant', content: 'As the influential art critic Clement Greenberg wrote [[CITE:greenberg-1939]].' }],
      history: [], shownImages: [], shownMedia: [],
    } }, second);
    assert.equal(second.code, 200, JSON.stringify(second.body));
  } finally {
    process.chdir(cwd);
  }
  // The first call is the draft, the second its revision; the third and fourth the same for turn two.
  assert.equal(calls.length, 4);
  const [draft1, , draft2] = calls;
  const prefix = (sys) => sys.slice(0, sys.findIndex(b => b.cache_control) + 1);
  assert.deepEqual(prefix(draft1.system), prefix(draft2.system), 'the cached prefix is the same on both turns');
  assert.equal(prefix(draft1.system).length, 3, 'instructions, the passage, the library list');
  const tail1 = draft1.system[3].text;
  const tail2 = draft2.system[3].text;
  assert.match(tail1, /pressed Enter to continue reading/);
  assert.doesNotMatch(tail2, /pressed Enter to continue reading/);
  assert.match(tail2, /Writers already introduced in this conversation, so named by surname alone from now on: Greenberg\./);
  assert.doesNotMatch(draft2.system[2].text, /Already introduced/, 'the list itself no longer changes');
  assert.match(draft1.system[0].text, /^You are a work on the collapse of cultural hierarchy/);
  assert.match(draft1.system[0].text, /Now under discussion: The Great Divide \(chapter 1, The Great Divide\)/);
  assert.match(draft1.system[2].text, /^WORKS THAT MAY BE CITED BY NAME/);
  // The revision pass: its instructions, then the passage, cached.
  const revision = calls[1];
  assert.equal(revision.system[1].cache_control.type, 'ephemeral');
  assert.match(revision.system[1].text, /^WHAT THE WORK HOLDS FOR THIS SECTION/);
});
