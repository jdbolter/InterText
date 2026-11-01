'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');

const {
  clearFundCache,
  loadSectionFund,
  mainLineText,
  sectionLabelLine,
  editorialModel,
  textModel,
  thinkingOff,
} = require('../../api/lib/text-extras');
const {
  buildContinuationInstructions,
  continuationUserMessage,
} = require('../../api/lib/reading-continuation');

test('section label falls back to "Current section" and honours sectionLabel', () => {
  assert.equal(sectionLabelLine({}, 'Shocking Art'), 'Current section: Shocking Art');
  assert.equal(sectionLabelLine({ sectionLabel: '  ' }, 'Shocking Art'), 'Current section: Shocking Art');
  assert.equal(sectionLabelLine({ sectionLabel: 'Now under discussion' }, 'Shocking Art'),
    'Now under discussion: Shocking Art');
});

test('a section fund loads with its preamble for ordinary readings only', () => {
  clearFundCache();
  const reads = [];
  const readFile = p => { reads.push(p); return '\nBürger, entry.\n'; };
  const config = {
    fundsDir: '/funds',
    fundPreamble: 'WORKS THAT MAY BE CITED BY NAME',
    sectionFunds: ['section-1.md', null],
  };
  assert.equal(loadSectionFund(config, 0, { readFile }), 'WORKS THAT MAY BE CITED BY NAME\n\nBürger, entry.');
  assert.deepEqual(reads, [path.join('/funds', 'section-1.md')]);
  assert.equal(loadSectionFund(config, 0, { readFile }), 'WORKS THAT MAY BE CITED BY NAME\n\nBürger, entry.');
  assert.equal(reads.length, 1, 'fund files are read once and cached');
  assert.equal(loadSectionFund(config, 1, { readFile }), null, 'a section without a fund gets no block');
  assert.equal(loadSectionFund(config, 5, { readFile }), null);
  assert.equal(loadSectionFund(config, 0, { readFile, editorial: true }), null, 'editorial readings never get it');
  assert.equal(loadSectionFund({}, 0, { readFile }), null, 'texts without sectionFunds are unchanged');
});

test('every continuationWording key overrides its default in ordinary readings', () => {
  const wording = {
    cursor: 'CURSOR',
    opening: 'OPENING',
    completion: 'COMPLETION [[SECTION_COMPLETE]]',
    openingCompletion: 'OPENING-COMPLETION',
    continueMessage: 'Go on.',
    openingContinueMessage: 'Go on from the boxed opening.',
  };
  const later = buildContinuationInstructions({ continuing: true, firstContinuation: false, wording });
  assert.match(later, /CURSOR/);
  assert.match(later, /COMPLETION \[\[SECTION_COMPLETE\]\]/);
  assert.doesNotMatch(later, /reading cursor/);
  const opening = buildContinuationInstructions({ continuing: true, firstContinuation: true, wording });
  assert.match(opening, /OPENING/);
  assert.match(opening, /OPENING-COMPLETION/);
  assert.doesNotMatch(opening, /first supplied passage/);
  assert.equal(continuationUserMessage(false, wording), 'Go on.');
  assert.equal(continuationUserMessage(true, wording), 'Go on from the boxed opening.');
});

test('missing wording keys keep the shared defaults', () => {
  const later = buildContinuationInstructions({ continuing: true, firstContinuation: false, wording: { cursor: 'CURSOR' } });
  assert.match(later, /CURSOR/);
  assert.match(later, /append \[\[SECTION_COMPLETE\]\]/);
  assert.equal(continuationUserMessage(false, { cursor: 'x' }), 'Continue reading from where we have reached in this section.');
  assert.equal(continuationUserMessage(false), 'Continue reading from where we have reached in this section.');
});

test('editorial readings ignore continuationWording', () => {
  const wording = { cursor: 'CURSOR', opening: 'OPENING', completion: 'COMPLETION', openingCompletion: 'OC' };
  const later = buildContinuationInstructions({ continuing: true, firstContinuation: false, editorialReading: true, wording });
  assert.doesNotMatch(later, /CURSOR|COMPLETION/);
  assert.match(later, /private delivery tool/);
  const opening = buildContinuationInstructions({ continuing: true, firstContinuation: true, editorialReading: true, wording });
  assert.doesNotMatch(opening, /OPENING|OC/);
  assert.match(opening, /Set sectionComplete to false/);
});

test('digital-plenitude wiring: label, funds for sections 1 and 5, wording, marker kept', () => {
  const config = require('../../digital-plenitude/config');
  clearFundCache();
  assert.equal(sectionLabelLine(config, config.sectionNames[0]), 'Now under discussion: The Great Divide');
  assert.match(loadSectionFund(config, 0), /^WORKS THAT MAY BE CITED BY NAME/);
  assert.match(loadSectionFund(config, 0), /Greenberg/);
  assert.match(loadSectionFund(config, 4), /Bürger/);
  for (const i of [1, 2, 3, 5, 6]) assert.match(loadSectionFund(config, i), /^WORKS THAT MAY BE CITED BY NAME/);
  assert.match(config.continuationWording.completion, /\[\[SECTION_COMPLETE\]\]/);
  assert.equal(continuationUserMessage(false, config.continuationWording), 'Go on.');
  for (const field of ['behavioralInstructions', 'continuationVoice', 'fundPreamble']) {
    assert.doesNotMatch(config[field], /\bsections?\b/i, `${field} does not say "section"`);
  }
});

test('plenitude, the old text, sends exactly what it sent before', () => {
  const config = require('../../plenitude/config');
  clearFundCache();
  assert.equal(sectionLabelLine(config, 'X'), 'Current section: X');
  assert.equal(loadSectionFund(config, 0), null);
  assert.equal(config.continuationWording, undefined);
});

test('the reply model defaults to claude-sonnet-5-5 for every text (H-007)', () => {
  assert.equal(textModel({}), 'claude-sonnet-5-5');
  assert.equal(textModel({ model: ' ' }), 'claude-sonnet-5-5');
  assert.equal(textModel(require('../../digital-plenitude/config')), 'claude-sonnet-5-5');
  assert.equal(textModel(require('../../plenitude/config')), 'claude-sonnet-5-5');
  assert.equal(textModel({ model: 'claude-sonnet-5' }), 'claude-sonnet-5', 'a text can still pin the older model');
});

test('thinking is turned off in each model\'s own way', () => {
  assert.deepEqual(thinkingOff('claude-sonnet-5-5'), { type: 'between_tools' });
  assert.deepEqual(thinkingOff('claude-sonnet-5'), { type: 'disabled' });
});

test('the main line is handed to the model only when a text has one (H-009)', () => {
  assert.equal(mainLineText({}, 0), null);
  const config = { sectionPoints: ['The divide has almost vanished.', null], chapterPoint: 'The plenitude.' };
  const text = mainLineText(config, 0);
  assert.match(text, /^The main line at this point: The divide has almost vanished\.$/m);
  assert.match(text, /^The chapter as a whole: The plenitude\.$/m);
  assert.match(text, /name this main line plainly, in so many words, in your opening paragraph/);
  assert.doesNotMatch(mainLineText(config, 1), /at this point/, 'a section without a statement still gets the chapter');
});

test('editorial readings and evolution stay on a model that supports forced tool calls', () => {
  assert.equal(editorialModel({}), 'claude-sonnet-5');
  assert.equal(editorialModel(require('../../plenitude/config')), 'claude-sonnet-5');
  assert.equal(editorialModel({ editorialModel: 'm' }), 'm');
});
