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

function authoredSection(sectionOrder) {
  const [heading, ...bodyBlocks] = fs.readFileSync(
    path.join(root, 'plenitude', 'source_texts', 'sections', `section-${sectionOrder}.md`),
    'utf8'
  ).trim().split(/\n\s*\n/);
  return {
    title: heading.replace(/^##\s+/u, '').trim(),
    body: bodyBlocks.join('\n\n'),
  };
}

function authoredUncannySection(sectionOrder, title) {
  const blocks = fs.readFileSync(
    path.join(root, 'uncanny', 'source_texts', 'sections', `section-${sectionOrder}.md`),
    'utf8'
  ).trim().split(/\n\s*\n/);
  const heading = `## ${title}`;
  const headingIndex = blocks.indexOf(heading);
  assert.notEqual(headingIndex, -1, `Section ${sectionOrder} source heading is missing`);
  blocks.splice(headingIndex, 1);
  return blocks.join('\n\n');
}

function authoredBloodSection(sectionOrder) {
  const [, ...bodyBlocks] = fs.readFileSync(
    path.join(root, 'blood-on-the-wall', 'source_texts', 'sections', `section-${sectionOrder}.md`),
    'utf8'
  ).trim().split(/\n\s*\n/);
  return bodyBlocks.join('\n\n');
}

function authoredRemediationSection(sectionOrder) {
  const [, ...bodyBlocks] = fs.readFileSync(
    path.join(root, 'remediation', 'source_texts', 'sections', `section-${sectionOrder}.md`),
    'utf8'
  ).trim().split(/\n\s*\n/);
  return bodyBlocks.join('\n\n');
}

test('all editorial work manifests match the current text configs', () => {
  const discovered = discoverWorks(contentRoot);
  assert.deepEqual(discovered.map(({ work }) => work.id).sort(), [
    'blood-on-the-wall',
    'plenitude',
    'remediation',
    'uncanny',
  ]);
  assert.deepEqual(discovered.map(({ work }) => work.order), [1, 2, 3, 4]);

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

test('every Plenitude section is packaged without changing its authored prose', () => {
  const { work, workDir } = discoverWorks(contentRoot).find(item => item.work.id === 'plenitude');
  assert.equal(work.sections.length, 7);
  assert.ok(work.sections.every(section => section.package));

  const expectedPassageCounts = [4, 8, 2, 7, 10, 17, 8];
  for (const section of work.sections.slice().sort((a, b) => a.order - b.order)) {
    const sectionPackage = buildSectionPackage(work, section, workDir);
    const source = authoredSection(section.order);
    const packagedSpine = sectionPackage.spine.map(passage => passage.markdown).join('\n\n');
    assert.equal(source.title, section.title, `Section ${section.order} source title changed`);
    assert.equal(packagedSpine, source.body, `Section ${section.order} prose changed`);
    assert.equal(sectionPackage.spine.length, expectedPassageCounts[section.order - 1]);
    if (section.order !== 5) assert.deepEqual(sectionPackage.fundEntries, []);
  }
});

test('every Uncanny section is packaged without changing its authored prose', () => {
  const { work, workDir } = discoverWorks(contentRoot).find(item => item.work.id === 'uncanny');
  assert.equal(work.sections.length, 5);
  assert.ok(work.sections.every(section => section.package));

  const expectedPassageCounts = [5, 14, 6, 6, 5];
  for (const section of work.sections.slice().sort((a, b) => a.order - b.order)) {
    const sectionPackage = buildSectionPackage(work, section, workDir);
    const packagedSpine = sectionPackage.spine.map(passage => passage.markdown).join('\n\n');
    assert.equal(
      packagedSpine,
      authoredUncannySection(section.order, section.title),
      `Section ${section.order} prose changed`
    );
    assert.equal(sectionPackage.spine.length, expectedPassageCounts[section.order - 1]);
    assert.deepEqual(sectionPackage.fundEntries, []);
  }
});

test('every Blood on the Wall section is packaged without changing its authored prose', () => {
  const { work, workDir } = discoverWorks(contentRoot).find(item => item.work.id === 'blood-on-the-wall');
  assert.equal(work.sections.length, 4);
  assert.ok(work.sections.every(section => section.package));

  for (const section of work.sections.slice().sort((a, b) => a.order - b.order)) {
    const sectionPackage = buildSectionPackage(work, section, workDir);
    const packagedSpine = sectionPackage.spine.map(passage => passage.markdown).join('\n\n');
    assert.equal(packagedSpine, authoredBloodSection(section.order), `Section ${section.order} prose changed`);
    assert.equal(sectionPackage.spine.length, 2);
    assert.deepEqual(sectionPackage.fundEntries, []);
  }
});

test('every Remediation section is packaged without changing its authored prose', () => {
  const { work, workDir } = discoverWorks(contentRoot).find(item => item.work.id === 'remediation');
  assert.equal(work.sections.length, 7);
  assert.ok(work.sections.every(section => section.package));

  const expectedPassageCounts = [8, 9, 7, 6, 19, 4, 8];
  for (const section of work.sections.slice().sort((a, b) => a.order - b.order)) {
    const sectionPackage = buildSectionPackage(work, section, workDir);
    const packagedSpine = sectionPackage.spine.map(passage => passage.markdown).join('\n\n');
    assert.equal(
      normalize(packagedSpine),
      normalize(authoredRemediationSection(section.order)),
      `Section ${section.order} prose changed`
    );
    assert.equal(sectionPackage.spine.length, expectedPassageCounts[section.order - 1]);
    assert.deepEqual(sectionPackage.fundEntries, []);
  }
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
    assert.equal(index.works.length, 4);
    assert.equal(index.works.flatMap(work => work.sections).length, 23);
    const plenitude = index.works.find(work => work.id === 'plenitude');
    assert.ok(plenitude.sections.every(section => section.readiness === 'packaged'));
    const uncanny = index.works.find(work => work.id === 'uncanny');
    assert.ok(uncanny.sections.every(section => section.readiness === 'packaged'));
    const blood = index.works.find(work => work.id === 'blood-on-the-wall');
    assert.ok(blood.sections.every(section => section.readiness === 'packaged'));
    const remediation = index.works.find(work => work.id === 'remediation');
    assert.ok(remediation.sections.every(section => section.readiness === 'packaged'));
    const shockingArt = plenitude.sections.find(section => section.id === 'shocking-art');
    assert.equal(shockingArt.readiness, 'packaged');
    assert.equal(shockingArt.passageCount, 10);
    assert.equal(shockingArt.fundCounts.candidate, 4);
    assert.ok(fs.existsSync(path.join(outputRoot, 'index.json')));
    assert.ok(fs.existsSync(path.join(outputRoot, 'plenitude', 'shocking-art.json')));
    assert.ok(fs.existsSync(path.join(outputRoot, 'uncanny', 'uncanny-valley-and-double.json')));
    assert.ok(fs.existsSync(path.join(outputRoot, 'blood-on-the-wall', 'shot-heard-in-berlin.json')));
    assert.ok(fs.existsSync(path.join(outputRoot, 'remediation', 'two-logics.json')));
  } finally {
    fs.rmSync(outputRoot, { recursive: true, force: true });
  }
});

test('reader home page orders Plenitude, Uncanny, then Remediation and hides Blood on the Wall', () => {
  const homepage = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const plenitude = homepage.indexOf('href="plenitude/public/index.html"');
  const uncanny = homepage.indexOf('href="uncanny/public/index.html"');
  const remediation = homepage.indexOf('href="remediation/public/index.html"');
  const blood = homepage.indexOf('href="blood-on-the-wall/public/index.html"');
  assert.ok(plenitude >= 0 && plenitude < uncanny && uncanny < remediation);
  assert.equal(blood, -1);
});

test('public readers carry compact cross-section memory and restore per-section history', () => {
  for (const workId of ['plenitude', 'uncanny', 'blood-on-the-wall', 'remediation']) {
    const app = fs.readFileSync(path.join(root, workId, 'public', 'app.js'), 'utf8');
    const style = fs.readFileSync(path.join(root, workId, 'public', 'style.css'), 'utf8');
    assert.match(app, /const sectionSummaries = new Map\(\)/);
    assert.match(app, /priorSectionSummaries: priorSectionSummaries\(activeSection\)/);
    assert.match(app, /const activeSectionHistory = sectionHistories\.get\(activeSection\) \|\| \[\]/);
    assert.match(app, /sectionHistory: activeSectionHistory/);
    assert.match(app, /data\.editorial\?\.sectionSummary/);
    assert.match(app, /history: readingEdition === 'original' \? history : \[\]/);
    assert.match(app, /const firstContinuation = continuing && activeSectionHistory\.length === 0/);
    assert.match(app, /firstContinuation,/);
    assert.doesNotMatch(app, /firstSend/);
    assert.match(app, /function focusInput\(\)[\s\S]*input\.focus\(\{ preventScroll: true \}\)/);
    assert.match(app, /document\.getElementById\('consent-overlay'\)\.style\.display = 'none';\n  focusInput\(\);/);
    assert.match(app, /if \(thinking\) conv\.appendChild\(thinking\)/);
    assert.match(style, /#message-input \{[\s\S]*caret-color: var\(--text\)/);
  }
});

test('every configured Plenitude image resolves to an existing file', () => {
  const app = fs.readFileSync(path.join(root, 'plenitude', 'public', 'app.js'), 'utf8');
  const sources = [...app.matchAll(/src: '\.\.\/images\/([^']+)'/g)].map(match => match[1]);
  assert.deepEqual(sources, [
    'night-at-opera.png',
    'whats-opera-doc.png',
    'olmstead.png',
    'kandinsky.jpg',
  ]);
  for (const source of sources) {
    assert.ok(fs.existsSync(path.join(root, 'plenitude', 'images', source)), `${source} is missing`);
  }
});

test('author editor is generic, loads the generated index, and exposes versioned editing controls', () => {
  const app = fs.readFileSync(path.join(root, 'editorial', 'app.js'), 'utf8');
  const html = fs.readFileSync(path.join(root, 'editorial', 'index.html'), 'utf8');
  assert.match(app, /fetch\('data\/index\.json'\)/);
  assert.doesNotMatch(app, /plenitude|shocking-art/i);
  assert.match(app, /\/api\/author-section/);
  assert.match(html, /Author editor/);
  assert.match(html, /Publish author revision/);
  assert.match(html, /Add entry/);
  assert.match(html, /The fund/);
});

test('unauthenticated editorial workspace is excluded from Vercel deployments', () => {
  const vercelIgnore = fs.readFileSync(path.join(root, '.vercelignore'), 'utf8');
  assert.match(vercelIgnore, /^editorial\/$/m);
});
