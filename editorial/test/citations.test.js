'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  annotateFund,
  checkCitations,
  citationMarkersOn,
  dropWrittenSourceList,
  fundIds,
  introducedIds,
  loadReferences,
  locatorAllowed,
  markWebCitations,
  parseLocator,
  plainCitations,
  stripWebTokens,
  webUsed,
} = require('../../api/lib/citations');
const { checkRevision } = require('../../api/lib/reply-revision');
const { clearFundCache, loadSectionFund } = require('../../api/lib/text-extras');
const { renderDraftMarkers, renderWithNotes } = require('../../synthetic-reader/lib/notes');

const references = {
  'burger-1984': { short: 'Bürger 1984', full: 'Bürger, Peter. 1984. <i>Theory</i>.', pages: [[20, 22], [80, 81]] },
  'levine-1988': { short: 'Levine 1988', full: 'Levine, Lawrence W. 1988. <i>Highbrow</i>.', pages: [] },
  'krauss-1981': { short: 'Krauss 1981', full: 'Krauss, Rosalind. 1981.', pages: [[47, 48]] },
};

test('fund ids are read from the start of each entry', () => {
  const ids = fundIds('PREAMBLE with [[CITE:x]] in it\n\n[burger-1984] Bürger, ...\n\n[levine-1988] Levine, ...');
  assert.deepEqual([...ids], ['burger-1984', 'levine-1988']);
});

test('page locators are read and must fall within the entry\'s pages', () => {
  assert.deepEqual(parseLocator('80-81'), [[80, 81]]);
  assert.deepEqual(parseLocator('pp. 20, 80–81'), [[20, 20], [80, 81]]);
  assert.equal(parseLocator('chapter 2'), null);
  assert.equal(locatorAllowed('80–81', references['burger-1984'].pages), true);
  assert.equal(locatorAllowed('21', references['burger-1984'].pages), true);
  assert.equal(locatorAllowed('79–81', references['burger-1984'].pages), false);
  assert.equal(locatorAllowed('3', references['levine-1988'].pages), false, 'no pages: no locator');
});

test('markers survive only for works in the section fund; bad pages are dropped', () => {
  const allowedIds = new Set(['burger-1984', 'levine-1988']);
  const { text, library } = checkCitations(
    'Shock is consumed [[CITE:burger-1984|80-81]]. Levine [[CITE:levine-1988|12]]. Krauss [[CITE:krauss-1981|47]]. Ghost [[CITE:nobody-2000]].',
    { allowedIds, references });
  assert.equal(text, 'Shock is consumed[[CITE:burger-1984|80–81]]. Levine[[CITE:levine-1988]]. Krauss. Ghost.');
  assert.deepEqual(Object.keys(library).sort(), ['burger-1984', 'levine-1988']);
  assert.equal(library['burger-1984'].short, 'Bürger 1984');
});

test('web citations become numbered markers at the end of the passage they support', () => {
  const blocks = [
    { type: 'text', text: 'Getty barred AI images ', citations: [{ url: 'https://a', title: 'A' }, { url: 'https://a', title: 'A' }] },
    { type: 'text', text: 'in 2022, and ' },
    { type: 'text', text: 'others followed.', citations: [{ url: 'https://b', title: 'B' }, { url: 'https://a', title: 'A' }] },
  ];
  const { text, web } = markWebCitations(blocks);
  assert.equal(text, 'Getty barred AI images[[WEB:1]]in 2022, and others followed.[[WEB:2]][[WEB:1]]');
  assert.deepEqual(web.map(w => [w.k, w.url]), [[1, 'https://a'], [2, 'https://b']]);
  assert.deepEqual(webUsed('only [[WEB:2]]', web).map(w => w.k), [2]);
  assert.equal(stripWebTokens('x[[WEB:1]] y[[WEB:12]]'), 'x y');
});

test('a source list written into the reply is dropped when markers are on', () => {
  assert.equal(dropWrittenSourceList('Para one.\n\nPara two.\n\nSources: [A](https://a) · [B](https://b)'), 'Para one.\n\nPara two.');
  assert.equal(dropWrittenSourceList('No list here.'), 'No list here.');
});

test('the revision pass must keep every citation marker', () => {
  const draft = 'A[[CITE:burger-1984|80–81]] B[[WEB:1]]';
  assert.equal(checkRevision(draft, 'A revised[[CITE:burger-1984|80–81]] B[[WEB:1]]').ok, true);
  assert.equal(checkRevision(draft, 'A revised[[CITE:burger-1984]] B[[WEB:1]]').ok, false);
  assert.equal(checkRevision(draft, 'A revised B[[WEB:1]]').ok, false);
});

