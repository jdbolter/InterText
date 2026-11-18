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
  assert.deepEqual(discovered.map(({ work }) => work.id), ['digital-plenitude']);
  assert.deepEqual(discovered.map(({ work }) => work.order), [1]);

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

test('section validation rejects a fund entry anchored to a nonexistent passage', () => {
  const { work, workDir } = discoverWorks(contentRoot).find(item => item.work.id === 'digital-plenitude');
  const section = work.sections.find(item => item.id === 'shocking-art');
  const sectionPackage = buildSectionPackage(work, section, workDir);
  // A fund entry from the frozen fixture (see fixture-root/README.md), anchored to a passage that does not exist.
  const fixture = JSON.parse(fs.readFileSync(
    path.join(__dirname, 'fixture-root', 'api', 'editorial-seed', 'plenitude', 'shocking-art.json'), 'utf8'));
  sectionPackage.fundEntries = [{ ...fixture.fundEntries[0], anchors: ['missing-passage'] }];
  assert.throws(
    () => validateSectionPackage(sectionPackage),
    /refers to unknown anchor missing-passage/
  );
});

test('buildAll writes a portable editor index and validated section snapshot', () => {
  const outputRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'intertext-editorial-'));
  try {
    const index = buildAll({ contentRoot, outputRoot });
    assert.equal(index.works.length, 1);
    assert.equal(index.works.flatMap(work => work.sections).length, 49);
    const proofs = index.works.find(work => work.id === 'digital-plenitude');
    assert.ok(proofs.sections.every(section => section.readiness === 'packaged'));
    assert.ok(proofs.sections.every(section => section.fundCounts.accepted === 0 && section.fundCounts.candidate === 0));
    assert.ok(fs.existsSync(path.join(outputRoot, 'index.json')));
    assert.ok(fs.existsSync(path.join(outputRoot, 'digital-plenitude', 'shocking-art.json')));
  } finally {
    fs.rmSync(outputRoot, { recursive: true, force: true });
  }
});

test('reader home page offers The Digital Plenitude', () => {
  const homepage = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const cards = [...homepage.matchAll(/<a class="card" href="([^"]+)"/g)].map(m => m[1]);
  assert.deepEqual(cards, ['digital-plenitude/public/index.html']);
});

