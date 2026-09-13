# Editorial workspace

This directory contains InterText's first spine-and-fund editorial prototype. For the
design rationale, database proposal, editorial lifecycle, and next milestone, read
the root [`EDITORIAL-ARCHITECTURE.md`](../EDITORIAL-ARCHITECTURE.md) first.

## Start on a new computer

Requirements: Node.js 20 or later and the repository checkout. No API key, Vercel
login, or database connection is needed for the read-only workspace.

```bash
npm install
npm test
npm run editorial-preview
```

Open `http://127.0.0.1:4173`. Stop the server with Control-C.

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
4. Put fund prose in short Markdown files under `fund/` and reference each one with
   `markdownFile` in `section.json`.
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

## Current boundary

This is a read-only, local-first prototype. It does not alter authored source texts,
`evolved_sections.json`, Upstash KV, `/api/chat`, `/api/evolve`, or the synthetic-reader
state machine. It does not yet let the guide read a package. Those are explicit next
steps, not missing setup.

`.vercelignore` excludes this entire directory from deployment. Do not remove that
line merely to make the editor remotely reachable: authentication and a policy for
private manuscript/provenance data must come first.
