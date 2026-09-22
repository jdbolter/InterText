# Editorial workspace

This directory contains InterText's first spine-and-fund editorial prototype. For
the present design, start with [`CURRENT-DESIGN.md`](../CURRENT-DESIGN.md). For the
data model, database proposal, editorial lifecycle, and exact implementation
boundary, read [`EDITORIAL-ARCHITECTURE.md`](../EDITORIAL-ARCHITECTURE.md).

## Start on a new computer

Requirements: Node.js 20 or later and the repository checkout. Without KV variables,
the workspace displays the bundled seed for inspection. With `KV_REST_API_URL` and
`KV_REST_API_TOKEN` in `.env.local`, it displays the shared live head and can publish
author revisions. No Vercel login is required.

```bash
npm install
npm test
npm run editorial-preview
```

Open `http://127.0.0.1:4173`. Stop the server with Control-C.

### Review a synthetic reading without publishing it

After completing a synthetic-reader session, run the two-pass spine-and-fund editorial
process separately:

```bash
npm run editorial-propose -- --session synthetic-reader/output/<run-folder> --section 1
```

This sends the current section package and the recorded contributing exchange to the
configured Anthropic API. It may read the current KV head when KV is configured, but
it never initializes or writes KV. The proposal, independent review, and reviewed
draft are saved under the gitignored `editorial/proposals/` directory. Restart or
refresh `npm run editorial-preview`; a matching proposal appears above the spine.

Choosing **Review proposed changes** loads the reviewed subset as an unpublished
author draft. The author can revise spine prose, alter or reject fund entries, and
inspect the two model passes. **Discard proposal** writes nothing. **Publish author
revision** is the only action that creates a KV child version, and it refuses to save
if the section head has changed since proposal generation.

`editorial-preview` always runs the build first. To validate and regenerate the static
data without starting a server:

```bash
npm run editorial-build
```

## Source versus generated data

- Edit files under `editorial/content/`.
- Treat `editorial/data/` as generated, validated browser data.
- Copy any synthetic session or evolution artifact needed for long-term provenance
  into the relevant section's tracked `provenance/` directory; the original
  `synthetic-reader/output/` tree is git-ignored and will not move to another computer.
- Run `npm run editorial-build` after changing a work manifest, spine, section
  manifest, or fund entry.
- Commit both the readable source and regenerated data so the static workspace opens
  from the same snapshot on another checkout.

## Add a work

Create `editorial/content/<work-id>/work.json` conforming to
`schema/work-manifest.schema.json`. IDs are lower-case hyphenated stable identifiers.
Work `order` controls the workspace selector. Section `order` values and section IDs
must be unique. Set `package` to `null` until
that section has a package.

The tests compare the current three manifests against each work's `config.js`, so a
renamed, added, or reordered application section must be reflected here.

## Package a section

1. Create `editorial/content/<work-id>/sections/<section-id>/`.
2. Add `spine.md`, putting a stable marker immediately before each argumentative
   passage:

   ```markdown
   <!-- intertext:passage <section-id>-p01 -->
   ```

3. Add `section.json`, following the existing `plenitude/shocking-art` example.
4. If the section has fund material, put its prose in short Markdown files under
   `fund/` and reference each one with `markdownFile` in `section.json`. An empty
   `fundEntries` array is a valid faithful starting package.
5. Change the section's `package` in `work.json` from `null` to the relative path of
   `section.json`.
6. Run `npm run editorial-build && npm test`.

The build rejects duplicate passage or fund IDs, missing Markdown, invalid entry
shapes, fund anchors that do not name real spine passages, non-HTTP(S) source links,
and entries marked verified without any source.

## Status meanings

- `candidate`: proposed material still being evaluated. Not for a public guide.
- `accepted`: available to a guide's selection process.
- `superseded`: retained for history but replaced by another entry.
- `rejected`: retained as an editorial decision record but not available to a guide.

`sourceStatus` is separate:

- `not-required`: principally interpretive material that does not require an external
  source merely to exist in the fund;
