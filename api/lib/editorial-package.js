'use strict';

const fs = require('fs');
const path = require('path');

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const FUND_KINDS = new Set([
  'clarification', 'example', 'qualification', 'counterargument', 'evidence', 'extension',
]);
const FUND_STATUSES = new Set(['candidate', 'accepted', 'superseded', 'rejected']);
const SOURCE_STATUSES = new Set(['not-required', 'needs-verification', 'verified']);

function readJson(filePath, label) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    throw new Error(`Could not load ${label} at ${filePath}: ${error.message}`);
  }
}

function assertNonEmptyString(value, label) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${label} must be a non-empty string`);
}

function assertSlug(value, label) {
  assertNonEmptyString(value, label);
  if (!SLUG.test(value)) throw new Error(`${label} must be a lower-case hyphenated ID`);
}

function assertUnique(values, label) {
  if (new Set(values).size !== values.length) throw new Error(`${label} must be unique`);
}

function validateSource(source, label) {
  if (!source || typeof source !== 'object' || Array.isArray(source)) throw new Error(`${label} must be an object`);
  assertNonEmptyString(source.title, `${label}.title`);
  if (typeof source.url !== 'string' || !/^https?:\/\//.test(source.url)) {
    throw new Error(`${label}.url must be HTTP(S)`);
  }
}

function normalizeThread(thread) {
  return thread === undefined ? null : thread;
}

function validateThread(thread, label) {
  if (thread === undefined || thread === null) return;
  if (!thread || typeof thread !== 'object' || Array.isArray(thread)) {
    throw new Error(`${label} must be null or an object`);
  }
  const keys = Object.keys(thread).sort();
  if (keys.length !== 2 || keys[0] !== 'id' || keys[1] !== 'order') {
    throw new Error(`${label} must contain only id and order`);
  }
  assertSlug(thread.id, `${label}.id`);
  if (!Number.isInteger(thread.order) || thread.order < 1) {
    throw new Error(`${label}.order must be a positive integer`);
  }
}

function validateFundEntry(entry, passageIds, label) {
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) throw new Error(`${label} must be an object`);
  assertSlug(entry.id, `${label}.id`);
  assertNonEmptyString(entry.title, `${label}.title`);
  assertNonEmptyString(entry.markdown, `${label}.markdown`);
  assertNonEmptyString(entry.useWhen, `${label}.useWhen`);
  validateThread(entry.thread, `${label}.thread`);
  if (!Array.isArray(entry.anchors) || entry.anchors.length === 0) throw new Error(`${label}.anchors must not be empty`);
  assertUnique(entry.anchors, `${label}.anchors`);
  for (const anchor of entry.anchors) {
    if (!passageIds.has(anchor)) throw new Error(`${label} refers to unknown anchor ${anchor}`);
  }
  if (!FUND_KINDS.has(entry.kind)) throw new Error(`${label}.kind is invalid`);
  if (!FUND_STATUSES.has(entry.status)) throw new Error(`${label}.status is invalid`);
  if (!SOURCE_STATUSES.has(entry.sourceStatus)) throw new Error(`${label}.sourceStatus is invalid`);
  if (!Array.isArray(entry.sources)) throw new Error(`${label}.sources must be an array`);
  entry.sources.forEach((source, index) => validateSource(source, `${label}.sources[${index}]`));
  if (entry.sourceStatus === 'verified' && entry.sources.length === 0) {
    throw new Error(`${label} is verified but has no sources`);
  }
  if (!entry.provenance || typeof entry.provenance !== 'object') throw new Error(`${label}.provenance is required`);
  assertNonEmptyString(entry.provenance.type, `${label}.provenance.type`);
  if (!Array.isArray(entry.provenance.turns)) throw new Error(`${label}.provenance.turns must be an array`);
}

function validateRuntimePackage(sectionPackage, label = 'editorial section package') {
  if (!sectionPackage || typeof sectionPackage !== 'object' || Array.isArray(sectionPackage)) {
    throw new Error(`${label} must be an object`);
  }
  if (sectionPackage.schemaVersion !== 1) throw new Error(`${label}.schemaVersion must be 1`);
  assertSlug(sectionPackage.workId, `${label}.workId`);
  assertSlug(sectionPackage.sectionId, `${label}.sectionId`);
  assertNonEmptyString(sectionPackage.title, `${label}.title`);
  assertNonEmptyString(sectionPackage.editionId, `${label}.editionId`);
  assertNonEmptyString(sectionPackage.versionId, `${label}.versionId`);
  assertNonEmptyString(sectionPackage.changeSummary, `${label}.changeSummary`);
  if (!Number.isInteger(sectionPackage.sectionOrder) || sectionPackage.sectionOrder < 1) {
    throw new Error(`${label}.sectionOrder must be a positive integer`);
  }
  if (!Array.isArray(sectionPackage.spine) || sectionPackage.spine.length === 0) {
    throw new Error(`${label}.spine must not be empty`);
  }
  const passageIds = new Set();
  for (const [index, passage] of sectionPackage.spine.entries()) {
    assertSlug(passage && passage.id, `${label}.spine[${index}].id`);
    assertNonEmptyString(passage.markdown, `${label}.spine[${index}].markdown`);
    if (passageIds.has(passage.id)) throw new Error(`${label} passage IDs must be unique`);
    passageIds.add(passage.id);
  }
  if (!Array.isArray(sectionPackage.fundEntries)) throw new Error(`${label}.fundEntries must be an array`);
  assertUnique(sectionPackage.fundEntries.map(entry => entry.id), `${label} fund entry IDs`);
  sectionPackage.fundEntries.forEach((entry, index) => {
    validateFundEntry(entry, passageIds, `${label}.fundEntries[${index}]`);
  });
  return {
    ...sectionPackage,
    fundEntries: sectionPackage.fundEntries.map(entry => ({
      ...entry,
      thread: normalizeThread(entry.thread),
    })),
  };
}

function loadEditorialIndex({ rootDir = process.cwd() } = {}) {
  const seedRoot = path.join(rootDir, 'api', 'editorial-seed');
  return readJson(path.join(seedRoot, 'index.json'), 'editorial runtime index. Run `npm run editorial-build` first');
}

function findPackagedSection({ rootDir = process.cwd(), textId, sectionIndex }) {
  const index = loadEditorialIndex({ rootDir });
  const work = (index.works || []).find(candidate => candidate.id === textId);
  if (!work) return null;
  const section = (work.sections || []).find(candidate => candidate.order === sectionIndex + 1);
  if (!section || section.readiness !== 'packaged' || !section.packageUrl) return null;
  return { work, section };
}

function loadSeedSection({ rootDir = process.cwd(), textId, sectionIndex }) {
  const found = findPackagedSection({ rootDir, textId, sectionIndex });
  if (!found) return null;
  const packagePath = path.join(rootDir, 'api', 'editorial-seed', found.section.packageUrl.replace(/^data\//, ''));
  const sectionPackage = readJson(packagePath, `${textId} section ${sectionIndex + 1} editorial seed`);
  if (sectionPackage.workId !== textId || sectionPackage.sectionOrder !== sectionIndex + 1) {
    throw new Error(`${packagePath} does not match requested work and section`);
  }
  return validateRuntimePackage(sectionPackage, `${textId}/${sectionPackage.sectionId} runtime seed`);
}

function formatSpine(sectionPackage) {
  return sectionPackage.spine
    .map(passage => `<!-- intertext:passage ${passage.id} -->\n\n${passage.markdown}`)
    .join('\n\n');
}

function formatFundEntry(entry) {
  const sourceNote = entry.sourceStatus === 'needs-verification'
    ? 'This entry contains factual detail that still needs source verification; omit it if that uncertainty matters to the response, and never embellish it.'
    : entry.sourceStatus === 'verified'
      ? 'This entry has attached source verification.'
      : 'This entry is principally interpretive and does not require an external source merely to be considered.';
  const links = entry.sources.length > 0
    ? `\nSources: ${entry.sources.map(source => `${source.title}: ${source.url}`).join(' | ')}`
    : '';
  const thread = entry.thread
    ? `\nThread: ${entry.thread.id} (position ${entry.thread.order})`
    : '';

  return `<fund_entry id="${entry.id}" anchors="${entry.anchors.join(',')}" kind="${entry.kind}">
Title: ${entry.title}
Use when: ${entry.useWhen}
Source note: ${sourceNote}${thread}${links}

${entry.markdown}
</fund_entry>`;
}

module.exports = {
  FUND_KINDS,
  SOURCE_STATUSES,
  findPackagedSection,
  formatFundEntry,
  formatSpine,
  loadEditorialIndex,
  loadSeedSection,
  validateRuntimePackage,
};
