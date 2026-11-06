#!/usr/bin/env node
// H-018: keep a work's media lists. Run on a computer with open network.
//
//   npm run media -- add --section 11 --url <address> --when "when the reply discusses ..." [--id x] [--title "..."] [--date "1969"]
//   npm run media -- bulk <file>        lines of: section | address | when to use it | id (optional)
//   npm run media -- check [--section 11]   look at every listed item again
//   npm run media -- search "bed-in Amsterdam 1969" [--limit 10]   candidate images on Wikimedia Commons
//   npm run media -- list [--section 11]
//
// --work digital-plenitude is the default. Lists are written to
// <work>/source_texts/media-lists/section-N.json.
const fs = require('fs');
const path = require('path');
const lib = require('./media-lib');

const ROOT = path.join(__dirname, '..');
const STATUS_WORDS = {
  ok: 'shown in the page',
  'embed-disabled': 'card only: the owner does not allow embedding',
  'not-cleared': 'card only: licence does not allow showing it',
  unverified: 'card only: the site would not answer the checker',
  missing: 'NOT OFFERED: missing',
  dead: 'NOT OFFERED: dead link',
};

function args(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) out[key] = true;
      else { out[key] = next; i++; }
    } else out._.push(a);
  }
  return out;
}

function listsDir(work) {
  return path.join(ROOT, work, 'source_texts', 'media-lists');
}

function listFile(work, section) {
  return path.join(listsDir(work), `section-${section}.json`);
}

function readList(work, section) {
  try {
    const parsed = JSON.parse(fs.readFileSync(listFile(work, section), 'utf8'));
    return Array.isArray(parsed) ? { section, items: parsed } : { section, ...parsed, items: parsed.items || [] };
  } catch (e) {
    if (e.code === 'ENOENT') return { section, items: [] };
    throw e;
  }
}

function writeList(work, list) {
  fs.mkdirSync(listsDir(work), { recursive: true });
  fs.writeFileSync(listFile(work, list.section), JSON.stringify(list, null, 2) + '\n');
}

function sections(work) {
  try {
    return fs.readdirSync(listsDir(work)).map(f => (f.match(/^section-(\d+)\.json$/) || [])[1]).filter(Boolean).map(Number).sort((a, b) => a - b);
  } catch (e) { return []; }
}

function sameItem(a, b) {
  return a.url === b.url || (a.embed && b.embed && a.embed.videoId && a.embed.videoId === b.embed.videoId);
}

// Merge a freshly checked item into a section's list. What Jay wrote (id, title,
// date, credit, when) is kept; what the check found (status, licence, embed) is new.
function addItem(list, found, given) {
  const existing = list.items.find(it => sameItem(it, found));
  const ids = new Set(list.items.filter(it => it !== existing).map(it => it.id));
  let id = given.id || (existing && existing.id) || lib.slug(given.title || found.title || found.url);
  for (let n = 2; ids.has(id); n++) id = `${lib.slug(given.title || found.title || found.url)}-${n}`;
  const item = {
    id,
    kind: found.kind,
    url: found.url,
    title: given.title || (existing && existing.title) || found.title || found.url,
    ...(given.date || (existing && existing.date) || found.date ? { date: given.date || (existing && existing.date) || found.date } : {}),
    ...(found.source ? { source: found.source } : {}),
    ...(given.credit || found.credit ? { credit: given.credit || (existing && existing.creditSet && existing.credit) || found.credit } : {}),
    ...(given.credit ? { creditSet: true } : (existing && existing.creditSet ? { creditSet: true } : {})),
    ...(found.licence ? { licence: found.licence } : {}),
    ...(found.embed ? { embed: found.embed } : {}),
    when: given.when || (existing && existing.when) || '',
    status: found.status,
    checked: found.checked,
    ...(found.note ? { note: found.note } : {}),
  };
  if (existing) list.items[list.items.indexOf(existing)] = item;
  else list.items.push(item);
  return { item, replaced: Boolean(existing) };
}

function report(section, item, replaced) {
  const words = STATUS_WORDS[item.status] || item.status;
  console.log(`section ${section}  [[MEDIA:${item.id}]]  ${item.kind}  ${replaced ? '(updated)' : '(added)'}`);
  console.log(`  ${item.title}`);
  console.log(`  ${words}${item.licence ? ` · licence: ${item.licence.name}` : ''}`);
  if (item.note) console.log(`  ${item.note}`);
  if (!item.when) console.log('  (no "when" yet: say when a reply should use it, or the model will guess)');
}

