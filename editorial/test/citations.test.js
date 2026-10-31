'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  checkCitations,
  citationMarkersOn,
  dropWrittenSourceList,
  fundIds,
  loadReferences,
  locatorAllowed,
  markWebCitations,
  parseLocator,
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
  for (const idx of [0, 4]) {
    const ids = fundIds(loadSectionFund(config, idx));
    assert.ok(ids.size >= 8);
    for (const id of ids) {
      assert.ok(refs[id], `reference for ${id}`);
      assert.match(refs[id].full, /\d{4}/);
    }
  }
  assert.deepEqual(refs['greenberg-1939'].pages, [], 'Greenberg pages belong to an unidentified reprint');
});
