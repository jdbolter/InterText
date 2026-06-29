# plenitude — CLAUDE.md

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
- The `behavioralInstructions` and `synthesisInstructions` in config.js should be adapted from uncanny's versions but reframed for a cultural argument (not a literary essay on the uncanny)
