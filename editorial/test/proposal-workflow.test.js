'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

const { createAuthorRevision } = require('../../api/lib/editorial-author');
const { loadSeedSection, validateRuntimePackage } = require('../../api/lib/editorial-package');
const { parseProposalArgs } = require('../lib/proposal-args');
const {
  listProposalBundles,
  loadProposalBundle,
  writeProposalBundle,
} = require('../lib/proposal-store');

const ROOT = path.join(__dirname, '..', '..');

function sectionOne() {
  return loadSeedSection({ rootDir: ROOT, textId: 'plenitude', sectionIndex: 0 });
}

function proposalBundle() {
  const current = sectionOne();
  const proposalId = 'great-divide-20260922170000-abc12345';
  const draftPackage = validateRuntimePackage({
    ...current,
    editionId: 'reader-shaped',
    versionId: 'great-divide-draft-test',
    parentVersionId: current.versionId,
    createdAt: '2026-09-22T17:00:00.000Z',
    source: { type: 'reader-shaped', path: 'local://proposal' },
    spine: current.spine.map((passage, index) => index === 0
      ? { ...passage, markdown: `${passage.markdown}\n\nA proposed qualification.` }
      : passage),
    fundEntries: [{
      id: 'nonexclusive-consecration',
      title: 'Nonexclusive consecration',
      anchors: ['great-divide-p01'],
      kind: 'qualification',
      status: 'candidate',
      markdown: 'Elite sanction can remain powerful without retaining exclusive jurisdiction.',
      useWhen: 'Use when a reader asks whether art institutions have lost all authority.',
      thread: null,
      sourceStatus: 'not-required',
      sources: [],
      provenance: {
        type: 'model-editor',
        sessionId: 'synthetic-session-one',
        turns: [3, 4],
        artifactPath: `editorial/proposals/${proposalId}.json`,
      },
    }],
    changeSummary: 'Qualify the account of elite authority.',
  });
  return {
    schemaVersion: 1,
    proposalId,
    createdAt: '2026-09-22T17:00:00.000Z',
    model: 'test-model',
    workId: current.workId,
    sectionId: current.sectionId,
    sectionOrder: current.sectionOrder,
    baseVersionId: current.versionId,
    baseSource: 'seed',
    changed: true,
    noChangeReason: null,
    sourceSession: { path: 'synthetic-reader/output/session.json', profileId: 'collaborative' },
    proposal: {
      decision: 'change', changeSummary: 'Qualify the account of elite authority.',
      spineUpdates: [], fundOperations: [],
    },
    review: { decision: 'approve', summary: 'The qualification is proportionate.', spineReviews: [], fundReviews: [] },
    draftPackage,
  };
}

test('proposal CLI arguments require a session and accept an explicit section', () => {
  assert.deepEqual(parseProposalArgs(['--session', 'run', '--section', '1', '--model', 'model']), {
    help: false, session: 'run', section: 1, model: 'model',
  });
  assert.throws(() => parseProposalArgs([]), /--session is required/);
  assert.throws(() => parseProposalArgs(['--session', 'run', '--section', '0']), /positive integer/);
});

test('proposal store writes, filters, and reloads unpublished bundles', () => {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'intertext-proposal-'));
  const bundle = proposalBundle();
  const filePath = writeProposalBundle({ rootDir, bundle });
  assert.equal(fs.existsSync(filePath), true);
  assert.equal(loadProposalBundle({ rootDir, proposalId: bundle.proposalId }).baseVersionId, bundle.baseVersionId);
  assert.equal(listProposalBundles({
    rootDir,
    workId: 'plenitude',
    sectionId: 'great-divide',
    baseVersionId: bundle.baseVersionId,
  }).length, 1);
  assert.equal(listProposalBundles({ rootDir, baseVersionId: 'stale' }).length, 0);
});

test('publishing a reviewed draft preserves model provenance and records proposal identity', () => {
  const current = sectionOne();
  const bundle = proposalBundle();
  const proposed = bundle.draftPackage.fundEntries[0];
  const result = createAuthorRevision({
    sectionPackage: current,
    spine: bundle.draftPackage.spine,
    fundEntries: bundle.draftPackage.fundEntries,
    changeSummary: bundle.proposal.changeSummary,
    proposedEntryProvenance: { [proposed.id]: proposed.provenance },
    proposalId: bundle.proposalId,
    updateId: 'author-proposal-test',
    now: new Date('2026-09-22T17:05:00.000Z'),
  });
  assert.deepEqual(result.nextPackage.fundEntries[0].provenance, proposed.provenance);
  assert.equal(result.updateRecord.proposalId, bundle.proposalId);
  assert.equal(result.updateRecord.decisionAuthority, 'author');
});
