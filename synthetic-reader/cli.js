#!/usr/bin/env node
// CLI entry point for the synthetic-reader harness. Wires together argument
// parsing, environment checks, the real text's public section data, an OpenAI
// reader, and the session loop — then writes the transcript. Kept thin
// deliberately: all the actual logic lives in synthetic-reader/lib/ and is
// covered by synthetic-reader/test/ without needing a live server or API key.
'use strict';

const path = require('path');

const { parseArgs, HELP } = require('./lib/args');
const { getText } = require('./lib/textRegistry');
const { getProfile } = require('./lib/profiles');
const { extractPublicSectionData } = require('./lib/publicContent');
const { requireOpenAiApiKey, getReaderModel } = require('./lib/env');
const chatClient = require('./lib/chatClient');
const { createReader } = require('./lib/openaiReader');
const { runSession } = require('./lib/session');
const { writeRun } = require('./lib/transcript');

const DEFAULT_OUT_DIR = path.join(__dirname, 'output');

async function main(argv) {
  const opts = parseArgs(argv);
  if (opts.help) {
    process.stdout.write(HELP);
    return;
  }

  const textEntry = getText(opts.text);
  const profile = getProfile(opts.profile);
  const { sections } = extractPublicSectionData(textEntry);

  if (opts.section > sections.length) {
    throw new Error(
      `--section ${opts.section} is out of range for "${textEntry.id}" — it has ${sections.length} section(s).`
    );
  }

  const apiKey = requireOpenAiApiKey();
  const readerModel = opts.readerModel || getReaderModel();

  await chatClient.checkServerReachable(opts.baseUrl);

  const OpenAI = require('openai');
  const client = new OpenAI({ apiKey });
  const reader = createReader({ client, model: readerModel, profile });

  const startedAt = new Date().toISOString();
  process.stdout.write(
    `Starting synthetic reader — text: ${textEntry.id}, section: ${opts.section}, profile: ${profile.id}, ` +
      `edition: ${opts.edition}, model: ${readerModel}, turns: ${opts.turns}\n`
  );

  const result = await runSession({
    textEntry,
    sections,
    startSectionIndex: opts.section - 1,
    edition: opts.edition,
    maxTurns: opts.turns,
    baseUrl: opts.baseUrl,
    reader,
    onTurn: (turn) => {
      const summary =
        turn.action === 'message'
          ? `sent a message`
          : turn.action === 'continue'
          ? `continued reading${turn.advancedSection ? ` (advanced to section ${turn.sectionAfter})` : ''}`
          : turn.action === 'navigate'
          ? turn.navigatedTo
            ? `navigated to section ${turn.navigatedTo}`
            : `tried an invalid navigation`
          : `finished: ${turn.stopReason}`;
      process.stdout.write(`  turn ${turn.turn} (section ${turn.sectionNumber}): ${summary}\n`);
    },
  });

  const meta = {
    textId: textEntry.id,
    startSectionIndex: opts.section - 1,
    profileId: profile.id,
    profileName: profile.name,
    edition: opts.edition,
    readerModel,
    baseUrl: opts.baseUrl,
    maxTurns: opts.turns,
    startedAt,
    finishedAt: new Date().toISOString(),
  };

  const outDir = opts.out || DEFAULT_OUT_DIR;
  const { dir } = writeRun(outDir, meta, result);

  process.stdout.write(
    `\nDone. Stop reason: ${result.stopReason}. ${result.turns.length} turn(s) recorded.\n` +
      `Transcript written to: ${dir}\n`
  );
}

main(process.argv.slice(2)).catch((err) => {
  process.stderr.write(`\nsynthetic-reader failed: ${err.message}\n`);
  process.exitCode = 1;
});
