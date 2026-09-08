'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { runSession } = require('../lib/session');

const TEXT_ENTRY = { id: 'plenitude', displayTitle: 'Test Text' };
const SECTIONS = [
  { number: 1, numeral: 'I', title: 'First', intro: 'Intro one.' },
  { number: 2, numeral: 'II', title: 'Second', intro: 'Intro two.' },
];

function scriptedReader(actions) {
  const queue = actions.slice();
  return {
    chooseAction: async () => {
      if (queue.length === 0) throw new Error('scriptedReader ran out of scripted actions');
      return queue.shift();
    },
  };
}

function privateReflection(note = 'fine') {
  return { understanding: 'medium', confusion: 'none', interest: 'medium', note };
}

function recordingChatClient(responder) {
  const calls = [];
  return {
    calls,
    postChat: async (baseUrl, body) => {
      // Snapshot the body now, the way a real fetch call's JSON.stringify would —
      // `body.history` is the session's own live array and keeps mutating after
      // this call returns, so recording the reference itself would misrepresent
      // what was actually sent on the wire at call time.
      calls.push({ baseUrl, body: JSON.parse(JSON.stringify(body)) });
      return responder(body, calls.length);
    },
  };
}

test('a message action calls /api/chat with no action field and updates history', async () => {
  const chatClient = recordingChatClient(() => ({ response: 'Here is an answer.' }));
  const reader = scriptedReader([
    { action: 'message', message: 'What does this mean?', target_section: null, stop_reason: null, private_reflection: privateReflection() },
    { action: 'finish', message: null, target_section: null, stop_reason: 'done', private_reflection: privateReflection() },
  ]);

  const result = await runSession({
    textEntry: TEXT_ENTRY,
    sections: SECTIONS,
    startSectionIndex: 0,
    edition: 'evolving',
    maxTurns: 5,
    baseUrl: 'http://localhost:3000',
    reader,
    chatClient,
  });

  assert.equal(chatClient.calls.length, 1);
  const sentBody = chatClient.calls[0].body;
  assert.equal(sentBody.message, 'What does this mean?');
  assert.equal(sentBody.textId, 'plenitude');
  assert.equal(sentBody.sectionIndex, 0);
  assert.equal(sentBody.edition, 'evolving');
  assert.equal(sentBody.action, undefined);
  assert.deepEqual(sentBody.history, []); // history sent BEFORE this turn is appended

  assert.equal(result.turns[0].guideResponse, 'Here is an answer.');
  assert.equal(result.stopReason, 'reader_finished');
  assert.equal(result.stopDetail, 'done');
});

test('a continue action sends action: continue with the per-section history', async () => {
  const chatClient = recordingChatClient(() => ({ response: 'More of the section.' }));
  const reader = scriptedReader([
    { action: 'continue', message: null, target_section: null, stop_reason: null, private_reflection: privateReflection() },
    { action: 'finish', message: null, target_section: null, stop_reason: 'done', private_reflection: privateReflection() },
  ]);

  await runSession({
    textEntry: TEXT_ENTRY,
    sections: SECTIONS,
    startSectionIndex: 0,
    edition: 'original',
    maxTurns: 5,
    baseUrl: 'http://localhost:3000',
    reader,
    chatClient,
  });

  const sentBody = chatClient.calls[0].body;
  assert.equal(sentBody.action, 'continue');
  assert.deepEqual(sentBody.sectionHistory, []);
  assert.equal(sentBody.edition, 'original');
});

