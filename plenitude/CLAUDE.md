# plenitude

*Plenitude*: a companion essay on the collapse of cultural hierarchy and the rise of media plenitude (`textId: 'plenitude'`), in seven sections. It runs at `plenitude/public/index.html`; it is not on the landing page, where *The Digital Plenitude* (`digital-plenitude/`) has replaced it. The shared engine is described in the root `README.md`, `CURRENT-DESIGN.md` and `EDITORIAL-ARCHITECTURE.md`.

## Files

```
plenitude/
├── config.js         sections, names, introductions, images, behavioralInstructions, synthesisInstructions
├── source_texts/     plenitude.md (the whole essay) and sections/ (section-1.md … section-7.md)
├── images/           section images
└── public/           index.html, style.css, app.js (sends textId 'plenitude')
```

## Packages

All seven sections have faithful spine packages under `editorial/content/plenitude/`. Section 5, *Shocking Art*, has a developed fund and a version history; the others have empty funds. Provenance copies of the synthetic sessions behind Section 5's fund are in `editorial/content/plenitude/sections/shocking-art/provenance/`. Run `npm run editorial-build` after changing a package.
