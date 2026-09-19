# InterText editorial architecture

**Status, 2026-09-19:** the universal local content model, validated build, read-only
editorial workspace, and controlled guide/synthetic-reader package path are
implemented. The package path is local and explicitly experimental; the public reader
interface and live KV database do **not** consume this model. One matched collaborative
spine/fund pair and one skeptical fund-only run have been completed; the skeptical
spine-only run and curious pairs remain. A separate working art-reception research
dataset has also been added. This document records both the agreed direction and the
implementation boundary so the work can be resumed by another model or on another
computer without relying on conversation history.

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

The local `editorial-fund` experiment is the deliberate exception: requesting that
edition explicitly authorizes the four Section 5 candidates for controlled testing.
It does not change their status or publish them.

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

The shared-evaluative-field entry originally had anchors to passages 1 and 2 even
though its prose presupposes Walter Serner, who first appears in passage 2. That
premature anchor was removed before the reading comparison. This exposed a future
validation requirement: a model validator must assess every proposed anchor
independently for contextual and chronological eligibility, not merely approve or
reject an entry as a whole.

Because `synthetic-reader/output/` is git-ignored, the exact Section 5 `session.json`,
human-readable transcript, original, evolved comparison text, and evolution metadata
are copied into the package's `provenance/2026-09-12-collaborative/` directory. This
tracked archive is the portable record; the original output folder remains untouched.

## Working reception research — separate from the fund

`editorial/research/art-reception-cases.json` is a portable working dataset of
documented responses to early avant-garde works and selected later comparators. Its
governing question is not which individual incident was most dramatic, but whether
the historical avant-garde and its opponents took art's forms, boundaries, and cultural
authority more seriously as broadly consequential matters. Section 5 passage 3 already
articulates this idea; the research cases are possible evidence for testing and
complicating it, not a replacement for that argument. “More seriously” need not mean
more approvingly, and contemporary art disputes may carry profound stakes of their own.
The comparison is also about the *kind and reach* of those stakes, not the absence of
later reactions.

The dataset separates observed reactions, issues at stake, possible interpretations,
cautions, and source links. These cases are **not** fund entries, a representative
historical sample, or content currently available to the guide. The accompanying
`research/README.md` gives the fuller research question, limitations, and next evidence
to seek beyond memorable scandals. An author or editorial pass can later select a case
for a spine passage, an optional fund entry, or an authored inquiry path, but only after
checking that case's sources and role in the text.

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

## Controlled local reading path

`api/chat.js` now recognizes two explicit experimental editions:

- `editorial-spine`: loads the packaged narrative spine and supplies no fund entries;
- `editorial-fund`: loads the same spine and offers candidate or accepted fund entries
  as optional material.

Both conditions disable guide-side web search and instruct the guide not to introduce
substantive examples or historical claims from outside the package. This keeps the
fund availability—not uncontrolled outside knowledge—as the intended difference.
The guide is told that fund entries are possibilities rather than a checklist, to use
them only when they help the particular reader without damaging movement, and never
to expose the editorial apparatus.

For each response, the guide must call a private structured delivery tool containing
the complete reader-visible prose, every offered fund-entry ID materially used, and a
section-completion boolean. The API rejects a missing or malformed tool call, validates
IDs against the entries actually offered, and returns only the prose plus structured
experiment metadata. The synthetic harness carries a per-section ledger into later
turns so an entry already presented is not offered as new material again.
`session.json` and `transcript.md` distinguish entries offered to the guide from entries
the guide reported actually using.

An earlier free-text-marker design was rejected during the first live attempt: most
markers were missing, and one response visibly used the Armory Show detail without
reporting that entry. Required structured delivery guarantees a report on every guide
turn and constrains it to offered IDs. It is still a model report rather than an
independent semantic audit, so the visible prose remains the final evidence of use.

The loader reads only compiled, validated files under `editorial/data/`. An editorial
request for an unpackaged section fails clearly rather than falling back to the
original or evolving whole-section text. The CLI currently fails early unless the
target is the sole packaged example, Plenitude Section 5.

An editorial run is bounded to its packaged target section. Continuation at the end
does not auto-advance into an unpackaged section, and navigation away is rejected
client-side with an explanatory transcript note.

