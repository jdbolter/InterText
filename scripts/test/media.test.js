// H-018: media lists. The web is answered by sample responses in each service's
// documented shape (scripts/test/fixtures), since the tests must run without a network.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const lib = require('../media-lib');
const { addItem } = require('../media');
const media = require('../../api/lib/media');
const { stripImageTokens } = require('../../synthetic-reader/lib/session');

const fixtures = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'media-responses.json'), 'utf8'));

// A stand-in for fetch: the first fixture whose pattern the address contains answers.
function fakeFetch(seen = []) {
  return async (url, options = {}) => {
    seen.push({ url, options });
    const hit = fixtures.find(f => url.includes(f.match));
    if (!hit) throw new Error(`getaddrinfo ENOTFOUND ${new URL(url).hostname}`);
    return {
      status: hit.status,
      ok: hit.status >= 200 && hit.status < 300,
      json: async () => { if (typeof hit.body === 'string') throw new Error('not json'); return hit.body; },
      text: async () => (typeof hit.body === 'string' ? hit.body : JSON.stringify(hit.body)),
    };
  };
}

test('addresses are recognised by kind', () => {
  assert.deepStrictEqual(lib.identify('https://www.youtube.com/watch?v=xMG2oNqBy-Y&t=1m30s'), { type: 'youtube', videoId: 'xMG2oNqBy-Y', start: 90 });
  assert.deepStrictEqual(lib.identify('https://youtu.be/abc_123?t=42'), { type: 'youtube', videoId: 'abc_123', start: 42 });
  assert.strictEqual(lib.identify('https://www.youtube.com/shorts/Zz9').videoId, 'Zz9');
  assert.deepStrictEqual(lib.identify('https://vimeo.com/76979871'), { type: 'vimeo', videoId: '76979871' });
  assert.deepStrictEqual(lib.identify('https://commons.wikimedia.org/wiki/File:Bed-In_for_Peace,_Amsterdam_1969.jpg'),
    { type: 'wikimedia', wiki: 'commons.wikimedia.org', file: 'File:Bed-In for Peace, Amsterdam 1969.jpg' });
  assert.strictEqual(lib.identify('https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Some_File.jpg/800px-Some_File.jpg').file, 'File:Some File.jpg');
  assert.strictEqual(lib.identify('https://en.wikipedia.org/wiki/Bed-In#/media/File:Bed_in.jpg').wiki, 'en.wikipedia.org');
  assert.deepStrictEqual(lib.identify('https://www.metmuseum.org/art/collection/search/436535'), { type: 'met', objectId: '436535' });
  assert.deepStrictEqual(lib.identify('https://www.artic.edu/artworks/27992/a-sunday-on-la-grande-jatte-1884'), { type: 'aic', objectId: '27992' });
  assert.deepStrictEqual(lib.identify('https://www.newyorker.com/magazine/some-piece'), { type: 'link' });
  assert.deepStrictEqual(lib.identify('not a url'), { type: 'invalid' });
});

test('only open licences clear an image for showing', () => {
  for (const ok of ['Public domain', 'CC0', 'CC BY 4.0', 'CC BY-SA 3.0 nl', 'CC-BY-SA-4.0', 'PD-US']) assert.ok(lib.licenceCleared(ok, false), ok);
  for (const no of ['CC BY-NC 4.0', 'CC BY-ND 2.0', 'Fair use', '', 'All rights reserved']) assert.ok(!lib.licenceCleared(no, false), no);
  assert.ok(!lib.licenceCleared('CC BY-SA 4.0', true), 'a non-free file is never cleared');
});

test('a YouTube video that may be embedded is offered as a player', async () => {
  const item = await lib.resolve(fakeFetch(), 'https://www.youtube.com/watch?v=EMBEDOK0001');
  assert.strictEqual(item.kind, 'video');
  assert.strictEqual(item.status, 'ok');
  assert.strictEqual(item.title, 'Sample Video Title');
  assert.strictEqual(item.source, 'Sample Channel on YouTube');
  assert.deepStrictEqual(item.embed, { provider: 'youtube', videoId: 'EMBEDOK0001' });
});

test('a video whose owner forbids embedding becomes a card; a removed one is not offered', async () => {
  const off = await lib.resolve(fakeFetch(), 'https://youtu.be/EMBEDOFF001');
  assert.strictEqual(off.status, 'embed-disabled');
  const gone = await lib.resolve(fakeFetch(), 'https://www.youtube.com/watch?v=REMOVED0001');
  assert.strictEqual(gone.status, 'missing');
  assert.ok(!media.usable({ ...gone, id: 'x', title: 'x' }));
  assert.ok(media.usable({ ...off, id: 'x', title: 'x' }));
});

