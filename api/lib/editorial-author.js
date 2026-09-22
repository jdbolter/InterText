'use strict';

const crypto = require('crypto');
const { isDeepStrictEqual } = require('util');
const { validateRuntimePackage } = require('./editorial-package');

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function trimmed(value) {
  return typeof value === 'string' ? value.trim() : value;
}

function normalizeThread(thread) {
  if (thread === undefined || thread === null || thread.id === '') return null;
  return { id: trimmed(thread.id), order: Number(thread.order) };
}

function normalizeSource(source) {
  return { title: trimmed(source && source.title), url: trimmed(source && source.url) };
}

function normalizeEntry(entry, provenance) {
  return {
    id: trimmed(entry && entry.id),
    title: trimmed(entry && entry.title),
    anchors: Array.isArray(entry && entry.anchors) ? [...entry.anchors] : entry && entry.anchors,
    kind: entry && entry.kind,
    status: entry && entry.status,
    markdown: trimmed(entry && entry.markdown),
    useWhen: trimmed(entry && entry.useWhen),
    thread: normalizeThread(entry && entry.thread),
    sourceStatus: entry && entry.sourceStatus,
    sources: Array.isArray(entry && entry.sources) ? entry.sources.map(normalizeSource) : entry && entry.sources,
    provenance,
  };
}

function same(valueA, valueB) {
  return isDeepStrictEqual(valueA, valueB);
}

function createAuthorRevision({
  sectionPackage,
  spine,
  fundEntries,
  changeSummary,
  proposedEntryProvenance = {},
  proposalId = null,
  updateId = `author-${crypto.randomUUID()}`,
  now = new Date(),
}) {
  const current = validateRuntimePackage(sectionPackage, 'current author section');
  if (!Array.isArray(spine) || spine.length !== current.spine.length) {
    throw new Error('Author revision must preserve the current passage structure');
  }
  const currentPassageIds = current.spine.map(passage => passage.id);
  const revisedPassageIds = spine.map(passage => passage && passage.id);
  if (!same(revisedPassageIds, currentPassageIds)) {
    throw new Error('Author revision must preserve stable passage IDs and order');
  }
  const revisedSpine = spine.map((passage, index) => ({
    id: currentPassageIds[index],
    markdown: trimmed(passage && passage.markdown),
  }));

  if (!Array.isArray(fundEntries)) throw new Error('Author revision fundEntries must be an array');
  const currentEntries = new Map(current.fundEntries.map(entry => [entry.id, entry]));
  const submittedIds = fundEntries.map(entry => entry && trimmed(entry.id));
  if (new Set(submittedIds).size !== submittedIds.length) {
    throw new Error('Author revision fund entry IDs must be unique');
  }
  for (const entryId of currentEntries.keys()) {
    if (!submittedIds.includes(entryId)) {
      throw new Error(`Author revision cannot delete existing fund entry ${entryId}; reject or supersede it instead`);
    }
  }

  const revisedEntries = fundEntries.map(entry => {
    const entryId = trimmed(entry && entry.id);
    const existing = currentEntries.get(entryId);
    const provenance = existing
      ? clone(existing.provenance)
      : proposedEntryProvenance[entryId]
        ? clone(proposedEntryProvenance[entryId])
        : { type: 'author-editor', sessionId: updateId, turns: [], artifactPath: null };
    return normalizeEntry(entry, provenance);
  });

  const summary = trimmed(changeSummary);
  if (!summary) throw new Error('A change summary is required');
  const changedPassageIds = revisedSpine
    .filter((passage, index) => passage.markdown !== current.spine[index].markdown)
    .map(passage => passage.id);
  const addedFundEntryIds = revisedEntries
    .filter(entry => !currentEntries.has(entry.id))
    .map(entry => entry.id);
  const changedFundEntryIds = revisedEntries
    .filter(entry => currentEntries.has(entry.id) && !same(entry, currentEntries.get(entry.id)))
    .map(entry => entry.id);
  const statusChanges = revisedEntries
    .filter(entry => currentEntries.has(entry.id) && entry.status !== currentEntries.get(entry.id).status)
    .map(entry => ({
      entryId: entry.id,
      from: currentEntries.get(entry.id).status,
      to: entry.status,
    }));

  if (changedPassageIds.length === 0 && addedFundEntryIds.length === 0 && changedFundEntryIds.length === 0) {
    throw new Error('The author revision contains no changes');
  }

  const createdAt = now.toISOString();
  const stamp = createdAt.replace(/[-:.TZ]/g, '').slice(0, 14);
  const versionId = `${current.sectionId}-author-${stamp}-${crypto.randomUUID().slice(0, 8)}`;
  const nextPackage = validateRuntimePackage({
    ...current,
    editionId: 'reader-shaped',
    versionId,
    parentVersionId: current.versionId,
    createdAt,
    source: {
      type: 'author-revised',
      path: `kv://editorial-update/${current.workId}/${current.sectionId}/${updateId}`,
    },
    spine: revisedSpine,
    fundEntries: revisedEntries,
    changeSummary: summary,
  }, 'author-revised editorial version');

  const updateRecord = {
    schemaVersion: 1,
    updateId,
    mode: 'author-revision',
    decisionAuthority: 'author',
    proposalId,
    workId: current.workId,
    sectionId: current.sectionId,
    parentVersionId: current.versionId,
    versionId,
    createdAt,
    changeSummary: summary,
    changedPassageIds,
    addedFundEntryIds,
    changedFundEntryIds,
    statusChanges,
  };

  return { nextPackage, updateRecord, updateId };
}

module.exports = { createAuthorRevision };
