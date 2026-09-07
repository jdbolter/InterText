# plenitude — CLAUDE.md

Follows the standard engine pattern — see the root `README.md` and `uncanny/CLAUDE.md` for the shared architecture (KV storage, entry consent flow, blank-Return continuation, evolve step, adding a new text). This file only covers what's specific to Plenitude.

## Status: Complete (images pending)

### Completed
- Created folder structure: `plenitude/source_texts/sections/`, `plenitude/public/`, `plenitude/images/`
- Source text placed at `plenitude/source_texts/plenitude.md` (10,401 words, pandoc-converted from Divide.docx)
- Split into 7 sections and cleaned up markdown:
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
