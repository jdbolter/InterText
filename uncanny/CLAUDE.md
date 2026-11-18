# uncanny

*The Uncanny Double*: a conversation about an essay on the uncanny in film, literature and digital media (`textId: 'uncanny'`). It runs at `uncanny/public/index.html`; it is not on the landing page. The engine, entry choices, Return continuation and section packages are the shared ones described in the root `README.md`, `CURRENT-DESIGN.md` and `EDITORIAL-ARCHITECTURE.md`.

## Files

```
uncanny/
├── config.js        sections, names, introductions, images, behavioralInstructions, synthesisInstructions
├── source_texts/
│   ├── full-uncanny.md   the whole essay (reference; not loaded by the API)
│   └── sections/         section-1.md … section-5.md
├── images/          section images, served at /uncanny/images/
└── public/          index.html, style.css, app.js (sends textId 'uncanny')
```

## The five sections

| # | Title | Images |
|---|---|---|
| I | The Uncanny Valley and the Uncanny Double | `uncanny-valley-graph.png` |
| II | Film and the Uncanny | `train.jpeg` |
| III | The Double in Film | `freud.jpg`, `gemini-pod.png` |
| IV | Uncanny Avatars in Mirror Worlds | none |
| V | The Uncanny is a Feature, not a Bug | none |

Section I includes the abstract; the references are left out of the section files. The model sees only the active section, so it cannot pre-empt later parts of the argument.

## The guide

`behavioralInstructions` in `config.js` set how the guide answers, and `synthesisInstructions` the dry-run whole-section rewrite. The guide is meant to inhabit the argument, not narrate it: it is the intelligence behind the essay, not a guide to a document.

Images are defined in `config.js` under `sectionImagePrompts` and in `SECTION_IMAGES` in `public/app.js`; to add one, put the file in `images/` and add both entries.

## Layout

A two-column page: reading content on the left (centred, at most 65ch wide), and on the right a sticky 25rem column with the contents (hidden on narrow screens) above the input panel.

## Packages

All five sections have faithful spine packages under `editorial/content/uncanny/`, with empty initial funds. Run `npm run editorial-build` after changing them.
