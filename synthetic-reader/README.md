# synthetic-reader

A CLI-only testing harness that drives InterText's real `/api/chat` conversation
endpoint with a simulated reader — an OpenAI model role-playing one of a few reader
personas — instead of a human. It never touches the reader-facing web interface,
and the reading command (`synthetic-reader`) never calls `/api/evolve` at all — a
run can't modify production or evolving text data. A separate, explicit follow-up
command, `synthetic-reader-evolve`, *does* call the evolve endpoint, but only in a
dry-run mode that never reads or writes the live database — see "Previewing an
evolution" below.

## Why this exists

InterText's guide voice is served by Anthropic's Claude ("the Text model"). This
harness uses a *different* provider (OpenAI) to play the reader, so the two roles
are never the same model talking to itself. The simulated reader only ever sees
what a real reader would see on screen — the table of contents, a section's opening
passage, and the conversation so far — never `config.js`'s instructions, the raw
essay text, or anything else hidden from a human reader. See
`lib/publicContent.js` for how that's enforced (it reads only from a text's public
`app.js`, never its config module or source-text folder).

## Quick start (live session)

You need:
1. **The InterText server running locally**: `vercel dev` from the project root (or wherever `--base-url` points).
2. **An OpenAI API key**: add `OPENAI_API_KEY=sk-...` to `.env.local` at the project root — the same file that already holds `ANTHROPIC_API_KEY` and the KV vars. `npm run synthetic-reader` auto-loads it via Node's `--env-file-if-exists` flag, the same way `vercel dev` already loads it for the web app. (An `export OPENAI_API_KEY=...` in your shell, or an inline prefix, still overrides the file if you want to use a different key for one run.)

Then, from the project root:

```bash
npm run synthetic-reader -- --profile curious --section 1 --turns 10
```

This reads Plenitude, section 1, as a curious nonspecialist, for up to 10 turns,
and writes a transcript to `synthetic-reader/output/` (git-ignored — nothing here
is meant to be committed).

## Options

```
--text <id>            plenitude | uncanny | blood-on-the-wall   (default: plenitude)
--section <n>          1-based section number to start in         (default: 1)
--profile <id>         curious | skeptical | impatient | passive  (default: curious)
--turns <n>             maximum turns before the run stops itself (default: 10)
--edition <name>        evolving | original                       (default: evolving)
--base-url <url>        where the InterText server is running     (default: http://localhost:3000)
--reader-model <name>   overrides OPENAI_READER_MODEL for this run
--out <dir>             where to write the transcript              (default: synthetic-reader/output)
-h, --help              show usage
```

`--edition original` exercises the same "read the original, unaffected by any
reader's evolution" path a human reader gets from the entry consent screen's third
option (see the root `INTERTEXT-DESIGN-NOTES.md`, §3, and `uncanny/CLAUDE.md`,
"Entry Consent"). The harness never contributes and never sends anything to
`/api/evolve`, so unlike a real "Contribute" reader it doesn't need a separate
consent flag — every synthetic run behaves like a non-contributing reader choosing
between those two editions.

## Environment variables

| Variable              | Required | Default          | Notes                                   |
|------------------------|:--------:|------------------|------------------------------------------|
| `OPENAI_API_KEY`       | yes      | —                | Never printed, logged, or written to disk. |
| `OPENAI_READER_MODEL`  | no       | `gpt-5.6-terra`  | Overridable per run with `--reader-model`. |

## Reader profiles

Four are included out of the box (`lib/profiles.js`): **curious** (curious
nonspecialist), **skeptical** (skeptical academic), **impatient** (impatient
reader), and **passive** (passive reader). Each is a natural-language persona given
to the OpenAI model as its own instructions — a wholly separate prompt from
anything in InterText's own `config.js` files — so the model decides in character
what a reader like that would actually do each turn, rather than the harness
scripting fixed behavior.

To add a profile, add an entry to `PROFILES` in `lib/profiles.js` with an `id`,
`name`, `description`, and a paragraph of `instructions` describing how that reader
behaves.

## What gets recorded

Each turn, the reader model chooses one structured action —
`message` (send something), `continue` (press Return with nothing typed),
`navigate` (jump to a different section), or `finish` (end the session) — plus a
private reflection: `understanding`, `confusion`, `interest`, and a free-text
`note`. The private reflection is written to the transcript in full, but it is
**never** included in anything sent to `/api/chat` — the Text model only ever sees
what an actual reader's browser would send it. `lib/session.js`'s
`private reflections are recorded but never sent in any request body` test asserts
exactly this.

A run produces a timestamped folder under `synthetic-reader/output/` (or `--out`)
containing:
- `session.json` — full structured record: run metadata, every turn, every private reflection, the final stop reason, and `contributionsBySection` — the reader's actual contributions (never continuation turns), keyed by 1-based section number, in the same `{role, content}` shape `/api/evolve` expects. This is what `synthetic-reader-evolve` (below) reads back out.
- `transcript.md` — the same information laid out for a human to skim, with private reflections set off as blockquotes, plus a line naming which sections (if any) had real contributions worth evolving.

