'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');

const {
  approvedVersion,
  evolveEditorialSection,
  validateProposal,
  validateReview,
} = require('../../api/lib/editorial-evolution');
const { loadSeedSection } = require('../../api/lib/editorial-package');
const { prepareVersionedReading } = require('../../api/lib/editorial-reading');
const {
  INITIALIZE_SCRIPT,
  PUBLISH_SCRIPT,
  ensureSectionInitialized,
  loadCurrentSection,
  publishSectionVersion,
  sectionHeadKey,
  sectionVersionKey,
} = require('../../api/lib/editorial-store');

const ROOT = path.join(__dirname, '..', '..');

class FakeRedis {
  constructor() {
    this.values = new Map();
  }

  async get(key) {
    const value = this.values.get(key);
    if (value === undefined) return null;
    try { return JSON.parse(value); } catch { return value; }
  }

  async eval(script, keys, args) {
    if (script === INITIALIZE_SCRIPT) {
      const current = this.values.get(keys[0]);
      if (current !== undefined) return current;
      if (!this.values.has(keys[1])) this.values.set(keys[1], args[0]);
      this.values.set(keys[0], args[1]);
      return args[1];
    }
    if (script === PUBLISH_SCRIPT) {
      const current = this.values.get(keys[0]);
      if (current !== args[0]) return [0, current || ''];
      if (this.values.has(keys[1])) return [-1, current];
      this.values.set(keys[1], args[1]);
      this.values.set(keys[2], args[2]);
      this.values.set(keys[0], args[3]);
      return [1, args[3]];
    }
    throw new Error('Unexpected script');
  }
}

function seed() {
  return loadSeedSection({ rootDir: ROOT, textId: 'plenitude', sectionIndex: 4 });
}

function conversation() {
  return [
    { role: 'user', content: 'The objection is really about reach, not whether anyone still cares.' },
    { role: 'assistant', content: 'The difference is the scale of the shared evaluative field.' },
  ];
}

function proposal(overrides = {}) {
  return {
    decision: 'change',
    changeSummary: 'Preserve a concise clarification about reach.',
    spineUpdates: [],
    fundOperations: [{
      operation: 'add',
      targetEntryId: null,
      entry: {
        id: 'reach-as-scale',
        title: 'Reach is a question of scale',
        anchors: ['shocking-art-p01'],
        kind: 'clarification',
        markdown: 'The relevant loss is not all passion but the reach of a judgment beyond one artistic community.',
        useWhen: 'Use when a reader equates continuing controversy with unchanged cultural reach.',
        sourceStatus: 'not-required',
        sources: [],
      },
      rationale: 'The exchange supplied a durable distinction.',
      conversationTurns: [1, 2],
    }],
    ...overrides,
  };
}

function review(overrides = {}) {
  return {
    decision: 'approve',
    summary: 'The clarification is concise, distinct, and correctly anchored.',
    spineReviews: [],
    fundReviews: [{
      operationIndex: 0,
      approved: true,
      publishStatus: 'accepted',
      reason: 'Ready for selective use.',
    }],
    ...overrides,
  };
}

test('versioned store falls back to the seed, initializes it, and atomically publishes a child', async () => {
  const redis = new FakeRedis();
  const before = await loadCurrentSection({ rootDir: ROOT, textId: 'plenitude', sectionIndex: 4, redis });
  assert.equal(before.source, 'seed');

  const initialized = await ensureSectionInitialized({ rootDir: ROOT, textId: 'plenitude', sectionIndex: 4, redis });
  assert.equal(initialized.source, 'kv');
  assert.equal(
    await redis.get(sectionHeadKey('plenitude', 'shocking-art')),
    initialized.sectionPackage.versionId
  );

  const next = {
    ...initialized.sectionPackage,
    versionId: 'shocking-art-test-v002',
    parentVersionId: initialized.sectionPackage.versionId,
    createdAt: '2026-09-20T16:00:00Z',
    source: { type: 'reader-shaped', path: 'kv://test' },
    changeSummary: 'Test update.',
  };
  const result = await publishSectionVersion({
    currentPackage: initialized.sectionPackage,
    nextPackage: next,
    updateRecord: { test: true },
    updateId: 'test-update',
    redis,
  });
  assert.equal(result.published, true);
  assert.deepEqual(
    await redis.get(sectionVersionKey('plenitude', 'shocking-art', next.versionId)),
    next
  );
  const current = await loadCurrentSection({ rootDir: ROOT, textId: 'plenitude', sectionIndex: 4, redis });
  assert.equal(current.sectionPackage.versionId, next.versionId);

  const conflict = await publishSectionVersion({
    currentPackage: initialized.sectionPackage,
    nextPackage: { ...next, versionId: 'shocking-art-test-v003' },
    updateRecord: { test: true },
    updateId: 'stale-update',
    redis,
  });
  assert.equal(conflict.conflict, true);
  assert.equal(conflict.actualHead, next.versionId);
});

test('proposal validation rejects invented source URLs', () => {
  const value = proposal();
  value.fundOperations[0].entry.sourceStatus = 'verified';
  value.fundOperations[0].entry.sources = [{ title: 'Invented', url: 'https://example.com/not-supplied' }];
  assert.throws(
    () => validateProposal(value, seed(), conversation()),
    /source URL that was not supplied/
  );
});

