'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { PROFILES, listProfileIds, getProfile } = require('../lib/profiles');

test('includes the four required initial profiles', () => {
  assert.deepEqual(
    listProfileIds().sort(),
    ['curious', 'skeptical', 'impatient', 'passive'].sort()
  );
});

test('every profile has non-empty name, description, and instructions', () => {
  for (const id of listProfileIds()) {
    const p = PROFILES[id];
    assert.equal(p.id, id);
    assert.ok(p.name && p.name.trim().length > 0, `${id} missing name`);
    assert.ok(p.description && p.description.trim().length > 0, `${id} missing description`);
    assert.ok(p.instructions && p.instructions.trim().length > 50, `${id} instructions too short`);
  }
});

test('getProfile throws a clear error for an unknown profile', () => {
  assert.throws(() => getProfile('nonexistent'), /Unknown profile/);
});

test('profile instructions never reference InterText\'s own config/prompt files', () => {
  // Regression guard: profiles are the harness's own persona prompt, never a copy
  // of a text's behavioralInstructions/synthesisInstructions.
  for (const id of listProfileIds()) {
    assert.doesNotMatch(PROFILES[id].instructions, /config\.js|behavioralInstructions|synthesisInstructions/i);
  }
});
