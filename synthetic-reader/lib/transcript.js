// Writes a completed session as both a structured JSON file (for tooling/diffing)
// and a readable Markdown transcript (for a human to skim). Private reflections are
// included in both — they were never sent to the Text model, but this is the test
// log, so they belong here in full.
'use strict';

const fs = require('fs');
const path = require('path');
const { formatAdditionsBold } = require('./markdownDiff');

function sanitizeForFilename(s) {
  return String(s).replace(/[^a-zA-Z0-9-]+/g, '-').replace(/^-+|-+$/g, '');
}

function runDirName(meta) {
  const stamp = meta.startedAt.replace(/[:.]/g, '-');
  return `${stamp}_${sanitizeForFilename(meta.textId)}_${sanitizeForFilename(meta.profileId)}_section${meta.startSectionIndex + 1}`;
}

function buildJson(meta, result) {
  return {
    meta,
    stopReason: result.stopReason,
    stopDetail: result.stopDetail,
    finalSectionNumber: result.finalSectionIndex + 1,
    turns: result.turns,
    // Actual reader contributions only (never continuation turns), keyed by
    // 1-based section number — what a later, separate evolve step reads back out
    // to preview a synthesis without ever touching production data. See
    // synthetic-reader/lib/evolveClient.js and evolve-cli.js.
    contributionsBySection: result.contributionsBySection || {},
  };
}

function formatTurnMarkdown(turn) {
  const lines = [`### Turn ${turn.turn} — section ${turn.sectionNumber} — action: \`${turn.action}\``];
  if (turn.readerMessage) lines.push('', `**Reader:** ${turn.readerMessage}`);
  if (turn.action === 'continue') lines.push('', '_(reader pressed Return to continue reading)_');
  if (turn.guideResponse) lines.push('', `**Guide:**`, '', turn.guideResponse);
  if (turn.navigatedTo) lines.push('', `_(reader navigated to section ${turn.navigatedTo})_`);
  if (turn.stopReason) lines.push('', `_(reader chose to finish: ${turn.stopReason})_`);
  if (turn.note) lines.push('', `_(${turn.note})_`);
  if (turn.privateReflection) {
    const p = turn.privateReflection;
    lines.push(
      '',
      '> **Private reflection** (never sent to the Text model)',
      `> understanding: ${p.understanding} · confusion: ${p.confusion} · interest: ${p.interest}`,
      `> ${p.note}`
    );
  }
  return lines.join('\n');
}

function buildMarkdown(meta, result) {
  const lines = [
    `# Synthetic reader session — ${meta.textId}, section ${meta.startSectionIndex + 1}`,
    '',
    `- Profile: ${meta.profileName} (\`${meta.profileId}\`)`,
    `- Edition: ${meta.edition}`,
    `- Reader model: ${meta.readerModel}`,
    `- Base URL: ${meta.baseUrl}`,
    `- Started: ${meta.startedAt}`,
    `- Turn limit: ${meta.maxTurns}`,
    '',
    `## Outcome`,
    '',
    `Stopped after ${result.turns.length} turn(s), ending in section ${result.finalSectionIndex + 1}.`,
    '',
    `**Stop reason:** ${result.stopReason}${result.stopDetail ? ` — ${result.stopDetail}` : ''}`,
    '',
  ];
  const contributedSections = Object.keys(result.contributionsBySection || {});
  lines.push(
    contributedSections.length > 0
      ? `Sections with actual reader contributions (evolvable): ${contributedSections.join(', ')}.`
      : 'No actual reader contributions were made this run (continuation-only, or navigation-only) — nothing here to evolve.',
    '',
    '## Turns',
    ''
  );
  for (const turn of result.turns) {
    lines.push(formatTurnMarkdown(turn), '');
  }
  return lines.join('\n');
}

/**
 * Writes session.json and transcript.md into a new timestamped subdirectory of
 * {outDir}. Returns the paths written.
 */
function writeRun(outDir, meta, result) {
  const dir = path.join(outDir, runDirName(meta));
  fs.mkdirSync(dir, { recursive: true });

  const jsonPath = path.join(dir, 'session.json');
  const mdPath = path.join(dir, 'transcript.md');
  fs.writeFileSync(jsonPath, JSON.stringify(buildJson(meta, result), null, 2) + '\n');
  fs.writeFileSync(mdPath, buildMarkdown(meta, result));

  return { dir, jsonPath, mdPath };
}

/**
 * Writes one dry-run evolution attempt as a self-contained, timestamped subfolder
 * of {sessionDir} (the directory holding that session's session.json/transcript.md)
 * — original.md, evolved.md, and evolve.json. Never overwrites a prior attempt:
 * the synthesis call isn't deterministic, so re-running against the same session
 * is expected to produce a folder per attempt, not a single file that clobbers the
 * last result.
 */
function writeEvolveRun(sessionDir, evolveMeta, original, revised) {
  const stamp = evolveMeta.startedAt.replace(/[:.]/g, '-');
  const dir = path.join(sessionDir, `evolve-${stamp}`);
  fs.mkdirSync(dir, { recursive: true });

  const originalPath = path.join(dir, 'original.md');
  const revisedPath = path.join(dir, 'evolved.md');
  const metaPath = path.join(dir, 'evolve.json');

  fs.writeFileSync(originalPath, original);
  // Keep the API's raw revised prose unchanged, but make this human-facing
  // comparison copy show additions in portable Markdown boldface.
  fs.writeFileSync(revisedPath, formatAdditionsBold(original, revised));
  fs.writeFileSync(
    metaPath,
    JSON.stringify(
      {
        ...evolveMeta,
        originalWordCount: original.split(/\s+/).filter(Boolean).length,
        revisedWordCount: revised.split(/\s+/).filter(Boolean).length,
      },
      null,
      2
    ) + '\n'
  );

  return { dir, originalPath, revisedPath, metaPath };
}

module.exports = { writeRun, writeEvolveRun, buildJson, buildMarkdown, runDirName };
