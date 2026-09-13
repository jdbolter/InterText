# InterText editorial architecture

**Status, 2026-09-13:** the universal local content model, validated build, and
read-only editorial workspace are implemented. The public reading engine, the
synthetic-reader harness, and the live KV database do **not** yet consume this model.
This document records both the agreed direction and the implementation boundary so
the work can be resumed by another model or on another computer without relying on
conversation history.

## The governing distinction: spine and fund

Repeated synthetic readings showed that model-generated additions can be intelligent
and supportive while damaging the balance and rhythm of a continuous essay. A model
often behaves like a conscientious student of the existing argument: it applies the
argument to more cases and supplies more qualifications, whether or not every detail
belongs in the main movement of the prose.

InterText therefore should not represent an evolving section as one Markdown string
that is repeatedly rewritten and enlarged. Each section instead has two editorial
layers:

- **Narrative spine:** the relatively concise, coherent route through the section.
- **Fund:** optional clarifications, examples, qualifications, counterarguments,
  evidence, and extensions that the guide may select according to a particular
  reader and moment.

The public reader need not see these layers as editorial apparatus. The guide should
perform them as one continuous voice. The distinction exists internally to preserve
rhythm without discarding useful accumulated material.

## Scope

The schema is generic. It applies to every section of *Plenitude*, *The Uncanny*,
*Blood on the Wall*, and later InterText works. Section 5 of *Plenitude* is merely the
first populated example because a collaborative synthetic reading produced a useful
set of additions with which to test the distinction.

All current works and their 16 sections have stable IDs in `editorial/content/`.
Only `plenitude/shocking-art` has a section package at present. An unpopulated section
is a known section with `"package": null`, not an error or an absent identity.

## Local source format

The repository is the readable editorial record during this experimental phase:

```text
editorial/
├── content/
│   ├── plenitude/work.json
│   ├── uncanny/work.json
│   ├── blood-on-the-wall/work.json
│   └── plenitude/sections/shocking-art/
│       ├── section.json
│       ├── spine.md
│       ├── fund/*.md
│       └── provenance/               # portable copies of source experiments
├── schema/
│   ├── work-manifest.schema.json
│   └── section-package.schema.json
├── lib/content.js
├── build-data.js
├── data/                       # generated, validated browser snapshots
├── index.html, app.js, style.css
└── test/
```

`work.json` records stable work and section IDs, display titles, order, and the
optional path to a section package. A section's `spine.md` remains ordinary readable
Markdown with stable markers:

```markdown
<!-- intertext:passage shocking-art-p01 -->

Passage prose...
```

`section.json` contains version metadata and the metadata for each fund entry. The
entry's actual prose lives in the referenced Markdown file. This keeps prose pleasant
to read and edit while still compiling into a strict portable object.

## Compiled section package

Run `npm run editorial-build`. `editorial/lib/content.js` then:

1. validates every work manifest;
2. reads and parses marked spine passages;
3. reads fund-entry Markdown;
4. constructs a complete section snapshot;
5. validates the snapshot against `section-package.schema.json` plus relational
   checks for unique IDs, valid anchors, and source consistency; and
6. writes static JSON under `editorial/data/` for the workspace.

A compiled section contains:

- work, edition, section, and version identity;
- parent version and creation time;
- source type and original path;
- an ordered array of stable spine passages;
- fund entries with stable IDs and passage anchors;
- a change summary.

The first schema deliberately keeps fund entries small. Each contains:

- `id` and `title`;
- one or more spine `anchors`;
- `kind`: clarification, example, qualification, counterargument, evidence, or
  extension;
- `status`: candidate, accepted, superseded, or rejected;
- Markdown prose;
- a natural-language `useWhen` selection cue;
- `sourceStatus`: not-required, needs-verification, or verified;
- zero or more descriptive HTTP(S) source links; and
- provenance identifying the kind of origin, session, turns, and local artifact.

Do not add more classification fields until reading tests show that the guide needs
them. In particular, reader level, confidence scores, topic taxonomies, and embedding
metadata are deferred.

Only **accepted** entries should later be offered to the public guide. Candidate,
superseded, and rejected entries remain editorial records.

## First populated package

The `plenitude/shocking-art` package preserves the entire authored Section 5 as ten
spine passages. Four concise candidate entries were manually extracted from the
collaborative synthetic session dated `2026-09-12T18-55-01-898Z`:

1. the shared evaluative field;
2. the distinction between Futurism and Dada;
3. the Armory Show's specific form of ridicule; and
4. the claim that what diminished was reach rather than passion.

The two historically specific entries are marked `needs-verification`; the original
session supplied no URLs. They must not be represented as verified merely because a
model stated them fluently.

