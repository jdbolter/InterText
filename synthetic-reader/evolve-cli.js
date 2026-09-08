#!/usr/bin/env node
// CLI entry point for previewing what the real synthesis prompt would do to a
// section, using an already-completed synthetic-reader session's actual
// contributions — without ever writing to the evolving text. Separate from the
// main `synthetic-reader` command on purpose: you decide, after reading a
// session's transcript, whether it's worth spending an evolve call on.
'use strict';

const { parseEvolveArgs, HELP } = require('./lib/evolveArgs');
const { loadSessionFile } = require('./lib/sessionFile');
const chatClient = require('./lib/chatClient');
const { postEvolveDryRun } = require('./lib/evolveClient');
const { writeEvolveRun } = require('./lib/transcript');

async function main(argv) {
  const opts = parseEvolveArgs(argv);
  if (opts.help) {
    process.stdout.write(HELP);
    return;
  }

  const { sessionDir, sessionPath, data } = loadSessionFile(opts.session);
  const sectionNumber = opts.section || data.meta.startSectionIndex + 1;
  const conversationHistory = data.contributionsBySection[sectionNumber];

  if (!conversationHistory || conversationHistory.length === 0) {
    const available = Object.keys(data.contributionsBySection);
    throw new Error(
      available.length > 0
        ? `Section ${sectionNumber} has no recorded contributions in ${sessionPath}. ` +
          `Sections that do: ${available.join(', ')}. Pass --section to pick one.`
        : `${sessionPath} has no reader contributions in any section (continuation/navigation-only run) — nothing to evolve.`
    );
  }

  await chatClient.checkServerReachable(opts.baseUrl);

  process.stdout.write(
    `Previewing evolution — text: ${data.meta.textId}, section: ${sectionNumber}, ` +
      `${Math.floor(conversationHistory.length / 2)} contribution turn(s) from ${sessionPath}\n`
  );

  const startedAt = new Date().toISOString();
  const { original, revised } = await postEvolveDryRun(opts.baseUrl, {
    sectionIndex: sectionNumber - 1,
    conversationHistory,
    textId: data.meta.textId,
  });

  const evolveMeta = {
    sourceSession: sessionPath,
    textId: data.meta.textId,
    sectionNumber,
    profileId: data.meta.profileId,
    baseUrl: opts.baseUrl,
    startedAt,
    finishedAt: new Date().toISOString(),
  };

  const { dir } = writeEvolveRun(sessionDir, evolveMeta, original, revised);

  process.stdout.write(
    `\nDone. Nothing was written to the evolving text — this is a preview only.\n` + `Written to: ${dir}\n`
  );
}

main(process.argv.slice(2)).catch((err) => {
  process.stderr.write(`\nsynthetic-reader-evolve failed: ${err.message}\n`);
  process.exitCode = 1;
});
