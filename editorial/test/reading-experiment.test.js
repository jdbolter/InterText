'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');

const {
  EDITORIAL_DELIVERY_TOOL,
  buildEditorialDeliveryTool,
  extractEditorialDelivery,
  formatPriorSectionSummaries,
  isEditorialEdition,
  loadEditorialSection,
  normalizePriorSectionSummaries,
  prepareEditorialReading,
  prepareVersionedReading,
} = require('../../api/lib/editorial-reading');

const ROOT = path.join(__dirname, '..', '..');

test('recognizes only the two local editorial experiment editions', () => {
  assert.equal(isEditorialEdition('editorial-spine'), true);
  assert.equal(isEditorialEdition('editorial-fund'), true);
  assert.equal(isEditorialEdition('original'), false);
});

test('loads every generated Plenitude package by stable section order', () => {
  const expected = [
    ['great-divide', 4, 0],
    ['philadelphia-symphony-story', 8, 0],
    ['class-in-america', 2, 0],
    ['case-of-music', 7, 0],
    ['shocking-art', 10, 4],
    ['art-as-special-interest', 17, 0],
    ['communities-and-creativity', 8, 0],
  ];
  expected.forEach(([sectionId, passageCount, fundCount], sectionIndex) => {
    const section = loadEditorialSection({ rootDir: ROOT, textId: 'plenitude', sectionIndex });
    assert.equal(section.sectionId, sectionId);
    assert.equal(section.spine.length, passageCount);
    assert.equal(section.fundEntries.length, fundCount);
  });
});

test('loads every generated Blood on the Wall package by stable section order', () => {
  const expected = [
    ['shot-heard-in-berlin', 2],
    ['graduated-pressure', 2],
    ['fog-of-distrust', 2],
    ['files-break-open', 2],
  ];
  expected.forEach(([sectionId, passageCount], sectionIndex) => {
    const section = loadEditorialSection({ rootDir: ROOT, textId: 'blood-on-the-wall', sectionIndex });
    assert.equal(section.sectionId, sectionId);
    assert.equal(section.spine.length, passageCount);
    assert.equal(section.fundEntries.length, 0);
  });
});

test('loads every generated Remediation package by stable section order', () => {
  const expected = [
    ['two-logics', 8],
    ['perspective-and-automaticity', 9],
    ['photorealism-and-real', 7],
    ['windowed-interface', 6],
    ['genealogy-of-hypermediacy', 19],
    ['repurposing-and-remediation', 4],
    ['rivalry-and-refashioning', 8],
  ];
  expected.forEach(([sectionId, passageCount], sectionIndex) => {
    const section = loadEditorialSection({ rootDir: ROOT, textId: 'remediation', sectionIndex });
    assert.equal(section.sectionId, sectionId);
    assert.equal(section.spine.length, passageCount);
    assert.equal(section.fundEntries.length, 0);
  });
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
      sectionSummary: 'The reader is testing how plural standards replace a single hierarchy.',
    },
  }], ['shared-evaluative-field']);
  assert.equal(parsed.text, 'Visible prose.');
  assert.deepEqual(parsed.usedFundEntryIds, ['shared-evaluative-field']);
  assert.equal(parsed.trackingComplete, true);
  assert.equal(parsed.sectionComplete, false);
  assert.match(parsed.sectionSummary, /plural standards/);
});

test('delivery extraction rejects a missing call or an entry that was not offered', () => {
  assert.throws(() => extractEditorialDelivery([], ['entry']), /Expected exactly one/);
  assert.throws(
    () => extractEditorialDelivery([{
      type: 'tool_use',
      name: EDITORIAL_DELIVERY_TOOL,
      input: {
        response: 'Prose.',
        usedFundEntryIds: ['other'],
        sectionComplete: false,
        sectionSummary: 'A compact memory.',
      },
    }], ['entry']),
    /was not offered/
  );
});

test('delivery extraction requires a nonempty private section summary', () => {
  assert.throws(
    () => extractEditorialDelivery([{
      type: 'tool_use',
      name: EDITORIAL_DELIVERY_TOOL,
      input: { response: 'Prose.', usedFundEntryIds: [], sectionComplete: false },
    }], []),
    /sectionSummary is invalid/
  );
});

test('spine-only delivery tool requires an empty use array', () => {
  const tool = buildEditorialDeliveryTool([]);
  assert.equal(tool.input_schema.properties.usedFundEntryIds.maxItems, 0);
  assert.ok(tool.input_schema.required.includes('sectionSummary'));
});

test('prior-section memory is compact, ordered, and excludes the current section', () => {
  const raw = [
    { sectionIndex: 2, title: 'Third', summary: 'Third memory.' },
    { sectionIndex: 0, title: 'First', summary: ' First memory. ' },
    { sectionIndex: 1, title: 'Current', summary: 'Must be excluded.' },
    { sectionIndex: 0, title: 'Duplicate', summary: 'Must also be excluded.' },
    { sectionIndex: -1, title: 'Invalid', summary: 'Invalid.' },
  ];
  assert.deepEqual(normalizePriorSectionSummaries(raw, 1), [
    { sectionIndex: 0, title: 'First', summary: 'First memory.' },
    { sectionIndex: 2, title: 'Third', summary: 'Third memory.' },
  ]);
  const formatted = formatPriorSectionSummaries(raw, 1);
  assert.match(formatted, /Section 1 — First: First memory\./);
  assert.match(formatted, /Section 3 — Third: Third memory\./);
  assert.doesNotMatch(formatted, /Must be excluded/);
});

test('reader-shaped reading offers accepted fund entries but not candidates', () => {
  const sectionPackage = loadEditorialSection({ rootDir: ROOT, textId: 'plenitude', sectionIndex: 4 });
  sectionPackage.fundEntries[0].status = 'accepted';
  const reading = prepareVersionedReading({ sectionPackage });
  assert.deepEqual(reading.offeredFundEntryIds, ['shared-evaluative-field']);
  assert.match(reading.fundText, /shared-evaluative-field/);
  assert.doesNotMatch(reading.fundText, /armory-show-ridicule/);
});
