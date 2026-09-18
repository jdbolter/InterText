# plenitude — CLAUDE.md

Follows the standard engine pattern — see the root `README.md` and `uncanny/CLAUDE.md` for the shared architecture (KV storage, entry consent flow, blank-Return continuation, evolve step, adding a new text). This file only covers what's specific to Plenitude.

## Status: Application implemented; manuscript under iterative editorial development

The seven-section version is a working structure, not a settled final form. The
current priority is to use repeated runs of `synthetic-reader/` to improve the quality
of *Plenitude* as a text and as a reader encounter. Transcripts and private reflections
should be compared across profiles and repeated runs to identify unclear or repetitive
passages, weak transitions, unanswered objections, losses of interest, and section
boundaries that do not serve the argument.

Findings may lead to manual changes in `source_texts/sections/*.md`, including cuts,
rewriting, reordering, or joining and splitting sections. They may also justify changes
to section introductions or the guide's behavior when the problem lies in how the text
meets the reader rather than in the prose alone. After a change, rerun comparable
synthetic sessions to see whether the hypothesis holds. A dry-run automatic evolution
is an optional comparison, not the default definition of an improved text.

This iterative use may later inform human user testing, but it does not replace it.
See the root `README.md`, `synthetic-reader/README.md` ("Current use: an editorial
loop"), and `INTERTEXT-DESIGN-NOTES.md` §10.

### Editorial architecture — local package and reading experiment implemented

The synthetic-reader work raises the possibility of an author-directed revision of
the whole book, potentially offered as a coherent revised edition to interested
readers. No decision has been made to undertake that complete rewrite. It is now a
settled direction, however, that reader-shaped material should not be represented only
as one repeatedly enlarged Markdown section. Each section should be capable of holding
a concise narrative spine plus a fund of optional material from which the guide can
select for a particular reader.

The first local, read-only editorial workspace is implemented under `editorial/`.
It registers every section of every work and packages Plenitude Section 5 as the first
real example: the complete authored text is divided into ten stable spine passages,
and four useful additions from a collaborative synthetic session are represented as
candidate fund entries rather than being forced into the continuous essay. Two
historical entries are explicitly marked as needing verification because the session
did not supply source links.

The local package is now connected to the guide and synthetic-reader session loop
through two explicit experimental editions: `editorial-spine` and `editorial-fund`.
The fund condition offers candidates as optional material, suppresses entries already
reported as presented, and records per-turn use through a required structured guide
tool. These modes are not
available in the public reader interface, do not call synthesis, and never read or
write the live database. See root `EDITORIAL-ARCHITECTURE.md` for the authoritative
handoff, comparison commands, database-key proposal, and remaining limitations.

An author-revised edition would not necessarily replace the reader-shaped project.
A distinct evolving version, formed through encounters with actual readers and the
guide's editorial mediation, remains another desired possibility. How the original,
an author-revised edition, and a reader-shaped edition should coexist—and which of
them a public interface should expose—remains open.

### Completed
- Created folder structure: `plenitude/source_texts/sections/`, `plenitude/public/`, `plenitude/images/`
- Source text placed at `plenitude/source_texts/plenitude.md` (10,401 words, pandoc-converted from Divide.docx)
- Split the current working version into 7 sections and cleaned up markdown:
  - `section-1.md` — The Great Divide (594 words)
  - `section-2.md` — The Philadelphia (Symphony) Story (1,347 words)
  - `section-3.md` — Class in America (520 words)
  - `section-4.md` — The Case of Music (1,363 words)
  - `section-5.md` — Shocking Art (1,794 words)
  - `section-6.md` — Art as a Special Interest (3,456 words)
  - `section-7.md` — Communities and Creativity (1,327 words)
- Created `plenitude/config.js` — 7 section intros, image slots, behavioral/synthesis instructions
- Created `plenitude/public/index.html`, `style.css`, `app.js` (textId: `'plenitude'`)
- Added `'plenitude'` to `ALLOWED_TEXT_IDS` in `api/chat.js` and `api/evolve.js`
- Added the generic spine-and-fund editorial schema and read-only workspace, with
  Section 5 as the first packaged example (`editorial/`)
- Added controlled local `editorial-spine` and `editorial-fund` guide/harness modes,
  including a per-section record of which optional entries were actually presented
- Completed the first matched collaborative pair. Two of four entries were used; the
  fund exchange was productive but longer and more repetitive. Exact transcripts are
  tracked under the Section 5 package's `provenance/2026-09-18-collaborative-comparison/`.

### Still To Do
- Continue iterative editorial work on the prose, argument, section structure, and
  reader relationship using repeated synthetic-reader runs.
- Run paired Section 5 `editorial-spine` and `editorial-fund` sessions for curious and
  skeptical profiles, with collaborative repetitions where useful; inspect selection, rhythm, comprehension,
  repetition, and overload before extending the data model or migrating storage.
- Images: drop 4 files into `plenitude/images/` with these exact names:
  - `night-at-opera.jpg` — A Night at the Opera (1935), section 2
  - `whats-opera-doc.jpg` — What's Opera, Doc? (1957), section 2
  - `olmstead.jpg` — Marla Olmstead painting, section 5
  - `kandinsky.jpg` — Kandinsky Composition IV (1911), section 5

### Notes
- Section 5 contains academic descriptions of explicit avant-garde performance art. This caused repeated content filter blocks during this session. The fix: remove the most explicit references from section-5.md (the Schneemann and Burden descriptions), then resume in a fresh session.
- Images in section 2 were: *A Night at the Opera* (1935) and *What's Opera, Doc?* (1957)
- Images in section 5 were: Olmstead painting and Kandinsky *Composition IV* (1911)
- `behavioralInstructions` and `synthesisInstructions` in `config.js` were adapted from uncanny's versions, reframed for a cultural argument rather than a literary essay on the uncanny. `behavioralInstructions` later gained an explicit instruction against meta-commentary on the essay's own structure/rhetoric (e.g. "this marks the point where the argument turns," "not rhetorical flourish") after a live reader session produced exactly that failure mode — see `INTERTEXT-DESIGN-NOTES.md` in the project root.
- `public/index.html`, `style.css`, `app.js` are kept in lockstep with `uncanny/public/` and `blood-on-the-wall/public/` — see uncanny's CLAUDE.md, "Adding a New Text," for what's shared vs. per-text.