test('public readers carry compact cross-section memory and restore per-section history', () => {
  for (const workId of ['digital-plenitude']) {
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

test('Vercel functions include the generated editorial runtime seed', () => {
  const vercelConfig = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));
  assert.equal(vercelConfig.functions['api/chat.js'].includeFiles, 'api/editorial-seed/**');
  assert.equal(vercelConfig.functions['api/evolve.js'].includeFiles, 'api/editorial-seed/**');
});

test('digital-plenitude: the introductions the page shows match the ones the model is told about', () => {
  // H-006: the boxes live in app.js (what the reader sees) and in config.js (what the model is told
  // the reader saw). They must say the same thing.
  const config = require(path.join(root, 'digital-plenitude', 'config.js'));
  const app = fs.readFileSync(path.join(root, 'digital-plenitude', 'public', 'app.js'), 'utf8');
  const block = app.slice(app.indexOf('const SECTION_INTROS = ['), app.indexOf('];', app.indexOf('const SECTION_INTROS = [')));
  const shown = [...block.matchAll(/`([\s\S]*?)`/g)].map(m => m[1]);
  const plain = s => s
    .replace(/<[^>]+>/g, '')
    .replace(/&mdash;/g, '—').replace(/&rsquo;/g, '’').replace(/&lsquo;/g, '‘')
    .replace(/&ldquo;/g, '“').replace(/&rdquo;/g, '”').replace(/&amp;/g, '&')
    .replace(/[’‘]/g, "'").replace(/[“”]/g, '"')
    .replace(/\s+/g, ' ').trim();
  assert.equal(shown.length, config.sectionIntros.length);
  shown.forEach((html, i) => assert.equal(plain(html), plain(config.sectionIntros[i]), `section ${i + 1} introduction`));
});

test('digital-plenitude: the chapters the page shows match config.chapters (H-014)', () => {
  const config = require(path.join(root, 'digital-plenitude', 'config.js'));
  const app = fs.readFileSync(path.join(root, 'digital-plenitude', 'public', 'app.js'), 'utf8');
  const block = app.slice(app.indexOf('const CHAPTERS = ['), app.indexOf('];', app.indexOf('const CHAPTERS = [')) + 2);
  const shown = new Function(`${block}; return CHAPTERS;`)();
  assert.deepEqual(shown, config.chapters.map(({ number, title, firstSection, label }) => (label ? { number, title, firstSection, label } : { number, title, firstSection })));
  assert.equal(config.chapters[0].firstSection, 0);
  assert.ok(config.chapters.every(ch => typeof ch.point === 'string' && ch.point.trim()));
  assert.equal(config.sectionPoints.length, config.sectionNames.length);
  const numerals = new Function(`${app.slice(app.indexOf('const SECTION_NUMERALS = ['), app.indexOf('];', app.indexOf('const SECTION_NUMERALS = [')) + 2)}; return SECTION_NUMERALS;`)();
  assert.equal(numerals.length, config.sectionNames.length);
  assert.equal(numerals[config.chapters[1].firstSection], 'I');
});

test('digital-plenitude chapter 2: the original edition keeps the proofs; the spine carries the corrections (H-014)', () => {
  const read = n => fs.readFileSync(path.join(root, 'digital-plenitude', 'source_texts', 'sections', `section-${n}.md`), 'utf8');
  const spine = id => fs.readFileSync(path.join(contentRoot, 'digital-plenitude', 'sections', id, 'spine.md'), 'utf8');
  assert.match(read(13), /Jony Ives/);
  assert.doesNotMatch(spine('steve-jobs'), /Ives/);
  assert.match(spine('steve-jobs'), /Jony Ive,/);
  assert.match(read(14), /Alan Newell/);
  assert.match(spine('future-as-kitsch'), /Allen Newell[\s\S]*C-3PO[\s\S]*Levandowski/);
  assert.match(spine('lennon-ono-political-modernists'), /after he met Ono were nonsongs/);
  assert.match(spine('forgetting-popular-modernism'), /Fredric Jameson/);
  for (let n = 8; n <= 49; n += 1) assert.doesNotMatch(read(n), /⟦|\[\^|\u0001/);
  // H-015: chapter 3.
  assert.match(read(17), /Jay-Z claims/);
  assert.match(spine('rise-of-popular-modernism'), /JAY-Z claims/);
  assert.match(spine('describing-the-plenitude'), /even in the United States/);
  assert.match(read(18), /\[Figure 3\.1, not shown: Some dichotomies[^\]]*catharsis \/ flow/);
  // Chapter 4: the original keeps the proofs; the spine has Jay's corrections (2026-11-09).
  assert.match(read(19), /Edward R\. Morrow/);
  assert.match(spine('catharsis'), /Edward R\. Murrow/);
  assert.match(spine('fragmented-stories'), /in particular Jordan Weisman and Elan Lee/);
  assert.match(spine('catharsis-in-video-games'), /from Boston to Salt Lake City/);
  assert.match(spine('catharsis-in-video-games'), /seventeen-year-old sister Samantha/);
  assert.match(spine('cinema-of-immersion'), /collaborated with the \*Times\* on \*The Displaced\*/);
  assert.match(read(21), /Collaborating with the \*Times\*/);
  // Chapter 5: no untitled opening; several figures in a section; Jay's diagrams shown.
  assert.match(read(24), /^## From Catharsis to Flow\n/);
  assert.match(spine('games-and-flow'), /women over eighteen make up 31 percent/);
  assert.match(read(25), /31 percent of all gamers are women/);
  assert.match(read(28), /\[Figure 5\.2: Flow and catharsis:/);
  assert.match(read(29), /\[Figure 5\.3, not shown:[^\n]*\]\n\n[^\n]*\n\n\[Figure 5\.4, not shown:/);
  assert.match(read(29), /horror\.\n\n\[Figure 5\.5: Three aesthetics/);
  assert.match(read(22), /\[Figure 4\.1, not shown: Giant Sparrow, \*What Remains of Edith Finch\* \(2015\)/);
});

test('digital-plenitude chapters 6 to 9: built, with the Conclusion headed by its label and figure 9.1 shown', () => {
  const config = require(path.join(root, 'digital-plenitude', 'config.js'));
  const { sectionLabelLine, mainLineStatement } = require(path.join(root, 'api', '_lib', 'text-extras.js'));
  const read = n => fs.readFileSync(path.join(root, 'digital-plenitude', 'source_texts', 'sections', `section-${n}.md`), 'utf8');
  assert.equal(config.sectionNames.length, 49);
  assert.deepEqual(config.chapters.slice(5).map(ch => ch.firstSection), [29, 34, 40, 48]);
  assert.match(read(30), /^## Remix and Originality/);
  assert.match(read(35), /^## Datafication/);
  assert.match(read(49), /^## Conclusion/);
  assert.match(read(49), /\[Figure 9\.1/);
  assert.equal(sectionLabelLine(config, 'Conclusion', 48), 'Now under discussion: Conclusion (Conclusion)');
  assert.match(mainLineStatement(config, 48), /The Conclusion as a whole: /);
  assert.match(mainLineStatement(config, 30), /Chapter 6, Remix and Originality, as a whole: /);
  assert.equal(config.sectionImagePrompts[48][0].id, 'dichotomies');
  const app = fs.readFileSync(path.join(root, 'digital-plenitude', 'public', 'app.js'), 'utf8');
  assert.match(app, /fig-9-1-dichotomies\.png/);
  assert.ok(fs.existsSync(path.join(root, 'digital-plenitude', 'images', 'fig-9-1-dichotomies.png')));
});