test('the synthetic reader sees numbered notes, counted through the session', () => {
  const notes = { library: { 'burger-1984': references['burger-1984'] }, web: [{ k: 1, url: 'https://a', title: 'A' }] };
  const counter = { n: 2 };
  const out = renderWithNotes('Consumed[[CITE:burger-1984|80–81]]. Getty[[WEB:1]].', notes, counter);
  assert.equal(out, 'Consumed[3]. Getty[4].\n\nNotes:\n[3] Bürger 1984, 80–81. Bürger, Peter. 1984. Theory.\n[4] (web) A. https://a');
  assert.equal(counter.n, 4);
  assert.equal(renderWithNotes('No markers.', null, counter), 'No markers.');
  assert.equal(renderDraftMarkers('Consumed[[CITE:burger-1984|80–81]].', notes), 'Consumed (Bürger 1984, 80–81).');
});

test('digital-plenitude: every fund entry has a reference, and every fund page lies within it', () => {
  const config = require('../../digital-plenitude/config');
  assert.equal(citationMarkersOn(config), true);
  assert.equal(citationMarkersOn(require('../../plenitude/config')), false);
  const refs = loadReferences(config);
  clearFundCache();
  for (const idx of [0, 1, 2, 3, 4, 5, 6]) {
    const ids = fundIds(loadSectionFund(config, idx));
    assert.ok(ids.size >= 5, `section ${idx + 1} has a fund`);
    for (const id of ids) {
      assert.ok(refs[id], `reference for ${id}`);
      assert.match(refs[id].full, /\d{4}/);
    }
    // Every page an entry cites must be one a marker for that work may carry.
    const fund = loadSectionFund(config, idx);
    for (const m of fund.matchAll(/^\[([a-z0-9-]+)\] (.*)$/gm)) {
      for (const p of m[2].matchAll(/\(pp?\. ([\d–, ]+)\)/g)) {
        assert.ok(locatorAllowed(p[1], refs[m[1]].pages), `${m[1]} cites pp. ${p[1]} in section ${idx + 1}`);
      }
    }
  }
  assert.deepEqual(refs['greenberg-1939'].pages, [], 'Greenberg pages belong to an unidentified reprint');
  assert.match(config.fundInstruction, /\[\[CITE:id\]\]/);
  assert.doesNotMatch(config.fundPreamble, /Cite a work only/);
});

test('for synthesis, markers become the book\'s author-date style (server and page agree)', () => {
  assert.equal(plainCitations('Consumed[[CITE:burger-1984|80–81]]. Getty[[WEB:1]]. Ghost[[CITE:nobody-2000]].', references),
    'Consumed (Bürger 1984, 80–81). Getty. Ghost.');
  const vm = require('vm');
  const fs = require('fs');
  const path = require('path');
  const sandbox = { window: {}, URL };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', '..', 'shared', 'citation-notes.js'), 'utf8'), sandbox);
  const notes = { library: { 'burger-1984': references['burger-1984'] }, web: [{ k: 1, url: 'https://a.org/x', title: 'Getty [bans] AI art' }] };
  assert.equal(sandbox.window.CitationNotes.plainReply('Consumed[[CITE:burger-1984|80–81]]. Getty[[WEB:1]].', notes),
    'Consumed (Bürger 1984, 80–81). Getty ([Getty bans AI art](https://a.org/x)).');
});

test('each listed work is marked with how to mention it, and introductions happen once (H-008)', () => {
  const refs = {
    'burger-1984': { short: 'Bürger 1984', full: 'x', pages: [], mention: 'introduce', intro: 'the German literary theorist Peter Bürger', name: 'Bürger' },
    'pautz-2002': { short: 'Pautz 2002', full: 'x', pages: [], mention: 'note' },
    'bolter-2022': { short: 'Bolter 2022', full: 'x', pages: [], mention: 'own' },
    'levine-1988': { short: 'Levine 1988', full: 'x', pages: [] },
  };
  const fund = 'PREAMBLE\n\n[burger-1984] Bürger, ...\n\n[pautz-2002] Pautz, ...\n\n[bolter-2022] Bolter, ...\n\n[levine-1988] Levine, ...';
  const fresh = annotateFund(fund, refs, introducedIds([], refs));
  assert.match(fresh, /\[burger-1984\] \(Not yet introduced: on first mention, "the German literary theorist Peter Bürger"; afterwards simply "Bürger"\.\) Bürger/);
  assert.match(fresh, /\[pautz-2002\] \(Cite by note only:/);
  assert.match(fresh, /\[bolter-2022\] \(The work's own later thinking:/);
  assert.match(fresh, /\[levine-1988\] Levine/, 'no mention field: unchanged');
  assert.deepEqual([...fundIds(fresh)], ['burger-1984', 'pautz-2002', 'bolter-2022', 'levine-1988']);
  // once the text has cited him (or named him), he is introduced
  for (const said of ['Shock is consumed[[CITE:burger-1984|80–81]].', 'As Bürger argued, shock is consumed.']) {
    const later = annotateFund(fund, refs, introducedIds([{ role: 'user', content: 'Bürger?' }, { role: 'assistant', content: said }], refs));
    assert.match(later, /\[burger-1984\] \(Already introduced in this conversation: simply "Bürger"\.\)/);
  }
  // a reader naming him does not count as the text introducing him
  assert.equal(introducedIds([{ role: 'user', content: 'What about Bürger?' }], refs).size, 0);
});
