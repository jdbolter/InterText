'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const { Readable } = require('stream');

const { createAuthorRevision } = require('../../api/lib/editorial-author');
const { loadSeedSection, validateRuntimePackage } = require('../../api/lib/editorial-package');
const { createEditorialHandler } = require('../serve');

const ROOT = path.join(__dirname, '..', '..');

function seed() {
  return loadSeedSection({ rootDir: ROOT, textId: 'plenitude', sectionIndex: 4 });
}

function draft(current) {
  return {
    spine: current.spine.map(passage => ({ ...passage })),
    fundEntries: current.fundEntries.map(entry => JSON.parse(JSON.stringify(entry))),
  };
}

async function requestJson(handler, { method = 'GET', pathname = '/', body = null, headers = {} } = {}) {
  const request = Readable.from(body ? [JSON.stringify(body)] : []);
  request.method = method;
  request.url = pathname;
  request.headers = {
    host: '127.0.0.1:4173',
    ...(body ? { 'content-type': 'application/json' } : {}),
    ...headers,
  };
  const response = {
    status: null,
    text: '',
    writeHead(status) { this.status = status; },
    end(text = '') { this.text += text; },
  };
  await handler(request, response);
  return {
    status: response.status,
    body: response.text ? JSON.parse(response.text) : null,
  };
}

test('author revision edits spine and fund while preserving stable identities and provenance', () => {
  const current = seed();
  const value = draft(current);
  value.spine[0].markdown += '\n\nA more precise authorial qualification.';
  value.fundEntries[0].status = 'accepted';
  value.fundEntries[0].thread = { id: 'public-authority', order: 1 };
  value.fundEntries[0].provenance = {
    type: 'model-editor', sessionId: 'forged', turns: [999], artifactPath: null,
  };

  const result = createAuthorRevision({
    sectionPackage: current,
    ...value,
    changeSummary: 'Author revises the opening and approves a threaded clarification.',
    updateId: 'author-test-1',
    now: new Date('2026-09-21T10:00:00Z'),
  });

  assert.equal(result.nextPackage.source.type, 'author-revised');
  assert.equal(result.nextPackage.parentVersionId, current.versionId);
  assert.equal(result.nextPackage.spine[0].id, current.spine[0].id);
  assert.equal(result.nextPackage.fundEntries[0].status, 'accepted');
  assert.deepEqual(result.nextPackage.fundEntries[0].thread, { id: 'public-authority', order: 1 });
  assert.deepEqual(result.nextPackage.fundEntries[0].provenance, current.fundEntries[0].provenance);
  assert.deepEqual(result.updateRecord.changedPassageIds, ['shocking-art-p01']);
  assert.deepEqual(result.updateRecord.statusChanges, [{
    entryId: 'shared-evaluative-field', from: 'candidate', to: 'accepted',
  }]);
  assert.equal(result.updateRecord.decisionAuthority, 'author');
});

test('author revision can add a fund entry with author provenance and thread membership', () => {
  const current = seed();
  const value = draft(current);
  value.fundEntries.push({
    id: 'media-domestication',
    title: 'Media domestication',
    anchors: ['shocking-art-p07'],
    kind: 'qualification',
    status: 'candidate',
    markdown: 'A framing institution can convert formal provocation into familiar entertainment.',
    useWhen: 'Use when a reader asks how media framing changes the reception of shock.',
    thread: { id: 'public-authority', order: 2 },
    sourceStatus: 'not-required',
    sources: [],
    provenance: null,
  });

  const result = createAuthorRevision({
    sectionPackage: current,
    ...value,
    changeSummary: 'Author adds a possible continuation of the public-authority thread.',
    updateId: 'author-test-2',
    now: new Date('2026-09-21T10:01:00Z'),
  });
  const added = result.nextPackage.fundEntries.find(entry => entry.id === 'media-domestication');
  assert.deepEqual(added.provenance, {
    type: 'author-editor', sessionId: 'author-test-2', turns: [], artifactPath: null,
  });
  assert.deepEqual(result.updateRecord.addedFundEntryIds, ['media-domestication']);
});

