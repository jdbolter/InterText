// Writes a completed session as both a structured JSON file (for tooling/diffing)
// and a readable Markdown transcript (for a human to skim). Private reflections are
// included in both — they were never sent to the Text model, but this is the test
// log, so they belong here in full.
'use strict';

const fs = require('fs');
const path = require('path');

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
    '## Turns',
    '',
  ];
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

module.exports = { writeRun, buildJson, buildMarkdown, runDirName };