test('continuing on a completed non-final section auto-advances within the same turn', async () => {
  let call = 0;
  const chatClient = recordingChatClient((body) => {
    call += 1;
    if (call === 1) return { response: 'Last bit of section 1.', sectionComplete: true };
    return { response: 'Start of section 2.' };
  });
  const reader = scriptedReader([
    { action: 'continue', message: null, target_section: null, stop_reason: null, private_reflection: privateReflection() },
    { action: 'continue', message: null, target_section: null, stop_reason: null, private_reflection: privateReflection() },
    { action: 'finish', message: null, target_section: null, stop_reason: 'done', private_reflection: privateReflection() },
  ]);

  const result = await runSession({
    textEntry: TEXT_ENTRY,
    sections: SECTIONS,
    startSectionIndex: 0,
    edition: 'evolving',
    maxTurns: 5,
    baseUrl: 'http://localhost:3000',
    reader,
    chatClient,
  });

  // Turn 1: gets the final response for section 1, marks it complete.
  assert.equal(result.turns[0].sectionNumber, 1);
  assert.equal(result.turns[0].advancedSection, false);
  // Turn 2: sees section 1 already complete, advances to section 2 in-turn, then reads it.
  assert.equal(result.turns[1].advancedSection, true);
  assert.equal(result.turns[1].sectionAfter, 2);
  assert.equal(chatClient.calls.length, 2);
  assert.equal(chatClient.calls[1].body.sectionIndex, 1);
});

test('continuing past the final completed section stops advancing and leaves a system note', async () => {
  const chatClient = recordingChatClient(() => ({ response: 'The end.', sectionComplete: true }));
  const reader = scriptedReader([
    { action: 'continue', message: null, target_section: null, stop_reason: null, private_reflection: privateReflection() },
    { action: 'continue', message: null, target_section: null, stop_reason: null, private_reflection: privateReflection() },
  ]);

  const result = await runSession({
    textEntry: TEXT_ENTRY,
    sections: [SECTIONS[0]], // only one section, so it's immediately "final"
    startSectionIndex: 0,
    edition: 'evolving',
    maxTurns: 2,
    baseUrl: 'http://localhost:3000',
    reader,
    chatClient,
  });

  assert.equal(result.turns[1].note, 'reached end of final section; no further content to read');
  assert.equal(result.stopReason, 'turn_limit_reached');
});

test('a valid navigate action changes section without any HTTP call', async () => {
  const chatClient = recordingChatClient(() => ({ response: 'should not be called' }));
  const reader = scriptedReader([
    { action: 'navigate', message: null, target_section: 2, stop_reason: null, private_reflection: privateReflection() },
    { action: 'finish', message: null, target_section: null, stop_reason: 'done', private_reflection: privateReflection() },
  ]);

  const result = await runSession({
    textEntry: TEXT_ENTRY,
    sections: SECTIONS,
    startSectionIndex: 0,
    edition: 'evolving',
    maxTurns: 5,
    baseUrl: 'http://localhost:3000',
    reader,
    chatClient,
  });

  assert.equal(chatClient.calls.length, 0);
  assert.equal(result.turns[0].navigatedTo, 2);
  assert.equal(result.finalSectionIndex, 1);
});

test('an out-of-range navigate target is rejected without changing section', async () => {
  const chatClient = recordingChatClient(() => ({ response: 'unused' }));
  const reader = scriptedReader([
    { action: 'navigate', message: null, target_section: 99, stop_reason: null, private_reflection: privateReflection() },
    { action: 'finish', message: null, target_section: null, stop_reason: 'done', private_reflection: privateReflection() },
  ]);

  const result = await runSession({
    textEntry: TEXT_ENTRY,
    sections: SECTIONS,
    startSectionIndex: 0,
    edition: 'evolving',
    maxTurns: 5,
    baseUrl: 'http://localhost:3000',
    reader,
    chatClient,
  });

  assert.equal(chatClient.calls.length, 0);
  assert.equal(result.turns[0].navigatedTo, undefined);
  assert.match(result.turns[0].note, /invalid navigate target/);
  assert.equal(result.finalSectionIndex, 0);
});