## Previewing an evolution

After reading a transcript and deciding a session is worth exploring further:

```bash
npm run synthetic-reader-evolve -- --session synthetic-reader/output/<run-folder>
```

This takes that session's actual recorded contributions for a section (defaulting
to the section the reading started in — pass `--section <n>` to pick a different
one) and sends them through the **real** `synthesisInstructions` prompt and model —
the exact same code path a real "Contribute" reader's session hits — but with
`dryRun: true`, which makes `api/evolve.js` skip its KV read/write entirely.
Concretely:
- **The baseline is always the pristine authored text**, never whatever's currently
  live in production — so different sessions and profiles are evolving against the
  same fixed starting point and are actually comparable to each other, not to a
  moving target that depends on real reader traffic.
- **Nothing is persisted, ever**, regardless of how the synthesis turns out.
- Writes a self-contained, timestamped subfolder next to that session's own
  `session.json` — `evolve-<timestamp>/original.md`, `evolved.md`, and
  `evolve.json` (model, word counts, timestamps). Each attempt gets its own
  subfolder rather than overwriting the last one, since the synthesis call isn't
  deterministic — running it twice on the same session can genuinely produce two
  different revisions, and that variance is worth being able to see.

If the session has no recorded contributions for the requested section (e.g. a
`passive`-profile run that only ever pressed Return), it says so and lists which
sections (if any) do have contributions, rather than sending an empty conversation
to the synthesis prompt.

Only `lib/evolveClient.js` and `evolve-cli.js` are allowed to reference the evolve
endpoint at all — enforced by a repo-wide test — and every call they make is
checked to literally include `dryRun: true`. The main reading path (`chatClient.js`,
`session.js`, the `synthetic-reader` command) remains structurally incapable of
reaching that endpoint, exactly as before.

## Offline tests (no live API calls, no running server)

```bash
npm test
```

This runs `synthetic-reader/test/` under Node's built-in test runner. It covers:
argument parsing and validation for both commands, the reader-action JSON Schema
and its per-action validation rules, all four profiles, the section-metadata
extractor (against the real `app.js` files — this is the one place these tests
touch the real repo, and only ever reads, never writes), the HTTP client's error
handling (server unreachable, non-2xx, non-JSON — via a stubbed `fetch`), the
OpenAI reader wrapper (via a fake client with a scripted `.responses.create`,
including the retry-on-invalid-action path and 401/404 error wrapping), the full
session state machine (message/continue/navigate/finish, section auto-advance,
image-token handling, per-section contribution tracking, and graceful recovery
from a mid-run request failure — via a scripted fake reader and a recording fake
chat client), the transcript writer (including the evolve-preview file writer),
the session-file loader used by `synthetic-reader-evolve`, the dry-run evolve
client, and a repository-wide guard asserting no implementation file under
`synthetic-reader/` mentions the evolve endpoint except the two files that
deliberately implement the dry-run preview — and that every call they make is
checked to actually be dry-run.

None of this needs `OPENAI_API_KEY`, a running server, or network access.

## Running a live session

1. From the project root: `vercel dev` (leave it running).
2. Make sure `OPENAI_API_KEY` is in `.env.local` (see "Quick start" above) — or `export OPENAI_API_KEY=sk-...` in your shell for a one-off override.
3. `npm run synthetic-reader -- --profile skeptical --text uncanny --section 3 --turns 15`
4. Read the printed per-turn summary as it runs, then open the written `transcript.md` under `synthetic-reader/output/`.
5. Optionally, preview an evolution from that session: `npm run synthetic-reader-evolve -- --session synthetic-reader/output/<run-folder>` (see "Previewing an evolution" above).

If the server isn't running, or the API key is missing/invalid, the harness fails
fast with a specific, actionable message rather than a stack trace — see
`lib/env.js` and `lib/chatClient.js`.

## What this harness will never do

- Let the `synthetic-reader` reading command call `/api/evolve`, under any flag or code path (enforced by a repo-wide test, not just by convention) — evolution is only ever reachable via the separate `synthetic-reader-evolve` command.
- Let *any* evolve-endpoint call, from either command, actually persist anything — `synthetic-reader-evolve` always sends `dryRun: true`, which `api/evolve.js` guarantees skips its KV read and write entirely (also enforced by a repo-wide test).
- Send a reader's private reflection to `/api/chat` or `/api/evolve`.
- Read a text's `config.js` or `source_texts/` to build the reader model's context — only the same `public/app.js` a browser loads.
- Modify anything under a text's `public/` folder — this is a read-only consumer of the existing web interface.
