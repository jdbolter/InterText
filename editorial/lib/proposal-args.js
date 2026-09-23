'use strict';

const DEFAULT_MODEL = 'claude-sonnet-5';

const HELP = `Usage: npm run editorial-propose -- --session <path> [options]

Runs the existing two-pass spine-and-fund editorial process against a completed
synthetic-reader session and saves a local proposal for author review. It reads the
current section head when KV is configured, but never initializes or writes KV.

Options:
  --session <path>   Required. Synthetic-reader output directory or session.json.
  --section <n>      1-based section number. Defaults to the session's start section.
  --model <name>     Anthropic model for both editorial passes. Default: ${DEFAULT_MODEL}
  -h, --help         Show this help.
`;

function parseProposalArgs(argv) {
  const options = { session: null, section: null, model: DEFAULT_MODEL };
  let index = 0;
  function next(flag) {
    index += 1;
    if (index >= argv.length) throw new Error(`${flag} requires a value.`);
    return argv[index];
  }
  while (index < argv.length) {
    const argument = argv[index];
    if (argument === '-h' || argument === '--help') return { help: true };
    if (argument === '--session') options.session = next(argument);
    else if (argument === '--section') options.section = Number(next(argument));
    else if (argument === '--model') options.model = next(argument);
    else throw new Error(`Unknown option "${argument}". Run with --help for usage.`);
    index += 1;
  }
  if (!options.session) throw new Error('--session is required. Run with --help for usage.');
  if (options.section !== null && (!Number.isInteger(options.section) || options.section < 1)) {
    throw new Error('--section must be a positive integer.');
  }
  if (!options.model.trim()) throw new Error('--model must not be empty.');
  return { help: false, ...options };
}

module.exports = { DEFAULT_MODEL, HELP, parseProposalArgs };
