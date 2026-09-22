'use strict';

const fs = require('fs');
const path = require('path');
const { validateRuntimePackage } = require('../../api/lib/editorial-package');

const PROPOSAL_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function proposalDir(rootDir = process.cwd()) {
  return path.join(rootDir, 'editorial', 'proposals');
}

function proposalPath(rootDir, proposalId) {
  if (!PROPOSAL_ID.test(proposalId)) throw new Error('Invalid editorial proposal ID');
  return path.join(proposalDir(rootDir), `${proposalId}.json`);
}

function validateProposalBundle(bundle, label = 'editorial proposal') {
  if (!bundle || typeof bundle !== 'object' || Array.isArray(bundle)) {
    throw new Error(`${label} must be an object`);
  }
  if (bundle.schemaVersion !== 1) throw new Error(`${label}.schemaVersion must be 1`);
  if (!PROPOSAL_ID.test(bundle.proposalId || '')) throw new Error(`${label}.proposalId is invalid`);
  if (!bundle.workId || !bundle.sectionId || !Number.isInteger(bundle.sectionOrder)) {
    throw new Error(`${label} section identity is invalid`);
  }
  if (!bundle.baseVersionId || !bundle.createdAt || !bundle.sourceSession) {
    throw new Error(`${label} is missing its base version, time, or source session`);
  }
  if (typeof bundle.changed !== 'boolean') throw new Error(`${label}.changed must be boolean`);
  if (bundle.changed) {
    if (!bundle.proposal || !bundle.review || !bundle.draftPackage) {
      throw new Error(`${label} changed bundle must include proposal, review, and draftPackage`);
    }
    const draft = validateRuntimePackage(bundle.draftPackage, `${label}.draftPackage`);
    if (
      draft.workId !== bundle.workId ||
      draft.sectionId !== bundle.sectionId ||
      draft.sectionOrder !== bundle.sectionOrder ||
      draft.parentVersionId !== bundle.baseVersionId
    ) {
      throw new Error(`${label}.draftPackage does not match its declared base section`);
    }
    return { ...bundle, draftPackage: draft };
  }
  if (bundle.draftPackage !== null) throw new Error(`${label} no-change bundle cannot include a draftPackage`);
  return bundle;
}

function writeProposalBundle({ rootDir = process.cwd(), bundle }) {
  const normalized = validateProposalBundle(bundle);
  const dir = proposalDir(rootDir);
  fs.mkdirSync(dir, { recursive: true });
  const filePath = proposalPath(rootDir, normalized.proposalId);
  fs.writeFileSync(filePath, `${JSON.stringify(normalized, null, 2)}\n`, { flag: 'wx' });
  return filePath;
}

function loadProposalBundle({ rootDir = process.cwd(), proposalId }) {
  const filePath = proposalPath(rootDir, proposalId);
  let value;
  try {
    value = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw new Error(`Could not load editorial proposal ${proposalId}: ${error.message}`);
  }
  return validateProposalBundle(value, `editorial proposal ${proposalId}`);
}

function proposalSummary(bundle) {
  return {
    proposalId: bundle.proposalId,
    createdAt: bundle.createdAt,
    workId: bundle.workId,
    sectionId: bundle.sectionId,
    sectionOrder: bundle.sectionOrder,
    baseVersionId: bundle.baseVersionId,
    changed: bundle.changed,
    changeSummary: bundle.proposal?.changeSummary || bundle.noChangeReason || 'No editorial change proposed.',
    reviewSummary: bundle.review?.summary || null,
    proposal: bundle.proposal,
    review: bundle.review,
    draftPackage: bundle.draftPackage,
    sourceSession: bundle.sourceSession,
  };
}

function listProposalBundles({
  rootDir = process.cwd(),
  workId = null,
  sectionId = null,
  baseVersionId = null,
} = {}) {
  const dir = proposalDir(rootDir);
  let names;
  try {
    names = fs.readdirSync(dir).filter(name => name.endsWith('.json'));
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
  return names
    .map(name => loadProposalBundle({ rootDir, proposalId: path.basename(name, '.json') }))
    .filter(Boolean)
    .filter(bundle => !workId || bundle.workId === workId)
    .filter(bundle => !sectionId || bundle.sectionId === sectionId)
    .filter(bundle => !baseVersionId || bundle.baseVersionId === baseVersionId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map(proposalSummary);
}

module.exports = {
  listProposalBundles,
  loadProposalBundle,
  proposalDir,
  validateProposalBundle,
  writeProposalBundle,
};
