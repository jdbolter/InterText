'use strict';
// Shows (or, on request, clears) a text's evolved sections, wherever the server keeps them:
// the Vercel database when .env.local configures it, otherwise evolved_sections.json.
//   npm run evolved -- show  --text digital-plenitude [--section 1]
//   npm run evolved -- reset --text digital-plenitude --yes     (clears that text's evolved sections only)
const fs = require('fs');
const path = require('path');

function args(argv) {
  const a = { command: argv[0], text: null, section: null, yes: false };
  for (let i = 1; i < argv.length; i += 1) {
    if (argv[i] === '--text') a.text = argv[++i];
    else if (argv[i] === '--section') a.section = Number(argv[++i]);
    else if (argv[i] === '--yes') a.yes = true;
  }
  if (!['show', 'reset'].includes(a.command) || !a.text) {
    throw new Error('Usage: npm run evolved -- show|reset --text <id> [--section <n>] [--yes]');
  }
  return a;
}

async function main() {
  const a = args(process.argv.slice(2));
  const file = path.join(__dirname, '..', 'evolved_sections.json');
  const kv = Boolean(process.env.KV_REST_API_URL);
  let redis = null;
  if (kv) {
    const { Redis } = require('@upstash/redis');
    redis = new Redis({ url: process.env.KV_REST_API_URL, token: process.env.KV_REST_API_TOKEN });
  }
  const read = async () => (kv ? (await redis.get(`evolved:${a.text}`)) || {} : (JSON.parse(fs.readFileSync(file, 'utf8'))[a.text] || {}));
  console.log(`Store: ${kv ? 'the Vercel database (shared with the live site)' : 'evolved_sections.json'}`);
  const evolved = await read();
  const indexes = Object.keys(evolved).map(Number).sort((x, y) => x - y);
  if (a.command === 'show') {
    if (indexes.length === 0) { console.log(`${a.text}: no evolved sections; readers get the original text.`); return; }
    console.log(`${a.text}: evolved sections ${indexes.map(i => i + 1).join(', ')}`);
    const which = a.section ? [a.section - 1] : indexes;
    for (const i of which) {
      if (!(i in evolved)) { console.log(`\nSection ${i + 1}: not evolved.`); continue; }
      console.log(`\n===== Section ${i + 1} (evolved) =====\n${evolved[i]}`);
    }
    return;
  }
  if (!a.yes) { console.log(`Would clear ${indexes.length} evolved section(s) of ${a.text}. Add --yes to do it.`); return; }
  if (kv) await redis.del(`evolved:${a.text}`);
  else { const all = JSON.parse(fs.readFileSync(file, 'utf8')); delete all[a.text]; fs.writeFileSync(file, JSON.stringify(all, null, 2)); }
  console.log(`Cleared the evolved sections of ${a.text}; readers get the original text again.`);
}

main().catch(err => { console.error(err.message); process.exitCode = 1; });
