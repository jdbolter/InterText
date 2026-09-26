# remediation — CLAUDE.md

Follows the shared InterText engine documented in the root `README.md` and
`uncanny/CLAUDE.md`.

## Source and sections

The reference chapter is `source_texts/remediation.md`. Its prose is divided at
paragraph boundaries into seven reader sections under `source_texts/sections/`:

1. The Two Logics of Remediation
2. Perspective and Automaticity
3. Photorealism and the Real
4. The Windowed Interface
5. A Genealogy of Hypermediacy
6. Repurposing and Remediation
7. Rivalry and Refashioning

The source folder was normalized to the engine's required `source_texts` spelling.
Sidenotes are kept with the sections that contain their references. The chapter's
authored prose is preserved; the section titles and boxed introductions are reader
apparatus.

## Reader and editorial package

`config.js` defines the seven sections, introductions, guide behavior, and synthesis
rules. `public/` uses the same consent, navigation, continuation, and contribution
flow as Plenitude and Uncanny, with `textId: 'remediation'`. No images are currently
configured; files can be added under `images/` with matching config and client entries.

All seven sections also have faithful spine packages under
`editorial/content/remediation/`, with empty initial funds. Run
`npm run editorial-build` after changing those packages.