test('stops at the turn limit if the reader never finishes', async () => {
  const chatClient = recordingChatClient(() => ({ response: 'ok' }));
  const reader = {
    chooseAction: async () => ({
      action: 'continue',
      message: null,
      target_section: null,
      stop_reason: null,
      private_reflection: privateReflection(),
    }),
  };

  const result = await runSession({
    textEntry: TEXT_ENTRY,
    sections: SECTIONS,
    startSectionIndex: 0,
    edition: 'evolving',
    maxTurns: 3,
    baseUrl: 'http://localhost:3000',
    reader,
    chatClient,
  });

  assert.equal(result.turns.length, 3);
  assert.equal(result.stopReason, 'turn_limit_reached');
});

test('private reflections are recorded but never sent in any request body', async () => {
  const secretNote = 'PRIVATE-NOTE-should-never-leave-the-harness';
  const chatClient = recordingChatClient(() => ({ response: 'ok' }));
  const reader = scriptedReader([
    {
      action: 'message',
      message: 'A visible question.',
      target_section: null,
      stop_reason: null,
      private_reflection: privateReflection(secretNote),
    },
    { action: 'finish', message: null, target_section: null, stop_reason: 'done', private_reflection: privateReflection() },
  ]);

  const result = await runSession({
    textEntry: TEXT_ENTRY,
    sections: SECTIONS,
    startSectionIndex: 0,
    edition: 'evolving',
    maxTurns: 5,
    baseUrl: 'http://localhost:3000',
    reader,
    chatClient,
  });

  assert.equal(result.turns[0].privateReflection.note, secretNote);
  for (const call of chatClient.calls) {
    assert.doesNotMatch(JSON.stringify(call.body), new RegExp(secretNote));
  }
});

test('a mid-run request failure is recorded, not thrown — prior turns are preserved', async () => {
  let call = 0;
  const chatClient = {
    postChat: async (baseUrl, body) => {
      call += 1;
      if (call <= 2) return { response: `ok ${call}` };
      const err = new Error('http://localhost:3000/api/chat returned 502: Empty completion');
      throw err;
    },
  };
  const reader = scriptedReader([
    { action: 'message', message: 'Q1', target_section: null, stop_reason: null, private_reflection: privateReflection() },
    { action: 'message', message: 'Q2', target_section: null, stop_reason: null, private_reflection: privateReflection() },
    { action: 'message', message: 'Q3 (will fail)', target_section: null, stop_reason: null, private_reflection: privateReflection() },
  ]);

  const result = await runSession({
    textEntry: TEXT_ENTRY,
    sections: SECTIONS,
    startSectionIndex: 0,
    edition: 'evolving',
    maxTurns: 5,
    baseUrl: 'http://localhost:3000',
    reader,
    chatClient,
  });

  assert.equal(result.stopReason, 'error');
  assert.match(result.stopDetail, /502.*Empty completion/);
  assert.equal(result.turns.length, 3);
  assert.equal(result.turns[0].guideResponse, 'ok 1');
  assert.equal(result.turns[1].guideResponse, 'ok 2');
  assert.equal(result.turns[2].action, 'message'); // action was already chosen before the request failed
  assert.match(result.turns[2].note, /turn failed.*502/);
  // The failed turn's own private reflection is still preserved.
  assert.equal(result.turns[2].privateReflection.note, 'fine');
});

test('a failure while the reader model itself is choosing an action is also recorded, not thrown', async () => {
  const chatClient = { postChat: async () => ({ response: 'unused' }) };
  const reader = {
    chooseAction: async () => {
      throw new Error('OpenAI request failed: network error');
    },
  };

  const result = await runSession({
    textEntry: TEXT_ENTRY,
    sections: SECTIONS,
    startSectionIndex: 0,
    edition: 'evolving',
    maxTurns: 5,
    baseUrl: 'http://localhost:3000',
    reader,
    chatClient,
  });

  assert.equal(result.stopReason, 'error');
  assert.equal(result.turns.length, 1);
  assert.equal(result.turns[0].action, 'error'); // no action was ever chosen
  assert.match(result.turns[0].note, /OpenAI request failed/);
});

