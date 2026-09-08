// Minimal hand-rolled CLI argument parsing — no extra dependency for something this
// small. Throws a plain Error with a usable message on any bad input; the CLI entry
// point is responsible for printing it and exiting non-zero.
'use strict';

const { listTextIds } = require('./textRegistry');
const { listProfileIds } = require('./profiles');
const { DEFAULT_BASE_URL } = require('./env');

const DEFAULTS = {
  text: 'plenitude',
  section: 1,
  profile: 'curious',
  turns: 10,
  baseUrl: DEFAULT_BASE_URL,
  edition: 'evolving',
  readerModel: null, // null means "use env/default", resolved by the caller
  out: null, // null means "use synthetic-reader/output", resolved by the caller
};

const HELP = `Usage: npm run synthetic-reader -- [options]

Options:
  --text <id>            Text to read. One of: ${listTextIds().join(', ')}. Default: ${DEFAULTS.text}
  --section <n>           1-based section number to start in. Default: ${DEFAULTS.section}
  --profile <id>          Reader profile. One of: ${listProfileIds().join(', ')}. Default: ${DEFAULTS.profile}
  --turns <n>             Maximum number of turns before the run stops automatically. Default: ${DEFAULTS.turns}
  --edition <name>        'evolving' (current collectively-shaped text) or 'original'. Default: ${DEFAULTS.edition}
  --base-url <url>        Base URL of the running InterText server. Default: ${DEFAULTS.baseUrl}
  --reader-model <name>   Overrides OPENAI_READER_MODEL for this run.
  --out <dir>             Output directory for the run's transcript. Default: synthetic-reader/output
  -h, --help              Show this help.

Never calls the evolve endpoint — synthetic runs cannot modify the evolving text.
`;

function parseArgs(argv) {
  const opts = { ...DEFAULTS };
  let i = 0;
  function next(flag) {
    i += 1;
    if (i >= argv.length) throw new Error(`${flag} requires a value.`);
    return argv[i];
  }
  while (i < argv.length) {
    const arg = argv[i];
    switch (arg) {
      case '-h':
      case '--help':
        return { help: true };
      case '--text':
        opts.text = next(arg);
        break;
      case '--section':
        opts.section = Number(next(arg));
        break;
      case '--profile':
        opts.profile = next(arg);
        break;
      case '--turns':
        opts.turns = Number(next(arg));
        break;
      case '--edition':
        opts.edition = next(arg);
        break;
      case '--base-url':
        opts.baseUrl = next(arg);
        break;
      case '--reader-model':
        opts.readerModel = next(arg);
        break;
      case '--out':
        opts.out = next(arg);
        break;
      default:
        throw new Error(`Unknown option "${arg}". Run with --help for usage.`);
    }
    i += 1;
  }

  if (!listTextIds().includes(opts.text)) {
    throw new Error(`--text must be one of: ${listTextIds().join(', ')} (got "${opts.text}")`);
  }
  if (!listProfileIds().includes(opts.profile)) {
    throw new Error(`--profile must be one of: ${listProfileIds().join(', ')} (got "${opts.profile}")`);
  }
  if (!Number.isInteger(opts.section) || opts.section < 1) {
    throw new Error(`--section must be a positive integer (got "${opts.section}")`);
  }
  if (!Number.isInteger(opts.turns) || opts.turns < 1) {
    throw new Error(`--turns must be a positive integer (got "${opts.turns}")`);
  }
  if (opts.edition !== 'evolving' && opts.edition !== 'original') {
    throw new Error(`--edition must be "evolving" or "original" (got "${opts.edition}")`);
  }

  return { help: false, ...opts };
}

module.exports = { parseArgs, DEFAULTS, HELP };
