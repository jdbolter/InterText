'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');

const {
  EDITORIAL_DELIVERY_TOOL,
  buildEditorialDeliveryTool,
  extractEditorialDelivery,
  isEditorialEdition,
  loadEditorialSection,
  prepareEditorialReading,
  prepareVersionedReading,
} = require('../../api/lib/editorial-reading');

const ROOT = path.join(__dirname, '..', '..');

test('recognizes only the two local editorial experiment editions', () => {
  assert.equal(isEditorialEdition('editorial-spine'), true);
  assert.equal(isEditorialEdition('editorial-fund'), true);
  assert.equal(isEditorialEdition('original'), false);
});

test('loads the generated Plenitude Section 5 package by stable section order', () => {
  const section = loadEditorialSection({ rootDir: ROOT, textId: 'plenitude', sectionIndex: 4 });
  assert.equal(section.sectionId, 'shocking-art');
  assert.equal(section.spine.length, 10);
  assert.equal(section.fundEntries.length, 4);
});

test('fails clearly when an experimental section has not been packaged', () => {
  assert.throws(
    () => loadEditorialSection({ rootDir: ROOT, textId: 'plenitude', sectionIndex: 0 }),
    /has no editorial package yet/
  );
});

test('spine condition supplies no fund while preserving passage markers', () => {
  const reading = prepareEditorialReading({
    rootDir: ROOT,
    textId: 'plenitude',
    sectionIndex: 4,
    edition: 'editorial-spine',
  });
  assert.equal(reading.fundText, null);
  assert.deepEqual(reading.offeredFundEntryIds, []);
  assert.match(reading.sectionText, /intertext:passage shocking-art-p01/);
  assert.match(reading.instructions, /spine-only condition/);
});

test('fund condition offers candidates once and records already-presented entries', () => {
  const reading = prepareEditorialReading({
    rootDir: ROOT,
    textId: 'plenitude',
    sectionIndex: 4,
    edition: 'editorial-fund',
    presentedFundEntryIds: ['shared-evaluative-field', 'unknown-entry'],
  });
  assert.deepEqual(reading.alreadyPresentedFundEntryIds, ['shared-evaluative-field']);
  assert.equal(reading.offeredFundEntryIds.includes('shared-evaluative-field'), false);
  assert.equal(reading.offeredFundEntryIds.length, 3);
  assert.doesNotMatch(reading.fundText, /<fund_entry id="shared-evaluative-field"/);
  assert.match(reading.fundText, /<fund_entry id="futurism-and-dada"/);
});

test('Serner-dependent candidate is not anchored before Serner appears', () => {
  const section = loadEditorialSection({ rootDir: ROOT, textId: 'plenitude', sectionIndex: 4 });
  const entry = section.fundEntries.find(candidate => candidate.id === 'shared-evaluative-field');
  assert.deepEqual(entry.anchors, ['shocking-art-p02']);
});

test('required delivery tool constrains use reports to entries actually offered', () => {
  const tool = buildEditorialDeliveryTool(['shared-evaluative-field']);
  assert.equal(tool.name, EDITORIAL_DELIVERY_TOOL);
  assert.deepEqual(
    tool.input_schema.properties.usedFundEntryIds.items.enum,
    ['shared-evaluative-field']
  );

  const parsed = extractEditorialDelivery([{
    type: 'tool_use',
    name: EDITORIAL_DELIVERY_TOOL,
    input: {
      response: 'Visible prose.',
      usedFundEntryIds: ['shared-evaluative-field'],
      sectionComplete: false,
    },
  }], ['shared-evaluative-field']);
  assert.equal(parsed.text, 'Visible prose.');
  assert.deepEqual(parsed.usedFundEntryIds, ['shared-evaluative-field']);
  assert.equal(parsed.trackingComplete, true);
  assert.equal(parsed.sectionComplete, false);
});

test('delivery extraction rejects a missing call or an entry that was not offered', () => {
  assert.throws(() => extractEditorialDelivery([], ['entry']), /Expected exactly one/);
  assert.throws(
    () => extractEditorialDelivery([{
      type: 'tool_use',
      name: EDITORIAL_DELIVERY_TOOL,
      input: { response: 'Prose.', usedFundEntryIds: ['other'], sectionComplete: false },
    }], ['entry']),
    /was not offered/
  );
});

test('spine-only delivery tool requires an empty use array', () => {
  const tool = buildEditorialDeliveryTool([]);
  assert.equal(tool.input_schema.properties.usedFundEntryIds.maxItems, 0);
});

test('reader-shaped reading offers accepted fund entries but not candidates', () => {
  const sectionPackage = loadEditorialSection({ rootDir: ROOT, textId: 'plenitude', sectionIndex: 4 });
  sectionPackage.fundEntries[0].status = 'accepted';
  const reading = prepareVersionedReading({ sectionPackage });
  assert.deepEqual(reading.offeredFundEntryIds, ['shared-evaluative-field']);
  assert.match(reading.fundText, /shared-evaluative-field/);
  assert.doesNotMatch(reading.fundText, /armory-show-ridicule/);
});