Because `synthetic-reader/output/` is git-ignored, the exact Section 5 `session.json`,
human-readable transcript, original, evolved comparison text, and evolution metadata
are copied into the package's `provenance/2026-09-12-collaborative/` directory. This
tracked archive is the portable record; the original output folder remains untouched.

## Read-only editorial workspace

Run:

```bash
npm install
npm run editorial-preview
```

Then open `http://127.0.0.1:4173`. The dependency-free preview server serves only the
`editorial/` directory and sets `no-store`; it does not expose `.env.local` or the rest
of the repository.

The workspace currently supports:

- switching among all registered works;
- seeing every known section and whether it has been packaged;
- reading the spine as continuous prose with stable passage labels;
- seeing how many fund entries attach to each passage;
- clicking a passage to filter the fund to its related entries;
- inspecting entry type, status, use cue, sources, source warnings, and provenance;
- responsive desktop/mobile layout; and
- safe Markdown rendering through DOM construction rather than raw HTML injection.

It intentionally cannot edit, accept, publish, restore, or call a model. It is a
working data-model inspection tool, not yet a production editorial application.
The entire `editorial/` directory is excluded in `.vercelignore`; do not remove that
protection until the deployed editor has authentication and an intentional policy for
which manuscript, session, and provenance data may leave the local environment.

## Proposed database representation — not implemented

The current Upstash KV object `evolved:<textId>` maps section indices to single
Markdown strings. It remains untouched. When the local package and guide-selection
experiment are satisfactory, use versioned keys such as:

```text
work:<workId>
edition:<workId>:<editionId>
section-head:<workId>:<editionId>:<sectionId>
section-version:<workId>:<editionId>:<sectionId>:<versionId>
candidate:<workId>:<sectionId>:<candidateId>
```

Store each accepted section version as one immutable, self-contained JSON snapshot.
`section-head` should contain only the current version ID. Publishing must verify that
the proposed parent is still the head and update the pointer atomically, preventing
overlapping readers from silently overwriting one another. Restoration should create
a new version derived from an older snapshot rather than delete history.

At the present scale, duplicating unchanged fund entries across immutable section
snapshots is preferable to normalizing every entry into its own KV record: snapshots
are easier to inspect, restore, cache, and export. This can be reconsidered only if
the fund becomes large enough to make section snapshots impractical.

The live database is operational state, not the sole archive. An export command or
editor action should write any important live version back to a local package so it
remains easy to read, compare, and move between computers.

## Proposed editorial lifecycle — not implemented

The conversational guide and the editorial model have different roles:

1. The guide conducts a reading and selects from the accepted spine and fund.
2. Contributions are recorded by stable section and passage where possible.
3. At the end of a contributing session, a separate editorial model compares the
   conversation with the current spine and fund.
4. It may propose or perform: revise a spine passage, add a fund entry, revise or
   supersede an existing entry, attach a source, or make no change.
5. Structural and factual checks run before a new immutable version is published.

In the intended reader-shaped edition, the model normally makes routine editorial
decisions autonomously; Jay does not approve every entry. The human role is to set the
editorial policy, inspect history, pause evolution, edit or supersede material, and
restore versions. During development, manual inspection is appropriate because the
model's editorial judgment is what is being tested.

For a long reading, provisional contribution records may be stored at section
boundaries so an abandoned session is not lost. Consolidation should still happen
after the session ends or times out, reducing duplicate entries created from adjacent
turns.

## Required next experiment

The next implementation milestone is not database migration. It is a candidate
reading path that lets `api/chat.js` and the synthetic-reader harness use a selected
local section package without publishing it. The guide should receive:

- the relevant spine passage and neighboring context;
- only accepted fund entries, or explicitly selected candidate entries in a marked
  experimental mode;
- compact selection cues; and
- a record of what has already been presented.

Run curious, collaborative, and skeptical synthetic readers against the same Section
5 package, compare them with an original-spine-only condition, and evaluate selection,
comprehension, momentum, repetition, and overload. Do not infer success merely because
the guide can quote every available entry.

Only after this experiment should the project implement candidate extraction,
database versions, automatic publication, authentication, or editing controls.

## Commands and verification

```bash
npm run editorial-build       # compile and validate editorial/data/
npm run editorial-preview     # build, then serve at 127.0.0.1:4173
npm test                      # editorial and synthetic-reader suites
```

As of this milestone, the full suite contains 107 passing tests. The workspace was
also checked in the in-app browser: Section 5 rendered correctly, passage filtering
reduced the fund to the appropriate entries, switching to an unpopulated work produced
the intended empty state, and the browser console contained no warnings or errors.