test('a Commons image under CC BY-SA is shown with its credit; a non-free one is a card', async () => {
  const seen = [];
  const free = await lib.resolve(fakeFetch(seen), 'https://commons.wikimedia.org/wiki/File:Free_sample.jpg');
  assert.strictEqual(free.status, 'ok');
  assert.strictEqual(free.licence.cleared, true);
  assert.strictEqual(free.licence.name, 'CC BY-SA 3.0 nl');
  assert.match(free.credit, /Eric Koch/);
  assert.match(free.credit, /via Wikimedia Commons\.$/);
  assert.match(free.embed.src, /^https:\/\/upload\.wikimedia\.org\//);
  assert.match(seen[0].options.headers['User-Agent'], /InterText/);
  const nonFree = await lib.resolve(fakeFetch(), 'https://en.wikipedia.org/wiki/File:Nonfree_sample.jpg');
  assert.strictEqual(nonFree.status, 'not-cleared');
  assert.strictEqual(nonFree.licence.cleared, false);
  const none = await lib.resolve(fakeFetch(), 'https://commons.wikimedia.org/wiki/File:No_such_file.jpg');
  assert.strictEqual(none.status, 'missing');
});

test('museum objects: open access is shown, the rest are cards', async () => {
  const met = await lib.resolve(fakeFetch(), 'https://www.metmuseum.org/art/collection/search/111111');
  assert.strictEqual(met.status, 'ok');
  assert.match(met.credit, /Open Access/);
  const metClosed = await lib.resolve(fakeFetch(), 'https://www.metmuseum.org/art/collection/search/222222');
  assert.strictEqual(metClosed.status, 'not-cleared');
  const aic = await lib.resolve(fakeFetch(), 'https://www.artic.edu/artworks/27992/sample');
  assert.strictEqual(aic.status, 'ok');
  assert.strictEqual(aic.embed.src, 'https://www.artic.edu/iiif/2/sample-image-id/full/843,/0/default.jpg');
  assert.strictEqual(aic.licence.name, 'CC0');
});

test('web pages: titled when alive, dead on 404, unverified when the site refuses the checker', async () => {
  const ok = await lib.resolve(fakeFetch(), 'https://example.org/alive');
  assert.strictEqual(ok.status, 'ok');
  assert.strictEqual(ok.title, 'A Living Page');
  assert.strictEqual((await lib.resolve(fakeFetch(), 'https://example.org/gone')).status, 'dead');
  assert.strictEqual((await lib.resolve(fakeFetch(), 'https://example.org/refuses')).status, 'unverified');
  assert.strictEqual((await lib.resolve(fakeFetch(), 'https://unreachable.invalid/x')).status, 'dead');
});

test('Commons search lists candidates in order, saying which can be shown', async () => {
  const results = await lib.searchCommons(fakeFetch(), 'bed-in', 5);
  assert.deepStrictEqual(results.map(r => r.file), ['File:First result.jpg', 'File:Second result.jpg']);
  assert.deepStrictEqual(results.map(r => r.cleared), [true, false]);
});

test('bulk lines: section | address | when | id', () => {
  assert.strictEqual(lib.parseBulkLine('# a comment'), null);
  assert.strictEqual(lib.parseBulkLine('   '), null);
  assert.deepStrictEqual(lib.parseBulkLine('11 | https://youtu.be/x | when the reply discusses the bed-in | bed-in'),
    { section: 11, url: 'https://youtu.be/x', when: 'when the reply discusses the bed-in', id: 'bed-in' });
  assert.throws(() => lib.parseBulkLine('eleven | https://youtu.be/x'));
});

test('a recheck keeps what Jay wrote and takes what the check found', () => {
  const list = { section: 11, items: [{ id: 'bed-in', kind: 'video', url: 'https://www.youtube.com/watch?v=A', title: 'Jay\'s title', when: 'when the bed-in comes up', status: 'ok', embed: { provider: 'youtube', videoId: 'A' } }] };
  const { item, replaced } = addItem(list, { kind: 'video', url: 'https://www.youtube.com/watch?v=A', title: 'Their title', status: 'embed-disabled', embed: { provider: 'youtube', videoId: 'A' }, checked: '2026-11-06' }, {});
  assert.ok(replaced);
  assert.strictEqual(list.items.length, 1);
  assert.strictEqual(item.title, 'Jay\'s title');
  assert.strictEqual(item.when, 'when the bed-in comes up');
  assert.strictEqual(item.status, 'embed-disabled');
  const second = addItem(list, { kind: 'link', url: 'https://example.org/b', title: 'Jay\'s title', status: 'ok' }, {});
  assert.strictEqual(second.item.id, 'jay-s-title', 'a new item gets an id from its title');
});

// The server: what the model is told, and what survives into the reply.
function withList(items, fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'media-'));
  fs.writeFileSync(path.join(dir, 'section-3.json'), JSON.stringify({ section: 3, items }));
  media._cache.clear();
  try { return fn({ mediaListsDir: dir }); } finally { media._cache.clear(); fs.rmSync(dir, { recursive: true, force: true }); }
}