test('image tokens in a guide response are stripped from the visible transcript and tracked as shown', async () => {
  const chatClient = recordingChatClient((_body, n) =>
    n === 1 ? { response: 'Look: [[IMAGE:kandinsky]] interesting.' } : { response: 'ok' }
  );
  const reader = scriptedReader([
    { action: 'message', message: 'Show me something.', target_section: null, stop_reason: null, private_reflection: privateReflection() },
    { action: 'message', message: 'Anything else?', target_section: null, stop_reason: null, private_reflection: privateReflection() },
    { action: 'finish', message: null, target_section: null, stop_reason: 'done', private_reflection: privateReflection() },
  ]);

  const result = await runSession({
    textEntry: TEXT_ENTRY,
    sections: SECTIONS,
    startSectionIndex: 0,
    edition: 'evolving',
    maxTurns: 5,
    baseUrl: 'http://localhost:3000',
    reader,
    chatClient,
  });

  assert.doesNotMatch(result.turns[0].guideResponse, /\[\[IMAGE/); // recorded as the reader actually saw it...
  assert.equal(chatClient.calls[1].body.shownImages.includes('kandinsky'), true); // ...but still tracked for the next request
});

test('contributionsBySection records only message turns, keyed by 1-based section number', async () => {
  const chatClient = recordingChatClient(() => ({ response: 'ok' }));
  const reader = scriptedReader([
    { action: 'message', message: 'A real question.', target_section: null, stop_reason: null, private_reflection: privateReflection() },
    { action: 'continue', message: null, target_section: null, stop_reason: null, private_reflection: privateReflection() },
    { action: 'finish', message: null, target_section: null, stop_reason: 'done', private_reflection: privateReflection() },
  ]);

  const result = await runSession({
    textEntry: TEXT_ENTRY,
    sections: SECTIONS,
    startSectionIndex: 0,
    edition: 'evolving',
    maxTurns: 5,
    baseUrl: 'http://localhost:3000',
    reader,
    chatClient,
  });

  assert.deepEqual(Object.keys(result.contributionsBySection), ['1']);
  const pairs = result.contributionsBySection[1];
  assert.equal(pairs.length, 2); // one user/assistant pair — the continue turn added nothing
  assert.equal(pairs[0].content, 'A real question.');
  assert.equal(pairs[1].content, 'ok');
});

test('contributionsBySection keys contributions to whichever section they were actually made in', async () => {
  const chatClient = recordingChatClient(() => ({ response: 'ok' }));
  const reader = scriptedReader([
    { action: 'navigate', message: null, target_section: 2, stop_reason: null, private_reflection: privateReflection() },
    { action: 'message', message: 'A question about section 2.', target_section: null, stop_reason: null, private_reflection: privateReflection() },
    { action: 'finish', message: null, target_section: null, stop_reason: 'done', private_reflection: privateReflection() },
  ]);

  const result = await runSession({
    textEntry: TEXT_ENTRY,
    sections: SECTIONS,
    startSectionIndex: 0,
    edition: 'evolving',
    maxTurns: 5,
    baseUrl: 'http://localhost:3000',
    reader,
    chatClient,
  });

  assert.deepEqual(Object.keys(result.contributionsBySection), ['2']);
});

test('a run with only continue/navigate actions has an empty contributionsBySection', async () => {
  const chatClient = recordingChatClient(() => ({ response: 'ok' }));
  const reader = scriptedReader([
    { action: 'continue', message: null, target_section: null, stop_reason: null, private_reflection: privateReflection() },
    { action: 'finish', message: null, target_section: null, stop_reason: 'done', private_reflection: privateReflection() },
  ]);

  const result = await runSession({
    textEntry: TEXT_ENTRY,
    sections: SECTIONS,
    startSectionIndex: 0,
    edition: 'evolving',
    maxTurns: 5,
    baseUrl: 'http://localhost:3000',
    reader,
    chatClient,
  });

  assert.deepEqual(result.contributionsBySection, {});
});
