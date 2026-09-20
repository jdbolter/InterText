'use strict';

const { loadSeedSection, validateRuntimePackage } = require('./editorial-package');

const READER_SHAPED_EDITION = 'reader-shaped';

function getRedis() {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) return null;
  const { Redis } = require('@upstash/redis');
  return new Redis({ url: process.env.KV_REST_API_URL, token: process.env.KV_REST_API_TOKEN });
}

function sectionHeadKey(workId, sectionId) {
  return `section-head:${workId}:${READER_SHAPED_EDITION}:${sectionId}`;
}

function sectionVersionKey(workId, sectionId, versionId) {
  return `section-version:${workId}:${READER_SHAPED_EDITION}:${sectionId}:${versionId}`;
}

function editorialUpdateKey(workId, sectionId, updateId) {
  return `editorial-update:${workId}:${sectionId}:${updateId}`;
}

function decodeStored(value) {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function assertPackageIdentity(sectionPackage, seed, label) {
  validateRuntimePackage(sectionPackage, label);
  if (
    sectionPackage.workId !== seed.workId ||
    sectionPackage.sectionId !== seed.sectionId ||
    sectionPackage.sectionOrder !== seed.sectionOrder
  ) {
    throw new Error(`${label} does not match ${seed.workId}/${seed.sectionId}`);
  }
  return sectionPackage;
}

function readerShapedSeed(seed) {
  return {
    ...seed,
    editionId: READER_SHAPED_EDITION,
  };
}

async function loadCurrentSection({
  rootDir = process.cwd(),
  textId,
  sectionIndex,
  versionId = null,
  redis = getRedis(),
}) {
  const seed = loadSeedSection({ rootDir, textId, sectionIndex });
  if (!seed) return null;
  if (!redis) return { sectionPackage: seed, source: 'seed', redis: null };

  const headKey = sectionHeadKey(seed.workId, seed.sectionId);
  const requestedVersionId = versionId || await redis.get(headKey);
  if (!requestedVersionId) return { sectionPackage: seed, source: 'seed', redis };
  if (requestedVersionId === seed.versionId) {
    const storedSeed = decodeStored(await redis.get(sectionVersionKey(seed.workId, seed.sectionId, seed.versionId)));
    const sectionPackage = storedSeed || readerShapedSeed(seed);
    return {
      sectionPackage: assertPackageIdentity(sectionPackage, seed, 'stored editorial seed'),
      source: storedSeed ? 'kv' : 'seed',
      redis,
    };
  }

  const stored = decodeStored(await redis.get(
    sectionVersionKey(seed.workId, seed.sectionId, requestedVersionId)
  ));
  if (!stored) throw new Error(`Editorial version ${requestedVersionId} is missing`);
  if (stored.versionId !== requestedVersionId) throw new Error(`Editorial version ${requestedVersionId} has mismatched identity`);
  return {
    sectionPackage: assertPackageIdentity(stored, seed, `editorial version ${requestedVersionId}`),
    source: 'kv',
    redis,
  };
}

const INITIALIZE_SCRIPT = `
local current = redis.call('GET', KEYS[1])
if current then return current end
if redis.call('EXISTS', KEYS[2]) == 0 then
  redis.call('SET', KEYS[2], ARGV[1])
end
redis.call('SET', KEYS[1], ARGV[2])
return ARGV[2]
`;

async function ensureSectionInitialized({
  rootDir = process.cwd(),
  textId,
  sectionIndex,
  redis = getRedis(),
}) {
  const seed = loadSeedSection({ rootDir, textId, sectionIndex });
  if (!seed) return null;
  if (!redis) throw new Error('Versioned editorial publishing requires KV_REST_API_URL and KV_REST_API_TOKEN');
  const baseline = readerShapedSeed(seed);
  await redis.eval(
    INITIALIZE_SCRIPT,
    [
      sectionHeadKey(seed.workId, seed.sectionId),
      sectionVersionKey(seed.workId, seed.sectionId, seed.versionId),
    ],
    [JSON.stringify(baseline), seed.versionId]
  );
  return loadCurrentSection({ rootDir, textId, sectionIndex, redis });
}

const PUBLISH_SCRIPT = `
local current = redis.call('GET', KEYS[1])
if not current or current ~= ARGV[1] then
  return {0, current or ''}
end
if redis.call('EXISTS', KEYS[2]) == 1 then
  return {-1, current}
end
redis.call('SET', KEYS[2], ARGV[2])
redis.call('SET', KEYS[3], ARGV[3])
redis.call('SET', KEYS[1], ARGV[4])
return {1, ARGV[4]}
`;

async function publishSectionVersion({
  currentPackage,
  nextPackage,
  updateRecord,
  updateId,
  redis = getRedis(),
}) {
  if (!redis) throw new Error('Versioned editorial publishing requires KV_REST_API_URL and KV_REST_API_TOKEN');
  validateRuntimePackage(nextPackage, 'new editorial version');
  if (nextPackage.parentVersionId !== currentPackage.versionId) {
    throw new Error('New editorial version must name the current version as its parent');
  }
  if (
    nextPackage.workId !== currentPackage.workId ||
    nextPackage.sectionId !== currentPackage.sectionId ||
    nextPackage.sectionOrder !== currentPackage.sectionOrder
  ) {
    throw new Error('New editorial version changed section identity');
  }

  const result = await redis.eval(
    PUBLISH_SCRIPT,
    [
      sectionHeadKey(currentPackage.workId, currentPackage.sectionId),
      sectionVersionKey(currentPackage.workId, currentPackage.sectionId, nextPackage.versionId),
      editorialUpdateKey(currentPackage.workId, currentPackage.sectionId, updateId),
    ],
    [
      currentPackage.versionId,
      JSON.stringify(nextPackage),
      JSON.stringify(updateRecord),
      nextPackage.versionId,
    ]
  );

  const code = Number(Array.isArray(result) ? result[0] : result);
  const actualHead = Array.isArray(result) ? result[1] || null : null;
  if (code === 1) return { published: true, versionId: nextPackage.versionId };
  if (code === 0) return { published: false, conflict: true, actualHead };
  throw new Error(`Editorial version ${nextPackage.versionId} already exists`);
}

module.exports = {
  INITIALIZE_SCRIPT,
  PUBLISH_SCRIPT,
  READER_SHAPED_EDITION,
  editorialUpdateKey,
  ensureSectionInitialized,
  getRedis,
  loadCurrentSection,
  publishSectionVersion,
  sectionHeadKey,
  sectionVersionKey,
};
