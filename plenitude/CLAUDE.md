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

### Still To Do
- Continue iterative editorial work on the prose, argument, section structure, and
  reader relationship using repeated synthetic-reader runs.
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
