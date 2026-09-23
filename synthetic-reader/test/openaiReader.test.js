'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { createReader, buildInput } = require('../lib/openaiReader');
const { getProfile } = require('../lib/profiles');

function validActionJson(overrides = {}) {
  return JSON.stringify({
    action: 'continue',
    message: null,
    target_section: null,
    stop_reason: null,
    private_reflection: { understanding: 'medium', confusion: 'none', interest: 'medium', note: 'ok' },
    ...overrides,
  });
}

function fakeClient(outputTexts) {
  const queue = outputTexts.slice();
  const calls = [];
  return {
    calls,
    responses: {
      create: async (params) => {
        calls.push(params);
        const output_text = queue.shift();
        if (output_text === undefined) throw new Error('fakeClient ran out of scripted responses');
        return { output_text };
      },
    },
  };
}

function sampleVisibleContext() {
  return {
    workTitle: 'Test Work',
    tableOfContents: [{ number: 1, title: 'First' }, { number: 2, title: 'Second' }],
    currentSection: { number: 1, title: 'First' },
    transcript: [
      { type: 'section-intro', number: 1, title: 'First', text: 'An intro.' },
      { type: 'reader', text: 'My earlier question.' },
      { type: 'guide', text: 'An earlier answer.' },
      { type: 'system', text: 'End of the final section.' },
    ],
  };
}

test('chooseAction returns a validated action on a well-formed first response', async () => {
  const client = fakeClient([validActionJson()]);
  const reader = createReader({ client, model: 'gpt-test', profile: getProfile('curious') });
  const action = await reader.chooseAction(sampleVisibleContext());
  assert.equal(action.action, 'continue');
  assert.equal(client.calls.length, 1);
});

test('chooseAction retries once on an invalid first response and succeeds', async () => {
  const client = fakeClient([
    validActionJson({ action: 'message', message: null }), // invalid: message action needs a message
    validActionJson({ action: 'message', message: 'Now valid.' }),
  ]);
  const reader = createReader({ client, model: 'gpt-test', profile: getProfile('curious') });
  const action = await reader.chooseAction(sampleVisibleContext());
  assert.equal(action.message, 'Now valid.');
  assert.equal(client.calls.length, 2);
  // The retry call should include a corrective note about what was wrong.
  const retryInput = client.calls[1].input;
  assert.ok(retryInput.some((m) => /invalid/i.test(m.content)));
});

test('chooseAction throws a clear error if both attempts are invalid', async () => {
  const client = fakeClient([
    validActionJson({ action: 'navigate', target_section: null }),
    validActionJson({ action: 'navigate', target_section: null }),
  ]);
  const reader = createReader({ client, model: 'gpt-test', profile: getProfile('curious') });
  await assert.rejects(() => reader.chooseAction(sampleVisibleContext()), /invalid action twice/);
});

test('wraps a 401 from OpenAI into a clear, key-free error', async () => {
  const client = {
    responses: {
      create: async () => {
        const err = new Error('Incorrect API key provided');
        err.status = 401;
        throw err;
      },
    },
  };
  const reader = createReader({ client, model: 'gpt-test', profile: getProfile('curious') });
  await assert.rejects(() => reader.chooseAction(sampleVisibleContext()), /rejected the API key/);
});

test('wraps a 404 from OpenAI into a clear model-name error', async () => {
  const client = {
    responses: {
      create: async () => {
        const err = new Error('model not found');
        err.status = 404;
        throw err;
      },
    },
  };
  const reader = createReader({ client, model: 'gpt-nonexistent', profile: getProfile('curious') });
  await assert.rejects(() => reader.chooseAction(sampleVisibleContext()), /gpt-nonexistent.*not found/s);
});

test('buildInput maps guide turns to user role and the reader\'s own turns to assistant role', () => {
  const input = buildInput(sampleVisibleContext());
  const guideEntry = input.find((m) => typeof m.content === 'string' && m.content.startsWith('Guide:'));
  const readerEntry = input.find((m) => m.content === 'My earlier question.');
  assert.equal(guideEntry.role, 'user');
  assert.equal(readerEntry.role, 'assistant');
});

test('buildInput includes the table of contents and current section, and never the word "config"', () => {
  const input = buildInput(sampleVisibleContext());
  const flat = JSON.stringify(input);
  assert.match(flat, /1\. First/);
  assert.match(flat, /2\. Second/);
  assert.match(flat, /currently in section 1/);
  assert.doesNotMatch(flat, /config/i);
});

test('the persona/system instructions never mention InterText\'s own config or source text', async () => {
  const client = fakeClient([validActionJson()]);
  const reader = createReader({ client, model: 'gpt-test', profile: getProfile('skeptical') });
  await reader.chooseAction(sampleVisibleContext());
  const sentInstructions = client.calls[0].instructions;
  assert.doesNotMatch(sentInstructions, /config\.js|behavioralInstructions|source_texts/i);
});

test('skeptical and collaborative readers receive optional, bounded web search', async () => {
  for (const profileId of ['skeptical', 'collaborative']) {
    const client = fakeClient([validActionJson()]);
    const reader = createReader({ client, model: 'gpt-test', profile: getProfile(profileId) });
    await reader.chooseAction(sampleVisibleContext());
    assert.deepEqual(client.calls[0].tools, [{ type: 'web_search', search_context_size: 'medium' }]);
    assert.equal(client.calls[0].tool_choice, 'auto');
    assert.equal(client.calls[0].max_tool_calls, 2);
    assert.match(client.calls[0].instructions, /name the source and include its URL/i);
  }
});

test('curious reader receives no web-search tool', async () => {
  const client = fakeClient([validActionJson()]);
  const reader = createReader({ client, model: 'gpt-test', profile: getProfile('curious') });
  await reader.chooseAction(sampleVisibleContext());
  assert.equal(client.calls[0].tools, undefined);
  assert.equal(client.calls[0].tool_choice, undefined);
  assert.equal(client.calls[0].max_tool_calls, undefined);
});
