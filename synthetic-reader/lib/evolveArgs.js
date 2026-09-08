// Minimal hand-rolled CLI argument parsing for the evolve-preview command — same
// style as args.js, kept separate since the two commands take different options.
'use strict';

const { DEFAULT_BASE_URL } = require('./env');

const DEFAULTS = {
  session: null,
  section: null, // null means "use the session's own recorded default"
  baseUrl: DEFAULT_BASE_URL,
};

const HELP = `Usage: npm run synthetic-reader-evolve -- --session <path> [options]

Previews what the real synthesis prompt would do to a section, using the actual
contributions recorded in an already-completed synthetic-reader session — without
ever writing to the evolving text. Always starts from the pristine original text,
regardless of what real readers may have evolved it into since.

Options:
  --session <path>   Required. Path to a session's output directory, or its
                      session.json file directly (e.g. a folder under
                      synthetic-reader/output/).
  --section <n>       1-based section number to evolve. Defaults to the section
                      the reading session started in, if it has recorded
                      contributions; otherwise this is required.
  --base-url <url>    Base URL of the running InterText server. Default: ${DEFAULTS.baseUrl}
  -h, --help          Show this help.
`;

function parseEvolveArgs(argv) {
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
      case '--session':
        opts.session = next(arg);
        break;
      case '--section':
        opts.section = Number(next(arg));
        break;
      case '--base-url':
        opts.baseUrl = next(arg);
        break;
      default:
        throw new Error(`Unknown option "${arg}". Run with --help for usage.`);
    }
    i += 1;
  }

  if (!opts.session) {
    throw new Error('--session is required. Run with --help for usage.');
  }
  if (opts.section !== null && (!Number.isInteger(opts.section) || opts.section < 1)) {
    throw new Error(`--section must be a positive integer (got "${opts.section}")`);
  }

  return { help: false, ...opts };
}

module.exports = { parseEvolveArgs, DEFAULTS, HELP };
