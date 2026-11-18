# synthetic-reader

A CLI-only harness that drives InterText's real `/api/chat` endpoint with a simulated reader: an OpenAI model playing one of several reader personas. It never touches the reader's web page. The reading command (`synthetic-reader`) never calls `/api/evolve`, so a run cannot change the evolving text. A separate command, `synthetic-reader-evolve`, calls it only in dry-run mode, which never reads or writes the database.

## Why it exists

The text is served by Anthropic's Claude. The reader is played by a different provider so that the two roles are never one model talking to itself. The simulated reader sees what a real reader sees: the table of contents, a section's boxed opening and the conversation so far. It never sees `config.js`, the instructions, or the section files. `lib/publicContent.js` enforces this by reading titles and boxes only from a text's public `app.js`, run under a DOM stand-in. The knowledgeable profiles may also consult public web sources.

## An editorial loop

The harness is an instrument for improving the authored work and the reading experience, not only for testing the software. Repeated readings by different profiles show where a claim, transition or example is confusing; where the text repeats itself, loses momentum or stops early; which objections it does not answer; where section boundaries fail the argument; where the voice overexplains or gives the reader too little room; and what holds across profiles. The cycle:

1. Run comparable sessions against a known edition and section.
2. Read the transcripts and private reflections across profiles and runs.
3. Form an editorial hypothesis rather than treating any one reply as a verdict or score.
4. Revise the source prose, section boundaries, introductions or instructions as the evidence warrants.
5. Rerun the same conditions and compare.

A simulated reader argues from the text's own terms more than a person does, and has no lived experience to bring. The readings find assumptions, overstatements, repetition and gaps; they cannot show how real readers understand or respond, and are not a substitute for human testing.

## Quick start

You need:

1. **The server running locally:** `npm run dev` from the project root (or wherever `--base-url` points). It loads `.env.local`, so the API reads the current KV edition instead of falling back to the bundled seed.
2. **An OpenAI key:** `OPENAI_API_KEY=…` in `.env.local`. A key exported in the shell overrides it for one run.

```bash
npm run synthetic-reader -- --text digital-plenitude --profile curious --section 1 --turns 10
```

The run writes a timestamped folder under `synthetic-reader/output/` (gitignored).

## Options

```
--text <id>            plenitude | uncanny | remediation | digital-plenitude | blood-on-the-wall
                                                                    (default: plenitude)
--section <n>          1-based section to start in                  (default: 1)
--profile <id>         curious | skeptical | collaborative | general | student
                                                                    (default: curious)
--turns <n>            maximum turns before the run stops itself    (default: 10)
--edition <name>       evolving | original | editorial-spine | editorial-fund
                                                                    (default: evolving)
--base-url <url>       where the InterText server is running        (default: http://localhost:3000)
--reader-model <name>  overrides OPENAI_READER_MODEL for this run
--out <dir>            where to write the run's folder              (default: synthetic-reader/output)
-h, --help
```

- `evolving` reads the current edition a *Read the current text* reader gets; `original` reads the untouched authored text. The harness never contributes, so every run behaves like a non-contributing reader.
- `editorial-spine` and `editorial-fund` are the experiment editions (see `EDITORIAL-ARCHITECTURE.md`): the package's spine with and without fund entries, web search off, no KV, one packaged section. They need the `npm run dev` server; the editor on port 4173 cannot serve `/api/chat`. The CLI fails clearly for a section with no package.

## Environment

| Variable | Required | Default | Notes |
|---|:-:|---|---|
| `OPENAI_API_KEY` | yes | none | never printed, logged or written to disk |
| `OPENAI_READER_MODEL` | no | `gpt-5.6-terra` | overridable per run with `--reader-model` |

## Reader profiles

Each profile in `lib/profiles.js` is a natural-language persona given to the reader model as instructions, separate from any prompt in InterText's own configs, so the model decides in character what such a reader would do each turn. Shared framing lives in `lib/openaiReader.js`.

