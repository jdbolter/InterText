'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const { checkServerReachable, postChat } = require('../lib/chatClient');

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

test('checkServerReachable resolves with the status when the server responds', async (t) => {
  withFetch(t, async () => fakeResponse({ status: 204, body: '' }));
  const status = await checkServerReachable('http://localhost:3000');
  assert.equal(status, 204);
});

test('checkServerReachable gives a clear, actionable error when the server is unreachable', async (t) => {
  withFetch(t, async () => {
    throw new TypeError('fetch failed');
  });
  await assert.rejects(
    () => checkServerReachable('http://localhost:3000'),
    /Could not reach the InterText server.*vercel dev/s
  );
});

test('postChat returns the parsed JSON body on success', async (t) => {
  withFetch(t, async (url, init) => {
    assert.equal(url, 'http://localhost:3000/api/chat');
    assert.equal(init.method, 'POST');
    const parsedBody = JSON.parse(init.body);
    assert.equal(parsedBody.textId, 'plenitude');
    return fakeResponse({ body: JSON.stringify({ response: 'Hello, reader.' }) });
  });
  const data = await postChat('http://localhost:3000', { textId: 'plenitude', message: 'hi' });
  assert.equal(data.response, 'Hello, reader.');
});

test('postChat surfaces the server error message on a non-2xx response', async (t) => {
  withFetch(t, async () => fakeResponse({ ok: false, status: 400, body: JSON.stringify({ error: 'Empty message' }) }));
  await assert.rejects(() => postChat('http://localhost:3000', {}), /400.*Empty message/s);
});

test('postChat gives a clear error on a connection failure', async (t) => {
  withFetch(t, async () => {
    throw new TypeError('fetch failed');
  });
  await assert.rejects(() => postChat('http://localhost:3000', {}), /Request to .*\/api\/chat failed/);
});

test('postChat gives a clear error when the response body is not JSON', async (t) => {
  withFetch(t, async () => fakeResponse({ body: '<html>not json</html>' }));
  await assert.rejects(() => postChat('http://localhost:3000', {}), /non-JSON/);
});

test('chatClient.js never references the evolve endpoint', () => {
  const src = fs.readFileSync(require.resolve('../lib/chatClient.js'), 'utf8');
  assert.doesNotMatch(src, /\/api\/evolve/);
  assert.deepEqual(Object.keys(require('../lib/chatClient')).sort(), ['checkServerReachable', 'postChat']);
});
