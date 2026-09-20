#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const {
  ensureSectionInitialized,
  loadCurrentSection,
} = require('../api/lib/editorial-store');

function parseArgs(argv) {
  const args = { command: argv[0], textId: null, section: null, out: null };
  for (let index = 1; index < argv.length; index += 1) {
    const flag = argv[index];
    const value = argv[index + 1];
    if (flag === '--text') args.textId = value;
    else if (flag === '--section') args.section = Number(value);
    else if (flag === '--out') args.out = value;
    else throw new Error(`Unknown argument ${flag}`);
    index += 1;
  }
  if (!['status', 'init', 'export'].includes(args.command)) {
    throw new Error('Usage: editorial-kv <status|init|export> --text <id> --section <1-based> [--out <path>]');
  }
  if (!args.textId || !Number.isInteger(args.section) || args.section < 1) {
    throw new Error('--text and a positive --section are required');
  }
  return args;
}

function summary(current) {
  const statuses = ['accepted', 'candidate', 'superseded', 'rejected'];
  return {
    source: current.source,
    workId: current.sectionPackage.workId,
    sectionId: current.sectionPackage.sectionId,
    sectionOrder: current.sectionPackage.sectionOrder,
    versionId: current.sectionPackage.versionId,
    parentVersionId: current.sectionPackage.parentVersionId,
    passageCount: current.sectionPackage.spine.length,
    fundCounts: Object.fromEntries(statuses.map(status => [
      status,
      current.sectionPackage.fundEntries.filter(entry => entry.status === status).length,
    ])),
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const options = { textId: args.textId, sectionIndex: args.section - 1 };
  let current;
  if (args.command === 'init') {
    current = await ensureSectionInitialized(options);
    if (!current) throw new Error('That section has no spine-and-fund package');
  } else {
    current = await loadCurrentSection(options);
    if (!current) throw new Error('That section has no spine-and-fund package');
  }

  if (args.command === 'export') {
    const outputPath = path.resolve(args.out || path.join(
      process.cwd(),
      'editorial',
      'exports',
      `${current.sectionPackage.workId}-${current.sectionPackage.sectionId}-${current.sectionPackage.versionId}.json`
    ));
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, `${JSON.stringify(current.sectionPackage, null, 2)}\n`, { mode: 0o600 });
    process.stdout.write(`${JSON.stringify({ ...summary(current), outputPath }, null, 2)}\n`);
    return;
  }
  process.stdout.write(`${JSON.stringify(summary(current), null, 2)}\n`);
}

main().catch(error => {
  process.stderr.write(`editorial-kv failed: ${error.message}\n`);
  process.exitCode = 1;
});
