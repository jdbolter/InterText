'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  buildAll,
  buildSectionPackage,
  discoverWorks,
  parseSpine,
  validateSectionPackage,
} = require('../lib/content');

const root = path.join(__dirname, '..', '..');
const contentRoot = path.join(root, 'editorial', 'content');

function normalize(text) {
  return String(text).replace(/\s+/g, ' ').trim();
}

test('all editorial work manifests match the current text configs', () => {
  const discovered = discoverWorks(contentRoot);
  assert.deepEqual(discovered.map(({ work }) => work.id).sort(), [
    'blood-on-the-wall',
    'plenitude',
    'uncanny',
  ]);
  assert.deepEqual(discovered.map(({ work }) => work.order), [1, 2, 3]);

  for (const { work } of discovered) {
    const config = require(path.join(root, work.id, 'config.js'));
    const sections = work.sections.slice().sort((a, b) => a.order - b.order);
    assert.deepEqual(sections.map(section => section.title), config.sectionNames);
    assert.deepEqual(sections.map(section => section.order), config.sectionNames.map((_, index) => index + 1));
  }
});

test('marked spine parser creates stable, unique passages', () => {
  const passages = parseSpine([
    '<!-- intertext:passage example-p01 -->',
    'First passage.',
    '<!-- intertext:passage example-p02 -->',
    'Second passage.',
  ].join('\n'));
  assert.deepEqual(passages, [
    { id: 'example-p01', markdown: 'First passage.' },
    { id: 'example-p02', markdown: 'Second passage.' },
  ]);
});

test('Section 5 package preserves the complete authored spine and exposes four candidates', () => {
  const { work, workDir } = discoverWorks(contentRoot).find(item => item.work.id === 'plenitude');
  const section = work.sections.find(item => item.id === 'shocking-art');
  const sectionPackage = buildSectionPackage(work, section, workDir);

  assert.equal(sectionPackage.spine.length, 10);
  assert.equal(sectionPackage.fundEntries.length, 4);
  assert.ok(sectionPackage.fundEntries.every(entry => entry.status === 'candidate'));
  assert.equal(sectionPackage.fundEntries.filter(entry => entry.sourceStatus === 'needs-verification').length, 2);
  for (const entry of sectionPackage.fundEntries) {
    assert.ok(entry.provenance.artifactPath.startsWith('editorial/'));
    assert.ok(fs.existsSync(path.join(root, entry.provenance.artifactPath)));
  }

  const authored = fs.readFileSync(path.join(root, 'plenitude', 'source_texts', 'sections', 'section-5.md'), 'utf8')
    .replace(/^## Shocking Art\s*/u, '');
  const packagedSpine = sectionPackage.spine.map(passage => passage.markdown).join('\n\n');
  assert.equal(normalize(packagedSpine), normalize(authored));
});

test('section validation rejects a fund entry anchored to a nonexistent passage', () => {
  const { work, workDir } = discoverWorks(contentRoot).find(item => item.work.id === 'plenitude');
  const section = work.sections.find(item => item.id === 'shocking-art');
  const sectionPackage = buildSectionPackage(work, section, workDir);
  sectionPackage.fundEntries[0].anchors = ['missing-passage'];
  assert.throws(
    () => validateSectionPackage(sectionPackage),
    /refers to unknown anchor missing-passage/
  );
});

test('buildAll writes a portable editor index and validated section snapshot', () => {
  const outputRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'intertext-editorial-'));
  try {
    const index = buildAll({ contentRoot, outputRoot });
    assert.equal(index.works.length, 3);
    assert.equal(index.works.flatMap(work => work.sections).length, 16);
    const plenitude = index.works.find(work => work.id === 'plenitude');
    const shockingArt = plenitude.sections.find(section => section.id === 'shocking-art');
    assert.equal(shockingArt.readiness, 'packaged');
    assert.equal(shockingArt.passageCount, 10);
    assert.equal(shockingArt.fundCounts.candidate, 4);
    assert.ok(fs.existsSync(path.join(outputRoot, 'index.json')));
    assert.ok(fs.existsSync(path.join(outputRoot, 'plenitude', 'shocking-art.json')));
  } finally {
    fs.rmSync(outputRoot, { recursive: true, force: true });
  }
});

test('read-only editor is generic and loads the generated data index', () => {
  const app = fs.readFileSync(path.join(root, 'editorial', 'app.js'), 'utf8');
  const html = fs.readFileSync(path.join(root, 'editorial', 'index.html'), 'utf8');
  assert.match(app, /fetch\('data\/index\.json'\)/);
  assert.doesNotMatch(app, /plenitude|shocking-art/i);
  assert.match(html, /Read-only prototype/);
  assert.match(html, /The fund/);
});

test('unauthenticated editorial workspace is excluded from Vercel deployments', () => {
  const vercelIgnore = fs.readFileSync(path.join(root, '.vercelignore'), 'utf8');
  assert.match(vercelIgnore, /^editorial\/$/m);
});