- `needs-verification`: factual or quoted material lacking adequate attached support;
- `verified`: supported by at least one descriptive HTTP(S) source link.

These statuses are editorial metadata, not claims that the current code has performed
fact checking.

## Author editing and current boundary

Click **Edit section** to edit spine passage prose and every editorial field on each
fund entry. The editor can add entries; change kind, status, anchors, prose, selection
cue, sources, and source status; and assign an optional thread ID and order. Existing
passage IDs, fund-entry IDs, and provenance are deliberately protected. Existing
entries cannot be deleted; reject or supersede them so the decision remains in the
record.

**Publish author revision** validates the complete package, verifies that the loaded
base is still the live head, writes a new immutable `author-revised` child plus its
update record, and advances the head atomically. It never rewrites the authored source
files under `editorial/content/`. Publishing therefore requires the KV variables;
seed-only mode remains inspectable but cannot save. The local editor does not call a
model.

The workspace cannot yet compare or restore versions, browse full update history, or
export with a button. It is local and unauthenticated, and `editorial/` remains excluded
from Vercel deployment. The public contribution path separately performs model-reviewed
writes for packaged sections through `/api/evolve`.

The local guide and synthetic-reader harness can now read a package when explicitly
invoked with `--edition editorial-spine` or `--edition editorial-fund`. That path is
implemented in `api/lib/editorial-reading.js`, `api/chat.js`, and
`synthetic-reader/lib/session.js`. Guide prose and fund-use IDs return through a
required private structured tool; experiments stop at the packaged-section boundary.
It is an experiment-only path: the normal public reader never requests those edition
names, no candidate is published or accepted by an experiment, guide-side web search
is disabled for both conditions, and the experiment path does not use KV.
See the root architecture document and `synthetic-reader/README.md` for paired-run
commands and interpretation guidance.

For an ordinary contributing reader on a packaged section, finishing or leaving the
section invokes two editorial-model passes. Approved spine changes and fund operations
are written as a new immutable snapshot, and a fresh reading loads that new head.
Only accepted fund entries reach the ordinary guide; candidates remain inspectable.
A synthetic reading still records possible material without persisting it. The
2026-09-19 skeptical fund run is archived under
`content/plenitude/sections/shocking-art/provenance/2026-09-19-skeptical-fund/` with
review leads; its 2026-09-20 spine-only comparison is archived under
`content/plenitude/sections/shocking-art/provenance/2026-09-20-skeptical-spine/`.
Neither run triggered candidate extraction or second-pass validation.

All seven *Plenitude* sections are now packaged. Sections 1–4 and 6–7 preserve their
authored prose exactly and begin with empty funds; Section 5 retains the accumulated
fund and live version history. The other two works remain registered but unpackaged.

## Shared KV commands

```bash
npm run editorial-kv -- status --text plenitude --section 5
npm run editorial-kv -- init --text plenitude --section 5
npm run editorial-kv -- export --text plenitude --section 5
```

`init` is idempotent: it creates the bundled baseline only when the section has no
head. `export` writes the current immutable snapshot beneath `editorial/exports/`
unless `--out` supplies another path. That folder is operational output and should be
reviewed before committing. The first published Section 5 child, with ten passages,
two accepted entries, and four candidates, has a portable copy tracked under
`content/plenitude/sections/shocking-art/provenance/2026-09-20-collaborative-publication/`.
Use the `status` command for the current live head; author revisions may have advanced
it since that milestone.

Historical reception leads for a possible Section 5 detour are kept separately in
`research/art-reception-cases.json`, with a `research/README.md`. They serve the broader
question of whether early avant-garde artists and audiences treated art's forms and
boundaries as more culturally consequential, not a tally of spectacular incidents.
They are not loaded into the section package or shown to the guide merely by existing
in the repository.

`.vercelignore` excludes this entire directory from deployment. Do not remove that
line merely to make the editor remotely reachable: authentication and a policy for
private manuscript/provenance data must come first.
