# InterText editorial architecture

The data model, storage, editorial passes and reading modes behind the evolving edition. For the design as a reader meets it, see [`CURRENT-DESIGN.md`](CURRENT-DESIGN.md).

## Spine and fund

A section is not one string that is rewritten and enlarged. Model-generated additions can be intelligent and supportive and still damage the balance and rhythm of a continuous essay, because a model tends to apply an argument to more cases and add more qualifications whether or not they belong in the main movement. A section therefore has two layers:

- **Narrative spine:** the concise, coherent route through the section, as ordered passages with stable IDs.
- **Fund:** optional material (clarification, example, qualification, counterargument, evidence, extension) that the text may select for a particular reader and moment.

The reader does not see the layers as apparatus; the text performs them as one voice. Every section of every text is packaged: the 49 sections of `digital-plenitude` and the 6 of `intertext-paper`.

## Source format

```text
editorial/
├── content/<work-id>/
│   ├── work.json                          work and section IDs, titles, order, package paths
│   └── sections/<section-id>/
│       ├── section.json                   version metadata and each fund entry's metadata
│       ├── spine.md                       the spine, with a marker before each passage
│       ├── fund/*.md                      each entry's prose
│       └── provenance/                    tracked copies of source sessions, where kept
├── schema/                                work-manifest and section-package JSON schemas
├── lib/                                   content build, proposal arguments and store
├── build-data.js  serve.js  kv-admin.js  propose-session.js
├── index.html  app.js  style.css          the local author editor
├── data/                                  generated, validated browser snapshots (commit them)
├── proposals/                             gitignored proposal bundles
├── exports/                               exported KV snapshots
├── research/                              a working research dataset, not loaded by the text
└── test/
```

A spine passage is marked in the Markdown:

```markdown
<!-- intertext:passage great-divide-p01 -->

Passage prose...
```

## Compiled section package

`npm run editorial-build` (`editorial/lib/content.js`) validates every manifest, parses the marked passages and fund Markdown, builds a complete snapshot, validates it against `section-package.schema.json` plus relational checks (unique IDs, anchors that name real passages, consistent sources), and writes it twice: to `editorial/data/` for the author editor, and to `api/editorial-seed/` as the runtime baseline, because `editorial/` is excluded from deployment.

A snapshot carries work, edition, section and version identity; the parent version and creation time; the source; the ordered spine passages; the fund entries; and a change summary.

A fund entry has:

- `id`, `title`, and one or more passage `anchors`;
- `kind`: clarification, example, qualification, counterargument, evidence or extension;
- `status`: `candidate` (under evaluation, not offered to readers), `accepted` (offered), `superseded` or `rejected` (kept as records);
- `markdown` prose and a natural-language `useWhen` cue;
- optional `thread`: a stable thread name and a positive order;
- `sourceStatus`: `not-required`, `needs-verification` or `verified`, and zero or more descriptive HTTP(S) `sources`;
- `provenance`: the kind of origin, session, turns and local artifact.

Statuses are editorial metadata, not evidence that anything was fact-checked. The build rejects duplicate IDs, missing Markdown, invalid entry shapes, anchors that name no passage, non-HTTP(S) links, and entries marked verified without a source.

## Storage

Each packaged section's current state lives in the Vercel KV database as immutable snapshots and a head pointer:

```text
section-head:<workId>:<editionId>:<sectionId>             the current version ID
section-version:<workId>:<editionId>:<sectionId>:<id>     one self-contained snapshot
editorial-update:<workId>:<sectionId>:<updateId>          the exchange, proposal and review behind a version
```

A head is advanced by a Lua transaction that checks the proposed parent is still the head, writes the snapshot and its update record, and moves the pointer atomically. A conflicting save is regenerated once against the new head and never overwrites another reader's change. Unchanged fund entries are duplicated across snapshots so that a snapshot is easy to inspect, export and restore. When a section has no head, readings use the bundled seed, and `npm run editorial-kv -- init` creates the head from the seed.

The database is operational state, not the archive: `npm run editorial-kv -- export` writes a snapshot to `editorial/exports/`.

The older whole-section store (`evolved:<textId>` in KV, or `evolved_sections.json` locally) is a fallback for a section with no package. Every section now has one, so it is not reached; `npm run evolved` inspects or clears it.

## Reading

`api/chat.js` serves a turn in one of four editions, sent by the page as `edition`:

