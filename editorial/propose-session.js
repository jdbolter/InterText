#!/usr/bin/env node
'use strict';

const Anthropic = require('@anthropic-ai/sdk');
const crypto = require('crypto');
const path = require('path');
const { evolveEditorialSection } = require('../api/lib/editorial-evolution');
const { validateRuntimePackage } = require('../api/lib/editorial-package');
const { loadCurrentSection } = require('../api/lib/editorial-store');
const { loadSessionFile } = require('../synthetic-reader/lib/sessionFile');
const { parseProposalArgs, HELP } = require('./lib/proposal-args');
const { writeProposalBundle } = require('./lib/proposal-store');

function relativePortable(rootDir, filePath) {
  const relative = path.relative(rootDir, filePath);
  return relative.startsWith('..') ? filePath : relative.split(path.sep).join('/');
}

async function createSessionProposal({ rootDir = process.cwd(), options, client = new Anthropic() }) {
  const { sessionPath, data } = loadSessionFile(options.session);
  const sectionNumber = options.section || data.meta.startSectionIndex + 1;
  const conversationHistory = data.contributionsBySection[sectionNumber];
  if (!conversationHistory || conversationHistory.length === 0) {
    throw new Error(`Section ${sectionNumber} has no recorded reader contributions in ${sessionPath}.`);
  }

  const current = await loadCurrentSection({
    rootDir,
    textId: data.meta.textId,
    sectionIndex: sectionNumber - 1,
  });
  if (!current) throw new Error(`${data.meta.textId} section ${sectionNumber} is not packaged.`);

  const createdAt = new Date().toISOString();
  const sessionId = `synthetic-${path.basename(path.dirname(sessionPath))}`;
  const result = await evolveEditorialSection({
    client,
    sectionPackage: current.sectionPackage,
    conversationHistory,
    sessionId,
    model: options.model,
    now: new Date(createdAt),
  });
  const stamp = createdAt.replace(/[-:.TZ]/g, '').slice(0, 14);
  const proposalId = `${current.sectionPackage.sectionId}-${stamp}-${crypto.randomUUID().slice(0, 8)}`;
  const artifactPath = `editorial/proposals/${proposalId}.json`;
  let draftPackage = result.nextPackage;
  if (draftPackage) {
    const currentIds = new Set(current.sectionPackage.fundEntries.map(entry => entry.id));
    draftPackage = validateRuntimePackage({
      ...draftPackage,
      fundEntries: draftPackage.fundEntries.map(entry => currentIds.has(entry.id) ? entry : {
        ...entry,
        provenance: { ...entry.provenance, artifactPath },
      }),
    }, 'local editorial proposal draft');
  }
  const bundle = {
    schemaVersion: 1,
    proposalId,
    createdAt,
    model: options.model,
    workId: current.sectionPackage.workId,
    sectionId: current.sectionPackage.sectionId,
    sectionOrder: current.sectionPackage.sectionOrder,
    baseVersionId: current.sectionPackage.versionId,
    baseSource: current.source,
    changed: result.changed,
    noChangeReason: result.changed ? null : result.proposal?.changeSummary || result.proposal?.decision || 'no-change',
    sourceSession: {
      path: relativePortable(rootDir, sessionPath),
      profileId: data.meta.profileId,
      startedAt: data.meta.startedAt,
      stopReason: data.stopReason,
    },
    proposal: result.proposal,
    review: result.review,
    draftPackage,
  };
  const filePath = writeProposalBundle({ rootDir, bundle });
  return { bundle, filePath };
}

async function main(argv) {
  const options = parseProposalArgs(argv);
  if (options.help) {
    process.stdout.write(HELP);
    return;
  }
  process.stdout.write(`Generating nonpublishing editorial proposal from ${options.session}\n`);
  const { bundle, filePath } = await createSessionProposal({ options });
  process.stdout.write(
    bundle.changed
      ? `Done. Reviewed changes are available for author review; nothing was written to KV.\nSaved to: ${filePath}\n`
      : `Done. The editorial passes proposed no durable change; nothing was written to KV.\nSaved to: ${filePath}\n`
  );
}

if (require.main === module) {
  main(process.argv.slice(2)).catch(error => {
    process.stderr.write(`\neditorial-propose failed: ${error.message}\n`);
    process.exitCode = 1;
  });
}

module.exports = { createSessionProposal };
