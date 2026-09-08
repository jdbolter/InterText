// Reads and validates the environment this harness needs. Never logs, returns, or
// otherwise surfaces the API key value itself — only whether it's present.
'use strict';

const DEFAULT_READER_MODEL = 'gpt-5.6-terra';
const DEFAULT_BASE_URL = 'http://localhost:3000';

/**
 * Throws a plain, actionable Error (never containing the key) if OPENAI_API_KEY is
 * unset. Callers should catch and print `err.message` directly — it's already
 * written to be read by a human.
 */
function requireOpenAiApiKey(env = process.env) {
  const key = env.OPENAI_API_KEY;
  if (!key || !key.trim()) {
    throw new Error(
      'OPENAI_API_KEY is not set. The synthetic reader needs an OpenAI API key to simulate a reader.\n' +
        '  Set it for this shell, e.g.:\n' +
        '    export OPENAI_API_KEY=sk-...\n' +
        '  or prefix the command:\n' +
        '    OPENAI_API_KEY=sk-... npm run synthetic-reader -- --profile curious --section 1'
    );
  }
  return key;
}

function getReaderModel(env = process.env) {
  return (env.OPENAI_READER_MODEL && env.OPENAI_READER_MODEL.trim()) || DEFAULT_READER_MODEL;
}

module.exports = { DEFAULT_READER_MODEL, DEFAULT_BASE_URL, requireOpenAiApiKey, getReaderModel };
