# remediation

A chapter on transparent immediacy, hypermediacy and the ways media refashion one another (`textId: 'remediation'`), in seven sections. It runs at `remediation/public/index.html`; it is not on the landing page. The shared engine is described in the root `README.md`, `CURRENT-DESIGN.md` and `EDITORIAL-ARCHITECTURE.md`.

## Source and sections

The chapter is `source_texts/remediation.md`, divided at paragraph boundaries into seven sections under `source_texts/sections/`:

1. The Two Logics of Remediation
2. Perspective and Automaticity
3. Photorealism and the Real
4. The Windowed Interface
5. A Genealogy of Hypermediacy
6. Repurposing and Remediation
7. Rivalry and Refashioning

Sidenotes stay with the sections that contain their references. The authored prose is preserved; the section titles and boxed introductions are reader apparatus.

## Configuration and packages

`config.js` defines the sections, introductions, guide behavior and synthesis rules. `public/` uses the shared page design with `textId: 'remediation'`. No images are configured; to add one, put the file in `images/` and add matching entries in `config.js` and the page. All seven sections have faithful spine packages under `editorial/content/remediation/`, with empty funds; run `npm run editorial-build` after changing them.
