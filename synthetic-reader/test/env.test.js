'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { requireOpenAiApiKey, getReaderModel, DEFAULT_READER_MODEL } = require('../lib/env');

test('requireOpenAiApiKey throws a clear, actionable error when unset', () => {
  assert.throws(() => requireOpenAiApiKey({}), /OPENAI_API_KEY is not set/);
});

test('requireOpenAiApiKey throws on a blank/whitespace-only key', () => {
  assert.throws(() => requireOpenAiApiKey({ OPENAI_API_KEY: '   ' }), /OPENAI_API_KEY is not set/);
});

test('requireOpenAiApiKey returns the key when present, and the error path never contains it', () => {
  const key = 'sk-test-should-not-leak-anywhere';
  assert.equal(requireOpenAiApiKey({ OPENAI_API_KEY: key }), key);
  // Sanity check on the *other* branch: the thrown message for a missing key must
  // never be able to contain a real key value.
  let threwMessage = '';
  try {
    requireOpenAiApiKey({});
  } catch (err) {
    threwMessage = err.message;
  }
  assert.doesNotMatch(threwMessage, /sk-test-should-not-leak-anywhere/);
});

test('getReaderModel falls back to the documented default', () => {
  assert.equal(getReaderModel({}), DEFAULT_READER_MODEL);
  assert.equal(DEFAULT_READER_MODEL, 'gpt-5.6-terra');
});

test('getReaderModel honors OPENAI_READER_MODEL when set', () => {
  assert.equal(getReaderModel({ OPENAI_READER_MODEL: 'gpt-custom' }), 'gpt-custom');
});
