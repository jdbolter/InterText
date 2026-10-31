'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');

const {
  clearFundCache,
  loadSectionFund,
  sectionLabelLine,
  textModel,
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

test('the reply model falls back to claude-sonnet-5; digital-plenitude uses claude-sonnet-5-5', () => {
  assert.equal(textModel({}), 'claude-sonnet-5');
  assert.equal(textModel({ model: ' ' }), 'claude-sonnet-5');
  assert.equal(textModel(require('../../digital-plenitude/config')), 'claude-sonnet-5-5');
  assert.equal(textModel(require('../../plenitude/config')), 'claude-sonnet-5');
});