async function add(work, entry, fetch) {
  const found = await lib.resolve(fetch, entry.url);
  const list = readList(work, entry.section);
  const { item, replaced } = addItem(list, found, entry);
  writeList(work, list);
  report(entry.section, item, replaced);
  return item;
}

async function main(argv, fetch = globalThis.fetch) {
  const a = args(argv);
  const cmd = a._[0];
  const work = typeof a.work === 'string' ? a.work : 'digital-plenitude';
  if (!fs.existsSync(path.join(ROOT, work))) throw new Error(`No work called ${work}`);

  if (cmd === 'add') {
    const section = Number(a.section);
    if (!Number.isInteger(section) || section < 1 || typeof a.url !== 'string') {
      throw new Error('add needs --section N and --url <address>');
    }
    await add(work, {
      section, url: a.url,
      when: typeof a.when === 'string' ? a.when : '',
      ...(typeof a.id === 'string' ? { id: lib.slug(a.id) } : {}),
      ...(typeof a.title === 'string' ? { title: a.title } : {}),
      ...(typeof a.date === 'string' ? { date: a.date } : {}),
      ...(typeof a.credit === 'string' ? { credit: a.credit } : {}),
    }, fetch);
    return;
  }

  if (cmd === 'bulk') {
    const file = a._[1];
    if (!file) throw new Error('bulk needs a file');
    const lines = fs.readFileSync(file, 'utf8').split('\n');
    let n = 0;
    for (const line of lines) {
      const entry = lib.parseBulkLine(line);
      if (!entry) continue;
      try { await add(work, entry, fetch); n++; } catch (err) { console.log(`FAILED ${line.trim()}: ${err.message}`); }
    }
    console.log(`\n${n} item(s) looked at.`);
    return;
  }

  if (cmd === 'check') {
    const which = a.section ? [Number(a.section)] : sections(work);
    const changed = [];
    for (const section of which) {
      const list = readList(work, section);
      for (const old of list.items.slice()) {
        let found;
        try { found = await lib.resolve(fetch, old.url); } catch (err) {
          // A network failure says nothing about the item: keep what the last check found.
          console.log(`section ${section}  ${old.id}  could not check (${err.message}); left as ${old.status}`);
          continue;
        }
        const { item } = addItem(list, found, {});
        if (item.status !== old.status) changed.push(`section ${section} ${item.id}: ${old.status} -> ${item.status}`);
        console.log(`section ${section}  ${item.id}  ${STATUS_WORDS[item.status] || item.status}`);
      }
      writeList(work, list);
    }
    console.log(changed.length ? `\nChanged since the last check:\n  ${changed.join('\n  ')}` : '\nNothing changed since the last check.');
    return;
  }

  if (cmd === 'search') {
    const query = a._.slice(1).join(' ');
    if (!query) throw new Error('search needs words to look for');
    const results = await lib.searchCommons(fetch, query, Number(a.limit) || 10);
    if (results.length === 0) console.log('Nothing found on Commons.');
    results.forEach((r, i) => {
      console.log(`${i + 1}. ${r.file}`);
      console.log(`   ${r.cleared ? 'can be shown' : 'card only'} · ${r.licence || 'licence unknown'}${r.artist ? ` · ${r.artist}` : ''}`);
      console.log(`   ${r.url}`);
    });
    if (results.length) console.log('\nTo add one: npm run media -- add --section N --url <address> --when "when the reply discusses ..."');
    return;
  }

  if (cmd === 'list') {
    const which = a.section ? [Number(a.section)] : sections(work);
    for (const section of which) {
      for (const item of readList(work, section).items) {
        console.log(`section ${section}  [[MEDIA:${item.id}]]  ${item.kind}  ${STATUS_WORDS[item.status] || item.status}  ${item.title}`);
      }
    }
    return;
  }

  console.log(fs.readFileSync(__filename, 'utf8').split('\n').slice(1, 12).map(l => l.replace(/^\/\/ ?/, '')).join('\n'));
}

if (require.main === module) {
  main(process.argv.slice(2)).catch((err) => { console.error(err.message); process.exit(1); });
}

module.exports = { main, addItem, readList, writeList, listFile };