| Profile | Persona | Web search |
|---|---|:-:|
| `curious` | nonspecialist who follows closely, asks clarifying questions, brings in general reading and experience | no |
| `skeptical` | academic in an adjacent field who notices unsupported claims and asks for evidence and counterexamples | yes |
| `collaborative` | knowledgeable reader who wants the work stronger, attentive to prose, rhythm and movement, and does not reflexively ask for evidence | yes |
| `general` | the educated general reader the book is written for, who reads for the argument, rarely nitpicks, and writes one to three plain spoken sentences | yes |
| `student` | second-year undergraduate with the chapter assigned, who asks what terms mean and says the argument back to check it | no |

Search is bounded: at most two search calls per turn, used to test a consequential claim, find primary evidence or check a comparison, and not on every turn. When research informs a message, the reader names the source and URL so it stays visible in the transcript. Search results never expose the text's instructions or source files.

To add a profile, add an entry to `PROFILES` in `lib/profiles.js` with `id`, `name`, `description`, `allowWebSearch` and `instructions`, and list it in the usage text and tests.

## What is recorded

Each turn the reader chooses one structured action: `message`, `continue` (Return with nothing typed), `navigate` (to another section) or `finish`; and writes a private reflection (`understanding`, `confusion`, `interest`, a free-text note). The reflection goes in the transcript and is never sent to `/api/chat`; a test asserts this.

A run folder contains:

- `session.json`: the run's metadata, every turn and reflection, the stop reason, `contributionsBySection`, and for editorial editions `fundPresentationsBySection` and, per turn, what was offered, what the text reported using, the package version, and whether its delivery was valid.
- `transcript.md`: the same laid out for reading, with reflections, notes, and the draft before revision.

## Measuring a round

```bash
npm run reading-report -- <dir> [<dir> …] [--limit 250] [--json]
```

reads every `session.json` under the directories and prints a line per run and a total: replies (to messages and Return turns); words per reply and how many run over the limit; notes per reply; replies in which the text speaks of its own argument or section; seven-word runs and closing sentences repeated across a run; the reader's private understanding, interest and confusion; how many replies the revision pass rewrote and why it did not; and the share of input tokens read from the prompt cache. It counts generated text and never quotes it.

## Previewing an evolution

```bash
npm run synthetic-reader-evolve -- --session synthetic-reader/output/<run-folder> [--section <n>]
```

sends a session's recorded contributions for a section through the config's `synthesisInstructions` and model with `dryRun: true`, so `api/evolve.js` skips KV entirely. The baseline is always the pristine authored text, so sessions are comparable with one another. Nothing is persisted. Each attempt writes its own `evolve-<timestamp>/` folder (`original.md`, `evolved.md`, `evolve.json`) beside the session, since the rewrite is not deterministic. A section with no recorded contributions is reported, not sent. To see what the editorial passes would do to a session, use `npm run editorial-propose` (see `editorial/README.md`).

Only `lib/evolveClient.js` and `evolve-cli.js` may reference the evolve endpoint, and every call they make must include `dryRun: true`; a repository-wide test enforces both.

## Tests

`npm test` runs `synthetic-reader/test/` with Node's test runner, with no API key, server or network. It covers argument parsing, the action schema, the profiles, the public-content extractor (against the real `app.js` files, read-only), the HTTP client's error handling, the OpenAI wrapper (against a fake client, including the retry on an invalid action), the session state machine, the transcript writer, the session-file loader, the dry-run evolve client, and the guard that keeps the evolve endpoint out of everything else.

## What the harness never does

- Call `/api/evolve` from the reading command, under any flag or path.
- Let any evolve call persist anything.
- Send a private reflection to `/api/chat` or `/api/evolve`.
- Read a text's `config.js` or `source_texts/` to build the reader's context.
- Modify a text's `public/` folder.
