// The only network calls this module knows how to make are POSTs to the chat
// endpoint below. There is deliberately no function anywhere in this file (or
// called from it) that can reach the evolve endpoint — synthetic runs must never
// publish or otherwise alter production or evolving text data. If a future change
// needs that endpoint for some reason, that's a decision to make explicitly and
// visibly, not something to bolt on here.
'use strict';

/**
 * Confirms {baseUrl} is actually serving before a run starts, so a run fails fast
 * with a clear message instead of failing confusingly on its first turn.
 */
async function checkServerReachable(baseUrl) {
  let res;
  try {
    // Any response (including a 404) proves something is listening; only a
    // connection-level failure means the server isn't there.
    res = await fetch(baseUrl, { method: 'GET' });
  } catch (err) {
    throw new Error(
      `Could not reach the InterText server at ${baseUrl}.\n` +
        '  Is `vercel dev` running from the project root? Start it with:\n' +
        '    vercel dev\n' +
        '  or pass a different address with --base-url.\n' +
        `  (${err.message})`
    );
  }
  return res.status;
}

/**
 * POSTs to /api/chat and returns the parsed JSON body. Throws a descriptive Error
 * on a connection failure or a non-2xx response — callers don't need to inspect
 * res.ok themselves.
 */
async function postChat(baseUrl, body) {
  let res;
  try {
    res = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (err) {
    throw new Error(
      `Request to ${baseUrl}/api/chat failed: ${err.message}. Is \`vercel dev\` still running?`
    );
  }

  let data;
  const text = await res.text();
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`${baseUrl}/api/chat returned non-JSON (status ${res.status}): ${text.slice(0, 300)}`);
  }

  if (!res.ok) {
    throw new Error(`${baseUrl}/api/chat returned ${res.status}: ${data.error || text.slice(0, 300)}`);
  }
  return data;
}

module.exports = { checkServerReachable, postChat };
