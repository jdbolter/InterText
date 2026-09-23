'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { postEvolveDryRun } = require('../lib/evolveClient');

function withFetch(t, impl) {
  const original = global.fetch;
  global.fetch = impl;
  t.after(() => {
    global.fetch = original;
  });
}

function fakeResponse({ ok = true, status = 200, body = '{}' } = {}) {
  return { ok, status, text: async () => body };
}

test('postEvolveDryRun sends dryRun: true and returns { original, revised }', async (t) => {
  withFetch(t, async (url, init) => {
    assert.equal(url, 'http://localhost:3000/api/evolve');
    const body = JSON.parse(init.body);
    assert.equal(body.dryRun, true);
    assert.equal(body.textId, 'plenitude');
    assert.equal(body.sectionIndex, 0);
    return fakeResponse({ body: JSON.stringify({ original: 'Original text.', revised: 'Revised text.' }) });
  });

  const result = await postEvolveDryRun('http://localhost:3000', {
    sectionIndex: 0,
    conversationHistory: [{ role: 'user', content: 'hi' }, { role: 'assistant', content: 'hello' }],
    textId: 'plenitude',
  });
  assert.deepEqual(result, { original: 'Original text.', revised: 'Revised text.' });
});

test('postEvolveDryRun surfaces a server error clearly', async (t) => {
  withFetch(t, async () => fakeResponse({ ok: false, status: 502, body: JSON.stringify({ error: 'Synthesis failed, nothing saved' }) }));
  await assert.rejects(
    () => postEvolveDryRun('http://localhost:3000', { sectionIndex: 0, conversationHistory: [], textId: 'plenitude' }),
    /502.*Synthesis failed/s
  );
});

test('postEvolveDryRun gives a clear error on a connection failure', async (t) => {
  withFetch(t, async () => {
    throw new TypeError('fetch failed');
  });
  await assert.rejects(
    () => postEvolveDryRun('http://localhost:3000', { sectionIndex: 0, conversationHistory: [], textId: 'plenitude' }),
    /Request to .*\/api\/evolve failed/
  );
});

test('postEvolveDryRun rejects a response missing original/revised (e.g. a non-dry-run-capable server)', async (t) => {
  withFetch(t, async () => fakeResponse({ body: JSON.stringify({ revised: 'only revised, no original' }) }));
  await assert.rejects(
    () => postEvolveDryRun('http://localhost:3000', { sectionIndex: 0, conversationHistory: [], textId: 'plenitude' }),
    /missing 'original' or 'revised'/
  );
});

test('postEvolveDryRun gives a clear error on a non-JSON response', async (t) => {
  withFetch(t, async () => fakeResponse({ body: 'not json' }));
  await assert.rejects(
    () => postEvolveDryRun('http://localhost:3000', { sectionIndex: 0, conversationHistory: [], textId: 'plenitude' }),
    /non-JSON/
  );
});
