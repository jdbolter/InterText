'use strict';

// H-021: the reading report measures a round from its session.json files.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

const { measureSession, totals, formatTable, report, repeatedRuns, repeatedClosings, selfReferences, noteCount, replyBody } = require('../reading-report');

const long = Array(260).fill('word').join(' ');
const session = {
  meta: { profileId: 'general', startSectionIndex: 1, edition: 'evolving' },
  stopReason: 'reader_finished',
  turns: [
    { turn: 1, sectionNumber: 2, action: 'continue', guideResponse: 'One two three four five six seven eight nine ten. The orchestra went bankrupt.\n\nNotes:\n[1] Levine 1988, 3. Levine, Lawrence.\n[2] (web) A page. https://a.org',
      privateReflection: { understanding: 'high', confusion: 'none', interest: 'high', note: 'x' },
      revision: { draft: 'd '.repeat(300), applied: true, usage: { reply: { input_tokens: 100, cache_creation_input_tokens: 50, cache_read_input_tokens: 850, output_tokens: 40, output_tokens_details: { thinking_tokens: 10 } }, revision: { input_tokens: 200, output_tokens: 30 } } } },
    { turn: 2, sectionNumber: 2, action: 'message', readerMessage: 'Why?', guideResponse: `The main line of the argument is this. One two three four five six seven eight nine ten. ${long}`,
      privateReflection: { understanding: 'medium', confusion: 'significant', interest: 'low', note: 'y' },
      revision: { draft: 'd', applied: false, reason: 'revision changed the markers', usage: { reply: { input_tokens: 10 }, revision: { input_tokens: 10 } } } },
    { turn: 3, sectionNumber: 2, action: 'finish', stopReason: 'done', privateReflection: { understanding: 'high', confusion: 'none', interest: 'medium', note: 'z' } },
  ],
};

test('one session is measured: length, notes, self-reference, repeats, the reader, revision, cache', () => {
  const m = measureSession(session);
  assert.equal(m.run, 'general · section 2');
  assert.equal(m.replies, 2);
  assert.deepEqual([m.toMessages, m.returns], [1, 1]);
  assert.deepEqual(m.actions, { continue: 1, message: 1, finish: 1 });
  assert.equal(m.words.over, 1);
  assert.equal(m.words.limit, 250);
  assert.equal(m.notes.perReply, 1); // two notes on the first reply, none on the second
  assert.equal(m.notes.web, 1);
  assert.equal(m.notes.first, 2);
  assert.equal(m.selfReference, 1);
  assert.equal(m.repeatedRuns, 4, 'the ten-word sentence shared by both replies holds four seven-word runs');
  assert.equal(m.repeatedClosings, 0);
  assert.deepEqual(m.reflection, { understanding: 2.67, interest: 2, confusion: 0.67, confused: 1 });
  assert.deepEqual([m.revision.applied, m.revision.of, m.revision.draftWords], [1, 2, 151]);
  assert.deepEqual(m.revision.reasons, ['revision changed the markers']);
  assert.equal(m.usage.cacheRead, 850);
  assert.equal(m.usage.cacheShare, 0.7); // 850 of (100+50+850+200+10+10)
  assert.equal(m.stopReason, 'reader_finished');
});

test('helpers: the reply body stops at the notes; Philadelphia\'s Main Line is not self-reference', () => {
  assert.equal(replyBody('Prose.\n\nNotes:\n[1] x'), 'Prose.');
  assert.deepEqual(noteCount('Prose.\n\nNotes:\n[1] x\n[2] (web) y'), { all: 2, web: 1 });
  assert.equal(selfReferences('Tracy Lord, a Main Line heiress, chooses.'), false);
  assert.equal(selfReferences('That is the main line: the divide is dissolving.'), true);
  assert.equal(selfReferences('The argument here is that taste marks class.'), true);
  assert.equal(repeatedRuns(['a b c d e f g h', 'x a b c d e f g h']), 2);
  assert.equal(repeatedClosings(['First. The end is the same.', 'Other. The end is the same.']), 1);
});

test('a round is found under a directory and totalled; the table names every run', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'reading-report-'));
  fs.mkdirSync(path.join(dir, 'run-a'));
  fs.mkdirSync(path.join(dir, 'run-b'));
  fs.writeFileSync(path.join(dir, 'run-a', 'session.json'), JSON.stringify(session));
  fs.writeFileSync(path.join(dir, 'run-b', 'session.json'), JSON.stringify({ ...session, meta: { ...session.meta, profileId: 'student', startSectionIndex: 4 }, stopReason: 'error' }));
  const out = report([dir]);
  assert.equal(out.runs.length, 2);
  const all = out.all;
  assert.deepEqual([all.runs, all.replies, all.selfReference, all.finished, all.errors], [2, 4, 2, 1, 1]);
  assert.equal(all.usage.cacheShare, 0.7);
  const table = formatTable(out.runs, all);
  assert.match(table, /general · section 2/);
  assert.match(table, /student · section 5/);
  assert.match(table, /^all /m);
  assert.match(table, /1 of 2 runs ended by the reader's choice; 1 stopped on an error/);
  assert.match(table, /Revisions not applied: general · section 2: revision changed the markers; student · section 5/);
  assert.deepEqual(totals([]).runs, 0);
});
