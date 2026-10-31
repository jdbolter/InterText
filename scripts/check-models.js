'use strict';
// H-007: tries, with tiny real requests, every kind of Anthropic call InterText makes, on the
// models it now uses. Run on the Mac (keys in .env.local):  npm run check-models
// Prints OK or the API's error for each; costs a fraction of a cent.

const Anthropic = require('@anthropic-ai/sdk');
const { DEFAULT_TEXT_MODEL, thinkingOff } = require('../api/lib/text-extras');

const client = new Anthropic();
const model = DEFAULT_TEXT_MODEL;
const tool = {
  name: 'deliver',
  description: 'Deliver the answer.',
  input_schema: { type: 'object', properties: { answer: { type: 'string' } }, required: ['answer'] },
};

const checks = [
  ['reply (adaptive thinking, web search available)', {
    model, max_tokens: 2048, thinking: { type: 'adaptive' },
    tools: [{ type: 'web_search_20260318', name: 'web_search', max_uses: 1 }],
    messages: [{ role: 'user', content: 'In five words, what is a symphony orchestra?' }],
  }],
  ['revision and evolution (thinking off)', {
    model, max_tokens: 200, thinking: thinkingOff(model),
    messages: [{ role: 'user', content: 'Rewrite in four words: The orchestra went bankrupt in 2011.' }],
  }],
  ['editorial readings and editorial evolution (adaptive thinking, forced tool)', {
    model, max_tokens: 2048, thinking: { type: 'adaptive' },
    tools: [tool], tool_choice: { type: 'tool', name: 'deliver', disable_parallel_tool_use: true },
    messages: [{ role: 'user', content: 'Deliver the word "opera".' }],
  }],
];

(async () => {
  console.log(`Checking ${model}`);
  let failed = 0;
  for (const [name, request] of checks) {
    try {
      const r = await client.messages.create(request);
      const kinds = r.content.map(b => b.type).join(', ');
      console.log(`  OK     ${name}  [${kinds}]`);
    } catch (err) {
      failed += 1;
      console.log(`  ERROR  ${name}\n         ${err.status || ''} ${String(err.message).slice(0, 300)}`);
    }
  }
  console.log(failed ? `${failed} check(s) failed.` : 'All checks passed.');
  process.exitCode = failed ? 1 : 0;
})();