test('author revision can change section title without changing stable section identity', () => {
  const current = {
    ...loadSeedSection({ rootDir: ROOT, textId: 'plenitude', sectionIndex: 1 }),
    title: 'The Philadelphia (Symphony) Story',
  };
  const value = draft(current);
  const result = createAuthorRevision({
    sectionPackage: current,
    title: 'The Philadelphia (Orchestra) Story',
    ...value,
    changeSummary: 'Correct the Section 2 display title.',
    updateId: 'author-title-test',
    now: new Date('2026-09-23T13:00:00Z'),
  });
  assert.equal(result.nextPackage.title, 'The Philadelphia (Orchestra) Story');
  assert.equal(result.nextPackage.sectionId, current.sectionId);
  assert.deepEqual(result.updateRecord.titleChange, {
    from: current.title,
    to: 'The Philadelphia (Orchestra) Story',
  });
});

test('author revision cannot remove an existing fund entry or alter passage structure', () => {
  const current = seed();
  const value = draft(current);
  value.fundEntries.pop();
  assert.throws(() => createAuthorRevision({
    sectionPackage: current,
    ...value,
    changeSummary: 'Delete an entry.',
  }), /cannot delete existing fund entry/);

  const second = draft(current);
  second.spine[0].id = 'changed-id';
  assert.throws(() => createAuthorRevision({
    sectionPackage: current,
    ...second,
    changeSummary: 'Change a passage ID.',
  }), /preserve stable passage IDs/);
});

test('author revision rejects invalid threads, verified entries without sources, and no-op saves', () => {
  const current = seed();
  const invalidThread = draft(current);
  invalidThread.fundEntries[0].thread = { id: 'Bad Thread', order: 0 };
  assert.throws(() => createAuthorRevision({
    sectionPackage: current,
    ...invalidThread,
    changeSummary: 'Invalid thread.',
  }), /thread/);

  const unsourced = draft(current);
  unsourced.fundEntries[0].sourceStatus = 'verified';
  assert.throws(() => createAuthorRevision({
    sectionPackage: current,
    ...unsourced,
    changeSummary: 'Invalid verification.',
  }), /verified but has no sources/);

  const unchanged = draft(current);
  assert.throws(() => createAuthorRevision({
    sectionPackage: current,
    ...unchanged,
    changeSummary: 'No actual changes.',
  }), /contains no changes/);
});

test('runtime validation normalizes legacy fund entries without thread to null', () => {
  const current = seed();
  const legacy = JSON.parse(JSON.stringify(current));
  legacy.fundEntries.forEach(entry => { delete entry.thread; });
  const normalized = validateRuntimePackage(legacy);
  assert.ok(normalized.fundEntries.every(entry => entry.thread === null));
});

test('local author endpoint validates and publishes an immutable child', async () => {
  const current = seed();
  const value = draft(current);
  value.spine[1].markdown += '\n\nAuthor revision through the local editor.';
  let published = null;
  const handler = createEditorialHandler({
    initializeSection: async () => ({ sectionPackage: current, source: 'kv', redis: { fake: true } }),
    publishVersion: async args => {
      published = args;
      return { published: true, versionId: args.nextPackage.versionId };
    },
  });
  const response = await requestJson(handler, {
      method: 'POST',
      pathname: '/api/author-section',
      body: {
        textId: 'plenitude',
        sectionIndex: 4,
        baseVersionId: current.versionId,
        changeSummary: 'Revise the second passage in the author editor.',
        ...value,
      },
  });
  assert.equal(response.status, 201);
  assert.equal(response.body.sectionPackage.source.type, 'author-revised');
  assert.equal(response.body.updateRecord.decisionAuthority, 'author');
  assert.equal(published.currentPackage.versionId, current.versionId);
  assert.equal(published.redis.fake, true);
});

test('local author endpoint refuses a stale base version before publishing', async () => {
  const current = seed();
  let publishCalled = false;
  const handler = createEditorialHandler({
    initializeSection: async () => ({ sectionPackage: current, source: 'kv', redis: {} }),
    publishVersion: async () => {
      publishCalled = true;
      return { published: true };
    },
  });
  const value = draft(current);
  value.spine[0].markdown += ' Changed.';
  const response = await requestJson(handler, {
      method: 'POST',
      pathname: '/api/author-section',
      body: {
        textId: 'plenitude',
        sectionIndex: 4,
        baseVersionId: 'stale-version',
        changeSummary: 'A stale edit.',
        ...value,
      },
  });
  assert.equal(response.status, 409);
  assert.equal(response.body.actualVersionId, current.versionId);
  assert.equal(publishCalled, false);
});
