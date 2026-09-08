// Resolves and loads a previously-written session.json (see transcript.js's
// writeRun), for evolve-cli.js to read a session's recorded contributions back out
// of. Read-only — this never writes anything.
'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Accepts either a run's output directory or its session.json file directly.
 * Returns { sessionDir, sessionPath, data }, where `data` is the parsed JSON.
 * Throws a clear error if the path doesn't exist or isn't a valid session file.
 */
function loadSessionFile(sessionArg) {
  let sessionPath = sessionArg;
  let stat;
  try {
    stat = fs.statSync(sessionArg);
  } catch {
    throw new Error(`--session path does not exist: ${sessionArg}`);
  }
  if (stat.isDirectory()) {
    sessionPath = path.join(sessionArg, 'session.json');
    if (!fs.existsSync(sessionPath)) {
      throw new Error(`No session.json found in ${sessionArg} — pass the run directory a synthetic-reader run wrote, or the session.json file directly.`);
    }
  }

  let raw;
  try {
    raw = fs.readFileSync(sessionPath, 'utf8');
  } catch (err) {
    throw new Error(`Could not read ${sessionPath}: ${err.message}`);
  }

  let data;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    throw new Error(`${sessionPath} is not valid JSON: ${err.message}`);
  }

  if (!data.meta || typeof data.meta.textId !== 'string' || typeof data.meta.startSectionIndex !== 'number') {
    throw new Error(`${sessionPath} doesn't look like a synthetic-reader session.json (missing meta.textId/startSectionIndex).`);
  }
  if (!data.contributionsBySection) {
    throw new Error(
      `${sessionPath} has no recorded contributions (it was likely created before this feature existed). ` +
        're-run the reading session with the current synthetic-reader to generate a compatible file.'
    );
  }

  return { sessionDir: path.dirname(sessionPath), sessionPath, data };
}

module.exports = { loadSessionFile };