const ITEMS = [
  { id: 'clip', kind: 'video', url: 'https://www.youtube.com/watch?v=A', title: 'A clip', when: 'when the reply discusses the clip', status: 'ok', embed: { provider: 'youtube', videoId: 'A' } },
  { id: 'pic', kind: 'image', url: 'https://commons.wikimedia.org/wiki/File:P.jpg', title: 'A picture', status: 'ok', licence: { name: 'CC0', cleared: true }, embed: { src: 'https://upload.wikimedia.org/p.jpg' } },
  { id: 'gone', kind: 'link', url: 'https://example.org/gone', title: 'Gone', status: 'dead' },
];

test('the model is offered only live items not yet shown, each with when to use it', () => withList(ITEMS, (config) => {
  const text = media.mediaPromptText(config, 2, ['pic']);
  assert.match(text, /\[\[MEDIA:clip\]\]: a video, A clip\. Use it when the reply discusses the clip\./);
  assert.doesNotMatch(text, /MEDIA:pic|MEDIA:gone/);
  assert.strictEqual(media.mediaPromptText(config, 2, ['pic', 'clip']), null);
  assert.strictEqual(media.mediaPromptText(config, 5, []), null, 'a section with no list offers nothing');
  assert.strictEqual(media.mediaPromptText({}, 2, []), null, 'a work with no lists offers nothing');
}));

test('the reply keeps one listed item, on its own line, and the page is given it', () => withList(ITEMS, (config) => {
  const { text, media: used } = media.applyMediaTokens('First paragraph. [[MEDIA:clip]] More.\n\n[[MEDIA:invented]]\n\n[[MEDIA:clip]] [[MEDIA:pic]] End.', config, 2);
  assert.strictEqual(text, 'First paragraph.\n\n[[MEDIA:clip]]\n\nMore.\n\nEnd.');
  assert.deepStrictEqual(Object.keys(used), ['clip']);
  assert.strictEqual(used.clip.embed.videoId, 'A');
  assert.strictEqual(used.clip.when, undefined, 'the prompt guidance is not sent to the page');
  const none = media.applyMediaTokens('No media here.', config, 2);
  assert.strictEqual(none.media, null);
  assert.strictEqual(media.applyMediaTokens('[[MEDIA:gone]] x', config, 2).text, 'x');
}));

test('the revision pass must keep media markers, and transcripts note them', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', '..', 'api', 'lib', 'reply-revision.js'), 'utf8');
  assert.match(src, /IMAGE\|CITE\|WEB\|MEDIA/);
  assert.strictEqual(stripImageTokens('a [[MEDIA:clip]] b'), 'a [A media item appears here: clip.] b');
});

test('the page script renders every kind and falls back to a card', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', '..', 'shared', 'media-items.js'), 'utf8');
  const sandbox = {};
  new Function('globalThis', 'window', src)(sandbox, undefined);
  const { videoSrc } = sandbox.MediaItems;
  assert.strictEqual(videoSrc({ provider: 'youtube', videoId: 'A-b_1', start: 90 }), 'https://www.youtube-nocookie.com/embed/A-b_1?rel=0&start=90');
  assert.strictEqual(videoSrc({ provider: 'vimeo', videoId: '123' }), 'https://player.vimeo.com/video/123?dnt=1');
  assert.strictEqual(videoSrc({ provider: 'youtube', videoId: 'bad"id' }), null);
  assert.match(src, /addEventListener\('error', \(\) => figure\.replaceWith\(card\(item\)\)/);
});

test('every media list in the work is well formed', () => {
  const dir = path.join(__dirname, '..', '..', 'digital-plenitude', 'source_texts', 'media-lists');
  const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => /^section-\d+\.json$/.test(f)) : [];
  for (const f of files) {
    const list = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    const items = Array.isArray(list) ? list : list.items;
    const ids = items.map(it => it.id);
    assert.strictEqual(new Set(ids).size, ids.length, `${f}: ids are unique`);
    for (const it of items) {
      assert.ok(media.KINDS.includes(it.kind), `${f} ${it.id}: kind`);
      assert.match(it.url, /^https:\/\//, `${f} ${it.id}: url`);
      assert.ok(it.status, `${f} ${it.id}: checked by npm run media`);
    }
  }
});
