'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { writeRun, writeEvolveRun } = require('../lib/transcript');

function tmpOutDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'synthetic-reader-test-'));
}

function sampleMeta(overrides = {}) {
  return {
    textId: 'plenitude',
    startSectionIndex: 0,
    profileId: 'curious',
    profileName: 'Curious nonspecialist',
    edition: 'evolving',
    readerModel: 'gpt-5.6-terra',
    baseUrl: 'http://localhost:3000',
    maxTurns: 5,
    startedAt: '2026-01-01T00:00:00.000Z',
    finishedAt: '2026-01-01T00:05:00.000Z',
    ...overrides,
  };
}

function sampleResult(overrides = {}) {
  return {
    finalSectionIndex: 0,
    stopReason: 'reader_finished',
    stopDetail: 'Felt satisfied.',
    turns: [
      {
        turn: 1,
        sectionNumber: 1,
        action: 'message',
        readerMessage: 'What is this about?',
        guideResponse: 'It is about cultural hierarchy.',
        privateReflection: { understanding: 'high', confusion: 'none', interest: 'high', note: 'Interesting opener.' },
      },
      {
        turn: 2,
        sectionNumber: 1,
        action: 'finish',
        stopReason: 'Felt satisfied.',
        privateReflection: { understanding: 'high', confusion: 'none', interest: 'high', note: 'Good place to stop.' },
      },
    ],
    contributionsBySection: { 1: [{ role: 'user', content: 'What is this about?' }, { role: 'assistant', content: 'It is about cultural hierarchy.' }] },
    ...overrides,
  };
}

test('writeRun creates a session.json and transcript.md with matching content', () => {
  const outDir = tmpOutDir();
  const meta = sampleMeta();
  const result = sampleResult();

  const { dir, jsonPath, mdPath } = writeRun(outDir, meta, result);

  assert.ok(fs.existsSync(dir));
  assert.ok(fs.existsSync(jsonPath));
  assert.ok(fs.existsSync(mdPath));

  const json = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  assert.equal(json.meta.textId, 'plenitude');
  assert.equal(json.stopReason, 'reader_finished');
  assert.equal(json.finalSectionNumber, 1);
  assert.equal(json.turns.length, 2);
  assert.equal(json.turns[0].privateReflection.note, 'Interesting opener.');
  assert.deepEqual(Object.keys(json.contributionsBySection), ['1']);

  const md = fs.readFileSync(mdPath, 'utf8');
  assert.match(md, /Synthetic reader session — plenitude, section 1/);
  assert.match(md, /Curious nonspecialist/);
  assert.match(md, /What is this about\?/);
  assert.match(md, /It is about cultural hierarchy\./);
  assert.match(md, /Private reflection\*\* \(never sent to the Text model\)/);
  assert.match(md, /Interesting opener\./);
  assert.match(md, /Sections with actual reader contributions \(evolvable\): 1\./);
});

test('a run with no contributions says so plainly in the markdown', () => {
  const outDir = tmpOutDir();
  const { mdPath } = writeRun(outDir, sampleMeta(), sampleResult({ contributionsBySection: {} }));
  const md = fs.readFileSync(mdPath, 'utf8');
  assert.match(md, /No actual reader contributions were made this run/);
});

test('run directory name is filesystem-safe and includes text/profile/section', () => {
  const outDir = tmpOutDir();
  const { dir } = writeRun(outDir, sampleMeta(), sampleResult());
  const base = path.basename(dir);
  assert.doesNotMatch(base, /[:]/);
  assert.match(base, /plenitude/);
  assert.match(base, /curious/);
  assert.match(base, /section1/);
});

test('markdown transcript never needs to be told about /api/evolve', () => {
  const src = fs.readFileSync(require.resolve('../lib/transcript.js'), 'utf8');
  assert.doesNotMatch(src, /\/api\/evolve/);
});

test('writeEvolveRun writes original.md, evolved.md, and evolve.json as a self-contained subfolder', () => {
  const sessionDir = tmpOutDir();
  const evolveMeta = {
    sourceSession: path.join(sessionDir, 'session.json'),
    textId: 'plenitude',
    sectionNumber: 1,
    profileId: 'curious',
    baseUrl: 'http://localhost:3000',
    startedAt: '2026-01-01T00:10:00.000Z',
    finishedAt: '2026-01-01T00:10:05.000Z',
  };
  const original = 'This is the pristine original section text.';
  const revised = 'This is the pristine original section text, now with one more clause added.';

  const { dir, originalPath, revisedPath, metaPath } = writeEvolveRun(sessionDir, evolveMeta, original, revised);

  assert.ok(dir.startsWith(sessionDir));
  assert.match(path.basename(dir), /^evolve-2026-01-01T00-10-00-000Z$/);
  assert.equal(fs.readFileSync(originalPath, 'utf8'), original);
  assert.equal(
    fs.readFileSync(revisedPath, 'utf8'),
    'This is the pristine original section text, **now with one more clause added**.'
  );

  const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
  assert.equal(meta.textId, 'plenitude');
  assert.equal(meta.sectionNumber, 1);
  assert.equal(meta.originalWordCount, 7);
  assert.ok(meta.revisedWordCount > meta.originalWordCount);
});

test('writeEvolveRun does not overwrite a prior attempt against the same session', () => {
  const sessionDir = tmpOutDir();
  const metaAt = (t) => ({ textId: 'plenitude', sectionNumber: 1, startedAt: t, finishedAt: t });

  const first = writeEvolveRun(sessionDir, metaAt('2026-01-01T00:10:00.000Z'), 'orig', 'revised one');
  const second = writeEvolveRun(sessionDir, metaAt('2026-01-01T00:20:00.000Z'), 'orig', 'revised two');

  assert.notEqual(first.dir, second.dir);
  assert.equal(fs.readFileSync(first.revisedPath, 'utf8'), '**revised one**');
  assert.equal(fs.readFileSync(second.revisedPath, 'utf8'), '**revised two**');
});