test('approved fund material becomes part of a validated immutable child version', () => {
  const current = seed();
  const value = validateProposal(proposal(), current, conversation());
  const next = approvedVersion({
    sectionPackage: current,
    proposal: value,
    review: review(),
    sessionId: 'session-1',
    updateId: 'update-1',
    now: new Date('2026-09-20T16:30:00Z'),
  });
  assert.equal(next.parentVersionId, current.versionId);
  assert.equal(next.editionId, 'reader-shaped');
  const entry = next.fundEntries.find(candidate => candidate.id === 'reach-as-scale');
  assert.equal(entry.status, 'accepted');
  assert.equal(entry.provenance.sessionId, 'session-1');
  assert.deepEqual(prepareVersionedReading({ sectionPackage: next }).offeredFundEntryIds, ['reach-as-scale']);
});

test('an approved spine edit changes prose without changing the stable passage ID', () => {
  const current = seed();
  const original = current.spine.find(passage => passage.id === 'shocking-art-p01');
  const revisedMarkdown = `${original.markdown}\n\nThe distinction concerns cultural reach, not the disappearance of passionate response.`;
  const value = proposal({
    spineUpdates: [{
      passageId: original.id,
      markdown: revisedMarkdown,
      rationale: 'The exchange identified a concise distinction needed in the main line.',
      conversationTurns: [1, 2],
    }],
    fundOperations: [],
  });
  const next = approvedVersion({
    sectionPackage: current,
    proposal: validateProposal(value, current, conversation()),
    review: review({
      spineReviews: [{
        passageId: original.id,
        approved: true,
        reason: 'The addition is proportionate and clarifies the durable claim.',
      }],
      fundReviews: [],
    }),
    sessionId: 'session-spine',
    updateId: 'update-spine',
    now: new Date('2026-09-20T16:30:30Z'),
  });
  const revised = next.spine.find(passage => passage.id === original.id);
  assert.equal(revised.id, original.id);
  assert.equal(revised.markdown, revisedMarkdown);
  assert.equal(next.parentVersionId, current.versionId);
});

test('unverified factual additions remain candidates even if review requests acceptance', () => {
  const current = seed();
  const value = proposal();
  value.fundOperations[0].entry.sourceStatus = 'needs-verification';
  const next = approvedVersion({
    sectionPackage: current,
    proposal: validateProposal(value, current, conversation()),
    review: review(),
    sessionId: 'session-2',
    updateId: 'update-2',
    now: new Date('2026-09-20T16:31:00Z'),
  });
  assert.equal(next.fundEntries.find(entry => entry.id === 'reach-as-scale').status, 'candidate');
});

test('a reviewed supersession can retire an entry and add its replacement', () => {
  const current = seed();
  const value = proposal({
    spineUpdates: [],
    fundOperations: [{
      operation: 'supersede',
      targetEntryId: 'reach-not-passion',
      entry: {
        id: 'reach-and-public-authority',
        title: 'Reach and public authority',
        anchors: ['shocking-art-p01'],
        kind: 'clarification',
        markdown: 'The change concerns the public reach and authority of artistic judgments, not the disappearance of intense local disagreement.',
        useWhen: 'Use when a reader treats continuing local controversy as proof of unchanged public authority.',
        sourceStatus: 'not-required',
        sources: [],
      },
      rationale: 'The replacement states the distinction more precisely.',
      conversationTurns: [1, 2],
    }],
  });
  const next = approvedVersion({
    sectionPackage: current,
    proposal: validateProposal(value, current, conversation()),
    review: review({
      fundReviews: [{
        operationIndex: 0,
        approved: true,
        publishStatus: 'accepted',
        reason: 'The replacement is concise and ready for selective use.',
      }],
    }),
    sessionId: 'session-supersede',
    updateId: 'update-supersede',
    now: new Date('2026-09-20T16:31:30Z'),
  });
  assert.equal(next.fundEntries.find(entry => entry.id === 'reach-not-passion').status, 'superseded');
  assert.equal(next.fundEntries.find(entry => entry.id === 'reach-and-public-authority').status, 'accepted');
});

test('review decisions cannot contradict their per-operation approvals', () => {
  const value = proposal();
  assert.throws(
    () => validateReview(review({ decision: 'reject' }), value),
    /cannot approve individual operations/
  );
  assert.throws(
    () => validateReview(review({
      decision: 'approve',
      fundReviews: [{
        operationIndex: 0,
        approved: false,
        publishStatus: 'rejected',
        reason: 'Not suitable.',
      }],
    }), value),
    /must approve at least one operation/
  );
});

test('two-pass model flow uses proposal then independent review', async () => {
  const responses = [
    { content: [{ type: 'tool_use', name: 'propose_editorial_update', input: proposal() }] },
    { content: [{ type: 'tool_use', name: 'review_editorial_update', input: review() }] },
  ];
  const calls = [];
  const client = {
    messages: {
      create: async request => {
        calls.push(request);
        return responses.shift();
      },
    },
  };
  const result = await evolveEditorialSection({
    client,
    sectionPackage: seed(),
    conversationHistory: conversation(),
    sessionId: 'session-3',
    updateId: 'update-3',
    now: new Date('2026-09-20T16:32:00Z'),
  });
  assert.equal(calls.length, 2);
  assert.equal(calls[0].tool_choice.name, 'propose_editorial_update');
  assert.equal(calls[1].tool_choice.name, 'review_editorial_update');
  assert.equal(result.changed, true);
  assert.equal(result.nextPackage.fundEntries.some(entry => entry.id === 'reach-as-scale'), true);
});