- `original`: the authored section file, ignoring all evolved versions and the fund.
- `evolving`: the current KV version of the section (or the seed). Only accepted fund entries are offered. The page remembers the version ID it received for a section, so a head change cannot alter a reading halfway through.
- `editorial-spine` and `editorial-fund`: local experiment editions (synthetic-reader only; the public page never requests them). Both give the text the packaged spine with web search off and no outside examples; the fund edition also offers candidate and accepted entries, so fund availability is the controlled difference. They use no KV and never call `/api/evolve`.

A request carries the current section's conversation plus short private summaries of the other sections visited, not the whole transcript. The text is given the section's marked spine, the offered fund entries and their anchors, and uses them with the conversation to pace the material.

**How the text reports its choices.** The text reports which offered entries it used, whether the section is complete, and a private summary of the section so far.

- *Markers* (`editorialDelivery: 'markers'`, set in each text's `config.js`): the text writes `[[FUND:id]]` after a sentence an entry informs and a private `[[MEMORY: …]]` line; the server reads and removes them, and the reply then goes through the whole pipeline (revision pass, citations, media). This is used because `claude-sonnet-5-5` does not support forced tool calls.
- *Forced tool* (the two experiment editions): the text must call a structured delivery tool carrying the prose, the IDs used and the completion flag; the API rejects a missing or malformed call, and IDs are validated against the entries actually offered. This runs on `claude-sonnet-5`.

Either way the report is a model's own account of its use, so the visible prose is the final evidence.

## Evolution

`api/evolve.js` runs when a contributing reader finishes a section:

1. It initializes the section's head from the seed if there is none.
2. **Proposal pass** (`api/_lib/editorial-evolution.js`): compares the conversation with the current spine and fund and proposes no change, spine revisions, new fund entries, revisions or supersessions, or attached sources.
3. **Review pass:** a separate call judges every operation for fidelity, relevance, duplication, prose and rhythm, proportion, source needs, and the contextual and chronological eligibility of each anchor (an entry may not be anchored before the passage that introduces what it presupposes). It assigns additions to accepted, candidate or rejected, approves safe operations independently, and may not accept material marked `needs-verification` or promote an unverified candidate.
4. **Structural checks** reject invented source URLs, unstable passage IDs, excessive growth, invalid anchors and the acceptance of unverified material.
5. Approved operations become one child snapshot, published through the head transaction. If nothing survives, the head is unchanged. Corrections and proportionate changes go into the spine; optional material goes into the fund.

For both texts both passes run on `claude-sonnet-5-5` and return checked JSON; a text that does not set `editorialDelivery: 'markers'` would run them on `claude-sonnet-5` with forced tools. Routine decisions are the model's; the author sets policy, inspects what was published, and edits or supersedes material in the editor.

A request with `dryRun: true` never reads or writes KV: it rewrites the section from the pristine text with the config's `synthesisInstructions`. Only `synthetic-reader-evolve` uses it.

## Author editor

`npm run editorial-preview` builds, then serves `editorial/` on `127.0.0.1:4173` (`EDITORIAL_PORT` changes the port) with `no-store`; it serves nothing outside `editorial/`. It can switch among works, show every section and whether it is packaged, show the spine as prose with stable passage labels and the fund entries attached to each, edit spine prose without changing passage IDs, add fund entries, edit every fund field, show whether a section was loaded from the live KV head or the seed, and publish a validated `author-revised` child with a stale-head check. Existing passage IDs, entry IDs and provenance are protected, and entries are rejected or superseded rather than deleted. It does not call a model, restore or compare versions, or export from a button. Without KV settings it is read-only. The whole directory is excluded in `.vercelignore` and must stay so until the editor has authentication and a policy for the manuscript and provenance data it holds.

## Commands

```bash
npm run editorial-build          # validate and compile
npm run editorial-preview        # build, then serve the editor
npm run editorial-kv -- status --text digital-plenitude --section 1
npm run editorial-kv -- init   --text digital-plenitude --section 1
npm run editorial-kv -- export --text digital-plenitude --section 1
npm run editorial-propose -- --session <synthetic run folder> --section <n>
npm run dev                      # local API, required by reader experiments
npm test
```

The tests cover exact preservation of authored prose in the packages, the runtime seed, the accepted-only reader path, proposal and review validation, immutable publication, conflict detection, the source allowlist, and the candidate downgrade rules, all offline.