This path does not call `/api/evolve`, change candidate status, write local content,
read `evolved_sections.json`, or contact Upstash. The public browser does not request
either experimental edition. Because `editorial/` remains in `.vercelignore`, this
path is intended for `vercel dev` from a complete local checkout, not production.

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
3. At the end of a contributing session, a first editorial-model pass compares the
   conversation with the current spine and fund. It may propose: revise a spine
   passage, add a fund entry, revise or supersede an existing entry, attach a source,
   or make no change.
4. A separate second model pass validates those proposals for fidelity, relevance,
   duplication, prose quality, rhythm, proportion, factual/source needs, and every
   proposed anchor's contextual and chronological eligibility.
5. Validated fund operations remain candidates until editorial policy promotes them.
   A spine revision creates a proposed immutable version; it never silently replaces
   the current spine.
6. Structural checks run before any new immutable version is published.

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

The candidate reading path is implemented. The first preserved matched pair used the
collaborative profile and a 15-turn cap. The spine-only reader finished after 10 turns;
the fund reader reached the cap after 15. The fund guide selected only
`shared-evaluative-field` and `armory-show-ridicule`, leaving the other two candidates
unused. The optional material supported useful conceptual refinement, but the longer
session also repeatedly narrowed the same historical contrast. This is a suggestive
example of both the fund's value and its possible cost to momentum, not a verdict:
the reader paths were stochastic and did not pose identical questions.

The exact final pair is tracked under
`editorial/content/plenitude/sections/shocking-art/provenance/2026-09-18-collaborative-comparison/`.

A later skeptical `editorial-fund` session is tracked under
`editorial/content/plenitude/sections/shocking-art/provenance/2026-09-19-skeptical-fund/`.
It finished after 15 turns. The guide used the existing `shared-evaluative-field`
candidate and reported leaving the other three unused. The skeptical exchange
identified possible spine-level and source issues, notably the status of the broad
historical trend claim, audience comparability, the form/content distinction, and
the NEA and Safer examples. These are review leads, not automatically created fund
entries or verified facts. The package was unchanged. A skeptical spine-only run is
still needed for a within-profile comparison.

The next work is to complete the comparison with curious and skeptical profiles, and to
repeat the collaborative condition if this pattern becomes important. Start the local
API server in one terminal:

```bash
vercel dev
```

In another terminal, run a matched pair for one profile at 15 turns:

```bash
npm run synthetic-reader -- --text plenitude --section 5 --profile collaborative --turns 15 --edition editorial-spine
npm run synthetic-reader -- --text plenitude --section 5 --profile collaborative --turns 15 --edition editorial-fund
```

Use `curious` and `skeptical` next. These are stochastic readers, so a
single pair is evidence rather than a verdict; repeat any condition whose result seems
important or anomalous. Compare transcripts for:

- which fund entries were offered and actually used;
- whether an entry appeared only after its prerequisites were established;
- comprehension and the quality of objections or questions;
- momentum, repetition, and overload;
- whether the fund helped this reader rather than merely giving the guide more to say;
- invalid structured delivery calls or leakage of private editorial labels; and
- whether leaving all fund entries unused was sometimes the best decision.

The present implementation supplies the complete marked spine as guide context rather
than performing retrieval of only one passage and its neighbors. The guide uses the
conversation history, anchors, and selection cues to pace the material. The comparison
should tell us whether explicit passage retrieval or more prerequisite metadata is
actually needed before adding it.

Only after this experiment should the project revise selection instructions or entry
fields, implement candidate extraction and second-pass validation, add database
versions, or build publication and editing controls.

## Commands and verification

```bash
npm run editorial-build       # compile and validate editorial/data/
npm run editorial-preview     # build, then serve at 127.0.0.1:4173
vercel dev                    # local API required by synthetic-reader experiments
npm test                      # editorial and synthetic-reader suites
```

As of this milestone, the full suite contains 122 passing tests. The workspace was
also checked in the in-app browser: Section 5 rendered correctly, passage filtering
reduced the fund to the appropriate entries, switching to an unpopulated work produced
the intended empty state, and the browser console contained no warnings or errors.
The new package loader, condition isolation, anchor correction, required delivery
tool, presentation ledger, packaged-section boundary, and transcript recording have
offline coverage. The final collaborative pair also verified the path live against
the configured OpenAI reader and Claude guide.
