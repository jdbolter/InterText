// The only module in this harness allowed to reach the evolve endpoint — and only
// ever with `dryRun: true`, which api/evolve.js guarantees never reads or writes
// KV (see its isDryRun guard). Kept structurally separate from chatClient.js, whose
// entire purpose is to make an evolve call impossible; this file exists to make the
// one safe, explicit, opt-in exception possible, and only that.
//
// This is deliberately NOT used by session.js or the main `synthetic-reader` CLI —
// only by evolve-cli.js, a separate command a person runs on purpose, after the
// fact, against an already-saved session.
'use strict';

/**
 * Calls the real synthesis endpoint in dry-run mode: same model, same
 * synthesisInstructions, same validation — but nothing is persisted. Returns
 * { original, revised }.
 */
async function postEvolveDryRun(baseUrl, { sectionIndex, conversationHistory, textId }) {
  let res;
  try {
    res = await fetch(`${baseUrl}/api/evolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sectionIndex, conversationHistory, textId, dryRun: true }),
    });
  } catch (err) {
    throw new Error(
      `Request to ${baseUrl}/api/evolve failed: ${err.message}. Is \`vercel dev\` still running?`
    );
  }

  let data;
  const text = await res.text();
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`${baseUrl}/api/evolve returned non-JSON (status ${res.status}): ${text.slice(0, 300)}`);
  }

  if (!res.ok) {
    throw new Error(`${baseUrl}/api/evolve returned ${res.status}: ${data.error || text.slice(0, 300)}`);
  }
  if (typeof data.original !== 'string' || typeof data.revised !== 'string') {
    throw new Error(
      `${baseUrl}/api/evolve dry-run response is missing 'original' or 'revised' — is the server running the ` +
        'dry-run-capable version of api/evolve.js?'
    );
  }
  return { original: data.original, revised: data.revised };
}

module.exports = { postEvolveDryRun };
