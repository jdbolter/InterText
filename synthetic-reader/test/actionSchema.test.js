'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { validateAction, READER_ACTION_JSON_SCHEMA, ACTIONS } = require('../lib/actionSchema');

function basePrivate() {
  return { understanding: 'medium', confusion: 'none', interest: 'medium', note: 'Following along fine.' };
}

test('accepts a well-formed message action', () => {
  const result = validateAction({
    action: 'message',
    message: 'What does this mean?',
    target_section: null,
    stop_reason: null,
    private_reflection: basePrivate(),
  });
  assert.equal(result.ok, true);
});

test('accepts a well-formed continue action', () => {
  const result = validateAction({
    action: 'continue',
    message: null,
    target_section: null,
    stop_reason: null,
    private_reflection: basePrivate(),
  });
  assert.equal(result.ok, true);
});

test('accepts a well-formed navigate action', () => {
  const result = validateAction({
    action: 'navigate',
    message: null,
    target_section: 3,
    stop_reason: null,
    private_reflection: basePrivate(),
  });
  assert.equal(result.ok, true);
});

test('accepts a well-formed finish action', () => {
  const result = validateAction({
    action: 'finish',
    message: null,
    target_section: null,
    stop_reason: 'I feel satisfied with what I read.',
    private_reflection: basePrivate(),
  });
  assert.equal(result.ok, true);
});

test('rejects a message action with an empty message', () => {
  const result = validateAction({
    action: 'message',
    message: '   ',
    target_section: null,
    stop_reason: null,
    private_reflection: basePrivate(),
  });
  assert.equal(result.ok, false);
  assert.match(result.error, /message/);
});

test('rejects a navigate action with no target_section', () => {
  const result = validateAction({
    action: 'navigate',
    message: null,
    target_section: null,
    stop_reason: null,
    private_reflection: basePrivate(),
  });
  assert.equal(result.ok, false);
  assert.match(result.error, /target_section/);
});

test('rejects a finish action with no stop_reason', () => {
  const result = validateAction({
    action: 'finish',
    message: null,
    target_section: null,
    stop_reason: '',
    private_reflection: basePrivate(),
  });
  assert.equal(result.ok, false);
  assert.match(result.error, /stop_reason/);
});

test('rejects an unknown action name', () => {
  const result = validateAction({
    action: 'teleport',
    message: null,
    target_section: null,
    stop_reason: null,
    private_reflection: basePrivate(),
  });
  assert.equal(result.ok, false);
});

test('rejects a missing or malformed private_reflection', () => {
  assert.equal(
    validateAction({ action: 'continue', message: null, target_section: null, stop_reason: null }).ok,
    false
  );
  assert.equal(
    validateAction({
      action: 'continue',
      message: null,
      target_section: null,
      stop_reason: null,
      private_reflection: { understanding: 'medium', confusion: 'none', interest: 'medium', note: '' },
    }).ok,
    false
  );
  assert.equal(
    validateAction({
      action: 'continue',
      message: null,
      target_section: null,
      stop_reason: null,
      private_reflection: { understanding: 'extreme', confusion: 'none', interest: 'medium', note: 'x' },
    }).ok,
    false
  );
});

test('JSON schema requires every property (strict-mode structured outputs)', () => {
  assert.deepEqual(
    READER_ACTION_JSON_SCHEMA.required.sort(),
    ['action', 'message', 'target_section', 'stop_reason', 'private_reflection'].sort()
  );
  assert.equal(READER_ACTION_JSON_SCHEMA.additionalProperties, false);
  assert.deepEqual(READER_ACTION_JSON_SCHEMA.properties.action.enum, ACTIONS);
});
